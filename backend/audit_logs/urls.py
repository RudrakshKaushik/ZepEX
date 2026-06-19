from django.urls import path
from .views import audit_log_list, audit_log_dashboard

urlpatterns = [
    path("", audit_log_list, name="audit-log-list"),
    path("dashboard/", audit_log_dashboard, name="audit-log-dashboard"),
]