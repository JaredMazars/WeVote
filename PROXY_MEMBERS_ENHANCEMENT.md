# Proxy Members Enhancement - VotingStatusBar

## Overview
Enhanced the VotingStatusBar component to display detailed proxy member information, including appointment types (DISCRETIONARY vs INSTRUCTIONAL) and allowed candidates for instructional proxies.

## Changes Made

### Backend Changes (`server/routes/voting-status.js`)

#### 1. Enhanced Proxy Delegations Query
Added nested queries to fetch proxy members and their allowed candidates:

```javascript
// For each proxy delegation, get the members and their allowed candidates
for (let delegation of proxyDelegations) {
  // Get all members in this proxy group
  const membersQuery = `
    SELECT 
      pgm.id,
      pgm.member_id,
      pgm.appointment_type,
      u.name as member_name,
      u.email as member_email,
      u.member_number
    FROM proxy_group_members pgm
    INNER JOIN users u ON u.id = pgm.member_id
    WHERE pgm.group_id = ${delegation.proxy_group_id}
  `;
  
  const members = await database.query(membersQuery);
  
  // For each member with INSTRUCTIONAL appointment, get allowed candidates
  for (let member of members) {
    if (member.appointment_type === 'INSTRUCTIONAL') {
      const allowedCandidatesQuery = `
        SELECT 
          pmac.employee_id,
          e.name as candidate_name,
          e.position as candidate_position,
          d.name as candidate_department
        FROM proxy_member_allowed_candidates pmac
        INNER JOIN employees e ON e.id = pmac.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE pmac.proxy_member_id = ${member.id}
      `;
      
      const allowedCandidates = await database.query(allowedCandidatesQuery);
      member.allowed_candidates = allowedCandidates;
    }
  }
  
  delegation.proxy_members = members;
}
```

#### 2. Updated Response Format
Enhanced the formatted delegations to include proxy members with their details:

```javascript
proxyMembers: delegation.proxy_members?.map(member => ({
  id: member.member_id?.toString() || '',
  name: member.member_name,
  email: member.member_email,
  memberNumber: member.member_number,
  appointmentType: member.appointment_type || 'DISCRETIONARY',
  allowedCandidates: member.allowed_candidates?.map(candidate => ({
    id: candidate.employee_id?.toString() || '',
    name: candidate.candidate_name,
    position: candidate.candidate_position,
    department: candidate.candidate_department
  })) || []
})) || []
```

### Frontend Changes (`src/components/VotingStatusBar.tsx`)

#### 1. Enhanced TypeScript Interfaces

```typescript
interface AllowedCandidate {
  id: string;
  name: string;
  position?: string;
  department?: string;
}

interface ProxyMember {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
  appointmentType: 'DISCRETIONARY' | 'INSTRUCTIONAL';
  allowedCandidates: AllowedCandidate[];
}

interface ProxyDelegation {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegatorEmail: string;
  voteType: 'employee' | 'resolution' | 'both';
  remainingVotes: number;
  totalVotes: number;
  validUntil: Date;
  proxyMembers: ProxyMember[];  // NEW
}
```

#### 2. Enhanced Data Transformation
Updated the API response transformation to map proxy members:

```typescript
proxyMembers: delegation.proxyMembers?.map((member: any) => ({
  id: member.id.toString(),
  name: member.name,
  email: member.email,
  memberNumber: member.memberNumber,
  appointmentType: member.appointmentType,
  allowedCandidates: member.allowedCandidates?.map((candidate: any) => ({
    id: candidate.id.toString(),
    name: candidate.name,
    position: candidate.position,
    department: candidate.department
  })) || []
})) || []
```

#### 3. Enhanced UI - Proxy Members Display

Added a new section under each proxy delegation card to display:

**Proxy Members List:**
- Member name, email, and member number
- Color-coded badge for appointment type:
  - 🟢 **DISCRETIONARY** (green badge) - Proxy can vote freely
  - 🟠 **INSTRUCTIONAL** (orange badge) - Proxy must vote for specific candidates

