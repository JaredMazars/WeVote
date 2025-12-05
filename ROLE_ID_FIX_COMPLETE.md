# Role ID Fix - Complete

## Issue
The `user.role_id` was showing as `undefined` in the Header component, causing the Super Admin and Admin buttons to not display correctly.

## Root Cause
1. The `/api/auth/login` endpoint was not including `role_id` in the `userData` response object
2. The `/api/auth/admin-login` route didn't exist, even though the Header was trying to navigate to it

## Changes Made

### 1. Fixed `/api/auth/login` Route
**File:** `server/routes/auth.js`

Added `role_id` to the userData response:
```javascript
const userData = {
  id: user.id,
  email: user.email,
  name: user.name,
  surname: user.surname,
  membership_number: user.member_number,
  member_number: user.member_number,
  id_number: user.id_number,
  avatar: user.avatar_url,
  role: user.role_name?.toLowerCase() || 'voter',
  role_id: user.role_id,  // ✅ ADDED
  email_verified: user.email_verified,
  is_temp_password: user.is_temp_password,
  needs_password_change: user.needs_password_change
};
```

### 2. Created `/api/auth/admin-login` Route
**File:** `server/routes/auth.js`

Added a new admin login route that:
- Validates email and password
- Checks if user has `role_id` of 0 (Super Admin) or 1 (Admin)
- Returns 403 error if user doesn't have admin privileges
- Includes `role_id` in the response
- Logs admin login events

```javascript
router.post('/admin-login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  // ... validates credentials
  
  // Check if user is admin (role_id = 0 or 1)
  if (user.role_id !== 0 && user.role_id !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  // ... returns userData with role_id
});
```

### 3. Updated Header Component
**File:** `src/components/Header.tsx`

Fixed the button visibility logic:
```tsx
{/* Super Admin Login Button - Only for role_id 0 */}
{user.role_id === '0' && (
  <motion.button onClick={() => navigate('/super-admin-login')}>
    <Crown className="h-4 w-4" />
    <span>Super Admin</span>
  </motion.button>
)}

{/* Admin Login Button - Only for role_id 0 or 1 */}
{(user.role_id === '0' || user.role_id === '1') && (
  <motion.button onClick={() => navigate('/admin-login')}>
    <Shield className="h-4 w-4" />
    <span>Admin</span>
  </motion.button>
)}
```

## Button Visibility Rules

| Role ID | Role Name    | Super Admin Button | Admin Button |
|---------|--------------|-------------------|--------------|
| 0       | Super Admin  | ✅ Visible        | ✅ Visible   |
| 1       | Admin        | ❌ Hidden         | ✅ Visible   |
| 2+      | Other Roles  | ❌ Hidden         | ❌ Hidden    |

## Testing

### Test Case 1: Super Admin (role_id = 0)
1. Login with super admin credentials
2. ✅ Should see both "Super Admin" and "Admin" buttons
3. ✅ Can click "Super Admin" → navigates to `/super-admin-login`
4. ✅ Can click "Admin" → navigates to `/admin-login`

### Test Case 2: Admin (role_id = 1)
1. Login with admin credentials
2. ❌ Should NOT see "Super Admin" button
3. ✅ Should see "Admin" button
4. ✅ Can click "Admin" → navigates to `/admin-login`

### Test Case 3: Regular User (role_id = 2+)
1. Login with regular user credentials
2. ❌ Should NOT see "Super Admin" button
3. ❌ Should NOT see "Admin" button

## API Endpoints

### POST `/api/auth/login`
- Used for all user types
- Returns `role_id` in response
- No role restrictions

### POST `/api/auth/admin-login`
- Used for admin dashboard access
- Requires `role_id` = 0 or 1
- Returns 403 if not admin

### POST `/api/auth/super-admin-login`
- Used for super admin dashboard access
- Requires `role_id` = 0 only
- Returns 403 if not super admin

## Server Status
✅ Server restarted successfully
✅ All routes registered
✅ Database connected
✅ Running on port 3001

## Next Steps
1. Test login with your super admin account (role_id = 0)
2. Verify `user.role_id` is no longer undefined
3. Confirm both buttons are visible for super admin
4. Test navigation to both admin and super admin pages
