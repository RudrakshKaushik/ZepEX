import json

from django.conf import settings

from google import genai
import json
from typing import List, Literal

from django.conf import settings

from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError

from .language_utils import get_company_output_language


def _get_client():
    return genai.Client(
        api_key=settings.GEMINI_API_KEY
    )


def _get_model():

    return settings.GEMINI_POLICY_MODEL


def build_difference_prompt():

    return """
You are an Enterprise Expense Policy Consultant.

You are given policy differences between two policy versions.

Your job is NOT to compare.

Comparison has already been completed.

Instead,

Explain the differences.

Return ONLY JSON.

Return:

{

"overall_summary":"",

"business_impact":"",

"finance_impact":"",

"risk_level":"LOW | MEDIUM | HIGH",

"recommended_actions":[

],

"employee_impact":"",

"manager_impact":"",

"accounts_team_impact":"",

"compliance_notes":"",

"important_changes":[

]

}

Do not invent information.

Use only supplied differences.

"""


class ImportantPolicyChange(BaseModel):
    title: str
    description: str
    affected_roles: List[str] = Field(
        default_factory=list
    )
    affected_categories: List[str] = Field(
        default_factory=list
    )
    severity: Literal[
        "LOW",
        "MEDIUM",
        "HIGH",
    ] = "LOW"


class PolicyDifferenceSummary(BaseModel):
    overall_summary: str
    business_impact: str
    finance_impact: str

    risk_level: Literal[
        "LOW",
        "MEDIUM",
        "HIGH",
    ] = "LOW"

    recommended_actions: List[str] = Field(
        default_factory=list
    )

    employee_impact: str
    manager_impact: str
    accounts_team_impact: str
    compliance_notes: str

    important_changes: List[
        ImportantPolicyChange
    ] = Field(
        default_factory=list
    )

    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )

def _compact_comparison(comparison_result):
    """
    Remove unnecessary fields before sending differences to Gemini.

    The deterministic difference engine remains the source of truth.
    Gemini only explains the already calculated changes.
    """

    summary = comparison_result.get(
        "summary",
        {},
    )

    added = []

    for item in comparison_result.get(
        "added",
        [],
    ):
        rule = item.get(
            "new_rule",
            {},
        )

        added.append({
            "role": (
                rule.get("company_role", {})
                .get("name")
            ),
            "category": rule.get(
                "category_name"
            ),
            "max_amount": rule.get(
                "max_amount"
            ),
            "currency": rule.get(
                "currency"
            ),
            "is_unlimited": rule.get(
                "is_unlimited"
            ),
            "description": rule.get(
                "category_description"
            ),
            "reason": rule.get(
                "policy_reason"
            ),
        })

    removed = []

    for item in comparison_result.get(
        "removed",
        [],
    ):
        rule = item.get(
            "old_rule",
            {},
        )

        removed.append({
            "role": (
                rule.get("company_role", {})
                .get("name")
            ),
            "category": rule.get(
                "category_name"
            ),
            "max_amount": rule.get(
                "max_amount"
            ),
            "currency": rule.get(
                "currency"
            ),
            "is_unlimited": rule.get(
                "is_unlimited"
            ),
            "description": rule.get(
                "category_description"
            ),
            "reason": rule.get(
                "policy_reason"
            ),
        })

    modified = []

    for item in comparison_result.get(
        "modified",
        [],
    ):
        rule_key = item.get(
            "rule_key",
            {},
        )

        modified.append({
            "role": rule_key.get(
                "company_role_name"
            ),
            "category": rule_key.get(
                "category_name"
            ),
            "field_changes": item.get(
                "field_changes",
                [],
            ),
            "summary": item.get(
                "summary",
                {},
            ),
        })

    return {
        "old_version": comparison_result.get(
            "old_version"
        ),
        "new_version": comparison_result.get(
            "new_version"
        ),
        "statistics": summary,
        "added_rules": added,
        "removed_rules": removed,
        "modified_rules": modified,
    }


