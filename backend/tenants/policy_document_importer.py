from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils import timezone

from audit_logs.utils import create_audit_log

from .models import (
    CompanyPolicy,
    CompanyRole,
    Currency,
    PolicyCategoryRule,
    PolicyDocumentImport,
    PolicyVersion,
)

from .validators import validate_policy_json
from .normalizers import normalize_policy_json


# ============================================================
# Role resolution
# ============================================================


def _get_employee_role(company):
    """Return the active Employee role used for general/default rules."""

    return CompanyRole.objects.filter(
        company=company,
        name__iexact="Employee",
        is_active=True,
    ).first()


def _resolve_company_role(
    *,
    company,
    rule_data,
    employee_role,
):
    """
    Resolve the company role for an extracted rule.

    Priority:
    1. Valid resolved_role_id from preview.
    2. No named role -> Employee fallback.
    3. Exact explicit role-name match.
    4. Exact resolved_role_name match.
    5. Otherwise fail without silently mapping a named unknown role.
    """

    resolved_role_id = rule_data.get("resolved_role_id")
    role_name = rule_data.get("role")
    role_match_type = rule_data.get("role_match_type")

    if resolved_role_id:
        role = CompanyRole.objects.filter(
            id=resolved_role_id,
            company=company,
            is_active=True,
        ).first()

        if role:
            return role, None

    if not role_name:
        if not employee_role:
            return (
                None,
                (
                    "No active Employee role exists for "
                    "general/default policy rules."
                ),
            )

        return employee_role, None

    role = CompanyRole.objects.filter(
        company=company,
        name__iexact=str(role_name).strip(),
        is_active=True,
    ).first()

    if role:
        return role, None

    resolved_role_name = rule_data.get("resolved_role_name")

    if resolved_role_name:
        role = CompanyRole.objects.filter(
            company=company,
            name__iexact=str(resolved_role_name).strip(),
            is_active=True,
        ).first()

        if role:
            return role, None

    return (
        None,
        (
            f"Role '{role_name}' was explicitly found in the "
            "document but does not exist as an active company role. "
            f"Match type: {role_match_type or 'ROLE_NOT_FOUND'}."
        ),
    )


# ============================================================
# Currency resolution
# ============================================================


def _get_company_base_currency(company):
    finance_settings = getattr(company, "finance_settings", None)

    if finance_settings and finance_settings.base_currency:
        return finance_settings.base_currency

    return None


def _resolve_currency(
    *,
    company,
    rule_data,
    preview,
):
    """
    Resolve currency against the active Currency table.

    Priority:
    1. Rule currency.
    2. Preview/document policy currency.
    3. Company base currency.
    """

    currency_code = (
        rule_data.get("currency")
        or preview.get("policy_currency")
    )

    if currency_code:
        currency = Currency.objects.filter(
            code__iexact=str(currency_code).strip(),
            is_active=True,
        ).first()

        if currency:
            return currency, None

    base_currency = _get_company_base_currency(company)

    if base_currency and base_currency.is_active:
        return (
            base_currency,
            (
                "Currency was not present or could not be matched. "
                f"Company base currency '{base_currency.code}' was used."
            ),
        )

    return (
        None,
        (
            "Currency could not be resolved and the company "
            "does not have an active base currency."
        ),
    )


# ============================================================
# Data normalization
# ============================================================


def _normalize_category(value):
    category = str(value or "miscellaneous").strip().lower()
    return category or "miscellaneous"


def _parse_decimal(value):
    if value in [None, "", "null"]:
        return None

    try:
        amount = Decimal(
            str(value)
            .replace(",", "")
            .strip()
        )
    except (InvalidOperation, TypeError, ValueError):
        return None

    if amount < 0:
        return None

    return amount


