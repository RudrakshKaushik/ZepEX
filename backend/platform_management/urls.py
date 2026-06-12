from django.urls import path

from .views import (
    create_company_request,
    list_company_requests,
    approve_company_request,
    reject_company_request,
    company_list,
    pending_company_list,
    deactivate_company,
    activate_company,
)

urlpatterns = [

    path(
        "register-company/",
        create_company_request,
        name="register-company"
    ),

    path(
        "requests/",
        list_company_requests,
        name="list-company-requests"
    ),

    path(
        "approve/<int:request_id>/",
        approve_company_request,
        name="approve-company-request"
    ),

    path(
        "reject/<int:request_id>/",
        reject_company_request,
        name="reject-company-request"
    ),
    path(
    "companies/",
    company_list,
    name="company-list"
),

path(
    "pending-companies/",
    pending_company_list,
    name="pending-company-list"
),
path(
    "companies/<uuid:company_id>/deactivate/",
    deactivate_company,
    name="deactivate-company"
),

path("companies/<uuid:company_id>/activate/", activate_company,name="activate-company"),



]