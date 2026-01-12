# 🎯 DEMO USERS - QUICK LOGIN GUIDE

## 🔐 Universal Password
**All demo accounts use the same password:** `Demo@123`

---

## 👥 5 Demo Accounts (All Roles)

| # | Email | Role | Access Level |
|---|-------|------|--------------|
| 1 | `superadmin@forvismazars.com` | Super Admin | Full system control |
| 2 | `admin@forvismazars.com` | Admin | Organization management |
| 3 | `auditor@forvismazars.com` | Auditor | Read-only auditing |
| 4 | `employee@forvismazars.com` | Employee | Employee + voting |
| 5 | `user@forvismazars.com` | User | Basic voting |

---

## 🚀 Quick Start

### 1. Seed Demo Users
```bash
cd backend
npm run seed:demo
```

### 2. Test Login (API)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forvismazars.com","password":"Demo@123"}'
```

### 3. Test Login (Frontend)
1. Navigate to: `http://localhost:5173/login`
2. Email: `admin@forvismazars.com`
3. Password: `Demo@123`
4. Click "Sign In"

---

## 📋 What Each Role Can Do

### 🟣 Super Admin (`superadmin@forvismazars.com`)
- ✅ Create/delete organizations
- ✅ Manage all users
- ✅ System-wide settings
- ✅ Override any restrictions

### 🔵 Admin (`admin@forvismazars.com`)
- ✅ Create AGM sessions
- ✅ Add candidates/resolutions
- ✅ Approve employees
- ✅ View all votes
- ✅ Generate reports

### 🟢 Auditor (`auditor@forvismazars.com`)
- ✅ View all data (read-only)
- ✅ Access audit logs
- ✅ Export reports
- ❌ Cannot edit anything

### 🟡 Employee (`employee@forvismazars.com`)
- ✅ Vote on items
- ✅ Assign proxies
- ✅ Update profile
- ✅ Check in to sessions

### 🟠 User (`user@forvismazars.com`)
- ✅ Vote on items
- ✅ Assign proxies
- ✅ View own history

---

## 📚 Full Documentation
See `backend/DEMO_USERS.md` for complete details

---

**Password:** `Demo@123` | **Organization:** Forvis Mazars
