from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Department,
    UserProfile,
    ExternalDatabaseConfig,
    CompanyPolicy,
    PolicyCategoryRule,
    ReimbursementEmailConfig,
    CompanySMTPConfig,
)

from .models import Company
class DepartmentSerializer(serializers.ModelSerializer):

    def validate_name(self, value):
        name = value.strip()

        request = self.context.get("request")

        if request:
            company = request.user.profile.company

            queryset = Department.objects.filter(
                company=company,
                name__iexact=name
            )

            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)

            if queryset.exists():
                raise serializers.ValidationError(
                    "Department with this name already exists."
                )

        return name

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "manager",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "manager",
            "created_at",
            "updated_at",
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True
    )

    is_active = serializers.BooleanField(
        source="user.is_active",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "company",
            "department",
            "department_name",
            "role",
            "phone_number",
            "address",
            "profile_picture",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "created_at",
        ]


class ExternalDatabaseConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalDatabaseConfig
        fields = [
            "id",
            "db_engine",
            "db_host",
            "db_port",
            "db_name",
            "db_user",
            "db_password",
            "last_synced_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "last_synced_at",
            "created_at",
        ]
        extra_kwargs = {
            "db_password": {
                "write_only": True
            }
        }


class PolicyCategoryRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyCategoryRule
        fields = [
            "id",
            "policy",
            "category_name",
            "max_amount",
            "category_description",
            "is_active",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "policy",
            "updated_at",
        ]


class CompanyPolicySerializer(serializers.ModelSerializer):
    category_rules = PolicyCategoryRuleSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = CompanyPolicy
        fields = [
            "id",
            "company",
            "updated_at",
            "category_rules",
        ]
        read_only_fields = [
            "id",
            "company",
            "updated_at",
        ]


class EmployeeCreateSerializer(serializers.Serializer):
    ROLE_CHOICES = (
        ("MANAGER", "Manager"),
        ("ACCOUNTS", "Accounts"),
        ("EMPLOYEE", "Employee"),
    )

    first_name = serializers.CharField(
        max_length=150
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True
    )

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True
    )

    role = serializers.ChoiceField(
        choices=ROLE_CHOICES
    )

    department_id = serializers.UUIDField(
        required=False,
        allow_null=True
    )

    def validate_email(self, value):
        email = value.lower().strip()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "User with this email already exists."
            )

        return email

    def validate(self, attrs):
        role = attrs.get("role")
        department_id = attrs.get("department_id")

        if role in ["EMPLOYEE", "MANAGER"] and not department_id:
            raise serializers.ValidationError({
                "department_id": "Department is required for Employee and Manager."
            })

        if department_id:
            try:
                Department.objects.get(
                    id=department_id
                )
            except Department.DoesNotExist:
                raise serializers.ValidationError({
                    "department_id": "Department not found."
                })

        return attrs


class ReimbursementEmailConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReimbursementEmailConfig
        fields = "__all__"
        read_only_fields = [
            "id",
            "company",
            "last_checked_at",
            "created_at",
        ]
        extra_kwargs = {
            "imap_password": {
                "write_only": True
            }
        }


class CompanySMTPConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySMTPConfig
        fields = "__all__"
        read_only_fields = [
            "id",
            "company",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "smtp_password": {
                "write_only": True
            }
        }


class CompanyUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(
        required=False
    )

    last_name = serializers.CharField(
        required=False
    )

    role = serializers.ChoiceField(
        choices=["EMPLOYEE", "MANAGER", "ACCOUNTS"],
        required=False
    )

    department_id = serializers.UUIDField(
        required=False,
        allow_null=True
    )

    phone_number = serializers.CharField(
        required=False,
        allow_blank=True
    )

    address = serializers.CharField(
        required=False,
        allow_blank=True
    )

class DepartmentUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)

    manager_id = serializers.UUIDField(required=False, allow_null=True)    


class CompanySerializer(serializers.ModelSerializer):

    class Meta:
        model = Company

        fields = [
            "id",
            "name",
            "domain",
            "reimbursement_email_prefix",
            "is_verified",
            "created_at",
        ]    