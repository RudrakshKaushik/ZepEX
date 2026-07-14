from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils import timezone

from audit_logs.utils import create_audit_log

from .models import (
    CompanyPolicy,
    PolicyCategoryRule,
    PolicyVersion,
)


# ============================================================
# Internal helpers
# ============================================================

def _validate_action_by_company(*, policy, action_by):
    """
    Ensure the user performing the action belongs to the same company.
    """

    if action_by is None:
        raise ValidationError(
            "action_by is required."
        )

    if action_by.company_id != policy.company_id:
        raise ValidationError(
            "The user performing this action belongs to another company."
        )


def _get_next_version_number(policy):
    """
    Return the next sequential version number for a policy.

    select_for_update() should be used on the CompanyPolicy before
    calling this function from a transaction.
    """

    highest_version = (
        PolicyVersion.objects.filter(
            policy=policy
        ).aggregate(
            highest=Max("version_number")
        )["highest"]
        or 0
    )

    return highest_version + 1


def _get_active_version(policy):
    """
    Return the currently active version, if any.
    """

    return (
        PolicyVersion.objects.filter(
            policy=policy,
            is_active=True,
            status=PolicyVersion.STATUS_ACTIVE,
        )
        .prefetch_related(
            "rules",
            "rules__company_role",
        )
        .first()
    )


def _copy_version_rules(
    *,
    source_version,
    target_version,
):
    """
    Copy every rule from one policy version into another.

    New rule IDs are generated automatically.
    """

    source_rules = list(
        PolicyCategoryRule.objects.filter(
            policy_version=source_version
        ).select_related(
            "company_role"
        )
    )

    copied_rules = []

    for source_rule in source_rules:
        copied_rules.append(
            PolicyCategoryRule(
                policy=target_version.policy,
                policy_version=target_version,
                company_role=source_rule.company_role,
                category_name=source_rule.category_name,
                max_amount=source_rule.max_amount,
                currency=source_rule.currency,
                is_unlimited=source_rule.is_unlimited,
                category_description=(
                    source_rule.category_description
                ),
                policy_reason=source_rule.policy_reason,
                source_text=source_rule.source_text,
                ai_confidence=source_rule.ai_confidence,
                is_ai_generated=source_rule.is_ai_generated,
                is_active=source_rule.is_active,
            )
        )

    if copied_rules:
        PolicyCategoryRule.objects.bulk_create(
            copied_rules
        )

    return len(copied_rules)


def _serialize_version_summary(version):
    """
    Small reusable representation for service responses.
    """

    if version is None:
        return None

    return {
        "id": str(version.id),
        "version_number": version.version_number,
        "title": version.title,
        "description": version.description,
        "status": version.status,
        "is_active": version.is_active,
        "activated_at": (
            version.activated_at.isoformat()
            if version.activated_at
            else None
        ),
        "created_at": (
            version.created_at.isoformat()
            if version.created_at
            else None
        ),
        "total_rules": version.rules.count(),
    }


# ============================================================
# Create a draft policy version
# ============================================================

