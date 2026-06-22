from django.shortcuts import render

# Create your views here.
from datetime import date

from datetime import date

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from expenses.models import (
    ExpenseReport,
    ApprovalHistory,
    ApprovalWorkflow,
)
from expenses.serializers import ExpenseReportSerializer, ExpenseReceiptSerializer

from tenants.models import Department, UserProfile, Company
from django.db.models import Sum
from platform_management.models import CompanyRegistrationRequest

from tenants.models import (
    Department,
    UserProfile,
    Company,
    CompanyPolicy,
    ReimbursementEmailConfig,
    CompanySMTPConfig,
)
from django.db.models import Sum
from expenses.models import ExpenseLineItem

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_dashboard(request):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_submit_expense:
        return Response(
            {"error": "Your role is not allowed to access this dashboard."},
            status=status.HTTP_403_FORBIDDEN
        )

    current_month = date.today().replace(day=1)

    current_report = ExpenseReport.objects.filter(
        company=profile.company,
        employee=profile,
        month=current_month
    ).select_related(
        "department",
        "current_workflow_step",
        "current_workflow_step__approver_role",
        "current_workflow_step__department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items",
        "approval_history"
    ).first()

    all_reports = ExpenseReport.objects.filter(
        company=profile.company,
        employee=profile
    )

    submitted_reports = all_reports.exclude(
        status=ExpenseReport.STATUS_DRAFT
    ).select_related(
        "department",
        "current_workflow_step",
        "current_workflow_step__approver_role",
        "current_workflow_step__department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items",
        "approval_history"
    ).order_by("-month")

    total_reports = all_reports.count()

    draft_reports = all_reports.filter(
        status=ExpenseReport.STATUS_DRAFT
    ).count()

    pending_reports = all_reports.filter(
        status=ExpenseReport.STATUS_SUBMITTED
    ).count()

    approved_reports = all_reports.filter(
        status=ExpenseReport.STATUS_APPROVED
    ).count()

    rejected_reports = all_reports.filter(
        status=ExpenseReport.STATUS_REJECTED
    ).count()

    paid_reports = all_reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).count()

    data = {
        "user": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "system_role": profile.role,
            "company_role": profile.company_role.name,
            "company": profile.company.name,
            "department": (
                profile.department.name
                if profile.department else None
            ),
            "permissions": {
                "can_upload_receipt": profile.company_role.can_upload_receipt,
                "can_submit_expense": profile.company_role.can_submit_expense,
                "can_approve_expense": profile.company_role.can_approve_expense,
                "can_mark_paid": profile.company_role.can_mark_paid,
            }
        },

        "metrics": {
            "total_reports": total_reports,
            "draft_reports": draft_reports,
            "pending_reports": pending_reports,
            "approved_reports": approved_reports,
            "rejected_reports": rejected_reports,
            "paid_reports": paid_reports,
        },

        "current_month_report": None,

        "submitted_reports": ExpenseReportSerializer(
            submitted_reports,
            many=True
        ).data
    }

    if current_report:

        no_violation_receipts = current_report.receipts.filter(
            has_any_violation=False
        )

        violation_receipts = current_report.receipts.filter(
            has_any_violation=True
        )

        data["current_month_report"] = {
            "report": ExpenseReportSerializer(current_report).data,
            "summary": {
                "total_receipts": current_report.receipts.count(),
                "no_violation_receipts": no_violation_receipts.count(),
                "violation_receipts": violation_receipts.count(),
                "total_amount": str(current_report.total_amount),
            },
            "no_violation_receipts": ExpenseReceiptSerializer(
                no_violation_receipts,
                many=True
            ).data,
            "violation_receipts": ExpenseReceiptSerializer(
                violation_receipts,
                many=True
            ).data,
        }

    return Response(data)

