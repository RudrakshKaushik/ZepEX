from django.urls import path
from .views import login_api,change_password_api

urlpatterns = [
    path("login/", login_api, name="login-api"),
    path("change-password/", change_password_api, name="change-password-api"),
]