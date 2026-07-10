from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import datetime


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('DISTRIBUTOR', 'Distributor'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DISTRIBUTOR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"


class OTPCode(models.Model):
    TYPE_CHOICES = (
        ('EMAIL', 'Email OTP'),
        ('SMS', 'SMS OTP'),
    )

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otp_codes')
    code = models.CharField(max_length=6)
    otp_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='EMAIL')
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        # Expires in 10 minutes
        expiration_time = self.created_at + datetime.timedelta(minutes=10)
        return timezone.now() > expiration_time

    def __str__(self):
        return f"{self.otp_type} Code for {self.user.username}: {self.code}"
