# API Debugging Guide - Admin Dashboard Data Loading

## Current Issues Fixed

### 1. **Response Format Mismatch** ✅
- **Problem**: Backend returns `{count, users}` but frontend expected `{success, data}`
- **Solution**: Updated `api.ts` request() method to transform backend responses automatically
- **Handles**: users, candidates, resolutions, history, proxies, votes, logs, allocations

### 2. **Incorrect API Endpoints** ✅
- **Problem**: Frontend called `/api/votes` but backend has `/api/votes/history`
- **Solution**: Updated API methods to use correct endpoints
  - Vote Logs: `/api/votes/history` instead of `/api/votes`
  - Candidate Votes: `/api/votes/results/candidates/:sessionId`
  - Resolution Votes: `/api/votes/results/resolutions/:sessionId`

### 3. **Missing AGM Session in Vote Logs** ✅
- **Problem**: Vote logs didn't show which AGM session the vote was cast in
- **Solution**: 
  - Updated VoteLog interface to include `sessionTitle` and `sessionId`
  - Updated loadVoteLogs() to extract session info from API response
  - Added "AGM Session" column to vote logs table
  - Backend already includes SessionTitle in getUserVotingHistory query

### 4. **Debug Logging Added** ✅
- Added console.log statements in API service to see:
  - Endpoint being called
  - Response status and data keys
  - Transformed data
- Check browser console (F12) for API debugging info

---

## How to Test Data Loading

### Step 1: Open Browser Console
1. Open http://localhost:5173
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Login with: `admin@forvismazars.com` / `Demo@123`

### Step 2: Navigate to Admin Dashboard
Click on "Admin Dashboard" to access admin panel

### Step 3: Check Each Tab

#### **Users Tab**
**Expected API Call**: `GET /api/users`

**Console Output Should Show**:
```
API Response from /users: {status: 200, ok: true, dataKeys: ['count', 'users'], data: {...}}
Transformed data for /users: [{UserID: 1, FirstName: 'Super', ...}, ...]
```

**Table Should Display**:
- 11 users from database
- Names: Super Admin, Admin User, Auditor User, etc.
- Employee IDs: EMP0001, EMP0002, etc.
- Active statuses

**If No Data Shows**:
1. Check console for API errors
2. Check Network tab for HTTP 200 response
3. Verify backend is running on port 3001
4. Try manual API call:
```bash
# Get token first
$body = @{email="admin@forvismazars.com"; password="Demo@123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.token
$headers = @{Authorization="Bearer $token"}

# Test users endpoint
Invoke-RestMethod -Uri "http://localhost:3001/api/users" -Headers $headers
```

---

#### **Candidates Tab**
**Expected API Call**: `GET /api/candidates`

**Console Output Should Show**:
```
API Response from /candidates: {status: 200, ok: true, dataKeys: ['count', 'candidates'], data: {...}}
Transformed data for /candidates: [{CandidateID: 1, FirstName: 'Alice', ...}, ...]
```

**Table Should Display**:
- 8 candidates from database
- Names: Alice Johnson, Bob Smith, Carol White, etc.
- Departments: Engineering, Marketing, HR, Sales, Finance, Operations
- Vote counts (if votes were cast)

---

#### **Resolutions Tab**
**Expected API Call**: `GET /api/resolutions`

**Console Output Should Show**:
```
API Response from /resolutions: {status: 200, ok: true, dataKeys: ['count', 'resolutions'], data: {...}}
Transformed data for /resolutions: [{ResolutionID: 1, Title: 'Remote Work...', ...}, ...]
```

**Table Should Display**:
- 5 resolutions from database
- Titles: Remote Work Policy Extension, Office Renovation Budget, etc.
- Vote counts: YesVotes, NoVotes, AbstainVotes
- Status: active, closed, pending

---

#### **Vote Logs Tab**
**Expected API Call**: `GET /api/votes/history`

**Console Output Should Show**:
```
API Response from /votes/history: {status: 200, ok: true, dataKeys: ['count', 'history'], data: {...}}
Transformed data for /votes/history: [{VoteID: 1, VoteType: 'candidate', SessionTitle: '2024 AGM', ...}, ...]
```

**Table Should Display**:
- ID, User, **AGM Session**, Type, Target, Vote Weight, Proxy Vote, Timestamp
- Session column should show "2024 Annual General Meeting"
- Vote types: candidate or resolution
- Targets: Candidate names or resolution titles

**New Column**: AGM Session column now visible!

---

#### **Proxy Groups Tab**
**Expected API Call**: `GET /api/proxy/assignments`

**If No Data**: Proxy assignments may be empty if no proxies were appointed

---

#### **Audit Logs Tab**
**Currently**: Returns empty array (audit endpoint not implemented yet)

---

## Common Issues & Solutions

### Issue 1: "No data showing in tables"
**Symptoms**: Tables are empty, no error messages

**Debug Steps**:
1. Open browser console (F12)
2. Look for API response logs
3. Check Network tab for API calls
4. Verify HTTP 200 responses

**Possible Causes**:
- Backend not running → Start with `npm run dev:all`
- Not logged in → Check localStorage for token
- Wrong endpoint → Check console logs for endpoint called
- Data transformation issue → Check "Transformed data" console log

