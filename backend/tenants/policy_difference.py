from decimal import Decimal

from .models import (
    PolicyCategoryRule,
    PolicyVersion,
)


# ============================================================
# Serialization helpers
# ============================================================

def _decimal_to_string(value):
    if value is None:
        return None

    return format(
        Decimal(value),
        "f",
    )


def _serialize_rule(rule):
    return {
        "id": str(rule.id),

        "company_role": {
            "id": str(rule.company_role.id),
            "name": rule.company_role.name,
        },

        "category_name": rule.category_name,

        "max_amount": _decimal_to_string(
            rule.max_amount
        ),

        "currency": rule.currency,

        "is_unlimited": rule.is_unlimited,

        "category_description": (
            rule.category_description
        ),

        "policy_reason": rule.policy_reason,

        "source_text": rule.source_text,

        "ai_confidence": (
            _decimal_to_string(
                rule.ai_confidence
            )
            if rule.ai_confidence is not None
            else None
        ),

        "is_ai_generated": (
            rule.is_ai_generated
        ),

        "is_active": rule.is_active,
    }


def _serialize_version(version):
    return {
        "id": str(version.id),
        "version_number": version.version_number,
        "title": version.title,
        "description": version.description,
        "status": version.status,
        "is_active": version.is_active,
        "created_at": (
            version.created_at.isoformat()
            if version.created_at
            else None
        ),
        "activated_at": (
            version.activated_at.isoformat()
            if version.activated_at
            else None
        ),
        "total_rules": version.rules.count(),
    }


# ============================================================
# Rule identity
# ============================================================

def _build_rule_key(rule):
    """
    A policy rule is uniquely identified inside a version by:

    company role + category
    """

    return (
        str(rule.company_role_id),
        rule.category_name.strip().lower(),
    )


def _get_version_rule_map(version):
    rules = (
        PolicyCategoryRule.objects
        .filter(
            policy_version=version
        )
        .select_related(
            "company_role"
        )
        .order_by(
            "company_role__name",
            "category_name",
        )
    )

    return {
        _build_rule_key(rule): rule
        for rule in rules
    }


# ============================================================
# Field comparison helpers
# ============================================================

def _normalize_text(value):
    if value is None:
        return None

    value = str(value).strip()

    return value or None


def _values_equal(old_value, new_value):
    if isinstance(old_value, Decimal):
        old_value = _decimal_to_string(
            old_value
        )

    if isinstance(new_value, Decimal):
        new_value = _decimal_to_string(
            new_value
        )

    return old_value == new_value


def _build_field_change(
    *,
    field,
    label,
    old_value,
    new_value,
):
    return {
        "field": field,
        "label": label,
        "old_value": old_value,
        "new_value": new_value,
    }


