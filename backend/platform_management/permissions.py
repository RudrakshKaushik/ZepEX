from rest_framework.permissions import BasePermission


class IsPlatformOwner(BasePermission):

    def has_permission(self, request, view):
        return hasattr(request.user, "platform_owner")