from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from platform_management.permissions import IsPlatformOwner
from tenants.permissions import CanViewCompanyAuditLogs
from .models import AuditLog
from .serializers import AuditLogSerializer, PlatformAuditLogSerializer
from django.core.paginator import Paginator

@api_view(["GET"])
@permission_classes([IsAuthenticated, CanViewCompanyAuditLogs])
def audit_log_list(request):
    company = request.user.profile.company

    logs = AuditLog.objects.filter(
        company=company
    ).select_related(
        "action_by",
        "action_by__user"
    ).order_by("-created_at")

    action = request.GET.get("action")
    user_id = request.GET.get("user_id")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if action:
        logs = logs.filter(action=action)

    if user_id:
        logs = logs.filter(action_by_id=user_id)

    if start_date:
        logs = logs.filter(created_at__date__gte=start_date)

    if end_date:
        logs = logs.filter(created_at__date__lte=end_date)

    page = request.GET.get("page", 1)

    paginator = Paginator(
        logs,
        10
    )

    page_obj = paginator.get_page(page)

    serializer = AuditLogSerializer(
        page_obj,
        many=True
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": serializer.data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanViewCompanyAuditLogs])
def audit_log_dashboard(request):
    company = request.user.profile.company

    logs = AuditLog.objects.filter(
        company=company
    )

    total_logs = logs.count()

    action_summary = logs.values(
        "action"
    ).annotate(
        count=Count("id")
    ).order_by("-count")

    user_summary = logs.filter(
        action_by__isnull=False
    ).values(
        "action_by__user__email",
        "action_by__user__first_name",
        "action_by__user__last_name",
        "action_by__company_role__name",
    ).annotate(
        count=Count("id")
    ).order_by("-count")[:10]

    sync_logs_count = logs.filter(
        action__in=[
            "SYNC_STARTED",
            "SYNC_COMPLETED",
            "SYNC_FAILED",
        ]
    ).count()

    approval_logs_count = logs.filter(
        action__in=[
            "REPORT_SUBMITTED",
            "STEP_APPROVED",
            "STEP_REJECTED",
            "MANAGER_APPROVED",
            "MANAGER_REJECTED",
            "ACCOUNTS_APPROVED",
            "ACCOUNTS_REJECTED",
        ]
    ).count()

    error_logs_count = logs.filter(
        action__icontains="FAILED"
    ).count()

    latest_logs = logs.select_related(
        "action_by",
        "action_by__user",
        "action_by__company_role",
    ).order_by("-created_at")[:10]

    return Response({
        "metrics": {
            "total_logs": total_logs,
            "sync_logs": sync_logs_count,
            "approval_logs": approval_logs_count,
            "error_logs": error_logs_count,
        },

        "action_summary": list(action_summary),

        "top_users": [
            {
                "email": item["action_by__user__email"],
                "name": (
                    f"{item['action_by__user__first_name']} "
                    f"{item['action_by__user__last_name']}"
                ).strip() or item["action_by__user__email"],
                "company_role": item["action_by__company_role__name"],
                "action_count": item["count"],
            }
            for item in user_summary
        ],

        "latest_logs": AuditLogSerializer(
            latest_logs,
            many=True
        ).data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsPlatformOwner])
def platform_audit_log_list(request):
    logs = AuditLog.objects.select_related(
        "company",
        "action_by",
        "action_by__user",
    ).order_by("-created_at")

    action = request.GET.get("action")
    company_id = request.GET.get("company_id")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if action:
        logs = logs.filter(action=action)

    if company_id:
        logs = logs.filter(company_id=company_id)

    if start_date:
        logs = logs.filter(created_at__date__gte=start_date)

    if end_date:
        logs = logs.filter(created_at__date__lte=end_date)

    page = request.GET.get("page", 1)

    paginator = Paginator(logs, 10)
    page_obj = paginator.get_page(page)

    serializer = PlatformAuditLogSerializer(page_obj, many=True)

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": serializer.data,
    })