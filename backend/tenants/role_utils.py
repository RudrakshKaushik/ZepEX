from .models import CompanyRole

DEFAULT_COMPANY_ROLE_TEMPLATES = [
    {
        "name": "Employee",
        "can_upload_receipt": True,
        "can_submit_expense": True,
        "can_approve_expense": False,
        "can_mark_paid": False,
    },
    {
        "name": "Manager",
        "can_upload_receipt": False,
        "can_submit_expense": False,
        "can_approve_expense": True,
        "can_mark_paid": False,
    },
    {
        "name": "Accounts",
        "can_upload_receipt": False,
        "can_submit_expense": False,
        "can_approve_expense": False,
        "can_mark_paid": True,
    },
]

SYSTEM_ROLE_TO_DEFAULT_ROLE_NAME = {
    "EMPLOYEE": "Employee",
    "MANAGER": "Manager",
    "ACCOUNTS": "Accounts",
}


def permissions_for_profile(profile):
    if not profile or not profile.company_role:
        return {
            "can_upload_receipt": False,
            "can_submit_expense": False,
            "can_approve_expense": False,
            "can_mark_paid": False,
        }

    role = profile.company_role
    return {
        "can_upload_receipt": role.can_upload_receipt,
        "can_submit_expense": role.can_submit_expense,
        "can_approve_expense": role.can_approve_expense,
        "can_mark_paid": role.can_mark_paid,
    }


def ensure_default_company_roles(company):
    for template in DEFAULT_COMPANY_ROLE_TEMPLATES:
        CompanyRole.objects.get_or_create(
            company=company,
            name=template["name"],
            defaults={
                "can_upload_receipt": template["can_upload_receipt"],
                "can_submit_expense": template["can_submit_expense"],
                "can_approve_expense": template["can_approve_expense"],
                "can_mark_paid": template["can_mark_paid"],
                "is_active": True,
            },
        )


def resolve_company_role(company, system_role, company_role_id=None):
    if company_role_id:
        return CompanyRole.objects.filter(
            id=company_role_id,
            company=company,
            is_active=True,
        ).first()

    ensure_default_company_roles(company)

    default_name = SYSTEM_ROLE_TO_DEFAULT_ROLE_NAME.get(system_role)
    if not default_name:
        return None

    return CompanyRole.objects.filter(
        company=company,
        name__iexact=default_name,
        is_active=True,
    ).first()


def assign_missing_company_roles(company):
    from .models import UserProfile

    ensure_default_company_roles(company)
    updated = 0

    profiles = UserProfile.objects.filter(
        company=company,
        company_role__isnull=True,
        role__in=SYSTEM_ROLE_TO_DEFAULT_ROLE_NAME.keys(),
    )

    for profile in profiles:
        role = resolve_company_role(company, profile.role)
        if role:
            profile.company_role = role
            profile.save(update_fields=["company_role"])
            updated += 1

    return updated
