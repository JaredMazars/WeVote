# Proxy Management with Voting Protection - Implementation Guide

## Overview
This feature allows users to view and manage their proxy groups with built-in protection against editing once votes have been cast. The system automatically switches the header button from "Complete Proxy" to "View My Proxy" based on whether the user has created proxy groups.

## Key Features

### 1. Dynamic Header Button
- **Before Proxy Creation**: Shows "Complete Proxy" button
- **After Proxy Creation**: Shows "View My Proxy" button
- Automatically checks proxy status on page load
- Updates in real-time when proxy groups are created/modified

### 2. Voting Protection System
- **Locked Groups**: Once ANY proxy member votes on behalf of the principal, the entire group becomes locked
- **Locked Members**: Individual members who have voted cannot be removed
- **Visual Indicators**: 
  - 🔒 Lock icon on groups/members that cannot be edited
  - Orange badges for members who have voted
  - Banner explaining why editing is disabled

### 3. View My Proxy Page
- Displays all proxy groups where user is the principal
- Shows detailed information about each proxy member
- Appointment type badges (DISCRETIONARY/INSTRUCTIONAL/MIXED)
- Active/Inactive status indicators
- AGM voting instructions (if applicable)
- Allowed candidates list for INSTRUCTIONAL proxies

### 4. Edit Capabilities
- ✅ **Can Edit When**:
  - No proxy members have cast votes
  - Group is in pending/inactive state
  - Individual member hasn't voted yet

- ❌ **Cannot Edit When**:
  - Any proxy member has voted on behalf of principal
  - Member has cast at least one vote
  - Votes have been recorded in the system

### 5. Integration with Voting Status Bar
- Real-time updates when proxy data changes
- "My Proxy Members" tab shows same information
- Event-driven refresh system using `proxyDataUpdated` event

## Technical Implementation

### Backend API Endpoints

#### 1. Check Proxy Status
```javascript
GET /api/proxy/proxy-status/:userId
Response: {
  success: true,
  hasProxyGroups: boolean,
  groupCount: number
}
```
**Purpose**: Determines which button to show in header

#### 2. Check Voting Status
```javascript
GET /api/proxy/proxy-voting-status/:userId
Response: {
  success: true,
  canEdit: boolean,
  anyVotesCast: boolean,
  membersWhoVoted: [...],
  allMembers: [...]
}
```
**Purpose**: Checks if any proxy member has voted

#### 3. Get Proxy Groups for Editing
```javascript
GET /api/proxy/proxy-groups/:userId/edit
Response: {
  success: true,
  data: [
    {
      id, group_name, appointment_type, is_active,
      has_votes_cast: 0 or 1,
      canEdit: boolean,
      proxy_group_members: [
        {
          id, name, email, appointment_type,
          has_voted: 0 or 1,
          allowed_candidates: [...]
        }
      ]
    }
  ]
}
```
**Purpose**: Fetches all proxy groups with vote status flags

#### 4. Update Proxy Group
```javascript
PUT /api/proxy/proxy-group/:groupId
Body: { userId, groupName, appointmentType, agmVotes, members }
Response: {
  success: true,
  message: 'Proxy group updated successfully'
}
```
**Protection**: Returns 403 if votes have been cast

#### 5. Remove Proxy Member
```javascript
DELETE /api/proxy/proxy-member/:memberId?userId=:userId
Response: {
  success: true,
  message: 'Proxy member removed successfully'
}
```
**Protection**: Returns 403 if member has voted

#### 6. Add Proxy Member
```javascript
POST /api/proxy/proxy-member
Body: { groupId, userId, member: {...} }
Response: {
  success: true,
  message: 'Proxy member added successfully',
  memberId: number
}
```
**Protection**: Returns 403 if group has votes cast

### Frontend Components

#### Header.tsx Changes
```typescript
// State for proxy status
const [hasProxyGroups, setHasProxyGroups] = useState(false);
const [checkingProxy, setCheckingProxy] = useState(true);

// Check proxy status on mount
useEffect(() => {
  const checkProxyStatus = async () => {
    const response = await fetch(`/api/proxy/proxy-status/${user.id}`);
    const result = await response.json();
    setHasProxyGroups(result.hasProxyGroups);
  };
  checkProxyStatus();
}, [user?.id]);

// Conditional button rendering
{!checkingProxy && (
  <button onClick={() => navigate(hasProxyGroups ? '/view-my-proxy' : `/proxy-choice/${user.id}`)}>
    {hasProxyGroups ? (
      <>
        <Eye className="h-4 w-4" />
        <span>View My Proxy</span>
      </>
    ) : (
      <>
        <FolderPlus className="h-4 w-4" />
        <span>Complete Proxy</span>
      </>
    )}
  </button>
)}
```

