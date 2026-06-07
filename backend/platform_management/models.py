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

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name    