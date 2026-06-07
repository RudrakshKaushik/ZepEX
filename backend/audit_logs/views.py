from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from tenants.models import Company
from .models import AuditLog
from .serializers import AuditLogSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_audit_logs(request):
    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can view audit logs."},
            status=status.HTTP_403_FORBIDDEN
        )

    logs = AuditLog.objects.filter(
        company=profile.company
    ).select_related(
        "action_by",
        "action_by__user"
    )[:100]

    serializer = AuditLogSerializer(logs, many=True)

    return Response({
        "count": logs.count(),
        "results": serializer.data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def platform_audit_logs(request):

    if not hasattr(request.user, "platform_owner"):
        return Response(
            {"error": "Only platform owner can access platform logs."},
            status=status.HTTP_403_FORBIDDEN
        )

    logs = AuditLog.objects.select_related(
        "company",
        "action_by",
        "action_by__user"
    )[:200]

    serializer = AuditLogSerializer(logs, many=True)

    return Response({
        "count": logs.count(),
        "results": serializer.data
    })