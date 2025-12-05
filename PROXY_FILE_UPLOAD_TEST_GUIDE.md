# Proxy File Upload Testing Guide

## Overview
Complete testing guide for the manual proxy form upload feature with view/replace functionality.

## Test Prerequisites

### 1. Database Setup
Verify the database has the required columns:
```sql
-- Check if columns exist
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users'
    AND COLUMN_NAME IN ('proxy_vote_form', 'proxy_file_name', 'proxy_file_path', 'proxy_uploaded_at')
ORDER BY COLUMN_NAME;
```

### 2. Test User Setup
Create or use a test user with `proxy_vote_form='manual'`:
```sql
-- Update existing user to manual proxy
UPDATE users 
SET proxy_vote_form = 'manual',
    proxy_file_name = NULL,
    proxy_file_path = NULL,
    proxy_uploaded_at = NULL
WHERE id = 171; -- Use your test user ID

-- Verify
SELECT id, email, name, proxy_vote_form, proxy_file_name, proxy_file_path, proxy_uploaded_at
FROM users
WHERE id = 171;
```

### 3. Server Setup
Ensure backend server is running:
```powershell
# Start backend
node server/app.js
```

### 4. Frontend Setup
Ensure frontend is running:
```powershell
# Start frontend (if not already running)
npm run dev
```

---

## Test Scenarios

### Test 1: Initial Upload (No File Uploaded)

**Expected Behavior:**
- User with `proxy_vote_form='manual'` sees white "Upload Proxy Form" button
- Clicking button opens modal with upload interface
- Modal shows "Upload Proxy Form" title
- No existing file section visible

**Steps:**
1. Login with test user (proxy_vote_form='manual', no file uploaded)
2. Navigate to navbar
3. Verify you see **white "Upload Proxy Form" button** with upload icon
4. Click the button
5. Verify modal opens with:
   - Title: "Upload Proxy Form"
   - Instructions: "Please upload your completed manual proxy form..."
   - File input field
   - "Cancel" and "Upload" buttons

**Database State Before:**
```sql
SELECT proxy_vote_form, proxy_file_name, proxy_file_path, proxy_uploaded_at
FROM users WHERE id = 171;
-- Expected: manual, NULL, NULL, NULL
```

---

### Test 2: File Upload Process

**Expected Behavior:**
- User can select a file
- Upload button activates when file selected
- Upload processes successfully
- Success message appears
- Button changes to green "View Proxy Form"
- Database updates with file information

**Steps:**
1. From the upload modal, click "Select File"
2. Choose a test PDF file (e.g., test-proxy-form.pdf)
3. Verify selected file name appears below file input
4. Click "Upload" button
5. Wait for upload to complete
6. Verify success alert: "Proxy form uploaded successfully!"
7. Modal closes automatically
8. Verify button changes to **green "View Proxy Form"** button with eye icon
9. Check database to confirm file stored

**Database State After:**
```sql
SELECT proxy_vote_form, proxy_file_name, proxy_file_path, proxy_uploaded_at
FROM users WHERE id = 171;
-- Expected: manual, [filename], uploads/proxy-files/user-171/[filename], [timestamp]
```

**Console Logs to Check:**
```
📤 Manual proxy form upload request received
✅ Manual proxy form uploaded successfully
```

---

### Test 3: View Uploaded File

**Expected Behavior:**
- Green "View Proxy Form" button visible after upload
- Clicking opens modal showing existing file
- Can view/download the uploaded file
- Modal shows replace option

**Steps:**
1. After successful upload, verify **green "View Proxy Form" button** is visible
2. Click the "View Proxy Form" button
3. Verify modal opens with:
   - Title: "View/Replace Proxy Form"
   - Green box showing "Current File: [filename]"
   - "View" link button (opens file in new tab)
   - Instructions: "Upload a new file below to replace this one"
   - File input for replacement
   - "Cancel" and "Replace File" buttons
4. Click the "View" link
5. Verify file opens in new browser tab
6. Close the tab and return to modal

**Expected Modal Content:**
```
View/Replace Proxy Form
┌────────────────────────────────────────┐
│ Current File:                          │
│ test-proxy-form.pdf            [View]  │
│ Upload a new file below to replace... │
└────────────────────────────────────────┘

Select File: [Choose File]

[Cancel]  [Replace File]
```

