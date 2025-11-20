# Vote Delegation & Allocation System

## Overview
The WeVote platform now supports vote delegation through the proxy system, allowing members to split and allocate their votes to proxy members who can vote on their behalf.

## Key Features

### 1. Vote Allocation
- **Principal Member**: Can allocate a portion of their votes to one or more proxy members
- **Vote Split**: Votes are deducted from the principal and added to the proxy member
- **Flexible Distribution**: Principal can give different amounts to different proxy members
- **Full Allocation Required**: All available votes must be allocated when creating a proxy

### 2. Appointment Types with Vote Restrictions

#### Discretionary Proxy
- Can vote for **any** candidate using the allocated votes
- No restrictions on voting choices
- Full flexibility in employee voting

#### Instructional Proxy
- Can **only** vote for pre-selected candidates
- Must follow AGM voting instructions (yes/no/abstain)
- Votes are restricted to the candidates specified by the principal
- Cannot vote for candidates outside their allowed list

### 3. Vote Tracking
- **Personal Votes**: Remaining votes after delegation (totalAvailableVotes - totalAllocatedVotes)
- **Proxy Votes**: Votes received from principals
- **Instructional Votes**: Subset of proxy votes with restrictions
- **Discretionary Votes**: Proxy votes without restrictions

## Database Schema Changes

### New Columns Added

#### `proxy_group_members` table:
```sql
votes_allocated INT NOT NULL DEFAULT 0
```
- Tracks how many votes this proxy member receives
- Used to calculate their vote_weight when voting

#### `proxy_groups` table:
```sql
total_votes_delegated INT NOT NULL DEFAULT 0
```
- Total votes delegated in this proxy group
- Used for audit and summary purposes

#### `vote_splitting_settings` table:
```sql
user_id INT                    -- Principal's user ID
proxy_member_id INT            -- Proxy member ID
votes_allocated INT            -- Number of votes allocated
appointment_type VARCHAR(50)   -- DISCRETIONARY or INSTRUCTIONAL
is_active BIT                  -- Whether the allocation is active
```
- Tracks active vote splits
- Links principal to proxy member
- Stores vote count and type

## Implementation Details

### Frontend (ProxyAppointmentForm.tsx)

#### New State Properties:
```typescript
interface ProxyFormData {
  // ... existing fields ...
  
  totalAvailableVotes: number;      // User's total available votes
  totalAllocatedVotes: number;      // Sum of votes allocated to proxies
  
  proxyGroupMembers: {
    // ... existing fields ...
    votesAllocated: number;         // Votes given to this proxy member
  }[];
}
```

#### Vote Allocation UI:
1. **Vote Summary Card** (after principal details):
   - Shows Available, Allocated, and Remaining votes
   - Real-time updates as user allocates votes
   - Error alerts if over-allocated or under-allocated

2. **Per-Proxy Allocation** (in each proxy member card):
   - Number input for votes
   - Min: 0, Max: totalAvailableVotes
   - Helper text showing allocation
   - Validation errors

#### Validation Rules:
- Each proxy member must receive at least 1 vote
- Total allocated cannot exceed available votes
- All votes must be allocated before submission
- Instructional proxies must have selected candidates

### Backend (proxy.js Route)

#### Proxy Creation Flow:
1. **Accept vote allocation data**:
   ```javascript
   const {
     total_available_votes,
     total_allocated_votes,
     proxy_group_members,  // Each has votes_allocated
     // ... other fields
   } = req.body;
   ```

2. **Create proxy group** with total_votes_delegated

3. **For each proxy member**:
   - Create proxy_group_members record with votes_allocated
   - Create vote_splitting_settings record
   - Link allowed candidates (if INSTRUCTIONAL)

4. **Deduct votes from principal**:
   ```sql
   UPDATE users 
   SET vote_weight = vote_weight - total_allocated_votes
   WHERE id = principal_id
   ```

5. **Response includes**:
   - Success message
   - appointment_id
   - proxy_group_id
   - votes_allocated (confirmation)

## Voting Logic with Delegation

### When Proxy Member Votes:

#### For Discretionary Proxy:
```javascript
// Can vote for any employee
// Uses their allocated vote count
const voteWeight = proxyMember.votes_allocated;
// Vote recorded as:
{
  user_id: proxyMemberId,
  voted_by_id: proxyMemberId,
  voted_for_id: principalId,
  employee_id: ANY_EMPLOYEE,
  vote_value: 'VOTE',
  weight: voteWeight
}
```

#### For Instructional Proxy:
```javascript
// Can ONLY vote for allowed candidates
const allowedCandidates = getInstructionalCandidates(proxyMemberId);
if (!allowedCandidates.includes(employeeId)) {
  throw new Error('You can only vote for your assigned candidates');
}

const voteWeight = proxyMember.votes_allocated;
// Vote recorded with same structure
```

### Vote Counting:
- Principal's personal votes: `user.vote_weight` (after deduction)
- Proxy votes: Sum of `proxy_group_members.votes_allocated`
- Total voting power: Personal + Proxy votes

## VotingStatusBar Integration

### Vote Breakdown Display:
```typescript
interface VotingStatus {
  // Personal votes (after delegation)
  personalVotesRemaining: number;
  personalVotesTotal: number;
  
  // Proxy votes (received from principals)
  proxyVotesRemaining: number;
  proxyVotesTotal: number;
  
  // Breakdown by type
  discretionaryVotes: number;      // No restrictions
  instructionalVotes: number;      // Restricted to candidates
  
  // Delegations from you
  myProxyGroups: MyProxyGroup[];   // Shows votes you gave away
}
```

