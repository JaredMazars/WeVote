# Admin Password Management Testing Guide

## Overview
Implemented automatic password generation, email notifications, and mandatory first-login password change for new admin users.

## Implementation Summary

### 1. Frontend Changes (`src/pages/SuperAdminDashboard.tsx`)
- ✅ Added password generator function: `generateSecurePassword()`
- ✅ Auto-generates 12-character secure password when Add Admin modal opens
- ✅ Password field is read-only with copy button and regenerate option
- ✅ Added First Login Password Change Modal (full-screen, non-dismissible)
- ✅ Checks on component mount if user requires password change
- ✅ Sends credentials email after admin creation

### 2. Backend Changes

#### Database Migration
- ✅ Created `database/migrations/add_requires_password_change.sql`
- Adds `RequiresPasswordChange BIT` column to `Users` table
- Must be run manually on Azure SQL database

#### User Model (`backend/src/models/User.js`)
- ✅ Updated `create()` to set `RequiresPasswordChange = 1` for admin/auditor roles
- ✅ Updated `findByEmail()` and `findById()` to include `RequiresPasswordChange`
- ✅ Added `clearPasswordChangeRequirement()` method

#### Auth Routes (`backend/src/routes/auth.js`)
- ✅ Added `POST /api/auth/send-admin-credentials` - Sends welcome email
- ✅ Added `GET /api/auth/check-password-change` - Checks if password change required
- ✅ Added `POST /api/auth/first-login-password-change` - Changes password and clears flag

#### Email Service (`backend/src/services/emailService.js`)
- ✅ Created nodemailer-based email service
- ✅ `sendAdminCredentialsEmail()` - Sends beautifully formatted HTML email
- ✅ Includes email, temp password, and instructions

### 3. Environment Variables Required
Add to `backend/.env`:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

## Testing Process

### Step 1: Database Migration
Run the SQL migration:
```sql
-- Connect to Azure SQL wevotedb1
USE wevotedb1;
GO

ALTER TABLE Users
ADD RequiresPasswordChange BIT DEFAULT 0;

ALTER TABLE Users
ALTER COLUMN RequiresPasswordChange BIT NOT NULL;

UPDATE Users
SET RequiresPasswordChange = 0
WHERE RequiresPasswordChange IS NULL;
```

### Step 2: Configure Email (SMTP)
1. For Gmail, create an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   
2. Update `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=generated-app-password
FRONTEND_URL=http://localhost:5173
```

### Step 3: Restart Backend
```powershell
cd backend
node src/server.js
```

### Step 4: Test Admin Creation Flow

#### A. Create New Admin
1. Login as Super Admin (admin@forvismazars.com / Admin@2024)
2. Go to Super Admin Dashboard
3. Click "AGM Admins" tab
4. Click "+ Add Admin/Auditor"
5. **Observe**: Password field auto-populated with random password
6. Fill in:
   - Role: Admin
   - Email: testadmin@forvismazars.com
   - First Name: Test
   - Last Name: Admin
7. **Observe**: Password is read-only with copy button
8. Click regenerate icon to generate new password if needed
9. Click "Add Admin"
10. **Expected**: Success message "Admin created! Credentials email sent to..."

#### B. Verify Email Received
1. Check email inbox for testadmin@forvismazars.com
2. **Expected**: Beautiful HTML email with:
   - Welcome message
   - Login credentials (email + temp password)
   - Security warning
   - "Login to WeVote" button
   - Next steps instructions

#### C. First Login - Password Change Forced
1. Logout from Super Admin
2. Go to login page
3. Login with:
   - Email: testadmin@forvismazars.com
   - Password: (temp password from email)
4. **Expected**: Full-screen password change modal appears
5. **Observe**: Cannot dismiss modal or access dashboard
6. Enter:
   - New Password: NewAdmin@2024
   - Confirm Password: NewAdmin@2024
7. Click "Set New Password"
8. **Expected**: Success message, modal closes, dashboard loads

#### D. Verify Password Change Persisted
1. Logout
2. Try to login with OLD temp password
3. **Expected**: Login fails
4. Login with NEW password (NewAdmin@2024)
5. **Expected**: Login succeeds, NO password change modal
6. **Expected**: Dashboard loads normally

### Step 5: Edge Case Testing

#### Test 1: Password Mismatch
1. Create another admin
2. Login with temp password
3. Enter different passwords in New/Confirm fields
4. **Expected**: Error "Passwords do not match"

#### Test 2: Password Too Short
1. Enter password less than 8 characters
2. **Expected**: Error "Password must be at least 8 characters"

#### Test 3: Copy Password Functionality
1. In Add Admin modal, click copy icon next to password
2. **Expected**: Icon changes to checkmark briefly
3. Paste somewhere to verify password copied

#### Test 4: Email Failure Handling
1. Temporarily break email config (wrong SMTP password)
2. Create new admin
3. **Expected**: Admin still created with warning message
4. **Verify**: Admin can still login (password saved to database)

### Step 6: Database Verification
Query to check RequiresPasswordChange flag:
```sql
SELECT UserID, Email, FirstName, LastName, Role, RequiresPasswordChange
FROM Users
WHERE Role IN ('admin', 'auditor')
ORDER BY CreatedAt DESC;
```

**Expected**:
- New admins: RequiresPasswordChange = 1
- After password change: RequiresPasswordChange = 0

## Success Criteria

✅ Password auto-generated when modal opens  
✅ Password is random and secure (12+ chars, mixed case, numbers, symbols)  
✅ Copy password works  
✅ Regenerate password works  
✅ Email sent successfully with credentials  
✅ Email HTML formatted correctly  
✅ First login shows password change modal  
✅ Cannot dismiss modal or access features  
✅ Password change validates input (length, match)  
✅ New password saved to database  
✅ RequiresPasswordChange flag cleared  
✅ Subsequent logins work with new password  
✅ No password change modal on second login  

## Troubleshooting

### Email not sending:
- Check SMTP credentials in `.env`
- For Gmail, ensure "Less secure app access" OR use App Password
- Check backend logs for email errors
- Verify network can reach SMTP server

### Password change modal doesn't appear:
- Check browser console for API errors
- Verify `/api/auth/check-password-change` endpoint works
- Check RequiresPasswordChange column exists in database

### Password change doesn't persist:
- Check `/api/auth/first-login-password-change` endpoint
- Verify `clearPasswordChangeRequirement()` method runs
- Check database that RequiresPasswordChange = 0 after change

## Files Modified/Created

### Created:
- `backend/src/services/emailService.js`
- `database/migrations/add_requires_password_change.sql`
- `ADMIN_PASSWORD_MANAGEMENT.md` (this file)

### Modified:
- `src/pages/SuperAdminDashboard.tsx`
- `backend/src/models/User.js`
- `backend/src/routes/auth.js`
- `backend/package.json` (added nodemailer)

## Next Steps

1. Run database migration (add RequiresPasswordChange column)
2. Configure SMTP settings in backend/.env
3. Restart backend server
4. Test complete workflow as outlined above
5. If successful, repeat for Auditor role
6. Deploy changes to production environment