#### ViewMyProxy.tsx
New page component that displays:
- All proxy groups where user is principal
- Detailed member information
- Edit/delete controls (conditionally enabled)
- Visual lock indicators
- Explanatory banners

#### VotingStatusBar.tsx Changes
```typescript
// Added event listener for proxy updates
useEffect(() => {
  fetchVotingStatus();

  const handleProxyUpdate = () => {
    console.log('Proxy data updated, refreshing...');
    fetchVotingStatus();
  };

  window.addEventListener('proxyDataUpdated', handleProxyUpdate);
  
  return () => {
    window.removeEventListener('proxyDataUpdated', handleProxyUpdate);
  };
}, [getCurrentUserId]);
```

### Database Queries

#### Check if Votes Cast
```sql
SELECT COUNT(*) as vote_count
FROM votes v
INNER JOIN proxy_group_members pgm ON v.voted_by_id = pgm.member_id
WHERE pgm.group_id = @groupId AND v.voted_for_id = @userId
```

#### Get Members with Vote Status
```sql
SELECT 
  pgm.*,
  u.name,
  u.email,
  CASE WHEN EXISTS (
    SELECT 1 FROM votes v 
    WHERE v.voted_by_id = pgm.member_id AND v.voted_for_id = @userId
  ) THEN 1 ELSE 0 END as has_voted
FROM proxy_group_members pgm
LEFT JOIN users u ON u.id = pgm.member_id
WHERE pgm.group_id = @groupId
```

## User Workflows

### Workflow 1: First-Time Proxy Setup
1. User logs in → sees "Complete Proxy" button
2. Clicks button → navigates to proxy choice page
3. Completes proxy form
4. Submits form → proxy group created
5. Header button automatically changes to "View My Proxy"
6. Can click to view/edit proxy configuration

### Workflow 2: Viewing Existing Proxies
1. User clicks "View My Proxy" in header
2. Page displays all proxy groups
3. Each group shows:
   - Group name and type
   - Active/inactive status
   - List of proxy members
   - Member appointment types
   - Allowed candidates (for INSTRUCTIONAL)
4. Green checkmarks indicate editable items
5. Lock icons indicate protected items

### Workflow 3: Editing Before Voting
1. User on "View My Proxy" page
2. No votes have been cast yet
3. User can:
   - Click "Add Proxy Member" button
   - Click trash icon to remove members
   - Navigate to edit group settings
4. Changes saved successfully
5. VotingStatusBar automatically updates

### Workflow 4: Attempted Edit After Voting
1. Proxy member casts vote on user's behalf
2. User navigates to "View My Proxy"
3. Group/member shows with lock icon
4. Orange "Has Voted" badge visible
5. Delete/edit buttons disabled
6. Banner explains why editing blocked:
   > "This proxy group is locked for editing. One or more proxy members have already cast votes on your behalf. To maintain voting integrity, this group cannot be modified."

### Workflow 5: Mixed Voting Status
1. Group has 3 members: A, B, C
2. Member A votes → Member A locked
3. Members B and C haven't voted → B and C editable
4. User can still remove B or C
5. User CANNOT remove A
6. User CANNOT add new members (group has votes)

## Visual Design Elements

### Color Coding
- **Green badges**: DISCRETIONARY appointment, Active status, Can edit
- **Orange badges**: INSTRUCTIONAL appointment, Has voted, Warning
- **Blue badges**: MIXED appointment type
- **Gray badges**: Inactive status
- **Red icons**: Delete/remove actions

