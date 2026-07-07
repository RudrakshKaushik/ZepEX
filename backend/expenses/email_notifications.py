from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import ApprovalHistory


def send_workflow_status_email(
    *,
    report,
    subject,
    message,
    action,
    action_by,
    current_step=None,
    notes="",
    next_step=None,
    next_approver=None,
    steps_skipped=0,
    notify_previous_approvers=False,
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
        report.employee.user.get_full_name()
        or report.employee.user.email
    )

    action_by_name = (
        action_by.user.get_full_name()
        or action_by.user.email
    )

    action_by_role = (
        "COMPANY_ADMIN"
        if action_by.role == "COMPANY_ADMIN"
        else action_by.company_role.name
        if action_by.company_role
        else action_by.role
    )

    html_content = render_to_string(
        "emails/workflow_status.html",
        {
            "subject": subject,
            "message": message,

            "company_name": report.company.name,
            "employee_name": employee_name,
            "report_id": report.id,
            "month": report.month,
            "status": report.status,
            "total_amount": report.total_amount,

            "action": action,
            "action_by_name": action_by_name,
            "action_by_email": action_by.user.email,
            "action_by_role": action_by_role,

            "step_order": (
                current_step.step_order
                if current_step else None
            ),
            "approver_type": (
                current_step.get_approver_type_display()
                if current_step else None
            ),

            "notes": notes,

            "next_step_order": (
                next_step.step_order
                if next_step else None
            ),
            "next_approver_name": (
                next_approver.user.get_full_name()
                if next_approver else None
            ),
            "next_approver_email": (
                next_approver.user.email
                if next_approver else None
            ),

            "steps_skipped": steps_skipped,
        }
    )

    text_content = strip_tags(html_content)

    try:
        connection = get_connection(
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS,
        )

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[employee_email],
            cc=cc_emails,
            connection=connection,
        )

        email.attach_alternative(html_content, "text/html")
        email.send()

        return {
            "success": True,
            "to": employee_email,
            "cc": cc_emails,
        }

    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
        }