# 🗄️ Database Connection Configuration Guide

## 📋 Environment Variables Setup

Your `.env` file should include these database connection variables:

```bash
# =====================================================
# Azure SQL Database Configuration
# =====================================================

# ODBC Driver (for Windows)
DB_DRIVER=ODBC Driver 17 for SQL Server

# Server Details
DB_SERVER=your-server.database.windows.net
DB_PORT=1433

# Database Name (use either DB_NAME or DB_DATABASE)
DB_NAME=WeVoteDB
DB_DATABASE=WeVoteDB

# Authentication
DB_USER=your-username
DB_PASSWORD=your-strong-password

# Security Settings
DB_ENCRYPT=yes
DB_TRUST_SERVER_CERTIFICATE=no

# Timeouts (in seconds)
DB_CONNECTION_TIMEOUT=30

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_REQUEST_TIMEOUT=30000
```

---

## 🔧 Configuration Options Explained

### 1. **DB_DRIVER** (Optional)
- **Default:** `msnodesqlv8` (built-in)
- **Windows:** `ODBC Driver 17 for SQL Server` or `ODBC Driver 18 for SQL Server`
- **Purpose:** Specifies which SQL Server driver to use

**Available ODBC Drivers:**
- ODBC Driver 18 for SQL Server (latest)
- ODBC Driver 17 for SQL Server
- ODBC Driver 13.1 for SQL Server
- ODBC Driver 13 for SQL Server
- ODBC Driver 11 for SQL Server

**Check installed drivers:**
```powershell
# Windows
Get-OdbcDriver | Where-Object {$_.Name -like "*SQL Server*"}

# Or check in Registry
reg query "HKLM\SOFTWARE\ODBC\ODBCINST.INI"
```

### 2. **DB_SERVER**
- **Format:** `your-server.database.windows.net`
- **Azure SQL:** Full server name from Azure Portal
- **Local SQL Server:** `localhost` or `127.0.0.1` or `.\SQLEXPRESS`

### 3. **DB_PORT**
- **Default:** `1433`
- **Azure SQL:** Always 1433
- **Local SQL Server:** Check SQL Server Configuration Manager

### 4. **DB_NAME / DB_DATABASE**
- **Either one works** (config supports both)
- **Value:** Your database name (e.g., `WeVoteDB`)

### 5. **DB_USER**
- **Azure SQL:** SQL authentication username
- **Format:** `username@servername` or just `username`

### 6. **DB_PASSWORD**
- Your database password
- **Tip:** Use strong passwords with mixed case, numbers, and symbols

### 7. **DB_ENCRYPT**
- **Values:** `yes`, `true`, `1` (all enable encryption)
- **Azure SQL:** Must be `yes`
- **Local SQL Server:** Can be `no` for development

### 8. **DB_TRUST_SERVER_CERTIFICATE**
- **Values:** `yes`, `no`, `true`, `false`
- **Azure SQL:** Should be `no`
- **Local SQL Server:** Can be `yes` for development

### 9. **DB_CONNECTION_TIMEOUT**
- **Default:** 30 seconds
- **Purpose:** How long to wait when establishing connection

---

## 🚀 Setup Instructions

### Step 1: Copy Environment Template
```bash
cd backend
copy .env.example .env
```

### Step 2: Get Azure SQL Details

**From Azure Portal:**
1. Go to your Azure SQL Database
2. Click "Connection strings"
3. Copy the ADO.NET connection string

**Example Connection String:**
```
Server=tcp:wevote-server.database.windows.net,1433;
Initial Catalog=WeVoteDB;
Persist Security Info=False;
User ID=sqladmin;
Password={your_password};
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

**Extract Values:**
- **DB_SERVER:** `wevote-server.database.windows.net`
- **DB_PORT:** `1433`
- **DB_NAME:** `WeVoteDB`
- **DB_USER:** `sqladmin`
- **DB_PASSWORD:** (your password)

### Step 3: Update .env File

```bash
# Azure SQL Configuration
DB_DRIVER=ODBC Driver 17 for SQL Server
DB_SERVER=wevote-server.database.windows.net
DB_PORT=1433
DB_NAME=WeVoteDB
DB_DATABASE=WeVoteDB
DB_USER=sqladmin
DB_PASSWORD=YourStrongPassword123!
DB_ENCRYPT=yes
DB_TRUST_SERVER_CERTIFICATE=no
DB_CONNECTION_TIMEOUT=30
```

### Step 4: Test Connection
```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Database connection pool established
Server running on port 3001
```

---

## 🐛 Troubleshooting

### Issue 1: "Login failed for user"
**Solution:**
- Verify username and password are correct
- Check if user has access to the database
- Ensure firewall rules allow your IP address

**Fix firewall in Azure:**
```bash
# Azure CLI
az sql server firewall-rule create \
  --resource-group YourResourceGroup \
  --server wevote-server \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### Issue 2: "Cannot open database"
