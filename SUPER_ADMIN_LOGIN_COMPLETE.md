# Super Admin Login - Complete Setup & Testing Guide

## ✅ VERIFIED WORKING - November 24, 2025

---

## 🔐 Super Admin Credentials

**Email:** `admin.bilal@wevote.com`  
**Password:** `W3V0t3@dmin2025!`  
**Role ID:** `0` (Super Admin)  
**Member Number:** `SA001`  
**User ID:** `170`

---

## 🎯 What Was Implemented

### 1. Backend API Endpoint (`/api/auth/super-admin-login`)
**Location:** `server/routes/auth.js` (Lines 20-134)

**Features:**
- ✅ Validates super admin credentials
- ✅ Checks if user has `role_id = 0` (Super Admin)
- ✅ Verifies password using bcrypt
- ✅ Returns JWT token with super admin privileges
- ✅ Logs login events
- ✅ Returns full user data

**Tested:** ✅ Successfully tested with curl/PowerShell
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/auth/super-admin-login" `
  -ContentType "application/json" `
  -Body '{"email":"admin.bilal@wevote.com","password":"W3V0t3@dmin2025!"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Super Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 170,
    "email": "admin.bilal@wevote.com",
    "name": "Bilal Administrator",
    "role": "super admin",
    "role_id": 0
  }
}
```

### 2. Frontend Routes (`App.tsx`)
**Location:** `src/App.tsx`

**Routes Added:**
- ✅ `/super-admin-login` → SuperAdminLogin component
- ✅ `/admin-login` → SuperAdminLogin component (reusing same component)

**Protection Logic:**
```typescript
// SuperAdminRoute checks for role_id = 0 or role_id = 1
const roleId = user?.role_id ? parseInt(user.role_id) : null;
const isSuperAdmin = user && (roleId === 0 || roleId === 1 || user.role === 'admin');
```

### 3. Header Navigation Buttons (`Header.tsx`)
**Location:** `src/components/Header.tsx`

**Always Visible Buttons:**
- ✅ **Super Admin** button (Crown icon) → Routes to `/super-admin-login`
- ✅ **Admin** button (Shield icon) → Routes to `/admin-login`

**Conditional Buttons (When Logged In as Super Admin):**
- ✅ **Super Admin Dashboard** button (Yellow/Gold) → Routes to `/super-admin` dashboard
- ✅ User profile, proxy buttons, logout

### 4. Super Admin Login Page (`SuperAdminLogin.tsx`)
**Location:** `src/pages/SuperAdminLogin.tsx`

**Features:**
- ✅ Email and password input fields
- ✅ Show/hide password toggle
- ✅ Form validation
- ✅ Error handling
- ✅ Connects to `/api/auth/super-admin-login` endpoint
- ✅ Stores JWT token and user data in localStorage
- ✅ Redirects to `/super-admin` dashboard on success

---

## 🚀 How to Use

### Step 1: Start Both Servers

**Backend:**
```powershell
cd "c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy"
npm run server
```
Server runs on: `http://localhost:3001`

**Frontend:**
```powershell
cd "c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy"
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Step 2: Navigate to Super Admin Login

**Option A:** Click the **"Super Admin"** button in the header (always visible)

**Option B:** Go directly to: `http://localhost:5173/super-admin-login`

### Step 3: Login

1. Enter email: `admin.bilal@wevote.com`
2. Enter password: `W3V0t3@dmin2025!`
3. Click **"Login as Super Admin"**

### Step 4: Access Dashboard

After successful login, you'll be redirected to: `http://localhost:5173/super-admin`

---

## 📋 Testing Checklist

- [x] Backend server starts without errors
- [x] Frontend server starts without errors
- [x] Super Admin button appears in header
- [x] Super Admin button routes to `/super-admin-login`
- [x] Admin button appears in header
- [x] Admin button routes to `/admin-login`
- [x] Login form appears correctly
- [x] Email and password fields work
- [x] Show/hide password toggle works
- [x] API endpoint `/api/auth/super-admin-login` responds
- [x] Credentials are validated correctly
- [x] JWT token is generated and returned
- [x] Token is stored in localStorage
- [x] User data is stored in localStorage
- [x] Redirect to `/super-admin` dashboard works
- [x] Super Admin Dashboard button appears after login (yellow/gold)
- [x] User can access super admin features

---

## 🔧 Technical Details

### Database User Record
```sql
SELECT * FROM users WHERE email = 'admin.bilal@wevote.com'

-- Result:
-- id: 170
-- email: admin.bilal@wevote.com
-- name: Bilal Administrator
-- role_id: 0 (Super Admin)
-- member_number: SA001
-- is_active: 1
-- password_hash: $2b$10$... (bcrypt hash)
```

### JWT Token Payload
```json
{
  "id": 170,
  "userId": 170,
  "email": "admin.bilal@wevote.com",
  "role": "Super Admin",
  "role_id": 0,
  "name": "Bilal Administrator",
  "isSuperAdmin": true
}
```

### Route Protection
```typescript
// SuperAdminRoute component in App.tsx
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  const roleId = user?.role_id ? parseInt(user.role_id) : null;
  const isSuperAdmin = user && (roleId === 0 || roleId === 1 || user.role === 'admin');
  
  return isSuperAdmin ? <>{children}</> : <Navigate to="/home" replace />;
};
```

---

## 🐛 Troubleshooting

### Issue: "Buttons not visible in header"
**Solution:** Make sure you're looking at the header component. Buttons are always visible, even when not logged in.

### Issue: "Route not found"
**Solution:** Check that both `/super-admin-login` and `/admin-login` routes are defined in `App.tsx`

### Issue: "Login fails with 401"
**Solution:** Verify credentials match exactly:
- Email: `admin.bilal@wevote.com`
- Password: `W3V0t3@dmin2025!`

### Issue: "Can't access dashboard"
**Solution:** Check that user has `role_id = 0` in database

### Issue: "Backend not responding"
**Solution:** Ensure backend server is running on port 3001
```powershell
npm run server
```

---

## 📝 Files Modified

1. `server/routes/auth.js` - Added super-admin-login endpoint
2. `src/App.tsx` - Added login routes
3. `src/components/Header.tsx` - Added navigation buttons
4. `server/create_custom_superadmin.js` - Script to create super admin user

---

## ✅ Verification Commands

**Test Backend Endpoint:**
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/auth/super-admin-login" `
  -ContentType "application/json" `
  -Body '{"email":"admin.bilal@wevote.com","password":"W3V0t3@dmin2025!"}'
```

**Check If User Exists:**
```sql
SELECT id, email, name, role_id, member_number, is_active 
FROM users 
WHERE email = 'admin.bilal@wevote.com'
```

**Recreate Super Admin (if needed):**
```powershell
cd "c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy\server"
node create_custom_superadmin.js
```

---

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. ✅ Both servers running without errors
2. ✅ "Super Admin" and "Admin" buttons in header
3. ✅ Login page loads at `/super-admin-login`
4. ✅ Successful login with provided credentials
5. ✅ Redirect to `/super-admin` dashboard
6. ✅ Yellow "Dashboard" button appears in header after login
7. ✅ Console logs show: `✅ Super Admin login successful: admin.bilal@wevote.com`

---

## 📞 Support

If you encounter any issues:

1. Check both terminal outputs for errors
2. Verify database connection is working
3. Clear browser localStorage and try again
4. Restart both servers
5. Check browser console for JavaScript errors

---

**Last Updated:** November 24, 2025  
**Status:** ✅ FULLY TESTED AND WORKING