@transaction.atomic
def create_policy_version(
    *,
    policy,
    action_by,
    title=None,
    description=None,
    imported_from_document=None,
    copy_active_rules=True,
):
    """
    Create a new DRAFT policy version.

    When copy_active_rules=True, the current active version's rules
    are copied into the new draft.

    This function does not activate the new version.
    """

    if not isinstance(policy, CompanyPolicy):
        return {
            "success": False,
            "error": "A valid CompanyPolicy instance is required.",
        }

    try:
        _validate_action_by_company(
            policy=policy,
            action_by=action_by,
        )
    except ValidationError as exc:
        return {
            "success": False,
            "error": str(exc),
        }

    if (
        imported_from_document
        and imported_from_document.company_id
        != policy.company_id
    ):
        return {
            "success": False,
            "error": (
                "The imported policy document belongs "
                "to another company."
            ),
        }

    # Lock policy row to prevent two simultaneous requests
    # from generating the same version number.
    locked_policy = (
        CompanyPolicy.objects.select_for_update()
        .get(id=policy.id)
    )

    version_number = _get_next_version_number(
        locked_policy
    )

    current_active_version = _get_active_version(
        locked_policy
    )

    version_title = (
        str(title).strip()
        if title
        else f"Policy Version {version_number}"
    )

    try:
        new_version = PolicyVersion.objects.create(
            policy=locked_policy,
            version_number=version_number,
            title=version_title,
            description=description,
            imported_from_document=imported_from_document,
            status=PolicyVersion.STATUS_DRAFT,
            is_active=False,
            created_by=action_by,
        )

    except (ValidationError, IntegrityError) as exc:
        return {
            "success": False,
            "error": str(exc),
        }

    copied_rules_count = 0

    if copy_active_rules and current_active_version:
        copied_rules_count = _copy_version_rules(
            source_version=current_active_version,
            target_version=new_version,
        )

    create_audit_log(
        company=locked_policy.company,
        action="POLICY_VERSION_CREATED",
        action_by=action_by,
        message=(
            f"Policy version {new_version.version_number} "
            f"was created as draft."
        ),
        metadata={
            "policy_id": str(locked_policy.id),
            "version_id": str(new_version.id),
            "version_number": new_version.version_number,
            "title": new_version.title,
            "copied_from_version": (
                current_active_version.version_number
                if current_active_version
                and copy_active_rules
                else None
            ),
            "copied_rules": copied_rules_count,
            "import_document_id": (
                str(imported_from_document.id)
                if imported_from_document
                else None
            ),
        },
    )

    return {
        "success": True,
        "message": "Draft policy version created successfully.",
        "version": _serialize_version_summary(
            new_version
        ),
        "copied_rules": copied_rules_count,
        "copied_from": (
            _serialize_version_summary(
                current_active_version
            )
            if copy_active_rules
            else None
        ),
    }


# ============================================================
# Activate a policy version
# ============================================================

@transaction.atomic
def activate_policy_version(
    *,
    version,
    action_by,
):
    """
    Activate a draft or archived version.

    The currently active version is archived automatically.
    Only one version remains active for the policy.
    """

    if not isinstance(version, PolicyVersion):
        return {
            "success": False,
            "error": "A valid PolicyVersion instance is required.",
        }

    try:
        _validate_action_by_company(
            policy=version.policy,
            action_by=action_by,
        )
    except ValidationError as exc:
        return {
            "success": False,
            "error": str(exc),
        }

    locked_version = (
        PolicyVersion.objects.select_for_update()
        .select_related(
            "policy",
            "policy__company",
        )
        .get(id=version.id)
    )

    if (
        locked_version.is_active
        and locked_version.status
        == PolicyVersion.STATUS_ACTIVE
    ):
        return {
            "success": True,
            "message": "Policy version is already active.",
            "version": _serialize_version_summary(
                locked_version
            ),
            "previous_active_version": None,
        }

    if not locked_version.rules.exists():
        return {
            "success": False,
            "error": (
                "A policy version cannot be activated "
                "without at least one policy rule."
            ),
        }

    previous_active_version = (
        PolicyVersion.objects.select_for_update()
        .filter(
            policy=locked_version.policy,
            is_active=True,
        )
        .exclude(id=locked_version.id)
        .first()
    )

    if previous_active_version:
        previous_active_version.status = (
            PolicyVersion.STATUS_ARCHIVED
        )
        previous_active_version.is_active = False
        previous_active_version.save(
            update_fields=[
                "status",
                "is_active",
                "updated_at",
            ]
        )

    locked_version.status = (
        PolicyVersion.STATUS_ACTIVE
    )
    locked_version.is_active = True
    locked_version.activated_by = action_by
    locked_version.activated_at = timezone.now()

    locked_version.save(
        update_fields=[
            "status",
            "is_active",
            "activated_by",
            "activated_at",
            "updated_at",
        ]
    )

    create_audit_log(
        company=locked_version.policy.company,
        action="POLICY_VERSION_ACTIVATED",
        action_by=action_by,
        message=(
            f"Policy version "
            f"{locked_version.version_number} was activated."
        ),
        metadata={
            "policy_id": str(
                locked_version.policy.id
            ),
            "version_id": str(
                locked_version.id
            ),
            "version_number": (
                locked_version.version_number
            ),
            "previous_active_version_id": (
                str(previous_active_version.id)
                if previous_active_version
                else None
            ),
            "previous_active_version_number": (
                previous_active_version.version_number
                if previous_active_version
                else None
            ),
        },
    )

    return {
        "success": True,
        "message": "Policy version activated successfully.",
        "version": _serialize_version_summary(
            locked_version
        ),
        "previous_active_version": (
            _serialize_version_summary(
                previous_active_version
            )
        ),
    }


