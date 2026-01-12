# 🚀 WeVote - Start Commands

## Quick Start (Choose One)

### 🎯 Option 1: Run Everything (Recommended)
```bash
npm run dev:all
```
**Starts:** Frontend (5173) + Backend (3001) together

---

### 🎨 Option 2: Frontend Only
```bash
npm run dev
```
**Starts:** React app on http://localhost:5173

---

### ⚙️ Option 3: Backend Only
```bash
npm run server
```
**Starts:** API server on http://localhost:3001

---

## 🔑 Login Credentials

**All users use password:** `Demo@123`

| Email | Role |
|-------|------|
| `admin@forvismazars.com` | Admin |
| `superadmin@forvismazars.com` | Super Admin |
| `user@forvismazars.com` | Regular User |
| `auditor@forvismazars.com` | Auditor |
| `employee@forvismazars.com` | Employee |

---

## 🔗 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

---

## 📋 Available Commands

```bash
npm run dev              # Start frontend only
npm run dev:frontend     # Start frontend only (same as above)
npm run dev:backend      # Start backend only
npm run dev:all          # Start both frontend + backend
npm run server           # Start backend only (alternative)
npm run build            # Build frontend for production
```

### Backend Commands (from backend folder)
```bash
cd backend
npm run dev              # Start backend with auto-restart
npm start                # Start backend (production mode)
npm run seed:demo        # Re-seed demo users
```

---

## ✅ What's Already Setup

- ✅ Database schema (24 tables) created on Azure SQL
- ✅ 8 demo users seeded
- ✅ Backend API (96 endpoints) ready
- ✅ Frontend React app configured
- ✅ Authentication working
- ✅ CORS configured

---

## 🎯 First Time Setup

1. **Install dependencies (if not done)**
   ```bash
   npm install
   cd backend
   npm install
   cd ..
   ```

2. **Start the app**
   ```bash
   npm run dev:all
   ```

3. **Open browser**
   - Go to: http://localhost:5173/login
   - Email: `admin@forvismazars.com`
   - Password: `Demo@123`

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
cd backend
node test-connection.js  # Test database connection
```

### Need to re-seed users?
```bash
cd backend
npm run seed:demo
```

### Clear and restart?
```bash
# Stop all servers (Ctrl+C)
# Then restart:
npm run dev:all
```

---

## 🎉 You're Ready!

Just run:
```bash
npm run dev:all
```

Then login at: **http://localhost:5173/login**