def _prepare_rule_values(
    *,
    rule_data,
    currency,
):
    """Convert preview data into PolicyCategoryRule model fields."""

    is_allowed = bool(rule_data.get("is_allowed", True))
    is_unlimited = bool(rule_data.get("is_unlimited", False))
    max_amount = _parse_decimal(rule_data.get("max_amount"))

    if not is_allowed:
        is_unlimited = False
        max_amount = Decimal("0.00")
    elif is_unlimited:
        max_amount = None
    elif max_amount is None:
        return None, (
            "A numeric max_amount is required when the rule "
            "is allowed and is_unlimited is false."
        )

    confidence_value = rule_data.get("confidence")
    ai_confidence = None

    if confidence_value not in [None, ""]:
        try:
            ai_confidence = Decimal(str(confidence_value))
        except InvalidOperation:
            ai_confidence = None

        if ai_confidence is not None:
            ai_confidence = max(
                Decimal("0"),
                min(Decimal("1"), ai_confidence),
            )

    description = (
        rule_data.get("description")
        or rule_data.get("translated_source_text")
        or rule_data.get("summary")
        or "AI extracted reimbursement policy rule."
    )

    reason = (
        rule_data.get("reason")
        or "The document defines this as the applicable reimbursement policy."
    )

    source_text = rule_data.get("source_text")

    return {
        "max_amount": max_amount,
        "currency": currency.code.upper(),
        "is_unlimited": is_unlimited,
        "category_description": str(description).strip(),
        "policy_reason": str(reason).strip(),
        "source_text": (
            str(source_text).strip()
            if source_text
            else None
        ),
        "ai_confidence": ai_confidence,
        "is_ai_generated": True,
        "is_active": True,
    }, None


# ============================================================
# Version helpers
# ============================================================


def _get_active_version(policy):
    return (
        PolicyVersion.objects
        .select_for_update()
        .filter(
            policy=policy,
            is_active=True,
            status=PolicyVersion.STATUS_ACTIVE,
        )
        .first()
    )


def _get_next_version_number(policy):
    current_max = (
        PolicyVersion.objects
        .filter(policy=policy)
        .aggregate(max_number=Max("version_number"))
        .get("max_number")
        or 0
    )

    return current_max + 1


def _create_draft_version(
    *,
    policy,
    import_record,
    action_by,
    preview,
):
    version_number = _get_next_version_number(policy)

    title = (
        preview.get("policy_name")
        or f"Expense Policy Version {version_number}"
    )

    description = preview.get("document_summary")

    return PolicyVersion.objects.create(
        policy=policy,
        version_number=version_number,
        title=str(title).strip()[:255],
        description=(
            str(description).strip()
            if description
            else None
        ),
        imported_from_document=import_record,
        status=PolicyVersion.STATUS_DRAFT,
        is_active=False,
        created_by=action_by,
    )


def _clone_source_rules(
    *,
    policy,
    source_version,
    target_version,
):
    """
    Clone the previous active version into the new draft.

    On the first version, legacy rules with policy_version=NULL are cloned
    so existing policies are not lost when versioning is introduced.
    """

    if source_version:
        source_rules = PolicyCategoryRule.objects.filter(
            policy=policy,
            policy_version=source_version,
        ).select_related("company_role")
    else:
        source_rules = PolicyCategoryRule.objects.filter(
            policy=policy,
            policy_version__isnull=True,
        ).select_related("company_role")

    clones = [
        PolicyCategoryRule(
            policy=policy,
            policy_version=target_version,
            company_role=source.company_role,
            category_name=source.category_name,
            max_amount=source.max_amount,
            currency=source.currency,
            is_unlimited=source.is_unlimited,
            category_description=source.category_description,
            policy_reason=source.policy_reason,
            source_text=source.source_text,
            ai_confidence=source.ai_confidence,
            is_ai_generated=source.is_ai_generated,
            is_active=source.is_active,
        )
        for source in source_rules
    ]

    if clones:
        PolicyCategoryRule.objects.bulk_create(clones)

    return len(clones)


def _activate_version(
    *,
    policy,
    new_version,
    previous_active_version,
    action_by,
):
    activated_at = timezone.now()

    if previous_active_version:
        previous_active_version.status = PolicyVersion.STATUS_ARCHIVED
        previous_active_version.is_active = False
        previous_active_version.save(update_fields=[
            "status",
            "is_active",
            "updated_at",
        ])

    new_version.status = PolicyVersion.STATUS_ACTIVE
    new_version.is_active = True
    new_version.activated_by = action_by
    new_version.activated_at = activated_at
    new_version.save(update_fields=[
        "status",
        "is_active",
        "activated_by",
        "activated_at",
        "updated_at",
    ])


