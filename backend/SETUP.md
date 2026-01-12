# WeVote Backend - Setup Guide

## 🎯 Quick Start

### Step 1: Create .env file
```bash
cp .env.example .env
```

### Step 2: Configure Azure SQL Database

1. **Get your Azure SQL credentials** from Azure Portal:
   - Server name: `your-server.database.windows.net`
   - Database name: `WeVoteDB`
   - Admin username
   - Admin password

2. **Update .env file** with your credentials:
```env
DB_SERVER=your-server.database.windows.net
DB_DATABASE=WeVoteDB
DB_USER=your-admin-username
DB_PASSWORD=your-secure-password
```

3. **Generate a secure JWT secret:**
```bash
# On PowerShell:
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Add the generated string to .env:
```env
JWT_SECRET=your-generated-secret-here
```

### Step 3: Execute Database Schema

1. Open **Azure Data Studio** or **SQL Server Management Studio**

2. Connect to your Azure SQL Database

3. Open the file: `../database/schema.sql`

4. Execute the entire script

5. Verify tables were created:
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

You should see 40 tables created.

### Step 4: Update Super Admin Password

After running schema.sql, update the super admin password:

```sql
-- This is a sample - you'll need to hash the password properly
-- The schema includes placeholder values

-- Or you can register through the API after starting the server
```

### Step 5: Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on http://localhost:3001

### Step 6: Test the API

1. **Health Check:**
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

2. **Login Test:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@wevote.com","password":"super123"}'
```

Expected: JWT token in response

3. **Get Sessions (with token):**
```bash
curl http://localhost:3001/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Troubleshooting

### Database Connection Failed

**Error:** `Login failed for user`

**Solution:**
1. Check firewall rules in Azure Portal
2. Add your IP address to allowed IPs
3. Verify credentials in .env file

### Port Already in Use

**Error:** `EADDRINUSE`

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <process_id> /F
```

### JWT Token Invalid

**Error:** `Invalid or expired token`

**Solution:**
1. Check JWT_SECRET in .env matches
2. Token might be expired (default 24h)
3. Login again to get new token

## 📋 Next Steps

1. **Frontend Integration:**
   - Update frontend API_BASE_URL to `http://localhost:3001/api`
   - Replace localStorage calls with API calls
   - Implement token storage and refresh

2. **Deploy to Production:**
   - Set NODE_ENV=production
   - Use strong JWT_SECRET
   - Enable HTTPS
   - Configure rate limiting
   - Set up monitoring

3. **Test All Endpoints:**
   - Run test suite: `npm test`
   - Test authentication flow
   - Test voting operations
   - Test role-based access

## 🚀 Production Checklist

- [ ] Change all default passwords
- [ ] Generate secure JWT_SECRET
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure monitoring/alerts
- [ ] Review rate limiting settings
- [ ] Enable audit logging
- [ ] Test disaster recovery
- [ ] Document API endpoints

## 📞 Support

If you encounter issues:
1. Check logs in `logs/error.log`
2. Review database connection settings
3. Verify Azure SQL firewall rules
4. Check server logs for detailed errors

---

**Ready to connect your frontend!** 🎉
