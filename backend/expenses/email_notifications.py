from django.template.loader import render_to_string
from django.utils.html import strip_tags

from tenants.email_utils import send_company_email
from .models import ApprovalHistory


def send_report_status_email(
    report,
    subject,
    message,
    notify_previous_approvers=False
):
    employee_email = report.employee.user.email

    cc_emails = []

    if notify_previous_approvers:
        previous_approvers = ApprovalHistory.objects.filter(
            report=report,
            action=ApprovalHistory.ACTION_STEP_APPROVED,
            action_by__isnull=False
        ).select_related("action_by__user")

        cc_emails = list(
            previous_approvers.values_list(
                "action_by__user__email",
                flat=True
            ).distinct()
        )

        cc_emails = [
            email for email in cc_emails
            if email and email != employee_email
        ]

    employee_name = (
        f"{report.employee.user.first_name} "
        f"{report.employee.user.last_name}"
    ).strip() or employee_email

    html_content = render_to_string(
        "emails/report_status.html",
        {
            "company_name": report.company.name,
            "employee_name": employee_name,
            "subject": subject,
            "message": message,
            "report_id": report.id,
            "month": report.month,
            "status": report.status,
            "total_amount": report.total_amount,
        }
    )

    text_content = strip_tags(html_content)

    return send_company_email(
        report.company,
        subject=subject,
        text_content=text_content,
        html_content=html_content,
        to_emails=[employee_email],
        cc_emails=cc_emails,
    )
