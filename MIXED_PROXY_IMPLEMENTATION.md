# Mixed Proxy Appointment Type - Implementation Guide

## Overview

The **Mixed Proxy Type** allows a principal member to split their voting power between **Discretional** and **Instructional** voting, giving them more flexible control over how their proxy votes.

## Use Case Example

**Scenario:** Daron has 10 votes and wants to delegate them to Stan.
- **5 votes Discretional**: Stan can vote for any employee at his discretion
- **5 votes Instructional**: Stan must vote only for employees that Daron has pre-selected (e.g., Employee A, Employee B, Employee C)

## Three Appointment Types

### 1. Discretional (Full Freedom)
- **Definition**: Proxy holder can vote for ANY employee
- **Use Case**: Complete trust in the proxy holder's judgment
- **Votes**: All votes are discretional
- **Employee Selection**: Not required

### 2. Instructional (Restricted)
- **Definition**: Proxy holder must follow specific instructions
- **Use Case**: You want to control exactly who receives votes
- **Votes**: All votes are instructional
- **Employee Selection**: **REQUIRED** - Must select which employees the proxy can vote for

### 3. Mixed (Hybrid Approach) ⭐ NEW
- **Definition**: Split votes between discretional and instructional
- **Use Case**: Trust the proxy for some decisions, but want control over others
- **Votes**: Split into two pools:
  - `discretional_votes`: Can be used to vote for anyone
  - `instructional_votes`: Can only be used for pre-selected employees
- **Employee Selection**: **REQUIRED** - For the instructional portion

## Database Schema

### Updated `proxy_group_members` Table

```sql
CREATE TABLE [dbo].[proxy_group_members](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [group_id] [int] NOT NULL,
    [member_id] [int] NOT NULL,
    [initials] [nvarchar](10) NULL,
    [full_name] [nvarchar](255) NULL,
    [surname] [nvarchar](100) NULL,
    [membership_number] [nvarchar](50) NULL,
    [id_number] [nvarchar](50) NULL,
    
    -- Appointment Type: DISCRETIONAL, INSTRUCTIONAL, or MIXED
    [appointment_type] [nvarchar](20) NULL,
    
    -- NEW COLUMNS:
    [votes_allocated] [int] NOT NULL DEFAULT (0),         -- Total votes delegated
    [discretional_votes] [int] NOT NULL DEFAULT (0),      -- Votes with no restrictions
    [instructional_votes] [int] NOT NULL DEFAULT (0),     -- Votes with restrictions
    
    PRIMARY KEY ([id]),
    CONSTRAINT CK_proxy_group_members_appointment_type 
        CHECK ([appointment_type] IN ('DISCRETIONAL', 'INSTRUCTIONAL', 'MIXED', NULL))
);
```

### Key Constraint Rules

1. **Vote Split Validation**:
   ```
   discretional_votes + instructional_votes = votes_allocated
   ```

2. **Appointment Type Logic**:
   - `DISCRETIONAL`: `discretional_votes = votes_allocated`, `instructional_votes = 0`
   - `INSTRUCTIONAL`: `discretional_votes = 0`, `instructional_votes = votes_allocated`
   - `MIXED`: Both `discretional_votes` and `instructional_votes` > 0

3. **Employee Selection**:
   - `DISCRETIONAL`: No employees in `proxy_member_allowed_candidates`
   - `INSTRUCTIONAL`: At least 1 employee required
   - `MIXED`: At least 1 employee required (for instructional votes)

## Frontend Implementation

### Form Structure (ProxyAppointmentForm.tsx)

#### 1. Radio Button Selection
```tsx
<input type="radio" value="discretional" />
<input type="radio" value="instructional" />
<input type="radio" value="mixed" /> {/* NEW */}
```

#### 2. Vote Allocation (Mixed Type)
When "Mixed" is selected, two additional input fields appear:

```tsx
{member.appointmentType === 'mixed' && (
  <>
    <input 
      label="Discretional Votes"
      value={member.discretionalVotes}
      onChange={...}
    />
    
    <input 
      label="Instructional Votes"
      value={member.instructionalVotes}
      onChange={...}
    />
  </>
)}
```

