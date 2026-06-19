from rest_framework import serializers

from .models import (
    ExpenseReport,
    ExpenseSubmission,
    ExpenseReceipt,
    ExpenseLineItem,
    ApprovalHistory,
    ApprovalWorkflow,
    ApprovalWorkflowStep
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
            "created_at",
            "updated_at",
        ]


class ApprovalHistorySerializer(serializers.ModelSerializer):
    action_by_email = serializers.EmailField(
        source="action_by.user.email",
        read_only=True
    )

    action_by_role = serializers.CharField(
        source="action_by.company_role.name",
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
            "action_by_role",
            "action",
            "comments",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class ApprovalWorkflowStepSerializer(serializers.ModelSerializer):
    approver_role_name = serializers.CharField(
        source="approver_role.name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    class Meta:
        model = ApprovalWorkflowStep
        fields = [
            "id",
            "step_order",
            "approver_role",
            "approver_role_name",
            "department",
            "department_name",
            "routing_type",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class ExpenseReportSerializer(serializers.ModelSerializer):
    receipts = ExpenseReceiptSerializer(
        many=True,
        read_only=True
    )

    approval_history = ApprovalHistorySerializer(
        many=True,
        read_only=True
    )

    employee_email = serializers.EmailField(
        source="employee.user.email",
        read_only=True
    )

    employee_name = serializers.SerializerMethodField()

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    current_step = serializers.SerializerMethodField()

    class Meta:
        model = ExpenseReport
        fields = [
            "id",
            "company",
            "employee",
            "employee_name",
            "employee_email",
            "department",
            "department_name",
            "month",
            "status",
            "total_amount",
            "submitted_at",
            "paid_at",
            "paid_notes",
            "current_workflow_step",
            "current_step",
            "workflow_completed",
            "receipts",
            "approval_history",
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
            "paid_at",
            "paid_notes",
            "current_workflow_step",
            "workflow_completed",
            "created_at",
            "updated_at",
        ]

    def get_employee_name(self, obj):
        full_name = (
            f"{obj.employee.user.first_name} "
            f"{obj.employee.user.last_name}"
        ).strip()

        return full_name or obj.employee.user.email

    def get_current_step(self, obj):
        step = obj.current_workflow_step

        if not step:
            return None

        return {
            "id": str(step.id),
            "step_order": step.step_order,
            "approver_role": step.approver_role.name,
            "routing_type": step.routing_type,
            "department": (
                step.department.name
                if step.department else None
            ),
        }


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


class ReceiptUploadSerializer(serializers.Serializer):
    receipt_file = serializers.FileField()


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    steps = ApprovalWorkflowStepSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = ApprovalWorkflow
        fields = [
            "id",
            "company",
            "name",
            "is_active",
            "steps",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "company",
            "created_at",
            "updated_at",
        ]

from .models import DuplicateReceiptLog


class DuplicateReceiptLogSerializer(serializers.ModelSerializer):

    original_vendor = serializers.CharField(
        source="original_receipt.vendor_name",
        read_only=True
    )

    duplicate_vendor = serializers.CharField(
        source="duplicate_receipt.vendor_name",
        read_only=True
    )

    class Meta:
        model = DuplicateReceiptLog
        fields = [
            "id",
            "original_receipt",
            "duplicate_receipt",
            "original_vendor",
            "duplicate_vendor",
            "created_at",
        ]        


from .models import DuplicateReceiptLog

class DuplicateReceiptLogSerializer(serializers.ModelSerializer):
    original_employee_email = serializers.EmailField(
        source="original_receipt.employee.user.email",
        read_only=True
    )
    duplicate_employee_email = serializers.EmailField(
        source="duplicate_receipt.employee.user.email",
        read_only=True
    )
    original_vendor = serializers.CharField(
        source="original_receipt.vendor_name",
        read_only=True
    )
    duplicate_vendor = serializers.CharField(
        source="duplicate_receipt.vendor_name",
        read_only=True
    )

    class Meta:
        model = DuplicateReceiptLog
        fields = [
            "id",
            "original_receipt",
            "duplicate_receipt",
            "duplicate_type",
            "original_employee_email",
            "duplicate_employee_email",
            "original_vendor",
            "duplicate_vendor",
            "created_at",
        ]