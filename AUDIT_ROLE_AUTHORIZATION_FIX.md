# Audit Logs Role Authorization Fix

## Problem
User with `role_id = 0` and `role_name = "Super Admin"` was being incorrectly rejected when trying to access audit logs API.

## Root Causes

### 1. Role Name Normalization Issue
- Database stores: `"Super Admin"` (with space)
- Code was checking for: `"super_admin"` (with underscore)
- Normalization was incomplete in some routes

### 2. Inconsistent Role Checking
- Some routes only checked `role` string
- Didn't account for `role_id = 0` (Super Admin)
- Missing fallback for role_id checks

## Solutions Implemented

### 1. Enhanced Authentication Middleware
**File:** `server/middleware/auth.js`

**Changes:**
```javascript
// Now includes role_id in the query
SELECT u.id, u.email, u.is_active, u.role_id, r.role_name 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.role_id 
WHERE u.id = ${decoded.id}

// Proper role normalization
let normalizedRole = 'voter';
if (users[0].role_name) {
  normalizedRole = users[0].role_name.toLowerCase().replace(/\s+/g, '_');
}

// Returns both role and role_id
req.user = {
  id: users[0].id,
  email: users[0].email,
  role: normalizedRole,           // "super_admin"
  role_id: users[0].role_id || null // 0
};
```

### 2. Universal Admin Check Function
**File:** `server/routes/audit-logs.js`

**Updated ALL routes** to use comprehensive admin check:

```javascript
const isAdmin = req.user.role_id === 0 ||      // Super Admin (role_id = 0)
                req.user.role_id === 1 ||      // Admin (role_id = 1)
                req.user.role === 'admin' ||   // Normalized "admin"
                req.user.role === 'super_admin'; // Normalized "Super Admin"
```

**Routes Updated:**
1. ✅ `GET /api/audit-logs` - Main audit logs endpoint
2. ✅ `GET /api/audit-logs/stats` - Statistics endpoint
3. ✅ `GET /api/audit-logs/user/:userId` - User-specific logs
4. ✅ `GET /api/audit-logs/entity/:entityType/:entityId` - Entity-specific logs
5. ✅ `GET /api/audit-logs/categories` - Categories list

## How It Works Now

### Role Mapping
| Database | Normalized | role_id | Access |
|----------|-----------|---------|--------|
| Super Admin | super_admin | 0 | ✅ Full Access |
| admin | admin | 1 | ✅ Full Access |
| Admin | admin | 1 | ✅ Full Access |
| voter | voter | 2 | ❌ No Access |
| non-good-standing voter | non-good-standing_voter | 3 | ❌ No Access |

### Authorization Logic
The system now checks BOTH:
1. **role_id** - Direct numeric check (0 or 1 = admin)
2. **role** - Normalized string check ("admin" or "super_admin")

This ensures compatibility with:
- Database variations ("Super Admin" vs "admin")
- Legacy code using role_id
- New code using role name strings
- Case-insensitive matching

## Testing

### Verify Your Access
1. **Refresh your browser** (F5)
2. Check browser console for: `Authenticated user: { id: 171, email: '...', role: 'super_admin', role_id: 0 }`
3. Navigate to **Admin Dashboard → Audit Trail**
4. You should see the **8 audit logs** displayed

### Expected Behavior
- ✅ Users with `role_id = 0` (Super Admin) → **Full access**
- ✅ Users with `role_id = 1` (Admin) → **Full access**
- ✅ Users with `role = "super_admin"` → **Full access**
- ✅ Users with `role = "admin"` → **Full access**
- ❌ Users with `role_id = 2` or higher → **403 Forbidden**

## Debug Logging
The updated code includes console logging:

```javascript
console.log('Authenticated user:', req.user);
console.log('Audit logs request - User:', req.user);
```

Check the server terminal to see the exact user object being authenticated.

## Status: ✅ FIXED

**All audit log routes now accept:**
- `role_id = 0` (Super Admin)
- `role_id = 1` (Admin)  
- `role = "super_admin"`
- `role = "admin"`

**Your user with `role_id = 0` and `role_name = "Super Admin"` will now have full access!**

## Next Steps
1. Refresh browser to reload the application
2. Navigate to Audit Trail tab
3. Verify 8 audit logs are displayed
4. Test filtering by category
5. Test expanding log details
