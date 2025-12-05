# Quick Start: Testing Proxy File Upload Feature

## 🚀 Fast Setup (5 minutes)

### Step 1: Verify Setup
```powershell
node verify_proxy_upload_setup.js
```
This will check:
- ✅ Database columns exist
- ✅ Test users available
- ✅ Uploads folder structure

### Step 2: Start Servers
```powershell
# Terminal 1: Backend
node server/app.js

# Terminal 2: Frontend  
npm run dev
```

### Step 3: Test Workflow
1. **Login** with a user that has `proxy_vote_form='manual'`
   - Example test users: ID 171, 139 (check verification script output)

2. **Upload File:**
   - Look for **white "Upload Proxy Form"** button in navbar
   - Click it → Modal opens
   - Select a PDF file
   - Click "Upload"
   - ✅ Success message appears
   - ✅ Button turns **green "View Proxy Form"**

3. **View File:**
   - Click green "View Proxy Form" button
   - ✅ Modal shows existing file
   - ✅ Can click "View" to open file
   - ✅ Can select new file to replace

4. **Admin Check:**
   - Login as admin
   - Go to User Approvals tab
   - ✅ See "Proxy File" column with download link

---

## 🎯 Quick Tests (10 minutes)

### Test 1: First Upload ⏱️ 2 min
```
Login → See white button → Click → Select file → Upload → See green button ✅
```

### Test 2: View Existing ⏱️ 1 min
```
Click green button → See filename → Click "View" → File opens ✅
```

### Test 3: Replace File ⏱️ 2 min
```
Click green button → Select new file → Click "Replace File" → Success ✅
```

### Test 4: Persistence ⏱️ 2 min
```
Logout → Login → See green button (not white) ✅
```

### Test 5: Admin View ⏱️ 3 min
```
Login as admin → User Approvals → See file column → Download works ✅
```

---

## 🐛 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| White button after upload | Check browser console → localStorage.getItem('user') → proxy_file_name should exist |
| File not viewable | Check http://localhost:3001/uploads/proxy-files/user-{id}/{filename} |
| Button not appearing | Verify proxy_vote_form='manual' in database |
| Upload fails | Check backend console for errors |

---

## 📊 Quick Verification Queries

```sql
-- Check user proxy data
SELECT id, email, proxy_vote_form, proxy_file_name, proxy_uploaded_at 
FROM users WHERE id = 171;

-- See all uploaded files
SELECT id, email, proxy_file_name FROM users 
WHERE proxy_file_name IS NOT NULL;

-- Reset test user
UPDATE users 
SET proxy_file_name = NULL, proxy_file_path = NULL, proxy_uploaded_at = NULL 
WHERE id = 171;
```

---

## ✅ Success Criteria

Feature works when:
- ☑️ White button → Upload → Green button
- ☑️ Green button → Modal shows file
- ☑️ Can view/download file
- ☑️ Can replace file
- ☑️ Admin sees files
- ☑️ Persists after logout/login

---

## 📚 Full Documentation

- **Complete Testing:** `PROXY_FILE_UPLOAD_TEST_GUIDE.md`
- **Implementation Details:** `PROXY_FILE_UPLOAD_IMPLEMENTATION_SUMMARY.md`
- **Feature Spec:** `MANUAL_PROXY_UPLOAD_IMPLEMENTATION.md`

---

## 🎨 Visual Guide

### Button States
```
NO FILE:     [📤 Upload Proxy Form]  ← White button
HAS FILE:    [👁️ View Proxy Form]    ← Green button
```

### Modal Flow
```
UPLOAD MODE:
┌──────────────────────┐
│ Upload Proxy Form    │
│ [Choose File]        │
│ [Cancel] [Upload]    │
└──────────────────────┘

VIEW MODE:
┌──────────────────────┐
│ View/Replace Form    │
│ ┌────────────────┐   │
│ │ Current File:  │   │
│ │ test.pdf [View]│   │
│ └────────────────┘   │
│ [Choose File]        │
│ [Cancel] [Replace]   │
└──────────────────────┘
```

---

## 🔑 Key Files Modified

- ✏️ `src/components/Header.tsx` - UI and upload logic
- ✏️ `src/contexts/AuthContext.tsx` - User state management
- ✏️ `server/routes/auth.js` - Login response
- ✏️ `server/models/User.js` - Database queries
- ✅ `server/routes/proxy.js` - Upload endpoint (already existed)

---

**Ready to test!** Run `node verify_proxy_upload_setup.js` to begin.
