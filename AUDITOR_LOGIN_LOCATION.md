# 🔍 Where to Find Auditor Login on the Login Page

## 📍 **Location:** http://localhost:5173/login

---

## 🎯 **VISUAL GUIDE:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                          WeVote Login Page                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │   ┌──────────────────┐  ┌──────────────────┐                │ │
│  │   │  👤 User Login   │  │ 🛡️ Auditor Login │  ← CLICK HERE │ │
│  │   └──────────────────┘  └──────────────────┘                │ │
│  │                                                               │ │
│  │   ┌─────────────────────────────────────────────────────┐   │ │
│  │   │  🎯 Demo Credentials (No Backend Required)          │   │ │
│  │   ├─────────────────────────────────────────────────────┤   │ │
│  │   │                                                     │   │ │
│  │   │  WHEN "User Login" TAB IS ACTIVE:                  │   │ │
│  │   │  ┌───────────────────────────────────────────────┐ │   │ │
│  │   │  │ Regular User:                                 │ │   │ │
│  │   │  │ Email: demo@wevote.com                        │ │   │ │
│  │   │  │ Password: demo123                             │ │   │ │
│  │   │  └───────────────────────────────────────────────┘ │   │ │
│  │   │  ┌───────────────────────────────────────────────┐ │   │ │
│  │   │  │ Admin User:                                   │ │   │ │
│  │   │  │ Email: admin@wevote.com                       │ │   │ │
│  │   │  │ Password: admin123                            │ │   │ │
│  │   │  └───────────────────────────────────────────────┘ │   │ │
│  │   │                                                     │   │ │
│  │   │  WHEN "Auditor Login" TAB IS ACTIVE:               │   │ │
│  │   │  ┌───────────────────────────────────────────────┐ │   │ │
│  │   │  │ Auditor User:                                 │ │   │ │
│  │   │  │ Email: auditor@wevote.com                     │ │   │ │
│  │   │  │ Password: audit123                            │ │   │ │
│  │   │  │ 🔒 Read-only access to audit portal           │ │   │ │
│  │   │  └───────────────────────────────────────────────┘ │   │ │
│  │   │                                                     │   │ │
│  │   │  💡 These work without a backend server!           │   │ │
│  │   └─────────────────────────────────────────────────────┘   │ │
│  │                                                               │ │
│  │   Email Address                                               │ │
│  │   ┌───────────────────────────────────────────────────────┐ │ │
│  │   │ 📧 Enter your email                                   │ │ │
│  │   └───────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │   Password                                                    │ │
│  │   ┌───────────────────────────────────────────────────────┐ │ │
│  │   │ 🔒 Enter your password                                │ │ │
│  │   └───────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │   ┌───────────────────────────────────────────────────────┐ │ │
│  │   │              [Login Button]                           │ │ │
│  │   └───────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 **ALL LOGIN CREDENTIALS IN ONE PLACE:**

### **👤 User Login Tab (Default):**

**Regular User:**
- **Email:** `demo@wevote.com`
- **Password:** `demo123`
- **Access:** Home dashboard, voting, proxy assignment

**Admin User:**
- **Email:** `admin@wevote.com`
- **Password:** `admin123`
- **Access:** Admin dashboard (7 tabs), full system control

---

### **🛡️ Auditor Login Tab:**

**Auditor User:**
- **Email:** `auditor@wevote.com`
- **Password:** `audit123`
- **Access:** Read-only audit portal
- **Features:**
  - Tamper-evident logs
  - Live attendance monitoring
  - Excel exports
  - Quorum tracking

---

## 🎬 **HOW TO ACCESS:**

### **Step 1: Go to Login Page**
```
http://localhost:5173/login
```

### **Step 2A: Regular/Admin Login**
1. ✅ Default "User Login" tab is already selected
2. See credentials box showing:
   - Regular User: demo@wevote.com / demo123
   - Admin User: admin@wevote.com / admin123
3. Enter credentials
4. Click "Login"

### **Step 2B: Auditor Login**
1. ✅ Click the "🛡️ Auditor Login" tab
2. See credentials box showing:
   - Auditor User: auditor@wevote.com / audit123
3. Enter credentials
4. Click "Login"
5. ✅ Redirected to `/auditor` portal

---

## 🖼️ **SCREENSHOTS OF WHAT YOU'LL SEE:**