### Icons
- 👥 `Users` - Proxy groups
- 👤 `User` - Individual proxy member
- 🔒 `Lock` - Cannot edit/locked
- ✓ `CheckCircle` - Can vote for anyone
- ⚠️ `AlertCircle` - Restricted voting
- 🏆 `Award` - Allowed candidate
- 🏢 `Building2` - Department
- 🗑️ `Trash2` - Remove member
- ➕ `Plus` - Add member
- 🛡️ `Shield` - Protection message
- 👁️ `Eye` - View proxy
- 📁 `FolderPlus` - Complete proxy

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│ [← Back] My Proxy Groups          [+ Create New]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 👥 Group Name    [TYPE] [ACTIVE] [🔒 LOCKED] │  │
│  │ Created: Date    3 Members                    │  │
│  ├──────────────────────────────────────────────┤  │
│  │ AGM Voting Instructions:                      │  │
│  │ • Trustee Remuneration: YES                   │  │
│  │ • Auditors Appointment: ABSTAIN               │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Proxy Members                                 │  │
│  │                                               │  │
│  │ ┌────────────────────────────────────────┐   │  │
│  │ │ JM  John Member               [DISCR]  │   │  │
│  │ │     john@example.com                   │   │  │
│  │ │     Member #: 12345                    │   │  │
│  │ │     ✓ Can vote for any candidate       │   │  │
│  │ └────────────────────────────────────────┘   │  │
│  │                                               │  │
│  │ ┌────────────────────────────────────────┐   │  │
│  │ │ SM  Sarah Member    [INSTR] [🔒 VOTED] │   │  │
│  │ │     sarah@example.com                  │   │  │
│  │ │     Member #: 67890                    │   │  │
│  │ │     ⚠️ Can only vote for specific...   │   │  │
│  │ │     Allowed to Vote For:               │   │  │
│  │ │     │ 🏆 Tom Brown • Manager • IT      │   │  │
│  │ │     │ 🏆 Lisa Davis • Director • HR    │   │  │
│  │ └────────────────────────────────────────┘   │  │
│  │                                               │  │
│  │ [+ Add Proxy Member]                          │  │
│  ├──────────────────────────────────────────────┤  │
│  │ 🛡️ This proxy group is locked for editing    │  │
│  │    Votes have been cast - cannot modify       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Error Handling

### Error Messages
```javascript
// 403 - Cannot edit (votes cast)
{
  success: false,
  message: 'Cannot edit proxy group - votes have already been cast by proxy members'
}

// 403 - Cannot remove member
{
  success: false,
  message: 'Cannot remove this proxy member - they have already cast votes on your behalf'
}

// 404 - Member not found
{
  success: false,
  message: 'Member not found in system'
}

// 500 - Server error
{
  success: false,
  message: 'Failed to update proxy group'
}
```

### Frontend Error Display
- Alert modals for user actions (remove member, etc.)
- Toast notifications for background updates
- Banner messages for informational errors
- Console logging for debugging

## Security Considerations

### Vote Integrity Protection
1. **Database-level checks**: All edit operations query votes table
2. **No client-side bypass**: Protection enforced in backend
3. **Transaction safety**: Uses database transactions for consistency
4. **Audit trail**: All changes logged with timestamps

### Authorization
- User ID validation on all endpoints
- JWT token authentication required
- Only principal can view/edit their groups
- Proxy members cannot edit groups they belong to

### SQL Injection Prevention
```javascript
// ❌ BAD - Vulnerable
const query = `SELECT * FROM votes WHERE user_id = ${userId}`;

// ✅ GOOD - Safe (parameterized)
const query = `SELECT * FROM votes WHERE user_id = @userId`;
pool.input('userId', sql.Int, userId);
```

## Testing Checklist

### Backend Tests
- [ ] Check proxy status returns correct boolean
- [ ] Voting status correctly identifies votes cast
- [ ] Edit endpoint blocks when votes exist
- [ ] Delete endpoint blocks when member voted
- [ ] Add endpoint blocks when group has votes
- [ ] SQL queries use proper JOINs and parameters

### Frontend Tests
- [ ] Header shows "Complete Proxy" for new users
- [ ] Header shows "View My Proxy" after group creation
- [ ] ViewMyProxy page loads proxy groups
- [ ] Lock icons appear when votes cast
- [ ] Delete buttons disabled for voted members
- [ ] Add member button disabled for locked groups
- [ ] VotingStatusBar refreshes on proxy changes

### Integration Tests
- [ ] Create proxy → Header updates
- [ ] Cast vote as proxy → Group locks
- [ ] Try to edit locked group → Error message
- [ ] Remove member (no votes) → Success
- [ ] Remove member (has voted) → Error
- [ ] Add member to locked group → Error

