# Vote Assignment System Documentation

## Overview
The WeVote platform now includes a hierarchical vote assignment system where **Super Admins** set global vote limits and **Regular Admins** assign individual votes to users within those boundaries.

## User Roles

### Super Admin (role_id: 0)
- **Access**: `/superadmin` route
- **Permissions**:
  - Set minimum votes per user (global)
  - Set maximum votes per user (global)
  - Set default/recommended votes per user
  - Configure vote splitting settings
- **Purpose**: Define system-wide voting power boundaries

### Regular Admin (role_id: 1)
- **Access**: `/admin` route
- **Permissions**:
  - View all users in the system
  - Assign votes to individual users (within super admin limits)
  - Edit existing vote assignments
  - Manage candidates, resolutions, proxies
- **Purpose**: Distribute voting power to users based on organizational criteria

### Regular User (role_id: 2)
- **Access**: `/home`, `/voting` routes
- **Permissions**:
  - Cast votes using assigned voting power
  - View voting options (candidates/resolutions)
  - Assign proxies
- **Purpose**: Participate in voting with assigned vote count

---

## How It Works

### Step 1: Super Admin Sets Global Limits
1. Navigate to `/superadmin`
2. Go to "Global Vote Limits" tab
3. Configure three parameters:
   - **Minimum Votes Per User**: The floor (e.g., 1)
   - **Maximum Votes Per User**: The ceiling (e.g., 10)
   - **Default Votes Per User**: Recommended starting value (e.g., 3)
4. Click "Save Vote Limits"

**Example Configuration:**
```json
{
  "min_votes_per_user": 1,
  "max_votes_per_user": 10,
  "default_votes_per_user": 3
}
```

**Storage**: Settings are saved to `localStorage` as `voteLimits` (will use API in production)

---

### Step 2: Regular Admin Assigns Votes to Users
1. Navigate to `/admin`
2. Go to "Users" tab
3. Find the user in the table
4. Click "Assign Votes" or "Edit Votes" button
5. In the modal:
   - See current assignment (if any)
   - View super admin boundaries
   - Use slider or input to select vote count (1-10 based on limits)
   - Use quick select buttons (Min/Default/Max)
6. Click "Assign Votes" to save

**Validation Rules:**
- ✅ Vote count must be ≥ minimum set by super admin
- ✅ Vote count must be ≤ maximum set by super admin
- ❌ Cannot assign votes outside boundaries
- ⚠️ Warning displayed if limits are violated

---

## UI Components

### Super Admin Dashboard (`/superadmin`)

#### Global Vote Limits Tab
- **Three input cards**:
  1. **Minimum Votes** (Blue gradient)
     - Large number input
     - Description: "Every user must have at least this many votes"
  
  2. **Maximum Votes** (blue gradient)
     - Large number input
     - Description: "No user can be assigned more than this"
  
  3. **Default Votes** (Green gradient)
     - Large number input
     - Description: "Suggested starting value for new users"

- **Visual Range Indicator**: Horizontal bar showing min-default-max relationship

- **Info Box**: Explains how the system works for regular admins

- **Action Buttons**:
  - Reset to Defaults
  - Save Vote Limits (gradient button)

#### Vote Splitting Tab
- Configure proxy voting settings
- Enable/disable vote splitting
- Set min/max proxy voters and individual votes

---

### Admin Dashboard (`/admin`)

#### Users Tab Enhancements
**New Columns:**
1. **Assigned Votes Column**:
   - Displays: "3 votes" or "Not assigned"
   - Badge color: Blue/blue gradient if assigned, gray if not

2. **Actions Column**:
   - Button: "Assign Votes" (new users) or "Edit Votes" (existing)
   - Gradient blue button with Vote icon

