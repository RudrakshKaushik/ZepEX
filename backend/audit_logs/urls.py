from django.urls import path

from .views import (
    company_audit_logs,
    platform_audit_logs,
)

urlpatterns = [
    path(
        "company/",
        company_audit_logs,
        name="company-audit-logs"
    ),

    path(
        "platform/",
        platform_audit_logs,
        name="platform-audit-logs"
    ),
]