### User Acceptance Tests
1. **First-time setup**: Can user create proxy group?
2. **View existing**: Can user see their proxy members?
3. **Edit before voting**: Can user modify proxies?
4. **Protection after voting**: System prevents edits?
5. **Visual clarity**: Lock icons and badges clear?
6. **Error messages**: Helpful and understandable?

## Troubleshooting

### Button Not Changing
**Problem**: Header still shows "Complete Proxy" after creating group
**Solution**: 
1. Check browser console for API errors
2. Verify `/api/proxy/proxy-status/:userId` returns correct data
3. Clear browser cache and refresh
4. Check network tab for 401/403 errors

### Cannot Remove Member
**Problem**: Delete button disabled but member hasn't voted
**Solution**:
1. Check `has_voted` flag in API response
2. Verify votes table has no entries for this member
3. Check SQL query joins are correct
4. Look for stale cached data

### Lock Icon Not Showing
**Problem**: Member voted but no lock icon appears
**Solution**:
1. Refresh page to fetch latest data
2. Check `has_votes_cast` in group object
3. Verify CSS classes applied correctly
4. Check component conditional rendering logic

### VotingStatusBar Not Updating
**Problem**: Changes to proxy don't reflect in status bar
**Solution**:
1. Check `proxyDataUpdated` event is dispatched
2. Verify event listener attached in VotingStatusBar
3. Look for console errors in fetch request
4. Force refresh with F5

## Future Enhancements

### Phase 2 Features
- **Bulk operations**: Add/remove multiple members at once
- **History tracking**: View timeline of proxy changes
- **Notifications**: Email when proxy member votes
- **Delegation limits**: Set maximum votes per proxy
- **Temporary locks**: Lock groups during voting periods only

### Phase 3 Features
- **Proxy templates**: Save common configurations
- **Group cloning**: Duplicate existing groups
- **Advanced filters**: Search/sort proxy members
- **Export functionality**: Download proxy data as PDF/CSV
- **Mobile app**: Dedicated proxy management app

## Support Information

### Common User Questions

**Q: Why can't I edit my proxy group?**
A: Once any proxy member casts a vote on your behalf, the group is locked to maintain voting integrity. You can view but not modify.

**Q: Can I remove a proxy member who hasn't voted yet?**
A: Yes! If a specific member hasn't cast any votes, you can remove them even if other members in the group have voted.

**Q: What's the difference between DISCRETIONARY and INSTRUCTIONAL?**
A: DISCRETIONARY proxies can vote for anyone on your behalf. INSTRUCTIONAL proxies can only vote for specific pre-approved candidates.

**Q: How do I know if my proxy has voted?**
A: Check the "Vote History" tab in your Voting Status Bar. Proxy votes will show with a "Proxy for [Name]" label.

**Q: Can I have multiple proxy groups?**
A: Yes! You can create multiple proxy groups, each with different members and appointment types.

### Admin Support

**Database Queries for Debugging**:
```sql
-- Find all votes cast by proxy members
SELECT v.*, pgm.full_name as proxy_name, u.name as principal_name
FROM votes v
INNER JOIN proxy_group_members pgm ON v.voted_by_id = pgm.member_id
INNER JOIN proxy_groups pg ON pgm.group_id = pg.id
INNER JOIN users u ON pg.principal_id = u.id
WHERE pg.principal_id = @userId;

-- Check lock status of a group
SELECT 
  pg.*,
  COUNT(v.id) as vote_count,
  CASE WHEN COUNT(v.id) > 0 THEN 1 ELSE 0 END as is_locked
FROM proxy_groups pg
LEFT JOIN proxy_group_members pgm ON pg.id = pgm.group_id
LEFT JOIN votes v ON v.voted_by_id = pgm.member_id
WHERE pg.id = @groupId
GROUP BY pg.id;
```

## Changelog

### Version 1.0.0 (Current)
- ✅ Dynamic header button (Complete/View Proxy)
- ✅ Voting protection system
- ✅ View My Proxy page
- ✅ Edit/delete capabilities with locks
- ✅ Real-time VotingStatusBar integration
- ✅ Visual indicators and badges
- ✅ Comprehensive error handling

### Planned Updates
- v1.1.0: Notification system for proxy votes
- v1.2.0: Export proxy data functionality
- v1.3.0: Advanced search and filtering
- v2.0.0: Mobile responsive redesign
