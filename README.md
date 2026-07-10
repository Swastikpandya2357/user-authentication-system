# User Authentication System

> **A full-stack, portfolio-grade Authentication System** built with Django, Node.js, React, PostgreSQL, and MySQL — featuring custom user models, role-based access control, JWT security, and multi-channel OTP password recovery.

---

## 🔐 Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Django + Django REST Framework |
| Authentication | Simple JWT (djangorestframework-simplejwt) |
| Microservice | Node.js + Express.js |
| Frontend | React (Vite) |
| Database | SQLite (default) / PostgreSQL / MySQL |
| SMS OTP | Twilio API |
| Email OTP | Django SMTP (configurable) |
| CORS | django-cors-headers |

---

## ✨ Key Features

- 🔐 **Custom User Model** — `AbstractUser` extended with roles (`ADMIN`, `DISTRIBUTOR`) and verification states
- 🧩 **Role-Based Login Workflows** — Separate dashboards and access policies per role
- 🛡️ **Simple JWT Security** — Stateless cryptographic authentication with injected user profile claims
- 📩 **Multi-Channel OTP Recovery** — Password reset via SMS (Twilio) and Email (SMTP), with graceful console fallback for demo environments
- 🛂 **Distributor Approval Pipeline** — New distributors start as `PENDING` and must be approved by Admin
- 📋 **Live Security Audit Ledger** — Node.js microservice logs all authentication events, streamed live to the Admin Dashboard
- ✅ **Django TestCase Unit Tests** — 5 tests covering registration, JWT login, role permissions, suspended account blocking, and OTP recovery
- 🗄️ **Multi-Database Support** — Switch between SQLite, PostgreSQL, or MySQL via environment variables

---

## 📁 Project Structure

```
user-auth-system/
├── backend-django/          # Django REST API
│   ├── authentication/      # Core auth app
│   │   ├── models.py        # CustomUser, OTPCode models
│   │   ├── serializers.py   # JWT token customizer, signup serializers
│   │   ├── views.py         # Login, Register, OTP, Admin endpoints
│   │   ├── helpers.py       # SMS/Email OTP dispatcher, Node.js webhook
│   │   ├── urls.py          # API endpoint routing
│   │   └── tests.py         # Django TestCase unit tests
│   ├── config/              # Django project config
│   │   ├── settings.py      # DB, JWT, SMTP, Twilio config
│   │   └── urls.py          # Root URL routing
│   ├── seed.py              # Database seeder (demo users)
│   └── manage.py
│
├── backend-node/            # Node.js Audit & Notification Microservice
│   └── server.js            # Express API with audit log endpoints
│
└── frontend-react/          # React (Vite) SPA
    └── src/
        ├── App.jsx                      # Router, Auth Context, Navbar
        ├── index.css                    # Premium Bright Mode Design System
        └── pages/
            ├── LoginPage.jsx            # Login form + demo credentials
            ├── RegisterPage.jsx         # Distributor signup + success screen
            ├── ForgotPasswordPage.jsx   # Step-by-step OTP recovery
            ├── AdminDashboard.jsx       # Distributor management + audit logs
            └── DistributorDashboard.jsx # Profile, API key generator
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.x
- Node.js 18+
- npm

### 1. Install Django Dependencies
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers twilio
```

### 2. Setup & Seed Database
```bash
cd backend-django
python manage.py makemigrations authentication
python manage.py migrate
python seed.py
```

### 3. Start Django API Server (Port 8000)
```bash
python manage.py runserver
```

### 4. Install & Start Node.js Microservice (Port 5001)
```bash
cd backend-node
npm install
node server.js
```

### 5. Install & Start React Frontend (Port 5173)
```bash
cd frontend-react
npm install
npm run dev
```

### 6. Open the App
Visit **http://127.0.0.1:5173**

---

## 🔑 Demo Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Active Distributor | `distributor` | `distributor123` |
| Pending Distributor | `pending_distributor` | `distributor123` |

---

## 🌐 API Endpoints

### Django REST API (Port 8000)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login/` | Login (returns JWT + user profile) |
| `POST` | `/api/auth/token/refresh/` | Refresh JWT token |
| `POST` | `/api/auth/register/` | Distributor signup |
| `GET/PUT` | `/api/auth/profile/` | View/update user profile |
| `POST` | `/api/auth/otp/send/` | Send OTP via Email or SMS |
| `POST` | `/api/auth/otp/verify/` | Verify OTP + reset password |
| `GET` | `/api/auth/admin/distributors/` | List all distributors (Admin only) |
| `POST` | `/api/auth/admin/distributors/action/` | Approve/Suspend/Activate (Admin only) |

### Node.js Microservice (Port 5001)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/audit-log` | Write security event to ledger |
| `GET` | `/api/audit-logs` | Fetch all audit logs |
| `POST` | `/api/dispatch-notification` | Cross-service OTP dispatch |

---

## 🔧 Environment Configuration

Create a `.env` file in `backend-django/` to configure:

```env
# Database (default: sqlite)
DB_ENGINE=postgresql  # or mysql, sqlite
DB_NAME=auth_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432

# Twilio SMS (optional - falls back to console log)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# SMTP Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=yourpassword
```

---

## 🧪 Running Unit Tests

```bash
cd backend-django
python manage.py test authentication
```

**5 Tests Covered:**
- ✅ Distributor registration creates PENDING profile
- ✅ JWT login returns tokens + user payload
- ✅ Suspended accounts are blocked from login
- ✅ Role-based access (Distributors blocked from Admin APIs)
- ✅ Full OTP send → verify → password reset pipeline

---

## 👨‍💻 Built By

**Swastik Pandya** — Internship Project  
*User Authentication System | Django, React, Node.js, PostgreSQL, MySQL*
