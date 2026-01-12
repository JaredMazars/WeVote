# How to Start WeVote Servers

## Quick Start (Recommended)

### Option 1: Using PowerShell Scripts
```powershell
# Start Backend
.\start-backend.ps1

# Start Frontend (in a new terminal)
npm run dev
```

### Option 2: Using NPM Scripts
```powershell
# Start Backend
npm run start:backend

# Start Frontend (in a new terminal)
npm run dev
```

### Option 3: Start Both Together
```powershell
npm run dev:all
```

## Manual Start (If needed)

### Backend
```powershell
cd backend
npm start
```

### Frontend
```powershell
npm run dev
```

## Common Issues

### Error: Cannot find module 'C:\Projects\Discovery\WeVote\src\server.js'
**Cause**: Running `node src/server.js` from the wrong directory

**Solutions**:
1. Use the provided scripts: `npm run start:backend` or `.\start-backend.ps1`
2. If running manually, always `cd backend` first, then `npm start`
3. Never run `node src/server.js` from the root project directory

### Rate Limiting Error: "Too many requests"
**Solution**: Restart the backend server to reset the rate limiter

## Server URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## Test Credentials

- **Voter**: voter@forvismazars.com / Voter@2026
- **Admin**: admin@forvismazars.com / Admin@2026
- **Super Admin**: super.admin@forvismazars.com / SuperAdmin@2026
- **Auditor**: auditor@forvismazars.com / Auditor@2026
