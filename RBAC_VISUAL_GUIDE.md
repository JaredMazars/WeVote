# WeVote - Role-Based Access Visual Guide

## 🎭 User Roles & Access Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEVOTE ACCESS CONTROL                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  👑 SUPER ADMIN  │  ← FULL SYSTEM ACCESS
│  Level: 10/10    │
└────────┬─────────┘
         │
         ├─ ✅ Super Admin Dashboard (Create AGM Sessions)
         ├─ ✅ Admin Dashboard (Employee Management)
         ├─ ✅ Auditor Portal (View All Audits)
         ├─ ✅ All User Features (Voting, Proxy, etc.)
         └─ ✅ Can Access EVERYTHING
         
┌──────────────────┐
│   🛡️ ADMIN       │  ← ADMINISTRATIVE ACCESS
│   Level: 7/10    │
└────────┬─────────┘
         │
         ├─ ✅ Admin Dashboard
         ├─ ✅ Employee Management
         ├─ ✅ Registration Approvals
         ├─ ✅ Reports & Analytics
         ├─ ✅ All User Features
         ├─ ❌ Super Admin Dashboard
         └─ ❌ Auditor Portal

┌──────────────────┐
│   🔍 AUDITOR     │  ← READ-ONLY OVERSIGHT
│   Level: 5/10    │
└────────┬─────────┘
         │
         ├─ ✅ Auditor Portal
         ├─ ✅ View All Votes (Read-Only)
         ├─ ✅ Generate Audit Reports
         ├─ ✅ All User Features
         ├─ ❌ Super Admin Dashboard
         └─ ❌ Admin Dashboard

┌──────────────────┐
│  👤 EMPLOYEE     │  ← STANDARD VOTING ACCESS
│  Level: 3/10     │
└────────┬─────────┘
         │
         ├─ ✅ Vote on Candidates
         ├─ ✅ Vote on Resolutions
         ├─ ✅ Assign Proxies
         ├─ ✅ View Profile
         ├─ ✅ Live Q&A
         ├─ ❌ Any Admin Features
         └─ ❌ Any Auditor Features
```

## 🗺️ Navigation Bar by Role

### Regular User (employee)
```
┌────────────────────────────────────────────────────────────┐
│ 🏠 WeVote                                         👤 John  │
├────────────────────────────────────────────────────────────┤
│  🎉 Features  │  🗳️ Voting  │  👥 Proxy  │  🔔  │  Logout │
└────────────────────────────────────────────────────────────┘
```

### Admin
```
┌────────────────────────────────────────────────────────────────┐
│ 🏠 WeVote                                            👤 Admin  │
├────────────────────────────────────────────────────────────────┤
│  🎉 Features  │  🗳️ Voting  │  👥 Proxy  │  🛡️ Admin  │  🔔  │
└────────────────────────────────────────────────────────────────┘
```

### Auditor
```
┌────────────────────────────────────────────────────────────────┐
│ 🏠 WeVote                                          👤 Auditor  │
├────────────────────────────────────────────────────────────────┤
│  🎉 Features  │  🗳️ Voting  │  👥 Proxy  │  🔍 Auditor  │  🔔  │
└────────────────────────────────────────────────────────────────┘
```

### Super Admin
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🏠 WeVote                                         👤 Super Admin     │
├──────────────────────────────────────────────────────────────────────┤
│  🎉 Features  │  🗳️ Voting  │  👥 Proxy  │  🛡️ Admin  │  👑 Super  │
│                                        Admin  │  🔍 Auditor  │  🔔  │
└──────────────────────────────────────────────────────────────────────┘
```

## 🚪 Route Access Table