from django.db.models import Q, Sum
from expenses.models import ApprovalWorkflowStep

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def approver_dashboard(request):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_approve_expense:
        return Response(
            {"error": "Your role is not allowed to approve expenses."},
            status=status.HTTP_403_FORBIDDEN
        )

    pending_reports = ExpenseReport.objects.filter(
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

    pending_reports = pending_reports.select_related(
        "employee",
        "employee__user",
        "department",
        "current_workflow_step",
        "current_workflow_step__approver_role",
        "current_workflow_step__department",
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).distinct().order_by("-submitted_at")

    approved_reports = ExpenseReport.objects.filter(
        company=profile.company,
        approval_history__action=ApprovalHistory.ACTION_STEP_APPROVED,
        approval_history__action_by=profile
    ).distinct()

    rejected_reports = ExpenseReport.objects.filter(
        company=profile.company,
        approval_history__action=ApprovalHistory.ACTION_STEP_REJECTED,
        approval_history__action_by=profile
    ).distinct()

    violation_reports = pending_reports.filter(
        receipts__has_any_violation=True
    ).distinct()

    pending_amount = pending_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    approved_amount = approved_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    rejected_amount = rejected_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    recent_pending_reports = pending_reports[:10]

    return Response({

        "approver": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "company": profile.company.name,
            "company_role": profile.company_role.name,
            "department": (
                profile.department.name
                if profile.department else None
            ),
            "permissions": {
                "can_approve_expense": profile.company_role.can_approve_expense,
                "can_mark_paid": profile.company_role.can_mark_paid,
            }
        },

        "metrics": {
            "pending_reports": pending_reports.count(),
            "approved_reports": approved_reports.count(),
            "rejected_reports": rejected_reports.count(),
            "violation_reports": violation_reports.count(),

            "pending_amount": str(pending_amount),
            "approved_amount": str(approved_amount),
            "rejected_amount": str(rejected_amount),
        },

        "recent_pending_reports": ExpenseReportSerializer(
            recent_pending_reports,
            many=True
        ).data,

        "pending_reports": ExpenseReportSerializer(
            pending_reports,
            many=True
        ).data,

        "approved_reports": ExpenseReportSerializer(
            approved_reports.order_by("-updated_at")[:10],
            many=True
        ).data,

        "rejected_reports": ExpenseReportSerializer(
            rejected_reports.order_by("-updated_at")[:10],
            many=True
        ).data,
    })

