from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from tenants.models import CompanySMTPConfig
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

    try:
        smtp_config = CompanySMTPConfig.objects.get(
            company=report.company,
            is_active=True
        )

        from_email = (
            f"{smtp_config.from_email_name} "
            f"<{smtp_config.smtp_email}>"
        )

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

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[employee_email],
            cc=cc_emails,
        )

        email.attach_alternative(
            html_content,
            "text/html"
        )

        connection = email.get_connection(
            host=smtp_config.smtp_host,
            port=smtp_config.smtp_port,
            username=smtp_config.smtp_email,
            password=smtp_config.smtp_password,
            use_tls=smtp_config.use_tls,
        )

        connection.open()
        email.connection = connection
        email.send()
        connection.close()

        return {
            "success": True,
            "message": "Email sent successfully.",
            "to": employee_email,
            "cc": cc_emails,
        }

    except CompanySMTPConfig.DoesNotExist:
        return {
            "success": False,
            "error": "SMTP configuration not found."
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }