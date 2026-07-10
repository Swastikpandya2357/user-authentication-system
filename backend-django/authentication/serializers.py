from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Inject custom claims
        token['username'] = user.username
        token['role'] = user.role
        token['status'] = user.status
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if user account is suspended
        if self.user.status == 'SUSPENDED':
            raise serializers.ValidationError({"detail": "This account has been suspended. Please contact admin."})
            
        # Include additional user info in response payload
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'status': self.user.status,
            'phone_number': self.user.phone_number,
            'is_phone_verified': self.user.is_phone_verified,
            'is_email_verified': self.user.is_email_verified
        }
        return data


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'password', 'role', 'status']

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            role='DISTRIBUTOR',
            status='PENDING'  # Distributor signup is pending approval by default
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'status', 'phone_number', 'is_phone_verified', 'is_email_verified', 'date_joined']
        read_only_fields = ['id', 'role', 'date_joined']
