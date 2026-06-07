from .models import AuditLog


def create_audit_log(company, action, action_by=None, message=None, metadata=None):
    return AuditLog.objects.create(
        company=company,
        action_by=action_by,
        action=action,
        message=message,
        metadata=metadata or {}
    )