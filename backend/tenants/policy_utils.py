from .models import CompanyRole, PolicyCategoryRule


def get_policy_rule_for_employee(employee, category_name):
    """
    Returns role-based policy rule.
    If employee role rule does not exist, falls back to Employee role rule.
    """

    if not employee or not employee.company or not category_name:
        return None

    category_name = category_name.strip().lower()

    policy = getattr(employee.company, "policy", None)

    if not policy:
        return None

    if employee.company_role:
        role_rule = PolicyCategoryRule.objects.filter(
            policy=policy,
            company_role=employee.company_role,
            category_name__iexact=category_name,
            is_active=True,
        ).first()

        if role_rule:
            return role_rule

    employee_role = CompanyRole.objects.filter(
        company=employee.company,
        name__iexact="Employee",
        is_active=True,
    ).first()

    if not employee_role:
        return None

    return PolicyCategoryRule.objects.filter(
        policy=policy,
        company_role=employee_role,
        category_name__iexact=category_name,
        is_active=True,
    ).first()

from .models import (
    CompanyRole,
    PolicyCategoryRule,
)


def get_effective_policy_rules(company, company_role):
    """
    Returns effective policy rules for a role.

    If a rule is not found for the requested role,
    the Employee role rule is used.
    """

    employee_role = CompanyRole.objects.filter(
        company=company,
        name__iexact="Employee",
        is_active=True,
    ).first()

    employee_rules = {}

    if employee_role:

        for rule in PolicyCategoryRule.objects.filter(
            policy__company=company,
            company_role=employee_role,
            is_active=True,
        ):

            employee_rules[
                rule.category_name.lower()
            ] = {
                "id": str(rule.id),
                "category": rule.category_name,
                "limit": str(rule.max_amount),
                "description": rule.category_description,
                "source_role": employee_role.name,
                "inherited": False,
            }

    role_rules = PolicyCategoryRule.objects.filter(
        policy__company=company,
        company_role=company_role,
        is_active=True,
    )

    effective = employee_rules.copy()

    for rule in role_rules:

        effective[
            rule.category_name.lower()
        ] = {
            "id": str(rule.id),
            "category": rule.category_name,
            "limit": str(rule.max_amount),
            "description": rule.category_description,
            "source_role": company_role.name,
            "inherited": False,
        }

    if company_role != employee_role:

        for category, data in effective.items():

            if data["source_role"] == employee_role.name:
                data["inherited"] = True

    return sorted(
        effective.values(),
        key=lambda x: x["category"]
    )

from decimal import Decimal


def simulate_policy(
    *,
    company,
    company_role,
    category,
    amount,
):
    """
    Simulates whether a receipt would violate policy.
    """

    rules = get_effective_policy_rules(
        company,
        company_role,
    )

    category = category.strip().lower()

    selected_rule = None

    for rule in rules:

        if rule["category"].lower() == category:
            selected_rule = rule
            break

    if selected_rule is None:

        return {
            "allowed": False,
            "reason": "No policy rule found.",
        }

    limit = Decimal(selected_rule["limit"])

    return {
        "allowed": Decimal(amount) <= limit,
        "entered_amount": str(amount),
        "limit": str(limit),
        "category": category,
        "source_role": selected_rule["source_role"],
        "inherited": selected_rule["inherited"],
        "violation": Decimal(amount) > limit,
    }