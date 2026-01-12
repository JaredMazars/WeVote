# 🔐 WeVote - Admin Access Guide

## Super Admin & Admin Login Credentials

---

## 👨‍💼 Admin User (Regular Admin)

### Login Credentials
```
Email:    admin@wevote.com
Password: admin123
```

### Access Level
- ✅ Admin Dashboard (`/admin`)
- ✅ Super Admin Dashboard (`/superadmin`) - Demo mode allows access
- ✅ Admin Approvals (`/admin/approvals`)
- ✅ Assign votes to users (within super admin limits)
- ✅ Manage candidates, resolutions, proxies
- ✅ View analytics and audit logs
- ✅ Approve/reject user registrations
- ✅ Approve/reject proxy assignments

### Role ID
- `role_id: 1` (Regular Admin)

---

## 👑 Super Admin User

### Current Status
⚠️ **No dedicated super admin demo account yet**

### Workaround for Demo/Testing
Use the regular admin account and navigate directly to:
```
http://localhost:5174/superadmin
```

The demo doesn't enforce strict role separation, so `admin@wevote.com` can access both dashboards.

---

## 🆕 Creating a Super Admin Account (Production)

### Option 1: Add to Demo Credentials
Edit `src/services/api.ts` (around line 37):

```typescript
// Add this before the admin@wevote.com check
if (email === 'superadmin@wevote.com' && password === 'super123') {
  return {
    success: true,
    data: {
      id: 'super-admin-1',
      name: 'Super Admin',
      email: 'superadmin@wevote.com',
      role: 'admin' as const,
      role_id: 0,  // Super Admin role
      email_verified: 1,
      needs_password_change: 0,
      is_temp_password: 0
    }
  };
}
```

**Then use:**
```
Email:    superadmin@wevote.com
Password: super123
```

### Option 2: Database Setup (Backend Required)
When you have a backend API running:

1. **Create user in database:**
```sql
INSERT INTO users (name, email, password_hash, role_id, email_verified)
VALUES ('Super Admin', 'superadmin@company.com', '$2b$10$...', 0, 1);
```

2. **Role IDs:**
- `0` = Super Admin
- `1` = Regular Admin
- `2` = Regular User

---

## 📋 Regular User

### Login Credentials
```
Email:    demo@wevote.com
Password: demo123
```

### Access Level
- ✅ Home page (`/home`)
- ✅ Voting pages (`/voting`, `/voting/candidates`, `/voting/resolutions`)
- ✅ Proxy assignment (`/proxy-assignment`, `/proxy-form`)
- ✅ Employee registration (`/employee-register`)
- ❌ Admin dashboard (no access)
- ❌ Super admin dashboard (no access)
- ❌ Approvals (no access)

### Role ID
- `role_id: 2` (Regular User)

---

## 🗺️ Dashboard Routes

### Public Routes
```
/login              - Login page
/home               - Home page (after login)
/employee-register  - Employee registration
```

### User Routes (role_id: 2)
```
/voting                    - Voting selection
/voting/candidates         - Candidate voting
/voting/resolutions        - Resolution voting
/proxy-assignment          - Proxy assignment
/proxy-form                - Proxy appointment form
```

### Admin Routes (role_id: 1)
```
/admin                     - Admin dashboard
/admin/approvals           - User/proxy approvals
```

### Super Admin Routes (role_id: 0)
```
/superadmin                - Super admin dashboard
                            - Set global vote limits
                            - Manage system settings
```

---

## 🎯 What Each Role Can Do

### Regular User (role_id: 2)
- Cast votes for candidates
- Cast votes for resolutions
- Assign proxies to vote on their behalf
- View their voting history
- See their voting status
- Register as employee

### Regular Admin (role_id: 1)
- **Everything Regular User can do, PLUS:**
- View all users in system
- Approve/reject user registrations
- Approve/reject proxy assignments
- Assign votes to users (within limits set by super admin)
- Edit existing vote assignments
- View system analytics
- Access audit logs
- Manage candidates and resolutions

### Super Admin (role_id: 0)
- **Everything Regular Admin can do, PLUS:**
- Set minimum votes per user (global limit)
- Set maximum votes per user (global limit)
- Set default votes per user (recommended value)
- Configure vote splitting settings
- Manage proxy group limits
- System-wide configuration
- Full administrative access

