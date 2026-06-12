import uuid

from django.db import models

from tenants.models import Company, Department, UserProfile


class ExpenseReport(models.Model):

    STATUS_DRAFT = "DRAFT"

    STATUS_SUBMITTED = "SUBMITTED"

    STATUS_MANAGER_APPROVED = "MANAGER_APPROVED"

    STATUS_MANAGER_REJECTED = "MANAGER_REJECTED"

    STATUS_PENDING_COMPANY_ADMIN = "PENDING_COMPANY_ADMIN"

    STATUS_COMPANY_ADMIN_APPROVED = "COMPANY_ADMIN_APPROVED"

    STATUS_COMPANY_ADMIN_REJECTED = "COMPANY_ADMIN_REJECTED"

    STATUS_PENDING_ACCOUNTS = "PENDING_ACCOUNTS"

    STATUS_ACCOUNTS_APPROVED = "ACCOUNTS_APPROVED"

    STATUS_REJECTED = "REJECTED"

    STATUS_PAID = "PAID"

    STATUS_CHOICES = (
        (STATUS_DRAFT, "Draft"),

        (STATUS_SUBMITTED, "Submitted"),

        (STATUS_MANAGER_APPROVED, "Manager Approved"),

        (STATUS_MANAGER_REJECTED, "Manager Rejected"),

        (
            STATUS_PENDING_COMPANY_ADMIN,
            "Pending Company Admin"
        ),

        (
            STATUS_COMPANY_ADMIN_APPROVED,
            "Company Admin Approved"
        ),

        (
            STATUS_COMPANY_ADMIN_REJECTED,
            "Company Admin Rejected"
        ),

        (
            STATUS_PENDING_ACCOUNTS,
            "Pending Accounts"
        ),

        (
            STATUS_ACCOUNTS_APPROVED,
            "Accounts Approved"
        ),

        (STATUS_REJECTED, "Rejected"),

        (STATUS_PAID, "Paid"),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="expense_reports"
    )

    employee = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="expense_reports"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="expense_reports"
    )

    month = models.DateField()

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    submitted_at = models.DateTimeField(
        null=True,
        blank=True
    )

    manager_action_at = models.DateTimeField(
        null=True,
        blank=True
    )
    company_admin_notes = models.TextField(
    null=True,
    blank=True
    )

    company_admin_action_at = models.DateTimeField(
    null=True,
    blank=True
)

    accounts_action_at = models.DateTimeField(
        null=True,
        blank=True
    )

    paid_at = models.DateTimeField(
        null=True,
        blank=True
    )

    manager_notes = models.TextField(
        blank=True,
        null=True
    )

    accounts_notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        unique_together = (
            "company",
            "employee",
            "month",
        )
        ordering = [
            "-month",
            "-created_at",
        ]

    def __str__(self):
        return f"{self.employee.user.email} - {self.month}"


class ExpenseSubmission(models.Model):
    SOURCE_EMAIL = "EMAIL"
    SOURCE_WEB = "WEB_UPLOAD"

    SOURCE_CHOICES = (
        (SOURCE_EMAIL, "Email"),
        (SOURCE_WEB, "Web Upload"),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    report = models.ForeignKey(
        ExpenseReport,
        on_delete=models.CASCADE,
        related_name="submissions",
        null=True,
        blank=True
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="expense_submissions"
    )

    employee = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="expense_submissions"
    )

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES
    )

    email_subject = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.employee.user.email} - {self.source}"