### Display Format:
```
┌─────────────────────────────────┐
│ Your Voting Power               │
├─────────────────────────────────┤
│ Personal Votes:        3 / 5    │
│ Proxy Votes:          10 / 10   │
│   - Discretionary:     7        │
│   - Instructional:     3        │
├─────────────────────────────────┤
│ Total Available:      13        │
│ Votes Used:            5        │
│ Remaining:             8        │
└─────────────────────────────────┘
```

## SQL Migration Script

Run the migration to add vote allocation support:

```bash
# From server directory
sqlcmd -S wevote.database.windows.net -d wevote -U admin1 -i setup/add_vote_allocation.sql
```

Or via Azure Data Studio:
1. Open `server/setup/add_vote_allocation.sql`
2. Connect to wevote database
3. Execute script

## Testing Checklist

### 1. Vote Allocation Form
- [ ] User's available votes display correctly
- [ ] Can allocate votes to multiple proxy members
- [ ] Real-time calculation of remaining votes
- [ ] Cannot submit with unallocated votes
- [ ] Cannot over-allocate votes
- [ ] Each proxy must have at least 1 vote

### 2. Backend Processing
- [ ] Votes deducted from principal's vote_weight
- [ ] proxy_group_members.votes_allocated saved correctly
- [ ] vote_splitting_settings records created
- [ ] total_votes_delegated updated in proxy_groups

### 3. Voting Restrictions
- [ ] Discretionary proxy can vote for any employee
- [ ] Instructional proxy restricted to allowed candidates
- [ ] Vote weight matches allocated amount
- [ ] Votes recorded with correct voted_for_id

### 4. VotingStatusBar
- [ ] Shows personal votes (after delegation)
- [ ] Shows proxy votes (received)
- [ ] Breakdown by discretionary/instructional
- [ ] My Proxy Groups shows delegated votes

### 5. Edge Cases
- [ ] User with 0 available votes cannot create proxy
- [ ] Cannot allocate negative votes
- [ ] Cannot allocate fractional votes
- [ ] Proxy member with 0 allocated votes rejected

## Example Scenarios

### Scenario 1: Simple Delegation
**Setup:**
- User A has 5 votes
- Creates proxy for User B
- Allocates all 5 votes to User B (discretionary)

**Result:**
- User A: 0 personal votes, 5 delegated
- User B: Original votes + 5 proxy votes (can use anywhere)

### Scenario 2: Split Delegation
**Setup:**
- User A has 10 votes
- Creates proxy with 2 members:
  - User B: 6 votes (discretionary)
  - User C: 4 votes (instructional for Candidates 1,2,3)

**Result:**
- User A: 0 personal votes, 10 delegated
- User B: Original votes + 6 proxy votes (any candidate)
- User C: Original votes + 4 proxy votes (only Candidates 1,2,3)

### Scenario 3: Partial Delegation (Requires Update)
**Future Feature:**
- User A has 8 votes
- Keeps 3 votes personal
- Delegates 5 votes to proxy

**Current Limitation:** Must allocate all votes

## Protection Mechanisms

### 1. Vote Duplication Prevention
- Votes transferred, not duplicated
- Principal's vote_weight reduced
- Sum of votes remains constant

### 2. Instructional Restrictions
- Database-enforced allowed_candidates list
- Backend validates before accepting vote
- Frontend shows only allowed options

### 3. Audit Trail
- vote_splitting_settings tracks all allocations
- Votes table records voted_for_id (principal)
- Can reconstruct who voted on whose behalf

## Future Enhancements

### Phase 2:
1. **Partial Delegation**: Keep some votes personal
2. **Vote Retrieval**: Cancel proxy before voting starts
3. **Real-time Dashboard**: See proxy votes being used
4. **Delegation History**: View past proxy relationships

### Phase 3:
1. **Vote Pooling**: Multiple principals → single proxy
2. **Hierarchical Proxies**: Proxy can delegate further
3. **Conditional Votes**: "Use proxy only if I'm absent"
4. **Vote Splitting Rules**: Automated distribution algorithms

## Troubleshooting

### Issue: Votes not deducted from principal
**Check:**
```sql
SELECT id, name, vote_weight 
FROM users 
WHERE id = [principal_id];
```
**Fix:** Verify UPDATE query executed after proxy creation

### Issue: Proxy member can't vote
**Check:**
```sql
SELECT * FROM vote_splitting_settings 
WHERE proxy_member_id = [member_id];
```
**Fix:** Ensure is_active = 1 when proxy group activated

### Issue: Instructional proxy blocked
**Check:**
```sql
SELECT * FROM proxy_member_allowed_candidates 
WHERE proxy_member_id = [member_id];
```
**Fix:** Verify candidates were inserted during proxy creation

## Support

For questions or issues with vote delegation:
1. Check database logs for INSERT/UPDATE failures
2. Verify vote_splitting_settings table exists
3. Review proxy_groups.total_votes_delegated matches sum
4. Test with small vote counts first (1-2 votes)

---

**Last Updated:** November 19, 2025
**Version:** 1.0.0
**Related Docs:** PROXY_MANAGEMENT_GUIDE.md, VOTING_STATUS_BAR_IMPLEMENTATION.md
