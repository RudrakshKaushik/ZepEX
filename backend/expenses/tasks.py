from celery import shared_task

from .models import ExpenseReceipt
from .services import extract_receipt_with_gemini
from .policy_services import validate_receipt_policy

@shared_task
def process_receipt_ai_task(receipt_id):
    try:
        receipt = ExpenseReceipt.objects.get(id=receipt_id)

        result = extract_receipt_with_gemini(receipt)

        receipt.refresh_from_db()

        if result.get("success"):
            policy_result = validate_receipt_policy(receipt)

            result["policy"] = policy_result

        return result

    except ExpenseReceipt.DoesNotExist:
        return {
            "success": False,
            "error": "Receipt not found."
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    
from tenants.models import ReimbursementEmailConfig
from .email_service import fetch_company_reimbursement_emails


@shared_task
def fetch_all_reimbursement_emails_task():
    configs = ReimbursementEmailConfig.objects.filter(
        is_active=True
    )

    results = []

    for config in configs:
        result = fetch_company_reimbursement_emails(
            str(config.id)
        )

        results.append({
            "company": config.company.name,
            "email": config.email_address,
            "result": result
        })

    return results    


from celery import shared_task
from .models import ExpenseReport
from .email_notifications import send_report_status_email
@shared_task
def send_report_status_email_task(
    report_id,
    subject,
    message,
    notify_previous_approvers=False
):
    try:
        report = ExpenseReport.objects.get(id=report_id)

        result = send_report_status_email(
            report=report,
            subject=subject,
            message=message,
            notify_previous_approvers=notify_previous_approvers
        )

        return result

    except ExpenseReport.DoesNotExist:
        return {
            "success": False,
            "error": "Report not found."
        }