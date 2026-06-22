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

    workflow_timeline = serializers.SerializerMethodField()

    latest_rejection_reason = serializers.SerializerMethodField()

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
            "workflow_timeline",
            "latest_rejection_reason",
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

    def get_latest_rejection_reason(self, obj):
        rejection = obj.approval_history.filter(
            action=ApprovalHistory.ACTION_STEP_REJECTED
        ).order_by("-created_at").first()

        if not rejection:
            return None

        return {
            "rejected_by": rejection.action_by.user.email,
            "role": (
                rejection.action_by.company_role.name
                if rejection.action_by.company_role
                else rejection.action_by.role
            ),
            "reason": rejection.comments,
            "rejected_at": rejection.created_at,
        }

    def get_workflow_timeline(self, obj):
        timeline = []

        timeline.append({
            "step_order": 0,
            "step_name": "Employee Submission",
            "status": (
                "COMPLETED"
                if obj.submitted_at
                else "DRAFT"
            ),
            "action_by": obj.employee.user.email,
            "action_role": "EMPLOYEE",
            "comments": None,
            "action_at": obj.submitted_at,
        })

        workflow = None

        if obj.current_workflow_step:
            workflow = obj.current_workflow_step.workflow
        else:
            first_step = ApprovalWorkflowStep.objects.filter(
                workflow__company=obj.company,
                is_active=True
            ).select_related(
                "workflow"
            ).order_by(
                "step_order"
            ).first()

            if first_step:
                workflow = first_step.workflow

        if not workflow:
            return timeline

        history_map = {}

        for history in obj.approval_history.all():
            if not history.action_by:
                continue

            role_name = (
                history.action_by.company_role.name
                if history.action_by.company_role
                else history.action_by.role
            )

            history_map[role_name] = history

        workflow_steps = workflow.steps.filter(
            is_active=True
        ).select_related(
            "approver_role",
            "department"
        ).order_by(
            "step_order"
        )

        workflow_stopped = obj.status == ExpenseReport.STATUS_REJECTED

        for step in workflow_steps:
            role_name = step.approver_role.name
            history = history_map.get(role_name)

            if history:
                if history.action == ApprovalHistory.ACTION_STEP_APPROVED:
                    status_value = "APPROVED"
                elif history.action == ApprovalHistory.ACTION_STEP_REJECTED:
                    status_value = "REJECTED"
                else:
                    status_value = history.action

                timeline.append({
                    "step_order": step.step_order,
                    "step_name": role_name,
                    "status": status_value,
                    "action_by": history.action_by.user.email,
                    "action_role": role_name,
                    "comments": history.comments,
                    "action_at": history.created_at,
                })

            else:
                if workflow_stopped:
                    status_value = "CANCELLED"
                elif (
                    obj.current_workflow_step and
                    obj.current_workflow_step.id == step.id
                ):
                    status_value = "PENDING"
                else:
                    status_value = "WAITING"

                timeline.append({
                    "step_order": step.step_order,
                    "step_name": role_name,
                    "status": status_value,
                    "action_by": None,
                    "action_role": role_name,
                    "comments": None,
                    "action_at": None,
                })

        if obj.status == ExpenseReport.STATUS_PAID:
            paid_history = obj.approval_history.filter(
                action=ApprovalHistory.ACTION_PAID
            ).first()

            timeline.append({
                "step_order": 999,
                "step_name": "Payment",
                "status": "PAID",
                "action_by": (
                    paid_history.action_by.user.email
                    if paid_history and paid_history.action_by
                    else None
                ),
                "action_role": "ACCOUNTS",
                "comments": (
                    paid_history.comments
                    if paid_history
                    else obj.paid_notes
                ),
                "action_at": obj.paid_at,
            })

        elif obj.status == ExpenseReport.STATUS_APPROVED:
            timeline.append({
                "step_order": 999,
                "step_name": "Payment",
                "status": "PENDING_PAYMENT",
                "action_by": None,
                "action_role": "ACCOUNTS",
                "comments": None,
                "action_at": None,
            })

        return timeline

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