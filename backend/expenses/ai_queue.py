import logging
import threading

from django.db import transaction

from audit_logs.utils import create_audit_log

from .models import ExpenseReceipt
from .services import extract_receipt_with_gemini


logger = logging.getLogger(__name__)


def _run_receipt_ai_with_audit(
    receipt_id,
    company,
    action_by,
    report_id,
):
    try:
        receipt = ExpenseReceipt.objects.get(id=receipt_id)

        result = extract_receipt_with_gemini(receipt)

        receipt.refresh_from_db()

        if result.get("success"):
            create_audit_log(
                company=company,
                action="AI_PROCESSING_COMPLETED",
                action_by=action_by,
                message="AI extraction completed successfully.",
                metadata={
                    "receipt_id": str(receipt.id),
                    "report_id": report_id,
                    "vendor": receipt.vendor_name,
                    "total_amount": str(receipt.total_amount),
                    "ai_status": receipt.ai_status,
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
                    "ai_status": receipt.ai_status,
                },
            )

        return result

    except ExpenseReceipt.DoesNotExist:
        return {
            "success": False,
            "error": "Receipt not found."
        }

    except Exception as exc:
        logger.exception("Receipt AI processing failed.")

        create_audit_log(
            company=company,
            action="AI_PROCESSING_EXCEPTION",
            action_by=action_by,
            message=str(exc),
            metadata={
                "receipt_id": receipt_id,
                "report_id": report_id,
            },
        )

        return {
            "success": False,
            "error": str(exc),
        }


def queue_receipt_ai_processing(
    receipt_id,
    company,
    action_by,
    report_id,
):
    def start_worker():
        worker = threading.Thread(
            target=_run_receipt_ai_with_audit,
            args=(
                receipt_id,
                company,
                action_by,
                report_id,
            ),
            daemon=True,
        )

        worker.start()

    transaction.on_commit(start_worker)