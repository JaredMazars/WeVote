# 🔐 WeVote - Complete User List & Login Credentials

## ✅ All Users Fixed - Password Updated

**Universal Password for ALL users:** `Demo@123`

---

## 👥 Complete User List (11 Users)

### Original Users (from schema)
These were created with the initial schema and had non-bcrypt password hashes.
**Now fixed with bcrypt hashing!**

| Email | Name | Role | User ID | Status |
|-------|------|------|---------|--------|
| `superadmin@wevote.com` | Super Admin | Super Admin | 1 | ✅ Active |
| `admin@wevote.com` | Admin User | Admin | 2 | ✅ Active |
| `auditor@wevote.com` | Auditor User | Auditor | 3 | ✅ Active |

---

### Demo Users (from seed script)
These were created with proper bcrypt hashing from the start.

| Email | Name | Role | User ID | Status |
|-------|------|------|---------|--------|
| `superadmin@forvismazars.com` | Super Administrator | Super Admin | 4 | ✅ Active |
| `admin@forvismazars.com` | John Administrator | Admin | 5 | ✅ Active |
| `auditor@forvismazars.com` | Sarah Auditor | Auditor | 6 | ✅ Active |
| `employee@forvismazars.com` | Michael Employee | Employee | 7 | ✅ Active |
| `user@forvismazars.com` | Jane User | User | 8 | ✅ Active |
| `proxy.holder@forvismazars.com` | Robert Proxy | Employee | 9 | ✅ Active |
| `voter1@forvismazars.com` | Emily Voter | User | 10 | ✅ Active |
| `voter2@forvismazars.com` | David Smith | User | 11 | ✅ Active |

---

## 🔑 Quick Login Examples

### Super Admin Access
```
Email: superadmin@forvismazars.com
Password: Demo@123
```
OR
```
Email: superadmin@wevote.com
Password: Demo@123
```

### Admin Access
```
Email: admin@forvismazars.com
Password: Demo@123
```
OR
```
Email: admin@wevote.com
Password: Demo@123
```

### Auditor Access (Read-Only)
```
Email: auditor@forvismazars.com
Password: Demo@123
```

### Regular User
```
Email: user@forvismazars.com
Password: Demo@123
```

### Employee
```
Email: employee@forvismazars.com
Password: Demo@123
```

---

## 🔐 Password Security Details

- **Algorithm**: bcrypt with 12 rounds
- **Hash Format**: `$2b$12$...` (60 characters)
- **Salt**: Handled internally by bcrypt
- **Password**: `Demo@123` for all users (development only)

⚠️ **Important**: Change all passwords before production deployment!

---

## 🛠️ Maintenance Scripts

### Check & Fix User Passwords
If any users have incorrect password hashes, run:
```bash
cd backend
npm run fix:passwords
```

This script will:
- ✅ Check all users for proper bcrypt password hashes
- ✅ Identify users with incorrect/missing hashes
- ✅ Update them with properly hashed `Demo@123` password
- ✅ Show complete user list with status

### Re-seed Demo Users
To add the demo users again (won't duplicate):
```bash
cd backend
npm run seed:demo
```

---

## 📊 User Statistics

- **Total Users**: 11
- **Super Admins**: 2
- **Admins**: 2
- **Auditors**: 2
- **Employees**: 2
- **Regular Users**: 3
- **All Active**: ✅
- **All Email Verified**: ✅
- **All Passwords**: Demo@123 (bcrypt hashed)

---

## 🎯 Role Capabilities

### Super Admin (`super_admin`)
- Full system access
- Manage all organizations
- System-wide settings
- User management across all orgs

### Admin (`admin`)
- Organization management
- User management (within org)
- Session creation and management
- Vote configuration
- Full voting access

### Auditor (`auditor`)
- **Read-only** access to all data
- View sessions, votes, users
- Generate reports
- Cannot modify anything

### Employee (`employee`)
- Vote in sessions
- Manage own profile
- Can be assigned as proxy holder
- View session results

### User (`user`)
- Vote in sessions (if allocated votes)
- View own voting history
- Update profile
- Assign proxy votes

---

## ✅ Verification

All 11 users are now verified to have:
- ✅ Proper bcrypt password hash (starts with `$2b$12$`)
- ✅ Password: `Demo@123`
- ✅ Active status: `true`
- ✅ Email verified: `true`
- ✅ Valid organization assignment

You can now login with **any** of these accounts using `Demo@123`!

---

## 🚀 Quick Test

1. **Start the app**: `npm run dev:all` (from root)
2. **Open**: http://localhost:5173/login
3. **Login with**:
   - Email: `admin@forvismazars.com`
   - Password: `Demo@123`
4. **Success!** You should be redirected to dashboard

---

## 📝 Notes

- The original 3 users (`@wevote.com`) were from the database schema's sample data
- The 8 demo users (`@forvismazars.com`) were added by the seeding script
- All 11 users now use the same password: `Demo@123`
- Password hashing is consistent (bcrypt with 12 rounds)
- All users belong to Organization ID: 1 (Forvis Mazars)

---

**Last Updated**: December 8, 2025
**Password Hash Algorithm**: bcrypt (12 rounds)
**Universal Password**: `Demo@123`