**Allowed Candidates (for INSTRUCTIONAL proxies only):**
- Displays a bordered list of allowed candidates
- Shows candidate name, position, and department
- Visual indicators with icons (Award for position, Building2 for department)

```tsx
{/* Proxy Members Section */}
{delegation.proxyMembers && delegation.proxyMembers.length > 0 && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <h5 className="text-sm font-semibold text-gray-700 mb-3">Proxy Members</h5>
    <div className="space-y-3">
      {delegation.proxyMembers.map((member) => (
        <div key={member.id} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <User className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    member.appointmentType === 'INSTRUCTIONAL' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {member.appointmentType}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{member.email}</p>
                <p className="text-xs text-gray-500">Member #: {member.memberNumber}</p>
                
                {/* Allowed Candidates for INSTRUCTIONAL proxies */}
                {member.appointmentType === 'INSTRUCTIONAL' && member.allowedCandidates.length > 0 && (
                  <div className="mt-2 pl-2 border-l-2 border-orange-300">
                    <p className="text-xs font-medium text-orange-800 mb-1">Allowed Candidates:</p>
                    <div className="space-y-1">
                      {member.allowedCandidates.map((candidate) => (
                        <div key={candidate.id} className="text-xs text-gray-700 flex items-center space-x-1">
                          <Award className="h-3 w-3 text-orange-500" />
                          <span className="font-medium">{candidate.name}</span>
                          {candidate.position && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{candidate.position}</span>
                            </>
                          )}
                          {candidate.department && (
                            <>
                              <span className="text-gray-400">•</span>
                              <Building2 className="h-3 w-3" />
                              <span>{candidate.department}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

## Database Tables Used

1. **proxy_groups** - Main proxy delegation records
2. **proxy_group_members** - Members who can vote as proxies
3. **proxy_member_allowed_candidates** - Allowed candidates for INSTRUCTIONAL proxies
4. **employees** - Employee/candidate information
5. **departments** - Department information
6. **users** - User account information

## Features

### 1. Appointment Type Indicators
- **DISCRETIONARY** (Green Badge): Proxy member has full discretion to vote for any candidate
- **INSTRUCTIONAL** (Orange Badge): Proxy member must only vote for pre-approved candidates

### 2. Allowed Candidates List
For INSTRUCTIONAL proxies, displays:
- Candidate full name
- Position/role
- Department
- Visual indicators with icons

### 3. Member Information
Each proxy member card shows:
- Full name
- Email address
- Member number
- Appointment type badge

## UI Design

- **Color Coding:**
  - Green badges = DISCRETIONARY (freedom to vote)
  - Orange badges = INSTRUCTIONAL (restricted voting)
  
- **Visual Hierarchy:**
  - Proxy delegation card (main level)
  - Proxy members section (nested, bordered)
  - Allowed candidates list (nested within instructional members, orange border)

- **Responsive Layout:**
  - Stacks vertically for easy reading
  - Icons provide visual cues
  - Consistent spacing and padding

## Testing

To test this feature:

1. **Backend:** Restart the server
   ```bash
   cd server
   node app.js
   ```

2. **Frontend:** Refresh browser at http://localhost:5173

3. **View Proxy Members:**
   - Login as a user who has proxy delegations
   - Click the VotingStatusBar at bottom left
   - Click "View Details"
   - Navigate to "Proxy Delegations" tab
   - Expand any delegation to see proxy members

4. **Expected Display:**
   - All proxy members listed with their details
   - DISCRETIONARY members show green badge
   - INSTRUCTIONAL members show orange badge with allowed candidates list
   - Candidate details include name, position, and department

## Benefits

1. **Transparency:** Users can see exactly who is voting on their behalf
2. **Compliance:** INSTRUCTIONAL proxies display the restrictions clearly
3. **Audit Trail:** All proxy member information is visible for verification
4. **User Experience:** Clear visual distinction between proxy types
5. **Information Density:** All relevant details in one place without clutter

## Future Enhancements

Potential improvements:
- Add filtering/search for proxy members
- Show voting history per proxy member
- Add notifications when proxy members cast votes
- Display proxy member activity status (active votes, pending votes)
- Export proxy delegation details to PDF/CSV