# ============================================================
# Existing-rule comparison and serialization
# ============================================================


def _rule_has_changes(existing_rule, values):
    tracked_fields = [
        "max_amount",
        "currency",
        "is_unlimited",
        "category_description",
        "policy_reason",
        "source_text",
        "ai_confidence",
        "is_ai_generated",
        "is_active",
    ]

    return any(
        getattr(existing_rule, field_name) != values.get(field_name)
        for field_name in tracked_fields
    )


def _serialize_imported_rule(
    *,
    rule,
    status_value,
    source_rule_index,
):
    return {
        "rule_id": str(rule.id),
        "policy_version_id": (
            str(rule.policy_version_id)
            if rule.policy_version_id
            else None
        ),
        "version_number": (
            rule.policy_version.version_number
            if rule.policy_version_id
            else None
        ),
        "role_id": str(rule.company_role.id),
        "role_name": rule.company_role.name,
        "category": rule.category_name,
        "max_amount": (
            str(rule.max_amount)
            if rule.max_amount is not None
            else None
        ),
        "currency": rule.currency,
        "is_unlimited": rule.is_unlimited,
        "status": status_value,
        "source_rule_index": source_rule_index,
    }


# ============================================================
# Main importer
# ============================================================


@transaction.atomic
def import_policy_document_preview(
    *,
    import_record,
    action_by,
    overwrite_existing=False,
    allow_review_required=False,
):
    """
    Import a reviewed AI preview into a newly created policy version.

    Version flow:
    1. Lock the company policy.
    2. Create the next DRAFT version.
    3. Clone rules from the current ACTIVE version, or legacy rules when no
       active version exists.
    4. Apply extracted changes only to the new version.
    5. Activate the new version and archive the previous active version.
    6. Leave every older version unchanged for history and comparison.
    """

    if not isinstance(import_record, PolicyDocumentImport):
        return {
            "success": False,
            "error": "A valid PolicyDocumentImport instance is required.",
        }

    if import_record.status == PolicyDocumentImport.STATUS_IMPORTED:
        return {
            "success": False,
            "error": "This policy document has already been imported.",
        }

    if import_record.status not in [
        PolicyDocumentImport.STATUS_REVIEW_REQUIRED,
        PolicyDocumentImport.STATUS_PROCESSING,
    ]:
        return {
            "success": False,
            "error": (
                "This policy document is not ready for import. "
                f"Current status: {import_record.status}."
            ),
        }

    company = import_record.company
    preview = import_record.extracted_json or {}
    rules = preview.get("rules", [])
    # ---------------------------------------------
# Validate AI JSON
# ---------------------------------------------

    validation_errors = validate_policy_json(preview)

    if validation_errors:
        return {
        "success": False,
        "error": "AI returned invalid policy JSON.",
        "validation_errors": validation_errors,
    }

