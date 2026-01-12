# 🔐 Demo Users - Quick Reference

**Password for ALL users:** `Demo@123`

---

## 👥 Available Demo Accounts

### 1. Super Administrator
- **Email:** `superadmin@forvismazars.com`
- **Password:** `Demo@123`
- **Role:** `super_admin`
- **Access Level:** Full system access
- **Permissions:**
  - ✅ Create/delete organizations
  - ✅ Manage all users across organizations
  - ✅ Configure system-wide settings
  - ✅ Access all audit logs
  - ✅ Override any restrictions
  - ✅ Manage vote allocations
  - ✅ Delete any data

### 2. Administrator
- **Email:** `admin@forvismazars.com`
- **Password:** `Demo@123`
- **Role:** `admin`
- **Access Level:** Organization administrator
- **Permissions:**
  - ✅ Create/manage AGM sessions
  - ✅ Add/edit candidates and resolutions
  - ✅ Approve employee registrations
  - ✅ Manage proxies
  - ✅ View all votes and results
  - ✅ Generate reports
  - ✅ Send WhatsApp notifications
  - ❌ Cannot delete organizations
  - ❌ Cannot manage super admin users

### 3. Auditor
- **Email:** `auditor@forvismazars.com`
- **Password:** `Demo@123`
- **Role:** `auditor`
- **Access Level:** Read-only auditor
- **Permissions:**
  - ✅ View all users and employees
  - ✅ View all votes and results
  - ✅ Access audit logs
  - ✅ View session statistics
  - ✅ View proxy assignments
  - ✅ Export data for auditing
  - ❌ Cannot create/edit anything
  - ❌ Cannot vote
  - ❌ Cannot manage users

### 4. Employee
- **Email:** `employee@forvismazars.com`
- **Password:** `Demo@123`
- **Role:** `employee`
- **Access Level:** Employee with voting rights
- **Permissions:**
  - ✅ Vote on candidates
  - ✅ Vote on resolutions
  - ✅ Assign proxies
  - ✅ View own voting history
  - ✅ Update own profile
  - ✅ Check in to sessions
  - ❌ Cannot view other users' votes
  - ❌ Cannot manage sessions

### 5. Regular User (Voter)
- **Email:** `user@forvismazars.com`
- **Password:** `Demo@123`
- **Role:** `user`
- **Access Level:** Basic voting privileges
- **Permissions:**
  - ✅ Vote on candidates
  - ✅ Vote on resolutions
  - ✅ Assign proxies
  - ✅ View own voting history
  - ✅ Update own profile
  - ❌ Cannot access admin features
  - ❌ Cannot view other users' data

---

## 🧪 Additional Test Users

### Proxy Holder (for testing proxy voting)
- **Email:** `proxy.holder@forvismazars.com`
- **Password:** `Demo@123`
- **Role:** `employee`
- **Purpose:** Test proxy assignment and voting as proxy

### Additional Voters
- **Email:** `voter1@forvismazars.com` / **Password:** `Demo@123`
- **Email:** `voter2@forvismazars.com` / **Password:** `Demo@123`
- **Role:** `user`
- **Purpose:** Test multi-user voting scenarios

---

## 🚀 How to Create Demo Users

### Option 1: Run Seeder Script (Recommended)
```bash
cd backend
node scripts/seed-demo-users.js
```

**Expected Output:**
```
🌱 Starting demo users seeding...
🔐 Hashing password...
✅ Password hashed successfully
🏢 Checking for organization...
✅ Organization exists
👥 Creating demo users...

✅ Created: superadmin@forvismazars.com
   Name: Super Administrator
   Role: SUPER_ADMIN
   Full system access - can manage everything

... (all users created) ...

✅ DEMO USERS SEEDING COMPLETE!
```

### Option 2: Manual SQL Insert
1. Generate bcrypt hash for password `Demo@123`:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = await bcrypt.hash('Demo@123', 12);
   console.log(hash);
   ```

2. Run the SQL script:
   ```bash
   # Edit backend/scripts/demo-users.sql
   # Replace $2b$12$HASH_HERE with actual bcrypt hash
   # Execute in Azure Data Studio or SQL Server Management Studio
   ```

---

## 🔑 Testing Login Flow

### Test Super Admin Access
```bash
# Login via API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@forvismazars.com",
    "password": "Demo@123"
  }'

# Expected Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "superadmin@forvismazars.com",
    "firstName": "Super",
    "lastName": "Administrator",
    "role": "super_admin",
    "organizationId": 1
  }
}
```

### Test in Frontend
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Navigate to: `http://localhost:5173/login`
4. Enter credentials:
   - Email: `superadmin@forvismazars.com`
   - Password: `Demo@123`
5. Click "Sign In"
6. Should redirect to dashboard with full admin access

---

## 🧪 Test Scenarios by Role

### Scenario 1: Admin Creates AGM Session
1. Login as `admin@forvismazars.com`
2. Navigate to Admin Dashboard
3. Create new AGM session
4. Add candidates and resolutions
5. Start session timer
6. Set vote allocations

### Scenario 2: User Votes with Proxy
1. Login as `user@forvismazars.com`
2. Assign proxy to `proxy.holder@forvismazars.com`
3. Logout and login as `proxy.holder@forvismazars.com`
4. Vote using proxy weight
5. Verify vote weight calculation

### Scenario 3: Auditor Reviews Results
1. Login as `auditor@forvismazars.com`
2. Navigate to Admin Dashboard (read-only)
3. View all votes and results
4. Export audit reports
5. Verify cannot edit anything

### Scenario 4: Employee Registration
1. Login as `employee@forvismazars.com`
2. Register employee profile
3. Logout and login as `admin@forvismazars.com`
4. Approve employee registration
5. Verify employee can now access features

---

## 🔒 Security Notes

- ⚠️ **Demo users are for TESTING ONLY**
- ⚠️ **Change passwords in production**
- ⚠️ **Delete demo users before production deployment**
- ⚠️ **Never commit real passwords to repository**
- ⚠️ **Use strong passwords in production (12+ characters, mixed case, numbers, symbols)**

---

## 🗑️ Removing Demo Users

```sql
-- Delete all demo users
DELETE FROM Users WHERE Email LIKE '%@forvismazars.com';

-- Or delete specific demo users
DELETE FROM Users WHERE Email IN (
  'superadmin@forvismazars.com',
  'admin@forvismazars.com',
  'auditor@forvismazars.com',
  'employee@forvismazars.com',
  'user@forvismazars.com',
  'proxy.holder@forvismazars.com',
  'voter1@forvismazars.com',
  'voter2@forvismazars.com'
);
```

---

## 📊 Role Comparison Matrix

| Feature | Super Admin | Admin | Auditor | Employee | User |
|---------|------------|-------|---------|----------|------|
| **Login** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Vote** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Assign Proxy** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **View Own Votes** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Create Session** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Add Candidates** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View All Votes** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Approve Employees** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Set Vote Allocations** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Organizations** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Delete Users** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Access Audit Logs** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Export Reports** | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🎯 Quick Command Reference

```bash
# Seed demo users
cd backend
node scripts/seed-demo-users.js

# Check if users exist
# (Run in Azure Data Studio)
SELECT Email, FirstName, LastName, Role, IsActive 
FROM Users 
WHERE Email LIKE '%@forvismazars.com'
ORDER BY Role;

# Test login via API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forvismazars.com","password":"Demo@123"}'
```

---

**Last Updated:** December 8, 2025  
**Status:** ✅ Ready for use  
**Password:** `Demo@123` (for all demo accounts)
