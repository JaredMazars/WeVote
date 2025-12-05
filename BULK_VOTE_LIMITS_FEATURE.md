# Bulk Vote Limits Feature

## Overview
This feature allows admins to set vote limits (vote weight, max votes allowed, and min votes required) for **all users at once** instead of setting them individually.

## Features Added

### Frontend (AdminDashboard_2.tsx)
1. **New Button**: "Bulk Set Vote Limits" button in the Users tab header (purple button)
2. **New Modal**: Bulk Vote Limits modal with:
   - Warning message about applying to all users
   - Super Admin Boundaries display
   - Vote weight input (0.1 - 10.0)
   - Max votes allowed input (within super admin boundaries)
   - Min votes required input

### Backend (server/routes/admin.js)
1. **New Endpoint**: `PUT /api/admin/users/bulk-vote-limits`
   - Validates inputs against super admin boundaries
   - Updates all users (excluding super admin, role_id != 0)
   - Tracks who set the limits and when
   - Returns count of updated users

## Usage

### For Admins:
1. Navigate to the **Users** tab in the Admin Dashboard
2. Click the **"Bulk Set Vote Limits"** button (purple, next to "Add User")
3. Review the super admin boundaries displayed
4. Set the desired values:
   - **Vote Weight**: Multiplier for vote calculations (0.1 - 10.0)
   - **Max Votes Allowed**: Maximum votes a user can cast (within boundaries)
   - **Min Votes Required**: Minimum votes a user must cast (≥ boundaries.min)
5. Click **"Apply to All Users"**
6. All users will be updated with the same limits

### Warning
⚠️ This action applies the same limits to **ALL USERS** in the system. This cannot be easily undone. Use with caution!

## API Endpoint Details

### Request
```http
PUT /api/admin/users/bulk-vote-limits
Authorization: Bearer <token>
Content-Type: application/json

{
  "vote_weight": 1.5,
  "max_votes_allowed": 3,
  "min_votes_required": 1
}
```

### Response
```json
{
  "success": true,
  "message": "Vote limits updated for 25 users",
  "data": {
    "updated_count": 25,
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

1. **Vote Weight**: Must be between 0.1 and 10.0
2. **Max Votes Allowed**: Must be within super admin boundaries (min_individual_votes to max_individual_votes)
3. **Min Votes Required**: Must be ≥ min_individual_votes and ≤ max_votes_allowed
4. **Super Admin Excluded**: The bulk update excludes users with role_id = 0 (super admins)

## Database Updates

The bulk update modifies the following columns in the `users` table:
- `vote_weight`
- `max_votes_allowed`
- `min_votes_required`
- `vote_limit_set_by` (admin's email)
- `vote_limit_updated_at` (timestamp)

## Comparison: Individual vs Bulk

### Individual Vote Limits
- Use the **Settings icon** (⚙️) next to each user
- Opens modal for that specific user
- Updates only one user at a time
- Shows current values for that user

### Bulk Vote Limits
- Use the **"Bulk Set Vote Limits"** button in Users tab header
- Opens modal with warning message
- Updates ALL users at once (except super admins)
- Provides count of users updated

## Technical Implementation

### Frontend State
```typescript
const [showBulkVoteLimitsModal, setShowBulkVoteLimitsModal] = useState(false);
const [bulkVoteLimitsForm, setBulkVoteLimitsForm] = useState({
  vote_weight: 1.0,
  max_votes_allowed: 1,
  min_votes_required: 1
});
```

### Handler Functions
- `handleOpenBulkVoteLimits()`: Fetches super admin boundaries and opens modal
- `handleSaveBulkVoteLimits()`: Sends bulk update request to backend

### Modal Features
- Purple color scheme to distinguish from individual limits (green)
- Warning notice with yellow background
- Super admin boundaries display
- All users count notification in success message

## Testing Checklist

- [ ] Click "Bulk Set Vote Limits" button
- [ ] Verify modal opens with correct boundaries
- [ ] Set vote weight (e.g., 1.5)
- [ ] Set max votes allowed (e.g., 3)
- [ ] Set min votes required (e.g., 1)
- [ ] Click "Apply to All Users"
- [ ] Verify success message shows correct count
- [ ] Check Users table - all users should have updated limits
- [ ] Verify vote_limit_set_by shows admin email
- [ ] Test with invalid values (should show error)
- [ ] Verify super admin user is NOT updated

## Files Modified

### Frontend
- `src/pages/AdminDashboard_2.tsx`:
  - Added state variables for bulk modal
  - Added handler functions
  - Added "Bulk Set Vote Limits" button
  - Added bulk modal component

### Backend
- `server/routes/admin.js`:
  - Added `PUT /api/admin/users/bulk-vote-limits` endpoint
  - Validates against super admin boundaries
  - Updates all non-super-admin users
  - Returns count of updated users

## Notes

- The bulk update is atomic - either all users are updated or none
- Super admins (role_id = 0) are excluded from bulk updates
- The admin who performs the bulk update is tracked in `vote_limit_set_by`
- Timestamp is recorded in `vote_limit_updated_at` for audit purposes
