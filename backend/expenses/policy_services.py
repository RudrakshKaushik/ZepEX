from tenants.models import CompanyPolicy, PolicyCategoryRule
from .models import ExpenseReceipt


def validate_receipt_policy(receipt: ExpenseReceipt):
    try:
        policy = CompanyPolicy.objects.get(
            company=receipt.company
        )

    except CompanyPolicy.DoesNotExist:
        receipt.status = ExpenseReceipt.STATUS_POLICY_VIOLATION
        receipt.policy_violation_reason = "No company policy configured."
        receipt.has_any_violation = True

        receipt.save(update_fields=[
            "status",
            "policy_violation_reason",
            "has_any_violation",
        ])

        return {
            "success": False,
            "has_violations": True,
            "violations": ["No company policy configured."],
            "next_status": receipt.status,
        }

    violations = []

    receipt.has_amount_violation = False
    receipt.has_any_violation = False
    receipt.policy_violation_reason = None

    company_currency = receipt.company_currency or receipt.original_currency

    line_items_count = receipt.line_items.count()

    for item in receipt.line_items.all():
        item.is_violating = False
        item.violation_reason = None

        rule = PolicyCategoryRule.objects.filter(
            policy=policy,
            category_name__iexact=item.category,
            is_active=True
        ).first()

        if not rule:
            reason = f"{item.category}: No matching policy rule found."

            item.is_violating = True
            item.violation_reason = reason

            receipt.has_amount_violation = True
            violations.append(reason)

        else:
            if line_items_count > 1 and receipt.original_amount:
                converted_item_amount = (
                    item.amount / receipt.original_amount
                ) * receipt.company_amount
            else:
                converted_item_amount = receipt.company_amount

            if converted_item_amount > rule.max_amount:
                reason = (
                    f"{item.category}: Amount {converted_item_amount:.2f} "
                    f"{company_currency} exceeds limit {rule.max_amount} "
                    f"{company_currency}. Original amount was "
                    f"{item.amount} {receipt.original_currency}."
                )

                item.is_violating = True
                item.violation_reason = reason

                receipt.has_amount_violation = True
                violations.append(reason)

        item.save(update_fields=[
            "is_violating",
            "violation_reason",
        ])

    if violations:
        receipt.status = ExpenseReceipt.STATUS_POLICY_VIOLATION
        receipt.policy_violation_reason = " | ".join(violations)
        receipt.has_any_violation = True
    else:
        receipt.status = ExpenseReceipt.STATUS_VALID
        receipt.policy_violation_reason = None
        receipt.has_any_violation = False

    receipt.save(update_fields=[
        "status",
        "policy_violation_reason",
        "has_amount_violation",
        "has_any_violation",
    ])

    return {
        "success": True,
        "has_violations": bool(violations),
        "violations": violations,
        "next_status": receipt.status,
        "policy_currency": company_currency,
    }