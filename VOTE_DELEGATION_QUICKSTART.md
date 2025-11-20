# Vote Delegation - Quick Test Guide

## What Was Implemented

✅ **Vote allocation in proxy forms** - Principal can specify how many votes to give each proxy member
✅ **Vote deduction** - Votes deducted from principal's vote_weight and added to proxy member
✅ **Instructional vs Discretionary tracking** - Votes tagged with appointment type for restrictions
✅ **Real-time validation** - Must allocate all votes, cannot over-allocate
✅ **Database schema updates** - New columns for votes_allocated and total_votes_delegated
✅ **Vote splitting settings** - Tracks active vote delegations

## Quick Start

### 1. Run Database Migration
```bash
# Open server/setup/add_vote_allocation.sql in Azure Data Studio
# Execute against wevote database
# This adds votes_allocated column to proxy_group_members table
```

### 2. Test the Form
1. Navigate to `/proxy-choice/167` (or your user ID)
2. Select "Create Proxy Form"
3. Fill principal details
4. **New!** See "Vote Allocation" summary after ID field showing:
   - Available Votes
   - Allocated Votes  
   - Remaining Votes

### 3. Add Proxy Members
1. Click "Add Proxy Member"
2. Fill member details
3. **New!** See "Votes to Allocate" field
4. Enter number of votes (e.g., 2)
5. Choose appointment type:
   - **Discretionary**: Can vote for anyone with these votes
   - **Instructional**: Restricted to selected candidates only

### 4. Validation
The form will prevent submission if:
- ❌ Votes allocated exceeds available votes
- ❌ Any votes remain unallocated  
- ❌ Any proxy member has 0 votes
- ❌ Instructional proxy has no selected candidates

### 5. After Submission
- Principal's `vote_weight` reduced by total allocated
- Each proxy member gets `votes_allocated` added to their power
- `vote_splitting_settings` table tracks the delegation
- Instructional votes restricted to allowed candidates

## Test Scenarios

### Scenario 1: Simple 1-to-1 Delegation
**Setup:**
- Login as User 167 (5 votes)
- Create proxy for User 139 (Bilal)
- Allocate all 5 votes (discretionary)

**Expected Result:**
```
User 167: vote_weight = 0 (5 - 5)
User 139: Gets +5 proxy votes (discretionary, any candidate)
```

### Scenario 2: Split Between Multiple Proxies
**Setup:**
- Login as user with 10 votes
- Add 2 proxy members:
  - Member 1: 6 votes (discretionary)
  - Member 2: 4 votes (instructional, Candidates 1, 2)

**Expected Result:**
```
Principal: vote_weight = 0 (10 - 10)
Member 1: +6 proxy votes (any candidate)
Member 2: +4 proxy votes (only Candidates 1, 2)
```

### Scenario 3: Validation Error - Over Allocation
**Setup:**
- User has 5 votes
- Try to allocate 3 + 4 = 7 votes

**Expected Result:**
```
❌ Error: "You cannot allocate more votes (7) than you have available (5)"
Form blocked from submission
```

### Scenario 4: Validation Error - Under Allocation
**Setup:**
- User has 10 votes
- Allocate only 8 votes (2 remaining)

**Expected Result:**
```
❌ Error: "You still have 2 unallocated vote(s). Allocate all your votes or adjust the amounts."
Form blocked from submission
```

## Checking the Database

### View vote allocations:
```sql
SELECT 
    pg.group_name,
    pg.principal_id,
    pg.total_votes_delegated,
    pgm.full_name AS proxy_member,
    pgm.votes_allocated,
    pgm.appointment_type
FROM proxy_groups pg
INNER JOIN proxy_group_members pgm ON pg.id = pgm.group_id
WHERE pg.principal_id = 167;
```

### View vote splitting settings:
```sql
SELECT 
    vss.*,
    u.name AS principal_name,
    pgm.full_name AS proxy_name
FROM vote_splitting_settings vss
INNER JOIN users u ON u.id = vss.user_id
INNER JOIN proxy_group_members pgm ON pgm.id = vss.proxy_member_id
WHERE vss.user_id = 167;
```

### Check principal's remaining votes:
```sql
SELECT id, name, vote_weight 
FROM users 
WHERE id = 167;
```

## UI Changes to Look For

### In ProxyAppointmentForm:
1. **Vote Summary Card** (blue box after ID/Passport field):
   ```
   ┌─────────────────────────────────┐
   │ Vote Allocation                 │
   │                                 │
   │   5        3        2           │
   │ Available Allocated Remaining   │
   └─────────────────────────────────┘
   ```

2. **Per-Member Vote Input** (in each proxy card):
   ```
   🗳️ Votes to Allocate
   [Input: Number field]
   "This proxy will receive X of your votes"
   ```

3. **Error Banners**:
   - Red alert if over/under allocated
   - Shows in vote summary card

### In VotingStatusBar (Future):
Will show breakdown:
```
Personal Votes: 0 / 5 (5 delegated)
Proxy Votes: 10 / 10
  - Discretionary: 7
  - Instructional: 3
```

## Common Issues

### Issue: Form shows 0 available votes
**Cause:** User's vote_weight is 0 or NULL
**Fix:**
```sql
UPDATE users SET vote_weight = 5 WHERE id = 167;
```

### Issue: Can't submit form
**Cause:** Vote allocation doesn't match available
**Fix:** Adjust numbers so sum equals total available

### Issue: Column 'votes_allocated' doesn't exist
**Cause:** Migration not run
**Fix:** Execute `server/setup/add_vote_allocation.sql`

### Issue: Votes not deducted after submission
**Cause:** Database UPDATE may have failed
**Fix:** Check server logs, verify query execution

## Next Steps

1. ✅ Test vote allocation in form
2. ✅ Verify database records created
3. ⏳ Update voting logic to use allocated votes
4. ⏳ Update VotingStatusBar to show breakdown
5. ⏳ Implement voting restrictions for instructional proxies
6. ⏳ Add vote delegation history view

## Files Modified

### Frontend:
- `src/pages/ProxyAppointmentForm.tsx` - Added vote allocation UI
  - New state: totalAvailableVotes, totalAllocatedVotes
  - New interface fields: votesAllocated per member
  - Vote summary card component
  - Vote input per proxy member
  - Validation logic

### Backend:
- `server/routes/proxy.js` - POST /proxy-form route
  - Accept vote allocation data
  - Create vote_splitting_settings records
  - Deduct votes from principal
  - Save votes_allocated per member

- `server/models/Proxy.js` - Model methods
  - Updated creategroupData() for total_votes_delegated
  - Updated creategroup_id() for votes_allocated

### Database:
- `server/setup/add_vote_allocation.sql` - Migration script
  - Adds votes_allocated to proxy_group_members
  - Adds total_votes_delegated to proxy_groups
  - Creates/updates vote_splitting_settings table

### Documentation:
- `VOTE_DELEGATION_SYSTEM.md` - Complete system documentation
- `VOTE_DELEGATION_QUICKSTART.md` - This file

## Success Indicators

✅ Form loads and shows vote allocation card
✅ Can input votes for each proxy member
✅ Real-time calculation of remaining votes
✅ Validation prevents invalid allocations
✅ Submission succeeds with success message
✅ Database shows votes_allocated values
✅ Principal's vote_weight reduced
✅ vote_splitting_settings records created

---

**Ready to Test!** Start with Scenario 1 above. 🚀