def _compare_rule_fields(
    old_rule,
    new_rule,
):
    changes = []

    old_amount = _decimal_to_string(
        old_rule.max_amount
    )

    new_amount = _decimal_to_string(
        new_rule.max_amount
    )

    if not _values_equal(
        old_amount,
        new_amount,
    ):
        changes.append(
            _build_field_change(
                field="max_amount",
                label="Maximum Amount",
                old_value=old_amount,
                new_value=new_amount,
            )
        )

    if old_rule.currency != new_rule.currency:
        changes.append(
            _build_field_change(
                field="currency",
                label="Currency",
                old_value=old_rule.currency,
                new_value=new_rule.currency,
            )
        )

    if (
        old_rule.is_unlimited
        != new_rule.is_unlimited
    ):
        changes.append(
            _build_field_change(
                field="is_unlimited",
                label="Unlimited",
                old_value=old_rule.is_unlimited,
                new_value=new_rule.is_unlimited,
            )
        )

    old_description = _normalize_text(
        old_rule.category_description
    )

    new_description = _normalize_text(
        new_rule.category_description
    )

    if old_description != new_description:
        changes.append(
            _build_field_change(
                field="category_description",
                label="Description",
                old_value=old_description,
                new_value=new_description,
            )
        )

    old_reason = _normalize_text(
        old_rule.policy_reason
    )

    new_reason = _normalize_text(
        new_rule.policy_reason
    )

    if old_reason != new_reason:
        changes.append(
            _build_field_change(
                field="policy_reason",
                label="Policy Reason",
                old_value=old_reason,
                new_value=new_reason,
            )
        )

    old_source = _normalize_text(
        old_rule.source_text
    )

    new_source = _normalize_text(
        new_rule.source_text
    )

    if old_source != new_source:
        changes.append(
            _build_field_change(
                field="source_text",
                label="Source Text",
                old_value=old_source,
                new_value=new_source,
            )
        )

    old_confidence = (
        _decimal_to_string(
            old_rule.ai_confidence
        )
        if old_rule.ai_confidence is not None
        else None
    )

    new_confidence = (
        _decimal_to_string(
            new_rule.ai_confidence
        )
        if new_rule.ai_confidence is not None
        else None
    )

    if old_confidence != new_confidence:
        changes.append(
            _build_field_change(
                field="ai_confidence",
                label="AI Confidence",
                old_value=old_confidence,
                new_value=new_confidence,
            )
        )

    if (
        old_rule.is_ai_generated
        != new_rule.is_ai_generated
    ):
        changes.append(
            _build_field_change(
                field="is_ai_generated",
                label="AI Generated",
                old_value=old_rule.is_ai_generated,
                new_value=new_rule.is_ai_generated,
            )
        )

    if old_rule.is_active != new_rule.is_active:
        changes.append(
            _build_field_change(
                field="is_active",
                label="Rule Active Status",
                old_value=old_rule.is_active,
                new_value=new_rule.is_active,
            )
        )

    return changes


# ============================================================
# Human-readable change messages
# ============================================================

def _build_rule_name(rule):
    return (
        f"{rule.company_role.name} - "
        f"{rule.category_name}"
    )


def _build_modified_summary(
    old_rule,
    new_rule,
    changes,
):
    messages = []

    for change in changes:
        field = change["field"]

        if field == "max_amount":
            messages.append(
                (
                    f"Maximum amount changed from "
                    f"{change['old_value']} to "
                    f"{change['new_value']}."
                )
            )

        elif field == "currency":
            messages.append(
                (
                    f"Currency changed from "
                    f"{change['old_value']} to "
                    f"{change['new_value']}."
                )
            )

        elif field == "is_unlimited":
            if change["new_value"]:
                messages.append(
                    "Rule changed from limited to unlimited."
                )
            else:
                messages.append(
                    "Rule changed from unlimited to limited."
                )

        elif field == "category_description":
            messages.append(
                "Policy description was updated."
            )

        elif field == "policy_reason":
            messages.append(
                "Policy reason was updated."
            )

        elif field == "source_text":
            messages.append(
                "Source document text was updated."
            )

        elif field == "ai_confidence":
            messages.append(
                "AI confidence value changed."
            )

        elif field == "is_active":
            messages.append(
                (
                    "Rule was activated."
                    if change["new_value"]
                    else "Rule was deactivated."
                )
            )

    return {
        "rule": _build_rule_name(
            new_rule
        ),
        "messages": messages,
    }


# ============================================================
# Main comparison service
# ============================================================

