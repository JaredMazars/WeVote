# PDF Storage Options for Proxy Forms

## Current Configuration ⚠️

### Where PDFs Are Currently Stored
```
📁 Project Root
└── 📁 server
    └── 📁 uploads
        └── 📁 proxy-files
            ├── 📁 user-171
            │   └── 📄 proxy-1704123456789.pdf
            ├── 📁 user-172
            │   └── 📄 proxy-1704123498765.pdf
            └── 📁 user-173
                └── 📄 proxy-1704123512345.pdf
```

**Full Path:** `c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy\server\uploads\proxy-files\user-{userId}\`

### Configuration Details
- **Multer Storage:** `server/middleware/upload.js`
- **Base Directory:** `server/uploads/proxy-files`
- **Organization:** Each user has their own folder (`user-{id}`)
- **File Naming:** `proxy-{timestamp}.{extension}` (e.g., `proxy-1704123456789.pdf`)
- **File Size Limit:** 5MB per file
- **Allowed Types:** PDF only (configured in fileFilter)

---

## ⚠️ CRITICAL ISSUE: Files Not Accessible

### Problem
The uploads folder is **NOT** exposed via Express static middleware, meaning:
- ❌ Files cannot be accessed via URLs
- ❌ The "View" link in the modal will return 404
- ❌ Admin cannot download files

### Current Code Missing in `server/app.js`:
```javascript
// ❌ THIS LINE DOES NOT EXIST
app.use('/uploads', express.static('uploads'));
```

---

## 📋 Storage Options

### Option 1: Local File System with Express Static (RECOMMENDED FOR DEVELOPMENT) ⭐

**Pros:**
- ✅ Simple and fast
- ✅ No external dependencies
- ✅ Works offline
- ✅ Free

**Cons:**
- ❌ Not scalable for multiple servers
- ❌ Lost if server crashes (without backups)
- ❌ Takes up server disk space

**Setup:**
1. Add static middleware to `server/app.js`
2. Files accessible via `http://localhost:3001/uploads/proxy-files/user-{id}/{filename}`

**Cost:** Free

---

### Option 2: Azure Blob Storage (RECOMMENDED FOR PRODUCTION) ⭐⭐⭐

**Pros:**
- ✅ Highly scalable and reliable
- ✅ Built-in redundancy and backups
- ✅ Works with multiple servers
- ✅ CDN integration available
- ✅ Already using Azure for database

**Cons:**
- ❌ Requires Azure subscription
- ❌ Monthly storage costs
- ❌ Internet connection required

**Storage Structure:**
```
Container: proxy-forms
├── user-171/
│   └── proxy-1704123456789.pdf
├── user-172/
│   └── proxy-1704123498765.pdf
```

**Cost:** 
- First 50 TB: $0.0184/GB/month
- Example: 1000 users × 1MB = ~$0.02/month

---

### Option 3: AWS S3 (ALTERNATIVE CLOUD)

**Pros:**
- ✅ Highly scalable
- ✅ Industry standard
- ✅ Many integration options

**Cons:**
- ❌ Requires AWS account
- ❌ Different ecosystem from Azure
- ❌ Monthly costs

**Cost:** 
- First 50 TB: $0.023/GB/month
- Similar to Azure pricing

---

### Option 4: Database Storage (NOT RECOMMENDED)

**Pros:**
- ✅ All data in one place
- ✅ ACID transactions

**Cons:**
- ❌ Database bloat
- ❌ Slower retrieval
- ❌ Expensive for large files
- ❌ Complicates backups

**Not recommended for PDFs!**

---

## 🚀 Quick Fix: Enable Local Storage Access

### Step 1: Update `server/app.js`

Add this code after the body parsing middleware:

```javascript
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ ADD THIS: Serve uploaded files statically
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Static files served from:', path.join(__dirname, 'uploads'));

// Logging middleware
app.use(morgan('combined'));
```

### Step 2: Test Access
```
http://localhost:3001/uploads/proxy-files/user-171/proxy-1704123456789.pdf
```

### Step 3: Verify in Browser
1. Start backend: `node server/app.js`
2. Upload a test file via UI
3. Click "View" button in modal
4. File should open in new tab ✅

---

## 🔐 Security Considerations

### Current Issues with Static Middleware
⚠️ **Anyone with the URL can access files** - No authentication required!

### Recommended: Add Authentication Middleware

