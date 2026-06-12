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


import random
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.authtoken.models import Token

from .models import PasswordResetOTP
from .serializers import (
    ForgotPasswordSerializer,
    VerifyResetOTPSerializer,
    ResetPasswordSerializer,
)
from .models import PasswordResetOTP
from .serializers import (
    ForgotPasswordSerializer,
    VerifyResetOTPSerializer,
    ResetPasswordSerializer,
)

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password_api(request):
    serializer = ForgotPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"message": "If this email exists, an OTP has been sent."},
            status=status.HTTP_200_OK
        )

    PasswordResetOTP.objects.filter(
        user=user,
        is_used=False
    ).update(is_used=True)

    otp = str(random.randint(100000, 999999))

    PasswordResetOTP.objects.create(
        user=user,
        otp=otp
    )

    send_mail(
        subject="ZepEx Password Reset OTP",
        message=f"Your password reset OTP is {otp}. It is valid for 5 minutes.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )

    return Response({
        "message": "Password reset OTP sent successfully."
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_reset_otp_api(request):
    serializer = VerifyResetOTPSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    otp = serializer.validated_data["otp"]

    try:
        user = User.objects.get(email=email)
        reset_otp = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            is_used=False
        ).latest("created_at")
    except Exception:
        return Response(
            {"error": "Invalid OTP."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if reset_otp.is_expired():
        return Response(
            {"error": "OTP expired."},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({
        "message": "OTP verified successfully."
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_api(request):
    serializer = ResetPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    otp = serializer.validated_data["otp"]
    new_password = serializer.validated_data["new_password"]

    try:
        user = User.objects.get(email=email)
        reset_otp = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            is_used=False
        ).latest("created_at")
    except Exception:
        return Response(
            {"error": "Invalid OTP."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if reset_otp.is_expired():
        return Response(
            {"error": "OTP expired."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()

    reset_otp.is_used = True
    reset_otp.save(update_fields=["is_used"])

    Token.objects.filter(user=user).delete()

    return Response({
        "message": "Password reset successfully. Please login again."
    })


from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from .serializers import EditProfileSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_detail_api(request):
    profile = request.user.profile

    return Response({
        "id": request.user.id,
        "email": request.user.email,
        "first_name": request.user.first_name,
        "last_name": request.user.last_name,
        "role": profile.role,
        "company": profile.company.name,
        "department": profile.department.name if profile.department else None,
        "phone_number": profile.phone_number,
        "address": profile.address,
        "profile_picture": request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def edit_profile_api(request):
    serializer = EditProfileSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    profile = user.profile

    user.first_name = serializer.validated_data.get("first_name", user.first_name)
    user.last_name = serializer.validated_data.get("last_name", user.last_name)
    user.save(update_fields=["first_name", "last_name"])

    profile.phone_number = serializer.validated_data.get("phone_number", profile.phone_number)
    profile.address = serializer.validated_data.get("address", profile.address)

    if "profile_picture" in serializer.validated_data:
        profile.profile_picture = serializer.validated_data["profile_picture"]

    profile.save(update_fields=["phone_number", "address", "profile_picture"])

    return Response({
        "message": "Profile updated successfully."
    })