def compare_policy_versions(
    *,
    old_version,
    new_version,
    include_unchanged=False,
):
    """
    Compare two versions belonging to the same CompanyPolicy.

    Returns added, removed, modified, and optionally unchanged rules.
    """

    if not isinstance(
        old_version,
        PolicyVersion,
    ):
        return {
            "success": False,
            "error": (
                "A valid old PolicyVersion "
                "instance is required."
            ),
        }

    if not isinstance(
        new_version,
        PolicyVersion,
    ):
        return {
            "success": False,
            "error": (
                "A valid new PolicyVersion "
                "instance is required."
            ),
        }

    if (
        old_version.policy_id
        != new_version.policy_id
    ):
        return {
            "success": False,
            "error": (
                "Policy versions belong to "
                "different company policies."
            ),
        }

    if old_version.id == new_version.id:
        return {
            "success": False,
            "error": (
                "Two different policy versions "
                "must be selected."
            ),
        }

    old_rules = _get_version_rule_map(
        old_version
    )

    new_rules = _get_version_rule_map(
        new_version
    )

    old_keys = set(old_rules.keys())
    new_keys = set(new_rules.keys())

    added_keys = new_keys - old_keys
    removed_keys = old_keys - new_keys
    common_keys = old_keys & new_keys

    added = []
    removed = []
    modified = []
    unchanged = []

    # --------------------------------------------------------
    # Added rules
    # --------------------------------------------------------

    for key in sorted(added_keys):
        rule = new_rules[key]

        added.append({
            "change_type": "ADDED",
            "rule_key": {
                "company_role_id": str(
                    rule.company_role_id
                ),
                "company_role_name": (
                    rule.company_role.name
                ),
                "category_name": (
                    rule.category_name
                ),
            },
            "new_rule": _serialize_rule(
                rule
            ),
            "message": (
                f"New policy rule added for "
                f"{rule.company_role.name} - "
                f"{rule.category_name}."
            ),
        })

    # --------------------------------------------------------
    # Removed rules
    # --------------------------------------------------------

    for key in sorted(removed_keys):
        rule = old_rules[key]

        removed.append({
            "change_type": "REMOVED",
            "rule_key": {
                "company_role_id": str(
                    rule.company_role_id
                ),
                "company_role_name": (
                    rule.company_role.name
                ),
                "category_name": (
                    rule.category_name
                ),
            },
            "old_rule": _serialize_rule(
                rule
            ),
            "message": (
                f"Policy rule removed for "
                f"{rule.company_role.name} - "
                f"{rule.category_name}."
            ),
        })

    # --------------------------------------------------------
    # Modified or unchanged rules
    # --------------------------------------------------------

    for key in sorted(common_keys):
        old_rule = old_rules[key]
        new_rule = new_rules[key]

        field_changes = (
            _compare_rule_fields(
                old_rule,
                new_rule,
            )
        )

        if field_changes:
            modified_summary = (
                _build_modified_summary(
                    old_rule,
                    new_rule,
                    field_changes,
                )
            )

            modified.append({
                "change_type": "MODIFIED",

                "rule_key": {
                    "company_role_id": str(
                        new_rule.company_role_id
                    ),
                    "company_role_name": (
                        new_rule.company_role.name
                    ),
                    "category_name": (
                        new_rule.category_name
                    ),
                },

                "old_rule": _serialize_rule(
                    old_rule
                ),

                "new_rule": _serialize_rule(
                    new_rule
                ),

                "field_changes": field_changes,

                "change_count": len(
                    field_changes
                ),

                "summary": modified_summary,
            })

        elif include_unchanged:
            unchanged.append({
                "change_type": "UNCHANGED",

                "rule_key": {
                    "company_role_id": str(
                        new_rule.company_role_id
                    ),
                    "company_role_name": (
                        new_rule.company_role.name
                    ),
                    "category_name": (
                        new_rule.category_name
                    ),
                },

                "rule": _serialize_rule(
                    new_rule
                ),
            })

    total_changes = (
        len(added)
        + len(removed)
        + len(modified)
    )

    changed_roles = sorted(
        {
            item["rule_key"][
                "company_role_name"
            ]
            for item in (
                added
                + removed
                + modified
            )
        }
    )

    changed_categories = sorted(
        {
            item["rule_key"][
                "category_name"
            ]
            for item in (
                added
                + removed
                + modified
            )
        }
    )

    return {
        "success": True,

        "old_version": _serialize_version(
            old_version
        ),

        "new_version": _serialize_version(
            new_version
        ),

        "summary": {
            "total_changes": total_changes,
            "added_rules": len(added),
            "removed_rules": len(removed),
            "modified_rules": len(modified),
            "unchanged_rules": len(
                unchanged
            ),
            "changed_roles": changed_roles,
            "changed_categories": (
                changed_categories
            ),
            "has_changes": (
                total_changes > 0
            ),
        },

        "added": added,
        "removed": removed,
        "modified": modified,

        "unchanged": (
            unchanged
            if include_unchanged
            else []
        ),
    }