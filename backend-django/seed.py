import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def seed_db():
    print("Seeding database with default users...")
    
    # 1. Admin
    admin_username = 'admin'
    if not User.objects.filter(username=admin_username).exists():
        admin = User.objects.create_user(
            username=admin_username,
            email='admin@company.com',
            password='admin123',
            role='ADMIN',
            status='ACTIVE',
            is_staff=True,
            is_superuser=True
        )
        print(f"Created Admin: {admin.username} (password: admin123)")
    else:
        print("Admin user already exists.")

    # 2. Active Distributor
    dist_username = 'distributor'
    if not User.objects.filter(username=dist_username).exists():
        dist = User.objects.create_user(
            username=dist_username,
            email='active.distributor@example.com',
            password='distributor123',
            phone_number='+15550199',
            role='DISTRIBUTOR',
            status='ACTIVE',
            is_phone_verified=True,
            is_email_verified=True
        )
        print(f"Created Active Distributor: {dist.username} (password: distributor123)")
    else:
        print("Active distributor already exists.")

    # 3. Pending Distributor
    pending_username = 'pending_distributor'
    if not User.objects.filter(username=pending_username).exists():
        pending = User.objects.create_user(
            username=pending_username,
            email='pending.distributor@example.com',
            password='distributor123',
            phone_number='+15550188',
            role='DISTRIBUTOR',
            status='PENDING'
        )
        print(f"Created Pending Distributor: {pending.username} (password: distributor123)")
    else:
        print("Pending distributor already exists.")

    print("Seeding database complete!")

if __name__ == '__main__':
    seed_db()
