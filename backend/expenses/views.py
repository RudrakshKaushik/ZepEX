from datetime import date

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from tenants.models import Company, UserProfile

from .models import (
    ExpenseReport,
    ExpenseSubmission,
    ExpenseReceipt
)

from .serializers import ExpenseReceiptSerializer
from .services import extract_receipt_with_gemini

from django.utils import timezone
from .models import ApprovalHistory
from .serializers import ExpenseReportSerializer
from django.utils import timezone
from .tasks import process_receipt_ai_task
from .report_utils import get_or_create_current_month_report
from audit_logs.utils import create_audit_log
from audit_logs.utils import create_audit_log
from .models import ExpenseLineItem



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_receipt(request):
    profile = request.user.profile

    if profile.role not in ["EMPLOYEE", "MANAGER"]:
        return Response(
            {"error": "Only employees and managers can upload receipts."},
            status=status.HTTP_403_FORBIDDEN
        )

    receipt_file = request.FILES.get("receipt_file")

    if not receipt_file:
        return Response(
            {"error": "receipt_file is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.department:
        return Response(
            {"error": "User is not assigned to any department."},
            status=status.HTTP_400_BAD_REQUEST
        )

    report = get_or_create_current_month_report(profile)

    if report.status != ExpenseReport.STATUS_DRAFT:
        return Response(
            {
                "error": "Current month report is already submitted. You cannot add more receipts."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    submission = ExpenseSubmission.objects.create(
        report=report,
        company=profile.company,
        employee=profile,
        source=ExpenseSubmission.SOURCE_WEB
    )

    receipt = ExpenseReceipt.objects.create(
        report=report,
        submission=submission,
        company=profile.company,
        employee=profile,
        department=profile.department,
        receipt_file=receipt_file,
        status=ExpenseReceipt.STATUS_AI_PROCESSING
    )

    process_receipt_ai_task.delay(str(receipt.id))

    create_audit_log(
        company=profile.company,
        action="RECEIPT_UPLOADED",
        action_by=profile,
        message=f"Receipt uploaded by {request.user.email}",
        metadata={
            "receipt_id": str(receipt.id),
            "report_id": str(report.id),
            "submission_id": str(submission.id),
            "filename": receipt.receipt_file.name,
            "source": ExpenseSubmission.SOURCE_WEB,
        }
    )

    create_audit_log(
        company=profile.company,
        action="AI_PROCESSING_STARTED",
        action_by=profile,
        message="AI extraction started for uploaded receipt.",
        metadata={
            "receipt_id": str(receipt.id),
            "report_id": str(report.id),
        }
    )

    serializer = ExpenseReceiptSerializer(receipt)

    return Response(
        {
            "message": "Receipt uploaded successfully. AI processing started.",
            "report_id": report.id,
            "receipt": serializer.data,
            "ai_processing": "started"
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def email_ingest_receipt(request):
    sender_email = request.data.get("sender_email")
    reimbursement_email_prefix = request.data.get("reimbursement_email_prefix")
    email_subject = request.data.get("subject", "")

    receipt_file = request.FILES.get("receipt_file")

    if not sender_email or not reimbursement_email_prefix:
        return Response(
            {
                "error": "sender_email and reimbursement_email_prefix are required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not receipt_file:
        return Response(
            {
                "error": "Email received, but no receipt attachment found."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        company = Company.objects.get(
            reimbursement_email_prefix=reimbursement_email_prefix,
            is_verified=True
        )
    except Company.DoesNotExist:
        return Response(
            {"error": "Company not found or not verified."},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        employee = UserProfile.objects.get(
            user__email=sender_email,
            company=company,
            role__in=["EMPLOYEE", "MANAGER"]
        )
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Sender is not a registered employee or manager of this company."},
            status=status.HTTP_404_NOT_FOUND
        )

    if not employee.department:
        return Response(
            {"error": "User is not assigned to any department."},
            status=status.HTTP_400_BAD_REQUEST
        )

    report = get_or_create_current_month_report(employee)

    if report.status != ExpenseReport.STATUS_DRAFT:
        return Response(
            {
                "error": "Current month report is already submitted. Email receipts cannot be added."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    submission = ExpenseSubmission.objects.create(
        report=report,
        company=company,
        employee=employee,
        source=ExpenseSubmission.SOURCE_EMAIL,
        email_subject=email_subject
    )

    receipt = ExpenseReceipt.objects.create(
        report=report,
        submission=submission,
        company=company,
        employee=employee,
        department=employee.department,
        receipt_file=receipt_file,
        status=ExpenseReceipt.STATUS_AI_PROCESSING
    )

    process_receipt_ai_task.delay(str(receipt.id))

    create_audit_log(
        company=company,
        action="EMAIL_RECEIPT_RECEIVED",
        action_by=employee,
        message=f"Receipt received via reimbursement email from {sender_email}",
        metadata={
            "receipt_id": str(receipt.id),
            "report_id": str(report.id),
            "submission_id": str(submission.id),
            "email_subject": email_subject,
            "source": ExpenseSubmission.SOURCE_EMAIL,
        }
    )

    create_audit_log(
        company=company,
        action="AI_PROCESSING_STARTED",
        action_by=employee,
        message="AI extraction started for email receipt.",
        metadata={
            "receipt_id": str(receipt.id),
            "report_id": str(report.id),
        }
    )

    serializer = ExpenseReceiptSerializer(receipt)

    return Response(
        {
            "message": "Email receipt ingested successfully. AI processing started.",
            "report_id": report.id,
            "receipt": serializer.data,
            "ai_processing": "started"
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_current_month_report(request):
    profile = request.user.profile

    if profile.role not in ["EMPLOYEE", "MANAGER"]:
        return Response(
            {"error": "Only employees and managers can submit reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    current_month = date.today().replace(day=1)

    try:
        report = ExpenseReport.objects.get(
            company=profile.company,
            employee=profile,
            month=current_month,
            status=ExpenseReport.STATUS_DRAFT
        )
    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "No draft report found for current month."},
            status=status.HTTP_404_NOT_FOUND
        )

    if not report.receipts.exists():
        return Response(
            {"error": "Cannot submit an empty report."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if profile.role == "MANAGER":
        report.status = ExpenseReport.STATUS_PENDING_ACCOUNTS
        receipt_status = ExpenseReceipt.STATUS_PENDING_ACCOUNTS
        message = "Manager report submitted directly to accounts."
        comments = "Manager monthly expense report submitted directly to accounts."
    else:
        report.status = ExpenseReport.STATUS_SUBMITTED
        receipt_status = ExpenseReceipt.STATUS_SUBMITTED_TO_MANAGER
        message = "Monthly report submitted successfully."
        comments = "Monthly expense report submitted to manager."

    report.submitted_at = timezone.now()
    report.save(update_fields=["status", "submitted_at", "updated_at"])

    report.receipts.all().update(
        status=receipt_status
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_REPORT_SUBMITTED,
        comments=comments
    )

    serializer = ExpenseReportSerializer(report)

    return Response(
        {
            "message": message,
            "report": serializer.data
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_pending_reports(request):
    profile = request.user.profile

    if profile.role != "MANAGER":
        return Response(
            {"error": "Only managers can view pending reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    reports = ExpenseReport.objects.filter(
        company=profile.company,
        department=profile.department,
        status=ExpenseReport.STATUS_SUBMITTED
    ).select_related(
        "employee",
        "employee__user",
        "department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    )

    serializer = ExpenseReportSerializer(
        reports,
        many=True
    )

    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_approve_report(request, report_id):
    profile = request.user.profile

    if profile.role != "MANAGER":
        return Response(
            {"error": "Only managers can approve reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        report = ExpenseReport.objects.get(
            id=report_id,
            company=profile.company,
            department=profile.department,
            status=ExpenseReport.STATUS_SUBMITTED
        )
    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "Report not found or not pending for approval."},
            status=status.HTTP_404_NOT_FOUND
        )

    notes = request.data.get("notes", "")

    report.status = ExpenseReport.STATUS_PENDING_ACCOUNTS
    report.manager_notes = notes
    report.manager_action_at = timezone.now()

    report.save(update_fields=[
        "status",
        "manager_notes",
        "manager_action_at",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_PENDING_ACCOUNTS,
        manager_notes=notes
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_MANAGER_APPROVED,
        comments=notes
    )

    create_audit_log(
        company=profile.company,
        action="MANAGER_APPROVED",
        action_by=profile,
        message=f"Manager approved expense report {report.id}",
        metadata={
            "report_id": str(report.id),
            "employee_email": report.employee.user.email,
            "department": report.department.name if report.department else None,
            "total_amount": str(report.total_amount),
            "notes": notes,
        }
    )

    serializer = ExpenseReportSerializer(report)

    return Response({
        "message": "Report approved by manager and sent to accounts.",
        "report": serializer.data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_reject_report(request, report_id):
    profile = request.user.profile

    if profile.role != "MANAGER":
        return Response(
            {"error": "Only managers can reject reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        report = ExpenseReport.objects.get(
            id=report_id,
            company=profile.company,
            department=profile.department,
            status=ExpenseReport.STATUS_SUBMITTED
        )
    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "Report not found or not pending for approval."},
            status=status.HTTP_404_NOT_FOUND
        )

    notes = request.data.get("notes", "")

    if not notes:
        return Response(
            {"error": "Rejection notes are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    report.status = ExpenseReport.STATUS_MANAGER_REJECTED
    report.manager_notes = notes
    report.manager_action_at = timezone.now()

    report.save(update_fields=[
        "status",
        "manager_notes",
        "manager_action_at",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_MANAGER_REJECTED,
        manager_notes=notes
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_MANAGER_REJECTED,
        comments=notes
    )

    create_audit_log(
        company=profile.company,
        action="MANAGER_REJECTED",
        action_by=profile,
        message=f"Manager rejected expense report {report.id}",
        metadata={
            "report_id": str(report.id),
            "employee_email": report.employee.user.email,
            "department": report.department.name if report.department else None,
            "total_amount": str(report.total_amount),
            "rejection_reason": notes,
        }
    )

    serializer = ExpenseReportSerializer(report)

    return Response({
        "message": "Report rejected by manager.",
        "report": serializer.data
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_month_report(request):
    profile = request.user.profile

    if profile.role not in ["EMPLOYEE", "MANAGER"]:
        return Response(
            {"error": "Only employees and managers can view their report."},
            status=status.HTTP_403_FORBIDDEN
        )

    current_month = date.today().replace(day=1)

    try:
        report = ExpenseReport.objects.get(
            company=profile.company,
            employee=profile,
            month=current_month
        )
    except ExpenseReport.DoesNotExist:
        return Response(
            {"message": "No report found for current month."},
            status=status.HTTP_404_NOT_FOUND
        )

    no_violation_receipts = report.receipts.filter(
        has_any_violation=False
    )

    violation_receipts = report.receipts.filter(
        has_any_violation=True
    )

    return Response({
        "report_id": report.id,
        "month": report.month,
        "status": report.status,
        "total_amount": report.total_amount,
        "manager_notes": report.manager_notes,
        "accounts_notes": report.accounts_notes,

        "no_violation_receipts": ExpenseReceiptSerializer(
            no_violation_receipts,
            many=True
        ).data,

        "violation_receipts": ExpenseReceiptSerializer(
            violation_receipts,
            many=True
        ).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def accounts_pending_reports(request):
    profile = request.user.profile

    if profile.role != "ACCOUNTS":
        return Response(
            {"error": "Only accounts department can view pending reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    reports = ExpenseReport.objects.filter(
        company=profile.company,
        status=ExpenseReport.STATUS_PENDING_ACCOUNTS
    ).select_related(
        "employee",
        "employee__user",
        "department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).order_by("-submitted_at")

    serializer = ExpenseReportSerializer(
        reports,
        many=True
    )

    return Response({
        "total_pending_reports": reports.count(),
        "reports": serializer.data
    })    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accounts_approve_report(request, report_id):
    profile = request.user.profile

    if profile.role != "ACCOUNTS":
        return Response(
            {"error": "Only accounts department can approve reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        report = ExpenseReport.objects.get(
            id=report_id,
            company=profile.company,
            status=ExpenseReport.STATUS_PENDING_ACCOUNTS
        )
    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "Report not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    notes = request.data.get("notes", "")

    report.status = ExpenseReport.STATUS_ACCOUNTS_APPROVED
    report.accounts_notes = notes
    report.accounts_action_at = timezone.now()
    report.save(update_fields=[
        "status",
        "accounts_notes",
        "accounts_action_at",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_ACCOUNTS_APPROVED,
        accounts_notes=notes
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_ACCOUNTS_APPROVED,
        comments=notes
    )

    create_audit_log(
        company=profile.company,
        action="ACCOUNTS_APPROVED",
        action_by=profile,
        message=f"Accounts approved expense report {report.id}",
        metadata={
            "report_id": str(report.id),
            "employee_email": report.employee.user.email,
            "department": report.department.name if report.department else None,
            "total_amount": str(report.total_amount),
            "notes": notes,
        }
    )

    serializer = ExpenseReportSerializer(report)

    return Response({
        "message": "Report approved by accounts.",
        "report": serializer.data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accounts_reject_report(request, report_id):
    profile = request.user.profile

    if profile.role != "ACCOUNTS":
        return Response(
            {"error": "Only accounts department can reject reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        report = ExpenseReport.objects.get(
            id=report_id,
            company=profile.company,
            status=ExpenseReport.STATUS_PENDING_ACCOUNTS
        )
    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "Report not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    notes = request.data.get("notes", "")

    if not notes:
        return Response(
            {"error": "Rejection notes are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    report.status = ExpenseReport.STATUS_REJECTED
    report.accounts_notes = notes
    report.accounts_action_at = timezone.now()
    report.save(update_fields=[
        "status",
        "accounts_notes",
        "accounts_action_at",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_REJECTED,
        accounts_notes=notes
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_ACCOUNTS_REJECTED,
        comments=notes
    )

    create_audit_log(
        company=profile.company,
        action="ACCOUNTS_REJECTED",
        action_by=profile,
        message=f"Accounts rejected expense report {report.id}",
        metadata={
            "report_id": str(report.id),
            "employee_email": report.employee.user.email,
            "department": report.department.name if report.department else None,
            "total_amount": str(report.total_amount),
            "rejection_reason": notes,
        }
    )

    serializer = ExpenseReportSerializer(report)

    return Response({
        "message": "Report rejected by accounts.",
        "report": serializer.data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accounts_mark_paid(request, report_id):
    profile = request.user.profile

    if profile.role != "ACCOUNTS":
        return Response(
            {"error": "Only accounts department can mark paid."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        report = ExpenseReport.objects.get(
            id=report_id,
            company=profile.company,
            status=ExpenseReport.STATUS_ACCOUNTS_APPROVED
        )
    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "Report not found or not approved by accounts."},
            status=status.HTTP_404_NOT_FOUND
        )

    notes = request.data.get("notes", "")

    report.status = ExpenseReport.STATUS_PAID
    report.accounts_notes = notes or report.accounts_notes
    report.paid_at = timezone.now()
    report.save(update_fields=[
        "status",
        "accounts_notes",
        "paid_at",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_PAID,
        accounts_notes=report.accounts_notes
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_PAID,
        comments=notes
    )

    create_audit_log(
        company=profile.company,
        action="MARKED_PAID",
        action_by=profile,
        message=f"Expense report {report.id} marked as paid.",
        metadata={
            "report_id": str(report.id),
            "employee_email": report.employee.user.email,
            "department": report.department.name if report.department else None,
            "total_amount": str(report.total_amount),
            "notes": notes,
        }
    )

    serializer = ExpenseReportSerializer(report)

    return Response({
        "message": "Report marked as paid.",
        "report": serializer.data
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_expense_line_item(request, line_item_id):
    profile = request.user.profile

    try:
        line_item = ExpenseLineItem.objects.select_related(
            "receipt",
            "receipt__report"
        ).get(
            id=line_item_id,
            receipt__company=profile.company,
            receipt__employee=profile
        )

    except ExpenseLineItem.DoesNotExist:
        return Response(
            {"error": "Line item not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    report = line_item.receipt.report

    if report.status != ExpenseReport.STATUS_DRAFT:
        return Response(
            {"error": "You can delete line items only before submitting the monthly report."},
            status=status.HTTP_400_BAD_REQUEST
        )

    receipt = line_item.receipt

    deleted_metadata = {
        "line_item_id": str(line_item.id),
        "receipt_id": str(receipt.id),
        "report_id": str(report.id),
        "description": line_item.description,
        "category": line_item.category,
        "amount": str(line_item.amount),
        "vendor": line_item.vendor,
    }

    line_item.delete()

    create_audit_log(
        company=profile.company,
        action="LINE_ITEM_DELETED",
        action_by=profile,
        message=f"Line item deleted by {profile.user.email}",
        metadata=deleted_metadata
    )

    return Response(
        {"message": "Expense line item deleted successfully."},
        status=status.HTTP_200_OK
    )

from .tasks import (
    process_receipt_ai_task,
    fetch_all_reimbursement_emails_task,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def trigger_reimbursement_email_fetch(request):
    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can trigger email fetch."},
            status=status.HTTP_403_FORBIDDEN
        )

    fetch_all_reimbursement_emails_task.delay()

    return Response({
        "message": "Email fetching started in background."
    })    