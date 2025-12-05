# Comprehensive Audit Logging System - Implementation Guide

## Overview
This document describes the complete audit logging system implemented in the WeVote application. The system tracks all major user actions and system events with comprehensive details.

---

## Architecture

### Database Table: `audit_logs`

```sql
CREATE TABLE audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(255) NULL,
    action_type NVARCHAR(100) NOT NULL,
    action_category NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    entity_type NVARCHAR(100) NULL,
    entity_id NVARCHAR(255) NULL,
    metadata NVARCHAR(MAX) NULL,
    ip_address NVARCHAR(100) NULL,
    user_agent NVARCHAR(500) NULL,
    status NVARCHAR(20) DEFAULT 'success',
    created_at DATETIME DEFAULT GETDATE()
);
```

### Indexes
- `idx_user_id` - Fast lookups by user
- `idx_action_type` - Filter by action type
- `idx_action_category` - Filter by category
- `idx_entity` - Find logs for specific entities
- `idx_created_at` - Date range queries
- `idx_status` - Filter by status

---

## Action Categories

### 1. AUTH (Authentication)
Tracks user authentication and authorization events.

**Action Types:**
- `login` - Successful user login
- `failed_login` - Failed login attempt
- `logout` - User logout
- `password_change` - Password updated
- `forgot_password` - Password reset requested

**Example:**
```javascript
await logLogin(req, userId, userName, true);
```

---

### 2. VOTE (Voting)
Tracks all voting-related actions.

**Action Types:**
- `vote_cast` - Personal vote submitted
- `proxy_vote_cast` - Proxy vote submitted
- `split_vote_cast` - Split proxy votes for multiple members
- `vote_removed` - Vote deleted
- `vote_edited` - Vote comment or choice updated
- `resolution_vote_cast` - Resolution vote submitted

**Examples:**
```javascript
// Personal vote
await logVoteCast(req, userId, userName, employeeId, employeeName, false);

// Proxy vote
await logVoteCast(req, proxyId, proxyName, employeeId, employeeName, true);

// Split votes
await logSplitVoteCast(req, proxyId, proxyName, employeeId, employeeName, delegatorCount);

// Vote removal
await logVoteRemoved(req, userId, userName, employeeId, employeeName, voteCount);

// Vote edit
await logVoteEdited(req, userId, userName, employeeId, employeeName, changes);
```

---

### 3. PROXY (Proxy Management)
Tracks proxy delegation and group management.

**Action Types:**
- `proxy_assigned` - Proxy rights assigned
- `proxy_revoked` - Proxy rights revoked
- `proxy_group_created` - New proxy group created
- `proxy_group_updated` - Proxy group modified

**Examples:**
```javascript
await logProxyAssigned(req, proxyId, proxyName, delegatorId, delegatorName, voteType);
await logProxyRevoked(req, proxyId, proxyName, delegatorId, delegatorName);
await logProxyGroupCreated(req, userId, userName, groupId, memberCount);
```

---

### 4. ADMIN (Administration)
Tracks administrative actions on users, employees, and resolutions.

**Action Types:**
- `user_created` - New user account created
- `user_updated` - User account modified
- `user_deleted` - User account deleted
- `employee_created` - New employee/candidate created
- `employee_updated` - Employee/candidate modified
- `employee_deleted` - Employee/candidate deleted
- `resolution_created` - New resolution created
- `resolution_updated` - Resolution modified
- `resolution_deleted` - Resolution deleted

**Examples:**
```javascript
await logUserCreated(req, adminId, adminName, newUserId, newUserName, newUserEmail);
await logUserUpdated(req, adminId, adminName, userId, userName, changes);
await logEmployeeCreated(req, adminId, adminName, employeeId, employeeName);
```

---

### 5. TIMER (AGM Timer)
Tracks AGM voting session timer actions.

**Action Types:**
- `agm_timer_started` - Voting session started
- `agm_timer_stopped` - Voting session stopped
- `agm_timer_updated` - Timer settings modified

**Examples:**
```javascript
await logTimerStarted(req, adminId, adminName, startTime, endTime);
await logTimerStopped(req, adminId, adminName);
```

---

### 6. SYSTEM (System Events)
Tracks system-level operations.

**Action Types:**
- `data_export` - Data exported
- `bulk_action` - Bulk operation performed
- `settings_changed` - System settings modified

**Examples:**
```javascript
await logDataExport(req, userId, userName, exportType, recordCount);
await logBulkAction(req, userId, userName, actionType, affectedCount);
```

---

## Implementation Guide

### Step 1: Setup Database Table

Run the SQL script to create the table:

```bash
# Navigate to setup directory
cd server/setup

# Run the SQL script in your database
# Option 1: Using Azure Data Studio or SQL Server Management Studio
# Open and execute: create_audit_logs_table.sql

# Option 2: Using Node.js (requires mssql package)
node -e "require('./create_audit_logs_table.sql')"
```