def _build_fallback_summary(
    comparison_result,
    *,
    output_language_name,
    output_language_code,
):
    """
    Return a deterministic summary when Gemini is unavailable.

    This fallback is intentionally simple and uses the comparison
    engine's verified counts.
    """

    summary = comparison_result.get(
        "summary",
        {},
    )

    added_count = summary.get(
        "added_rules",
        0,
    )

    removed_count = summary.get(
        "removed_rules",
        0,
    )

    modified_count = summary.get(
        "modified_rules",
        0,
    )

    total_changes = summary.get(
        "total_changes",
        (
            added_count
            + removed_count
            + modified_count
        ),
    )

    changed_roles = summary.get(
        "changed_roles",
        [],
    )

    changed_categories = summary.get(
        "changed_categories",
        [],
    )

    if total_changes == 0:
        overall_summary = (
            "No policy-rule changes were found between "
            "the selected versions."
        )
        risk_level = "LOW"
    else:
        overall_summary = (
            f"{total_changes} policy changes were found: "
            f"{added_count} added, "
            f"{removed_count} removed, and "
            f"{modified_count} modified."
        )

        risk_level = (
            "HIGH"
            if removed_count > 0
            else "MEDIUM"
        )

    recommended_actions = []

    if added_count:
        recommended_actions.append(
            "Review and communicate the newly added policy rules."
        )

    if removed_count:
        recommended_actions.append(
            "Confirm that removed rules are intentionally no longer applicable."
        )

    if modified_count:
        recommended_actions.append(
            "Review changed reimbursement limits and descriptions."
        )

    if total_changes:
        recommended_actions.append(
            "Notify affected employees, approvers, and finance users."
        )

    return {
        "overall_summary": overall_summary,

        "business_impact": (
            "Review the changed policy rules before applying "
            "them to employee reimbursements."
            if total_changes
            else "No business-process impact was detected."
        ),

        "finance_impact": (
            "The financial impact cannot be calculated from "
            "policy limits alone."
        ),

        "risk_level": risk_level,

        "recommended_actions": (
            recommended_actions
        ),

        "employee_impact": (
            "Employees associated with the changed roles or "
            "categories may receive different reimbursement outcomes."
            if total_changes
            else "No employee impact was detected."
        ),

        "manager_impact": (
            "Approvers should review the changed limits and conditions."
            if total_changes
            else "No manager impact was detected."
        ),

        "accounts_team_impact": (
            "The accounts team should use the new active version "
            "when validating payments."
            if total_changes
            else "No accounts-team impact was detected."
        ),

        "compliance_notes": (
            "Verify removed, prohibited, or reduced policy limits "
            "before activating the new policy version."
            if total_changes
            else "No compliance changes were detected."
        ),

        "important_changes": [],

        "confidence": 1.0,

        "generated_by": "DETERMINISTIC_FALLBACK",

        "output_language": {
            "name": output_language_name,
            "code": output_language_code,
        },

        "changed_roles": changed_roles,
        "changed_categories": changed_categories,
    }


def generate_ai_difference_summary(
    *,
    comparison_result,
    company,
):
    """
    Generate an AI explanation for an existing deterministic
    policy-version comparison.

    Important:
    - This function does not decide what changed.
    - comparison_result must come from compare_policy_versions().
    - Gemini only explains the trusted comparison result.
    """

    if not isinstance(
        comparison_result,
        dict,
    ):
        return {
            "success": False,
            "error": (
                "comparison_result must be a dictionary."
            ),
        }

    if not comparison_result.get(
        "success"
    ):
        return {
            "success": False,
            "error": (
                "A successful policy comparison "
                "is required."
            ),
        }

    language_settings = (
        get_company_output_language(
            company
        )
    )

    output_language_name = (
        language_settings.get("name")
        or "English"
    )

    output_language_code = (
        language_settings.get("code")
        or "en"
    )

    compact_comparison = (
        _compact_comparison(
            comparison_result
        )
    )

    total_changes = (
        comparison_result
        .get("summary", {})
        .get("total_changes", 0)
    )

    if total_changes == 0:
        fallback = _build_fallback_summary(
            comparison_result,
            output_language_name=(
                output_language_name
            ),
            output_language_code=(
                output_language_code
            ),
        )

        return {
            "success": True,
            "message": (
                "No changes were available for AI analysis."
            ),
            "ai_summary": fallback,
        }

    prompt = f"""
{build_difference_prompt()}

============================================================
TRUSTED COMPARISON RULES
============================================================

The supplied JSON was generated by the deterministic ZepEx
Policy Difference Engine.

Treat it as the source of truth.

You must not:

- invent added rules
- invent removed rules
- invent modified fields
- calculate new policy differences
- claim financial savings or costs without supporting data
- claim legal or regulatory impact without supporting evidence
- alter amounts, currencies, roles, or categories

You may only explain the supplied changes.

============================================================
OUTPUT LANGUAGE
============================================================

Write every human-readable field in:

{output_language_name} ({output_language_code})

Keep these values unchanged:

- currency codes
- numeric values
- policy version numbers
- normalized category keys when quoted
- role names
- risk-level enum values

risk_level and every important-change severity must remain:

LOW
MEDIUM
HIGH

============================================================
ANALYSIS REQUIREMENTS
============================================================

The response must explain:

1. The most important changes.
2. Which roles and categories are affected.
3. Possible employee impact.
4. Possible approver and manager impact.
5. Possible finance and accounts-team impact.
6. Compliance risks caused by removals, lower limits,
   prohibited rules, or currency changes.
7. Recommended operational actions.

Finance-impact rules:

- Do not predict an exact monetary impact.
- A higher limit may increase reimbursement exposure.
- A lower limit may reduce employee eligibility.
- A removed rule may create uncertainty or remove eligibility.
- A new rule may expand coverage.
- Currency changes may affect reporting and payment processing.

Risk-level guidance:

LOW:
- wording-only changes
- AI confidence changes
- source-text changes
- no material reimbursement impact

MEDIUM:
- amount increases or reductions
- new categories
- unlimited/limited changes
- requirement changes

HIGH:
- removed policy rules
- prohibited/allowed status changes
- major currency changes
- broad changes affecting multiple roles
- changes requiring compliance review

Return JSON only.

============================================================
VERIFIED POLICY DIFFERENCES
============================================================

{json.dumps(
    compact_comparison,
    indent=2,
    ensure_ascii=False,
    default=str,
)}
"""

    try:
        client = _get_client()

        response = (
            client.models.generate_content(
                model=_get_model(),
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type=(
                        "application/json"
                    ),
                    response_json_schema=(
                        PolicyDifferenceSummary
                        .model_json_schema()
                    ),
                ),
            )
        )

        if getattr(
            response,
            "parsed",
            None,
        ):
            parsed = response.parsed

            if isinstance(
                parsed,
                PolicyDifferenceSummary,
            ):
                summary_model = parsed
            else:
                summary_model = (
                    PolicyDifferenceSummary
                    .model_validate(parsed)
                )

        else:
            response_text = getattr(
                response,
                "text",
                None,
            )

            if not response_text:
                raise ValueError(
                    "Gemini returned an empty "
                    "difference summary."
                )

            summary_model = (
                PolicyDifferenceSummary
                .model_validate_json(
                    response_text
                )
            )

        ai_summary = summary_model.model_dump(
            mode="json"
        )

        ai_summary["generated_by"] = (
            "GEMINI"
        )

        ai_summary["ai_model"] = (
            _get_model()
        )

        ai_summary["output_language"] = {
            "name": output_language_name,
            "code": output_language_code,
        }

        ai_summary["comparison_statistics"] = (
            comparison_result.get(
                "summary",
                {},
            )
        )

        return {
            "success": True,
            "message": (
                "AI policy difference summary "
                "generated successfully."
            ),
            "ai_summary": ai_summary,
        }

    except (
        ValidationError,
        ValueError,
        TypeError,
        KeyError,
    ) as exc:
        fallback = _build_fallback_summary(
            comparison_result,
            output_language_name=(
                output_language_name
            ),
            output_language_code=(
                output_language_code
            ),
        )

        fallback["ai_error"] = str(exc)

        return {
            "success": True,
            "message": (
                "Gemini summary failed. A deterministic "
                "fallback summary was returned."
            ),
            "ai_summary": fallback,
        }

    except Exception as exc:
        fallback = _build_fallback_summary(
            comparison_result,
            output_language_name=(
                output_language_name
            ),
            output_language_code=(
                output_language_code
            ),
        )

        fallback["ai_error"] = str(exc)

        return {
            "success": True,
            "message": (
                "AI service was unavailable. A deterministic "
                "fallback summary was returned."
            ),
            "ai_summary": fallback,
        }