### **View 1: User Login Tab (Default)**
```
┌─────────────────────────────────────────┐
│  [👤 User Login]  [ Auditor Login ]     │ ← Active tab (blue)
├─────────────────────────────────────────┤
│  🎯 Demo Credentials                    │
│  ┌───────────────────────────────────┐  │
│  │ Regular User:                     │  │
│  │ Email: demo@wevote.com            │  │ ← VISIBLE
│  │ Password: demo123                 │  │
│  ├───────────────────────────────────┤  │
│  │ Admin User:                       │  │
│  │ Email: admin@wevote.com           │  │ ← VISIBLE
│  │ Password: admin123                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### **View 2: Auditor Login Tab (Click to see)**
```
┌─────────────────────────────────────────┐
│  [ User Login ]  [🛡️ Auditor Login]    │ ← Active tab (blue)
├─────────────────────────────────────────┤
│  🎯 Demo Credentials                    │
│  ┌───────────────────────────────────┐  │
│  │ Auditor User:                     │  │
│  │ Email: auditor@wevote.com         │  │ ← VISIBLE
│  │ Password: audit123                │  │
│  │ 🔒 Read-only access               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔄 **SWITCHING BETWEEN TABS:**

```typescript
// When you click "User Login":
- Shows: demo@wevote.com & admin@wevote.com credentials
- Hides: auditor@wevote.com credentials

// When you click "Auditor Login":
- Hides: demo@wevote.com & admin@wevote.com credentials
- Shows: auditor@wevote.com credentials
```

---

## 📊 **CREDENTIAL SUMMARY TABLE:**

| Role | Email | Password | Access | Portal |
|------|-------|----------|--------|--------|
| **Regular User** | demo@wevote.com | demo123 | Voting, Proxy | /home |
| **Admin User** | admin@wevote.com | admin123 | Full Admin | /admin |
| **Auditor** | auditor@wevote.com | audit123 | Read-only Audit | /auditor |

---

## ✅ **CODE LOCATION:**

The credentials display logic is in:
**File:** `src/pages/Login.tsx`
**Lines:** 395-423

```tsx
{!isAuditorLogin ? (
  <>
    {/* Regular User Credentials */}
    <div className="bg-white rounded-lg p-2 border border-blue-200">
      <p className="font-semibold text-blue-800">Regular User:</p>
      <p className="text-gray-700">Email: <code>demo@wevote.com</code></p>
      <p className="text-gray-700">Password: <code>demo123</code></p>
    </div>
    
    {/* Admin User Credentials */}
    <div className="bg-white rounded-lg p-2 border border-blue-200">
      <p className="font-semibold text-blue-800">Admin User:</p>
      <p className="text-gray-700">Email: <code>admin@wevote.com</code></p>
      <p className="text-gray-700">Password: <code>admin123</code></p>
    </div>
  </>
) : (
  /* Auditor Credentials */
  <div className="bg-white rounded-lg p-2 border border-green-200">
    <p className="font-semibold text-green-800">Auditor User:</p>
    <p className="text-gray-700">Email: <code>auditor@wevote.com</code></p>
    <p className="text-gray-700">Password: <code>audit123</code></p>
    <p className="text-xs text-green-600 mt-1">🔒 Read-only access</p>
  </div>
)}
```

---

## 🎯 **TESTING GUIDE:**

### **Test All 3 Logins:**

```bash
# 1. Regular User Login
http://localhost:5173/login
→ Tab: "User Login" (default)
→ Credentials shown: demo@wevote.com / demo123
→ Login → Redirects to /home

# 2. Admin Login
http://localhost:5173/login
→ Tab: "User Login" (default)
→ Credentials shown: admin@wevote.com / admin123
→ Login → Redirects to /admin

# 3. Auditor Login
http://localhost:5173/login
→ Click: "Auditor Login" tab
→ Credentials shown: auditor@wevote.com / audit123
→ Login → Redirects to /auditor
```

---

## ✅ **SUMMARY:**

**The auditor login credentials appear in the same blue box as the regular/admin credentials, but only when you click the "Auditor Login" tab!**

**Location Flow:**
1. Go to `/login`
2. Look for the tabs at the top of the form
3. Click "🛡️ Auditor Login" tab
4. The credentials box automatically updates to show:
   - **Email:** auditor@wevote.com
   - **Password:** audit123

**That's it!** 🎉 The credentials dynamically change based on which tab you select.
