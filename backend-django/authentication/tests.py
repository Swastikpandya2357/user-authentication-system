from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import OTPCode

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        # Create an Admin User
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='adminpassword123',
            role='ADMIN',
            status='ACTIVE'
        )

        # Create a Distributor User (Active)
        self.active_distributor = User.objects.create_user(
            username='dist_active',
            email='active@dist.com',
            password='distpassword123',
            phone_number='+15555555555',
            role='DISTRIBUTOR',
            status='ACTIVE'
        )

        # Create a Distributor User (Pending)
        self.pending_distributor = User.objects.create_user(
            username='dist_pending',
            email='pending@dist.com',
            password='distpassword123',
            phone_number='+16666666666',
            role='DISTRIBUTOR',
            status='PENDING'
        )

    def test_distributor_registration(self):
        """Verify distributor registration endpoint creates pending profile."""
        url = reverse('auth_register')
        data = {
            'username': 'new_distributor',
            'email': 'new@distributor.com',
            'phone_number': '+17777777777',
            'password': 'securepassword123'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'new_distributor')
        self.assertEqual(response.data['role'], 'DISTRIBUTOR')
        self.assertEqual(response.data['status'], 'PENDING')
        
        # Verify db persistence
        user = User.objects.get(username='new_distributor')
        self.assertEqual(user.email, 'new@distributor.com')
        self.assertFalse(user.is_email_verified)
        self.assertFalse(user.is_phone_verified)

    def test_login_flow(self):
        """Verify login returns Simple JWT token and user profile payloads."""
        url = reverse('token_obtain_pair')
        data = {
            'username': 'dist_active',
            'password': 'distpassword123'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'dist_active')
        self.assertEqual(response.data['user']['role'], 'DISTRIBUTOR')
        self.assertEqual(response.data['user']['status'], 'ACTIVE')

    def test_suspended_login_rejected(self):
        """Verify suspended profiles are blocked from generating tokens."""
        self.active_distributor.status = 'SUSPENDED'
        self.active_distributor.save()
        
        url = reverse('token_obtain_pair')
        data = {
            'username': 'dist_active',
            'password': 'distpassword123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_role_based_permissions(self):
        """Verify normal distributors cannot access admin management APIs."""
        # 1. Login active distributor
        login_url = reverse('token_obtain_pair')
        login_res = self.client.post(login_url, {'username': 'dist_active', 'password': 'distpassword123'})
        access_token = login_res.data['access']
        
        # 2. Query admin endpoint using distributor token (should fail)
        admin_url = reverse('admin_distributors')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)
        response = self.client.get(admin_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 3. Query using Admin token (should succeed)
        admin_login_res = self.client.post(login_url, {'username': 'admin_test', 'password': 'adminpassword123'})
        admin_token = admin_login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + admin_token)
        response = self.client.get(admin_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return both self.active_distributor and self.pending_distributor
        self.assertEqual(len(response.data), 2)

    def test_otp_generation_and_recovery(self):
        """Verify OTP sending and password reset recovery process."""
        # 1. Send OTP
        url = reverse('otp_send')
        data = {
            'identifier': 'dist_active',
            'method': 'sms'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify OTP model row
        otp_count = OTPCode.objects.filter(user=self.active_distributor, otp_type='SMS').count()
        self.assertEqual(otp_count, 1)
        
        otp_record = OTPCode.objects.get(user=self.active_distributor)
        code = otp_record.code
        
        # 2. Verify OTP & Reset password
        verify_url = reverse('otp_verify')
        verify_data = {
            'identifier': 'dist_active',
            'code': code,
            'new_password': 'brandnewpassword999'
        }
        verify_res = self.client.post(verify_url, verify_data, format='json')
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        
        # Verify code is marked used
        otp_record.refresh_from_db()
        self.assertTrue(otp_record.is_used)
        
        # Verify login with new password works
        login_url = reverse('token_obtain_pair')
        login_res = self.client.post(login_url, {'username': 'dist_active', 'password': 'brandnewpassword999'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