**Vote Assignment Modal:**
```
┌──────────────────────────────────────┐
│  Assign Votes                        │
│  Set voting power for [User Name]   │
├──────────────────────────────────────┤
│  [User Profile Card]                 │
│  • Avatar                            │
│  • Name, Email, Employee ID          │
├──────────────────────────────────────┤
│  🛡️ Super Admin Set Boundaries       │
│  Between 1 and 10 votes              │
│  Recommended: 3 votes                │
├──────────────────────────────────────┤
│  Number of Votes:                    │
│  ┌───────────────────────────────┐   │
│  │          [5]                  │   │ ← Large input
│  └───────────────────────────────┘   │
│  ╞═══════●═══════════════════════╡   │ ← Slider
│  Min: 1    Default: 3    Max: 10     │
├──────────────────────────────────────┤
│  Quick Select:                       │
│  [Min (1)] [Default (3)] [Max (10)]  │
├──────────────────────────────────────┤
│  [Cancel]  [Assign Votes]            │
└──────────────────────────────────────┘
```

**Features:**
- Real-time validation with visual feedback
- Slider for easy adjustment
- Quick select buttons for common values
- Success/error messages
- Boundary enforcement

---

## Data Flow

### 1. Super Admin Configuration
```
Super Admin → Set Limits → localStorage.setItem('voteLimits')
↓
{
  min_votes_per_user: 1,
  max_votes_per_user: 10,
  default_votes_per_user: 3
}
```

### 2. Admin Loads Limits
```
Admin Dashboard → loadMockData() → localStorage.getItem('voteLimits')
↓
voteLimits state updated
↓
Modal displays boundaries
```

### 3. Admin Assigns Votes
```
Admin clicks "Assign Votes"
↓
Modal opens with user info
↓
Admin enters vote count (validated against limits)
↓
Vote count saved to user.assignedVotes
↓
User can now cast [assignedVotes] votes
```

### 4. User Casts Votes
```
User navigates to /voting/candidates
↓
System checks user.assignedVotes
↓
User can distribute votes across candidates
↓
Total votes cast cannot exceed assignedVotes
```

---

## API Endpoints (Production)

### Super Admin Endpoints
```http
# Get current vote limits
GET /api/superadmin/vote-limits
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "min_votes_per_user": 1,
    "max_votes_per_user": 10,
    "default_votes_per_user": 3,
    "updated_at": "2024-12-05T10:30:00Z"
  }
}

# Update vote limits
PUT /api/superadmin/vote-limits
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "min_votes_per_user": 1,
  "max_votes_per_user": 10,
  "default_votes_per_user": 3
}

Response:
{
  "success": true,
  "message": "Vote limits updated successfully"
}
```

### Admin Endpoints
```http
# Get user with assigned votes
GET /api/admin/users
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "assignedVotes": 5,
      ...
    }
  ]
}

# Assign votes to user
PUT /api/admin/users/{userId}/assign-votes
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "votes": 5
}

Response:
{
  "success": true,
  "message": "Assigned 5 votes to John Doe",
  "data": {
    "userId": 1,
    "assignedVotes": 5
  }
}
```

---

## Database Schema

### vote_limits Table
```sql
CREATE TABLE vote_limits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  min_votes_per_user INT NOT NULL DEFAULT 1,
  max_votes_per_user INT NOT NULL DEFAULT 10,
  default_votes_per_user INT NOT NULL DEFAULT 3,
  updated_by INT, -- super admin user_id
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

### users Table (Add Column)
```sql
ALTER TABLE users 
ADD COLUMN assigned_votes INT NULL DEFAULT NULL;

-- NULL means not assigned yet
-- Use default_votes_per_user when first assigning
```

### vote_assignments Audit Table
```sql
CREATE TABLE vote_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  assigned_by INT NOT NULL, -- admin user_id
  votes_assigned INT NOT NULL,
  previous_votes INT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);