**Solution**:
```bash
# Restart both servers
Ctrl+C  # Stop current servers
npm run dev:all
```

### Issue 2: "401 Unauthorized"
**Symptoms**: API calls return 401 error

**Cause**: Not logged in or token expired

**Solution**:
1. Logout
2. Login again with `admin@forvismazars.com` / `Demo@123`
3. Check localStorage has token: `localStorage.getItem('token')`

### Issue 3: "Candidates/Resolutions show but no details"
**Symptoms**: Names missing, departments show "N/A"

**Cause**: Data transformation not mapping correctly

**Debug**:
1. Check console log "Transformed data"
2. Check what fields backend returns
3. May need to adjust transformation in `loadCandidates()` or `loadResolutions()`

**Solution**: Check the actual field names returned:
```javascript
// In AdminDashboard.tsx loadCandidates()
console.log('Raw candidate data:', response.data[0]);
```

### Issue 4: "AGM Session not showing in Vote Logs"
**Symptoms**: Session column empty or shows "Unknown Session"

**Cause**: Backend not including SessionTitle in response

**Debug**:
```javascript
// In AdminDashboard.tsx loadVoteLogs()
console.log('Raw vote log data:', response.data[0]);
```

**Check**: Does backend Vote.getUserVotingHistory include SessionTitle?

---

## Manual API Testing

### Test Users API
```powershell
$body = @{email="admin@forvismazars.com"; password="Demo@123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.token
$headers = @{Authorization="Bearer $token"}

Write-Host "Testing Users API..."
$users = Invoke-RestMethod -Uri "http://localhost:3001/api/users" -Headers $headers
Write-Host "Users Count: $($users.count)"
$users.users | Select-Object -First 3 | Format-Table UserID, FirstName, LastName, Email
```

### Test Candidates API
```powershell
Write-Host "`nTesting Candidates API..."
$candidates = Invoke-RestMethod -Uri "http://localhost:3001/api/candidates" -Headers $headers
Write-Host "Candidates Count: $($candidates.count)"
$candidates.candidates | Select-Object -First 3 | Format-Table CandidateID, FirstName, LastName, DepartmentName
```

### Test Resolutions API
```powershell
Write-Host "`nTesting Resolutions API..."
$resolutions = Invoke-RestMethod -Uri "http://localhost:3001/api/resolutions" -Headers $headers
Write-Host "Resolutions Count: $($resolutions.count)"
$resolutions.resolutions | Format-Table ResolutionID, Title, Status
```

### Test Vote History API
```powershell
Write-Host "`nTesting Vote History API..."
$history = Invoke-RestMethod -Uri "http://localhost:3001/api/votes/history" -Headers $headers
Write-Host "Vote History Count: $($history.count)"
$history.history | Select-Object -First 5 | Format-Table VoteID, VoteType, SessionTitle, EntityName, VotesAllocated
```

---

## Expected Console Output

When everything is working, you should see:

```
API Response from /users: {status: 200, ok: true, dataKeys: Array(2), data: {…}}
Transformed data for /users: (11) [{…}, {…}, {…}, ...]

API Response from /candidates: {status: 200, ok: true, dataKeys: Array(2), data: {…}}
Transformed data for /candidates: (8) [{…}, {…}, {…}, ...]

API Response from /resolutions: {status: 200, ok: true, dataKeys: Array(2), data: {…}}
Transformed data for /resolutions: (5) [{…}, {…}, {…}, ...]

API Response from /votes/history: {status: 200, ok: true, dataKeys: Array(2), data: {…}}
Transformed data for /votes/history: (13) [{…}, {…}, {…}, ...]
```

---

## Quick Fixes

### If Users Not Showing
```typescript
// Check in browser console:
localStorage.getItem('token')  // Should return JWT token
api.getUsers()  // Should return {success: true, data: [...]}
```

### If Vote Logs Missing Session
```typescript
// Check vote log structure:
api.getVoteLogs().then(r => console.log('Vote logs:', r.data[0]))
// Should have: VoteType, SessionTitle, SessionID, EntityName, VotesAllocated
```

### Clear Cache and Reload
```javascript
// In browser console:
localStorage.clear()
location.reload()
// Then login again
```

---

## Success Criteria

✅ **Users Tab**: Shows 11 users with names, emails, employee IDs  
✅ **Candidates Tab**: Shows 8 candidates with departments and vote counts  
✅ **Resolutions Tab**: Shows 5 resolutions with vote breakdowns  
✅ **Vote Logs Tab**: Shows votes with **AGM Session column** displaying "2024 Annual General Meeting"  
✅ **No hardcoded data**: All data comes from database  
✅ **Console logs**: Show successful API calls and data transformation  

---

## Need More Help?

1. **Check backend logs**: Look at terminal running backend for SQL errors
2. **Check database**: Run queries in Azure Data Studio to verify data exists
3. **Check Network tab**: See exact API requests/responses
4. **Check Console tab**: See JavaScript errors and API logs
5. **Test APIs manually**: Use PowerShell commands above

**Everything should now be pulling live data from the database!** 🎉
