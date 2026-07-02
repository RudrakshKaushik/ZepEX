import threading

from django.db import transaction

from audit_logs.utils import create_audit_log

from .models import ExpenseReceipt
from .tasks import process_receipt_ai_task


def _run_receipt_ai_with_audit(receipt_id, company, action_by, report_id):
    result = process_receipt_ai_task(receipt_id)

    try:
        receipt = ExpenseReceipt.objects.get(id=receipt_id)
    except ExpenseReceipt.DoesNotExist:
        return result

    if result.get("success"):
        create_audit_log(
            company=company,
            action="AI_PROCESSING_COMPLETED",
            action_by=action_by,
            message="AI extraction completed for uploaded receipt.",
            metadata={
                "receipt_id": str(receipt.id),
                "report_id": report_id,
                "vendor": receipt.vendor_name,
                "total_amount": str(receipt.total_amount),
            },
        )
    else:
        create_audit_log(
            company=company,
            action="AI_PROCESSING_FAILED",
            action_by=action_by,
            message=result.get("error", "AI extraction failed."),
            metadata={
                "receipt_id": str(receipt.id),
                "report_id": report_id,
                "error": result.get("error"),
                "retry_allowed": result.get("retry_allowed"),
            },
        )

    return result


def queue_receipt_ai_processing(receipt_id, company, action_by, report_id):
    def start_worker():
        thread = threading.Thread(
            target=_run_receipt_ai_with_audit,
            args=(receipt_id, company, action_by, report_id),
            daemon=True,
        )
        thread.start()

    transaction.on_commit(start_worker)