**Solution:**
- Verify database name is correct
- Check if database exists
- Ensure user has permission to access database

```sql
-- Check if database exists
SELECT name FROM sys.databases WHERE name = 'WeVoteDB';

-- Grant access
USE WeVoteDB;
CREATE USER [sqladmin] FOR LOGIN [sqladmin];
ALTER ROLE db_owner ADD MEMBER [sqladmin];
```

### Issue 3: "ConnectionError: Failed to connect"
**Solution:**
- Check if DB_SERVER is correct
- Verify port 1433 is open
- Test connection with Azure Data Studio or SSMS

### Issue 4: "ODBC Driver not found"
**Solution:**
- Install ODBC Driver 17 or 18
- Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

**Install on Windows:**
```powershell
# Download and install ODBC Driver 18
# https://go.microsoft.com/fwlink/?linkid=2223304
```

### Issue 5: SSL/TLS Certificate Error
**Solution:**
- Set `DB_ENCRYPT=yes` and `DB_TRUST_SERVER_CERTIFICATE=no` for Azure
- For local development with self-signed certs: `DB_TRUST_SERVER_CERTIFICATE=yes`

---

## 🔒 Security Best Practices

### 1. Never Commit .env File
```bash
# .gitignore should contain:
.env
.env.local
.env.*.local
```

### 2. Use Strong Passwords
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid common words

### 3. Rotate Credentials Regularly
- Change passwords every 90 days
- Use Azure Key Vault for production

### 4. Limit Database Access
- Create dedicated user for application
- Grant only necessary permissions
- Don't use admin account in production

```sql
-- Create application user
CREATE LOGIN wevote_app WITH PASSWORD = 'StrongPassword123!';
USE WeVoteDB;
CREATE USER wevote_app FOR LOGIN wevote_app;

-- Grant permissions
ALTER ROLE db_datareader ADD MEMBER wevote_app;
ALTER ROLE db_datawriter ADD MEMBER wevote_app;
GRANT EXECUTE TO wevote_app;
```

---

## 📊 Connection String Formats

### Format 1: Current Format (Recommended)
```bash
DB_SERVER=server.database.windows.net
DB_NAME=WeVoteDB
DB_USER=username
DB_PASSWORD=password
DB_ENCRYPT=yes
```

### Format 2: Connection String (Alternative)
```bash
DATABASE_URL=Server=tcp:server.database.windows.net,1433;Database=WeVoteDB;User Id=username;Password=password;Encrypt=yes;
```

### Format 3: Local SQL Server
```bash
DB_SERVER=localhost
DB_NAME=WeVoteDB
DB_USER=sa
DB_PASSWORD=YourSAPassword
DB_ENCRYPT=no
DB_TRUST_SERVER_CERTIFICATE=yes
```

---

## 🧪 Testing Connection

### Test 1: Via Node.js Script
```javascript
// test-connection.js
require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'yes',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes'
  }
};

sql.connect(config)
  .then(pool => {
    console.log('✅ Connected to database!');
    return pool.request().query('SELECT @@VERSION');
  })
  .then(result => {
    console.log('Database version:', result.recordset[0]);
    sql.close();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err);
  });
```

**Run test:**
```bash
node test-connection.js
```

### Test 2: Via Backend Health Check
```bash
# Start backend
npm run dev

# Test health endpoint
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T...",
  "database": "connected"
}
```

---

## 📝 Quick Reference

| Variable | Azure SQL | Local SQL Server |
|----------|-----------|------------------|
| **DB_DRIVER** | ODBC Driver 17 | ODBC Driver 17 |
| **DB_SERVER** | xxx.database.windows.net | localhost |
| **DB_PORT** | 1433 | 1433 |
| **DB_NAME** | WeVoteDB | WeVoteDB |
| **DB_ENCRYPT** | yes | no (dev) |
| **DB_TRUST_SERVER_CERTIFICATE** | no | yes (dev) |

---

## 🔗 Useful Links

- [Azure SQL Documentation](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [ODBC Driver Download](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
- [mssql npm Package](https://www.npmjs.com/package/mssql)
- [Connection Troubleshooting](https://learn.microsoft.com/en-us/azure/azure-sql/database/troubleshoot-common-errors-issues)

---

**Last Updated:** December 8, 2025  
**Status:** ✅ Configuration updated with ODBC Driver support