---

### Test 4: Replace File

**Expected Behavior:**
- Can select new file from modal
- "Replace File" button updates database
- Success message confirms replacement
- New file appears in modal

**Steps:**
1. Click "View Proxy Form" to open modal
2. Verify existing file shows in green box
3. Click "Select File" and choose a **different** file (e.g., updated-proxy.pdf)
4. Verify selected file name appears
5. Click "Replace File" button
6. Wait for upload to complete
7. Verify alert: "Proxy form replaced successfully!"
8. Modal closes
9. Click "View Proxy Form" again
10. Verify new filename appears in modal
11. Click "View" link to confirm new file opens

**Database State After:**
```sql
SELECT proxy_vote_form, proxy_file_name, proxy_file_path, proxy_uploaded_at
FROM users WHERE id = 171;
-- Expected: manual, [new-filename], uploads/proxy-files/user-171/[new-filename], [new-timestamp]
```

---

### Test 5: Admin View

**Expected Behavior:**
- Admin can see uploaded files in approval table
- Files are downloadable
- Latest file appears after replacement

**Steps:**
1. Logout from test user account
2. Login as admin user
3. Navigate to Admin > User Approvals tab
4. Find the test user (ID 171) in the table
5. Verify "Proxy File" column shows:
   - Filename as clickable link
   - Link downloads the file
6. Download and verify it's the correct file
7. If you replaced the file in Test 4, verify this is the **new** file

**Expected Admin Table:**
```
| ID  | Name      | Email              | Status   | Proxy File           |
|-----|-----------|--------------------|---------|-----------------------|
| 171 | Test User | test@example.com   | Pending | updated-proxy.pdf    |
```

---

### Test 6: Re-login Persistence

**Expected Behavior:**
- File upload persists after logout/login
- Green "View Proxy Form" button appears immediately
- Can still view and replace file

**Steps:**
1. Logout from current session
2. Login again with the same test user
3. Immediately check navbar
4. Verify **green "View Proxy Form" button** is visible (not white upload button)
5. Click button to open modal
6. Verify existing file is shown
7. Verify you can still view and replace the file

**Why This Matters:**
- Tests localStorage synchronization with database
- Verifies AuthContext loads proxy file fields on login
- Confirms user state persistence

---

### Test 7: Different User Scenarios

**Test 7a: Digital Proxy User**
```sql
UPDATE users SET proxy_vote_form = 'digital' WHERE id = 172;
```
- Login with digital proxy user
- Verify you see **white "Complete Proxy" button** (not upload button)
- This button opens the digital proxy form

**Test 7b: Abstain User**
```sql
UPDATE users SET proxy_vote_form = 'abstain' WHERE id = 173;
```
- Login with abstain user
- Verify no proxy button appears at all

**Test 7c: No Choice Made**
```sql
UPDATE users SET proxy_vote_form = NULL WHERE id = 174;
```
- Login with user who hasn't made a choice
- Verify you see "Make Proxy Choice" or similar prompt

---

## Error Scenarios

### Error Test 1: No File Selected
**Steps:**
1. Open upload modal
2. Click "Upload" without selecting a file
3. Verify alert: "Please select a file"
4. Upload button should be disabled

### Error Test 2: Invalid File Type
**Steps:**
1. Open upload modal
2. Try selecting an unsupported file (e.g., .exe, .zip)
3. Verify file input rejects the file or shows error
4. Accept: .pdf, .doc, .docx, images (png, jpg, jpeg)

### Error Test 3: Large File
**Steps:**
1. Try uploading a very large file (>10MB)
2. Verify appropriate error handling
3. Check if file size limit is enforced

### Error Test 4: Network Error
**Steps:**
1. Stop the backend server
2. Try uploading a file
3. Verify error message: "Error uploading file. Please try again."
4. Restart server and try again

---

## Verification Checklist

### UI Verification
- [ ] White "Upload Proxy Form" button appears when no file uploaded
- [ ] Green "View Proxy Form" button appears after upload
- [ ] Modal title changes based on state
- [ ] Existing file section shows when file exists
- [ ] "View" link opens file in new tab
- [ ] Button text changes from "Upload" to "Replace File"
- [ ] Loading states show during upload
- [ ] Success/error messages display correctly