class ExpenseReceipt(models.Model):

    STATUS_DRAFT = "DRAFT"

    STATUS_AI_PROCESSING = "AI_PROCESSING"

    STATUS_AI_PROCESSED = "AI_PROCESSED"

    STATUS_VALID = "VALID"

    STATUS_POLICY_VIOLATION = "POLICY_VIOLATION"

    STATUS_SUBMITTED_TO_MANAGER = "SUBMITTED_TO_MANAGER"

    STATUS_MANAGER_APPROVED = "MANAGER_APPROVED"

    STATUS_MANAGER_REJECTED = "MANAGER_REJECTED"

    STATUS_PENDING_COMPANY_ADMIN = "PENDING_COMPANY_ADMIN"

    STATUS_COMPANY_ADMIN_APPROVED = "COMPANY_ADMIN_APPROVED"

    STATUS_COMPANY_ADMIN_REJECTED = "COMPANY_ADMIN_REJECTED"

    STATUS_PENDING_ACCOUNTS = "PENDING_ACCOUNTS"

    STATUS_ACCOUNTS_APPROVED = "ACCOUNTS_APPROVED"

    STATUS_REJECTED = "REJECTED"

    STATUS_PAID = "PAID"

    STATUS_CHOICES = (

        (STATUS_DRAFT, "Draft"),

        (STATUS_AI_PROCESSING, "AI Processing"),

        (STATUS_AI_PROCESSED, "AI Processed"),

        (STATUS_VALID, "Valid"),

        (
            STATUS_POLICY_VIOLATION,
            "Policy Violation"
        ),

        (
            STATUS_SUBMITTED_TO_MANAGER,
            "Submitted To Manager"
        ),

        (
            STATUS_MANAGER_APPROVED,
            "Manager Approved"
        ),

        (
            STATUS_MANAGER_REJECTED,
            "Manager Rejected"
        ),

        (
            STATUS_PENDING_COMPANY_ADMIN,
            "Pending Company Admin"
        ),

        (
            STATUS_COMPANY_ADMIN_APPROVED,
            "Company Admin Approved"
        ),

        (
            STATUS_COMPANY_ADMIN_REJECTED,
            "Company Admin Rejected"
        ),

        (
            STATUS_PENDING_ACCOUNTS,
            "Pending Accounts"
        ),

        (
            STATUS_ACCOUNTS_APPROVED,
            "Accounts Approved"
        ),

        (
            STATUS_REJECTED,
            "Rejected"
        ),

        (
            STATUS_PAID,
            "Paid"
        ),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    report = models.ForeignKey(
    ExpenseReport,
    on_delete=models.CASCADE,
    related_name="receipts",
    null=True,
    blank=True
)

    submission = models.ForeignKey(
        ExpenseSubmission,
        on_delete=models.CASCADE,
        related_name="receipts"
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="expense_receipts"
    )

    employee = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="expense_receipts"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="expense_receipts"
    )

    receipt_file = models.FileField(
        upload_to="receipts/%Y/%m/%d/"
    )

    vendor_name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    invoice_date = models.DateField(
        blank=True,
        null=True
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    currency = models.CharField(
        max_length=10,
        default="INR"
    )

    status = models.CharField(
        max_length=40,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT
    )

    policy_violation_reason = models.TextField(
        blank=True,
        null=True
    )

    has_duplicate_violation = models.BooleanField(
        default=False
    )

    has_old_bill_violation = models.BooleanField(
        default=False
    )

    has_amount_violation = models.BooleanField(
        default=False
    )

    has_any_violation = models.BooleanField(
        default=False
    )

    manager_notes = models.TextField(
        blank=True,
        null=True
    )

    accounts_notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

    def __str__(self):
        return f"{self.employee.user.email} - {self.vendor_name or 'Receipt'} - {self.total_amount}"


class ExpenseLineItem(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    receipt = models.ForeignKey(
        ExpenseReceipt,
        on_delete=models.CASCADE,
        related_name="line_items"
    )

    description = models.CharField(
        max_length=500
    )

    category = models.CharField(
        max_length=100
    )

    vendor = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    bill_date = models.DateField(
        blank=True,
        null=True
    )

    is_violating = models.BooleanField(
        default=False
    )

    violation_reason = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.category} - {self.amount}"


class ApprovalHistory(models.Model):
    ACTION_REPORT_SUBMITTED = "REPORT_SUBMITTED"
    ACTION_MANAGER_APPROVED = "MANAGER_APPROVED"
    ACTION_MANAGER_REJECTED = "MANAGER_REJECTED"
    ACTION_ACCOUNTS_APPROVED = "ACCOUNTS_APPROVED"
    ACTION_ACCOUNTS_REJECTED = "ACCOUNTS_REJECTED"
    ACTION_PAID = "PAID"

    ACTION_CHOICES = (
        (ACTION_REPORT_SUBMITTED, "Report Submitted"),
        (ACTION_MANAGER_APPROVED, "Manager Approved"),
        (ACTION_MANAGER_REJECTED, "Manager Rejected"),
        (ACTION_ACCOUNTS_APPROVED, "Accounts Approved"),
        (ACTION_ACCOUNTS_REJECTED, "Accounts Rejected"),
        (ACTION_PAID, "Paid"),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    report = models.ForeignKey(
        ExpenseReport,
        on_delete=models.CASCADE,
        related_name="approval_history",
        null=True,
        blank=True
    )

    receipt = models.ForeignKey(
        ExpenseReceipt,
        on_delete=models.CASCADE,
        related_name="approval_history",
        null=True,
        blank=True
    )

    action_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_actions"
    )

    action = models.CharField(
        max_length=40,
        choices=ACTION_CHOICES
    )

    comments = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        target = self.report_id or self.receipt_id
        return f"{target} - {self.action}"