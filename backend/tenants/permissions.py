from rest_framework.permissions import BasePermission


class IsCompanyAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "COMPANY_ADMIN"
        )


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "MANAGER"
        )


class IsAccounts(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "ACCOUNTS"
        )


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "EMPLOYEE"
        )


class CanViewCompanyAuditLogs(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)
        if not profile:
            return False

        if profile.role == "COMPANY_ADMIN":
            return True

        return bool(
            profile.company_role
            and profile.company_role.can_approve_expense
        )