### Database Verification
```sql
-- Run this query to verify all fields updated
SELECT 
    id,
    email,
    name,
    proxy_vote_form,
    proxy_file_name,
    proxy_file_path,
    proxy_uploaded_at,
    DATEDIFF(SECOND, proxy_uploaded_at, GETDATE()) as seconds_since_upload
FROM users
WHERE proxy_vote_form = 'manual'
ORDER BY proxy_uploaded_at DESC;
```

### File System Verification
```powershell
# Check uploaded files exist
Get-ChildItem "uploads/proxy-files" -Recurse

# Check specific user folder
Get-ChildItem "uploads/proxy-files/user-171"
```

### Admin Panel Verification
- [ ] Proxy file column visible
- [ ] Filename links work
- [ ] Files download correctly
- [ ] Updated files appear after replacement

---

## Common Issues & Solutions

### Issue 1: Button Not Changing Color
**Symptom:** Button stays white even after upload
**Check:**
```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('user')));
// Verify proxy_file_name is present
```
**Solution:** Ensure `handleFileUpload` updates localStorage correctly

### Issue 2: File Not Viewable
**Symptom:** "View" link shows 404
**Check:**
- File path in database matches actual file location
- Express static middleware is configured for uploads folder
**Solution:** Verify server.js has:
```javascript
app.use('/uploads', express.static('uploads'));
```

### Issue 3: Modal Not Showing Existing File
**Symptom:** Modal always shows upload interface
**Check:**
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('user'));
console.log('Has file:', user.proxy_file_name);
console.log('File name:', user.proxy_file_name);
```
**Solution:** Verify useEffect in Header.tsx is setting `hasUploadedFile` state

### Issue 4: Database Not Updating
**Symptom:** File uploads but database shows NULL
**Check:**
- Backend console for SQL query execution
- Network tab in browser for API response
**Solution:** Check proxy.js upload endpoint query syntax

---

## Success Criteria

All tests pass when:
1. ✅ Upload button appears for manual proxy users
2. ✅ File uploads successfully to server
3. ✅ Database updates with all file information
4. ✅ Button changes to green "View Proxy Form" after upload
5. ✅ Modal shows existing file with view link
6. ✅ File is viewable/downloadable
7. ✅ File can be replaced with new upload
8. ✅ Admin can see and download files
9. ✅ Upload persists after logout/login
10. ✅ All user types see correct buttons

---

## Performance Testing

### Load Test
- Upload 10 different files sequentially
- Measure upload time for each
- Verify all uploads succeed
- Check database for all entries

### Concurrent Test
- Have multiple users upload files simultaneously
- Verify no file overwrites occur
- Check each user's folder is isolated

### Storage Test
- Upload various file types (.pdf, .doc, .docx, .png, .jpg)
- Verify all types are stored correctly
- Check file integrity after download

---

## Rollback Plan

If issues occur:

1. **Revert Database Changes:**
```sql
UPDATE users 
SET proxy_file_name = NULL,
    proxy_file_path = NULL,
    proxy_uploaded_at = NULL
WHERE id = 171;
```

2. **Clear Uploaded Files:**
```powershell
Remove-Item "uploads/proxy-files/user-171/*" -Force
```

3. **Clear localStorage:**
```javascript
localStorage.removeItem('user');
localStorage.removeItem('token');
```

4. **Restart Services:**
```powershell
# Restart backend
# Restart frontend
```

---

## Post-Testing Actions

After all tests pass:

1. **Document Results:**
   - Create test report with screenshots
   - Note any issues encountered
   - Document workarounds or fixes applied

2. **Update Documentation:**
   - Add to USER_GUIDE.md if needed
   - Update API_REFERENCE.md with file paths
   - Create admin guide for file management

3. **Security Review:**
   - Verify file upload security (file type validation)
   - Check authentication on upload endpoint
   - Ensure files are only accessible by authorized users

4. **Backup:**
   - Backup database before production deployment
   - Document file storage location
   - Set up file backup strategy

---

## Contact & Support

If you encounter issues during testing:
1. Check browser console for errors
2. Check backend console for API errors
3. Verify database query execution
4. Review this guide for troubleshooting steps

Test conducted by: _____________
Date: _____________
Results: ☐ Pass  ☐ Fail  ☐ Needs Fixes
Notes: 
