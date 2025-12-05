# Azure Blob Storage Setup Guide

## 🎯 Quick Setup (5 Steps)

### Step 1: Create Azure Storage Account (if not exists)

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Storage accounts"
3. Click "+ Create"
4. Fill in:
   - **Subscription:** Your subscription
   - **Resource Group:** wevote (or create new)
   - **Storage account name:** `wevotestorage` (must be globally unique)
   - **Region:** Same as your database (for better performance)
   - **Performance:** Standard
   - **Redundancy:** LRS (Locally Redundant Storage) - cheapest option
5. Click "Review + Create" → "Create"
6. Wait for deployment (~2 minutes)

---

### Step 2: Get Access Keys

1. Go to your Storage Account
2. In left menu, click "Access keys" (under Security + networking)
3. Click "Show keys"
4. Copy **key1** - Connection string

It looks like:
```
DefaultEndpointsProtocol=https;AccountName=wevotestorage;AccountKey=LONG_KEY_HERE;EndpointSuffix=core.windows.net
```

---

### Step 3: Update .env File

Open your `.env` file and update these lines:

```env
# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=wevotestorage;AccountKey=YOUR_ACTUAL_KEY_HERE;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=wevotestorage
AZURE_STORAGE_ACCOUNT_KEY=YOUR_ACTUAL_KEY_HERE
```

**Replace:**
- `YOUR_ACTUAL_KEY_HERE` with your actual account key
- `wevotestorage` with your storage account name (if different)

---

### Step 4: Test the Setup

Run the test script:

```powershell
node test_azure_blob_complete.js
```

**Expected Output:**
```
✅ Azure Blob Storage initialized successfully
✅ File uploaded successfully!
✅ File downloaded from Azure
✅ All tests completed successfully!
```

---

### Step 5: Run the Application

```powershell
# Terminal 1: Backend
node server/app.js

# Terminal 2: Frontend
npm run dev
```

Now test by uploading a proxy form!

---

## 📦 What Was Created

### Container
- **Name:** `proxy-forms`
- **Access Level:** Blob (public read access to blobs)
- **Location:** Created automatically on first upload

### Folder Structure in Azure
```
proxy-forms (container)
├── user-171/
│   └── proxy-1704123456789-form.pdf
├── user-172/
│   └── proxy-1704123498765-form.pdf
└── user-173/
    └── proxy-1704123512345-form.pdf
```

---

## 🔐 Security Notes

### Current Setup
- ✅ Connection via secure HTTPS
- ✅ Authentication required for upload/delete
- ✅ Container-level public read (for downloads)
- ✅ User-specific folders

### Production Recommendations
1. **Private Container:** Set access to "Private" for better security
2. **SAS Tokens:** Use Shared Access Signatures for time-limited downloads
3. **CORS:** Configure CORS if accessing from browser
4. **Firewall:** Enable firewall rules to restrict access

---

## 💰 Cost Estimation

### Storage Costs (Pay-as-you-go)
- **Storage:** $0.0184/GB/month (first 50TB)
- **Operations:** 
  - Write: $0.05 per 10,000 operations
  - Read: $0.004 per 10,000 operations

### Example Costs
**1000 users, 1MB file each:**
- Storage: 1GB × $0.0184 = **$0.0184/month** (~$0.22/year)
- Uploads: 1000 × $0.05/10000 = **$0.005** (one-time)
- Downloads: 10000 views × $0.004/10000 = **$0.004** (variable)

**Total: ~$0.25/year for 1000 users** 🎉

---

## 🧪 Testing Checklist

### Automated Test
- [ ] Run `node test_azure_blob_complete.js`
- [ ] All 9 tests pass
- [ ] File uploaded to Azure
- [ ] File downloaded from Azure
- [ ] Database updated correctly

### Manual Upload Test
- [ ] Start backend and frontend
- [ ] Login as test user
- [ ] Click "Upload Proxy Form"
- [ ] Select PDF file
- [ ] Upload successful
- [ ] Button turns green
- [ ] File stored in Azure (check portal)

### Manual Download Test
- [ ] Click "View Proxy Form"
- [ ] Modal shows existing file
- [ ] Click "View" link
- [ ] PDF downloads from Azure
- [ ] File content is correct

### Admin Test
- [ ] Login as admin
- [ ] Go to User Approvals
- [ ] See "Proxy File" column
- [ ] Click "Download"
- [ ] PDF downloads from Azure

---

## 🔍 Troubleshooting

### Error: "Azure Storage credentials not found"
**Solution:** Check .env file has:
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```
Or:
```env
AZURE_STORAGE_ACCOUNT_NAME=wevotestorage
AZURE_STORAGE_ACCOUNT_KEY=your_key_here
```

### Error: "Container does not exist"
**Solution:** Container is created automatically. Check:
1. Storage account exists
2. Credentials are correct
3. Network connectivity to Azure

### Error: "Download failed"
**Solution:** Check:
1. Blob name is correct in database
2. Blob exists in container
3. Download endpoint uses correct path

### Error: "Public access denied"
**Solution:** 
1. Go to Azure Portal → Storage Account
2. Configuration → Allow Blob public access: Enabled
3. Container → Change access level to "Blob"

---

## 📊 Monitor in Azure Portal

### View Uploaded Files
1. Azure Portal → Storage accounts → wevotestorage
2. Click "Containers"
3. Click "proxy-forms"
4. See all uploaded files organized by user

### Check Storage Usage
1. Storage account → Overview
2. See "Used capacity" metric
3. Monitor costs in "Cost Management"

### Download Files Manually
1. Navigate to file in portal
2. Click file name
3. Click "Download"

---

## 🔄 Migration from Local Storage

### If you have existing local files:

1. **List local files:**
```powershell
Get-ChildItem "server\uploads\proxy-files" -Recurse -Filter "*.pdf"
```

2. **Migration script** (create `migrate_to_azure.js`):
```javascript
// Script to migrate local files to Azure
// Read local files
// Upload each to Azure
// Update database with new paths
```

3. **Run migration:**
```powershell
node migrate_to_azure.js
```

4. **Verify migration:**
```powershell
node test_azure_blob_complete.js
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Azure Storage account created
- [ ] Connection string in .env (production)
- [ ] Container created (proxy-forms)
- [ ] Test upload works
- [ ] Test download works
- [ ] Admin can access files
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Cost alerts configured
- [ ] Security reviewed

---

## 📞 Support

### If you encounter issues:

1. **Check Azure Portal:**
   - Storage account exists?
   - Container exists?
   - Files uploading?

2. **Check Application Logs:**
   - Backend console for upload errors
   - Browser console for download errors

3. **Run Test Script:**
   ```powershell
   node test_azure_blob_complete.js
   ```

4. **Verify .env:**
   - Connection string correct?
   - No extra spaces or quotes?

---

## 🎉 Success!

Once setup is complete, you have:
- ✅ Cloud-based PDF storage
- ✅ Scalable solution
- ✅ Automatic backups (Azure redundancy)
- ✅ Professional infrastructure
- ✅ Low cost (~$0.02/month for 1000 users)
- ✅ High reliability (99.9% uptime SLA)

**Your proxy forms are now stored securely in Microsoft Azure!** ☁️