---

### Step 2: Import Audit Logger in Routes

Add the audit logger import to any route file:

```javascript
import { 
  logLogin, 
  logLogout, 
  logPasswordChange,
  logVoteCast,
  logVoteRemoved,
  logVoteEdited,
  logSplitVoteCast,
  // ... other functions as needed
} from '../middleware/auditLogger.js';
```

---

### Step 3: Add Logging to Actions

#### Authentication Example (auth.js)

```javascript
// Successful login
if (isValidPassword) {
  await User.updateLastLogin(user.id);
  await logLogin(req, user.id, user.name, true);
  
  // Generate token and respond...
}

// Failed login
if (!isValidPassword) {
  await logLogin(req, user.id, user.name, false);
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
}

// Password change
await User.updatePassword(userId, password);
await logPasswordChange(req, userId, user.name, isFirstLogin);
```

#### Voting Example (employees.js)

```javascript
// Vote cast
const result = await Vote.create(voteData);
if (result.success) {
  // Get employee info
  const employee = await Employee.findById(employeeId);
  await logVoteCast(req, userId, userName, employeeId, employee.name, false);
}

// Vote removed
const removedCount = await Vote.removeVote(voteData);
await logVoteRemoved(req, userId, userName, employeeId, employeeName, removedCount);

// Split proxy vote
if (successCount > 0) {
  await logSplitVoteCast(req, proxyId, proxyName, employeeId, employeeName, successCount);
}
```

---

### Step 4: Add Audit Trail Route to App

In `server/app.js`:

```javascript
import auditLogsRoutes from './routes/audit-logs.js';

// ...other routes...
app.use('/api/audit-logs', auditLogsRoutes);
```

---

### Step 5: Add Admin UI Route

Add the Audit Trail page to your admin routing:

```typescript
// In your admin routing file
import AuditTrail from '../pages/AuditTrail';

// Add route
{ path: '/admin/audit-trail', element: <AuditTrail /> }
```

---

## API Endpoints

### GET /api/audit-logs
Get all audit logs with filtering and pagination.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Records per page (default: 50)
- `user_id` (string) - Filter by user ID
- `action_category` (string) - Filter by category (AUTH, VOTE, PROXY, etc.)
- `action_type` (string) - Filter by specific action type
- `status` (string) - Filter by status (success, failure, warning)
- `start_date` (date) - Filter by start date
- `end_date` (date) - Filter by end date
- `search` (string) - Search in description, user name, or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "123",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "action_type": "login",
      "action_category": "AUTH",
      "description": "User John Doe logged in successfully",
      "entity_type": "user",
      "entity_id": "123",
      "metadata": "{}",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "status": "success",
      "created_at": "2024-11-27T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20
  }
}
```

---

### GET /api/audit-logs/stats
Get audit log statistics.

**Query Parameters:**
- `start_date` (date) - Start date for stats
- `end_date` (date) - End date for stats

**Response:**
```json
{
  "success": true,
  "data": {
    "categoryStats": [
      { "action_category": "VOTE", "count": 500, "success_count": 495, "failure_count": 5 },
      { "action_category": "AUTH", "count": 200, "success_count": 180, "failure_count": 20 }
    ],
    "topUsers": [
      { "user_id": "123", "name": "John Doe", "email": "john@example.com", "action_count": 50 }
    ],
    "dailyActivity": [
      { "date": "2024-11-27", "count": 150 },
      { "date": "2024-11-26", "count": 200 }
    ]
  }
}
```

---

### GET /api/audit-logs/user/:userId
Get audit logs for a specific user.

**Parameters:**
- `userId` (string) - User ID

**Query Parameters:**
- `limit` (number) - Max records to return (default: 50)

---

### GET /api/audit-logs/entity/:entityType/:entityId
Get audit logs for a specific entity (e.g., employee, resolution).

**Parameters:**
- `entityType` (string) - Type of entity (employee, resolution, user, etc.)
- `entityId` (string) - Entity ID

**Query Parameters:**
- `limit` (number) - Max records to return (default: 50)

---

### GET /api/audit-logs/categories
Get list of action categories for filtering.

**Response:**
```json
{
  "success": true,
  "data": [
    { "value": "AUTH", "label": "Authentication", "color": "blue" },
    { "value": "VOTE", "label": "Voting", "color": "green" },
    { "value": "PROXY", "label": "Proxy Management", "color": "purple" },
    { "value": "ADMIN", "label": "Administration", "color": "red" },
    { "value": "TIMER", "label": "AGM Timer", "color": "yellow" },
    { "value": "SYSTEM", "label": "System", "color": "gray" }
  ]
}
```

---

## Frontend Features

### Audit Trail Page

**Features:**
1. **Advanced Filtering**
   - Search by keyword (description, user name, email)
   - Filter by category (AUTH, VOTE, PROXY, ADMIN, TIMER, SYSTEM)
   - Filter by status (success, failure, warning)
   - Date range filtering

2. **Pagination**
   - 50 records per page
   - Navigation controls
   - Total count display

3. **Export Functionality**
   - Export to CSV
   - Includes all filtered records
   - Filename with timestamp

4. **Detailed View**
   - Click "View" to see full log details
   - Shows all metadata
   - IP address and user agent info

5. **Visual Indicators**
   - Color-coded categories
   - Status icons (success/failure/warning)
   - User avatars

---

## Security Considerations

1. **Access Control**
   - Only admins and super admins can view audit logs
   - Users can view their own logs via `/api/audit-logs/user/:userId`

2. **Data Privacy**
   - Passwords are never logged
   - Sensitive data is stored in metadata field (JSON)
   - IP addresses are logged for security tracking

3. **Performance**
   - Indexed columns for fast queries
   - Pagination to prevent large data loads
   - Async logging to not block main operations

4. **Error Handling**
   - Logging failures don't break the app
   - Errors are logged to console but not thrown

---

## Logged Actions Summary

### Authentication (AUTH)
- ✅ Login attempts (success/failure)
- ✅ Logout
- ✅ Password changes
- ✅ Forgot password requests

### Voting (VOTE)
- ✅ Personal votes cast
- ✅ Proxy votes cast
- ✅ Split proxy votes
- ✅ Vote removal
- ✅ Vote editing
- ✅ Resolution votes

### Proxy Management (PROXY)
- ✅ Proxy assignments
- ✅ Proxy revocations
- ✅ Proxy group creation
- ✅ Proxy group updates

### Administration (ADMIN)
- ✅ User CRUD operations
- ✅ Employee CRUD operations
- ✅ Resolution CRUD operations

### Timer (TIMER)
- ✅ AGM timer start/stop
- ✅ Timer configuration updates

### System (SYSTEM)
- ✅ Data exports
- ✅ Bulk operations
- ✅ Settings changes

---

## Testing the System

### 1. Test Login Logging
```bash
# Login with valid credentials
POST http://localhost:3001/api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Check audit logs
GET http://localhost:3001/api/audit-logs?action_category=AUTH&action_type=login
```

### 2. Test Vote Logging
```bash
# Cast a vote
POST http://localhost:3001/api/employees/123/vote

