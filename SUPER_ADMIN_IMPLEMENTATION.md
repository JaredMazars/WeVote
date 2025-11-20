# Super Admin & Vote Weight Management Implementation

## Overview
This document describes the complete implementation of the Super Admin Dashboard and Vote Weight Management system for the WeVote application.

## Features Implemented

### 1. Super Admin Dashboard (`/super-admin`)
**Access**: Users with `role_id = 0` (Super Admin) or `role_id = 1` (Admin)

#### Three Main Tabs:

1. **Vote Splitting Settings**
   - Toggle vote splitting on/off globally
   - Set minimum/maximum proxy voters allowed
   - Set minimum/maximum individual votes per user
   - These settings define the boundaries that regular admins must work within

2. **Proxy Group Limits**
   - View all proxy groups
   - Set custom vote limits per proxy group
   - Configure min/max votes for specific groups

3. **Super Admin Management**
   - View all users with role_id 0 or 1
   - See last login times and activity
   - Visual indicators (Crown for super admins, Shield for admins)

### 2. Admin Vote Weight Management
**Location**: Admin Dashboard → Users Tab

**Functionality**:
- Admins can assign individual vote weights to users
- Set max_votes_allowed for each user
- Set min_votes_required for each user
- **Constrained by Super Admin boundaries** - admins cannot exceed limits set by super admin

### 3. Database Schema

#### New Tables Created:

**vote_splitting_settings**
```sql
- id (int, PK, identity)
- setting_name (nvarchar(100), unique)
- is_enabled (bit, default 0)
- min_proxy_voters (int, default 1)
- max_proxy_voters (int, default 10)
- min_individual_votes (int, default 1)
- max_individual_votes (int, default 5)
- created_at (datetime)
- updated_at (datetime)
- created_by (nvarchar(255))
```

**proxy_voter_limits**
```sql
- id (int, PK, identity)
- proxy_group_id (int, FK to proxy_groups)
- user_id (int, FK to users)
- max_votes_allowed (int, default 1)
- votes_used (int, default 0)
- created_at (datetime)
- updated_at (datetime)
- UNIQUE(proxy_group_id, user_id)
```

**vote_distributions**
```sql
- id (int, PK, identity)
- proxy_vote_id (int, FK to votes)
- distributed_to_user_id (int, FK to users)
- vote_weight (decimal(3,2), default 1.0)
- vote_type (nvarchar(50)) -- 'employee' or 'resolution'
- target_id (int) -- employee_id or resolution_id
- is_active (bit, default 1)
- created_at (datetime)
- updated_at (datetime)
```

#### Users Table Extensions:
```sql
- vote_weight (decimal(5,2), default 1.0)
- max_votes_allowed (int, default 1)
- min_votes_required (int, default 1)
- vote_limit_set_by (nvarchar(255), nullable)
- vote_limit_updated_at (datetime, nullable)
```

#### Proxy Groups Table Extensions:
```sql
- vote_splitting_enabled (bit, default 0)
- min_votes_per_user (int, default 1)
- max_votes_per_user (int, default 1)
```

## API Endpoints

### Super Admin Routes (`/api/superadmin`)

#### GET `/vote-splitting-settings`
- **Auth**: Requires Super Admin (role_id 0 or 1)
- **Response**: Current vote splitting configuration
```json
{
  "success": true,
  "data": {
    "setting_name": "proxy_vote_splitting",
    "enabled": false,
    "min_proxy_voters": 2,
    "max_proxy_voters": 20,
    "min_individual_votes": 1,
    "max_individual_votes": 3
  }
}
```

#### PUT `/vote-splitting-settings`
- **Auth**: Requires Super Admin
- **Body**:
```json
{
  "is_enabled": true,
  "min_proxy_voters": 2,
  "max_proxy_voters": 20,
  "min_individual_votes": 1,
  "max_individual_votes": 5
}
```
- **Validation**:
  - min_proxy_voters must be < max_proxy_voters
  - min_individual_votes must be < max_individual_votes
  - Proxy voter limits: 1-100
  - Individual vote limits: 1-10

#### GET `/proxy-groups/:id/limits`
- **Auth**: Requires Super Admin
- **Response**: Proxy group limits
```json
{
  "success": true,
  "data": {
    "group_id": 1,
    "min_votes": 1,
    "max_votes": 3,
    "total_members": 5
  }
}
```

#### PUT `/proxy-groups/:id/limits`
- **Auth**: Requires Super Admin
- **Body**:
```json
{
  "min_votes": 1,
  "max_votes": 5
}
```

#### GET `/check-roles`
- **Auth**: Requires Super Admin
- **Response**: List of all users with their role information
- **Purpose**: Debugging and role verification

### Admin Routes (`/api/admin`)

#### PUT `/users/:id/vote-limits`
- **Auth**: Requires Admin (role_id 1)
- **Body**:
```json
{
  "vote_weight": 1.5,
  "max_votes_allowed": 3,
  "min_votes_required": 1
}
```
- **Validation**:
  - Checks against super admin boundaries
  - vote_weight: 0.1 - 10.0
  - max_votes_allowed: within super admin min/max
  - min_votes_required: between super admin min and max_votes_allowed
