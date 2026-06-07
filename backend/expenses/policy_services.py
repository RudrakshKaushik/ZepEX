from tenants.models import CompanyPolicy, PolicyCategoryRule
from .models import ExpenseReceipt


def validate_receipt_policy(receipt: ExpenseReceipt):
    company = receipt.company

    try:
        policy = CompanyPolicy.objects.get(company=company)
    except CompanyPolicy.DoesNotExist:
        receipt.status = "POLICY_VIOLATION"
        receipt.policy_violation_reason = "No company policy configured."
        receipt.save(update_fields=["status", "policy_violation_reason"])
        return {
            "success": False,
            "reason": "No company policy configured."
        }

    violations = []

    for item in receipt.line_items.all():
        category = item.category.strip().lower()

        rule = PolicyCategoryRule.objects.filter(
            policy=policy,
            category_name__iexact=category
        ).first()

        if not rule:
            item.is_violating = True
            item.violation_reason = "No matching policy rule found."
            item.save(update_fields=["is_violating", "violation_reason"])

            violations.append(
                f"{item.category}: No matching policy rule found."
            )
            continue

        if item.amount > rule.max_amount:
            item.is_violating = True
            item.violation_reason = f"Amount exceeds limit {rule.max_amount}"
            item.save(update_fields=["is_violating", "violation_reason"])

            violations.append(
                f"{item.category}: Amount {item.amount} exceeds limit {rule.max_amount}"
            )
        else:
            item.is_violating = False
            item.violation_reason = None
            item.save(update_fields=["is_violating", "violation_reason"])

    if violations:
        receipt.status = "POLICY_VIOLATION"
        receipt.policy_violation_reason = " | ".join(violations)
    else:
        receipt.status = "PENDING_MANAGER"
        receipt.policy_violation_reason = None

    receipt.save(update_fields=["status", "policy_violation_reason"])

    return {
        "success": True,
        "has_violations": bool(violations),
        "violations": violations,
        "next_status": receipt.status
    }