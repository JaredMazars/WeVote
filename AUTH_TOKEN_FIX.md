# Authentication Token Fix

## Problem
The Super Admin Dashboard was getting "Access token required" errors because fetch requests weren't including the authentication token in headers.

## Solution
Added `Authorization: Bearer ${token}` header to all fetch requests in SuperAdminDashboard.tsx.

## Changes Made

### File: `src/pages/SuperAdminDashboard.tsx`

**Before:**
```typescript
const response = await fetch('http://localhost:3001/api/superadmin/vote-splitting-settings');
```

**After:**
```typescript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3001/api/superadmin/vote-splitting-settings', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Functions Fixed:
1. ✅ `fetchVoteSplittingSettings()` - GET request
2. ✅ `fetchSuperAdminUsers()` - GET request  
3. ✅ `handleSaveVoteSplitting()` - PUT request
4. ✅ `handleUpdateProxyGroupLimits()` - PUT request

## How It Works

### Token Flow:
```
1. User logs in → AuthContext.login()
   ↓
2. Token saved to localStorage.setItem('token', jwt_token)
   ↓
3. SuperAdminDashboard fetches token: localStorage.getItem('token')
   ↓
4. Token sent in headers: Authorization: Bearer ${token}
   ↓
5. Backend validates token in requireSuperAdmin middleware
   ↓
6. Request proceeds if valid
```

### Backend Validation (superadmin.js):
```javascript
const requireSuperAdmin = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details and check role
    const user = await database.query(`
      SELECT u.id, u.email, u.role_id, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ${decoded.id}
    `);

    req.user = user[0];
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid access token'
    });
  }
};
```

## Testing

### 1. Login as Super Admin
```
Email: jaredmoodley1212@gmail.com
Password: Admin@1234
```

### 2. Navigate to Super Admin Dashboard
```
/super-admin
```

### 3. Check Browser Console
Should see:
- ✅ No "Access token required" errors
- ✅ Successfully fetching vote splitting settings
- ✅ Successfully fetching user roles

### 4. Test Functionality
- View vote splitting settings
- Update min/max individual votes
- Save settings
- Should see "Vote splitting settings saved successfully"

## Related Files

### Frontend
- `src/pages/SuperAdminDashboard.tsx` - Fixed fetch calls
- `src/contexts/AuthContext.tsx` - Stores token in localStorage
- `src/services/api.ts` - ApiService for authenticated requests

### Backend
- `server/routes/superadmin.js` - Token validation middleware
- `server/models/VoteSplittingSettings.js` - Settings model

## Token Storage

### Where token is stored:
- **Location**: `localStorage.getItem('token')`
- **Format**: JWT string (e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
- **Set by**: AuthContext.login() after successful authentication
- **Cleared by**: AuthContext.logout() when user logs out

### How to check token in browser:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('token')`
4. Press Enter
5. Should show JWT token string

## Common Issues & Solutions

### Issue: "Access token required"
**Cause**: Token not being sent in headers  
**Solution**: ✅ Fixed - All fetch calls now include Authorization header

### Issue: "Invalid access token"
**Cause**: Token expired or malformed  
**Solution**: Log out and log back in to get fresh token

### Issue: "Super admin access required"
**Cause**: User role_id is not 0 or 1  
**Solution**: Run fix-user-role endpoint or update in database:
```sql
UPDATE users SET role_id = 0 WHERE email = 'your-email@example.com'
```

### Issue: Token in localStorage but still getting 401
**Cause**: Token might be null or undefined  
**Solution**: Check if user is actually logged in, localStorage.getItem('token') returns string, not null

## Security Notes

### JWT Token Contains:
- User ID
- Email
- Role information
- Expiration time (exp)
- Issued at time (iat)

### Token Expiration:
- Default: 24 hours (configurable in JWT_SECRET env)
- After expiration, user must log in again
- Frontend should handle 401/403 responses by redirecting to login

### Best Practices:
- ✅ Token sent in Authorization header (not URL)
- ✅ Token validated on every protected route
- ✅ HTTPS recommended for production (prevents token interception)
- ✅ Token stored in localStorage (accessible by JavaScript)
- ⚠️ Consider httpOnly cookies for enhanced security in production

## Next Steps

1. ✅ Test Super Admin Dashboard with authentication
2. ✅ Verify vote splitting settings can be saved
3. ✅ Test regular Admin Dashboard user limits feature
4. ⏳ Run SQL migration (add_user_vote_weights.sql)
5. ⏳ Test full flow: Super Admin → Admin → User
