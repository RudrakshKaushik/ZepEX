import uuid

from django.db import models
from django.contrib.auth.models import User

from platform_management.models import PlatformOwner


class Company(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    owner = models.ForeignKey(
        PlatformOwner,
        on_delete=models.PROTECT,
        related_name="companies"
    )

    name = models.CharField(max_length=255)

    domain = models.CharField(
        max_length=255,
        unique=True
    )

    reimbursement_email_prefix = models.SlugField(
        max_length=100,
        unique=True
    )

    is_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    created_at = models.DateTimeField(
        auto_now_add=True
    )
  

    def __str__(self):
        return self.name


class Department(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="departments"
    )

    name = models.CharField(max_length=100)

    manager = models.ForeignKey(
        'UserProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_departments'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )
    is_active = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company.name} - {self.name}"

class CompanyRole(models.Model):
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="roles"
    )

    name = models.CharField(max_length=100)

    can_upload_receipt = models.BooleanField(default=False)
    can_submit_expense = models.BooleanField(default=False)
    can_approve_expense = models.BooleanField(default=False)
    can_mark_paid = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("company", "name")

    def __str__(self):
        return f"{self.company.name} - {self.name}"
    
class UserProfile(models.Model):

    ROLE_CHOICES = (
        ("COMPANY_ADMIN", "Company Admin"),
        ("MANAGER", "Manager"),
        ("ACCOUNTS", "Accounts"),
        ("EMPLOYEE", "Employee"),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="users"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees"
    )

    # Existing system role (keep it)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    # NEW dynamic company role
    company_role = models.ForeignKey(
        "CompanyRole",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )

    address = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        role_name = (
            self.company_role.name
            if self.company_role
            else self.role
        )

        return f"{self.user.email} - {role_name}"


class ExternalDatabaseConfig(models.Model):

    DB_ENGINE_CHOICES = (
    ("postgresql", "PostgreSQL"),
    ("mysql", "MySQL"),
    ("mssql", "Microsoft SQL Server"),
    ("oracle", "Oracle"),
)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name='db_config'
    )

    db_engine = models.CharField(
        max_length=20,
        choices=DB_ENGINE_CHOICES
    )

    db_host = models.CharField(max_length=255)
    db_port = models.IntegerField()

    db_name = models.CharField(max_length=255)

    db_user = models.CharField(max_length=255)

    db_password = models.CharField(
        max_length=255
    )

    last_synced_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Database Config - {self.company.name}"


class CompanyPolicy(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name='policy'
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )
        
    auto_approve_if_no_violation = models.BooleanField(
    default=True
    )    
    def __str__(self):
        return f"Policy - {self.company.name}"


class PolicyCategoryRule(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    policy = models.ForeignKey(
        CompanyPolicy,
        on_delete=models.CASCADE,
        related_name='category_rules'
    )

    category_name = models.CharField(
        max_length=100
    )

    max_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    category_description = models.TextField(
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            'policy',
            'category_name'
        )

    def __str__(self):
        return f"{self.category_name} - {self.max_amount}"

class ReimbursementEmailConfig(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name="email_config"
    )

    email_address = models.EmailField(
        help_text="Company reimbursement email, e.g. expenses@bitloom.com"
    )

    imap_host = models.CharField(
        max_length=255,
        help_text="Example: imap.gmail.com"
    )

    imap_port = models.IntegerField(
        default=993
    )

    imap_username = models.CharField(
        max_length=255
    )

    imap_password = models.CharField(
        max_length=255,
        help_text="Use app password, not normal email password"
    )

    is_active = models.BooleanField(
        default=True
    )

    last_checked_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.company.name} - {self.email_address}"       



class CompanySMTPConfig(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name="smtp_config"
    )

    smtp_host = models.CharField(max_length=255)

    smtp_port = models.IntegerField(default=587)

    smtp_email = models.EmailField()

    smtp_password = models.CharField(max_length=255)

    use_tls = models.BooleanField(default=True)

    from_email_name = models.CharField(
        max_length=100,
        default="Zepex"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company.name} SMTP"     
    


class DatabaseSyncLog(models.Model):
    STATUS_SUCCESS = "SUCCESS"
    STATUS_FAILED = "FAILED"

    STATUS_CHOICES = (
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="database_sync_logs"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES
    )

    records_created = models.IntegerField(default=0)
    records_updated = models.IntegerField(default=0)

    error_message = models.TextField(
        blank=True,
        null=True
    )

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.company.name} - {self.status}"    
    

class Currency(models.Model):
    code = models.CharField(
        max_length=3,
        unique=True
    )

    name = models.CharField(
        max_length=100
    )

    symbol = models.CharField(
        max_length=10
    )

    country = models.CharField(
        max_length=100
    )

    flag = models.CharField(
        max_length=10,
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"   


class CompanyFinanceSettings(models.Model):

    EXCHANGE_RATE_PROVIDER_CHOICES = [
        ("ExchangeRate API", "ExchangeRate API"),
        ("Open Exchange Rates", "Open Exchange Rates"),
        ("Fixer", "Fixer"),
    ]

    DATE_FORMAT_CHOICES = [
        ("DD/MM/YYYY", "DD/MM/YYYY"),
        ("MM/DD/YYYY", "MM/DD/YYYY"),
        ("YYYY-MM-DD", "YYYY-MM-DD"),
    ]

    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name="finance_settings"
    )

    base_currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name="company_finance_settings"
    )

    auto_currency_conversion = models.BooleanField(
        default=True
    )

    exchange_rate_provider = models.CharField(
        max_length=100,
        choices=EXCHANGE_RATE_PROVIDER_CHOICES,
        default="ExchangeRate API"
    )

    allow_manual_exchange_rate = models.BooleanField(
        default=False
    )

    decimal_places = models.PositiveSmallIntegerField(
        default=2
    )

    rounding_enabled = models.BooleanField(
        default=True
    )

    timezone = models.CharField(
        max_length=100,
        default="UTC"
    )

    date_format = models.CharField(
        max_length=20,
        choices=DATE_FORMAT_CHOICES,
        default="DD/MM/YYYY"
    )

    last_exchange_sync = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.company.name} Finance Settings"