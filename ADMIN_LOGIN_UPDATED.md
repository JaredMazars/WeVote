# 🔐 Admin Login Credentials - Updated

## Current Admin Passwords (as of Jan 13, 2026)

### Admin Accounts

1. **admin@wevote.com**
   - Password: `Admin123!`
   - Role: Admin
   - Use this to access the Admin Dashboard

2. **superadmin@wevote.com**
   - Password: `SuperAdmin123!`
   - Role: Super Admin
   - Full system access

3. **admin@forvismazars.com**
   - Password: `Admin123!`
   - Role: Admin

4. **superadmin@forvismazars.com**
   - Password: `SuperAdmin123!`
   - Role: Super Admin

## Login Steps

1. Navigate to: http://localhost:5173/admin/login
2. Enter email: `admin@wevote.com`
3. Enter password: `Admin123!`
4. Click "Sign In"

## Testing Approvals Dashboard

After login:
1. Go to Admin Dashboard
2. Click on "Approvals" or navigate to: http://localhost:5173/admin/approvals
3. You should see:
   - **6 pending user registrations**
   - **4 pending proxy assignments**

## Test Page

For direct API testing without the React app:
- Open: `test-admin-approvals.html` in a browser
- Click "Login" button
- Then click "Fetch Pending Users" and "Fetch Pending Proxies"

## Troubleshooting

If the approvals page shows "No data found":
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed API calls
4. Verify you're logged in with the correct credentials
5. Check localStorage has a valid token (Application tab > Local Storage)

## Reset Passwords

If you need to reset all admin passwords again:
```bash
cd backend
node reset-passwords.js
```
