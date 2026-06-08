from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Department,
    UserProfile,
    ExternalDatabaseConfig,
    CompanyPolicy,
    PolicyCategoryRule,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "manager",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "manager",
            "created_at",
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
        ]
        read_only_fields = [
            "id",
            "policy",
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
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "User with this email already exists."
            )

        return value

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
    
from .models import ReimbursementEmailConfig
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

from .models import CompanySMTPConfig
class CompanySMTPConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySMTPConfig
        fields = "__all__"
        read_only_fields = ["id", "company", "created_at", "updated_at"]
        extra_kwargs = {
            "smtp_password": {"write_only": True}
        }
