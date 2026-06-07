from rest_framework import serializers

from .models import (
    ExpenseReport,
    ExpenseSubmission,
    ExpenseReceipt,
    ExpenseLineItem,
    ApprovalHistory,
)


class ExpenseLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseLineItem
        fields = [
            "id",
            "description",
            "category",
            "vendor",
            "amount",
            "bill_date",
            "is_violating",
            "violation_reason",
            "created_at",
        ]


class ExpenseReceiptSerializer(serializers.ModelSerializer):
    line_items = ExpenseLineItemSerializer(
        many=True,
        read_only=True
    )

    employee_email = serializers.EmailField(
        source="employee.user.email",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    class Meta:
        model = ExpenseReceipt
        fields = [
            "id",
            "report",
            "submission",
            "company",
            "employee",
            "employee_email",
            "department",
            "department_name",
            "receipt_file",
            "vendor_name",
            "invoice_date",
            "total_amount",
            "currency",
            "status",
            "policy_violation_reason",
            "has_duplicate_violation",
            "has_old_bill_violation",
            "has_amount_violation",
            "has_any_violation",
            "manager_notes",
            "accounts_notes",
            "line_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "report",
            "submission",
            "company",
            "employee",
            "department",
            "vendor_name",
            "invoice_date",
            "total_amount",
            "currency",
            "status",
            "policy_violation_reason",
            "has_duplicate_violation",
            "has_old_bill_violation",
            "has_amount_violation",
            "has_any_violation",
            "manager_notes",
            "accounts_notes",
            "created_at",
            "updated_at",
        ]


class ExpenseReportSerializer(serializers.ModelSerializer):
    receipts = ExpenseReceiptSerializer(
        many=True,
        read_only=True
    )

    employee_email = serializers.EmailField(
        source="employee.user.email",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    class Meta:
        model = ExpenseReport
        fields = [
            "id",
            "company",
            "employee",
            "employee_email",
            "department",
            "department_name",
            "month",
            "status",
            "total_amount",
            "submitted_at",
            "manager_action_at",
            "accounts_action_at",
            "paid_at",
            "manager_notes",
            "accounts_notes",
            "receipts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "employee",
            "department",
            "status",
            "total_amount",
            "submitted_at",
            "manager_action_at",
            "accounts_action_at",
            "paid_at",
            "manager_notes",
            "accounts_notes",
            "created_at",
            "updated_at",
        ]


class ExpenseSubmissionSerializer(serializers.ModelSerializer):
    receipts = ExpenseReceiptSerializer(
        many=True,
        read_only=True
    )

    employee_email = serializers.EmailField(
        source="employee.user.email",
        read_only=True
    )

    class Meta:
        model = ExpenseSubmission
        fields = [
            "id",
            "report",
            "company",
            "employee",
            "employee_email",
            "source",
            "email_subject",
            "receipts",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "report",
            "company",
            "employee",
            "created_at",
        ]


class ApprovalHistorySerializer(serializers.ModelSerializer):
    action_by_email = serializers.EmailField(
        source="action_by.user.email",
        read_only=True
    )

    class Meta:
        model = ApprovalHistory
        fields = [
            "id",
            "report",
            "receipt",
            "action_by",
            "action_by_email",
            "action",
            "comments",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]


class ReceiptUploadSerializer(serializers.Serializer):
    receipt_file = serializers.FileField()