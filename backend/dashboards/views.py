from django.shortcuts import render

# Create your views here.
from datetime import date

from datetime import date

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from expenses.models import ExpenseReport
from expenses.serializers import ExpenseReportSerializer, ExpenseReceiptSerializer

from tenants.models import Department, UserProfile, Company
from django.db.models import Sum
from platform_management.models import CompanyRegistrationRequest

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_dashboard(request):
    profile = request.user.profile

    if profile.role not in ["EMPLOYEE", "MANAGER"]:
        return Response(
            {"error": "Only employees and managers can access this dashboard."},
            status=status.HTTP_403_FORBIDDEN
        )

    current_month = date.today().replace(day=1)

    current_report = ExpenseReport.objects.filter(
        company=profile.company,
        employee=profile,
        month=current_month
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).first()

    all_reports = ExpenseReport.objects.filter(
        company=profile.company,
        employee=profile
    )

    submitted_reports = all_reports.exclude(
        status=ExpenseReport.STATUS_DRAFT
    ).order_by("-month")

    total_reports = all_reports.count()
    paid_reports = all_reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).count()

    pending_reports = all_reports.filter(
        status__in=[
            ExpenseReport.STATUS_SUBMITTED,
            ExpenseReport.STATUS_PENDING_ACCOUNTS,
            ExpenseReport.STATUS_ACCOUNTS_APPROVED,
        ]
    ).count()

    rejected_reports = all_reports.filter(
        status__in=[
            ExpenseReport.STATUS_MANAGER_REJECTED,
            ExpenseReport.STATUS_REJECTED,
        ]
    ).count()

    data = {
        "user": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "role": profile.role,
            "company": profile.company.name,
            "department": profile.department.name if profile.department else None,
        },

        "metrics": {
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "paid_reports": paid_reports,
            "rejected_reports": rejected_reports,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_dashboard(request):
    profile = request.user.profile

    if profile.role != "MANAGER":
        return Response(
            {"error": "Only managers can access this dashboard."},
            status=status.HTTP_403_FORBIDDEN
        )

    team_members = UserProfile.objects.filter(
        company=profile.company,
        department=profile.department,
        role="EMPLOYEE"
    )

    pending_reports = ExpenseReport.objects.filter(
        company=profile.company,
        department=profile.department,
        status=ExpenseReport.STATUS_SUBMITTED
    ).exclude(
        employee=profile
    ).select_related(
        "employee",
        "employee__user",
        "department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).order_by("-submitted_at")

    approved_reports = ExpenseReport.objects.filter(
        company=profile.company,
        department=profile.department,
        status=ExpenseReport.STATUS_PENDING_ACCOUNTS
    ).exclude(
        employee=profile
    ).order_by("-manager_action_at")

    rejected_reports = ExpenseReport.objects.filter(
        company=profile.company,
        department=profile.department,
        status=ExpenseReport.STATUS_MANAGER_REJECTED
    ).exclude(
        employee=profile
    ).order_by("-manager_action_at")

    violation_reports = pending_reports.filter(
        receipts__has_any_violation=True
    ).distinct()

    return Response({
        "manager": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "company": profile.company.name,
            "department": profile.department.name if profile.department else None,
        },

        "metrics": {
            "team_members": team_members.count(),
            "pending_reports": pending_reports.count(),
            "approved_reports": approved_reports.count(),
            "rejected_reports": rejected_reports.count(),
            "violation_reports": violation_reports.count(),
        },

        "pending_employee_reports": ExpenseReportSerializer(
            pending_reports,
            many=True
        ).data,

        "approved_reports": ExpenseReportSerializer(
            approved_reports,
            many=True
        ).data,

        "rejected_reports": ExpenseReportSerializer(
            rejected_reports,
            many=True
        ).data,
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def accounts_dashboard(request):
    profile = request.user.profile

    if profile.role != "ACCOUNTS":
        return Response(
            {"error": "Only accounts users can access this dashboard."},
            status=status.HTTP_403_FORBIDDEN
        )

    reports = ExpenseReport.objects.filter(
        company=profile.company
    )

    pending_reports = reports.filter(
        status=ExpenseReport.STATUS_PENDING_ACCOUNTS
    ).select_related(
        "employee",
        "employee__user",
        "department"
    ).prefetch_related(
        "receipts",
        "receipts__line_items"
    ).order_by("-manager_action_at")

    approved_reports = reports.filter(
        status=ExpenseReport.STATUS_ACCOUNTS_APPROVED
    ).order_by("-accounts_action_at")

    paid_reports = reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).order_by("-paid_at")

    rejected_reports = reports.filter(
        status=ExpenseReport.STATUS_REJECTED
    ).order_by("-accounts_action_at")

    pending_amount = pending_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    approved_amount = approved_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    paid_amount = paid_reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    return Response({
        "accounts_user": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "company": profile.company.name,
        },

        "metrics": {
            "pending_reports": pending_reports.count(),
            "approved_reports": approved_reports.count(),
            "paid_reports": paid_reports.count(),
            "rejected_reports": rejected_reports.count(),
            "pending_amount": str(pending_amount),
            "approved_amount": str(approved_amount),
            "paid_amount": str(paid_amount),
        },

        "pending_reports": ExpenseReportSerializer(
            pending_reports,
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
            rejected_reports,
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

    departments = Department.objects.filter(
        company=company
    )

    users = UserProfile.objects.filter(
        company=company
    )

    reports = ExpenseReport.objects.filter(
        company=company
    )

    total_expense_amount = reports.aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    paid_amount = reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    pending_accounts_amount = reports.filter(
        status=ExpenseReport.STATUS_PENDING_ACCOUNTS
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    return Response({
        "company_admin": {
            "name": request.user.get_full_name(),
            "email": request.user.email,
            "company": company.name,
            "company_id": str(company.id),
        },

        "metrics": {
            "total_departments": departments.count(),
            "total_users": users.count(),
            "total_employees": users.filter(role="EMPLOYEE").count(),
            "total_managers": users.filter(role="MANAGER").count(),
            "total_accounts_users": users.filter(role="ACCOUNTS").count(),

            "total_reports": reports.count(),
            "draft_reports": reports.filter(status=ExpenseReport.STATUS_DRAFT).count(),
            "pending_manager_reports": reports.filter(status=ExpenseReport.STATUS_SUBMITTED).count(),
            "pending_accounts_reports": reports.filter(status=ExpenseReport.STATUS_PENDING_ACCOUNTS).count(),
            "accounts_approved_reports": reports.filter(status=ExpenseReport.STATUS_ACCOUNTS_APPROVED).count(),
            "paid_reports": reports.filter(status=ExpenseReport.STATUS_PAID).count(),
            "rejected_reports": reports.filter(status__in=[
                ExpenseReport.STATUS_MANAGER_REJECTED,
                ExpenseReport.STATUS_REJECTED,
            ]).count(),

            "total_expense_amount": str(total_expense_amount),
            "pending_accounts_amount": str(pending_accounts_amount),
            "paid_amount": str(paid_amount),
        }
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

    paid_amount = reports.filter(
        status=ExpenseReport.STATUS_PAID
    ).aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    pending_accounts_amount = reports.filter(
        status=ExpenseReport.STATUS_PENDING_ACCOUNTS
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
            "pending_accounts_reports": reports.filter(status=ExpenseReport.STATUS_PENDING_ACCOUNTS).count(),
            "accounts_approved_reports": reports.filter(status=ExpenseReport.STATUS_ACCOUNTS_APPROVED).count(),
            "paid_reports": reports.filter(status=ExpenseReport.STATUS_PAID).count(),
            "rejected_reports": reports.filter(status__in=[
                ExpenseReport.STATUS_MANAGER_REJECTED,
                ExpenseReport.STATUS_REJECTED,
            ]).count(),

            "total_expense_amount": str(total_expense_amount),
            "pending_accounts_amount": str(pending_accounts_amount),
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