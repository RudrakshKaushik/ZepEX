from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection

from tenants.models import CompanySMTPConfig


def _send_with_connection(
    *,
    subject,
    text_content,
    html_content,
    from_email,
    to_emails,
    cc_emails,
    host,
    port,
    username,
    password,
    use_tls,
):
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=from_email,
        to=to_emails,
        cc=cc_emails or [],
    )

    if html_content:
        email.attach_alternative(html_content, "text/html")

    connection = get_connection(
        host=host,
        port=port,
        username=username,
        password=password,
        use_tls=use_tls,
    )
    connection.open()
    email.connection = connection
    email.send()
    connection.close()

    return {"success": True}


def send_company_email(
    company,
    *,
    subject,
    text_content,
    html_content=None,
    to_emails,
    cc_emails=None,
):
    to_emails = [email for email in to_emails if email]
    if not to_emails:
        return {"success": False, "error": "No recipient email provided."}

    try:
        smtp_config = CompanySMTPConfig.objects.get(
            company=company,
            is_active=True,
        )
        from_email = (
            f"{smtp_config.from_email_name} "
            f"<{smtp_config.smtp_email}>"
        )
        return _send_with_connection(
            subject=subject,
            text_content=text_content,
            html_content=html_content,
            from_email=from_email,
            to_emails=to_emails,
            cc_emails=cc_emails,
            host=smtp_config.smtp_host,
            port=smtp_config.smtp_port,
            username=smtp_config.smtp_email,
            password=smtp_config.smtp_password,
            use_tls=smtp_config.use_tls,
        )
    except CompanySMTPConfig.DoesNotExist:
        if not settings.EMAIL_HOST or not settings.EMAIL_HOST_USER:
            return {
                "success": False,
                "error": (
                    "SMTP is not configured. Add SMTP under Admin → Settings, "
                    "or set EMAIL_HOST / SMTP_HOST in the server environment."
                ),
            }

        from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
        return _send_with_connection(
            subject=subject,
            text_content=text_content,
            html_content=html_content,
            from_email=from_email,
            to_emails=to_emails,
            cc_emails=cc_emails,
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS,
        )
    except Exception as exc:
        return {"success": False, "error": str(exc)}