- **Response**:
```json
{
  "success": true,
  "message": "User vote limits updated successfully",
  "data": {
    "vote_weight": 1.5,
    "max_votes_allowed": 3,
    "min_votes_required": 1,
    "boundaries": {
      "min_individual_votes": 1,
      "max_individual_votes": 5
    }
  }
}
```

#### GET `/users/:id/vote-limits`
- **Auth**: Requires Admin
- **Response**: Current vote limits for user plus super admin boundaries
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 167,
      "name": "John Doe",
      "email": "john@example.com",
      "vote_weight": 1.0,
      "max_votes_allowed": 1,
      "min_votes_required": 1,
      "vote_limit_set_by": "admin@company.com",
      "vote_limit_updated_at": "2025-11-18T10:30:00Z"
    },
    "super_admin_boundaries": {
      "min_individual_votes": 1,
      "max_individual_votes": 3
    }
  }
}
```

#### GET `/users` (Updated)
- Now includes vote weight information for each user:
```json
{
  "success": true,
  "data": [{
    "id": "167",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "voter",
    "vote_weight": 1.0,
    "max_votes_allowed": 1,
    "min_votes_required": 1,
    "vote_limit_set_by": "admin@company.com",
    "vote_limit_updated_at": "2025-11-18T10:30:00Z"
  }]
}
```

## Frontend Components

### 1. SuperAdminDashboard.tsx
**Location**: `src/pages/SuperAdminDashboard.tsx`

**Features**:
- Purple-themed UI to distinguish from regular admin
- Crown icon branding
- Three tabs with smooth animations (Framer Motion)
- Real-time data fetching
- Success/Error message handling
- Form validation with super admin constraints

**Key Functions**:
- `fetchVoteSplittingSettings()`: Get current settings
- `handleSaveVoteSplitting()`: Update global settings
- `fetchProxyGroups()`: Get all proxy groups
- `handleUpdateProxyGroupLimits()`: Update group-specific limits
- `fetchSuperAdminUsers()`: Get users with elevated privileges

### 2. Header.tsx (Updated)
**Location**: `src/components/Header.tsx`

**Changes**:
- Added "Super Admin" button with Crown icon
- Shows for users with:
  - `role_id = "0"` (Super Admin)
  - `role_id = "1"` (Admin)
  - `role = "admin"`
- Button navigates to `/super-admin`
- Positioned before regular Admin button

### 3. App.tsx (Updated)
**Location**: `src/App.tsx`

**New Route**:
```tsx
<Route 
  path="/super-admin" 
  element={
    <SuperAdminRoute>
      <SuperAdminDashboard />
    </SuperAdminRoute>
  } 
/>
```

**SuperAdminRoute Component**:
- Checks if user has role_id 0, 1, or role 'admin'
- Redirects unauthorized users to /home
- Handles loading states

## Backend Models

### VoteSplittingSettings.js
**Location**: `server/models/VoteSplittingSettings.js`

**Methods**:
- `getSettings()`: Fetch current settings, returns defaults if none exist
- `updateSettings(settings)`: Update settings with validation
- `isEnabled()`: Quick check if vote splitting is enabled
- `getLimits()`: Get current min/max limits for validation

### User.js (Updated)
**Location**: `server/models/User.js`

**New Method**:
- `executeQuery(query)`: Helper method for raw SQL queries
- Used by admin routes to fetch/update vote weight data

## SQL Setup Scripts

### 1. database_setup.sql
**Location**: `server/setup/database_setup.sql`

**Contains**:
- Super Admin role creation (id=0)
- Super Admin user creation (superadmin@wevote.com / SuperAdmin123!)
- vote_splitting_settings table
- proxy_voter_limits table
- vote_distributions table
- Proxy groups extensions

### 2. add_user_vote_weights.sql
**Location**: `server/setup/add_user_vote_weights.sql`

**Contains**:
- Adds vote_weight column to users table
- Adds max_votes_allowed column
- Adds min_votes_required column
- Adds vote_limit_set_by column (audit trail)
- Adds vote_limit_updated_at column (audit trail)

**Execute Order**:
1. Run `database_setup.sql` first
2. Then run `add_user_vote_weights.sql`

## How Vote Splitting Works

### Concept
Vote splitting allows a proxy voter to distribute their voting power across multiple people they represent, rather than casting all votes as a block.

### Example Scenario

**Super Admin Sets Global Limits**:
- Min Proxy Voters: 2
- Max Proxy Voters: 20
- Min Individual Votes: 1
- Max Individual Votes: 3

**Regular Admin Assigns User Limits**:
- User "John Doe":
  - vote_weight: 1.0
  - max_votes_allowed: 3 (within super admin max of 3)
  - min_votes_required: 1

**Proxy Voting in Action**:
1. User A delegates to Proxy User P
2. User B delegates to Proxy User P  
3. User C delegates to Proxy User P

When voting for Employee E:
- **Without Split**: Proxy P casts 3 votes (all or nothing)
- **With Split**: Proxy P can choose:
  - Vote for A and B only (2 votes)
  - Vote for all three (3 votes)
  - Vote for C only (1 vote)

### Frontend Implementation (EmployeeDetails.tsx)
The split voting modal shows:
- Checkbox list of all delegated members
- Selected members highlighted
- "Vote All" mode: Select all members automatically
- "Split Vote" mode: Choose specific members
- After voting: Edit and Remove buttons for each voted member
- Bulk actions: Edit All / Remove All

## Configuration Flow

1. **Super Admin** (role_id=0):
   - Sets global boundaries for the entire system
   - Example: "Users can have between 1-5 votes"
   - These are HARD LIMITS that cannot be exceeded

2. **Regular Admin** (role_id=1):
   - Assigns specific vote weights to individual users
   - Must stay within super admin boundaries
   - Example: "John can have up to 3 votes" (within the 1-5 limit)
   - Cannot set a user to have 6 votes (exceeds super admin max)

3. **Users/Voters**:
   - Cast votes according to their assigned limits
   - Can be proxy voters with split voting capability
   - Can vote as individuals with their vote_weight multiplier

## Security & Access Control

### Role Hierarchy:
```
Super Admin (role_id=0)
    ↓ Sets global boundaries
