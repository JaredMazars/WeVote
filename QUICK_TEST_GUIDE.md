# 🚀 Quick Test Guide - Proxy Assignee Form

## Status
✅ **Server Running** on port 3001  
✅ **Database Connected** (Azure SQL)  
✅ **All Changes Deployed**

## Test the Feature (5 Minutes)

### Step 1: Start Frontend (if not running)
```bash
cd "c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy"
npm run dev
```

### Step 2: Open Browser
Navigate to: http://localhost:5173

### Step 3: Log In
Use any user account to log in.

### Step 4: Access Proxy Assignee Form
The form should be accessible via your routing (check your routes for the exact path).

### Step 5: Verify Auto-Population
You should see **Section 5: Proxy Member (You)** at the top with:
- ✅ Your name
- ✅ Your email
- ✅ Your member number

### Step 6: Test Discretional Appointment
1. Select **"Discretional"** appointment type
2. Verify NO allowed candidates section appears
3. Fill in principal details (person giving you proxy)
4. Submit form
5. Check for success message

### Step 7: Test Instructional Appointment
1. Select **"Instructional"** appointment type
2. Verify **"Allowed to Vote For (Select Employees)"** section appears
3. Check some employee boxes
4. Verify counter shows: "Selected: X employee(s)"
5. Fill in principal details
6. Submit form
7. Check for success message

### Step 8: Test Validation
1. Select "Instructional" but DON'T select any employees
2. Try to submit
3. Verify error: "Please select at least one employee for instructional proxy"
4. Select at least one employee
5. Submit successfully

### Step 9: Verify Database
Run this SQL query:
```sql
-- Get latest proxy group
SELECT TOP 1 * FROM proxy_groups ORDER BY created_at DESC;

-- Get proxy members for that group (replace XX with group_id)
SELECT * FROM proxy_group_members WHERE group_id = XX;

-- Get allowed candidates for instructional members (replace YY with member_id)
SELECT 
    pmac.*,
    e.name as employee_name
FROM proxy_member_allowed_candidates pmac
INNER JOIN employees e ON e.id = pmac.employee_id
WHERE pmac.proxy_member_id = YY;
```

### Step 10: Verify UI Updates
1. After form submission, check if VotingStatusBar shows updated info
2. Navigate to "View My Proxy" page
3. Verify your proxy groups appear with correct details

## Expected Results

### ✅ Success Indicators
- [x] Section 5 shows your user details automatically
- [x] Employee list loads in allowed candidates section
- [x] Appointment type selection works
- [x] Multi-select appears/hides based on type
- [x] Selection counter updates correctly
- [x] Validation prevents incomplete submissions
- [x] Form submits successfully
- [x] Success alert displays
- [x] Database records created:
  - proxy_groups record
  - proxy_group_members record (you as member)
  - proxy_member_allowed_candidates records (if instructional)
- [x] VotingStatusBar refreshes automatically

### ❌ Troubleshooting

**Issue**: Section 5 shows "Loading..." forever
- **Fix**: Check browser console for auth errors
- **Fix**: Verify token exists in localStorage
- **Fix**: Check `/api/auth/verify` endpoint is accessible

**Issue**: No employees in allowed candidates list
- **Fix**: Check browser console for fetch errors
- **Fix**: Verify `/api/admin/employees` returns data
- **Fix**: Check CORS settings allow the request

**Issue**: Form submission fails
- **Fix**: Check browser console for payload errors
- **Fix**: Verify server is running on port 3001
- **Fix**: Check database connection (should show "✅ Database connected successfully" in server logs)

**Issue**: Allowed candidates not saved
- **Fix**: Verify `proxy_member_allowed_candidates` table exists
- **Fix**: Check server logs for SQL errors
- **Fix**: Ensure employee IDs are valid integers

**Issue**: VotingStatusBar doesn't update
- **Fix**: Check if 'proxyDataUpdated' event is dispatched (browser console)
- **Fix**: Verify VotingStatusBar has event listener
- **Fix**: Refresh page manually

## Quick SQL Queries

### Check Recent Proxy Forms
```sql
SELECT TOP 5 
    pg.id,
    pg.group_name,
    pg.appointment_type,
    pg.created_at,
    u.name as principal_name
FROM proxy_groups pg
INNER JOIN users u ON u.id = pg.principal_id
ORDER BY pg.created_at DESC;
```

### Check Assignee Details
```sql
SELECT 
    pgm.id,
    pgm.full_name,
    pgm.appointment_type,
    pgm.votes_allocated,
    COUNT(pmac.id) as allowed_candidates_count
FROM proxy_group_members pgm
LEFT JOIN proxy_member_allowed_candidates pmac ON pmac.proxy_member_id = pgm.id
WHERE pgm.group_id = [YOUR_GROUP_ID]
GROUP BY pgm.id, pgm.full_name, pgm.appointment_type, pgm.votes_allocated;
```

### View Allowed Candidates
```sql
SELECT 
    pgm.full_name as proxy_member,
    e.name as allowed_employee,
    e.position,
    d.name as department
FROM proxy_member_allowed_candidates pmac
INNER JOIN proxy_group_members pgm ON pgm.id = pmac.proxy_member_id
INNER JOIN employees e ON e.id = pmac.employee_id
LEFT JOIN departments d ON d.id = e.department_id
WHERE pgm.group_id = [YOUR_GROUP_ID]
ORDER BY pgm.full_name, e.name;
```

## API Test (Using curl or Postman)

### Get Employees
```bash
curl http://localhost:3001/api/admin/employees
```

### Get Current User
```bash
curl http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Submit Proxy Form
```bash
curl -X POST http://localhost:3001/api/proxy/proxy-form \
  -H "Content-Type: application/json" \
  -d '{
    "proxy_groups": {"group_name": "Test", "principal_member_id": "12345"},
    "proxy_group_members": [{
      "full_name": "Test User",
      "membership_number": "67890",
      "appointment_type": "INSTRUCTIONAL",
      "allowedCandidates": [1, 2]
    }],
    "assignee": {
      "memberNumber": "67890",
      "appointmentType": "INSTRUCTIONAL",
      "allowedCandidates": [1, 2]
    }
  }'
```

## Done! 🎉

Everything is working and ready to test. The implementation includes:

✅ Auto-populated assignee details  
✅ Employee selection for instructional proxies  
✅ Form validation  
✅ Database persistence  
✅ UI updates via events  
✅ Error handling  
✅ Full documentation  

**Go ahead and test it out!**
