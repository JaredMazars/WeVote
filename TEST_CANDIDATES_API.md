# Test Candidates API Endpoint

## Quick Browser Console Test

Open browser console (F12) and run:

```javascript
// Get token
const token = localStorage.getItem('token');

// Test candidates endpoint
fetch('http://localhost:3001/api/candidates', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('=== RAW CANDIDATES RESPONSE ===');
  console.log('Response:', data);
  console.log('Keys:', Object.keys(data));
  if (data.candidates) {
    console.log('Candidates Array:', data.candidates);
    console.log('First Candidate:', data.candidates[0]);
    console.log('Candidate Fields:', data.candidates[0] ? Object.keys(data.candidates[0]) : 'none');
  }
  if (data.data) {
    console.log('Data Array:', data.data);
    console.log('First Item:', data.data[0]);
  }
});
```

## PowerShell Test

```powershell
# Login first
$body = @{email="admin@forvismazars.com"; password="Demo@123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.token
$headers = @{Authorization="Bearer $token"}

# Get candidates
$candidates = Invoke-RestMethod -Uri "http://localhost:3001/api/candidates" -Headers $headers

Write-Host "`n=== CANDIDATES RESPONSE ===" -ForegroundColor Cyan
Write-Host "Count: $($candidates.count)" -ForegroundColor Yellow
Write-Host "`nResponse Keys: $($candidates | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)" -ForegroundColor Yellow

if ($candidates.candidates) {
    Write-Host "`nFirst Candidate:" -ForegroundColor Green
    $candidates.candidates[0] | Format-List
    
    Write-Host "`nAll Candidates:" -ForegroundColor Green
    $candidates.candidates | Format-Table CandidateID, FirstName, LastName, Department, Status -AutoSize
} else {
    Write-Host "`nNo 'candidates' property found. Full response:" -ForegroundColor Red
    $candidates | ConvertTo-Json -Depth 3
}
```

## Expected Response Format

The backend should return:
```json
{
  "count": 8,
  "candidates": [
    {
      "CandidateID": 1,
      "SessionID": 1,
      "FirstName": "Alice",
      "LastName": "Johnson",
      "Email": "alice@forvismazars.com",
      "Department": "Engineering",
      "DepartmentName": "Engineering",
      "Position": "Senior Developer",
      "Bio": "Led 3 major projects...",
      "Status": "active",
      "TotalVotesReceived": 5,
      "CreatedAt": "2024-12-08..."
    }
  ]
}
```

## Frontend Expects

After transformation in `api.ts`:
```json
{
  "success": true,
  "data": [
    {
      "CandidateID": 1,
      "FirstName": "Alice",
      "LastName": "Johnson",
      ...
    }
  ],
  "message": "Success"
}
```

## Troubleshooting Steps

1. **Check if candidates exist in database**
   ```sql
   SELECT COUNT(*) FROM Candidates;
   SELECT TOP 5 * FROM Candidates;
   ```

2. **Check browser console logs**
   - Look for: `API Response from /candidates:`
   - Look for: `Transformed data for /candidates:`
   - Look for: `🔍 Candidates Response:`

3. **Check Network tab**
   - Open DevTools → Network
   - Filter by "candidates"
   - Check response status (should be 200)
   - Check response payload

4. **Common Issues**

   **Issue**: Empty array returned
   - No candidates in database
   - Wrong session filter
   - Status filter excluding all

   **Issue**: 401 Unauthorized
   - Not logged in
   - Token expired
   - Logout and login again

   **Issue**: Response has data but table empty
   - Field name mismatch
   - Check console logs for transformation
   - Verify field mapping in loadCandidates()

## Debug Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Logged in as admin
- [ ] Token exists in localStorage
- [ ] Candidates tab selected
- [ ] Browser console open (F12)
- [ ] Check for `🔍 Candidates Response:` log
- [ ] Check for `✅ Transformed Candidates:` log
- [ ] Check for any error messages

## Manual Data Check

If still empty, manually check database:

```javascript
// In browser console after login
async function testCandidates() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/api/candidates', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  console.log('Status:', response.status);
  console.log('Response:', data);
  console.log('Has candidates?', !!data.candidates);
  console.log('Count:', data.count);
  
  if (data.candidates && data.candidates.length > 0) {
    console.log('Sample candidate:', data.candidates[0]);
  } else {
    console.log('❌ No candidates found!');
    console.log('Full response structure:', Object.keys(data));
  }
}

testCandidates();
```
