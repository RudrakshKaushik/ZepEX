from tenants.models import UserProfile

from .models import ExpenseReport, ExpenseSubmission, ExpenseReceipt
from .report_utils import get_or_create_current_month_report


ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"]


def ingest_forwarded_receipt_email(
    *,
    sender_email,
    subject="",
    uploaded_file=None,
):
    if not sender_email:
        return {
            "success": False,
            "error": "sender_email is required."
        }

    if not uploaded_file:
        return {
            "success": False,
            "error": "Receipt attachment is required."
        }

    extension = uploaded_file.name.split(".")[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return {
            "success": False,
            "error": "Only PDF, JPG, JPEG, and PNG files are allowed."
        }

    try:
        employee = UserProfile.objects.select_related(
            "user",
            "company",
            "department",
            "company_role"
        ).get(
            user__email__iexact=sender_email,
            user__is_active=True
        )

    except UserProfile.DoesNotExist:
        return {
            "success": False,
            "error": "Sender is not a registered employee."
        }

    company = employee.company

    if not company.is_verified or not company.is_active:
        return {
            "success": False,
            "error": "Company is not active or verified."
        }

    if not employee.company_role:
        return {
            "success": False,
            "error": "Employee company role is not assigned."
        }

    if not employee.company_role.can_upload_receipt:
        return {
            "success": False,
            "error": "Employee role is not allowed to upload receipts."
        }

    if not employee.department:
        return {
            "success": False,
            "error": "Employee department is not assigned."
        }

    report = get_or_create_current_month_report(employee)

    if report.status != ExpenseReport.STATUS_DRAFT:
        return {
            "success": False,
            "error": "Current month report is already submitted."
        }

    submission = ExpenseSubmission.objects.create(
        report=report,
        company=company,
        employee=employee,
        source=ExpenseSubmission.SOURCE_EMAIL,
        email_subject=subject
    )

    receipt = ExpenseReceipt.objects.create(
        report=report,
        submission=submission,
        company=company,
        employee=employee,
        department=employee.department,
        receipt_file=uploaded_file,
        status=ExpenseReceipt.STATUS_AI_PROCESSING,
        ai_status=ExpenseReceipt.AI_PENDING,
        ai_error_message=None,
        ai_retry_count=0,
    )

    return {
        "success": True,
        "report": report,
        "submission": submission,
        "receipt": receipt,
    }