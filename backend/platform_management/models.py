from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User


class PlatformOwner(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="platform_owner"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.email
    
class CompanyRegistrationRequest(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    company_name = models.CharField(max_length=255)

    company_domain = models.CharField(
        max_length=255,
        unique=True
    )

    admin_name = models.CharField(max_length=255)

    admin_email = models.EmailField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    expected_employee_count = models.PositiveIntegerField()

    otp = models.CharField(
    max_length=6,
    blank=True,
    null=True
)

    otp_expires_at = models.DateTimeField(
    blank=True,
    null=True
)

    is_email_verified = models.BooleanField(
    default=False
)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name    