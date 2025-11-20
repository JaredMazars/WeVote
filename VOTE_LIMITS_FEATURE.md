# Vote Limits Management Feature

## Location: Admin Dashboard → Users Tab

### Overview
Regular admins can now set individual vote limits for each user through the Admin Dashboard. These limits must stay within the boundaries set by the Super Admin.

## How to Use

### 1. Access the Feature
1. Log in as an **Admin** (role_id = 1)
2. Navigate to **Admin Dashboard** (`/admin`)
3. Click on the **"Users"** tab

### 2. Set Vote Limits for a User
1. Find the user in the Users table
2. In the **"Vote Limits"** column, you'll see:
   - Current vote weight (e.g., "Weight: 1.0x")
   - Current vote range (e.g., "Range: 1 - 1")
   - Who last set the limits (if applicable)
3. Click the **green Settings icon** (⚙️) in the Actions column
4. A modal will appear showing:
   - **Super Admin Boundaries** (the limits you must work within)
   - Three input fields to configure

### 3. Configure Vote Limits

#### Vote Weight (0.1 - 10.0)
- **Purpose**: Multiplier for vote calculations
- **Example**: A weight of 1.5 means their votes count as 1.5x
- **Validation**: Must be between 0.1 and 10.0

#### Maximum Votes Allowed
- **Purpose**: The maximum number of votes this user can cast
- **Example**: If set to 3, user can vote for up to 3 candidates
- **Validation**: Must be within super admin boundaries
- **Constraint**: Between `min_individual_votes` and `max_individual_votes` set by super admin

#### Minimum Votes Required
- **Purpose**: The minimum number of votes this user must cast
- **Example**: If set to 1, user must vote for at least 1 candidate
- **Validation**: 
  - Must be ≥ super admin's `min_individual_votes`
  - Must be ≤ the `max_votes_allowed` you set above

### 4. Save Changes
- Click **"Save Limits"** button
- The system will validate against super admin boundaries
- If successful, the user's limits are updated immediately
- The Users table will refresh showing the new values

## Super Admin Boundaries

### What Are They?
Super Admin boundaries are global limits that define the range within which regular admins can assign individual user limits.

### Example Scenario

**Super Admin Sets:**
- Min Individual Votes: 1
- Max Individual Votes: 5

**Regular Admin Can:**
- ✅ Set user's max_votes_allowed to 3 (within 1-5)
- ✅ Set user's max_votes_allowed to 5 (at the upper boundary)
- ❌ Set user's max_votes_allowed to 10 (exceeds boundary)

**Regular Admin Cannot:**
- ❌ Assign more than 5 votes to any user
- ❌ Assign less than 1 vote to any user

### How to Change Boundaries
Only **Super Admins** can change these boundaries:
1. Log in as Super Admin (role_id = 0)
2. Navigate to **Super Admin Dashboard** (`/super-admin`)
3. Go to **"Vote Splitting Settings"** tab
4. Update **"Min Individual Votes"** and **"Max Individual Votes"**
5. Click **"Save Settings"**

## Users Table Columns

### Vote Limits Column
Shows three pieces of information for each user:

```
Weight: 1.5x
Range: 1 - 3
Set by: admin@company.com
```

**Explanation:**
- **Weight**: Vote multiplier (1.5x means votes count 1.5 times)
- **Range**: Minimum - Maximum votes (user can cast 1 to 3 votes)
- **Set by**: Email of admin who last updated these limits

## API Endpoints Used

### GET /api/admin/users/:id/vote-limits
**Purpose**: Fetch user's current vote limits and super admin boundaries  
**Used by**: Modal when opening to populate form  
**Returns**:
```json
{
  "success": true,
  "data": {
    "user": {
      "vote_weight": 1.0,
      "max_votes_allowed": 1,
      "min_votes_required": 1,
      "vote_limit_set_by": "admin@company.com",
      "vote_limit_updated_at": "2025-11-18T10:30:00Z"
    },
    "super_admin_boundaries": {
      "min_individual_votes": 1,
      "max_individual_votes": 5
    }
  }
}
```

### PUT /api/admin/users/:id/vote-limits
**Purpose**: Update user's vote limits  
**Used by**: Modal when saving changes  
**Request Body**:
```json
{
  "vote_weight": 1.5,
  "max_votes_allowed": 3,
  "min_votes_required": 1
}
```
**Response**:
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

## Validation Rules

### Frontend Validation (Modal)
- Vote weight input: `min="0.1" max="10" step="0.1"`
- Max votes input: `min={superAdminBoundaries.min_individual_votes} max={superAdminBoundaries.max_individual_votes}`
- Min votes input: `min={superAdminBoundaries.min_individual_votes} max={voteLimitsForm.max_votes_allowed}`

### Backend Validation (API)
1. **Vote Weight**: Must be between 0.1 and 10.0
2. **Max Votes Allowed**: 
   - Must be ≥ super admin's `min_individual_votes`
   - Must be ≤ super admin's `max_individual_votes`
3. **Min Votes Required**:
   - Must be ≥ super admin's `min_individual_votes`
   - Must be ≤ user's `max_votes_allowed`