#### 3. Auto-Adjustment Logic
When the user changes the total votes allocated, the system automatically adjusts the split:

```typescript
// When total votes change in MIXED mode:
if (appointmentType === 'mixed') {
  // Keep the same proportion
  const currentTotal = discretionalVotes + instructionalVotes;
  const ratio = discretionalVotes / currentTotal;
  const newDisc = Math.round(newTotal * ratio);
  discretionalVotes = newDisc;
  instructionalVotes = newTotal - newDisc;
}
```

### Validation Rules

```typescript
// 1. Vote split must equal total
if (member.appointmentType === 'mixed') {
  const discVotes = member.discretionalVotes || 0;
  const instVotes = member.instructionalVotes || 0;
  
  if (discVotes + instVotes !== member.votesAllocated) {
    error = `Discretional (${discVotes}) + Instructional (${instVotes}) must equal Total Votes (${member.votesAllocated})`;
  }
  
  // 2. Must have at least 1 instructional vote for MIXED type
  if (instVotes <= 0) {
    error = 'Mixed type must have at least 1 instructional vote';
  }
}

// 3. Employee selection required for INSTRUCTIONAL or MIXED
if (member.appointmentType === 'instructional' || member.appointmentType === 'mixed') {
  if (!member.allowedCandidates || member.allowedCandidates.length === 0) {
    error = 'Select at least one employee this proxy can vote for';
  }
}
```

## Backend API Payload

### Submitted Form Data

```json
{
  "member_title": "Mr",
  "member_initials": "J.D.",
  "member_surname": "Doe",
  "member_full_name": "John Doe",
  "member_membership_number": "12345",
  "member_id_number": "8901234567890",
  
  "proxy_group_members": [
    {
      "initials": "S.M.",
      "full_name": "Stan Miller",
      "surname": "Miller",
      "membership_number": "67890",
      "id_number": "7801234567890",
      
      // Mixed appointment type
      "appointment_type": "MIXED",
      "votes_allocated": 10,
      "discretional_votes": 5,
      "instructional_votes": 5,
      
      // Employees Stan can vote for (with instructional votes)
      "allowed_candidates": ["1", "3", "7"]
    }
  ],
  
  "total_available_votes": 10,
  "total_allocated_votes": 10,
  
  // AGM Instructions (for instructional votes)
  "trustee_remuneration": "YES",
  "remuneration_policy": "NO",
  "auditors_appointment": "YES",
  "agm_motions": "ABSTAIN"
}
```

## Proxy Group Formation

### How Groups Work

Your schema correctly models proxy groups as follows:

1. **Principal Member** (Daron) creates a `proxy_group`:
   - `principal_id` = Daron's user ID
   - `group_name` = "Daron's Proxy Group"
   
2. **Proxy Holder** (Stan) is added to `proxy_group_members`:
   - `member_id` = Stan's user ID
   - `votes_allocated` = 10 (total votes Daron gave to Stan)
   - `discretional_votes` = 5
   - `instructional_votes` = 5

3. **Multiple Delegators** can delegate to the same proxy:
   - Bob also delegates 8 votes to Stan
   - Stan now has:
     - Daron's 10 votes (5 discretional, 5 instructional)
     - Bob's 8 votes (8 discretional, 0 instructional)
     - **Total: 18 votes** (13 discretional, 5 instructional)

### Vote Tracking with `proxy_voter_limits`

```sql
-- Stan's voting limits for Daron's group
INSERT INTO proxy_voter_limits (
    proxy_group_id,     -- Daron's group ID
    user_id,            -- Stan's user ID
    max_votes_allowed,  -- 10 (total votes)
    votes_used          -- 0 (starts at 0, increments when Stan votes)
)
```

### Vote Links with `proxy_vote_links`

When Stan casts a vote on behalf of Daron:

```sql
INSERT INTO proxy_vote_links (
    vote_id,              -- The vote record ID
    represented_user_id,  -- Daron's user ID (vote was on his behalf)
    group_id              -- Daron's proxy group ID
)
```