| Route                    | Employee | Admin | Auditor | Super Admin |
|--------------------------|----------|-------|---------|-------------|
| `/home`                  | ✅       | ✅    | ✅      | ✅          |
| `/voting`                | ✅       | ✅    | ✅      | ✅          |
| `/voting/candidates`     | ✅       | ✅    | ✅      | ✅          |
| `/voting/resolutions`    | ✅       | ✅    | ✅      | ✅          |
| `/proxy-assignment`      | ✅       | ✅    | ✅      | ✅          |
| `/profile`               | ✅       | ✅    | ✅      | ✅          |
| `/demo`                  | ✅       | ✅    | ✅      | ✅          |
| `/qa`                    | ✅       | ✅    | ✅      | ✅          |
| `/notifications`         | ✅       | ✅    | ✅      | ✅          |
| `/admin`                 | ❌       | ✅    | ❌      | ✅          |
| `/admin/approvals`       | ❌       | ✅    | ❌      | ✅          |
| `/admin-manage`          | ❌       | ✅    | ❌      | ✅          |
| `/superadmin`            | ❌       | ❌    | ❌      | ✅          |
| `/auditor`               | ❌       | ❌    | ✅      | ✅          |

## 🔐 Security Flow

```
┌──────────────┐
│ User Visits  │
│    Route     │
└──────┬───────┘
       │
       v
┌──────────────┐
│ Is User      │──── NO ──→ Redirect to /login
│ Logged In?   │
└──────┬───────┘
       │ YES
       v
┌──────────────┐
│ Route Has    │──── NO ──→ Allow Access ✅
│ Role Rules?  │
└──────┬───────┘
       │ YES
       v
┌──────────────┐
│ Is User      │──── YES ──→ Allow Access ✅
│ Super Admin? │
└──────┬───────┘
       │ NO
       v
┌──────────────┐
│ Does User's  │──── YES ──→ Allow Access ✅
│ Role Match?  │
└──────┬───────┘
       │ NO
       v
┌──────────────┐
│ Redirect to  │
│    /home     │
└──────────────┘
```

## 📱 Super Admin Dashboard Features

```
┌──────────────────────────────────────────────────────────────────┐
│            👑 SUPER ADMIN CONTROL PANEL 👑                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │ 📅 Sessions │  👥 Admins  │ 🎯 Allocate │ ⚙️ Limits   │    │
│  │  (Create    │  (View All) │ (Per-User)  │ (Per-AGM)   │    │
│  │   AGMs)     │             │             │             │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
│                                                                  │
│  🔹 Create Multiple AGM Sessions                                │
│     ├─ Q1 Shareholder Meeting (Min: 1, Max: 500, Default: 100) │
│     ├─ Annual Employee Recognition (Min: 1, Max: 10, Def: 3)   │
│     └─ Special Board Meeting (Min: 1, Max: 1, Default: 1)      │
│                                                                  │
│  🔹 Assign Admins to Sessions                                   │
│     ├─ Admin A → Q1 Meeting, Annual Meeting                    │
│     └─ Admin B → Special Meeting                               │
│                                                                  │
│  🔹 Set Vote Allocations Per User Per Session                   │
│     ├─ John Doe: 500 votes in Q1 (owns 500 shares)            │
│     ├─ Jane Smith: 3 votes in Annual (standard employee)       │
│     └─ Board Member: 1 vote in Special Meeting                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 🎯 Quick Reference

### Login Credentials:
- **Super Admin**: `superadmin@wevote.com` / `super123`
- **Admin**: `admin@wevote.com` / `admin123`
- **Auditor**: `auditor@wevote.com` / `audit123`
- **Demo User**: `demo@wevote.com` / `demo123`

### Navigation Shortcuts:
- **Super Admin** → blue gradient button in navbar
- **Admin** → Shield icon in navbar
- **Auditor** → Shield icon in navbar (different from admin)
- **User** → No admin buttons visible

### Key Features by Role:
| Feature                    | Who Can Access?           |
|----------------------------|---------------------------|
| Create AGM Sessions        | Super Admin only          |
| Set Per-Session Limits     | Super Admin only          |
| Manage Employees           | Admin + Super Admin       |
| Audit All Votes            | Auditor + Super Admin     |
| Vote on Candidates         | Everyone (authenticated)  |
| Assign Proxy               | Everyone (authenticated)  |

---

**💡 Pro Tip**: Super admins can test all user experiences by having full access to every part of the platform!
