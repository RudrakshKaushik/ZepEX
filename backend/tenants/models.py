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

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.email} - {self.role}"


class ExternalDatabaseConfig(models.Model):

    DB_ENGINE_CHOICES = (
        ('postgresql', 'PostgreSQL'),
        ('mysql', 'MySQL'),
        ('mssql', 'Microsoft SQL Server'),
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