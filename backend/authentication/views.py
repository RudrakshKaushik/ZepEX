from django.shortcuts import render

#m rest_framework import status
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import LoginSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.validated_data["user"]

    token, created = Token.objects.get_or_create(
        user=user
    )

    if hasattr(user, "platform_owner"):
        role = "PLATFORM_OWNER"
        company = None
        department = None

    else:
        try:
            profile = user.profile
        except Exception:
            return Response(
                {"error": "User profile not found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        role = profile.role
        company = {
            "id": str(profile.company.id),
            "name": profile.company.name
        }
        department = {
            "id": str(profile.department.id),
            "name": profile.department.name
        } if profile.department else None

    redirect_map = {
        "PLATFORM_OWNER": "/platform-dashboard",
        "COMPANY_ADMIN": "/company-admin-dashboard",
        "EMPLOYEE": "/employee-dashboard",
        "MANAGER": "/manager-dashboard",
        "ACCOUNTS": "/accounts-dashboard",
    }

    return Response({
        "message": "Login successful.",
        "token": token.key,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role,
            "company": company,
            "department": department,
        },
        "redirect_to": redirect_map.get(role)
    })

from rest_framework.permissions import IsAuthenticated
from .serializers import ChangePasswordSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_api(request):
    serializer = ChangePasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user

    old_password = serializer.validated_data["old_password"]
    new_password = serializer.validated_data["new_password"]

    if not user.check_password(old_password):
        return Response(
            {"error": "Old password is incorrect."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()

    Token.objects.filter(user=user).delete()

    return Response({
        "message": "Password changed successfully. Please login again."
    })