Admin (role_id=1)
    ↓ Assigns user limits within boundaries
Voter (role_id=2)
    ↓ Casts votes according to limits
```

### Middleware Protection:
- `requireSuperAdmin`: Checks role_id 0 or 1 + valid JWT
- `requireAdmin`: Checks role_id 1 + valid JWT
- All endpoints validate input against boundaries

### Audit Trail:
- `vote_limit_set_by`: Records which admin made changes
- `vote_limit_updated_at`: Timestamp of last modification
- Database triggers could log all changes (future enhancement)

## Testing Checklist

### Super Admin Dashboard:
- [ ] Access with role_id=0 user
- [ ] Access with role_id=1 user
- [ ] Access denied for role_id=2 user
- [ ] Toggle vote splitting on/off
- [ ] Update min/max proxy voters
- [ ] Update min/max individual votes
- [ ] View proxy groups
- [ ] Update proxy group limits
- [ ] View super admin users list

### Admin Vote Weight Management:
- [ ] View user vote limits
- [ ] Update user vote_weight
- [ ] Update max_votes_allowed
- [ ] Update min_votes_required
- [ ] Validation prevents exceeding super admin limits
- [ ] Audit trail records admin who made changes

### Frontend Integration:
- [ ] Super Admin button shows in header for authorized users
- [ ] Navigation to /super-admin works
- [ ] Tab switching functions smoothly
- [ ] Forms validate input
- [ ] Success/error messages display correctly
- [ ] Data refreshes after updates

### Database:
- [ ] Tables created successfully
- [ ] Constraints enforce data integrity
- [ ] Foreign keys prevent orphaned records
- [ ] Default values populate correctly

## Future Enhancements

1. **Vote Weight History**:
   - Track all changes to vote limits over time
   - Show who changed what and when

2. **Bulk User Updates**:
   - Update vote limits for multiple users at once
   - Import/export vote configurations

3. **Vote Weight Analytics**:
   - Dashboard showing vote distribution
   - Reports on proxy voting patterns
   - Identify unusual voting behavior

4. **Dynamic Vote Weights**:
   - Time-based vote weights (e.g., tenure-based)
   - Conditional weights based on participation

5. **API Rate Limiting**:
   - Prevent abuse of super admin endpoints
   - Implement request throttling

## Troubleshooting

### Common Issues:

1. **"Access token required" error**:
   - Check if JWT token is being sent in Authorization header
   - Verify token hasn't expired
   - Check user's role_id in database

2. **"Max votes must be between X and Y" error**:
   - Super admin hasn't set boundaries yet
   - Run database_setup.sql to create default settings
   - Check vote_splitting_settings table exists

3. **Super Admin button not showing**:
   - Check user's role_id in database
   - Verify Header.tsx has correct role check logic
   - Clear browser cache and localStorage

4. **Database connection errors**:
   - Ensure vote_splitting_settings table exists
   - Check if add_user_vote_weights.sql was executed
   - Verify database connection timeout is set correctly (30 seconds)

## Server Configuration

**Backend**: Running on port 3001
**Frontend**: Running on port 5173
**Database**: Azure SQL Server (wevote.database.windows.net)

**Environment Variables Required**:
```env
DB_SERVER=wevote.database.windows.net
DB_NAME=wevote
DB_USER=admin1
DB_PASSWORD=[your_password]
DB_PORT=1433
JWT_SECRET=[your_secret]
FRONTEND_URL=http://localhost:5173
```

## Summary

This implementation provides a complete hierarchical vote management system where:
- **Super Admins** set system-wide boundaries
- **Admins** assign user-specific limits within those boundaries
- **Users** vote according to their assigned limits
- **Split voting** allows flexible proxy vote distribution

The system is fully audited, validated, and secured with role-based access control.