```

---

## Security & Validation

### Frontend Validation
- Minimum vote check
- Maximum vote check
- Number format validation
- Non-negative validation

### Backend Validation (Required)
```javascript
function validateVoteAssignment(votes, userId, adminId) {
  // 1. Check admin permissions
  if (!isAdmin(adminId)) {
    throw new Error('Unauthorized');
  }
  
  // 2. Get current limits
  const limits = await getVoteLimits();
  
  // 3. Validate range
  if (votes < limits.min_votes_per_user) {
    throw new Error(`Minimum ${limits.min_votes_per_user} votes required`);
  }
  if (votes > limits.max_votes_per_user) {
    throw new Error(`Maximum ${limits.max_votes_per_user} votes allowed`);
  }
  
  // 4. Validate user exists
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return true;
}
```

### Authorization Checks
- Super admin endpoints: Verify `role_id === 0`
- Admin endpoints: Verify `role_id === 0 OR role_id === 1`
- User endpoints: Any authenticated user

---

## Use Cases

### Use Case 1: Weighted Voting by Seniority
**Scenario**: Company wants senior employees to have more voting power

**Super Admin Action**:
```
Set limits: Min=1, Max=10, Default=3
```

**Admin Action**:
```
Junior employees: 1-2 votes
Mid-level employees: 3-5 votes
Senior employees: 6-8 votes
Executives: 9-10 votes
```

---

### Use Case 2: Equal Voting for All
**Scenario**: Democratic voting where everyone has equal power

**Super Admin Action**:
```
Set limits: Min=1, Max=1, Default=1
```

**Admin Action**:
```
All users: 1 vote (no choice)
```

---

### Use Case 3: Departmental Representation
**Scenario**: Larger departments get more votes

**Super Admin Action**:
```
Set limits: Min=1, Max=20, Default=5
```

**Admin Action**:
```
Small dept (<10 people): 3 votes
Medium dept (10-50 people): 8 votes
Large dept (50+ people): 15 votes
```

---

## Testing Scenarios

### Test 1: Super Admin Flow
1. Navigate to `/superadmin`
2. Set min=2, max=8, default=5
3. Click Save
4. Verify success message
5. Check localStorage for `voteLimits`

### Test 2: Admin Assignment Flow
1. Navigate to `/admin`
2. Click "Assign Votes" on a user
3. Try entering 1 (below min=2) → Should show error
4. Try entering 10 (above max=8) → Should show error
5. Enter 5 (within range) → Should succeed
6. Verify user table shows "5 votes"

### Test 3: Edit Existing Assignment
1. Click "Edit Votes" on user with 5 votes
2. Modal shows current value: 5
3. Change to 7
4. Save
5. Verify update in table

### Test 4: Boundary Enforcement
1. Super admin sets max=3
2. Admin tries to assign 5 → Blocked
3. Super admin changes max=10
4. Admin tries to assign 5 → Allowed

---

## Troubleshooting

### Issue: Vote limits not loading in admin dashboard
**Solution**: Check localStorage for `voteLimits` key
```javascript
console.log(localStorage.getItem('voteLimits'));
```

### Issue: Modal not opening
**Solution**: Check console for errors, verify modal state
```javascript
console.log('showVoteModal:', showVoteModal);
console.log('selectedUserForVotes:', selectedUserForVotes);
```

### Issue: Validation not working
**Solution**: Verify voteLimits state is populated
```javascript
console.log('voteLimits:', voteLimits);
// Should show: { min: 1, max: 10, default: 3 }
```

### Issue: Votes not persisting
**Solution**: In production, ensure API calls complete successfully
```javascript
// Check API response
const response = await fetch('/api/admin/users/1/assign-votes', {...});
console.log(await response.json());
```

---

## Future Enhancements

1. **Bulk Assignment**: Assign votes to multiple users at once by department/role
2. **Vote Templates**: Save common vote patterns (e.g., "Senior Template" = 8 votes)
3. **History Tracking**: View who changed a user's votes and when
4. **Vote Justification**: Require admins to explain why they assigned certain vote counts
5. **Automatic Assignment**: Auto-assign default votes to new users
6. **Vote Expiration**: Time-limited voting power for temporary employees
7. **Vote Analytics**: Dashboard showing vote distribution across organization
8. **Approval Workflow**: Super admin must approve admin vote changes above certain threshold

---

## Related Files

- `/src/pages/SuperAdminDashboard.tsx` - Super admin interface
- `/src/pages/AdminDashboard.tsx` - Admin interface with vote assignment
- `/src/App.tsx` - Routes configuration
- `VOTING_RESULTS_SCALING.md` - Related voting documentation

---

## Contact & Support

For questions about vote assignment system:
- Check this documentation first
- Review code comments in SuperAdminDashboard.tsx
- Test in development environment before production
- Ensure database migrations are applied

**Last Updated**: December 5, 2025
**Version**: 1.0
**Status**: ✅ Implemented & Tested