from expenses.models import ExpenseReport, ApprovalWorkflow
from tenants.models import CompanyRole

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_dashboard(request):

    profile = request.user.profile

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not profile.company_role.can_mark_paid:
        return Response(
            {"error": "Your role is not allowed to access payment dashboard."},
            status=status.HTTP_403_FORBIDDEN
        )

    reports = ExpenseReport.objects.filter(
        company=profile.company
    )

    approved_reports = reports.filter(
        status=ExpenseReport.STATUS_APPROVED
    ).select_related(
        "employee",
        "employee__user",
        "department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).order_by("-updated_at")

    paid_reports = reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).select_related(
        "employee",
        "employee__user",
        "department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).order_by("-paid_at")

    rejected_reports = reports.filter(
        status=ExpenseReport.STATUS_REJECTED
    ).select_related(
        "employee",
        "employee__user",
        "department"
    ).order_by("-updated_at")

    approved_amount = approved_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    paid_amount = paid_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    rejected_amount = rejected_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    total_reports = reports.count()

    payment_completion_rate = 0

    if total_reports > 0:
        payment_completion_rate = round(
            (paid_reports.count() / total_reports) * 100,
            2
        )

    recent_approved_reports = approved_reports[:10]
    recent_paid_reports = paid_reports[:10]

    department_payment_summary = paid_reports.values(
        "department__name"
    ).annotate(
        total_paid=Sum("total_amount")
    ).order_by("-total_paid")

    return Response({
        "payment_user": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "company": profile.company.name,
            "company_role": profile.company_role.name,
            "permissions": {
                "can_mark_paid": profile.company_role.can_mark_paid,
                "can_approve_expense": profile.company_role.can_approve_expense,
            }
        },

        "metrics": {
            "approved_reports_waiting_payment": approved_reports.count(),
            "paid_reports": paid_reports.count(),
            "rejected_reports": rejected_reports.count(),

            "approved_amount": str(approved_amount),
            "paid_amount": str(paid_amount),
            "rejected_amount": str(rejected_amount),

            "payment_completion_rate": payment_completion_rate,
        },

        "department_payment_summary": [
            {
                "department": item["department__name"] or "No Department",
                "total_paid": str(item["total_paid"] or 0),
            }
            for item in department_payment_summary
        ],

        "recent_approved_reports": ExpenseReportSerializer(
            recent_approved_reports,
            many=True
        ).data,

        "recent_paid_reports": ExpenseReportSerializer(
            recent_paid_reports,
            many=True
        ).data,

        "approved_reports": ExpenseReportSerializer(
            approved_reports,
            many=True
        ).data,

        "paid_reports": ExpenseReportSerializer(
            paid_reports,
            many=True
        ).data,

        "rejected_reports": ExpenseReportSerializer(
            rejected_reports[:10],
            many=True
        ).data,
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_admin_dashboard(request):
    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can access this dashboard."},
            status=status.HTTP_403_FORBIDDEN
        )

    company = profile.company

    departments = Department.objects.filter(company=company)
    users = UserProfile.objects.filter(company=company)
    reports = ExpenseReport.objects.filter(company=company)
    company_roles = CompanyRole.objects.filter(company=company)

    workflow = ApprovalWorkflow.objects.filter(
        company=company,
        is_active=True
    ).prefetch_related(
        "steps",
        "steps__approver_role",
        "steps__department"
    ).first()

    workflow_steps_count = (
        workflow.steps.filter(is_active=True).count()
        if workflow else 0
    )

    smtp_configured = CompanySMTPConfig.objects.filter(
        company=company,
        is_active=True
    ).exists()

    reimbursement_email_configured = ReimbursementEmailConfig.objects.filter(
        company=company,
        is_active=True
    ).exists()

    policy_configured = CompanyPolicy.objects.filter(
        company=company
    ).exists()

    total_expense_amount = reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    submitted_amount = reports.filter(
        status=ExpenseReport.STATUS_SUBMITTED
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    approved_amount = reports.filter(
        status=ExpenseReport.STATUS_APPROVED
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    paid_amount = reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    rejected_amount = reports.filter(
        status=ExpenseReport.STATUS_REJECTED
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    department_wise_spend = reports.values(
        "department__name"
    ).annotate(
        total=Sum("total_amount")
    ).order_by("-total")

    category_wise_spend = ExpenseLineItem.objects.filter(
        receipt__report__company=company
    ).values(
        "category"
    ).annotate(
        total=Sum("amount")
    ).order_by("-total")

    recent_reports = reports.select_related(
        "employee",
        "employee__user",
        "department"
    ).order_by("-created_at")[:10]

    return Response({
        "company_admin": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "company": company.name,
            "company_id": str(company.id),
        },

        "setup_status": {
            "departments_created": departments.exists(),
            "users_created": users.exists(),
            "roles_created": company_roles.exists(),
            "workflow_configured": workflow is not None,
            "workflow_steps_created": workflow_steps_count > 0,
            "policy_configured": policy_configured,
            "reimbursement_email_configured": reimbursement_email_configured,
            "smtp_configured": smtp_configured,
        },

        "metrics": {
            "total_departments": departments.count(),
            "total_users": users.count(),
            "active_users": users.filter(user__is_active=True).count(),
            "inactive_users": users.filter(user__is_active=False).count(),
            "total_company_roles": company_roles.count(),
            "total_workflow_steps": workflow_steps_count,

            "total_reports": reports.count(),
            "draft_reports": reports.filter(
                status=ExpenseReport.STATUS_DRAFT
            ).count(),
            "submitted_reports": reports.filter(
                status=ExpenseReport.STATUS_SUBMITTED
            ).count(),
            "approved_reports": reports.filter(
                status=ExpenseReport.STATUS_APPROVED
            ).count(),
            "rejected_reports": reports.filter(
                status=ExpenseReport.STATUS_REJECTED
            ).count(),
            "paid_reports": reports.filter(
                status=ExpenseReport.STATUS_PAID
            ).count(),

            "total_expense_amount": str(total_expense_amount),
            "submitted_amount": str(submitted_amount),
            "approved_amount": str(approved_amount),
            "paid_amount": str(paid_amount),
            "rejected_amount": str(rejected_amount),
        },

        "department_wise_spend": [
            {
                "department": item["department__name"] or "No Department",
                "total_amount": str(item["total"] or 0),
            }
            for item in department_wise_spend
        ],

        "category_wise_spend": [
            {
                "category": item["category"] or "Uncategorized",
                "total_amount": str(item["total"] or 0),
            }
            for item in category_wise_spend
        ],

        "recent_reports": [
            {
                "id": str(report.id),
                "employee_name": (
                    f"{report.employee.user.first_name} "
                    f"{report.employee.user.last_name}"
                ).strip() or report.employee.user.email,
                "employee_email": report.employee.user.email,
                "department": (
                    report.department.name
                    if report.department else None
                ),
                "month": report.month,
                "status": report.status,
                "total_amount": str(report.total_amount),
                "created_at": report.created_at,
            }
            for report in recent_reports
        ],

        "workflow": {
            "id": str(workflow.id),
            "name": workflow.name,
            "steps": [
                {
                    "id": str(step.id),
                    "step_order": step.step_order,
                    "approver_role": step.approver_role.name,
                    "routing_type": step.routing_type,
                    "department": (
                        step.department.name
                        if step.department else None
                    ),
                    "is_active": step.is_active,
                }
                for step in workflow.steps.filter(
                    is_active=True
                ).order_by("step_order")
            ]
        } if workflow else None
    })
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def platform_owner_dashboard(request):

    if not hasattr(request.user, "platform_owner"):
        return Response(
            {"error": "Only platform owner can access this dashboard."},
            status=status.HTTP_403_FORBIDDEN
        )

    companies = Company.objects.all()
    reports = ExpenseReport.objects.all()
    company_requests = CompanyRegistrationRequest.objects.all()

    total_expense_amount = reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    approved_amount = reports.filter(
        status=ExpenseReport.STATUS_APPROVED
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    paid_amount = reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    recent_companies = companies.order_by("-created_at")[:5]

    return Response({
        "platform_owner": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
        },

        "metrics": {
            "total_companies": companies.count(),
            "verified_companies": companies.filter(is_verified=True).count(),
            "unverified_companies": companies.filter(is_verified=False).count(),

            "pending_company_requests": company_requests.filter(status="PENDING").count(),
            "approved_company_requests": company_requests.filter(status="APPROVED").count(),
            "rejected_company_requests": company_requests.filter(status="REJECTED").count(),

            "total_reports": reports.count(),
            "draft_reports": reports.filter(status=ExpenseReport.STATUS_DRAFT).count(),
            "submitted_reports": reports.filter(status=ExpenseReport.STATUS_SUBMITTED).count(),
            "approved_reports": reports.filter(status=ExpenseReport.STATUS_APPROVED).count(),
            "rejected_reports": reports.filter(status=ExpenseReport.STATUS_REJECTED).count(),
            "paid_reports": reports.filter(status=ExpenseReport.STATUS_PAID).count(),

            "total_expense_amount": str(total_expense_amount),
            "approved_amount": str(approved_amount),
            "paid_amount": str(paid_amount),
        },

        "recent_companies": [
            {
                "id": str(company.id),
                "name": company.name,
                "domain": company.domain,
                "is_verified": company.is_verified,
                "created_at": company.created_at,
            }
            for company in recent_companies
        ]
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_router(request):

    if hasattr(request.user, "platform_owner"):
        return platform_owner_dashboard(request)

    profile = request.user.profile

    if profile.role == "COMPANY_ADMIN":
        return company_admin_dashboard(request)

    if not profile.company_role:
        return Response(
            {"error": "Your company role is not assigned."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if profile.company_role.can_mark_paid:
        return payment_dashboard(request)

    if profile.company_role.can_approve_expense:
        return approver_dashboard(request)

    if profile.company_role.can_submit_expense:
        return employee_dashboard(request)

    return Response(
        {"error": "No dashboard assigned."},
        status=status.HTTP_403_FORBIDDEN
    )    