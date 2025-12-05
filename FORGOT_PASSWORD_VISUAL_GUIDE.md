# 🔐 Forgot Password Feature - Visual Flow

## 📱 User Interface Screens

### Screen 1: Login Page
```
┌─────────────────────────────────────────┐
│  WeVote Login                           │
├─────────────────────────────────────────┤
│                                         │
│  📧 Email: ___________________          │
│  🔒 Password: ________________          │
│                                         │
│  [ Sign In ]                           │
│                                         │
│  or                                     │
│                                         │
│  [ Continue with Microsoft ]           │
│                                         │
│  → Forgot Password? ← [CLICK HERE]     │ ✅ Already implemented
│                                         │
└─────────────────────────────────────────┘
```

### Screen 2: Forgot Password Page (NEW ✅)
```
┌─────────────────────────────────────────┐
│  🔐 Forgot Password?                    │
├─────────────────────────────────────────┤
│  Enter your email and we'll send        │
│  you a temporary password               │
│                                         │
│  📧 Email Address                       │
│     ________________________________    │
│                                         │
│  [ Send Temporary Password ]           │
│                                         │
│  ← Back to Login                        │
│                                         │
│  Steps:                                │
│  1️⃣ Enter your email address            │
│  2️⃣ Check inbox for temp password       │
│  3️⃣ Login and create new password       │
│                                         │
└─────────────────────────────────────────┘
```

### Screen 3: Success Message
```
┌─────────────────────────────────────────┐
│  🔐 Forgot Password?                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ✅ Success!                       │ │
│  │                                   │ │
│  │ A temporary password has been    │ │
│  │ sent to your email address.      │ │
│  │                                   │ │
│  │ Redirecting to login in 5 sec... │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ← Back to Login                        │
│                                         │
└─────────────────────────────────────────┘
```

### Screen 4: Email Template
```
┌─────────────────────────────────────────┐
│  From: WeVote Platform                  │
│  Subject: 🔐 Password Reset - WeVote    │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║   🔐 Password Reset               ║ │
│  ║   Your temporary password is ready║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  Hello User,                           │
│                                         │
│  We received a request to reset your   │
│  password. Here's your temporary pwd:  │
│                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│    🔑 Temporary Password               │
│                                         │
│        aB3xY9$mPq                      │ ← 10 random chars
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                         │
│  ⚠️ Important:                         │
│  • This is temporary - change on login │
│  • If you didn't request this, contact│
│    support immediately                 │
│                                         │
│  [ Login & Change Password → ]         │
│                                         │
│  © 2025 WeVote by Forvis Mazars       │
└─────────────────────────────────────────┘
```

### Screen 5: Login with Temp Password
```
┌─────────────────────────────────────────┐
│  WeVote Login                           │
├─────────────────────────────────────────┤
│                                         │
│  📧 Email: user@example.com            │
│  🔒 Password: aB3xY9$mPq ← from email  │
│                                         │
│  [ Sign In ] ← Click                   │
│                                         │
└─────────────────────────────────────────┘
                    ↓
         System detects temp password
                    ↓
```

### Screen 6: Update Password Modal (Auto-appears)
```
┌─────────────────────────────────────────┐
│  🔐 Update Password                     │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ You're using a temporary password  │
│  Please create a new secure password   │
│  to continue.                          │
│                                         │
│  🔒 New Password                        │
│     ________________________________    │
│     (minimum 6 characters)              │
│                                         │
│  [ Update Password & Continue ]        │
│                                         │
└─────────────────────────────────────────┘
                    ↓
              Password updated
                    ↓
              ✅ Success!
                    ↓
          Redirect to Home Page
```

## 🔄 Complete Flow Diagram

```
START
  │
  ├─ User on Login Page
  │    │
  │    ├─ Clicks "Forgot Password?"
  │    │
  │    └─→ Navigate to /forgot-password
  │
  ├─ Forgot Password Page
  │    │
  │    ├─ User enters email
  │    │
  │    ├─ Clicks "Send Temporary Password"
  │    │
  │    └─→ API Call: POST /api/auth/forgot-password
  │
  ├─ Backend Processing
  │    │
  │    ├─ Validate email
  │    │
  │    ├─ Find user in database
  │    │    │
  │    │    ├─ User exists? → Continue
  │    │    └─ User doesn't exist? → Still return success (security)
  │    │
  │    ├─ Generate 10-char random password
  │    │    (e.g., "aB3xY9$mPq")
  │    │
  │    ├─ Hash password with bcrypt
  │    │
  │    ├─ Update database:
  │    │    • password_hash = hashed_temp_password
  │    │    • is_temp_password = 1
  │    │    • needs_password_change = 1
  │    │
  │    ├─ Send email with temp password
  │    │    • HTML template
  │    │    • Plain text fallback
  │    │
  │    └─→ Return success response
  │
  ├─ Frontend Success
  │    │
  │    ├─ Show green success message
  │    │
  │    ├─ Wait 5 seconds
  │    │
  │    └─→ Auto-redirect to /login
  │
  ├─ User Receives Email
  │    │
  │    ├─ Opens email
  │    │
  │    ├─ Copies temporary password
  │    │
  │    └─→ Clicks "Login & Change Password" button
  │
  ├─ User Returns to Login
  │    │
  │    ├─ Enters email
  │    │
  │    ├─ Pastes temp password
  │    │
  │    └─→ Clicks "Sign In"
  │
  ├─ Login Processing
  │    │
  │    ├─ Verify credentials
  │    │
  │    ├─ Check: is_temp_password = 1?
  │    │    OR needs_password_change = 1?
  │    │    │
  │    │    ├─ YES → Show "Update Password" modal
  │    │    └─ NO → Normal login flow
  │    │
  │    └─→ Display modal, DO NOT redirect yet
  │
  ├─ Update Password Modal
  │    │
  │    ├─ User enters new password (min 6 chars)
  │    │
  │    ├─ Clicks "Update Password & Continue"
  │    │
  │    └─→ API Call: POST /api/auth/update-password
  │
  ├─ Password Update Processing
  │    │
  │    ├─ Hash new password
  │    │
  │    ├─ Update database:
  │    │    • password_hash = new_hashed_password
  │    │    • is_temp_password = 0
  │    │    • needs_password_change = 0
  │    │
  │    ├─ Show success message
  │    │
  │    └─→ Continue login flow
  │
  └─ Final Redirect
       │
       ├─ Check: proxy form needed?
       │    │
       │    ├─ YES → Navigate to /proxy-form
       │    └─ NO → Navigate to /home
       │
       └─→ ✅ USER FULLY LOGGED IN
```

## 🗄️ Database State Changes

### Before Password Reset:
```sql
SELECT id, email, password_hash, is_temp_password, needs_password_change
FROM users WHERE email = 'user@example.com'

┌────┬──────────────────┬──────────────┬──────────────────┬──────────────────────┐
│ id │ email            │ password_hash│ is_temp_password │ needs_password_change│
├────┼──────────────────┼──────────────┼──────────────────┼──────────────────────┤
│ 42 │ user@example.com │ $2a$12$abc…  │        0         │          0           │
└────┴──────────────────┴──────────────┴──────────────────┴──────────────────────┘
```

### After Password Reset Request:
```sql
┌────┬──────────────────┬──────────────┬──────────────────┬──────────────────────┐
│ id │ email            │ password_hash│ is_temp_password │ needs_password_change│
├────┼──────────────────┼──────────────┼──────────────────┼──────────────────────┤
│ 42 │ user@example.com │ $2a$12$xyz…  │        1 ✅      │          1 ✅        │
└────┴──────────────────┴──────────────┴──────────────────┴──────────────────────┘
                                          ↑ Temp password    ↑ Must change
```

### After New Password Set:
```sql
┌────┬──────────────────┬──────────────┬──────────────────┬──────────────────────┐
│ id │ email            │ password_hash│ is_temp_password │ needs_password_change│
├────┼──────────────────┼──────────────┼──────────────────┼──────────────────────┤
│ 42 │ user@example.com │ $2a$12$new…  │        0 ✅      │          0 ✅        │
└────┴──────────────────┴──────────────┴──────────────────┴──────────────────────┘
                                          ↑ Cleared         ↑ Cleared
```

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │ Login.tsx    │   │ForgotPassword│   │  App.tsx     │      │
│  │              │   │   .tsx       │   │              │      │
│  │ • Has link   │◄─►│ • Email input│◄─►│ • Routes     │      │
│  │ • Shows modal│   │ • API call   │   │ • /forgot-pw │      │
│  │ • Updates pw │   │ • Success msg│   │              │      │
│  └──────────────┘   └──────────────┘   └──────────────┘      │
│         │                   │                                  │
│         └───────────────────┴──────────────┐                  │
│                                             │                  │
└─────────────────────────────────────────────┼──────────────────┘
                                              │ HTTP
                                              │
┌─────────────────────────────────────────────┼──────────────────┐
│                         BACKEND (Node.js)   ▼                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │ auth.js      │   │ User.js      │   │emailService  │      │
│  │ (routes)     │   │ (model)      │   │   .js        │      │
│  │              │   │              │   │              │      │
│  │ POST /forgot │──►│setTempPassword│──►│sendPassword  │      │
│  │  -password   │   │              │   │ ResetEmail   │      │
│  │              │   │              │   │              │      │
│  └──────────────┘   └──────────────┘   └──────────────┘      │
│         │                   │                   │              │
│         └───────────────────┴───────────────────┼──────────    │
│                                                 │              │
└─────────────────────────────────────────────────┼──────────────┘
                                                  │ SMTP
                                                  │
┌─────────────────────────────────────────────────┼──────────────┐
│                      EXTERNAL SERVICES          ▼              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐           ┌──────────────┐                  │
│  │   Database   │           │    Gmail     │                  │
│  │  (SQL Server)│           │   SMTP       │                  │
│  │              │           │              │                  │
│  │ • users table│           │ • Sends email│                  │
│  │ • Temp flags │           │ • HTML/Text  │                  │
│  │              │           │              │                  │
│  └──────────────┘           └──────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Forgot Password Page:
- **Primary**: Blue gradient (#0072CE → #171C8F)
- **Background**: Light gray (#F4F4F4)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Text**: Dark gray (#464B4B)

### Email Template:
- **Header**: Blue gradient (#0072CE → #171C8F)
- **Temp Password Box**: Red border (#dc3545)
- **Warning Box**: Yellow background (#fff3cd)
- **Button**: Blue gradient (#0072CE → #171C8F)

## ⏱️ Timing

| Action | Duration |
|--------|----------|
| Email sending | ~2-5 seconds |
| Success message display | 5 seconds |
| Auto-redirect delay | 5 seconds |
| Total user wait time | ~10-15 seconds |

---

**Visual Guide Version**: 1.0  
**Last Updated**: November 26, 2025  
**Status**: Complete ✅
