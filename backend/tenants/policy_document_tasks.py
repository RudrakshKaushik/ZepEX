import logging
import threading

from celery import shared_task
from django.conf import settings
from django.core.files.base import File

from audit_logs.utils import create_audit_log
from tenants.models import PolicyDocumentImport
from tenants.policy_document_service import extract_policy_document

logger = logging.getLogger(__name__)


def classify_policy_extraction_error(error_message):
    message = str(error_message or "").lower()

    if "api key" in message:
        return "GEMINI_API_KEY_ERROR"

    if "404" in message or "model not found" in message or "not found" in message:
        return "GEMINI_MODEL_NOT_FOUND"

    if "429" in message or "quota" in message or "rate limit" in message:
        return "GEMINI_RATE_LIMIT"

    if "timeout" in message or "timed out" in message:
        return "GEMINI_TIMEOUT"

    if "json" in message or "schema" in message or "validation" in message:
        return "AI_RESPONSE_VALIDATION_ERROR"

    if "unsupported" in message or "mime" in message or "file type" in message:
        return "UNSUPPORTED_FILE"

    if "empty" in message or "no readable content" in message:
        return "UNREADABLE_DOCUMENT"

    return "POLICY_EXTRACTION_FAILED"


def run_policy_document_import_processing(import_id: str) -> None:
    """
    Extract policy rules with AI and validate the preview JSON.
    Updates PolicyDocumentImport status for frontend polling.
    """
    from django.db import close_old_connections

    close_old_connections()

    try:
        from tenants.views import validate_policy_document_preview
    except Exception:
        logger.exception(
            "Failed to load policy document validation for import %s",
            import_id,
        )
        PolicyDocumentImport.objects.filter(id=import_id).update(
            status=PolicyDocumentImport.STATUS_FAILED,
            error_message="Policy validation module failed to load.",
        )
        return

    try:
        import_record = (
            PolicyDocumentImport.objects.select_related(
                "company",
                "uploaded_by",
            ).get(id=import_id)
        )
    except PolicyDocumentImport.DoesNotExist:
        logger.error("Policy document import %s not found.", import_id)
        return

    company = import_record.company
    filename = import_record.original_filename

    import_record.status = PolicyDocumentImport.STATUS_PROCESSING
    import_record.error_message = None
    import_record.save(update_fields=["status", "error_message", "updated_at"])

    try:
        with import_record.document.open("rb") as stored_file:
            uploaded_file = File(stored_file, name=filename)
            result = extract_policy_document(
                uploaded_file=uploaded_file,
                company=company,
            )

        if not result.get("success"):
            error_message = result.get("error") or "Policy extraction failed."
            validation_errors = result.get("validation_errors", [])

            import_record.status = PolicyDocumentImport.STATUS_FAILED
            import_record.error_message = error_message
            import_record.warnings = validation_errors
            import_record.save(
                update_fields=[
                    "status",
                    "error_message",
                    "warnings",
                    "updated_at",
                ]
            )

            create_audit_log(
                company=company,
                action="AI_POLICY_DOCUMENT_EXTRACTION_FAILED",
                action_by=import_record.uploaded_by,
                message=f"AI extraction failed for {filename}",
                metadata={
                    "import_id": str(import_record.id),
                    "filename": filename,
                    "error": error_message,
                    "validation_errors": validation_errors,
                    "status": import_record.status,
                },
            )
            return

        preview = result["preview"]
        validated_preview = validate_policy_document_preview(
            preview=preview,
            company=company,
        )

        warnings = validated_preview.get("warnings", [])
        conflicts = validated_preview.get("conflicts", [])

        import_record.extracted_json = validated_preview
        import_record.warnings = warnings
        import_record.conflicts = conflicts
        import_record.error_message = None

        import_record.status = PolicyDocumentImport.STATUS_REVIEW_REQUIRED

        import_record.save(
            update_fields=[
                "extracted_json",
                "warnings",
                "conflicts",
                "error_message",
                "status",
                "updated_at",
            ]
        )

        create_audit_log(
            company=company,
            action="AI_POLICY_DOCUMENT_EXTRACTED",
            action_by=import_record.uploaded_by,
            message=f"Policy document {filename} extracted successfully.",
            metadata={
                "import_id": str(import_record.id),
                "filename": filename,
                "status": import_record.status,
                "rules_found": validated_preview.get("rules_found", 0),
                "rules_requiring_review": validated_preview.get(
                    "rules_requiring_review",
                    0,
                ),
                "warning_count": len(warnings),
                "conflict_count": len(conflicts),
                "validation_error_count": validated_preview.get(
                    "validation_error_count",
                    0,
                ),
                "document_language": validated_preview.get("document_language"),
                "output_language": validated_preview.get("output_language"),
                "policy_currency": validated_preview.get("policy_currency"),
                "ai_model": validated_preview.get("ai_model"),
            },
        )

    except Exception as exc:
        error_message = str(exc)
        logger.exception(
            "Unexpected error processing policy document import %s",
            import_id,
        )

        import_record.status = PolicyDocumentImport.STATUS_FAILED
        import_record.error_message = error_message
        import_record.save(
            update_fields=["status", "error_message", "updated_at"]
        )

        create_audit_log(
            company=company,
            action="AI_POLICY_DOCUMENT_EXTRACTION_FAILED",
            action_by=import_record.uploaded_by,
            message=f"Unexpected error while extracting {filename}",
            metadata={
                "import_id": str(import_record.id),
                "filename": filename,
                "error": error_message,
                "status": import_record.status,
            },
        )
    finally:
        close_old_connections()


@shared_task
def process_policy_document_import_task(import_id: str) -> None:
    run_policy_document_import_processing(import_id)


def enqueue_policy_document_processing(import_id: str) -> None:
    """
    Queue extraction in Celery when a worker is available.
    In local DEBUG (or eager mode), run in a background thread so upload
    returns immediately without requiring Redis/Celery.
    """
    use_background_thread = settings.DEBUG or getattr(
        settings,
        "CELERY_TASK_ALWAYS_EAGER",
        False,
    )

    if use_background_thread:
        threading.Thread(
            target=run_policy_document_import_processing,
            args=(import_id,),
            daemon=True,
        ).start()
        logger.info(
            "Started policy document background processing for import %s",
            import_id,
        )
        return

    process_policy_document_import_task.delay(import_id)