```javascript
// Secure route for file downloads
import { authenticateToken } from './middleware/auth.js';

app.get('/api/proxy/download/:userId/:filename', authenticateToken, (req, res) => {
  const { userId, filename } = req.params;
  const requestingUserId = req.user.id;
  const userRole = req.user.role;
  
  // Users can only download their own files, admins can download any
  if (requestingUserId !== parseInt(userId) && userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const filePath = path.join(__dirname, 'uploads', 'proxy-files', `user-${userId}`, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }
  
  res.sendFile(filePath);
});
```

Then update frontend to use:
```typescript
href={`http://localhost:3001/api/proxy/download/${user?.id}/${uploadedFileName}`}
```

---

## 📊 Storage Comparison Table

| Feature | Local | Azure Blob | AWS S3 | Database |
|---------|-------|-----------|---------|----------|
| **Setup Time** | 5 min | 30 min | 30 min | 1 hour |
| **Monthly Cost (1000 users)** | Free | ~$0.02 | ~$0.03 | N/A |
| **Scalability** | Low | High | High | Medium |
| **Reliability** | Medium | High | High | High |
| **Backup** | Manual | Automatic | Automatic | With DB |
| **CDN Support** | No | Yes | Yes | No |
| **Best For** | Dev/Testing | Production | Production | Never |

---

## 🎯 Recommendations

### For Development/Testing
✅ **Use Local File System with Express Static**
- Quick to set up
- No costs
- Easy to debug

### For Production
✅ **Use Azure Blob Storage**
- Already using Azure SQL
- Reliable and scalable
- Professional solution
- Low cost

---

## 📁 Local Storage Best Practices

### 1. Folder Structure
```
server/
├── uploads/
│   ├── proxy-files/        ← Proxy forms
│   │   ├── user-171/
│   │   ├── user-172/
│   │   └── user-173/
│   ├── avatars/           ← User profile pictures (future)
│   └── documents/         ← Other documents (future)
```

### 2. .gitignore
Ensure uploads are NOT committed to git:
```gitignore
# Uploads folder (user-generated content)
server/uploads/
uploads/

# Keep structure
!server/uploads/.gitkeep
```

### 3. Backup Strategy
```powershell
# Daily backup script
$source = "c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy\server\uploads"
$destination = "c:\Backups\WeVote\uploads-$(Get-Date -Format 'yyyy-MM-dd')"
Copy-Item -Path $source -Destination $destination -Recurse
```

### 4. Monitoring
Track disk space usage:
```javascript
// In server/app.js
import { execSync } from 'child_process';

setInterval(() => {
  const uploadsSize = execSync('du -sh server/uploads').toString();
  console.log('📦 Uploads folder size:', uploadsSize);
}, 3600000); // Every hour
```

---

## 🔄 Migration Path: Local → Azure

When ready for production:

### Phase 1: Dual Storage
- Upload to both local and Azure
- Serve from local initially
- Verify Azure uploads work

### Phase 2: Read from Azure
- Update URLs to point to Azure
- Keep local as backup
- Monitor for issues

### Phase 3: Azure Only
- Stop writing to local
- Archive local files
- Full Azure migration complete

**Migration Script Available:** `server/scripts/migrate-to-azure.js` (to be created)

---

## 📝 Action Items

### Immediate (Choose One):

#### Option A: Quick Fix (5 minutes)
```bash
# Add static middleware to server/app.js
# This will make files accessible immediately
```

#### Option B: Secure Route (15 minutes)
```bash
# Create authenticated download endpoint
# More secure but requires frontend changes
```

### Short Term (This Week):
- [ ] Add proper authentication to file access
- [ ] Set up automated backups
- [ ] Add file upload monitoring
- [ ] Document file retention policy

### Long Term (Next Sprint):
- [ ] Migrate to Azure Blob Storage
- [ ] Implement CDN for file delivery
- [ ] Add file versioning
- [ ] Set up disaster recovery

---

## 🆘 Current Status: ACTION REQUIRED

**The upload feature will NOT work properly until you:**

1. ✅ Add Express static middleware OR
2. ✅ Create authenticated download endpoint

**I recommend Option 1 (static middleware) for immediate testing, then add authentication later.**

Would you like me to:
1. Add the Express static middleware now? (5 minutes)
2. Create the secure authenticated endpoint? (15 minutes)
3. Set up Azure Blob Storage? (30 minutes)
