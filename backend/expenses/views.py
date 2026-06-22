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

from .serializers import ExpenseReceiptSerializer,ExpenseReportSerializer, ApprovalHistorySerializer
from .services import extract_receipt_with_gemini
from .models import ApprovalWorkflow, ApprovalWorkflowStep
from .serializers import ApprovalWorkflowSerializer, ApprovalWorkflowStepSerializer
from django.utils import timezone
from .models import ApprovalHistory
from .serializers import ExpenseReportSerializer
from django.conf import settings
from django.utils import timezone
from .tasks import process_receipt_ai_task
from .report_utils import get_or_create_current_month_report
from audit_logs.utils import create_audit_log
from .models import ExpenseLineItem
from .tasks import send_report_status_email_task
from tenants.permissions import IsCompanyAdmin
from django.core.paginator import Paginator


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_receipt(request):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {
                "error": "Your company role is not assigned. Please contact company admin."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_upload_receipt:
        return Response(
            {"error": "Your role is not allowed to upload receipts."},
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
            "company_role": profile.company_role.name,
            "department": profile.department.name,
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

    if settings.CELERY_TASK_ALWAYS_EAGER:
        ai_result = process_receipt_ai_task(str(receipt.id))
        receipt.refresh_from_db()
        if ai_result.get("success"):
            create_audit_log(
                company=profile.company,
                action="AI_PROCESSING_COMPLETED",
                action_by=profile,
                message="AI extraction completed for uploaded receipt.",
                metadata={
                    "receipt_id": str(receipt.id),
                    "report_id": str(report.id),
                    "vendor": receipt.vendor_name,
                    "total_amount": str(receipt.total_amount),
                },
            )
        else:
            create_audit_log(
                company=profile.company,
                action="AI_PROCESSING_FAILED",
                action_by=profile,
                message=ai_result.get("error", "AI extraction failed."),
                metadata={
                    "receipt_id": str(receipt.id),
                    "report_id": str(report.id),
                    "error": ai_result.get("error"),
                },
            )
    else:
        process_receipt_ai_task.delay(str(receipt.id))
        ai_result = {"success": None, "pending": True}

    serializer = ExpenseReceiptSerializer(receipt)
    message = (
        "Receipt uploaded and processed successfully."
        if ai_result.get("success")
        else "Receipt uploaded. AI processing started."
        if ai_result.get("pending")
        else "Receipt uploaded but AI extraction failed."
    )

    return Response(
        {
            "message": "Receipt uploaded successfully. AI processing started.",
            "report_id": str(report.id),
            "receipt": serializer.data,
            "ai_result": ai_result,
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
        employee = UserProfile.objects.select_related(
            "company_role",
            "department",
            "user"
        ).get(
            user__email__iexact=sender_email,
            company=company
        )

    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Sender is not a registered user of this company."},
            status=status.HTTP_404_NOT_FOUND
        )

    if not employee.company_role:
        return Response(
            {"error": "Sender company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not employee.company_role.can_upload_receipt:
        return Response(
            {"error": "Sender role is not allowed to upload receipts."},
            status=status.HTTP_403_FORBIDDEN
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
            "company_role": employee.company_role.name,
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
            "report_id": str(report.id),
            "receipt": serializer.data,
            "ai_processing": "started"
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_current_month_report(request):
    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {
                "error": "Your company role is not assigned. Please contact company admin."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_submit_expense:
        return Response(
            {"error": "Your role is not allowed to submit expense reports."},
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

    try:
        workflow = ApprovalWorkflow.objects.get(
            company=profile.company,
            is_active=True
        )

    except ApprovalWorkflow.DoesNotExist:
        return Response(
            {"error": "Approval workflow is not configured for your company."},
            status=status.HTTP_400_BAD_REQUEST
        )

    first_step = workflow.steps.filter(
        is_active=True
    ).select_related(
        "approver_role",
        "department"
    ).order_by(
        "step_order"
    ).first()

    if not first_step:
        return Response(
            {"error": "Approval workflow has no active steps."},
            status=status.HTTP_400_BAD_REQUEST
        )

    report.status = ExpenseReport.STATUS_SUBMITTED
    report.current_workflow_step = first_step
    report.workflow_completed = False
    report.submitted_at = timezone.now()

    report.save(update_fields=[
        "status",
        "current_workflow_step",
        "workflow_completed",
        "submitted_at",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_PENDING_APPROVAL
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_REPORT_SUBMITTED,
        comments=(
            f"Monthly expense report submitted. "
            f"Current approval step: {first_step.approver_role.name}"
        )
    )

    create_audit_log(
        company=profile.company,
        action="REPORT_SUBMITTED",
        action_by=profile,
        message=f"Expense report {report.id} submitted for approval.",
        metadata={
            "report_id": str(report.id),
            "employee_email": profile.user.email,
            "current_step": first_step.step_order,
            "approver_role": first_step.approver_role.name,
            "routing_type": first_step.routing_type,
            "approval_department": (
                first_step.department.name
                if first_step.department else None
            ),
        }
    )

    serializer = ExpenseReportSerializer(report)

    return Response(
        {
            "message": "Monthly report submitted successfully.",
            "current_approval_step": {
                "step_order": first_step.step_order,
                "approver_role": first_step.approver_role.name,
                "routing_type": first_step.routing_type,
                "department": (
                    first_step.department.name
                    if first_step.department else None
                ),
            },
            "report": serializer.data
        },
        status=status.HTTP_200_OK
    )
from django.db.models import Q
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_pending_approval_reports(request):
    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_approve_expense:
        return Response(
            {"error": "Your role is not allowed to approve expense reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    reports = ExpenseReport.objects.filter(
        company=profile.company,
        current_workflow_step__approver_role=profile.company_role,
        workflow_completed=False,
        status=ExpenseReport.STATUS_SUBMITTED
    ).filter(
        Q(
            current_workflow_step__routing_type=
            ApprovalWorkflowStep.ROUTING_COMPANY
        )
        |
        Q(
            current_workflow_step__routing_type=
            ApprovalWorkflowStep.ROUTING_DEPARTMENT,
            current_workflow_step__department=profile.department
        )
        |
        Q(
            current_workflow_step__routing_type=
            ApprovalWorkflowStep.ROUTING_DEPARTMENT,
            current_workflow_step__department__isnull=True,
            department=profile.department
        )
    )

    employee_id = request.GET.get("employee_id")
    employee_email = request.GET.get("employee_email")
    department_id = request.GET.get("department_id")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    min_amount = request.GET.get("min_amount")
    max_amount = request.GET.get("max_amount")

    if employee_id:
        reports = reports.filter(employee_id=employee_id)

    if employee_email:
        reports = reports.filter(
            employee__user__email__icontains=employee_email
        )

    if department_id:
        reports = reports.filter(department_id=department_id)

    if start_date:
        reports = reports.filter(submitted_at__date__gte=start_date)

    if end_date:
        reports = reports.filter(submitted_at__date__lte=end_date)

    if min_amount:
        reports = reports.filter(total_amount__gte=min_amount)

    if max_amount:
        reports = reports.filter(total_amount__lte=max_amount)

    reports = reports.select_related(
        "employee",
        "employee__user",
        "department",
        "current_workflow_step",
        "current_workflow_step__approver_role",
        "current_workflow_step__department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items",
        "approval_history"
    ).distinct().order_by(
        "-submitted_at"
    )

    serializer = ExpenseReportSerializer(
        reports,
        many=True
    )

    return Response({
        "count": reports.count(),
        "filters": {
            "employee_id": employee_id,
            "employee_email": employee_email,
            "department_id": department_id,
            "start_date": start_date,
            "end_date": end_date,
            "min_amount": min_amount,
            "max_amount": max_amount,
        },
        "results": serializer.data
    })



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_month_report(request):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_submit_expense:
        return Response(
            {"error": "Your role is not allowed to view expense reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    current_month = date.today().replace(day=1)

    try:
        report = ExpenseReport.objects.select_related(
            "current_workflow_step",
            "current_workflow_step__approver_role",
            "current_workflow_step__department"
        ).prefetch_related(
            "receipts",
            "receipts__line_items",
            "approval_history"
        ).get(
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

        "report_id": str(report.id),

        "month": report.month,

        "status": report.status,

        "total_amount": str(report.total_amount),

        "submitted_at": report.submitted_at,

        "paid_at": report.paid_at,

        "paid_notes": report.paid_notes,

        "workflow_completed": report.workflow_completed,

        "current_workflow_step": {

            "id": str(report.current_workflow_step.id),

            "step_order":
                report.current_workflow_step.step_order,

            "approver_role":
                report.current_workflow_step.approver_role.name,

            "routing_type":
                report.current_workflow_step.routing_type,

            "department": (
                report.current_workflow_step.department.name
                if report.current_workflow_step.department
                else None
            ),

        } if report.current_workflow_step else None,

        "approval_history":
            ApprovalHistorySerializer(
                report.approval_history.all(),
                many=True
            ).data,

        "no_violation_receipts":
            ExpenseReceiptSerializer(
                no_violation_receipts,
                many=True
            ).data,

        "violation_receipts":
            ExpenseReceiptSerializer(
                violation_receipts,
                many=True
            ).data,
    })




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accounts_mark_paid(request, report_id):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_mark_paid:
        return Response(
            {"error": "Your role is not allowed to mark reports as paid."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        report = ExpenseReport.objects.select_related(
            "employee__user",
            "department"
        ).get(
            id=report_id,
            company=profile.company,
            status=ExpenseReport.STATUS_APPROVED
        )

    except ExpenseReport.DoesNotExist:

        return Response(
            {"error": "Report not found or not approved for payment."},
            status=status.HTTP_404_NOT_FOUND
        )

    notes = request.data.get("notes", "")

    report.status = ExpenseReport.STATUS_PAID
    report.paid_notes = notes
    report.paid_at = timezone.now()

    report.save(update_fields=[
        "status",
        "paid_notes",
        "paid_at",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_PAID
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
            "department": (
                report.department.name
                if report.department else None
            ),
            "total_amount": str(report.total_amount),
            "notes": notes,
        }
    )

    send_report_status_email_task.delay(
        str(report.id),
        "Reimbursement Payment Completed",
        (
            "Your reimbursement report has been paid successfully.\n\n"
            f"Notes: {notes or 'Payment completed successfully'}"
        )
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

    create_audit_log(
        company=profile.company,
        action="EMAIL_FETCH_TRIGGERED",
        action_by=profile,
        message="Reimbursement email fetch started.",
        metadata={
            "triggered_by": profile.user.email,
        }
    )

    return Response({
        "message": "Email fetching started in background."
    })

from tenants.permissions import IsCompanyAdmin

@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin,
])
def admin_employee_expenses(request, employee_id):

    company = request.user.profile.company

    try:
        employee = UserProfile.objects.select_related(
            "user",
            "department",
            "company_role"
        ).get(
            id=employee_id,
            company=company
        )

    except UserProfile.DoesNotExist:

        return Response(
            {"error": "Employee not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    reports = ExpenseReport.objects.filter(
        company=company,
        employee=employee
    ).select_related(
        "current_workflow_step",
        "current_workflow_step__approver_role",
        "current_workflow_step__department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).order_by(
        "-month",
        "-created_at"
    )

    serializer = ExpenseReportSerializer(
        reports,
        many=True
    )

    return Response({
        "employee": {
            "id": str(employee.id),

            "name": (
                f"{employee.user.first_name} "
                f"{employee.user.last_name}"
            ).strip(),

            "email": employee.user.email,

            "department": (
                employee.department.name
                if employee.department else None
            ),

            "system_role": employee.role,

            "company_role": (
                employee.company_role.name
                if employee.company_role else None
            ),
        },

        "count": reports.count(),

        "results": serializer.data
    })



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_or_update_workflow(request):

    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can configure workflow."},
            status=status.HTTP_403_FORBIDDEN
        )

    name = request.data.get(
        "name",
        "Default Workflow"
    )

    workflow, created = ApprovalWorkflow.objects.update_or_create(
        company=profile.company,
        defaults={
            "name": name,
            "is_active": True,
        }
    )

    create_audit_log(
        company=profile.company,
        action="WORKFLOW_CONFIGURED",
        action_by=profile,
        message=(
            f"Workflow '{workflow.name}' "
            f"configured by company admin."
        ),
        metadata={
            "workflow_id": workflow.id,
            "workflow_name": workflow.name,
            "created": created,
        }
    )

    serializer = ApprovalWorkflowSerializer(workflow)

    return Response({
        "message": (
            "Workflow created successfully."
            if created
            else "Workflow updated successfully."
        ),
        "workflow": serializer.data
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_workflow_step(request):

    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can add workflow steps."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        workflow = ApprovalWorkflow.objects.get(
            company=profile.company,
            is_active=True
        )

    except ApprovalWorkflow.DoesNotExist:
        return Response(
            {"error": "Please create active workflow first."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ApprovalWorkflowStepSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    approver_role = serializer.validated_data["approver_role"]

    if approver_role.company != profile.company:
        return Response(
            {"error": "Approver role does not belong to your company."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not approver_role.is_active:
        return Response(
            {"error": "Cannot create workflow step with inactive approver role."},
            status=status.HTTP_400_BAD_REQUEST
        )

    department = serializer.validated_data.get("department")

    if department:

        if department.company != profile.company:
            return Response(
                {"error": "Department does not belong to your company."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not department.is_active:
            return Response(
                {"error": "Cannot create workflow step with inactive department."},
                status=status.HTTP_400_BAD_REQUEST
            )

    step_order = serializer.validated_data["step_order"]

    if ApprovalWorkflowStep.objects.filter(
        workflow=workflow,
        step_order=step_order
    ).exists():

        return Response(
            {"error": f"Step order {step_order} already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    step = serializer.save(
        workflow=workflow,
        is_active=True
    )

    create_audit_log(
        company=profile.company,
        action="WORKFLOW_STEP_CREATED",
        action_by=profile,
        message=f"Workflow step {step.step_order} added.",
        metadata={
            "workflow_id": str(workflow.id),
            "step_order": step.step_order,
            "role": step.approver_role.name,
            "department": (
                step.department.name
                if step.department else None
            ),
            "routing_type": step.routing_type,
            "is_active": step.is_active,
        }
    )

    return Response({
        "message": "Workflow step added successfully.",
        "step": ApprovalWorkflowStepSerializer(step).data
    }, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def view_workflow(request):
    profile = request.user.profile

    try:
        workflow = ApprovalWorkflow.objects.get(
            company=profile.company,
            is_active=True
        )
    except ApprovalWorkflow.DoesNotExist:
        return Response(
            {"error": "Workflow not configured."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ApprovalWorkflowSerializer(workflow)

    return Response(serializer.data)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def deactivate_workflow_step(request, step_id):
    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can deactivate workflow steps."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        step = ApprovalWorkflowStep.objects.get(
            id=step_id,
            workflow__company=profile.company
        )

    except ApprovalWorkflowStep.DoesNotExist:
        return Response(
            {"error": "Workflow step not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    step.is_active = False
    step.save(update_fields=["is_active"])

    return Response({
        "message": "Workflow step deactivated successfully."
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_report_step(request, report_id):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        report = ExpenseReport.objects.select_related(
            "employee__user",
            "department",
            "current_workflow_step",
            "current_workflow_step__workflow",
            "current_workflow_step__approver_role",
            "current_workflow_step__department",
        ).get(
            id=report_id,
            company=profile.company,
            workflow_completed=False,
            status=ExpenseReport.STATUS_SUBMITTED
        )

    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "Report not found or not pending approval."},
            status=status.HTTP_404_NOT_FOUND
        )

    current_step = report.current_workflow_step

    if not current_step:
        return Response(
            {"error": "Workflow step not found."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if profile.company_role != current_step.approver_role:
        return Response(
            {"error": "You are not allowed to approve this report."},
            status=status.HTTP_403_FORBIDDEN
        )

    if current_step.department:

        if profile.department != current_step.department:
            return Response(
                {"error": "This approval step belongs to another department."},
                status=status.HTTP_403_FORBIDDEN
            )

    elif current_step.routing_type == ApprovalWorkflowStep.ROUTING_DEPARTMENT:

        if profile.department != report.department:
            return Response(
                {"error": "This report belongs to another department."},
                status=status.HTTP_403_FORBIDDEN
            )

    notes = request.data.get("notes", "")

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_STEP_APPROVED,
        comments=notes
    )

    create_audit_log(
        company=profile.company,
        action="STEP_APPROVED",
        action_by=profile,
        message=f"{profile.company_role.name} approved expense report {report.id}.",
        metadata={
            "report_id": str(report.id),
            "employee_email": report.employee.user.email,
            "report_department": report.department.name if report.department else None,
            "approval_department": (
                current_step.department.name
                if current_step.department else None
            ),
            "approved_by": profile.user.email,
            "approver_role": profile.company_role.name,
            "step_order": current_step.step_order,
            "notes": notes,
        }
    )

    next_step = ApprovalWorkflowStep.objects.filter(
        workflow=current_step.workflow,
        is_active=True,
        step_order__gt=current_step.step_order
    ).select_related(
        "approver_role",
        "department"
    ).order_by("step_order").first()

    if next_step:
        report.current_workflow_step = next_step

        report.save(update_fields=[
            "current_workflow_step",
            "updated_at"
        ])

        report.receipts.all().update(
            status=ExpenseReceipt.STATUS_PENDING_APPROVAL
        )

        send_report_status_email_task.delay(
            str(report.id),
            "Reimbursement Report Moved to Next Approval Step",
            (
                "Your reimbursement report has moved to the next approval step.\n\n"
                f"Next Step: {next_step.approver_role.name}\n"
                f"Routing Type: {next_step.routing_type}\n"
                f"Department: {next_step.department.name if next_step.department else 'Company/Auto'}\n"
                f"Previous Approver Notes: {notes or 'No notes'}"
            )
        )

        serializer = ExpenseReportSerializer(report)

        return Response({
            "message": "Step approved successfully. Report moved to next step.",
            "next_step": {
                "step_order": next_step.step_order,
                "role": next_step.approver_role.name,
                "routing_type": next_step.routing_type,
                "department": (
                    next_step.department.name
                    if next_step.department else None
                ),
            },
            "report": serializer.data
        })

    report.workflow_completed = True
    report.status = ExpenseReport.STATUS_APPROVED
    report.current_workflow_step = None

    report.save(update_fields=[
        "workflow_completed",
        "status",
        "current_workflow_step",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_APPROVED
    )

    send_report_status_email_task.delay(
        str(report.id),
        "Reimbursement Report Fully Approved",
        (
            "Your reimbursement report has completed all approval steps.\n\n"
            "It is now approved and waiting for payment processing."
        )
    )

    serializer = ExpenseReportSerializer(report)

    return Response({
        "message": "Workflow completed successfully. Report approved.",
        "status": report.status,
        "report": serializer.data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_report_step(request, report_id):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    notes = request.data.get("notes")

    if not notes:
        return Response(
            {"error": "Rejection reason is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        report = ExpenseReport.objects.select_related(
            "employee__user",
            "department",
            "current_workflow_step",
            "current_workflow_step__approver_role",
            "current_workflow_step__department",
        ).get(
            id=report_id,
            company=profile.company,
            workflow_completed=False,
            status=ExpenseReport.STATUS_SUBMITTED
        )

    except ExpenseReport.DoesNotExist:
        return Response(
            {"error": "Report not found or not pending approval."},
            status=status.HTTP_404_NOT_FOUND
        )

    current_step = report.current_workflow_step

    if not current_step:
        return Response(
            {"error": "Workflow step not found."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if profile.company_role != current_step.approver_role:
        return Response(
            {"error": "You are not allowed to reject this report."},
            status=status.HTTP_403_FORBIDDEN
        )

    if current_step.department:

        if profile.department != current_step.department:
            return Response(
                {"error": "This approval step belongs to another department."},
                status=status.HTTP_403_FORBIDDEN
            )

    elif current_step.routing_type == ApprovalWorkflowStep.ROUTING_DEPARTMENT:

        if profile.department != report.department:
            return Response(
                {"error": "This report belongs to another department."},
                status=status.HTTP_403_FORBIDDEN
            )

    report.status = ExpenseReport.STATUS_REJECTED
    report.current_workflow_step = None
    report.workflow_completed = True

    report.save(update_fields=[
        "status",
        "current_workflow_step",
        "workflow_completed",
        "updated_at"
    ])

    report.receipts.all().update(
        status=ExpenseReceipt.STATUS_REJECTED
    )

    ApprovalHistory.objects.create(
        report=report,
        action_by=profile,
        action=ApprovalHistory.ACTION_STEP_REJECTED,
        comments=notes
    )

    create_audit_log(
        company=profile.company,
        action="STEP_REJECTED",
        action_by=profile,
        message=f"{profile.company_role.name} rejected expense report {report.id}.",
        metadata={
            "report_id": str(report.id),
            "employee_email": report.employee.user.email,
            "report_department": report.department.name if report.department else None,
            "approval_department": (
                current_step.department.name
                if current_step.department else None
            ),
            "rejected_by": profile.user.email,
            "approver_role": profile.company_role.name,
            "step_order": current_step.step_order,
            "reason": notes,
        }
    )

    send_report_status_email_task.delay(
        str(report.id),
        "Reimbursement Report Rejected",
        (
            "Your reimbursement report has been rejected.\n\n"
            f"Rejected By Role: {profile.company_role.name}\n"
            f"Reason: {notes}"
        )
    )

    serializer = ExpenseReportSerializer(report)

    return Response({
        "message": "Report rejected successfully. Workflow stopped.",
        "status": report.status,
        "report": serializer.data
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_uploaded_expenses(request):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_submit_expense:
        return Response(
            {"error": "Your role is not allowed to view uploaded expenses."},
            status=status.HTTP_403_FORBIDDEN
        )

    reports = ExpenseReport.objects.filter(
        company=profile.company,
        employee=profile
    )

    status_filter = request.GET.get("status")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    min_amount = request.GET.get("min_amount")
    max_amount = request.GET.get("max_amount")

    if status_filter:
        reports = reports.filter(
            status=status_filter.upper()
        )

    if start_date:
        reports = reports.filter(
            submitted_at__date__gte=start_date
        )

    if end_date:
        reports = reports.filter(
            submitted_at__date__lte=end_date
        )

    if min_amount:
        reports = reports.filter(
            total_amount__gte=min_amount
        )

    if max_amount:
        reports = reports.filter(
            total_amount__lte=max_amount
        )

    reports = reports.select_related(
        "department",
        "current_workflow_step",
        "current_workflow_step__approver_role",
        "current_workflow_step__department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items",
        "approval_history"
    ).order_by(
        "-month",
        "-created_at"
    )

    serializer = ExpenseReportSerializer(
        reports,
        many=True
    )

    return Response({
        "count": reports.count(),

        "filters": {
            "status": status_filter,
            "start_date": start_date,
            "end_date": end_date,
            "min_amount": min_amount,
            "max_amount": max_amount,
        },

        "results": serializer.data
    })

from .models import DuplicateReceiptLog
from .serializers import DuplicateReceiptLogSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def duplicate_receipts(request):
    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can view duplicate receipts."},
            status=status.HTTP_403_FORBIDDEN
        )

    duplicates = DuplicateReceiptLog.objects.filter(
        original_receipt__company=profile.company
    ).select_related(
        "original_receipt",
        "duplicate_receipt",
        "original_receipt__employee__user",
        "duplicate_receipt__employee__user",
    ).order_by("-created_at")

    duplicate_type = request.GET.get("type")

    if duplicate_type:
        duplicates = duplicates.filter(
            duplicate_type=duplicate_type.upper()
        )

    serializer = DuplicateReceiptLogSerializer(
        duplicates,
        many=True
    )

    return Response({
        "count": duplicates.count(),
        "results": serializer.data
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_reports_list(request):

    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can view reports."},
            status=status.HTTP_403_FORBIDDEN
        )

    reports = ExpenseReport.objects.filter(
        company=profile.company
    )

    status_filter = request.GET.get("status")
    employee_id = request.GET.get("employee_id")
    employee_email = request.GET.get("employee_email")
    department_id = request.GET.get("department_id")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if status_filter:
        reports = reports.filter(status=status_filter.upper())

    if employee_id:
        reports = reports.filter(employee_id=employee_id)

    if employee_email:
        reports = reports.filter(
            employee__user__email__icontains=employee_email
        )

    if department_id:
        reports = reports.filter(department_id=department_id)

    if start_date:
        reports = reports.filter(created_at__date__gte=start_date)

    if end_date:
        reports = reports.filter(created_at__date__lte=end_date)

    reports = reports.select_related(
        "employee",
        "employee__user",
        "department",
        "current_workflow_step",
        "current_workflow_step__approver_role",
        "current_workflow_step__department",
    ).prefetch_related(
        "receipts",
        "receipts__line_items",
        "approval_history"
    ).order_by("-created_at")

    page = request.GET.get("page", 1)

    paginator = Paginator(reports, 10)
    page_obj = paginator.get_page(page)

    serializer = ExpenseReportSerializer(
        page_obj,
        many=True
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "filters": {
            "status": status_filter,
            "employee_id": employee_id,
            "employee_email": employee_email,
            "department_id": department_id,
            "start_date": start_date,
            "end_date": end_date,
        },
        "results": serializer.data
    })