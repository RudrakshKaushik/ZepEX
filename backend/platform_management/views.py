from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CompanyRegistrationRequest
from .serializers import CompanyRegistrationRequestSerializer
from .permissions import IsPlatformOwner

from tenants.models import Company, UserProfile
from django.contrib.auth.models import User

@api_view(["POST"])
def create_company_request(request):

    serializer = CompanyRegistrationRequestSerializer(
        data=request.data
    )

    if serializer.is_valid():
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsPlatformOwner])
def list_company_requests(request):

    requests_data = CompanyRegistrationRequest.objects.all().order_by(
        "-created_at"
    )

    serializer = CompanyRegistrationRequestSerializer(
        requests_data,
        many=True
    )

    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsPlatformOwner])
def approve_company_request(request, request_id):

    try:
        company_request = CompanyRegistrationRequest.objects.get(
            id=request_id
        )
    except CompanyRegistrationRequest.DoesNotExist:
        return Response(
            {"error": "Request not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if company_request.status != "PENDING":
        return Response(
            {"error": "Request already processed"},
            status=status.HTTP_400_BAD_REQUEST
        )

    temp_password = "Admin@123"

    user = User.objects.create_user(
        username=company_request.admin_email,
        email=company_request.admin_email,
        password=temp_password,
        first_name=company_request.admin_name
    )

    company = Company.objects.create(
        owner=request.user.platform_owner,
        name=company_request.company_name,
        domain=company_request.company_domain,
        reimbursement_email_prefix=company_request.company_name.lower().replace(" ", ""),
        is_verified=True
    )

    UserProfile.objects.create(
        user=user,
        company=company,
        role="COMPANY_ADMIN"
    )

    company_request.status = "APPROVED"
    company_request.save()

    return Response({
        "message": "Company approved successfully",
        "company_id": company.id,
        "admin_email": user.email,
        "temporary_password": temp_password
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsPlatformOwner])
def reject_company_request(request, request_id):

    try:
        company_request = CompanyRegistrationRequest.objects.get(
            id=request_id
        )
    except CompanyRegistrationRequest.DoesNotExist:
        return Response(
            {"error": "Request not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    company_request.status = "REJECTED"
    company_request.save()

    return Response({
        "message": "Request rejected"
    })