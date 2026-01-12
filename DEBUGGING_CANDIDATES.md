# 🔧 Admin Dashboard Debugging - Candidates Not Showing

## ✅ Fixes Applied

I've updated the code with extensive debugging and better field mapping:

### **1. Enhanced loadCandidates() function**
- Added console logs showing every step
- Handles multiple field name variations
- Better error handling
- Supports both `Name` and `FirstName/LastName` combinations

### **2. Console Logs You Should See**

When you refresh the Candidates tab, check browser console (F12) for:

```
API Response from /candidates: {status: 200, ok: true, dataKeys: ['count', 'candidates'], ...}
Transformed data for /candidates: [{CandidateID: 1, FirstName: 'Alice', ...}, ...]
🔍 Candidates Response: {success: true, data: [...]}
🔍 Candidates Array: [{CandidateID: 1, ...}, ...]
🔍 First Candidate: {CandidateID: 1, FirstName: 'Alice', ...}
✅ Transformed Candidates: [{id: 1, name: 'Alice Johnson', ...}]
```

---

## 🧪 How to Test Right Now

### **Step 1: Refresh Browser**
1. Go to http://localhost:5173
2. Press **Ctrl + Shift + R** (hard refresh)
3. Open browser console: **F12** → Console tab

### **Step 2: Login**
- Email: `admin@forvismazars.com`
- Password: `Demo@123`

### **Step 3: Go to Admin Dashboard → Candidates Tab**
Watch the console as the page loads

### **Step 4: Check Console Logs**

**If you see this** ✅ GOOD:
```
🔍 Candidates Response: {success: true, data: [Array(8)]}
✅ Transformed Candidates: [{id: 1, name: 'Alice Johnson', department: 'Engineering', ...}, ...]
```
→ Candidates should appear in table

**If you see this** ⚠️ ISSUE:
```
⚠️ Candidates response not successful or no data
```
→ API returned no data or error

**If you see this** ❌ ERROR:
```
❌ Error loading candidates: [error message]
```
→ API call failed

---

## 🔍 Diagnostic Tests

### **Test 1: Check if Backend is Running**
Open new browser tab: http://localhost:3001

**Should see**: "WeVote API is running" or similar message

**If not**: Backend is down
```bash
# Restart backend
cd c:\Projects\Discovery\WeVote
npm run dev:all
```

---

### **Test 2: Check API Directly**

Open browser console (F12) and run:

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'));

// Test candidates endpoint
fetch('http://localhost:3001/api/candidates', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Response Status:', r.status, r.ok);
  return r.json();
})
.then(data => {
  console.log('=== CANDIDATES API RESPONSE ===');
  console.log('Full Response:', data);
  console.log('Response Keys:', Object.keys(data));
  console.log('Count:', data.count);
  console.log('Has candidates array?', !!data.candidates);
  if (data.candidates) {
    console.log('Number of candidates:', data.candidates.length);
    console.log('First candidate:', data.candidates[0]);
  }
})
.catch(err => console.error('API Error:', err));
```

---

### **Test 3: Check Database Directly**

If API returns empty, check if candidates exist in database.

Run this in backend terminal or via SQL client:

```sql
-- Check if candidates table has data
SELECT COUNT(*) as TotalCandidates FROM Candidates;

-- Show all candidates
SELECT 
  CandidateID,
  FirstName,
  LastName,
  Department,
  Status,
  SessionID
FROM Candidates
ORDER BY CandidateID;

-- Check if there's a session
SELECT * FROM AGMSessions;
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: "401 Unauthorized"**
**Symptom**: API returns 401 status
**Cause**: Not logged in or token expired
**Solution**:
1. Logout from app
2. Login again
3. Try accessing Candidates tab

---

### **Issue 2: "Empty Array Returned"**
**Symptom**: `data.candidates = []` (empty array)
**Cause**: No candidates in database
**Solution**:
1. Check if demo data was populated
2. Create test candidate via Admin Dashboard
3. Or run database seeding script

---