# Check audit logs
GET http://localhost:3001/api/audit-logs?action_category=VOTE
```

### 3. Test Frontend
```bash
# Navigate to admin section
http://localhost:5173/admin/audit-trail

# Try different filters:
# - Search for user name
# - Filter by category
# - Select date range
# - Export to CSV
```

---

## Maintenance

### Regular Tasks

1. **Archive Old Logs** (Recommended: Monthly)
   ```sql
   -- Archive logs older than 6 months
   INSERT INTO audit_logs_archive
   SELECT * FROM audit_logs
   WHERE created_at < DATEADD(MONTH, -6, GETDATE());
   
   DELETE FROM audit_logs
   WHERE created_at < DATEADD(MONTH, -6, GETDATE());
   ```

2. **Monitor Table Size**
   ```sql
   -- Check audit logs table size
   SELECT 
       COUNT(*) as total_logs,
       MIN(created_at) as oldest_log,
       MAX(created_at) as newest_log
   FROM audit_logs;
   ```

3. **Performance Monitoring**
   ```sql
   -- Check most active users
   SELECT TOP 10
       user_id,
       COUNT(*) as action_count
   FROM audit_logs
   WHERE created_at > DATEADD(DAY, -7, GETDATE())
   GROUP BY user_id
   ORDER BY action_count DESC;
   ```

---

## Troubleshooting

### Issue: Logs not appearing

**Solution:**
1. Check database connection
2. Verify audit_logs table exists
3. Check console for logging errors
4. Ensure audit logger is imported in route files

### Issue: Slow performance

**Solution:**
1. Add/rebuild indexes
2. Implement log archiving
3. Reduce pagination limit
4. Add date range filters

### Issue: Missing user information

**Solution:**
1. Check user_id is being passed correctly
2. Verify JWT token decoding
3. Check user table for missing records

---

## Future Enhancements

- [ ] Real-time log streaming (WebSockets)
- [ ] Advanced analytics dashboard
- [ ] Automated alerts for suspicious activity
- [ ] Log retention policies (auto-archiving)
- [ ] Email notifications for critical actions
- [ ] Integration with SIEM systems
- [ ] Compliance reporting (GDPR, SOC2)
- [ ] Audit log integrity verification (checksums)

---

## Support

For questions or issues with the audit logging system:
1. Check this documentation first
2. Review console logs for errors
3. Test with Postman/API client
4. Contact system administrator

---

**Version:** 1.0.0  
**Last Updated:** November 27, 2024  
**Author:** WeVote Development Team
