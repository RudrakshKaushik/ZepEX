from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import CompanyRegistrationRequest
from .serializers import CompanyRegistrationRequestSerializer
from .permissions import IsPlatformOwner

from tenants.models import Company, UserProfile
from django.contrib.auth.models import User
from tenants.permissions import IsCompanyAdmin
from tenants.models import Company
from rest_framework.decorators import (
    api_view,
    permission_classes
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from django.core.paginator import Paginator
from django.db.models import Q

from tenants.models import (
    Company,
    Department,
    UserProfile,
    CompanyRole,
    CompanyPolicy,
    PolicyCategoryRule,
)

from expenses.models import ApprovalWorkflow, ApprovalWorkflowStep
from tenants.serializers import (
    CompanySerializer,
    DepartmentSerializer,
    UserProfileSerializer,
    CompanyRoleSerializer,
    PolicyCategoryRuleSerializer,
    
)
from .serializers import CompanyRegistrationRequestSerializer, PlatformSettingsSerializer
from expenses.serializers import ApprovalWorkflowSerializer
from django.utils import timezone
from tenants.email_utils import send_company_registration_otp
from django.conf import settings

from platform_management.email_service import (
    send_company_approved_email,
    send_company_rejected_email,
)

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def create_company_request(request):

    required_fields = [
        "company_name",
        "company_domain",
        "admin_name",
        "admin_email",
        "expected_employee_count",
    ]

    for field in required_fields:
        if not request.data.get(field):
            return Response(
                {"error": f"{field} is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

    admin_email = request.data.get("admin_email", "").lower().strip()
    otp = request.data.get("otp", "").strip()

    try:
        company_request = CompanyRegistrationRequest.objects.get(
            admin_email__iexact=admin_email,
        )
    except CompanyRegistrationRequest.DoesNotExist:
        return Response(
            {"error": "Please request an OTP first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if company_request.status == "APPROVED":
        return Response(
            {"error": "This email is already registered and approved."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not company_request.is_email_verified:
        if not otp:
            return Response(
                {"error": "otp is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if company_request.otp != otp:
            return Response(
                {"error": "Invalid OTP or email does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            company_request.otp_expires_at
            and company_request.otp_expires_at < timezone.now()
        ):
            return Response(
                {"error": "OTP expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        company_request.is_email_verified = True

    serializer = CompanyRegistrationRequestSerializer(
        company_request,
        data=request.data,
        partial=True,
    )

    if serializer.is_valid():
        company_request.is_email_verified = True
        company_request.status = "PENDING"
        company_request.otp = None
        company_request.otp_expires_at = None
        serializer.save()

        return Response(
            {
                "message": "Company registration request submitted successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def list_company_requests(request):

    requests_data = CompanyRegistrationRequest.objects.exclude(
        company_name="PENDING",
        company_domain="pending.com",
    ).order_by(
        "-created_at"
    )

    serializer = CompanyRegistrationRequestSerializer(
        requests_data,
        many=True
    )

    return Response(serializer.data)
from django.conf import settings
from .utils import generate_inbound_email_code
from tenants.views import generate_employee_password

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def approve_company_request(request, request_id):

    try:
        company_request = CompanyRegistrationRequest.objects.get(
            id=request_id
        )

    except CompanyRegistrationRequest.DoesNotExist:
        return Response(
            {
                "error": "Request not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if company_request.status != "PENDING":
        return Response(
            {
                "error": "Request already processed."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not company_request.is_email_verified:
        return Response(
            {"error": "Admin email is not verified yet. OTP verification is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if company_request.company_name == "PENDING":
        return Response(
            {"error": "Registration details are incomplete. Awaiting full submission."},
            status=status.HTTP_400_BAD_REQUEST,
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
        reimbursement_email=company_request.reimbursement_email,
        is_verified=True
    )

    from tenants.role_utils import ensure_default_company_roles

    ensure_default_company_roles(company)

    profile = UserProfile.objects.create(
        user=user,
        company=company,
        role="COMPANY_ADMIN",
        temporary_password=temp_password,
        force_password_change=True,
        invite_email_sent=False,
        invite_email_sent_at=None,
    )

    company_request.status = "APPROVED"

    company_request.save(update_fields=[
        "status"
    ])

    platform_receipt_email = getattr(
        settings,
        "PLATFORM_RECEIPT_EMAIL",
        "receipts@zepex.ai"
    )

    # Send Welcome Email
    try:

        send_company_approved_email(
            company=company,
            company_request=company_request,
            temporary_password=temp_password,
            platform_receipt_email=platform_receipt_email,
        )

        profile.invite_email_sent = True
        profile.invite_email_sent_at = timezone.now()

        profile.save(update_fields=[
            "invite_email_sent",
            "invite_email_sent_at",
        ])

    except Exception as e:

        print("Company approval email failed:", e)

    return Response({

        "success": True,

        "message": "Company approved successfully.",

        "company_id": str(company.id),

        "admin_email": user.email,

        "temporary_password": temp_password,

        "reimbursement_email": company.reimbursement_email,

        "platform_receipt_email": platform_receipt_email,

        "forwarding_instruction": (
            f"Forward all reimbursement emails from "
            f"{company.reimbursement_email} "
            f"to {platform_receipt_email}"
        )
    })

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def reject_company_request(request, request_id):

    try:
        company_request = CompanyRegistrationRequest.objects.get(
            id=request_id
        )

    except CompanyRegistrationRequest.DoesNotExist:

        return Response(
            {
                "error": "Request not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if company_request.status != "PENDING":

        return Response(
            {
                "error": "Request already processed."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    reject_reason = request.data.get(
        "reject_reason",
        ""
    ).strip()

    if not reject_reason:

        return Response(
            {
                "error": "reject_reason is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    company_request.status = "REJECTED"

    company_request.reject_reason = reject_reason

    company_request.save(update_fields=[
        "status",
        "reject_reason",
    ])

    try:

        send_company_rejected_email(
            company_request=company_request
        )

    except Exception as e:

        print("Company rejection email failed:", e)

    return Response({

        "success": True,

        "message": "Company request rejected successfully.",

        "company_name": company_request.company_name,

        "admin_email": company_request.admin_email,

        "reject_reason": reject_reason,

    })

from tenants.serializers import CompanySerializer
@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def company_list(request):

    companies = Company.objects.filter(
        is_verified=True
    ).order_by("-created_at")

    serializer = CompanySerializer(
        companies,
        many=True
    )

    return Response({
        "count": companies.count(),
        "results": serializer.data
    })


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def pending_company_list(request):

    companies = Company.objects.filter(
        is_verified=False
    ).order_by("-created_at")

    serializer = CompanySerializer(
        companies,
        many=True
    )

    return Response({
        "count": companies.count(),
        "results": serializer.data
    })
from audit_logs.utils import create_audit_log
@api_view(["PATCH"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def deactivate_company(request, company_id):

    try:
        company = Company.objects.get(
            id=company_id
        )

    except Company.DoesNotExist:

        return Response(
            {"error": "Company not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    company.is_active = False

    company.save(update_fields=[
        "is_active",
        "updated_at"
    ])

    create_audit_log(
        company=company,
        action="COMPANY_DEACTIVATED",
        action_by=None,
        message=f"Company {company.name} deactivated.",
        metadata={
            "company_id": str(company.id),
            "company_name": company.name,
        }
    )

    return Response({
        "message": "Company deactivated successfully."
    })

@api_view(["PATCH"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def activate_company(request, company_id):

    try:
        company = Company.objects.get(
            id=company_id
        )

    except Company.DoesNotExist:

        return Response(
            {"error": "Company not found."
        },
        status=status.HTTP_404_NOT_FOUND
    )

    company.is_active = True

    company.save(update_fields=[
        "is_active",
        "updated_at"
    ])

    create_audit_log(
        company=company,
        action="COMPANY_ACTIVATED",
        action_by=None,
        message=f"Company {company.name} activated.",
        metadata={
            "company_id": str(company.id),
            "company_name": company.name,
        }
    )

    return Response({
        "message": "Company activated successfully."
    })
from tenants.models import Company
@api_view(["DELETE"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def delete_company(request, company_id):

    if not hasattr(request.user, "platform_owner"):
        return Response(
            {"error": "Only platform owner can delete companies."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        company = Company.objects.get(id=company_id)

    except Company.DoesNotExist:
        return Response(
            {"error": "Company not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    company_name = company.name
    company_id_value = str(company.id)

    company.delete()

    return Response({
        "message": "Company deleted successfully.",
        "deleted_company": {
            "id": company_id_value,
            "name": company_name
        }
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsPlatformOwner])
def platform_company_details(request, company_id):

    try:
        company = Company.objects.get(id=company_id)

    except Company.DoesNotExist:
        return Response(
            {"error": "Company not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    page = request.GET.get("page", 1)
    page_size = int(request.GET.get("page_size", 10))
    section = request.GET.get("section", "all")

    search = request.GET.get("search")
    department_id = request.GET.get("department_id")
    role = request.GET.get("role")
    company_role_id = request.GET.get("company_role_id")
    category = request.GET.get("category")

    def paginate_queryset(queryset, serializer_class):
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = serializer_class(
            page_obj,
            many=True
        )

        return {
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "page_size": page_size,
            "results": serializer.data
        }

    response_data = {
        "company": CompanySerializer(company).data,
        "filters": {
            "section": section,
            "search": search,
            "department_id": department_id,
            "role": role,
            "company_role_id": company_role_id,
            "category": category,
            "page": page,
            "page_size": page_size,
        }
    }

    if section in ["all", "departments"]:
        departments = Department.objects.select_related(
            "manager__user"
        ).filter(
            company=company
        )

        if search:
            departments = departments.filter(
                name__icontains=search
            )

        departments = departments.order_by("name")

        response_data["departments"] = paginate_queryset(
            departments,
            DepartmentSerializer
        )

    if section in ["all", "employees"]:
        employees = UserProfile.objects.select_related(
            "user",
            "department",
            "company_role"
        ).filter(
            company=company
        )

        if search:
            employees = employees.filter(
                Q(user__first_name__icontains=search)
                |
                Q(user__last_name__icontains=search)
                |
                Q(user__email__icontains=search)
            )

        if department_id:
            employees = employees.filter(
                department_id=department_id
            )

        if role:
            employees = employees.filter(
                role=role
            )

        if company_role_id:
            employees = employees.filter(
                company_role_id=company_role_id
            )

        employees = employees.order_by("user__first_name")

        response_data["employees"] = paginate_queryset(
            employees,
            UserProfileSerializer
        )

    if section in ["all", "roles"]:
        roles = CompanyRole.objects.filter(
            company=company
        )

        if search:
            roles = roles.filter(
                name__icontains=search
            )

        roles = roles.order_by("name")

        response_data["roles"] = paginate_queryset(
            roles,
            CompanyRoleSerializer
        )

    if section in ["all", "policy_rules"]:
        policy, created = CompanyPolicy.objects.get_or_create(
            company=company
        )

        policy_rules = PolicyCategoryRule.objects.filter(
            policy=policy
        )

        if category:
            policy_rules = policy_rules.filter(
                category_name__iexact=category
            )

        if search:
            policy_rules = policy_rules.filter(
                Q(category_name__icontains=search)
                | Q(category_description__icontains=search)
            )

        policy_rules = policy_rules.order_by("category_name")

        response_data["policy_rules"] = paginate_queryset(
            policy_rules,
            PolicyCategoryRuleSerializer
        )

    if section in ["all", "workflow"]:
        workflow = ApprovalWorkflow.objects.filter(
            company=company,
            is_active=True
        ).prefetch_related(
            "steps",
            "steps__approver_role",
            "steps__department"
        ).first()

        response_data["workflow"] = (
            ApprovalWorkflowSerializer(workflow).data
            if workflow else None
        )

    return Response(response_data)

import random
from datetime import timedelta

from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from tenants.email_utils import send_company_registration_otp


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def request_company_registration_otp(request):

    admin_email = request.data.get("admin_email", "").lower().strip()
    company_name = request.data.get("company_name", "").strip()
    company_domain = request.data.get("company_domain", "").strip().lower()
    admin_name = request.data.get("admin_name", "").strip()
    expected_employee_count = request.data.get("expected_employee_count")

    if not admin_email:
        return Response(
            {"error": "admin_email is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not company_name:
        return Response(
            {"error": "company_name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not company_domain:
        return Response(
            {"error": "company_domain is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not admin_name:
        return Response(
            {"error": "admin_name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        expected_employee_count = int(expected_employee_count)
        if expected_employee_count < 1:
            raise ValueError
    except (TypeError, ValueError):
        return Response(
            {"error": "expected_employee_count must be a positive number."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_email(admin_email)
    except ValidationError:
        return Response(
            {"error": "Email does not exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if CompanyRegistrationRequest.objects.filter(
        company_domain__iexact=company_domain,
    ).exclude(
        admin_email__iexact=admin_email,
    ).exists():
        return Response(
            {"error": "This company domain is already registered or pending approval."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    otp = str(random.randint(100000, 999999))

    company_request, created = CompanyRegistrationRequest.objects.get_or_create(
        admin_email=admin_email,
        defaults={
            "company_name": company_name,
            "company_domain": company_domain,
            "admin_name": admin_name,
            "expected_employee_count": expected_employee_count,
        }
    )

    if not created:
        if company_request.status == "APPROVED":
            return Response(
                {"error": "This email is already registered and approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        company_request.company_name = company_name
        company_request.company_domain = company_domain
        company_request.admin_name = admin_name
        company_request.expected_employee_count = expected_employee_count

    company_request.otp = otp
    company_request.otp_expires_at = timezone.now() + timedelta(minutes=10)
    company_request.is_email_verified = False

    company_request.save()

    result = send_company_registration_otp(
        email=admin_email,
        otp=otp,
    )

    if not result.get("success"):
        return Response(
            {
                "success": False,
                "error": result.get(
                    "error",
                    "Unable to send OTP email."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "success": True,
        "message": "OTP sent successfully."
    })

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def verify_company_registration_otp(request):

    admin_email = request.data.get("admin_email", "").lower().strip()
    otp = request.data.get("otp", "").strip()

    if not admin_email:
        return Response(
            {"error": "admin_email is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not otp:
        return Response(
            {"error": "otp is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        company_request = CompanyRegistrationRequest.objects.get(
            admin_email__iexact=admin_email,
            otp=otp,
        )

    except CompanyRegistrationRequest.DoesNotExist:
        return Response(
            {"error": "Invalid OTP or email does not exist."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if company_request.otp_expires_at and company_request.otp_expires_at < timezone.now():
        return Response(
            {"error": "OTP expired. Please request a new OTP."},
            status=status.HTTP_400_BAD_REQUEST
        )

    company_request.is_email_verified = True
    company_request.otp = None
    company_request.otp_expires_at = None

    company_request.save(update_fields=[
        "is_email_verified",
        "otp",
        "otp_expires_at",
    ])

    return Response({
        "success": True,
        "message": "OTP verified successfully."
    })

from .models import PlatformSettings        


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def platform_settings(request):

    settings_obj, created = PlatformSettings.objects.get_or_create(
        id=1
    )

    serializer = PlatformSettingsSerializer(settings_obj)

    return Response(serializer.data)

@api_view(["PATCH"])
@permission_classes([
    IsAuthenticated,
    IsPlatformOwner
])
def update_platform_settings(request):

    settings_obj, created = PlatformSettings.objects.get_or_create(
        id=1
    )

    serializer = PlatformSettingsSerializer(
        settings_obj,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()
        return Response({
            "success": True,
            "message": "Platform settings updated successfully.",
            "settings": serializer.data
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )