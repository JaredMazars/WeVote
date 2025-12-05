# Forgot Password - Quick Test Guide

## Quick Start Testing

### Prerequisites
✅ Server running on port 3001  
✅ Frontend running on port 5173  
✅ Email service configured (EMAIL_USER and EMAIL_PASSWORD in .env)  
✅ Database connected  

### Test Steps

#### 1. Access Forgot Password Page
```
1. Open browser: http://localhost:5173
2. Click "Forgot Password?" link
3. Should redirect to: http://localhost:5173/forgot-password
```

#### 2. Request Password Reset
```
1. Enter valid email: your-test-email@example.com
2. Click "Send Temporary Password"
3. Wait for loading indicator
4. Should see green success message
5. Should auto-redirect to login after 5 seconds
```

#### 3. Check Email
```
1. Open email inbox
2. Look for email from "WeVote Platform"
3. Subject: "🔐 Password Reset - WeVote"
4. Email should have:
   - Gradient blue header
   - Large temporary password in red box
   - Security warnings
   - "Login & Change Password" button
```

#### 4. Login with Temporary Password
```
1. Copy temporary password from email
2. Go to login page
3. Enter:
   - Email: your-test-email@example.com
   - Password: [paste temp password]
4. Click "Sign In"
5. Should see "Update Password" modal
```

#### 5. Change Password
```
1. In "Update Password" modal:
   - Enter new password (min 6 characters)
2. Click "Update Password & Continue"
3. Should see success message: "✅ Password updated successfully!"
4. Should redirect to home page
5. Should be fully logged in
```

### Backend API Test (PowerShell)

```powershell
# Test forgot password endpoint
$body = @{
    email = "user@example.com"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3001/api/auth/forgot-password" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

Write-Host "Success: $($response.success)"
Write-Host "Message: $($response.message)"
```

**Expected Output**:
```
Success: True
Message: A temporary password has been sent to your email address.
```

### Server Log Verification

Look for these logs in your server console:

```
📧 Preparing password reset email for: user@example.com
📤 Sending password reset email...
✅ Password reset email sent successfully!
📨 Message ID: <some-message-id>
✅ Password reset email sent to user@example.com
```

### Database Verification

```sql
-- Check user flags after reset
SELECT id, email, is_temp_password, needs_password_change, updated_at
FROM users
WHERE email = 'user@example.com'

-- Expected:
-- is_temp_password = 1
-- needs_password_change = 1
-- updated_at = recent timestamp
```

### Test Scenarios

#### ✅ Happy Path
- User enters valid email
- Receives email with temp password
- Logs in with temp password
- Creates new password
- Successfully accesses account

#### ⚠️ Edge Cases to Test

**Invalid Email Format**:
- Enter: "notanemail"
- Expected: Red error - "Please enter a valid email address"

**Empty Email**:
- Leave email blank, click submit
- Expected: Red error - "Email is required"

**Non-Existent Email**:
- Enter: "doesnotexist@example.com"
- Expected: Green success message (doesn't reveal if user exists)
- No email sent

**Already Logged In**:
- Login first, then try to access /forgot-password
- Expected: Redirect to /home

**Network Error**:
- Stop server, try to submit
- Expected: Error message about network connection

### Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Email not arriving | Check spam folder, verify EMAIL_PASSWORD |
| 404 on /forgot-password | Restart Vite dev server |
| Temp password doesn't work | Copy password carefully, no extra spaces |
| Modal not showing | Check is_temp_password flag in database |
| Server error | Check server logs, verify User.setTempPassword exists |

### Success Indicators

✅ Success message appears  
✅ Email arrives within 30 seconds  
✅ Temp password is 10 characters  
✅ Email has professional design  
✅ Login with temp password works  
✅ Password update modal appears  
✅ New password works for login  

### Quick Demo Script

```
# Terminal 1: Start Server
cd server
node app.js

# Terminal 2: Start Frontend  
npm run dev

# Browser: Test Flow
1. Go to http://localhost:5173
2. Click "Forgot Password?"
3. Enter: test@example.com
4. Click "Send Temporary Password"
5. Check email
6. Login with temp password
7. Change password
8. Done! ✅
```

### One-Line Test Command

```powershell
# Quick API test
(Invoke-RestMethod -Uri "http://localhost:3001/api/auth/forgot-password" -Method POST -Body '{"email":"user@example.com"}' -ContentType "application/json").message
```

---

## ⚡ 2-Minute Test

**Fastest way to verify it works**:

1. Open: http://localhost:5173/forgot-password
2. Enter any email from your users table
3. Click send
4. Check your email
5. Done! ✅

If email arrives with temp password → **Feature works!** 🎉

---

**Testing Status**: Ready ✅  
**Estimated Test Time**: 2-5 minutes  
**Complexity**: Low  