# ============================================================
# Archive a policy version
# ============================================================

@transaction.atomic
def archive_policy_version(
    *,
    version,
    action_by,
):
    """
    Archive a version.

    An active version may be archived only when another active
    version already exists, preventing the company from accidentally
    having no active policy.
    """

    if not isinstance(version, PolicyVersion):
        return {
            "success": False,
            "error": "A valid PolicyVersion instance is required.",
        }

    try:
        _validate_action_by_company(
            policy=version.policy,
            action_by=action_by,
        )
    except ValidationError as exc:
        return {
            "success": False,
            "error": str(exc),
        }

    locked_version = (
        PolicyVersion.objects.select_for_update()
        .select_related(
            "policy",
            "policy__company",
        )
        .get(id=version.id)
    )

    if (
        locked_version.status
        == PolicyVersion.STATUS_ARCHIVED
        and not locked_version.is_active
    ):
        return {
            "success": True,
            "message": "Policy version is already archived.",
            "version": _serialize_version_summary(
                locked_version
            ),
        }

    if locked_version.is_active:
        another_active_exists = (
            PolicyVersion.objects.filter(
                policy=locked_version.policy,
                is_active=True,
            )
            .exclude(id=locked_version.id)
            .exists()
        )

        if not another_active_exists:
            return {
                "success": False,
                "error": (
                    "The only active policy version cannot "
                    "be archived. Activate another version first."
                ),
            }

    locked_version.status = (
        PolicyVersion.STATUS_ARCHIVED
    )
    locked_version.is_active = False

    locked_version.save(
        update_fields=[
            "status",
            "is_active",
            "updated_at",
        ]
    )

    create_audit_log(
        company=locked_version.policy.company,
        action="POLICY_VERSION_ARCHIVED",
        action_by=action_by,
        message=(
            f"Policy version "
            f"{locked_version.version_number} was archived."
        ),
        metadata={
            "policy_id": str(
                locked_version.policy.id
            ),
            "version_id": str(
                locked_version.id
            ),
            "version_number": (
                locked_version.version_number
            ),
        },
    )

    return {
        "success": True,
        "message": "Policy version archived successfully.",
        "version": _serialize_version_summary(
            locked_version
        ),
    }


# ============================================================
# Duplicate any version into a new draft
# ============================================================

