from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone

from tenants.email_utils import send_company_email


def send_company_approved_email(
    company,
    company_request,
    temporary_password,
    platform_receipt_email,
):
    login_url = getattr(
        settings,
        "FRONTEND_LOGIN_URL",
        "http://localhost:5173/login"
    )

    html_content = render_to_string(
        "emails/company_approved.html",
        {
            "admin_name": company_request.admin_name,
            "company_name": company.name,
            "admin_email": company_request.admin_email,
            "temporary_password": temporary_password,
            "reimbursement_email": company.reimbursement_email,
            "platform_receipt_email": platform_receipt_email,
            "login_url": login_url,
            "year": timezone.now().year,
        }
    )

    text_content = strip_tags(html_content)

    return send_company_email(
        company,
        subject=f"Welcome to ZepEx - {company.name}",
        text_content=text_content,
        html_content=html_content,
        to_emails=[company_request.admin_email],
    )


def send_company_rejected_email(company_request):
    support_url = getattr(
        settings,
        "FRONTEND_SUPPORT_URL",
        "http://localhost:5173/contact"
    )

    html_content = render_to_string(
        "emails/company_rejected.html",
        {
            "admin_name": company_request.admin_name,
            "company_name": company_request.company_name,
            "reject_reason": company_request.reject_reason,
            "support_url": support_url,
            "year": timezone.now().year,
        }
    )

    text_content = strip_tags(html_content)

    return send_company_email(
        None,
        subject="Company Registration Update - ZepEx",
        text_content=text_content,
        html_content=html_content,
        to_emails=[company_request.admin_email],
    )