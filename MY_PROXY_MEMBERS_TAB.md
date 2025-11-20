# My Proxy Members Tab - Feature Documentation

## Overview
Added a new "My Proxy Members" tab to the VotingStatusBar that displays all proxy groups where the current user is the **principal** (the person delegating votes to others).

## What This Tab Shows

### For Principals (Users who delegate votes)
Shows all proxy groups you've created, including:
- **Group name** and appointment type
- **Active/Inactive status**
- **All proxy members** who can vote on your behalf
- **Appointment type** for each member (DISCRETIONARY vs INSTRUCTIONAL)
- **Allowed candidates** for INSTRUCTIONAL proxy members

### Key Information Displayed

#### Proxy Group Card
- Group Name
- Overall appointment type (DISCRETIONARY, INSTRUCTIONAL, or MIXED)
- Active/Inactive badge (green for active, gray for inactive)
- Creation date
- Total number of proxy members

#### Proxy Member Details
Each proxy member shows:
- **Name and email**
- **Member number**
- **Appointment type badge**:
  - 🟢 **DISCRETIONARY** (green) - Can vote for anyone on your behalf
  - 🟠 **INSTRUCTIONAL** (orange) - Can only vote for specific pre-approved candidates
- **Explanation** of what they can do
- **Allowed candidates list** (for INSTRUCTIONAL members only)

## User Experience

### Tab Navigation
```
┌─────────────────────────────────────────────────────────┐
│ Overview │ Vote History │ Proxy Delegations │ My Proxy Members │
└─────────────────────────────────────────────────────────┘
```

### Display Example

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Mr JT Moodley                              1         │
│    [DISCRETIONAL] [Active] Created 11/18/2025  proxy    │
│                                                 members  │
├─────────────────────────────────────────────────────────┤
│ People Who Can Vote on Your Behalf                      │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ 👤 Bilal                    [DISCRETIONARY]     │    │
│ │    bilalc8@gmail.com                            │    │
│ │    Member #: BIL001                             │    │
│ │    ✓ Can vote for any candidate on your behalf │    │
│ └─────────────────────────────────────────────────┘    │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ 👤 User 102                 [INSTRUCTIONAL]     │    │
│ │    user102@example.com                          │    │
│ │    Member #: USR102                             │    │
│ │    ⚠️ Can only vote for specific candidates     │    │
│ │                                                  │    │
│ │    Allowed to Vote For:                         │    │
│ │    │ 🏆 Sarah Williams • Manager • IT Dept     │    │
│ │    │ 🏆 Tom Brown • Director • Finance         │    │
│ │    │ 🏆 Lisa Davis • Senior Lead • Operations  │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Frontend Changes

#### New Interface
```typescript
interface MyProxyGroup {
  id: string;
  groupName: string;
  appointmentType: string;
  isActive: boolean;
  createdAt: Date;
  proxyMembers: ProxyMember[]; // Reuses existing ProxyMember interface
}
```

#### Updated VotingStatus
```typescript
interface VotingStatus {
  // ...existing fields...
  myProxyGroups: MyProxyGroup[]; // NEW
}
```

