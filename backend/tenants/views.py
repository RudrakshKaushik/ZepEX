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
from django.db.models import Q

from decimal import Decimal
from .serializers import CompanyFinanceSettingsSerializer

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

    search = request.GET.get("search")

    departments = Department.objects.select_related(
        "manager__user"
    ).filter(
        company=request.user.profile.company
    )

    if search:
        departments = departments.filter(
            name__icontains=search
        )

    departments = departments.order_by(
        "name"
    )

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
        "filters": {
            "search": search,
        },
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

    search = request.GET.get("search")
    department_id = request.GET.get("department_id")
    role = request.GET.get("role")

    employees = UserProfile.objects.select_related(
        "user",
        "department",
        "company_role"
    ).filter(
        company=request.user.profile.company
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

    employees = employees.order_by(
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
        "filters": {
            "search": search,
            "department_id": department_id,
            "role": role,
        },
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

    search = request.GET.get("search")
    category = request.GET.get("category")

    policy, created = CompanyPolicy.objects.get_or_create(
        company=company
    )

    rules = PolicyCategoryRule.objects.filter(
        policy=policy
    )

    if category:
        rules = rules.filter(
            category_name__iexact=category
        )

    if search:
        rules = rules.filter(
            Q(category_name__icontains=search)
            | Q(category_description__icontains=search)
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
        "filters": {
            "search": search,
            "category": category,
        },
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


def active_company_admin_count(company):
    return UserProfile.objects.filter(
        company=company,
        role="COMPANY_ADMIN",
        user__is_active=True,
    ).count()


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
        context={
            "request": request,
            "profile_id": profile.id,
            "user_id": profile.user_id,
            "profile_role": profile.role,
        },
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

    if (
        profile.role == "COMPANY_ADMIN"
        and "role" in data
        and data["role"] != "COMPANY_ADMIN"
        and active_company_admin_count(company) <= 1
    ):
        return Response(
            {"error": "Cannot change role of the only company admin."},
            status=status.HTTP_400_BAD_REQUEST,
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

    update_user_fields = ["first_name", "last_name"]

    if "email" in data:
        user.email = data["email"]
        user.username = data["email"]
        update_user_fields.extend(["email", "username"])

    user.save(update_fields=update_user_fields)

    if "role" in data:
        profile.role = data["role"]
        if data["role"] == "COMPANY_ADMIN":
            profile.company_role = None
            profile.department = None

    effective_role = data.get("role", profile.role)

    if "department_id" in data and effective_role != "COMPANY_ADMIN":

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

    if profile.role == "COMPANY_ADMIN" and active_company_admin_count(company) <= 1:
        return Response(
            {"error": "Cannot deactivate the only company admin."},
            status=status.HTTP_400_BAD_REQUEST,
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

    if profile.role == "COMPANY_ADMIN" and active_company_admin_count(company) <= 1:
        return Response(
            {"error": "Cannot delete the only company admin."},
            status=status.HTTP_400_BAD_REQUEST,
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

    search = request.GET.get("search")
    can_approve_expense = request.GET.get("can_approve_expense")

    roles = CompanyRole.objects.filter(
        company=profile.company,
        is_active=True
    )

    if search:
        roles = roles.filter(
            Q(name__icontains=search)
        )

    if can_approve_expense:
        roles = roles.filter(
            can_approve_expense=
            can_approve_expense.lower() == "true"
        )

    roles = roles.order_by("name")

    page = request.GET.get("page", 1)

    paginator = Paginator(roles, 10)

    page_obj = paginator.get_page(page)

    serializer = CompanyRoleSerializer(
        page_obj,
        many=True
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "filters": {
            "search": search,
            "can_approve_expense": can_approve_expense,
        },
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


import csv
import io

from rest_framework.parsers import MultiPartParser

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def import_departments(request):

    profile = request.user.profile

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"error": "CSV file is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        decoded_file = file.read().decode("utf-8")

        csv_data = csv.DictReader(
            io.StringIO(decoded_file)
        )

        created_count = 0
        skipped_count = 0
        errors = []

        for row_number, row in enumerate(csv_data, start=2):

            name = (
                row.get("name", "")
                .strip()
            )

            if not name:
                errors.append({
                    "row": row_number,
                    "message": "Department name is required."
                })
                continue

            exists = Department.objects.filter(
                company=profile.company,
                name__iexact=name
            ).exists()

            if exists:
                skipped_count += 1
                continue

            Department.objects.create(
                company=profile.company,
                name=name
            )

            created_count += 1

        create_audit_log(
            company=profile.company,
            action="DEPARTMENT_IMPORT",
            action_by=profile,
            message="Departments imported.",
            metadata={
                "created": created_count,
                "skipped": skipped_count,
                "errors": len(errors),
            }
        )

        return Response({
            "success": True,
            "created": created_count,
            "skipped": skipped_count,
            "errors": errors,
        })

    except Exception as e:

        return Response(
            {
                "success": False,
                "error": str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def import_company_roles(request):

    profile = request.user.profile

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"error": "CSV file is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        decoded_file = file.read().decode("utf-8")

        csv_data = csv.DictReader(
            io.StringIO(decoded_file)
        )

        created_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        def to_bool(value):
            return str(value).strip().lower() in [
                "true",
                "1",
                "yes",
                "y"
            ]

        for row_number, row in enumerate(csv_data, start=2):

            name = row.get("name", "").strip()

            if not name:
                errors.append({
                    "row": row_number,
                    "message": "Role name is required."
                })
                continue

            role, created = CompanyRole.objects.update_or_create(
                company=profile.company,
                name=name,
                defaults={
                    "can_upload_receipt": to_bool(
                        row.get("can_upload_receipt", False)
                    ),
                    "can_submit_expense": to_bool(
                        row.get("can_submit_expense", False)
                    ),
                    "can_approve_expense": to_bool(
                        row.get("can_approve_expense", False)
                    ),
                    "can_mark_paid": to_bool(
                        row.get("can_mark_paid", False)
                    ),
                    "is_active": True,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        create_audit_log(
            company=profile.company,
            action="COMPANY_ROLES_IMPORT",
            action_by=profile,
            message="Company roles imported.",
            metadata={
                "created": created_count,
                "updated": updated_count,
                "skipped": skipped_count,
                "errors": len(errors),
            }
        )

        return Response({
            "success": True,
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": errors,
        })

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def import_company_roles(request):

    profile = request.user.profile

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"error": "CSV file is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        decoded_file = file.read().decode("utf-8")

        csv_data = csv.DictReader(
            io.StringIO(decoded_file)
        )

        created_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        def to_bool(value):
            return str(value).strip().lower() in [
                "true",
                "1",
                "yes",
                "y"
            ]

        for row_number, row in enumerate(csv_data, start=2):

            name = row.get("name", "").strip()

            if not name:
                errors.append({
                    "row": row_number,
                    "message": "Role name is required."
                })
                continue

            role, created = CompanyRole.objects.update_or_create(
                company=profile.company,
                name=name,
                defaults={
                    "can_upload_receipt": to_bool(
                        row.get("can_upload_receipt", False)
                    ),
                    "can_submit_expense": to_bool(
                        row.get("can_submit_expense", False)
                    ),
                    "can_approve_expense": to_bool(
                        row.get("can_approve_expense", False)
                    ),
                    "can_mark_paid": to_bool(
                        row.get("can_mark_paid", False)
                    ),
                    "is_active": True,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        create_audit_log(
            company=profile.company,
            action="COMPANY_ROLES_IMPORT",
            action_by=profile,
            message="Company roles imported.",
            metadata={
                "created": created_count,
                "updated": updated_count,
                "skipped": skipped_count,
                "errors": len(errors),
            }
        )

        return Response({
            "success": True,
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": errors,
        })

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )        
    
@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def import_employees(request):

    profile = request.user.profile
    company = profile.company

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"error": "CSV file is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        decoded_file = file.read().decode("utf-8")
        csv_data = csv.DictReader(io.StringIO(decoded_file))

        created_count = 0
        skipped_count = 0
        errors = []

        for row_number, row in enumerate(csv_data, start=2):

            first_name = row.get("first_name", "").strip()
            last_name = row.get("last_name", "").strip()
            email = row.get("email", "").strip().lower()
            department_name = row.get("department", "").strip()
            role = row.get("role", "").strip().upper()
            company_role_name = row.get("company_role", "").strip()
            password = row.get("password", "Password@123").strip()

            if not email:
                errors.append({
                    "row": row_number,
                    "message": "Email is required."
                })
                continue

            if not first_name:
                errors.append({
                    "row": row_number,
                    "message": "First name is required."
                })
                continue

            if role not in ["COMPANY_ADMIN", "MANAGER", "ACCOUNTS", "EMPLOYEE"]:
                errors.append({
                    "row": row_number,
                    "message": "Invalid role."
                })
                continue

            if User.objects.filter(email=email).exists():
                skipped_count += 1
                continue

            department = None

            if department_name:
                department = Department.objects.filter(
                    company=company,
                    name__iexact=department_name,
                    is_active=True
                ).first()

                if not department:
                    errors.append({
                        "row": row_number,
                        "message": f"Department '{department_name}' not found."
                    })
                    continue

            company_role = None

            if company_role_name:
                company_role = CompanyRole.objects.filter(
                    company=company,
                    name__iexact=company_role_name,
                    is_active=True
                ).first()

                if not company_role:
                    errors.append({
                        "row": row_number,
                        "message": f"Company role '{company_role_name}' not found."
                    })
                    continue

            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            UserProfile.objects.create(
                user=user,
                company=company,
                department=department,
                role=role,
                company_role=company_role
            )

            created_count += 1

        create_audit_log(
            company=company,
            action="EMPLOYEE_IMPORT",
            action_by=profile,
            message="Employees imported.",
            metadata={
                "created": created_count,
                "skipped": skipped_count,
                "errors": len(errors),
            }
        )

        return Response({
            "success": True,
            "created": created_count,
            "skipped": skipped_count,
            "errors": errors,
        })

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    

@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def import_policy_rules(request):

    profile = request.user.profile
    company = profile.company

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"error": "CSV file is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        policy, _ = CompanyPolicy.objects.get_or_create(
            company=company
        )

        decoded_file = file.read().decode("utf-8")

        csv_data = csv.DictReader(
            io.StringIO(decoded_file)
        )

        created_count = 0
        updated_count = 0
        errors = []

        for row_number, row in enumerate(csv_data, start=2):

            category = row.get(
                "category",
                ""
            ).strip().lower()

            if not category:
                errors.append({
                    "row": row_number,
                    "message": "Category is required."
                })
                continue

            try:
                max_amount = Decimal(
                    row.get("max_amount", 0)
                )

            except Exception:
                errors.append({
                    "row": row_number,
                    "message": "Invalid max_amount."
                })
                continue

            rule, created = PolicyCategoryRule.objects.update_or_create(
                policy=policy,
                category=category,
                defaults={
                    "max_amount": max_amount
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        create_audit_log(
            company=company,
            action="POLICY_RULE_IMPORT",
            action_by=profile,
            message="Policy rules imported.",
            metadata={
                "created": created_count,
                "updated": updated_count,
                "errors": len(errors),
            }
        )

        return Response({
            "success": True,
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
        })

    except Exception as e:

        return Response(
            {
                "success": False,
                "error": str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )    
    
from django.http import HttpResponse

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_department_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="department_template.csv"'

    writer = csv.writer(response)
    writer.writerow(["name"])
    writer.writerow(["Engineering"])
    writer.writerow(["HR"])
    writer.writerow(["Finance"])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_roles_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="roles_template.csv"'

    writer = csv.writer(response)
    writer.writerow([
        "name",
        "can_upload_receipt",
        "can_submit_expense",
        "can_approve_expense",
        "can_mark_paid"
    ])
    writer.writerow(["Employee", "true", "true", "false", "false"])
    writer.writerow(["Manager", "false", "false", "true", "false"])
    writer.writerow(["Accounts", "false", "false", "false", "true"])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_employees_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="employees_template.csv"'

    writer = csv.writer(response)
    writer.writerow([
        "first_name",
        "last_name",
        "email",
        "department",
        "role",
        "company_role",
        "password"
    ])
    writer.writerow([
        "Rudraksh",
        "Kaushik",
        "rudraksh@company.com",
        "Engineering",
        "EMPLOYEE",
        "Employee",
        "Password@123"
    ])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_policy_rules_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="policy_rules_template.csv"'

    writer = csv.writer(response)
    writer.writerow(["category", "max_amount"])
    writer.writerow(["food", "1000"])
    writer.writerow(["hotel", "5000"])
    writer.writerow(["fuel", "3000"])

    return response

import csv

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def department_template_info(request):
    return Response({
        "success": True,
        "template_name": "department_template.csv",
        "description": "Import company departments in bulk.",
        "required_columns": ["name"],
        "sample_data": [
            {"name": "Engineering"},
            {"name": "HR"},
            {"name": "Finance"}
        ]
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def roles_template_info(request):
    return Response({
        "success": True,
        "template_name": "roles_template.csv",
        "description": "Import company roles and permissions.",
        "required_columns": [
            "name",
            "can_upload_receipt",
            "can_submit_expense",
            "can_approve_expense",
            "can_mark_paid"
        ],
        "sample_data": [
            {
                "name": "Employee",
                "can_upload_receipt": True,
                "can_submit_expense": True,
                "can_approve_expense": False,
                "can_mark_paid": False
            },
            {
                "name": "Manager",
                "can_upload_receipt": False,
                "can_submit_expense": False,
                "can_approve_expense": True,
                "can_mark_paid": False
            },
            {
                "name": "Accounts",
                "can_upload_receipt": False,
                "can_submit_expense": False,
                "can_approve_expense": False,
                "can_mark_paid": True
            }
        ]
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def employees_template_info(request):
    return Response({
        "success": True,
        "template_name": "employees_template.csv",
        "description": "Import employees in bulk.",
        "required_columns": [
            "first_name",
            "last_name",
            "email",
            "department",
            "role",
            "company_role",
            "password"
        ],
        "allowed_roles": [
            "COMPANY_ADMIN",
            "MANAGER",
            "ACCOUNTS",
            "EMPLOYEE"
        ],
        "sample_data": [
            {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@company.com",
                "department": "Engineering",
                "role": "EMPLOYEE",
                "company_role": "Employee",
                "password": "Password@123"
            }
        ]
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def policy_rules_template_info(request):
    return Response({
        "success": True,
        "template_name": "policy_rules_template.csv",
        "description": "Import reimbursement policy rules.",
        "required_columns": [
            "category",
            "max_amount"
        ],
        "supported_categories": [
            "food",
            "hotel",
            "flight_ticket",
            "train_ticket",
            "car_rental",
            "fuel",
            "gas",
            "parking",
            "office_supplies",
            "medical",
            "courier",
            "telecom",
            "training",
            "relocation",
            "wfh",
            "miscellaneous"
        ],
        "sample_data": [
            {"category": "food", "max_amount": "1000"},
            {"category": "hotel", "max_amount": "5000"},
            {"category": "fuel", "max_amount": "3000"}
        ]
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_department_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="department_template.csv"'

    writer = csv.writer(response)
    writer.writerow(["name"])
    writer.writerow(["Engineering"])
    writer.writerow(["HR"])
    writer.writerow(["Finance"])
    writer.writerow(["Accounts"])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_roles_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="roles_template.csv"'

    writer = csv.writer(response)
    writer.writerow([
        "name",
        "can_upload_receipt",
        "can_submit_expense",
        "can_approve_expense",
        "can_mark_paid"
    ])
    writer.writerow(["Employee", "true", "true", "false", "false"])
    writer.writerow(["Manager", "false", "false", "true", "false"])
    writer.writerow(["Accounts", "false", "false", "false", "true"])
    writer.writerow(["CEO", "false", "false", "true", "false"])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_employees_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="employees_template.csv"'

    writer = csv.writer(response)
    writer.writerow([
        "first_name",
        "last_name",
        "email",
        "department",
        "role",
        "company_role",
        "password"
    ])
    writer.writerow([
        "John",
        "Doe",
        "john@company.com",
        "Engineering",
        "EMPLOYEE",
        "Employee",
        "Password@123"
    ])

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def download_policy_rules_template(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="policy_rules_template.csv"'

    writer = csv.writer(response)
    writer.writerow(["category", "max_amount"])
    writer.writerow(["food", "1000"])
    writer.writerow(["hotel", "5000"])
    writer.writerow(["flight_ticket", "15000"])
    writer.writerow(["train_ticket", "8000"])
    writer.writerow(["fuel", "3000"])
    writer.writerow(["parking", "1000"])
    writer.writerow(["medical", "5000"])
    writer.writerow(["office_supplies", "2000"])
    writer.writerow(["miscellaneous", "1000"])

    return response

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from tenants.email_utils import send_company_email

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def send_employee_invites(request):

    profile = request.user.profile
    company = profile.company

    employee_ids = request.data.get("employee_ids", [])
    send_to_all = request.data.get("send_to_all", False)

    employees = UserProfile.objects.select_related(
        "user",
        "department",
        "company_role"
    ).filter(
        company=company,
        user__is_active=True
    )

    if not send_to_all:
        if not employee_ids:
            return Response(
                {"error": "employee_ids or send_to_all is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        employees = employees.filter(
            id__in=employee_ids
        )

    sent_count = 0
    failed_count = 0
    errors = []

    login_url = getattr(
        settings,
        "FRONTEND_LOGIN_URL",
        "http://localhost:5173/login"
    )

    for employee in employees:
        temporary_password = "Password@123"

        html_content = render_to_string(
            "emails/employee_invite.html",
            {
                "employee_name": employee.user.first_name or employee.user.email,
                "company_name": company.name,
                "email": employee.user.email,
                "department": (
                    employee.department.name
                    if employee.department else "Not Assigned"
                ),
                "role": (
                    employee.company_role.name
                    if employee.company_role else employee.role
                ),
                "temporary_password": temporary_password,
                "login_url": login_url,
            }
        )

        text_content = strip_tags(html_content)

        result = send_company_email(
            company,
            subject=f"Welcome to ZepEx - {company.name}",
            text_content=text_content,
            html_content=html_content,
            to_emails=[employee.user.email],
        )

        if result.get("success"):
            sent_count += 1
        else:
            failed_count += 1
            errors.append({
                "employee": employee.user.email,
                "error": result.get("error", "Failed to send invite email."),
            })

    create_audit_log(
        company=company,
        action="EMPLOYEE_INVITES_SENT",
        action_by=profile,
        message="Employee invite emails sent.",
        metadata={
            "sent": sent_count,
            "failed": failed_count,
        }
    )

    return Response({
        "success": True,
        "sent": sent_count,
        "failed": failed_count,
        "errors": errors,
    })

from .models import Currency, CompanyFinanceSettings
from .serializers import CompanyFinanceSettingsSerializer

@api_view(["GET", "PUT"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def company_finance_settings(request):

    profile = request.user.profile
    company = profile.company

    default_currency = Currency.objects.filter(
        code="INR",
        is_active=True
    ).first()

    finance_settings, created = CompanyFinanceSettings.objects.get_or_create(
        company=company,
        defaults={
            "base_currency": default_currency
        }
    )

    if request.method == "GET":
        serializer = CompanyFinanceSettingsSerializer(finance_settings)

        return Response({
            "success": True,
            "settings": serializer.data
        })

    serializer = CompanyFinanceSettingsSerializer(
        finance_settings,
        data=request.data,
        partial=True
    )

    serializer.is_valid(raise_exception=True)
    serializer.save()

    create_audit_log(
        company=company,
        action="COMPANY_FINANCE_SETTINGS_UPDATED",
        action_by=profile,
        message="Company finance settings updated.",
        metadata={
            "base_currency": serializer.data.get("base_currency_code"),
            "auto_currency_conversion": serializer.data.get(
                "auto_currency_conversion"
            ),
            "exchange_rate_provider": serializer.data.get(
                "exchange_rate_provider"
            ),
            "timezone": serializer.data.get("timezone"),
            "date_format": serializer.data.get("date_format"),
        }
    )

    return Response({
        "success": True,
        "message": "Company finance settings updated successfully.",
        "settings": serializer.data
    })


from .models import Currency
from .serializers import CurrencySerializer
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def currency_list(request):

    search = request.GET.get("search")
    is_active = request.GET.get("is_active", "true")
    page = request.GET.get("page", 1)
    page_size = int(request.GET.get("page_size", 20))

    currencies = Currency.objects.all()

    if is_active:
        currencies = currencies.filter(
            is_active=is_active.lower() == "true"
        )

    if search:
        currencies = currencies.filter(
            Q(code__icontains=search)
            |
            Q(name__icontains=search)
            |
            Q(country__icontains=search)
        )

    currencies = currencies.order_by("name")

    paginator = Paginator(currencies, page_size)
    page_obj = paginator.get_page(page)

    serializer = CurrencySerializer(
        page_obj,
        many=True
    )

    return Response({
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "page_size": page_size,
        "filters": {
            "search": search,
            "is_active": is_active,
        },
        "results": serializer.data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def currency_detail(request, code):

    currency = Currency.objects.filter(
        code=code.upper()
    ).first()

    if not currency:
        return Response(
            {"error": "Currency not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CurrencySerializer(currency)

    return Response({
        "success": True,
        "currency": serializer.data,
    })