@transaction.atomic
def duplicate_policy_version(
    *,
    source_version,
    action_by,
    title=None,
    description=None,
):
    """
    Duplicate an existing version into a new DRAFT version.

    The original version is never modified.
    """

    if not isinstance(
        source_version,
        PolicyVersion,
    ):
        return {
            "success": False,
            "error": (
                "A valid source PolicyVersion "
                "instance is required."
            ),
        }

    try:
        _validate_action_by_company(
            policy=source_version.policy,
            action_by=action_by,
        )
    except ValidationError as exc:
        return {
            "success": False,
            "error": str(exc),
        }

    locked_policy = (
        CompanyPolicy.objects.select_for_update()
        .get(id=source_version.policy_id)
    )

    source_version = (
        PolicyVersion.objects.select_for_update()
        .get(
            id=source_version.id,
            policy=locked_policy,
        )
    )

    version_number = _get_next_version_number(
        locked_policy
    )

    duplicate_title = (
        str(title).strip()
        if title
        else (
            f"Copy of {source_version.title} "
            f"(Version {version_number})"
        )
    )

    new_version = PolicyVersion.objects.create(
        policy=locked_policy,
        version_number=version_number,
        title=duplicate_title,
        description=(
            description
            if description is not None
            else source_version.description
        ),
        imported_from_document=(
            source_version.imported_from_document
        ),
        status=PolicyVersion.STATUS_DRAFT,
        is_active=False,
        created_by=action_by,
    )

    copied_rules_count = _copy_version_rules(
        source_version=source_version,
        target_version=new_version,
    )

    create_audit_log(
        company=locked_policy.company,
        action="POLICY_VERSION_DUPLICATED",
        action_by=action_by,
        message=(
            f"Policy version {source_version.version_number} "
            f"was duplicated as version "
            f"{new_version.version_number}."
        ),
        metadata={
            "policy_id": str(
                locked_policy.id
            ),
            "source_version_id": str(
                source_version.id
            ),
            "source_version_number": (
                source_version.version_number
            ),
            "new_version_id": str(
                new_version.id
            ),
            "new_version_number": (
                new_version.version_number
            ),
            "copied_rules": copied_rules_count,
        },
    )

    return {
        "success": True,
        "message": (
            "Policy version duplicated successfully."
        ),
        "source_version": (
            _serialize_version_summary(
                source_version
            )
        ),
        "version": _serialize_version_summary(
            new_version
        ),
        "copied_rules": copied_rules_count,
    }


# ============================================================
# Roll back by creating a new active copy
# ============================================================