#### New Tab State
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'proxy' | 'mygroups'>('overview');
```

### Backend Changes

#### New Query in voting-status.js
```javascript
// Get proxy groups WHERE THIS USER IS THE PRINCIPAL
const myProxyGroupsQuery = `
  SELECT 
    pg.id,
    pg.group_name,
    pg.appointment_type,
    pg.is_active,
    pg.created_at
  FROM proxy_groups pg
  WHERE pg.principal_id = ${userIdInt}
`;
```

#### Nested Queries for Members and Candidates
For each proxy group:
1. Fetch all proxy members (from `proxy_group_members`)
2. For each INSTRUCTIONAL member, fetch allowed candidates (from `proxy_member_allowed_candidates`)
3. Include employee details (name, position, department)

#### Response Format
```json
{
  "success": true,
  "data": {
    "personalVotesRemaining": 1,
    "personalVotesTotal": 1,
    "proxyVotesRemaining": 0,
    "proxyVotesTotal": 0,
    "totalVotesRemaining": 1,
    "totalVotesUsed": 0,
    "voteHistory": [],
    "proxyDelegations": [],
    "myProxyGroups": [
      {
        "id": "18",
        "groupName": "Mr JT Moodley",
        "appointmentType": "DISCRETIONAL",
        "isActive": false,
        "createdAt": "2025-11-18T...",
        "proxyMembers": [
          {
            "id": "139",
            "name": "Bilal",
            "email": "bilalc8@gmail.com",
            "memberNumber": "BIL001",
            "appointmentType": "DISCRETIONARY",
            "allowedCandidates": []
          }
        ]
      }
    ]
  }
}
```

## Database Tables Used

1. **proxy_groups**
   - Stores proxy group information
   - `principal_id` - User who created the group (delegator)
   - `appointment_type` - Overall group type
   - `is_active` - Whether group is currently active

2. **proxy_group_members**
   - Stores members who can vote as proxies
   - `group_id` - References proxy_groups
   - `member_id` - User who votes as proxy
   - `appointment_type` - Individual member's type (DISCRETIONARY/INSTRUCTIONAL)

3. **proxy_member_allowed_candidates**
   - Stores allowed candidates for INSTRUCTIONAL proxies
   - `proxy_member_id` - References proxy_group_members
   - `employee_id` - Employee they can vote for

4. **employees** & **departments**
   - Used to display candidate details (name, position, department)

## Use Cases

### Scenario 1: Principal Checking Their Proxy Members
**User Story**: "As a principal, I want to see who can vote on my behalf and what restrictions they have"

**Steps:**
1. Login as principal (e.g., User 167)
2. Open VotingStatusBar
3. Click "View Details"
4. Click "My Proxy Members" tab
5. See all groups and members

**What They See:**
- All proxy groups they created
- All members in each group
- Each member's appointment type
- Restricted candidates (for INSTRUCTIONAL members)

### Scenario 2: Verifying INSTRUCTIONAL Restrictions
**User Story**: "As a principal with INSTRUCTIONAL proxies, I want to verify the candidates my proxy members can vote for"

**Steps:**
1. Navigate to "My Proxy Members" tab
2. Find INSTRUCTIONAL member (orange badge)
3. Scroll down to "Allowed to Vote For" section
4. Verify the list of approved candidates

**What They See:**
- Orange INSTRUCTIONAL badge
- Warning message about restrictions
- Complete list of allowed candidates with details

### Scenario 3: Monitoring Active vs Inactive Groups
**User Story**: "As a principal, I want to know which proxy groups are currently active"

**Steps:**
1. Open "My Proxy Members" tab
2. Check badge colors on each group
3. Green = Active, Gray = Inactive

**Actions Available:**
- See which groups are in effect
- Know when groups were created
- Understand overall group appointment type

## Visual Design

### Color Coding
- **DISCRETIONARY**: Green (`bg-green-100 text-green-800`)
- **INSTRUCTIONAL**: Orange (`bg-orange-100 text-orange-800`)
- **MIXED**: Blue (`bg-blue-100 text-blue-800`)
- **Active Status**: Green (`bg-green-100 text-green-800`)
- **Inactive Status**: Gray (`bg-gray-100 text-gray-800`)

### Icons
- 👥 **Users** - Proxy group icon
- 👤 **User** - Individual proxy member
- 🏆 **Award** - Allowed candidate
- 🏢 **Building2** - Department
- 📅 **Calendar** - Date created

### Layout
- Responsive cards with clear hierarchy
- Nested sections for members within groups
- Further nesting for allowed candidates
- Border-left accent for INSTRUCTIONAL restrictions

## Testing

### Test Case 1: View Empty State
**Given**: User 167 has NO proxy groups
**When**: Navigate to "My Proxy Members" tab
**Then**: See empty state message

### Test Case 2: View Single Group with DISCRETIONARY Member
**Given**: User 167 has 1 group with 1 DISCRETIONARY member
**When**: Navigate to "My Proxy Members" tab
**Then**: 
- See 1 group card
- See 1 DISCRETIONARY member (green badge)
- See message "Can vote for any candidate"
- NO allowed candidates list

### Test Case 3: View Group with INSTRUCTIONAL Member
**Given**: User 167 has 1 group with 1 INSTRUCTIONAL member
**When**: Navigate to "My Proxy Members" tab
**Then**:
- See 1 group card
- See 1 INSTRUCTIONAL member (orange badge)
- See warning "Can only vote for specific candidates"
- See orange-bordered list of allowed candidates
- Each candidate shows name, position, department

### Test Case 4: View Mixed Group
**Given**: User 167 has 1 group with both DISCRETIONARY and INSTRUCTIONAL members
**When**: Navigate to "My Proxy Members" tab
**Then**:
- Group shows "MIXED" appointment type
- See both member types with different badges
- DISCRETIONARY member shows no restrictions
- INSTRUCTIONAL member shows allowed candidates

### Test Case 5: View Inactive Group
**Given**: User 167 has 1 group with `is_active = false`
**When**: Navigate to "My Proxy Members" tab
**Then**:
- Group shows gray "Inactive" badge
- Members still visible
- Understand group is not currently in effect

## Differences from "Proxy Delegations" Tab

| Feature | Proxy Delegations Tab | My Proxy Members Tab |
|---------|----------------------|---------------------|
| **Shows** | Groups where YOU are a proxy member | Groups where YOU are the principal |
| **Perspective** | "Who am I voting for?" | "Who votes for me?" |
| **Vote Counts** | Remaining/Total votes per delegation | N/A |
| **Progress Bar** | Yes (votes used) | No |
| **Primary Use** | Track your proxy voting activity | Monitor who represents you |
| **Badge Focus** | Delegation status | Member appointment types |
| **Allowed Candidates** | No (you're the proxy) | Yes (for INSTRUCTIONAL members) |

## Benefits

1. **Transparency**: Principals can see exactly who represents them
2. **Verification**: Easy to verify INSTRUCTIONAL restrictions are correct
3. **Monitoring**: Check active/inactive status of proxy arrangements
4. **Compliance**: Audit trail of proxy relationships and restrictions
5. **User Control**: Understanding of their proxy setup at a glance

## Future Enhancements

Potential improvements:
- Add ability to activate/deactivate groups from UI
- Show voting activity of proxy members
- Add notifications when proxy members vote
- Export proxy group details
- Inline editing of allowed candidates
- Search/filter proxy members
- Compare votes cast by proxies vs your intentions