### **Issue 3: "Network Error / Failed to Fetch"**
**Symptom**: Console shows network error
**Cause**: Backend not running or wrong URL
**Solution**:
1. Check backend is running: http://localhost:3001
2. Restart servers: `npm run dev:all`
3. Check firewall/antivirus not blocking

---

### **Issue 4: "Data Shows in Console But Not in Table"**
**Symptom**: Console logs show data, but table is empty
**Cause**: React state not updating or rendering issue
**Solution**:
1. Check React DevTools
2. Verify `candidates` state has data
3. Hard refresh: Ctrl + Shift + R
4. Clear browser cache

---

### **Issue 5: "Field Name Mismatch"**
**Symptom**: Some fields show "N/A" or "Unknown"
**Cause**: Backend returning different field names
**Solution**: Already fixed! The updated code handles multiple field name variations:
- `Name` or `FirstName/LastName`
- `DepartmentName` or `Department`
- `Bio` or `NominationReason` or `Achievements`
- `TotalVotesReceived` or `VoteCount`

---

## 📊 Expected Data

After loading candidates, you should see in console:

```javascript
✅ Transformed Candidates: [
  {
    id: 1,
    name: 'Alice Johnson',
    department: 'Engineering',
    achievements: 'Led 3 major projects, mentored 5 junior developers',
    voteCount: 5,
    isActive: true
  },
  {
    id: 2,
    name: 'Bob Smith',
    department: 'Marketing',
    achievements: 'Increased brand awareness by 40%',
    voteCount: 3,
    isActive: true
  },
  // ... 6 more candidates
]
```

And in the table:

| ID | Name | Department | Achievements | Votes | Status |
|----|------|------------|--------------|-------|--------|
| 1 | Alice Johnson | Engineering | Led 3 major projects... | 5 | Active |
| 2 | Bob Smith | Marketing | Increased brand awareness... | 3 | Active |

---

## 🔄 Quick Fix Checklist

Try these in order:

1. **Hard Refresh Browser**
   - Press: Ctrl + Shift + R
   - Or: Ctrl + F5

2. **Clear Console & Reload**
   - F12 → Console → Clear (trash icon)
   - Refresh page
   - Watch for new logs

3. **Logout and Login Again**
   - Click logout
   - Login with admin credentials
   - Go to Admin Dashboard

4. **Restart Servers**
   ```bash
   # Stop: Ctrl + C
   # Start:
   npm run dev:all
   ```

5. **Check Different Tab First**
   - Try Users tab first (should show 11 users)
   - If Users works but Candidates doesn't, issue is with candidates endpoint

6. **Manual API Test**
   - Use the JavaScript test from Test 2 above
   - Check actual API response

---

## 📞 What to Report

If still not working, provide these details:

1. **Console Logs**
   - Copy all logs related to candidates
   - Include any errors (red text)

2. **Network Tab Info**
   - F12 → Network
   - Filter by "candidates"
   - Show status code and response

3. **What You See**
   - Screenshot of empty table
   - Screenshot of console logs

4. **Backend Terminal Output**
   - Any errors in backend terminal
   - Database connection status

---

## ✅ Success Indicators

You'll know it's working when you see:

- ✅ No errors in console
- ✅ Logs show: `✅ Transformed Candidates: [Array(8)]`
- ✅ Table displays 8 candidates
- ✅ Each candidate has name, department, achievements
- ✅ Vote counts appear
- ✅ Can click Edit/Delete buttons

---

## 🎯 Next Steps

Once candidates appear:

1. **Test Creating a Candidate**
   - Click "➕ Add Candidate"
   - Select employee from dropdown
   - Save
   - New candidate should appear in table

2. **Test Other Tabs**
   - Check Resolutions tab
   - Check Vote Logs tab
   - Verify all show data

3. **Test CRUD Operations**
   - Edit a candidate
   - Delete a test candidate
   - Toggle active status

---

**The code is now heavily instrumented with debugging. Please refresh your browser and check the console output!** 🔍

All console logs use emoji prefixes:
- 🔍 = Investigation/Debug info
- ✅ = Success/Completed
- ⚠️ = Warning
- ❌ = Error

This will help you quickly identify what's happening!
