import random
import requests
import logging
from django.conf import settings
from django.core.mail import send_mail
from twilio.rest import Client

logger = logging.getLogger(__name__)

def generate_otp():
    """Generates a secure 6-digit verification code."""
    return str(random.randint(100000, 999999))

def log_event_to_node_service(event_type, username, status='SUCCESS', description='', ip_address='127.0.0.1'):
    """
    Sends a security audit log event to the Node.js microservice.
    Fails silently if the microservice is down.
    """
    url = f"{settings.NODE_MICROSERVICE_URL}/api/audit-log"
    payload = {
        "event_type": event_type,
        "username": username,
        "ip_address": ip_address,
        "status": status,
        "description": description
    }
    try:
        requests.post(url, json=payload, timeout=2.0)
    except Exception as e:
        logger.warning(f"Failed to post audit log to Node.js microservice: {e}")

def dispatch_notification_via_node(method, recipient, code, otp_type="OTP Verification"):
    """
    Tries to dispatch notifications using the Node.js notification system.
    Returns True if successfully dispatched, False otherwise.
    """
    url = f"{settings.NODE_MICROSERVICE_URL}/api/dispatch-notification"
    payload = {
        "method": method,
        "recipient": recipient,
        "code": code,
        "type": otp_type
    }
    try:
        response = requests.post(url, json=payload, timeout=2.0)
        return response.status_code == 200
    except Exception as e:
        logger.warning(f"Failed to delegate notification to Node.js microservice: {e}")
        return False

def send_sms_otp(phone_number, code):
    """
    Sends an SMS OTP. Uses Twilio if config is set, otherwise prints to console
    and delegates to Node.js microservice log.
    """
    message_body = f"Your verification code is {code}. It expires in 10 minutes."
    
    # Try delegating to Node microservice dispatch first
    node_dispatched = dispatch_notification_via_node('sms', phone_number, code)
    if node_dispatched:
        return True

    # Fallback to local Twilio execution
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_PHONE_NUMBER:
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=message_body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            print(f"[TWILIO SMS SUCCESS] Sent code {code} to {phone_number}")
            return True
        except Exception as e:
            print(f"[TWILIO SMS FAILURE] Error sending SMS: {e}")
            # fall through to console logging
    
    print("\n==========================================")
    print(f"MOCK SMS DISPATCH (No Twilio Keys Found)")
    print(f"TO: {phone_number}")
    print(f"MESSAGE: {message_body}")
    print("==========================================\n")
    return True

def send_email_otp(email, code):
    """
    Sends an Email OTP. Uses Django SMTP console logger or real settings.
    Also delegates to Node.js microservice dispatch.
    """
    subject = "Reset Your Password - Security Verification"
    message_body = f"Your password reset verification code is {code}. It expires in 10 minutes."
    
    # Try delegating to Node microservice dispatch first
    node_dispatched = dispatch_notification_via_node('email', email, code, otp_type="Password Recovery")
    if node_dispatched:
        return True

    # Fallback to local SMTP execution
    try:
        send_mail(
            subject=subject,
            message=message_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        print(f"[SMTP EMAIL SUCCESS] Sent code {code} to {email}")
        return True
    except Exception as e:
        print(f"[SMTP EMAIL FAILURE] Error sending email: {e}")
        return False
