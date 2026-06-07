from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    action_by_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "company",
            "action",
            "message",
            "metadata",
            "action_by_email",
            "created_at",
        ]

    def get_action_by_email(self, obj):
        if obj.action_by:
            return obj.action_by.user.email
        return None