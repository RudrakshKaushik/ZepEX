from tenants.models import CompanyPolicy
from tenants.policy_utils import get_policy_rule_for_employee
from .models import ExpenseReceipt


def validate_receipt_policy(receipt: ExpenseReceipt):

    try:
        CompanyPolicy.objects.get(
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
            "violations": [
                "No company policy configured."
            ],
            "next_status": receipt.status,
        }

    violations = []

    receipt.has_amount_violation = False
    receipt.has_any_violation = False
    receipt.policy_violation_reason = None

    company_currency = (
        receipt.company_currency
        or receipt.original_currency
    )

    line_items_count = receipt.line_items.count()

    for item in receipt.line_items.all():

        item.is_violating = False
        item.violation_reason = None

        rule = get_policy_rule_for_employee(
            employee=receipt.employee,
            category_name=item.category,
        )

        # -----------------------------------
        # No Policy Found
        # -----------------------------------

        if not rule:

            role_name = (
                receipt.employee.company_role.name
                if receipt.employee.company_role
                else "Employee"
            )

            reason = (
                f"{item.category}: No policy configured for "
                f"'{role_name}'. Employee default policy was also not found."
            )

            item.is_violating = True
            item.violation_reason = reason

            receipt.has_amount_violation = True
            violations.append(reason)

        else:

            # -----------------------------------
            # Company Currency Amount
            # -----------------------------------

            if (
                line_items_count > 1
                and receipt.original_amount
            ):
                converted_item_amount = (
                    item.amount / receipt.original_amount
                ) * receipt.company_amount

            else:
                converted_item_amount = receipt.company_amount

            # -----------------------------------
            # Unlimited Policy
            # -----------------------------------

            if rule.is_unlimited:

                pass

            # -----------------------------------
            # Invalid Policy
            # -----------------------------------

            elif rule.max_amount is None:

                reason = (
                    f"{item.category}: Policy is invalid because "
                    "no maximum amount is configured."
                )

                item.is_violating = True
                item.violation_reason = reason

                receipt.has_amount_violation = True
                violations.append(reason)

            # -----------------------------------
            # Amount Violation
            # -----------------------------------

            elif converted_item_amount > rule.max_amount:

                reason = (
                    f"{item.category}: "
                    f"{converted_item_amount:.2f} "
                    f"{company_currency} exceeds the allowed limit of "
                    f"{rule.max_amount} {rule.currency}. "
                    f"Reason: "
                    f"{rule.policy_reason or 'No policy reason provided.'} "
                    f"Original Amount: "
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

    # -----------------------------------
    # Final Report Status
    # -----------------------------------

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