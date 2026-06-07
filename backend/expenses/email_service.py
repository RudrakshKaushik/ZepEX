import email
import imaplib
from django.core.files.base import ContentFile
from django.utils import timezone

from tenants.models import ReimbursementEmailConfig, UserProfile
from .models import ExpenseReport, ExpenseSubmission, ExpenseReceipt
from .report_utils import get_or_create_current_month_report
from .tasks import process_receipt_ai_task


ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"]


def fetch_company_reimbursement_emails(config_id):
    config = ReimbursementEmailConfig.objects.get(id=config_id)

    mail = imaplib.IMAP4_SSL(
        config.imap_host,
        config.imap_port
    )

    mail.login(
        config.imap_username,
        config.imap_password
    )

    mail.select("inbox")

    status, messages = mail.search(None, "UNSEEN")

    if status != "OK":
        return {
            "success": False,
            "message": "No unread emails found."
        }

    processed_count = 0
    skipped_count = 0

    for message_id in messages[0].split():
        status, msg_data = mail.fetch(
            message_id,
            "(RFC822)"
        )

        if status != "OK":
            skipped_count += 1
            continue

        raw_email = msg_data[0][1]
        msg = email.message_from_bytes(raw_email)

        sender_email = email.utils.parseaddr(
            msg.get("From")
        )[1]

        subject = msg.get("Subject", "")

        try:
            employee = UserProfile.objects.get(
                user__email=sender_email,
                company=config.company,
                role__in=["EMPLOYEE", "MANAGER"]
            )
        except UserProfile.DoesNotExist:
            skipped_count += 1
            continue

        if not employee.department:
            skipped_count += 1
            continue

        attachments_found = False

        for part in msg.walk():
            if part.get_content_disposition() != "attachment":
                continue

            filename = part.get_filename()

            if not filename:
                continue

            extension = filename.split(".")[-1].lower()

            if extension not in ALLOWED_EXTENSIONS:
                continue

            file_data = part.get_payload(decode=True)

            if not file_data:
                continue

            attachments_found = True

            report = get_or_create_current_month_report(employee)

            if report.status != ExpenseReport.STATUS_DRAFT:
                skipped_count += 1
                continue

            submission = ExpenseSubmission.objects.create(
                report=report,
                company=config.company,
                employee=employee,
                source=ExpenseSubmission.SOURCE_EMAIL,
                email_subject=subject
            )

            receipt = ExpenseReceipt.objects.create(
                report=report,
                submission=submission,
                company=config.company,
                employee=employee,
                department=employee.department,
                status=ExpenseReceipt.STATUS_AI_PROCESSING
            )

            receipt.receipt_file.save(
                filename,
                ContentFile(file_data),
                save=True
            )

            process_receipt_ai_task.delay(
                str(receipt.id)
            )

            processed_count += 1

        if not attachments_found:
            skipped_count += 1

        mail.store(message_id, "+FLAGS", "\\Seen")

    config.last_checked_at = timezone.now()
    config.save(update_fields=["last_checked_at"])

    mail.logout()

    return {
        "success": True,
        "processed_count": processed_count,
        "skipped_count": skipped_count
    }