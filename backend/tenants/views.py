from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Company,
    Department,
    UserProfile,
    CompanyRole,
)

from .serializers import (
    DepartmentSerializer,
    EmployeeCreateSerializer,
    UserProfileSerializer,
    PolicyCategoryRuleSerializer,
    CompanyPolicySerializer,
)

from .models import (
    CompanyPolicy,
    PolicyCategoryRule
)

from .serializers import (
    DepartmentSerializer,
    UserProfileSerializer,
    EmployeeCreateSerializer,
    CompanyRoleSerializer,
)
from .permissions import IsCompanyAdmin
from .models import ExternalDatabaseConfig
from .serializers import ExternalDatabaseConfigSerializer

from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)
from django.core.paginator import Paginator

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def create_department(request):

    serializer = DepartmentSerializer(
        data=request.data,
        context={"request": request}
    )

    if not serializer.is_valid():

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    department = serializer.save(
        company=request.user.profile.company
    )

    create_audit_log(
        company=request.user.profile.company,
        action="DEPARTMENT_CREATED",
        action_by=request.user.profile,
        message=f"Created department {department.name}",
        metadata={
            "department_id": str(department.id),
            "department_name": department.name,
        }
    )

    return Response(
        {
            "message": "Department created successfully.",
            "department": DepartmentSerializer(
                department
            ).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def list_departments(request):

    departments = Department.objects.filter(
        company=request.user.profile.company
    ).order_by("name")

    page = request.GET.get("page", 1)

    paginator = Paginator(
        departments,
        10
    )

    page_obj = paginator.get_page(page)

    serializer = DepartmentSerializer(
        page_obj,
        many=True
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": serializer.data
    })

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def create_employee(request):

    serializer = EmployeeCreateSerializer(
        data=request.data,
        context={"request": request}
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data
    company = request.user.profile.company

    email = data["email"].lower().strip()

    user = User.objects.create_user(
        username=email,
        email=email,
        password=data["password"],
        first_name=data["first_name"],
        last_name=data.get("last_name", "")
    )

    department = None

    if data.get("department_id"):
        department = Department.objects.get(
            id=data["department_id"],
            company=company
        )

    company_role = None

    if data.get("company_role_id"):
        company_role = CompanyRole.objects.get(
            id=data["company_role_id"],
            company=company,
            is_active=True
        )
    else:
        from tenants.role_utils import resolve_company_role

        company_role = resolve_company_role(
            company,
            data["role"],
        )

    if not company_role and data["role"] in ("EMPLOYEE", "MANAGER", "ACCOUNTS"):
        return Response(
            {
                "error": (
                    "No company role assigned. Create default roles under "
                    "Admin → Roles, then try again."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    profile = UserProfile.objects.create(
        user=user,
        company=company,
        department=department,
        role=data["role"],
        company_role=company_role
    )

    create_audit_log(
        company=company,
        action="USER_UPDATED",
        action_by=request.user.profile,
        message=f"Created user {profile.user.email}",
        metadata={
            "created_user": profile.user.email,
            "role": profile.role,
            "company_role": (
                profile.company_role.name
                if profile.company_role else None
            ),
            "department": (
                profile.department.name
                if profile.department else None
            ),
        }
    )

    return Response(
        {
            "message": "Employee created successfully.",
            "employee": UserProfileSerializer(profile, context={"request": request}).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def list_employees(request):

    employees = UserProfile.objects.select_related(
        "user",
        "department"
    ).filter(
        company=request.user.profile.company
    ).order_by(
        "user__first_name"
    )

    page = request.GET.get("page", 1)

    paginator = Paginator(
        employees,
        10
    )

    page_obj = paginator.get_page(page)

    serializer = UserProfileSerializer(
        page_obj,
        many=True,
        context={"request": request},
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": serializer.data
    })


@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def assign_missing_company_roles_view(request):
    from tenants.role_utils import assign_missing_company_roles

    company = request.user.profile.company
    updated_count = assign_missing_company_roles(company)

    return Response({
        "message": f"Assigned default company roles to {updated_count} user(s).",
        "updated_count": updated_count,
    })


@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def assign_manager(request):

    department_id = request.data.get(
        "department_id"
    )

    manager_id = request.data.get(
        "manager_id"
    )

    if not department_id or not manager_id:

        return Response(
            {
                "error": "department_id and manager_id are required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        department = Department.objects.get(
            id=department_id,
            company=request.user.profile.company
        )

    except Department.DoesNotExist:

        return Response(
            {
                "error": "Department not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    try:

        manager = UserProfile.objects.get(
            id=manager_id,
            company=request.user.profile.company,
            role="MANAGER"
        )

    except UserProfile.DoesNotExist:

        return Response(
            {
                "error": "Manager not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    department.manager = manager
    department.save()

    return Response(
        {
            "message": "Manager assigned successfully.",
            "department": department.name,
            "manager": manager.user.email
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def save_database_config(request):

    company = request.user.profile.company

    try:
        config = ExternalDatabaseConfig.objects.get(
            company=company
        )

        serializer = ExternalDatabaseConfigSerializer(
            config,
            data=request.data,
            partial=True
        )

    except ExternalDatabaseConfig.DoesNotExist:

        serializer = ExternalDatabaseConfigSerializer(
            data=request.data
        )

    if serializer.is_valid():

        serializer.save(company=company)

        return Response(
            {
                "message": "Database configuration saved successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def get_database_config(request):

    company = request.user.profile.company

    try:

        config = ExternalDatabaseConfig.objects.get(
            company=company
        )

    except ExternalDatabaseConfig.DoesNotExist:

        return Response(
            {
                "message": "Database configuration not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ExternalDatabaseConfigSerializer(
        config
    )

    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def create_company_policy(request):

    company = request.user.profile.company

    policy, created = CompanyPolicy.objects.get_or_create(
        company=company
    )

    serializer = CompanyPolicySerializer(
        policy
    )

    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def create_policy_rule(request):

    company = request.user.profile.company

    policy, created = CompanyPolicy.objects.get_or_create(
        company=company
    )

    serializer = PolicyCategoryRuleSerializer(
        data=request.data
    )

    if serializer.is_valid():

        serializer.save(
            policy=policy
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def list_policy_rules(request):

    company = request.user.profile.company

    policy, created = CompanyPolicy.objects.get_or_create(
        company=company
    )

    rules = PolicyCategoryRule.objects.filter(
        policy=policy
    )

    page = request.GET.get("page", 1)

    paginator = Paginator(
        rules,
        10
    )

    page_obj = paginator.get_page(page)

    serializer = PolicyCategoryRuleSerializer(
        page_obj,
        many=True
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": serializer.data
    })

from .models import ReimbursementEmailConfig
from .serializers import ReimbursementEmailConfigSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def get_reimbursement_email_config(request):
    company = request.user.profile.company

    try:
        config = ReimbursementEmailConfig.objects.get(company=company)
    except ReimbursementEmailConfig.DoesNotExist:
        return Response(
            {"message": "Reimbursement email config not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ReimbursementEmailConfigSerializer(config)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def save_reimbursement_email_config(request):
    company = request.user.profile.company

    config, created = ReimbursementEmailConfig.objects.get_or_create(
        company=company
    )

    serializer = ReimbursementEmailConfigSerializer(
        config,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save(company=company)

        return Response(
            {
                "message": "Reimbursement email configuration saved successfully.",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

from .models import CompanySMTPConfig
from .serializers import CompanySMTPConfigSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def get_smtp_config(request):
    company = request.user.profile.company

    try:
        config = CompanySMTPConfig.objects.get(company=company)
    except CompanySMTPConfig.DoesNotExist:
        return Response(
            {"message": "SMTP configuration not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CompanySMTPConfigSerializer(config)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def save_smtp_config(request):
    company = request.user.profile.company

    config, created = CompanySMTPConfig.objects.get_or_create(
        company=company
    )

    serializer = CompanySMTPConfigSerializer(
        config,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save(company=company)

        return Response({
            "message": "SMTP configuration saved successfully.",
            "data": serializer.data
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

from django.contrib.auth.models import User
from .serializers import CompanyUserUpdateSerializer


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def edit_company_user(request, user_id):
    company = request.user.profile.company

    try:
        profile = UserProfile.objects.select_related("user").get(
            id=user_id,
            company=company
        )
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CompanyUserUpdateSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = profile.user

    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.save(update_fields=["first_name", "last_name"])

    if "role" in data:
        profile.role = data["role"]

    if "department_id" in data:
        department_id = data["department_id"]

        if department_id is None:
            profile.department = None
        else:
            try:
                department = Department.objects.get(
                    id=department_id,
                    company=company
                )
                profile.department = department
            except Department.DoesNotExist:
                return Response(
                    {"error": "Department not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

    profile.phone_number = data.get("phone_number", profile.phone_number)
    profile.address = data.get("address", profile.address)

    profile.save()

    return Response({
        "message": "User updated successfully.",
        "user": {
            "profile_id": str(profile.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": profile.role,
            "department": profile.department.name if profile.department else None,
            "phone_number": profile.phone_number,
            "address": profile.address,
            "is_active": user.is_active,
        }
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def deactivate_company_user(request, user_id):
    company = request.user.profile.company

    try:
        profile = UserProfile.objects.select_related("user").get(
            id=user_id,
            company=company
        )
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    profile.user.is_active = False
    profile.user.save(update_fields=["is_active"])

    return Response({
        "message": "User deactivated successfully."
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def activate_company_user(request, user_id):
    company = request.user.profile.company

    try:
        profile = UserProfile.objects.select_related("user").get(
            id=user_id,
            company=company
        )
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    profile.user.is_active = True
    profile.user.save(update_fields=["is_active"])

    return Response({
        "message": "User activated successfully."
    })

from django.contrib.auth.models import User

from audit_logs.utils import create_audit_log

from .serializers import CompanyUserUpdateSerializer

@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def edit_company_user(request, user_id):

    company = request.user.profile.company

    try:
        profile = UserProfile.objects.select_related(
            "user",
            "department",
            "company_role"
        ).get(
            id=user_id,
            company=company
        )

    except UserProfile.DoesNotExist:

        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CompanyUserUpdateSerializer(
        data=request.data,
        context={"request": request}
    )

    if not serializer.is_valid():

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data

    if profile.user == request.user and "role" in data:

        return Response(
            {"error": "You cannot change your own system role."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = profile.user

    user.first_name = data.get(
        "first_name",
        user.first_name
    )

    user.last_name = data.get(
        "last_name",
        user.last_name
    )

    user.save(update_fields=[
        "first_name",
        "last_name"
    ])

    if "role" in data:
        profile.role = data["role"]

    if "department_id" in data:

        department_id = data["department_id"]

        if department_id is None:
            profile.department = None

        else:
            department = Department.objects.get(
                id=department_id,
                company=company,
                is_active=True
            )

            profile.department = department

    if "company_role_id" in data:

        company_role_id = data["company_role_id"]

        if company_role_id is None:
            profile.company_role = None

        else:
            company_role = CompanyRole.objects.get(
                id=company_role_id,
                company=company,
                is_active=True
            )

            profile.company_role = company_role

    profile.phone_number = data.get(
        "phone_number",
        profile.phone_number
    )

    profile.address = data.get(
        "address",
        profile.address
    )

    profile.save()

    create_audit_log(
        company=company,
        action="USER_UPDATED",
        action_by=request.user.profile,
        message=f"Updated user {profile.user.email}",
        metadata={
            "updated_user": profile.user.email,
            "role": profile.role,
            "company_role": (
                profile.company_role.name
                if profile.company_role else None
            ),
            "department": (
                profile.department.name
                if profile.department else None
            ),
        }
    )

    return Response({
        "message": "User updated successfully.",
        "user": {
            "profile_id": str(profile.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": profile.role,
            "company_role": (
                profile.company_role.name
                if profile.company_role else None
            ),
            "company_role_id": (
                profile.company_role.id
                if profile.company_role else None
            ),
            "department": (
                profile.department.name
                if profile.department else None
            ),
            "department_id": (
                str(profile.department.id)
                if profile.department else None
            ),
            "phone_number": profile.phone_number,
            "address": profile.address,
            "is_active": user.is_active,
        }
    })
@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def deactivate_company_user(request, user_id):

    company = request.user.profile.company

    try:
        profile = UserProfile.objects.select_related(
            "user"
        ).get(
            id=user_id,
            company=company
        )

    except UserProfile.DoesNotExist:

        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if profile.user == request.user:

        return Response(
            {"error": "You cannot deactivate your own account."},
            status=status.HTTP_400_BAD_REQUEST
        )

    profile.user.is_active = False

    profile.user.save(update_fields=["is_active"])

    create_audit_log(
        company=company,
        action="USER_DEACTIVATED",
        action_by=request.user.profile,
        message=f"Deactivated user {profile.user.email}",
        metadata={
            "deactivated_user": profile.user.email,
        }
    )

    return Response({
        "message": "User deactivated successfully."
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def activate_company_user(request, user_id):

    company = request.user.profile.company

    try:
        profile = UserProfile.objects.select_related(
            "user"
        ).get(
            id=user_id,
            company=company
        )

    except UserProfile.DoesNotExist:

        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    profile.user.is_active = True

    profile.user.save(update_fields=["is_active"])

    create_audit_log(
        company=company,
        action="USER_ACTIVATED",
        action_by=request.user.profile,
        message=f"Activated user {profile.user.email}",
        metadata={
            "activated_user": profile.user.email,
        }
    )

    return Response({
        "message": "User activated successfully."
    })

from .serializers import DepartmentUpdateSerializer
@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def update_department(request, department_id):
    company = request.user.profile.company

    try:
        department = Department.objects.get(
            id=department_id,
            company=company
        )
    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = DepartmentUpdateSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    if "name" in data:
        department.name = data["name"]

    if "manager_id" in data:
        manager_id = data["manager_id"]

        if manager_id is None:
            department.manager = None
        else:
            try:
                manager = UserProfile.objects.get(
                    id=manager_id,
                    company=company,
                    role="MANAGER",
                    user__is_active=True
                )
            except UserProfile.DoesNotExist:
                return Response(
                    {"error": "Active manager not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            department.manager = manager

            UserProfile.objects.filter(
                company=company,
                department=department,
                role="MANAGER"
            ).exclude(id=manager.id).update(role="EMPLOYEE")

            manager.department = department
            manager.role = "MANAGER"
            manager.save(update_fields=["department", "role"])

    department.save()

    create_audit_log(
        company=company,
        action="DEPARTMENT_UPDATED",
        action_by=request.user.profile,
        message=f"Updated department {department.name}",
        metadata={
            "department_id": str(department.id),
            "department_name": department.name,
            "manager_email": department.manager.user.email if department.manager else None,
        }
    )

    return Response({
        "message": "Department updated successfully.",
        "department": {
            "id": str(department.id),
            "name": department.name,
            "manager": str(department.manager.id) if department.manager else None,
            "manager_email": department.manager.user.email if department.manager else None,
            "is_active": department.is_active,
        }
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def deactivate_department(request, department_id):
    company = request.user.profile.company

    try:
        department = Department.objects.get(
            id=department_id,
            company=company
        )
    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if department.employees.filter(user__is_active=True).exists():
        return Response(
            {
                "error": "Cannot deactivate department with active users. Move or deactivate users first."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    department.is_active = False
    department.save(update_fields=["is_active", "updated_at"])

    create_audit_log(
        company=company,
        action="DEPARTMENT_DEACTIVATED",
        action_by=request.user.profile,
        message=f"Deactivated department {department.name}",
        metadata={
            "department_id": str(department.id),
            "department_name": department.name,
        }
    )

    return Response({
        "message": "Department deactivated successfully."
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def activate_department(request, department_id):
    company = request.user.profile.company

    try:
        department = Department.objects.get(
            id=department_id,
            company=company
        )
    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    department.is_active = True
    department.save(update_fields=["is_active", "updated_at"])

    create_audit_log(
        company=company,
        action="DEPARTMENT_ACTIVATED",
        action_by=request.user.profile,
        message=f"Activated department {department.name}",
        metadata={
            "department_id": str(department.id),
            "department_name": department.name,
        }
    )

    return Response({
        "message": "Department activated successfully."
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def update_policy_rule(request, rule_id):
    company = request.user.profile.company

    try:
        rule = PolicyCategoryRule.objects.get(
            id=rule_id,
            policy__company=company
        )
    except PolicyCategoryRule.DoesNotExist:
        return Response(
            {"error": "Policy rule not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = PolicyCategoryRuleSerializer(
        rule,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    rule = serializer.save()

    create_audit_log(
        company=company,
        action="POLICY_RULE_UPDATED",
        action_by=request.user.profile,
        message=f"Updated policy rule {rule.category_name}",
        metadata={
            "rule_id": str(rule.id),
            "category_name": rule.category_name,
            "max_amount": str(rule.max_amount),
            "is_active": rule.is_active,
        }
    )

    return Response({
        "message": "Policy rule updated successfully.",
        "rule": PolicyCategoryRuleSerializer(rule).data
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def deactivate_policy_rule(request, rule_id):
    company = request.user.profile.company

    try:
        rule = PolicyCategoryRule.objects.get(
            id=rule_id,
            policy__company=company
        )
    except PolicyCategoryRule.DoesNotExist:
        return Response(
            {"error": "Policy rule not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    rule.is_active = False
    rule.save(update_fields=["is_active", "updated_at"])

    create_audit_log(
        company=company,
        action="POLICY_RULE_DEACTIVATED",
        action_by=request.user.profile,
        message=f"Deactivated policy rule {rule.category_name}",
        metadata={
            "rule_id": str(rule.id),
            "category_name": rule.category_name,
        }
    )

    return Response({
        "message": "Policy rule deactivated successfully."
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def activate_policy_rule(request, rule_id):
    company = request.user.profile.company

    try:
        rule = PolicyCategoryRule.objects.get(
            id=rule_id,
            policy__company=company
        )
    except PolicyCategoryRule.DoesNotExist:
        return Response(
            {"error": "Policy rule not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    rule.is_active = True
    rule.save(update_fields=["is_active", "updated_at"])

    create_audit_log(
        company=company,
        action="POLICY_RULE_ACTIVATED",
        action_by=request.user.profile,
        message=f"Activated policy rule {rule.category_name}",
        metadata={
            "rule_id": str(rule.id),
            "category_name": rule.category_name,
        }
    )

    return Response({
        "message": "Policy rule activated successfully."
    })

@api_view(["DELETE"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def delete_company_user(request, user_id):

    company = request.user.profile.company

    try:
        profile = UserProfile.objects.select_related(
            "user"
        ).get(
            id=user_id,
            company=company
        )

    except UserProfile.DoesNotExist:

        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if profile.user == request.user:

        return Response(
            {"error": "You cannot delete your own account."},
            status=status.HTTP_400_BAD_REQUEST
        )

    email = profile.user.email

    profile.user.delete()

    create_audit_log(
        company=company,
        action="USER_DELETED",
        action_by=request.user.profile,
        message=f"Deleted user {email}",
        metadata={
            "deleted_user": email,
        }
    )

    return Response({
        "message": "User deleted successfully."
    })    

@api_view(["DELETE"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def delete_department(request, department_id):

    company = request.user.profile.company

    try:
        department = Department.objects.get(
            id=department_id,
            company=company
        )

    except Department.DoesNotExist:

        return Response(
            {"error": "Department not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    active_users = department.employees.filter(
        user__is_active=True
    ).exists()

    if active_users:

        return Response(
            {
                "error": "Cannot delete department with active users."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    department_name = department.name

    department.delete()

    create_audit_log(
        company=company,
        action="DEPARTMENT_DELETED",
        action_by=request.user.profile,
        message=f"Deleted department {department_name}",
        metadata={
            "department_name": department_name,
        }
    )

    return Response({
        "message": "Department deleted successfully."
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_company_role(request):

    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can create roles."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = CompanyRoleSerializer(
        data=request.data,
        context={"request": request}
    )

    if serializer.is_valid():

        serializer.save(
            company=profile.company
        )

        return Response(
            {
                "message": "Role created successfully.",
                "role": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_roles(request):

    profile = request.user.profile

    roles = CompanyRole.objects.filter(
        company=profile.company,
        is_active=True
    ).order_by("name")

    page = request.GET.get("page", 1)

    paginator = Paginator(
        roles,
        10
    )

    page_obj = paginator.get_page(page)

    serializer = CompanyRoleSerializer(
        page_obj,
        many=True
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": serializer.data
    })

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_company_role(request, role_id):

    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can update roles."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        role = CompanyRole.objects.get(
            id=role_id,
            company=profile.company
        )

    except CompanyRole.DoesNotExist:

        return Response(
            {"error": "Role not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CompanyRoleSerializer(
        role,
        data=request.data,
        partial=True,
        context={"request": request}
    )

    if serializer.is_valid():

        serializer.save()

        return Response({
            "message": "Role updated successfully.",
            "role": serializer.data
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def deactivate_company_role(request, role_id):

    profile = request.user.profile

    if profile.role != "COMPANY_ADMIN":
        return Response(
            {"error": "Only company admin can deactivate roles."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        role = CompanyRole.objects.get(
            id=role_id,
            company=profile.company
        )

    except CompanyRole.DoesNotExist:

        return Response(
            {"error": "Role not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    role.is_active = False
    role.save(update_fields=["is_active"])

    return Response({
        "message": "Role deactivated successfully."
    })

import psycopg2
import pymysql
import pyodbc
import oracledb

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def test_database_connection(request):
    company = request.user.profile.company

    try:
        config = ExternalDatabaseConfig.objects.get(company=company)
    except ExternalDatabaseConfig.DoesNotExist:
        return Response(
            {"error": "Database configuration not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        if config.db_engine == "postgresql":
            conn = psycopg2.connect(
                host=config.db_host,
                port=config.db_port,
                dbname=config.db_name,
                user=config.db_user,
                password=config.db_password,
                connect_timeout=10,
            )

        elif config.db_engine == "mysql":
            conn = pymysql.connect(
                host=config.db_host,
                port=config.db_port,
                database=config.db_name,
                user=config.db_user,
                password=config.db_password,
                connect_timeout=10,
            )

        elif config.db_engine == "mssql":
            conn = pyodbc.connect(
                (
                    "DRIVER={ODBC Driver 17 for SQL Server};"
                    f"SERVER={config.db_host},{config.db_port};"
                    f"DATABASE={config.db_name};"
                    f"UID={config.db_user};"
                    f"PWD={config.db_password};"
                    "TrustServerCertificate=yes;"
                ),
                timeout=10
            )

        elif config.db_engine == "oracle":
            dsn = oracledb.makedsn(
                config.db_host,
                config.db_port,
                service_name=config.db_name
            )

            conn = oracledb.connect(
                user=config.db_user,
                password=config.db_password,
                dsn=dsn
            )

        else:
            return Response(
                {"error": "Unsupported database engine."},
                status=status.HTTP_400_BAD_REQUEST
            )

        conn.close()

        create_audit_log(
            company=company,
            action="DATABASE_CONNECTED",
            action_by=request.user.profile,
            message="External database connection tested successfully.",
            metadata={
                "db_engine": config.db_engine,
                "db_host": config.db_host,
                "db_name": config.db_name,
            }
        )

        return Response({
            "success": True,
            "message": "Database connection successful.",
            "db_engine": config.db_engine
        })

    except Exception as e:
        create_audit_log(
            company=company,
            action="DATABASE_CONNECTION_FAILED",
            action_by=request.user.profile,
            message="External database connection failed.",
            metadata={
                "db_engine": config.db_engine,
                "error": str(e),
            }
        )

        return Response(
            {
                "success": False,
                "error": str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
from django.utils import timezone
from .models import DatabaseSyncLog

def get_external_db_connection(config):
    if config.db_engine == "postgresql":
        return psycopg2.connect(
            host=config.db_host,
            port=config.db_port,
            dbname=config.db_name,
            user=config.db_user,
            password=config.db_password,
            connect_timeout=10,
        )

    if config.db_engine == "mysql":
        return pymysql.connect(
            host=config.db_host,
            port=config.db_port,
            database=config.db_name,
            user=config.db_user,
            password=config.db_password,
            connect_timeout=10,
        )

    if config.db_engine == "mssql":
        return pyodbc.connect(
            (
                "DRIVER={ODBC Driver 17 for SQL Server};"
                f"SERVER={config.db_host},{config.db_port};"
                f"DATABASE={config.db_name};"
                f"UID={config.db_user};"
                f"PWD={config.db_password};"
                "TrustServerCertificate=yes;"
            ),
            timeout=10
        )

    if config.db_engine == "oracle":
        dsn = oracledb.makedsn(
            config.db_host,
            config.db_port,
            service_name=config.db_name
        )

        return oracledb.connect(
            user=config.db_user,
            password=config.db_password,
            dsn=dsn
        )

    raise Exception("Unsupported database engine.")

from tenants.services import sync_company_external_database

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def sync_external_database(request):

    result = sync_company_external_database(
        company=request.user.profile.company,
        action_by=request.user.profile
    )

    if result["success"]:
        return Response(result)

    return Response(
        result,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def database_sync_status(request):

    company = request.user.profile.company

    latest_log = DatabaseSyncLog.objects.filter(
        company=company
    ).order_by("-started_at").first()

    try:
        config = ExternalDatabaseConfig.objects.get(company=company)
        last_synced_at = config.last_synced_at
    except ExternalDatabaseConfig.DoesNotExist:
        last_synced_at = None

    if not latest_log:
        return Response({
            "last_synced_at": last_synced_at,
            "latest_sync": None
        })

    return Response({
        "last_synced_at": last_synced_at,
        "latest_sync": {
            "status": latest_log.status,
            "records_created": latest_log.records_created,
            "records_updated": latest_log.records_updated,
            "error_message": latest_log.error_message,
            "started_at": latest_log.started_at,
            "completed_at": latest_log.completed_at,
        }
    })    

from .serializers import DatabaseSyncLogSerializer
from .models import DatabaseSyncLog


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def database_sync_logs(request):

    company = request.user.profile.company

    logs = DatabaseSyncLog.objects.filter(
        company=company
    ).order_by("-started_at")

    status_filter = request.GET.get("status")

    if status_filter:
        logs = logs.filter(status=status_filter.upper())

    serializer = DatabaseSyncLogSerializer(
        logs,
        many=True
    )

    return Response({
        "count": logs.count(),
        "results": serializer.data
    })

from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenants.permissions import IsCompanyAdmin
from tenants.models import DatabaseSyncLog


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def database_sync_dashboard(request):

    company = request.user.profile.company

    logs = DatabaseSyncLog.objects.filter(
        company=company
    )

    latest_sync = logs.order_by("-started_at").first()

    successful_syncs = logs.filter(
        status=DatabaseSyncLog.STATUS_SUCCESS
    )

    failed_syncs = logs.filter(
        status=DatabaseSyncLog.STATUS_FAILED
    )

    total_records_created = logs.aggregate(
        total=Sum("records_created")
    )["total"] or 0

    total_records_updated = logs.aggregate(
        total=Sum("records_updated")
    )["total"] or 0

    return Response({
        "metrics": {
            "total_syncs": logs.count(),
            "successful_syncs": successful_syncs.count(),
            "failed_syncs": failed_syncs.count(),
            "total_records_created": total_records_created,
            "total_records_updated": total_records_updated,
        },

        "latest_sync": {
            "id": str(latest_sync.id),
            "status": latest_sync.status,
            "records_created": latest_sync.records_created,
            "records_updated": latest_sync.records_updated,
            "error_message": latest_sync.error_message,
            "started_at": latest_sync.started_at,
            "completed_at": latest_sync.completed_at,
        } if latest_sync else None,

        "recent_syncs": [
            {
                "id": str(log.id),
                "status": log.status,
                "records_created": log.records_created,
                "records_updated": log.records_updated,
                "error_message": log.error_message,
                "started_at": log.started_at,
                "completed_at": log.completed_at,
            }
            for log in logs.order_by("-started_at")[:10]
        ]
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def assign_missing_company_roles_view(request):
    return Response({
        "message": "Assign missing company roles API is not implemented yet."
    })