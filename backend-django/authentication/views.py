from django.contrib.auth import get_user_model
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import OTPCode
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegisterSerializer,
    UserSerializer
)
from .helpers import (
    generate_otp,
    send_sms_otp,
    send_email_otp,
    log_event_to_node_service
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom Token Obtain view that logs logins and injects custom claims."""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get('username')
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
            user = User.objects.filter(username=username).first()
            role = user.role if user else 'unknown'
            
            # Log successful login to Node.js audit microservice
            log_event_to_node_service(
                event_type='USER_LOGIN',
                username=username,
                status='SUCCESS',
                description=f"Successful login for {username} ({role})",
                ip_address=ip
            )
        return response


class UserRegisterView(generics.CreateAPIView):
    """Distributor signup view."""
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        
        # Log registration event
        log_event_to_node_service(
            event_type='USER_REGISTER',
            username=user.username,
            status='SUCCESS',
            description=f"New distributor registered: {user.username}",
            ip_address=ip
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update profile details for authenticated user."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        log_event_to_node_service(
            event_type='PROFILE_UPDATE',
            username=instance.username,
            status='SUCCESS',
            description=f"Updated profile fields: {', '.join(request.data.keys())}",
            ip_address=ip
        )
        return Response(serializer.data)


class SendOTPView(APIView):
    """Triggers multi-channel OTP recovery dispatch via SMS or email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier')  # can be email, username, or phone
        method = request.data.get('method')  # 'email' or 'sms'
        
        if not identifier or not method:
            return Response(
                {"error": "Please provide both 'identifier' (username, email, or phone) and 'method' ('email' or 'sms')."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Find user
        user = None
        if '@' in identifier:
            user = User.objects.filter(email=identifier).first()
        else:
            user = User.objects.filter(username=identifier).first()
            if not user:
                user = User.objects.filter(phone_number=identifier).first()
                
        if not user:
            # For security reasons, don't explicitly say user wasn't found.
            # However, for a portfolio demonstration, we can return 404 to make testing easier.
            return Response({"error": "User with specified identifier not found."}, status=status.HTTP_404_NOT_FOUND)

        # Generate OTP
        code = generate_otp()
        
        # Save to database
        otp_type = 'SMS' if method.lower() == 'sms' else 'EMAIL'
        OTPCode.objects.create(user=user, code=code, otp_type=otp_type)
        
        # Send
        success = False
        destination = ""
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        if otp_type == 'SMS':
            if not user.phone_number:
                return Response({"error": "User does not have a phone number configured for SMS OTP."}, status=status.HTTP_400_BAD_REQUEST)
            destination = user.phone_number
            success = send_sms_otp(user.phone_number, code)
        else:
            destination = user.email
            success = send_email_otp(user.email, code)
            
        if success:
            log_event_to_node_service(
                event_type=f'OTP_SEND_{otp_type}',
                username=user.username,
                status='SUCCESS',
                description=f"Sent {otp_type} security verification OTP to {destination}.",
                ip_address=ip
            )
            return Response({
                "message": f"OTP successfully sent via {method}.",
                "recipient": destination,
                # Include code in development/demo response for easier UI testing!
                "demo_code": code 
            }, status=status.HTTP_200_OK)
        else:
            log_event_to_node_service(
                event_type=f'OTP_SEND_{otp_type}_FAILED',
                username=user.username,
                status='FAILURE',
                description=f"Failed to send {otp_type} OTP to {destination}.",
                ip_address=ip
            )
            return Response({"error": "Failed to deliver OTP. Check server configurations."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyOTPView(APIView):
    """Verifies the OTP and resets the user's password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier')
        code = request.data.get('code')
        new_password = request.data.get('new_password')

        if not identifier or not code or not new_password:
            return Response(
                {"error": "Missing parameters. 'identifier', 'code', and 'new_password' are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find user
        user = None
        if '@' in identifier:
            user = User.objects.filter(email=identifier).first()
        else:
            user = User.objects.filter(username=identifier).first()
            if not user:
                user = User.objects.filter(phone_number=identifier).first()

        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve matching active OTP code
        otp = OTPCode.objects.filter(user=user, code=code, is_used=False).order_by('-created_at').first()

        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        if not otp:
            log_event_to_node_service(
                event_type='PASSWORD_RESET_FAILED',
                username=user.username,
                status='FAILURE',
                description="Invalid recovery verification code entered.",
                ip_address=ip
            )
            return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

        if otp.is_expired():
            log_event_to_node_service(
                event_type='PASSWORD_RESET_FAILED',
                username=user.username,
                status='FAILURE',
                description="Expired verification code entered.",
                ip_address=ip
            )
            return Response({"error": "Verification code has expired (10-min limit)."}, status=status.HTTP_400_BAD_REQUEST)

        # Reset Password
        user.set_password(new_password)
        
        # Auto-verify the channel they used
        if otp.otp_type == 'EMAIL':
            user.is_email_verified = True
        elif otp.otp_type == 'SMS':
            user.is_phone_verified = True
            
        user.save()

        # Mark OTP as used
        otp.is_used = True
        otp.save()

        log_event_to_node_service(
            event_type='PASSWORD_RESET_SUCCESS',
            username=user.username,
            status='SUCCESS',
            description=f"Password successfully reset via {otp.otp_type} OTP authentication.",
            ip_address=ip
        )

        return Response({"message": "Password reset successfully. You can now login with your new password."}, status=status.HTTP_200_OK)


# Custom role-based authorization permissions
class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class AdminDistributorListView(generics.ListAPIView):
    """Admin-only endpoint to view all registered distributors."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role='DISTRIBUTOR').order_by('-id')


class AdminDistributorActionView(APIView):
    """Admin-only endpoint to approve, suspend or activate distributors."""
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request):
        user_id = request.data.get('user_id')
        action = request.data.get('action') # 'approve', 'suspend', 'activate'

        if not user_id or not action:
            return Response({"error": "Missing user_id or action."}, status=status.HTTP_400_BAD_REQUEST)

        distributor = User.objects.filter(id=user_id, role='DISTRIBUTOR').first()
        if not distributor:
            return Response({"error": "Distributor not found."}, status=status.HTTP_404_NOT_FOUND)

        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        if action == 'approve':
            distributor.status = 'ACTIVE'
            description = f"Approved distributor profile {distributor.username}"
        elif action == 'suspend':
            distributor.status = 'SUSPENDED'
            description = f"Suspended distributor profile {distributor.username}"
        elif action == 'activate':
            distributor.status = 'ACTIVE'
            description = f"Reactivated distributor profile {distributor.username}"
        else:
            return Response({"error": "Invalid action. Choose 'approve', 'suspend', or 'activate'."}, status=status.HTTP_400_BAD_REQUEST)

        distributor.save()

        log_event_to_node_service(
            event_type=f'ADMIN_ACTION_{action.upper()}',
            username=distributor.username,
            status='SUCCESS',
            description=f"{description} (Performed by admin: {request.user.username})",
            ip_address=ip
        )

        return Response({
            "message": f"Distributor status updated to {distributor.status}.",
            "user": UserSerializer(distributor).data
        }, status=status.HTTP_200_OK)
