from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    action_by_email = serializers.EmailField(
        source="action_by.user.email",
        read_only=True
    )

    action_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "company",
            "action",
            "message",
            "action_by",
            "action_by_email",
            "action_by_name",
            "metadata",
            "created_at",
        ]

    def get_action_by_name(self, obj):
        if not obj.action_by:
            return None

        full_name = (
            f"{obj.action_by.user.first_name} "
            f"{obj.action_by.user.last_name}"
        ).strip()

        return full_name or obj.action_by.user.email