@transaction.atomic
def rollback_policy_version(
    *,
    source_version,
    action_by,
    title=None,
    description=None,
):
    """
    Roll back to a historical version safely.

    The historical version itself is never reactivated or edited.

    Instead:
    1. A new version is created.
    2. Historical rules are copied into it.
    3. The new version becomes active.
    4. The old active version is archived.

    Example:
        Current version: 5
        Roll back using version 2
        New active version: 6 containing version 2's rules
    """

    if not isinstance(
        source_version,
        PolicyVersion,
    ):
        return {
            "success": False,
            "error": (
                "A valid source PolicyVersion "
                "instance is required."
            ),
        }

    try:
        _validate_action_by_company(
            policy=source_version.policy,
            action_by=action_by,
        )
    except ValidationError as exc:
        return {
            "success": False,
            "error": str(exc),
        }

    locked_policy = (
        CompanyPolicy.objects.select_for_update()
        .get(id=source_version.policy_id)
    )

    source_version = (
        PolicyVersion.objects.select_for_update()
        .get(
            id=source_version.id,
            policy=locked_policy,
        )
    )

    if not source_version.rules.exists():
        return {
            "success": False,
            "error": (
                "Cannot roll back from a policy version "
                "that has no rules."
            ),
        }

    current_active_version = (
        PolicyVersion.objects.select_for_update()
        .filter(
            policy=locked_policy,
            is_active=True,
        )
        .first()
    )

    version_number = _get_next_version_number(
        locked_policy
    )

    rollback_title = (
        str(title).strip()
        if title
        else (
            f"Rollback to Version "
            f"{source_version.version_number}"
        )
    )

    rollback_description = (
        description
        if description is not None
        else (
            f"Created as a rollback copy of policy "
            f"version {source_version.version_number}."
        )
    )

    new_version = PolicyVersion.objects.create(
        policy=locked_policy,
        version_number=version_number,
        title=rollback_title,
        description=rollback_description,
        imported_from_document=(
            source_version.imported_from_document
        ),
        status=PolicyVersion.STATUS_DRAFT,
        is_active=False,
        created_by=action_by,
    )

    copied_rules_count = _copy_version_rules(
        source_version=source_version,
        target_version=new_version,
    )

    if copied_rules_count == 0:
        raise ValidationError(
            "Rollback failed because no rules were copied."
        )

    if current_active_version:
        current_active_version.status = (
            PolicyVersion.STATUS_ARCHIVED
        )
        current_active_version.is_active = False

        current_active_version.save(
            update_fields=[
                "status",
                "is_active",
                "updated_at",
            ]
        )

    new_version.status = (
        PolicyVersion.STATUS_ACTIVE
    )
    new_version.is_active = True
    new_version.activated_by = action_by
    new_version.activated_at = timezone.now()

    new_version.save(
        update_fields=[
            "status",
            "is_active",
            "activated_by",
            "activated_at",
            "updated_at",
        ]
    )

    create_audit_log(
        company=locked_policy.company,
        action="POLICY_VERSION_ROLLED_BACK",
        action_by=action_by,
        message=(
            f"Policy version "
            f"{source_version.version_number} "
            f"was restored as new active version "
            f"{new_version.version_number}."
        ),
        metadata={
            "policy_id": str(
                locked_policy.id
            ),
            "source_version_id": str(
                source_version.id
            ),
            "source_version_number": (
                source_version.version_number
            ),
            "new_version_id": str(
                new_version.id
            ),
            "new_version_number": (
                new_version.version_number
            ),
            "previous_active_version_id": (
                str(current_active_version.id)
                if current_active_version
                else None
            ),
            "previous_active_version_number": (
                current_active_version.version_number
                if current_active_version
                else None
            ),
            "copied_rules": copied_rules_count,
        },
    )

    return {
        "success": True,
        "message": (
            "Policy version rolled back successfully."
        ),
        "source_version": (
            _serialize_version_summary(
                source_version
            )
        ),
        "previous_active_version": (
            _serialize_version_summary(
                current_active_version
            )
        ),
        "version": _serialize_version_summary(
            new_version
        ),
        "copied_rules": copied_rules_count,
    }


# ============================================================
# Delete a draft version
# ============================================================

@transaction.atomic
def delete_draft_policy_version(
    *,
    version,
    action_by,
):
    """
    Delete only a DRAFT, inactive version.

    Active or archived historical versions cannot be deleted.
    """

    if not isinstance(version, PolicyVersion):
        return {
            "success": False,
            "error": "A valid PolicyVersion instance is required.",
        }

    try:
        _validate_action_by_company(
            policy=version.policy,
            action_by=action_by,
        )
    except ValidationError as exc:
        return {
            "success": False,
            "error": str(exc),
        }

    locked_version = (
        PolicyVersion.objects.select_for_update()
        .select_related(
            "policy",
            "policy__company",
        )
        .get(id=version.id)
    )

    if (
        locked_version.status
        != PolicyVersion.STATUS_DRAFT
        or locked_version.is_active
    ):
        return {
            "success": False,
            "error": (
                "Only inactive draft policy versions "
                "can be deleted."
            ),
        }

    metadata = {
        "policy_id": str(
            locked_version.policy.id
        ),
        "version_id": str(
            locked_version.id
        ),
        "version_number": (
            locked_version.version_number
        ),
        "title": locked_version.title,
        "deleted_rules": (
            locked_version.rules.count()
        ),
    }

    version_number = (
        locked_version.version_number
    )

    locked_version.delete()

    create_audit_log(
        company=version.policy.company,
        action="POLICY_VERSION_DELETED",
        action_by=action_by,
        message=(
            f"Draft policy version "
            f"{version_number} was deleted."
        ),
        metadata=metadata,
    )

    return {
        "success": True,
        "message": (
            "Draft policy version deleted successfully."
        ),
        "deleted_version_number": version_number,
    }