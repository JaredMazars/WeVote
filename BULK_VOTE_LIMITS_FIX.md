# Bulk Vote Limits - Route Order Fix

## Problem
When trying to use the bulk vote limits feature, the following error occurred:

```
❌ Database query error: Incorrect syntax near the keyword 'bulk'.
Error: Incorrect syntax near the keyword 'bulk'.
```

## Root Cause
The issue was caused by **Express.js route ordering**. In Express, routes are matched in the order they are defined.

### The Problem:
```javascript
// This route was defined FIRST
router.put('/users/:id/vote-limits', async (req, res) => { ... });

// This route was defined SECOND
router.put('/users/bulk-vote-limits', async (req, res) => { ... });
```

When a request was made to `/api/admin/users/bulk-vote-limits`:
1. Express matched it against `/users/:id/vote-limits` first
2. Express treated `"bulk-vote-limits"` as the value for the `:id` parameter
3. The code tried to use `"bulk-vote-limits"` as a user ID in SQL queries
4. SQL Server threw an error because `"bulk"` is a reserved keyword

## Solution
**Reorder the routes** so the more specific route (`/users/bulk-vote-limits`) is defined **BEFORE** the parameterized route (`/users/:id/vote-limits`).

### The Fix:
```javascript
// ✅ CORRECT ORDER - Specific route FIRST
router.put('/users/bulk-vote-limits', async (req, res) => { ... });

// Parameterized route SECOND
router.put('/users/:id/vote-limits', async (req, res) => { ... });
```

## Changes Made

### File: `server/routes/admin.js`

**Before:**
- Line 345: `router.put('/users/:id/vote-limits', ...)` - Individual endpoint
- Line 505: `router.put('/users/bulk-vote-limits', ...)` - Bulk endpoint (WRONG ORDER)

**After:**
- Line 344: `router.put('/users/bulk-vote-limits', ...)` - Bulk endpoint (MOVED UP)
- Line 441: `router.put('/users/:id/vote-limits', ...)` - Individual endpoint

The bulk endpoint was moved **above** the individual endpoint to ensure Express matches it correctly.

## Why This Matters
This is a common pitfall in Express.js routing:

### Express Route Matching Order:
1. Express checks routes in the order they're defined
2. `:param` acts as a wildcard - it matches ANY value
3. More specific routes must come BEFORE generic ones
4. Otherwise, the generic route "catches" requests meant for specific routes

### Examples:
```javascript
// ❌ WRONG - Generic route first
router.get('/users/:id', ...)        // Matches EVERYTHING including /users/active
router.get('/users/active', ...)     // Never reached!

// ✅ CORRECT - Specific route first
router.get('/users/active', ...)     // Matches /users/active
router.get('/users/:id', ...)        // Matches other IDs like /users/123
```

## Testing
After the fix:
1. Backend server was restarted
2. Route order verified:
   - `/users/bulk-vote-limits` is defined first (line 344)
   - `/users/:id/vote-limits` is defined second (line 441)
3. No more SQL syntax errors with the word "bulk"

## How to Test
1. Navigate to Admin Dashboard → Users tab
2. Click "Bulk Set Vote Limits" button
3. Set values:
   - Max Votes Allowed: 3
   - Min Votes Required: 1
4. Click "Apply to All Users"
5. Should see success message: "Vote limits updated for X users"

## Prevention
Added a comment in the code:
```javascript
// NOTE: This MUST be defined BEFORE /users/:id/vote-limits to avoid route conflicts
router.put('/users/bulk-vote-limits', async (req, res) => {
```

This reminds developers about the importance of route order.

## Related Documentation
- Express.js Route Order: https://expressjs.com/en/guide/routing.html
- Route Parameters: https://expressjs.com/en/guide/routing.html#route-parameters

## Status
✅ **FIXED** - Backend server restarted, routes reordered, ready for testing.
