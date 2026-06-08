from django.core.mail import EmailMultiAlternatives
from django.conf import settings

from tenants.models import CompanySMTPConfig


def send_report_status_email(report, subject, message):
    employee_email = report.employee.user.email

    try:
        smtp_config = CompanySMTPConfig.objects.get(
            company=report.company,
            is_active=True
        )

        from_email = (
            f"{smtp_config.from_email_name} "
            f"<{smtp_config.smtp_email}>"
        )

        email = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=from_email,
            to=[employee_email],
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
            "message": "Email sent successfully."
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