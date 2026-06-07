from rest_framework import serializers

from .models import CompanyRegistrationRequest


class CompanyRegistrationRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = CompanyRegistrationRequest
        fields = [
            "id",
            "company_name",
            "company_domain",
            "admin_name",
            "admin_email",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
        ]