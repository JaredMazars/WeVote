# ⚠️ IMPORTANT: Azure Storage Configuration Required

## 🔴 ACTION REQUIRED

To use Azure Blob Storage for PDF uploads, you need to add your Azure Storage credentials.

---

## Option 1: Using Connection String (RECOMMENDED) ⭐

Add this to your `.env` file:

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT_NAME;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net
```

**Where to get this:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Storage Account
3. Click "Access keys" in the left menu
4. Click "Show keys"
5. Copy the "Connection string" under key1

---

## Option 2: Using Account Name + Key

Add these to your `.env` file:

```env
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
```

**Where to get these:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Storage Account
3. Click "Access keys"
4. Copy "Storage account name" and "Key" (key1)

---

## 🚀 Quick Start

### If you DON'T have an Azure Storage Account:

1. **Create one (5 minutes):**
   - Go to [Azure Portal](https://portal.azure.com)
   - Search "Storage accounts" → Click "+ Create"
   - Name: `wevotestorage` (or any unique name)
   - Region: Same as your database
   - Performance: Standard
   - Redundancy: LRS
   - Click "Review + Create" → "Create"

2. **Get credentials:**
   - Wait for deployment
   - Go to storage account → Access keys
   - Copy connection string

3. **Update .env:**
   - Add the connection string to `.env`
   - Save the file

4. **Test it:**
   ```powershell
   node test_azure_blob_complete.js
   ```

---

### If you ALREADY have an Azure Storage Account:

1. **Get your connection string:**
   - Azure Portal → Your Storage Account
   - Access keys → Show keys → Copy connection string

2. **Update .env:**
   ```env
   AZURE_STORAGE_CONNECTION_STRING=<paste_your_connection_string_here>
   ```

3. **Test it:**
   ```powershell
   node test_azure_blob_complete.js
   ```

---

## ✅ Verify Setup

Run this command to test:

```powershell
node test_azure_blob_complete.js
```

**Expected output:**
```
✅ Azure Blob Storage initialized successfully
✅ File uploaded to Azure Blob Storage
✅ File downloaded successfully
✅ All tests completed successfully!
```

---

## 📝 Full .env Example

Your `.env` file should include:

```env
# Database Configuration
DB_SERVER=wevote.database.windows.net
DB_NAME=wevote
DB_USER=admin1
DB_PASSWORD=wevote123$

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Azure Blob Storage Configuration (ADD THIS)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=wevotestorage;AccountKey=YOUR_KEY_HERE;EndpointSuffix=core.windows.net
```

---

## 🐛 Troubleshooting

### Test fails with "credentials not found"
- ✅ Check .env file has AZURE_STORAGE_CONNECTION_STRING
- ✅ No typos in the variable name
- ✅ No extra spaces or quotes
- ✅ Connection string is complete (starts with DefaultEndpointsProtocol)

### Test fails with "authentication failed"
- ✅ Connection string is correct
- ✅ AccountKey is valid
- ✅ Storage account still exists in Azure

### Test fails with "network error"
- ✅ Internet connection working
- ✅ Firewall not blocking Azure
- ✅ Storage account accessible

---

## 💰 Cost

**Azure Blob Storage is very cheap:**
- ~$0.02/month for 1000 users (1MB files each)
- First 5GB free in some regions
- Pay only for what you use

---

## 🎯 Next Steps

1. ✅ Add Azure credentials to `.env`
2. ✅ Run test: `node test_azure_blob_complete.js`
3. ✅ Start backend: `node server/app.js`
4. ✅ Start frontend: `npm run dev`
5. ✅ Test upload in UI

---

## 📚 Full Documentation

See `AZURE_BLOB_SETUP_GUIDE.md` for complete setup instructions.

---

**Status:** ⚠️ **CONFIGURATION REQUIRED**

Once you add the credentials, everything will work automatically! 🎉
