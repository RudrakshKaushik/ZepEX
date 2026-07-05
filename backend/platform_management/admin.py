from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import (
    PlatformOwner,
    CompanyRegistrationRequest
)


@admin.register(PlatformOwner)
class PlatformOwnerAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "created_at"
    )

    search_fields = (
        "user__username",
        "user__email"
    )


@admin.register(CompanyRegistrationRequest)
class CompanyRegistrationRequestAdmin(admin.ModelAdmin):

    list_display = (
        "company_name",
        "company_domain",
        "admin_email",
        "status",
        "created_at"
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "company_name",
        "admin_email",
        "company_domain"
    )

from .models import PlatformSettings

admin.site.register(PlatformSettings)    