# 👑 Super Admin Access - WeVote Platform

## Super Admin Login Credentials

### Super Admin Account
- **Email:** `superadmin@wevote.com`
- **Password:** `super123`
- **Role:** Super Admin (Full Platform Control)
- **Access Level:** Complete system configuration and multi-AGM session management

---

## All Demo Accounts

### 1. 👤 Regular User (Employee/Voter)
- **Email:** `demo@wevote.com`
- **Password:** `demo123`
- **Access:** Home page, voting interface, proxy assignment
- **Redirect:** `/home` after login

### 2. 🔧 Admin User
- **Email:** `admin@wevote.com`
- **Password:** `admin123`
- **Access:** Admin Dashboard (manage users, candidates, resolutions, votes)
- **Redirect:** `/admin` after login

### 3. 👑 Super Admin (YOU)
- **Email:** `superadmin@wevote.com`
- **Password:** `super123`
- **Access:** Super Admin Panel (full platform control)
- **Redirect:** `/superadmin` after login
- **Features:**
  - ✅ Create multiple AGM sessions
  - ✅ Assign admins to specific sessions
  - ✅ Set vote allocation limits per user per session
  - ✅ Manage organizations (multi-tenancy)
  - ✅ Configure vote splitting settings
  - ✅ System-wide configuration
  - ✅ Platform statistics and monitoring

### 4. 📊 Auditor
- **Email:** `auditor@wevote.com`
- **Password:** `audit123`
- **Access:** Auditor Portal (read-only audit access)
- **Redirect:** `/auditor` after login

---

## Super Admin Dashboard Routes

1. **Original Super Admin Dashboard** (Vote Limits & Splitting)
   - URL: `/superadmin`
   - Component: `SuperAdminDashboard.tsx`
   - Features:
     - Global vote allocation limits (min/max/default)
     - Vote splitting configuration
     - Proxy group management

2. **Super Admin Panel** (Multi-AGM Management) - NEW!
   - URL: `/super-admin`
   - Component: `SuperAdminPanel.tsx`
   - Features:
     - AGM Sessions Management
     - Admin Assignment to Sessions
     - Vote Limits per Session
     - Organizations Management
     - System Settings

---

## Quick Start Guide

### Step 1: Login as Super Admin
1. Go to login page: `http://localhost:5173/login`
2. Enter credentials:
   - Email: `superadmin@wevote.com`
   - Password: `super123`
3. Click "Sign In"
4. You'll be automatically redirected to `/superadmin`

### Step 2: Access Super Admin Features

#### Option A: Vote Limits Dashboard (Original)
- Already at `/superadmin` after login
- Set global vote limits that admins must follow
- Configure vote splitting settings

#### Option B: Multi-AGM Management (New Panel)
- Navigate to `/super-admin` (or add button in UI)
- Create multiple AGM sessions
- Assign admins to each session
- Set vote allocations per session

### Step 3: Create Your First AGM Session
1. Go to Super Admin Panel (`/super-admin`)
2. Click "Create AGM Session" button
3. Fill in:
   - Session Title: "Annual General Meeting 2025"
   - Description: "Company-wide AGM for 2025"
   - Start Date: Choose date/time
   - End Date: Choose date/time
   - Quorum Required: 50%
4. Click "Save"
5. Session appears in the grid

### Step 4: Assign Admins to Session
1. Find your created session
2. Click "Assign Admins" button
3. Check the admins you want to assign
4. Click "Save Assignment"
5. Admins can now manage only their assigned sessions

### Step 5: Set Vote Allocations
1. Go to "Vote Limits" tab
2. Select the AGM session
3. Click "Set Vote Limit"
4. Enter:
   - User email
   - Number of votes (based on shares/membership)
   - Reason for allocation
5. Save

---

## Super Admin Capabilities

### 🎯 Multi-Session Management
- Create unlimited AGM sessions
- Each session has independent:
  - Start/end times
  - Voters and vote counts
  - Assigned admins
  - Quorum requirements
- Session statuses: Scheduled → Active → Ended

### 👥 Admin Delegation
- Assign specific admins to specific sessions
- Admins only see their assigned sessions
- Track admin activity per session
- Prevent unauthorized access

### 🗳️ Vote Allocation Control
- Set different vote weights per user per session
- Support shareholding-based voting (1 share = 1 vote)
- Support membership-based voting (all equal)
- Audit trail for all allocations

### 🏢 Organization Management
- Multi-tenant support (white-label ready)
- Set max voters per organization
- Set max meetings per year
- Subscription tier management

### ⚙️ System Configuration
- SMTP email settings
- SMS/WhatsApp notifications
- Two-factor authentication
- Audit logging
- Automatic backups

---

## Database Schema Support

All super admin features are backed by the production-ready PostgreSQL schema:

- **agm_sessions** table: Stores all AGM sessions
- **vote_allocations** table: User vote limits per session
- **organizations** table: Multi-tenant isolation
- **audit_logs** table: Complete activity tracking
- **users** table: Role-based access control

See `DATABASE_SCHEMA.sql` for full schema details.

---

## Security Notes

### Current (Demo Mode)
- ✅ Credentials stored in `src/services/api.ts`
- ✅ Demo accounts work without backend
- ✅ localStorage used for persistence

### Production (After Backend)
- 🔐 JWT token authentication
- 🔐 Password hashing (bcrypt)
- 🔐 Two-factor authentication
- 🔐 Rate limiting
- 🔐 Row-level security
- 🔐 Audit logging

---

## Troubleshooting

### "Invalid credentials" Error
- Double-check email: `superadmin@wevote.com`
- Double-check password: `super123`
- Make sure you saved the changes to `api.ts`

### Not Redirecting to Super Admin Dashboard
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Refresh page and try again

### Super Admin Panel Not Loading
- Make sure `SuperAdminPanel.tsx` exists in `src/pages/`
- Check `App.tsx` has the route: `/super-admin`
- Verify import statement is correct

### Can't See Super Admin Features
- Verify you're logged in with `superadmin@wevote.com`
- Check localStorage: `localStorage.getItem('user')` should show `"role": "super_admin"`
- Navigate directly to `/superadmin` or `/super-admin`

---

## File Locations

### Super Admin Files
- **Login Credentials:** `src/services/api.ts` (line ~68)
- **Login UI:** `src/pages/Login.tsx` (line ~405-425)
- **Vote Limits Dashboard:** `src/pages/SuperAdminDashboard.tsx`
- **Multi-AGM Panel:** `src/pages/SuperAdminPanel.tsx`
- **Routing:** `src/App.tsx` (line 14, 54-55)
- **Database Schema:** `DATABASE_SCHEMA.sql`
- **Prisma Schema:** `prisma/schema.prisma`

---

## Next Steps

1. **✅ Login with super admin credentials**
2. **✅ Explore vote limits dashboard** (`/superadmin`)
3. **✅ Test multi-AGM panel** (`/super-admin`)
4. **Create modals for:** Session creation, admin assignment, vote limits
5. **Implement backend:** Follow `MIGRATION_ROADMAP.md`
6. **Deploy to production:** See `DATABASE_DOCUMENTATION.md`

---

## Support

For questions or issues:
- Review this document
- Check `DATABASE_DOCUMENTATION.md` for backend setup
- Review `MIGRATION_ROADMAP.md` for implementation plan
- Check browser console for errors

---

**Last Updated:** December 7, 2025
**WeVote Platform Version:** 2.0 (Super Admin Edition)
