from django.urls import path

from .views import (
    create_company_request,
    list_company_requests,
    approve_company_request,
    reject_company_request,
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
]