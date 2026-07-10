from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    UserRegisterView,
    UserProfileView,
    SendOTPView,
    VerifyOTPView,
    AdminDistributorListView,
    AdminDistributorActionView
)

urlpatterns = [
    # Auth core
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegisterView.as_view(), name='auth_register'),
    path('profile/', UserProfileView.as_view(), name='auth_profile'),
    
    # OTP / Recover password flows
    path('otp/send/', SendOTPView.as_view(), name='otp_send'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),
    
    # Admin workflows
    path('admin/distributors/', AdminDistributorListView.as_view(), name='admin_distributors'),
    path('admin/distributors/action/', AdminDistributorActionView.as_view(), name='admin_distributors_action'),
]