---

## 🔄 Vote Assignment Hierarchy

```
Super Admin (role_id: 0)
    ↓
Sets Global Limits
    ↓ (e.g., Min: 1, Max: 10, Default: 3)
Regular Admin (role_id: 1)
    ↓
Assigns Votes to Users
    ↓ (Must be within 1-10 range)
Regular Users (role_id: 2)
    ↓
Cast Votes
```

**Example:**
1. Super Admin sets: Min=1, Max=10, Default=3
2. Regular Admin assigns: User A gets 5 votes, User B gets 8 votes
3. Users cast their assigned votes for candidates/resolutions

---

## 🚀 Quick Start Testing

### Test Super Admin Workflow
1. Login: `admin@wevote.com` / `admin123`
2. Navigate: `http://localhost:5174/superadmin`
3. Set Limits: Min=1, Max=10, Default=3
4. Click "Save Vote Limits"
5. Verify success message

### Test Regular Admin Workflow
1. Login: `admin@wevote.com` / `admin123`
2. Navigate: `http://localhost:5174/admin`
3. Go to "Users" tab
4. Click "Assign Votes" on a user
5. Try assigning 5 votes (within limits)
6. Verify table updates

### Test Regular User Workflow
1. Login: `demo@wevote.com` / `demo123`
2. Navigate: `http://localhost:5174/voting/candidates`
3. See your voting status bar in bottom-left
4. Cast votes for candidates
5. Check vote history in status bar

---

## 📱 Demo Credentials Display

The login page shows demo credentials in a highlighted box:

```
🎯 Demo Credentials (No Backend Required)

Regular User:
Email: demo@wevote.com
Password: demo123

Admin User:
Email: admin@wevote.com
Password: admin123
```

These work immediately without any backend server!

---

## 🔒 Security Notes

### Demo Mode
- Credentials are hardcoded in `src/services/api.ts`
- No actual authentication happens
- Perfect for testing without backend
- **Remove before production deployment**

### Production Mode
- Use proper JWT authentication
- Hash passwords with bcrypt
- Validate role_id on backend
- Implement refresh tokens
- Add session timeout
- Enable HTTPS
- Use environment variables for secrets

---

## 📞 Troubleshooting

### Can't Access Super Admin Dashboard
1. Check you're logged in as admin
2. Verify URL: `http://localhost:5174/superadmin`
3. Check browser console for errors
4. Clear localStorage and re-login

### Vote Assignment Not Working
1. Verify super admin has set vote limits
2. Check localStorage for 'voteLimits' key:
   ```javascript
   localStorage.getItem('voteLimits')
   ```
3. Ensure you're within min/max boundaries
4. Check AdminDashboard console logs

### Login Fails
1. Verify exact credentials (case-sensitive)
2. Check if backend is required but not running
3. Clear browser cache and cookies
4. Try incognito/private window

---

## 🎓 Best Practices

### For Development
- Use demo credentials for quick testing
- Test all three role types
- Verify role-based access control
- Check localStorage data

### For Production
1. Create dedicated super admin users
2. Use strong passwords (16+ characters)
3. Enable 2FA for admin accounts
4. Audit admin actions regularly
5. Rotate passwords quarterly
6. Limit super admin accounts to 2-3 people

---

## 📊 Account Summary

| Email | Password | Role | role_id | Access |
|-------|----------|------|---------|--------|
| demo@wevote.com | demo123 | User | 2 | Voting, Proxy |
| admin@wevote.com | admin123 | Admin | 1 | Admin Dashboard, Approvals |
| superadmin@wevote.com* | super123* | Super Admin | 0 | All Dashboards |

*\*Not yet created in demo - use admin account to access /superadmin*

---

## 🔮 Future Enhancements

- [ ] Role-based route guards
- [ ] Permission matrix per role
- [ ] Custom roles with specific permissions
- [ ] Multi-factor authentication
- [ ] Session management
- [ ] IP whitelisting for admin access
- [ ] Admin activity audit trail
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts

---

**Built for WeVote Platform**  
*Secure, scalable, democratic decision-making*

Last Updated: December 2025
