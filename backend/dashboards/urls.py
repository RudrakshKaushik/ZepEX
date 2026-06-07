from django.urls import path

from .views import (
    employee_dashboard,
    manager_dashboard,
    accounts_dashboard,
    company_admin_dashboard,
    platform_owner_dashboard,
)

urlpatterns = [

    path(
        "employee/",
        employee_dashboard,
        name="employee-dashboard"
    ),

    path(
        "manager/",
        manager_dashboard,
        name="manager-dashboard"
    ),

    path(
        "accounts/",
        accounts_dashboard,
        name="accounts-dashboard"
    ),

    path(
        "company-admin/",
        company_admin_dashboard,
        name="company-admin-dashboard"
    ),

    path(
    "platform-owner/",
    platform_owner_dashboard,
    name="platform-owner-dashboard"
),

]