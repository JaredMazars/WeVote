# CRITICAL BUG FIX: proxy_vote_form Not Being Passed to Frontend

## The Problem
Users with `proxy_vote_form = 'manual'` in the database were still seeing "Complete Proxy" button instead of "Upload Proxy Form" button after logging in.

## Root Cause
The **AuthContext.tsx** was NOT including `proxy_vote_form` in the `userData` object that it creates from the API response, even though the backend was correctly sending it.

## The Fix

### Files Changed:

#### 1. `src/contexts/AuthContext.tsx` - **CRITICAL FIX**

Added `proxy_vote_form` to **ALL 5 places** where `userData` objects are created:

**Location 1: Regular Login (line ~162)**
```typescript
const userData: User = {
  id: response.user.id.toString(),
  email: response.user.email,
  name: response.user.name,
  avatar: response.user.avatar || '',
  role: response.user.role || 'voter',
  role_id: response.user.role_id,
  surname: response.user.surname,
  email_verified: response.user.email_verified,
  needs_password_change: response.user.needs_password_change,
  is_temp_password: response.user.is_temp_password,
  proxy_vote_form: response.user.proxy_vote_form  // ← ADDED THIS!
};
```

**Location 2: Registration Auto-Login (line ~242)**
```typescript
const userData: User = {
  id: response.user.id.toString(),
  email: response.user.email,
  name: response.user.name,
  surname: response.user.surname,
  avatar: response.user.avatar || '',
  role: response.user.role, 
  role_id: response.user.role_id,
  proxy_vote_form: response.user.proxy_vote_form  // ← ADDED THIS!
};
```

**Location 3: Microsoft Login - Main (line ~296)**
```typescript
const userData: User = {
  id: response.user.id.toString(),
  email: response.user.email,
  name: response.user.name,
  surname: response.user.surname,
  avatar: response.user.avatar || '',
  role: response.user.role,
  role_id: response.user.role_id,
  proxy_vote_form: response.user.proxy_vote_form  // ← ADDED THIS!
};
```

**Location 4: Microsoft Login - Fallback 1 (line ~353)**
```typescript
const userData: User = {
  id: response.user.id.toString(),
  email: response.user.email,
  surname: response.user.surname,
  name: response.user.name,
  avatar: response.user.avatar || '',
  role: response.user.role, 
  role_id: response.user.role_id,
  proxy_vote_form: response.user.proxy_vote_form  // ← ADDED THIS!
};
```

**Location 5: Microsoft Login - Fallback 2 (line ~395)**
```typescript
const userData: User = {
  id: response.user.id.toString(),
  email: response.user.email,
  name: response.user.name,
  surname: response.user.surname,
  avatar: response.user.avatar || '',
  role: response.user.role, 
  role_id: response.user.role_id,
  proxy_vote_form: response.user.proxy_vote_form  // ← ADDED THIS!
};
```

Also added logging to track the value:
```typescript
console.log('✅ AuthContext - User Data Created:', {
  role: userData.role,
  role_id: userData.role_id,
  role_id_type: typeof userData.role_id,
  proxy_vote_form: userData.proxy_vote_form,  // ← ADDED THIS!
  id: userData.id,
  email: userData.email,
  name: userData.name
});
```

#### 2. `server/routes/auth.js`

Added logging to verify backend is sending the data:
```javascript
console.log('✅ Login successful - userData.proxy_vote_form:', userData.proxy_vote_form);
console.log('📤 Sending userData:', JSON.stringify(userData, null, 2));
```

#### 3. `server/models/User.js`

Fixed duplicate `is_active` in the `getAll()` query:
```javascript
// Before: r.name as role_name, is_active, good_standing
// After:  r.name as role_name, u.good_standing
```

## Database Verification

Confirmed that users DO have the correct values:
```
ID 171: jaredmoodley9@gmail.com → proxy_vote_form: "manual"
ID 139: bilalc8@gmail.com → proxy_vote_form: "manual"  
ID 169: jaredmoodley1212@gmail.com → proxy_vote_form: "digital"
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER LOGS IN                                             │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend (auth.js)                                         │
│    - Queries DB: SELECT ... proxy_vote_form ...             │
│    - Creates userData with proxy_vote_form: "manual"        │
│    - Sends JSON response with userData                      │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend (AuthContext.tsx) ← THE BUG WAS HERE!           │
│    - Receives response.user.proxy_vote_form: "manual"       │
│    - Creates NEW userData object                            │
│    - ❌ WAS MISSING: proxy_vote_form field                  │
│    - ✅ NOW INCLUDES: proxy_vote_form field                 │
│    - Saves to localStorage & sets React state              │
└────────────────┬────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Header Component (Header.tsx)                            │
│    - Reads user.proxy_vote_form from state                  │
│    - ✅ NOW RECEIVES: "manual"                              │
│    - Shows correct button: "Upload Proxy Form"             │
└─────────────────────────────────────────────────────────────┘
```

## Testing Instructions

### Step 1: Clear Everything
```bash
# Clear browser cache and localStorage
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Close browser and reopen
```

### Step 2: Login
```bash
# Use one of these test accounts:
- jaredmoodley9@gmail.com (proxy_vote_form = "manual")
- bilalc8@gmail.com (proxy_vote_form = "manual")
- jaredmoodley1212@gmail.com (proxy_vote_form = "digital")
```

### Step 3: Check Console Logs
You should see:
```
Backend logs (Node.js terminal):
✅ Login successful - userData.proxy_vote_form: manual
📤 Sending userData: { ... "proxy_vote_form": "manual" ... }

Frontend logs (Browser console):
✅ AuthContext - User Data Created: { ..., proxy_vote_form: 'manual', ... }
🔍 Header - proxy_vote_form from user: manual
🔘 renderProxyButton called with: { hasProxyGroups: false, proxyChoice: 'manual', ... }
✅ Showing Upload Proxy Form button (manual)
```

### Step 4: Verify Button
- For `manual`: Should see **"Upload Proxy Form"** button with Upload icon
- For `digital`: Should see **"Complete Proxy"** button with FolderPlus icon

## Why This Bug Happened

The bug occurred because there were **two separate userData objects**:

1. **Backend Response** (had `proxy_vote_form` ✅)
2. **AuthContext Creation** (was missing `proxy_vote_form` ❌)

Even though the backend correctly included the field, the AuthContext was **manually creating a new object** and **only copying specific fields**, and `proxy_vote_form` was not in the list!

## Prevention

To prevent this in the future:
1. Use TypeScript interfaces strictly (already done with `User` interface)
2. Use object spread operator to copy all fields: `const userData = { ...response.user }`
3. Add unit tests to verify all user fields are preserved
4. Use console.log to verify data at each stage of the flow

## Related Files
- ✅ `src/contexts/AuthContext.tsx` - **MAIN FIX** (5 locations)
- ✅ `server/routes/auth.js` - Added logging
- ✅ `server/models/User.js` - Fixed duplicate field
- ✅ `src/components/Header.tsx` - Already had correct logic
- ✅ `src/contexts/AuthContext.tsx` User interface - Already had correct type

## Summary
**The backend was working perfectly.** The bug was in the frontend AuthContext not copying the `proxy_vote_form` field from the API response to the userData object. Now fixed in all 5 login flows!