### Error Messages
- "Max votes must be between X and Y" - Exceeded super admin boundaries
- "Min votes cannot exceed max votes allowed" - Invalid range
- "Vote weight must be between 0.1 and 10" - Invalid multiplier

## Database Schema

### Users Table (New Columns)
```sql
vote_weight decimal(5,2) NOT NULL DEFAULT 1.0
max_votes_allowed int NOT NULL DEFAULT 1
min_votes_required int NOT NULL DEFAULT 1
vote_limit_set_by nvarchar(255) NULL
vote_limit_updated_at datetime NULL
```

### Vote Splitting Settings Table
```sql
setting_name nvarchar(100) UNIQUE
is_enabled bit DEFAULT 0
min_proxy_voters int DEFAULT 1
max_proxy_voters int DEFAULT 10
min_individual_votes int DEFAULT 1  -- Used for admin boundary checking
max_individual_votes int DEFAULT 5  -- Used for admin boundary checking
created_at datetime
updated_at datetime
created_by nvarchar(255)
```

## Implementation Files

### Frontend
- **File**: `src/pages/AdminDashboard_2.tsx`
- **Key Components**:
  - Users table with "Vote Limits" column (line ~1550)
  - Settings button in Actions column (line ~1620)
  - "Set Vote Limits" modal (line ~2485)
  - `handleSetVoteLimits()` function (line ~635)
  - `handleSaveVoteLimits()` function (line ~660)

### Backend
- **File**: `server/routes/admin.js`
- **Endpoints**:
  - `GET /api/admin/users/:id/vote-limits` (line ~424)
  - `PUT /api/admin/users/:id/vote-limits` (line ~265)
  - `GET /api/admin/users` - Updated to include vote weight fields (line ~235)

### Database Migration
- **File**: `server/setup/add_user_vote_weights.sql`
- **Run this first**: Adds required columns to users table

## Setup Instructions

### 1. Run Database Migration
```sql
-- Execute this SQL script on your Azure SQL database
-- File: server/setup/add_user_vote_weights.sql
```

### 2. Restart Backend Server
```powershell
# If server is running, restart it to load new routes
# Navigate to project directory
cd "c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy"

# Kill existing node process (if any)
taskkill /f /im node.exe

# Start server
cd server
node app.js
```

### 3. Restart Frontend
```powershell
# Navigate to project directory
cd "c:\Projects\Audit\Bilal\App\project_WeVote_1 - Copy"

# Start dev server
npm run dev
```

## Testing Checklist

### As Super Admin:
- [ ] Log in to Super Admin Dashboard
- [ ] Set min_individual_votes to 1
- [ ] Set max_individual_votes to 5
- [ ] Save settings

### As Regular Admin:
- [ ] Log in to Admin Dashboard
- [ ] Navigate to Users tab
- [ ] See Vote Limits column with default values (1.0x, 1-1)
- [ ] Click Settings icon on a user row
- [ ] Modal opens showing super admin boundaries
- [ ] Try setting max_votes_allowed to 10 (should fail - exceeds boundary)
- [ ] Set max_votes_allowed to 3 (should succeed - within boundary)
- [ ] Set vote_weight to 1.5 (should succeed)
- [ ] Set min_votes_required to 1 (should succeed)
- [ ] Click "Save Limits"
- [ ] See updated values in Users table
- [ ] Verify "Set by: your-email@company.com" appears

### Database Verification:
- [ ] Check users table has new columns
- [ ] Verify vote_weight, max_votes_allowed, min_votes_required populated
- [ ] Verify vote_limit_set_by contains admin email
- [ ] Verify vote_limit_updated_at has timestamp

## Troubleshooting

### "Failed to fetch vote limits"
- **Cause**: Backend route not loaded or user ID invalid
- **Solution**: Restart backend server, check browser console for errors

### "Max votes must be between X and Y"
- **Cause**: Trying to exceed super admin boundaries
- **Solution**: Super admin must increase max_individual_votes first

### Modal doesn't open
- **Cause**: React state not initialized
- **Solution**: Check browser console, refresh page

### Vote limits not saving
- **Cause**: Database columns don't exist yet
- **Solution**: Run the add_user_vote_weights.sql migration script

### Super admin boundaries show as 1-5 but should be different
- **Cause**: Super admin hasn't updated vote splitting settings
- **Solution**: Log in as super admin and update boundaries in Super Admin Dashboard

## Future Enhancements

1. **Bulk Update**: Select multiple users and update limits at once
2. **Templates**: Create vote limit templates for different user types
3. **History**: View audit trail of all vote limit changes
4. **Import/Export**: CSV import/export of vote limit configurations
5. **Role-Based Defaults**: Auto-assign limits based on user role
6. **Notifications**: Notify users when their vote limits change

## Related Documentation
- See `SUPER_ADMIN_IMPLEMENTATION.md` for complete system overview
- See `database_setup.sql` for full database schema
- See `SUPER_ADMIN_IMPLEMENTATION.md` → "How Vote Splitting Works" for detailed explanation
