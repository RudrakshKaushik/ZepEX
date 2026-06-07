from celery import shared_task

from .models import ExpenseReceipt
from .services import extract_receipt_with_gemini


@shared_task
def process_receipt_ai_task(receipt_id):
    try:
        receipt = ExpenseReceipt.objects.get(id=receipt_id)
        result = extract_receipt_with_gemini(receipt)
        return result

    except ExpenseReceipt.DoesNotExist:
        return {
            "success": False,
            "error": "Receipt not found."
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