## Schema Validation ✅

Your schema **DOES work** for the mixed proxy system! Here's why:

### ✅ Correct Elements:

1. **`proxy_groups`** - Already has `appointment_type` with 'MIXED' support
2. **`proxy_group_members`** - Stores individual proxy holders with their vote allocations
3. **`proxy_voter_limits`** - Tracks how many votes each proxy holder can use per group
4. **`proxy_vote_links`** - Links actual votes to the represented user
5. **`proxy_member_allowed_candidates`** - Restricts which employees instructional votes can go to

### ⚠️ Required Updates:

1. **Add columns to `proxy_group_members`**:
   - `votes_allocated` ✅ (stores total votes)
   - `discretional_votes` ✅ (stores discretional portion)
   - `instructional_votes` ✅ (stores instructional portion)

2. **Update CHECK constraint**:
   ```sql
   ALTER TABLE proxy_group_members
   ADD CONSTRAINT CK_appointment_type 
   CHECK (appointment_type IN ('DISCRETIONAL', 'INSTRUCTIONAL', 'MIXED', NULL));
   ```

## Migration Script

Run this SQL script to upgrade your database:

```bash
sqlcmd -S your-server -d your-database -i server/setup/add_mixed_proxy_type.sql
```

Or execute in SQL Server Management Studio:
1. Open `server/setup/add_mixed_proxy_type.sql`
2. Execute the script
3. Verify the output shows "Migration completed successfully!"

## Testing Checklist

### Frontend Tests
- [ ] Can select "Mixed" radio button
- [ ] Vote split fields appear when Mixed is selected
- [ ] Total votes auto-splits into discretional/instructional
- [ ] Validation shows error if split doesn't equal total
- [ ] Employee multi-select appears for Mixed type
- [ ] Form submits successfully with Mixed type

### Backend Tests
- [ ] API accepts `appointment_type: "MIXED"`
- [ ] Database stores discretional_votes and instructional_votes
- [ ] Constraint allows 'MIXED' value
- [ ] Vote splitting calculations are correct
- [ ] Proxy voting respects instructional restrictions

### Business Logic Tests
- [ ] Stan receives correct number of discretional votes
- [ ] Stan receives correct number of instructional votes
- [ ] Stan can vote for anyone with discretional votes
- [ ] Stan can only vote for allowed employees with instructional votes
- [ ] Multiple delegators to same proxy aggregate correctly

## Example Scenario

### Setup:
1. **Daron** has 10 votes
2. **Bob** has 8 votes
3. Both delegate to **Stan**

### Daron's Delegation (Mixed):
- Total: 10 votes
- Discretional: 4 votes (Stan can vote for anyone)
- Instructional: 6 votes (Stan must vote for Employees: Alice, Charlie, Eve)

### Bob's Delegation (Discretional):
- Total: 8 votes
- Discretional: 8 votes (Stan can vote for anyone)
- Instructional: 0 votes

### Stan's Voting Power:
- **Total votes**: 18
- **Discretional votes**: 12 (4 from Daron + 8 from Bob)
- **Instructional votes**: 6 (only from Daron, restricted to Alice/Charlie/Eve)

### When Stan Votes:
- Stan casts 12 votes for **Frank** (using all discretional votes) ✅
- Stan casts 6 votes for **Alice** (using instructional votes from Daron) ✅
- Stan tries to cast 6 votes for **David** (not in Daron's allowed list) ❌ ERROR

## Conclusion

Your database schema **works perfectly** for the mixed proxy system. After adding the three new columns (`votes_allocated`, `discretional_votes`, `instructional_votes`) and updating the CHECK constraint, you'll have a fully functional mixed proxy appointment system.

The UI has been updated to support:
- ✅ Mixed appointment type selection
- ✅ Vote split input fields
- ✅ Automatic vote distribution
- ✅ Validation for vote splits
- ✅ Employee multi-select for instructional portion

Run the migration script and test the form to see it in action! 🚀
