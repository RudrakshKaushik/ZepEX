from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Department,
    UserProfile
)

from .serializers import (
    DepartmentSerializer,
    EmployeeCreateSerializer,
    UserProfileSerializer
)

from .models import (
    CompanyPolicy,
    PolicyCategoryRule
)

from .serializers import (
    CompanyPolicySerializer,
    PolicyCategoryRuleSerializer
)
from .permissions import IsCompanyAdmin
from .models import ExternalDatabaseConfig
from .serializers import ExternalDatabaseConfigSerializer

from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)

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

    serializer = DepartmentSerializer(
        departments,
        many=True
    )

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([
    IsAuthenticated,
    IsCompanyAdmin
])
def create_employee(request):

    serializer = EmployeeCreateSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data

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

        try:
            department = Department.objects.get(
                id=data["department_id"],
                company=request.user.profile.company
            )

        except Department.DoesNotExist:
            return Response(
                {
                    "error": "Department not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

    profile = UserProfile.objects.create(
        user=user,
        company=request.user.profile.company,
        department=department,
        role=data["role"]
    )

    return Response(
        {
            "message": "Employee created successfully.",
            "employee": UserProfileSerializer(profile).data
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

    serializer = UserProfileSerializer(
        employees,
        many=True
    )

    return Response(serializer.data)


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

    config, created = ExternalDatabaseConfig.objects.get_or_create(
        company=company
    )

    serializer = ExternalDatabaseConfigSerializer(
        config,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():

        serializer.save()

        return Response(
            serializer.data,
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

    serializer = PolicyCategoryRuleSerializer(
        rules,
        many=True
    )

    return Response(serializer.data)

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
        profile = UserProfile.objects.select_related("user").get(
            id=user_id,
            company=company
        )

    except UserProfile.DoesNotExist:

        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CompanyUserUpdateSerializer(
        data=request.data
    )

    if not serializer.is_valid():

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    data = serializer.validated_data

    if profile.user == request.user and "role" in data:

        return Response(
            {"error": "You cannot change your own role."},
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
            "department": profile.department.name if profile.department else None,
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