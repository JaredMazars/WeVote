# Voting Status Bar - Debugging Guide

## Issue: Status Bar Stuck on "Loading voting status..."

### Root Cause Analysis

The frontend was trying to access data directly from the API response, but the backend returns data nested inside a `data` property:

**Backend Response Structure:**
```json
{
  "success": true,
  "data": {
    "personalVotesRemaining": 3,
    "personalVotesTotal": 5,
    // ... other properties
  }
}
```

**Frontend was expecting:**
```json
{
  "personalVotesRemaining": 3,
  "personalVotesTotal": 5,
  // ... directly at root
}
```

### Fixes Applied

1. ✅ **Fixed data extraction** - Now correctly accessing `result.data` instead of `result`
2. ✅ **Added error state** - Component now shows errors instead of infinite loading
3. ✅ **Added debug logging** - Console logs to track the request flow
4. ✅ **Better error handling** - More descriptive error messages

### How to Debug

#### Step 1: Check Backend Server
Make sure your backend is running:

```powershell
cd server
node app.js
```

You should see:
```
Server running on port 3001
Database connected successfully
```

#### Step 2: Test API Endpoint Directly
Open a new PowerShell terminal and test the API:

```powershell
# Replace {userId} with your actual user ID (e.g., 1, 2, 3)
# Replace {token} with your JWT token from localStorage
$token = "your_jwt_token_here"
$userId = "1"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/voting-status/status/$userId" -Headers $headers -Method Get
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "personalVotesRemaining": 5,
    "personalVotesTotal": 5,
    "proxyVotesRemaining": 0,
    "proxyVotesTotal": 0,
    "totalVotesRemaining": 5,
    "totalVotesUsed": 0,
    "voteHistory": [],
    "proxyDelegations": [],
    "userInfo": {
      "voteWeight": 1,
      "maxVotesAllowed": 5,
      "minVotesRequired": 1
    }
  }
}
```

#### Step 3: Check Browser Console
1. Open your application in the browser
2. Press F12 to open Developer Tools
3. Go to the **Console** tab
4. Look for debug logs:

```
Fetching voting status for user: 1
Making API request...
Response status: 200
API Response: {success: true, data: {...}}
Transformed Data: {...}
```

**Common Error Messages:**

| Error | Cause | Solution |
|-------|-------|----------|
| `User ID not found. Please log in again.` | getCurrentUserId() returned null | Log out and log back in |
| `Authentication token not found. Please log in again.` | No token in localStorage | Log out and log back in |
| `Failed to fetch voting status: 401` | Invalid or expired token | Log out and log back in |
| `Failed to fetch voting status: 404` | User not found in database | Check if user exists in users table |
| `Failed to fetch voting status: 500` | Backend database error | Check server console for SQL errors |

#### Step 4: Check Network Tab
1. In Developer Tools, go to the **Network** tab
2. Filter for "voting-status"
3. Look for the API request
4. Check:
   - **Status Code**: Should be 200
   - **Request Headers**: Should have Authorization: Bearer {token}
   - **Response**: Should have success: true and data object

#### Step 5: Verify Database Setup
Make sure the user has vote limits set:

```sql
-- Check if user has max_votes_allowed set
SELECT id, name, email, vote_weight, max_votes_allowed, min_votes_required
FROM users
WHERE id = 1; -- Replace with your user ID

-- If max_votes_allowed is NULL, set it:
UPDATE users
SET max_votes_allowed = 5,
    min_votes_required = 1,
    vote_weight = 1.0
WHERE id = 1; -- Replace with your user ID
```

#### Step 6: Check Authentication Context
Verify the AuthContext is providing the user ID:

```javascript
// In browser console, check:
localStorage.getItem('token') // Should return a JWT token
localStorage.getItem('user')  // Should return user data JSON
```

### Quick Fix Commands

**If backend is not running:**
```powershell
cd server
node app.js
```

**If frontend is not running:**
```powershell
npm run dev
```

**Clear cache and restart:**
```powershell
# Stop both servers (Ctrl+C)
# Clear browser localStorage (F12 > Application > Local Storage > Clear All)
# Restart backend
cd server
node app.js

# In new terminal, restart frontend
npm run dev
```

### Code Changes Made

**File: `src/components/VotingStatusBar.tsx`**

1. Added error state:
```typescript
const [error, setError] = useState<string | null>(null);
```

2. Fixed data extraction:
```typescript
const result = await response.json();
const data = result.data; // Extract from nested structure
```

3. Added comprehensive logging:
```typescript
console.log('Fetching voting status for user:', userId);
console.log('Making API request...');
console.log('Response status:', response.status);
console.log('API Response:', result);
console.log('Transformed Data:', transformedData);
```

4. Better error handling:
```typescript
if (!result.success || !result.data) {
  throw new Error('Invalid API response structure');
}
```

5. Error display in UI:
```tsx
{error ? (
  <>
    <AlertCircle className="h-6 w-6 text-red-500" />
    <div>
      <span className="text-sm font-medium text-red-700">Error loading status</span>
      <p className="text-xs text-red-600 mt-1">{error}</p>
    </div>
  </>
) : (
  // Loading spinner
)}
```

### Testing Checklist

- [ ] Backend server is running on port 3001
- [ ] Frontend is running on port 5173
- [ ] User is logged in (check browser localStorage for token)
- [ ] User has max_votes_allowed set in database
- [ ] API endpoint returns 200 status
- [ ] Console shows debug logs without errors
- [ ] VotingStatusBar displays vote counts

### Expected Console Output (Success)

```
Fetching voting status for user: 1
Making API request...
Response status: 200
API Response: {
  success: true,
  data: {
    personalVotesRemaining: 5,
    personalVotesTotal: 5,
    proxyVotesRemaining: 0,
    proxyVotesTotal: 0,
    totalVotesRemaining: 5,
    totalVotesUsed: 0,
    voteHistory: [],
    proxyDelegations: [],
    userInfo: { voteWeight: 1, maxVotesAllowed: 5, minVotesRequired: 1 }
  }
}
Transformed Data: {
  personalVotesRemaining: 5,
  personalVotesTotal: 5,
  proxyVotesRemaining: 0,
  proxyVotesTotal: 0,
  totalVotesRemaining: 5,
  totalVotesUsed: 0,
  voteHistory: [],
  proxyDelegations: []
}
```

### Still Not Working?

If you're still stuck on "Loading voting status...", check the browser console and share:
1. Any error messages
2. The output of the debug logs
3. The Network tab response for the voting-status API call

This will help identify the exact issue!
