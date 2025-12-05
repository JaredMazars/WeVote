# 🧪 Manual Test: Proxy PDF Upload & Download

## Quick 5-Minute Test

### ✅ Prerequisites Verified
- Database columns exist ✅
- Test user ready (ID 171) ✅
- Dummy PDF uploaded ✅
- Express static middleware configured ✅

---

## 🚀 Test Now (3 Steps)

### Step 1: Start Backend (if not running)
```powershell
node server/app.js
```
**Expected:** Server starts on port 3001

---

### Step 2: Test PDF Download URL
Open in browser or use curl:
```
http://localhost:3001/uploads/proxy-files/user-171/proxy-test-1764852550007.pdf
```

**Expected Result:**
- ✅ PDF opens in browser
- ✅ Shows "TEST PROXY FORM - User 171"
- ✅ Contains date and test content

**If 404 Error:**
- Check server is running
- Verify file exists at: `server\uploads\proxy-files\user-171\`

---

### Step 3: Test Frontend (Complete Flow)

#### 3a. Start Frontend
```powershell
npm run dev
```
**Expected:** Frontend runs on http://localhost:5173

#### 3b. Login as Test User
- Navigate to: http://localhost:5173
- Login with: `jaredmoodley9@gmail.com`
- (Use whatever password is set for this user)

#### 3c. Check Navbar Button
**Expected:** See **GREEN "View Proxy Form"** button (not white)
- ✅ This proves:
  - Database has file info
  - AuthContext loaded proxy_file_name
  - Frontend detected existing file

#### 3d. Test View Modal
1. Click green "View Proxy Form" button
2. **Expected:** Modal opens showing:
   - Title: "View/Replace Proxy Form"
   - Green box with "Current File: proxy-test-1764852550007.pdf"
   - "View" link button
   - File input for replacement
   - "Replace File" button

#### 3e. Test View Link
1. Click "View" link in modal
2. **Expected:** 
   - New tab opens
   - PDF displays: `http://localhost:3001/uploads/proxy-files/user-171/proxy-test-1764852550007.pdf`
   - Shows test proxy form content

---

## 🎯 Success Criteria

### All Green = Feature Works! ✅
- [ ] Backend server starts
- [ ] PDF URL returns file (not 404)
- [ ] Can open PDF in browser
- [ ] Login shows GREEN button (not white)
- [ ] Modal shows existing file info
- [ ] "View" link opens PDF
- [ ] PDF content displays correctly

---

## 🔄 Test File Upload (Optional)

Want to test actual upload? Reset the test user:

### Reset Test User
```sql
UPDATE users 
SET proxy_file_name = NULL, 
    proxy_file_path = NULL, 
    proxy_uploaded_at = NULL 
WHERE id = 171;
```

### Test Upload
1. Refresh frontend (logout/login)
2. Should now see WHITE "Upload Proxy Form" button
3. Click button → Modal opens
4. Select any PDF file
5. Click "Upload"
6. **Expected:**
   - Success message appears
   - Button changes to GREEN "View Proxy Form"
   - Can click to view uploaded file

---

## 📊 Test Database

```sql
-- View test user data
SELECT 
    id,
    email,
    proxy_vote_form,
    proxy_file_name,
    proxy_file_path,
    proxy_uploaded_at
FROM users 
WHERE id = 171;
```

**Expected Result:**
```
id: 171
email: jaredmoodley9@gmail.com
proxy_vote_form: manual
proxy_file_name: proxy-test-1764852550007.pdf
proxy_file_path: uploads/proxy-files/user-171/proxy-test-1764852550007.pdf
proxy_uploaded_at: 2025-12-04 12:49:10
```

---

## 🔧 Troubleshooting

### Problem: 404 on PDF URL
**Solution:** Backend not running. Run: `node server/app.js`

### Problem: Button is White (not Green)
**Solution:** File not in database or not loaded. Check:
```javascript
// In browser console:
JSON.parse(localStorage.getItem('user')).proxy_file_name
// Should return: "proxy-test-1764852550007.pdf"
```

### Problem: Modal Doesn't Show File
**Solution:** Frontend state issue. Check:
- AuthContext includes proxy_file_name
- Header.tsx useEffect runs
- hasUploadedFile state is true

### Problem: Can't Login as Test User
**Solution:** Use any other user or check password. To see all users:
```sql
SELECT TOP 5 id, email, name FROM users;
```

---

## 📁 Quick File Check

```powershell
# Check if test PDF exists
dir "server\uploads\proxy-files\user-171\proxy-test-*.pdf"

# Should show:
# proxy-test-1764852550007.pdf
```

---

## ✅ PASSED CHECKLIST

After testing, mark what worked:

**Backend:**
- [ ] Server started successfully
- [ ] PDF URL accessible (not 404)
- [ ] PDF opens/downloads correctly

**Database:**
- [ ] User has proxy_file_name populated
- [ ] User has proxy_file_path populated
- [ ] User has proxy_uploaded_at timestamp

**Frontend:**
- [ ] Login successful
- [ ] Green "View Proxy Form" button visible
- [ ] Modal opens with file info
- [ ] "View" link works
- [ ] PDF displays in new tab

**Admin (Optional):**
- [ ] Login as admin
- [ ] Navigate to User Approvals
- [ ] See "Proxy File" column
- [ ] Can download file

---

## 🎉 If All Passed...

**Congratulations! The feature is working!** 🎊

You now have:
✅ Working PDF upload
✅ Files saved to disk
✅ Database tracking
✅ View/download functionality
✅ Replace capability
✅ Admin access

---

## 📝 Test Log

**Tested By:** _________________  
**Date:** _________________  
**Time:** _________________  

**Results:**
- Backend: ☐ Pass  ☐ Fail
- Database: ☐ Pass  ☐ Fail
- Frontend: ☐ Pass  ☐ Fail
- PDF Access: ☐ Pass  ☐ Fail

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

**Next:** If all tests pass, proceed with user acceptance testing!
