# Voting Status - Parameter & Column Fixes ✅

## Errors Fixed
1. ❌ **"Must declare the scalar variable @userId"**
2. ❌ **"Invalid column name 'name'"** (employees table)
3. ❌ **"Invalid column name 'department'"** (employees & resolutions tables)
4. ❌ **"Invalid column name 'proxy_name'"** (proxy_groups table)

## Root Causes

### Issue 1: Parameter Syntax
The `database.query()` function doesn't support parameterized queries with object parameters. It only executes raw SQL strings.

### Issue 2: Wrong Column References
The queries tried to access columns that don't exist:
- `e.name` - Employee names are stored in the `users` table (via `user_id` FK)
- `e.department` - Department names are in the `departments` table (via `department_id` FK)
- `r.department` - Resolutions table doesn't have a `department` column
- `pg.proxy_name` - proxy_groups table doesn't have a `proxy_name` column (use principal's name instead)

## Solutions Applied

### Fix 1: Parameter Syntax
Changed from `@userId` parameters to direct `${userIdInt}` interpolation with proper `parseInt()` validation.

### Fix 2: Proper Table JOINs
Updated queries to use correct JOINs:

**Before (Broken):**
```sql
CASE 
  WHEN v.vote_type = 'employee' THEN e.name          -- ❌ Column doesn't exist
  WHEN v.vote_type = 'resolution' THEN r.title
END as target_name,
CASE 
  WHEN v.vote_type = 'employee' THEN e.department    -- ❌ Column doesn't exist
  WHEN v.vote_type = 'resolution' THEN r.department  -- ❌ Column doesn't exist
END as target_department
FROM votes v
LEFT JOIN employees e ON v.employee_id = e.id
LEFT JOIN resolutions r ON v.resolution_id = r.id
```

**After (Fixed):**
```sql
CASE 
  WHEN v.vote_type = 'employee' THEN u_emp.name      -- ✅ From users table
  WHEN v.vote_type = 'resolution' THEN r.title
  ELSE NULL
END as target_name,
CASE 
  WHEN v.vote_type = 'employee' THEN d.name          -- ✅ From departments table
  ELSE NULL                                           -- ✅ Resolutions don't have dept
END as target_department
FROM votes v
LEFT JOIN employees e ON v.employee_id = e.id
LEFT JOIN users u_emp ON e.user_id = u_emp.id        -- ✅ JOIN to get employee name
LEFT JOIN departments d ON e.department_id = d.id    -- ✅ JOIN to get department
LEFT JOIN resolutions r ON v.resolution_id = r.id
```

## Changes Made in `server/routes/voting-status.js`

### Personal Votes Query:
```javascript
LEFT JOIN employees e ON v.employee_id = e.id
LEFT JOIN users u_emp ON e.user_id = u_emp.id        // ← Added
LEFT JOIN departments d ON e.department_id = d.id    // ← Added  
LEFT JOIN resolutions r ON v.resolution_id = r.id
```

### Proxy Votes Query:
```javascript
LEFT JOIN employees e ON v.employee_id = e.id
LEFT JOIN users u_emp ON e.user_id = u_emp.id        // ← Added
LEFT JOIN departments d ON e.department_id = d.id    // ← Added
LEFT JOIN resolutions r ON v.resolution_id = r.id
LEFT JOIN proxy_groups pg ON v.proxy_id = pg.id
LEFT JOIN users delegator ON pg.principal_id = delegator.id
```

## All Fixes Summary

1. ✅ User query: `WHERE id = ${userIdInt}`
2. ✅ Personal votes: Added `users` and `departments` JOINs
3. ✅ Proxy votes: Added `users` and `departments` JOINs, removed `proxy_name`
4. ✅ Proxy delegations: Removed `proxy_name`, use `delegator_name` instead
5. ✅ Summary endpoint: `WHERE id = ${userIdInt}` and `WHERE voter_id = ${userIdInt}`
6. ✅ Target names: Use `u_emp.name` instead of `e.name`
7. ✅ Departments: Use `d.name` instead of `e.department` or `r.department`
8. ✅ Proxy names: Use `delegator_name` (principal's name) instead of `proxy_name`

## Testing

**Restart backend and refresh browser - VotingStatusBar should now work!**

Backend console should show:
```
Fetching voting status for user: 167
User query result: [...]
Fetching personal votes...
Personal votes count: 0
Fetching proxy votes...
Proxy votes count: 0
Fetching proxy delegations...
Proxy delegations count: 0
```

Frontend should display: **"1 vote left"** (or custom amount if set by admin)

## Database Schema Reference

### employees table structure:
- `id` - Primary key
- `user_id` - FK to users table (for name, email, avatar)
- `department_id` - FK to departments table (for department name)
- `position` - Direct column
- `bio`, `years_of_service`, etc.

### votes table structure:
- `voter_id` - FK to users table
- `employee_id` - FK to employees table (for employee votes)
- `resolution_id` - FK to resolutions table (for resolution votes)
- `proxy_id` - FK to proxy_groups table (NULL for personal votes)
- `vote_choice`, `vote_weight`, etc.

## Status: ✅ ALL FIXED