# ---------------------------------------------
# Normalize AI JSON
# ---------------------------------------------

    preview = normalize_policy_json(preview)

    rules = preview.get("rules", [])

    if not rules:
        return {
            "success": False,
            "error": "No extracted policy rules are available for import.",
        }

    if action_by and action_by.company_id != company.id:
        return {
            "success": False,
            "error": "The importing user does not belong to this company.",
        }

    policy, _ = CompanyPolicy.objects.get_or_create(company=company)

    # Lock the policy row so two imports cannot create the same next version.
    policy = CompanyPolicy.objects.select_for_update().get(pk=policy.pk)

    previous_active_version = _get_active_version(policy)

    new_version = _create_draft_version(
        policy=policy,
        import_record=import_record,
        action_by=action_by,
        preview=preview,
    )

    cloned_count = _clone_source_rules(
        policy=policy,
        source_version=previous_active_version,
        target_version=new_version,
    )

    employee_role = _get_employee_role(company)

    created_count = 0
    updated_count = 0
    unchanged_count = 0
    skipped_count = 0
    failed_count = 0

    imported_rules = []
    warnings = list(import_record.warnings or [])
    errors = []

    for index, rule_data in enumerate(rules):
        source_rule_index = rule_data.get("rule_index", index)

        if rule_data.get("duplicate_rule"):
            skipped_count += 1
            warnings.append({
                "code": "DUPLICATE_RULE_SKIPPED",
                "rule_index": source_rule_index,
                "message": "Probable duplicate rule was not imported.",
            })
            continue

        if (
            rule_data.get("review_required")
            and not allow_review_required
        ):
            skipped_count += 1
            warnings.append({
                "code": "REVIEW_REQUIRED_RULE_SKIPPED",
                "rule_index": source_rule_index,
                "message": (
                    "Rule was skipped because it requires human review."
                ),
                "review_reason": rule_data.get("review_reason"),
            })
            continue

        company_role, role_error = _resolve_company_role(
            company=company,
            rule_data=rule_data,
            employee_role=employee_role,
        )

        if role_error:
            failed_count += 1
            errors.append({
                "rule_index": source_rule_index,
                "code": "ROLE_RESOLUTION_FAILED",
                "message": role_error,
                "source_text": rule_data.get("source_text"),
            })
            continue

        currency, currency_warning = _resolve_currency(
            company=company,
            rule_data=rule_data,
            preview=preview,
        )

        if not currency:
            failed_count += 1
            errors.append({
                "rule_index": source_rule_index,
                "code": "CURRENCY_RESOLUTION_FAILED",
                "message": currency_warning,
                "source_text": rule_data.get("source_text"),
            })
            continue

        if currency_warning:
            warnings.append({
                "rule_index": source_rule_index,
                "code": "BASE_CURRENCY_FALLBACK",
                "message": currency_warning,
            })

        category = _normalize_category(rule_data.get("category"))

        values, values_error = _prepare_rule_values(
            rule_data=rule_data,
            currency=currency,
        )

        if values_error:
            failed_count += 1
            errors.append({
                "rule_index": source_rule_index,
                "code": "INVALID_POLICY_VALUES",
                "message": values_error,
                "role": company_role.name,
                "category": category,
                "source_text": rule_data.get("source_text"),
            })
            continue

        try:
            existing_rule = (
                PolicyCategoryRule.objects
                .select_for_update()
                .select_related(
                    "policy_version",
                    "company_role",
                )
                .filter(
                    policy=policy,
                    policy_version=new_version,
                    company_role=company_role,
                    category_name__iexact=category,
                )
                .first()
            )

            if existing_rule:
                if not overwrite_existing:
                    skipped_count += 1
                    imported_rules.append(
                        _serialize_imported_rule(
                            rule=existing_rule,
                            status_value="SKIPPED_EXISTING",
                            source_rule_index=source_rule_index,
                        )
                    )
                    continue

                if not _rule_has_changes(existing_rule, values):
                    unchanged_count += 1
                    imported_rules.append(
                        _serialize_imported_rule(
                            rule=existing_rule,
                            status_value="UNCHANGED",
                            source_rule_index=source_rule_index,
                        )
                    )
                    continue

                for field_name, field_value in values.items():
                    setattr(existing_rule, field_name, field_value)

                existing_rule.category_name = category
                existing_rule.save()

                updated_count += 1
                imported_rules.append(
                    _serialize_imported_rule(
                        rule=existing_rule,
                        status_value="UPDATED",
                        source_rule_index=source_rule_index,
                    )
                )

            else:
                rule = PolicyCategoryRule(
                    policy=policy,
                    policy_version=new_version,
                    company_role=company_role,
                    category_name=category,
                    **values,
                )
                rule.save()

                created_count += 1
                imported_rules.append(
                    _serialize_imported_rule(
                        rule=rule,
                        status_value="CREATED",
                        source_rule_index=source_rule_index,
                    )
                )

        except ValidationError as exc:
            failed_count += 1
            message_dict = getattr(exc, "message_dict", None)
            errors.append({
                "rule_index": source_rule_index,
                "code": "MODEL_VALIDATION_FAILED",
                "message": message_dict if message_dict else str(exc),
                "role": company_role.name,
                "category": category,
            })

        except IntegrityError as exc:
            failed_count += 1
            errors.append({
                "rule_index": source_rule_index,
                "code": "DATABASE_CONFLICT",
                "message": (
                    "A database conflict occurred while saving this "
                    "policy rule."
                ),
                "role": company_role.name,
                "category": category,
                "details": str(exc),
            })

    successful_import_results = (
        created_count
        + updated_count
        + unchanged_count
    )

    if successful_import_results == 0:
        # Avoid leaving an unused draft and its cloned rules in the database.
        new_version.delete()

        import_record.status = PolicyDocumentImport.STATUS_REVIEW_REQUIRED
        import_record.warnings = warnings
        import_record.error_message = (
            "No policy rules were imported. Review warnings and errors."
        )
        import_record.save(update_fields=[
            "status",
            "warnings",
            "error_message",
            "updated_at",
        ])

        return {
            "success": False,
            "error": "No policy rules were imported.",
            "summary": {
                "created": created_count,
                "updated": updated_count,
                "unchanged": unchanged_count,
                "skipped": skipped_count,
                "failed": failed_count,
                "processed": len(rules),
                "cloned_from_previous_version": cloned_count,
            },
            "warnings": warnings,
            "errors": errors,
            "rules": imported_rules,
        }

    _activate_version(
        policy=policy,
        new_version=new_version,
        previous_active_version=previous_active_version,
        action_by=action_by,
    )

    import_record.status = PolicyDocumentImport.STATUS_IMPORTED
    import_record.warnings = warnings
    import_record.error_message = None
    import_record.save(update_fields=[
        "status",
        "warnings",
        "error_message",
        "updated_at",
    ])

    create_audit_log(
        company=company,
        action="AI_POLICY_DOCUMENT_IMPORTED",
        action_by=action_by,
        message=(
            f"AI policy document '{import_record.original_filename}' "
            f"was imported as policy version {new_version.version_number}."
        ),
        metadata={
            "import_id": str(import_record.id),
            "policy_id": str(policy.id),
            "policy_version_id": str(new_version.id),
            "version_number": new_version.version_number,
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
            # ------------------------------
            # AI Metadata
            # ------------------------------
            "ai_model": preview.get("ai_model"),
            "prompt_version": preview.get("prompt_version"),
            # ------------------------------
            # Language
            # ------------------------------
            "document_language": preview.get("document_language"),
            "document_language_code": preview.get("document_language_code"),
            "output_language": preview.get("output_language"),
            "output_language_code": preview.get("output_language_code"),
            # ------------------------------
            # Document
            # ------------------------------
            "document_type": preview.get("document_type"),
            "document_quality": preview.get("document_quality"),
            "document_summary": preview.get("document_summary"),
            # ------------------------------
            # Policy
            # ------------------------------
            "policy_currency": preview.get("policy_currency"),
            "roles_detected": preview.get("roles_detected"),
            "categories_detected": preview.get("categories_detected"),
            # ------------------------------
            # Statistics
            # ------------------------------
            "rules_extracted": len(rules),
            "cloned_from_previous_version": cloned_count,
            "created": created_count,
            "updated": updated_count,
            "unchanged": unchanged_count,
            "skipped": skipped_count,
            "failed": failed_count,
            # ------------------------------
            # Import Settings
            # ------------------------------
            "overwrite_existing": overwrite_existing,
            "allow_review_required": allow_review_required,
            "warning_count": len(warnings),
            "error_count": len(errors),
        },
    )

    return {
        "success": True,
        "message": "AI policy document imported as a new active version.",
        "import_id": str(import_record.id),
        "policy_id": str(policy.id),
        "policy_version": {
            "id": str(new_version.id),
            "version_number": new_version.version_number,
            "title": new_version.title,
            "status": new_version.status,
            "is_active": new_version.is_active,
            "activated_at": (
                new_version.activated_at.isoformat()
                if new_version.activated_at
                else None
            ),
        },
        "previous_version": (
            {
                "id": str(previous_active_version.id),
                "version_number": previous_active_version.version_number,
                "status": previous_active_version.status,
                "is_active": previous_active_version.is_active,
            }
            if previous_active_version
            else None
        ),
        "status": import_record.status,
        "summary": {
            "created": created_count,
            "updated": updated_count,
            "unchanged": unchanged_count,
            "skipped": skipped_count,
            "failed": failed_count,
            "processed": len(rules),
            "cloned_from_previous_version": cloned_count,
            "total_rules_in_new_version": (
                PolicyCategoryRule.objects.filter(
                    policy_version=new_version,
                ).count()
            ),
        },
        "warnings": warnings,
        "errors": errors,
        "rules": imported_rules,
    }