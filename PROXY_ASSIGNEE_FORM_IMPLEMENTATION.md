# Proxy Assignee Form Implementation

## Overview
Extended the Proxy Assignee form to support instructional proxy appointments with allowed candidate selection and automatic assignee prepopulation.

## What Changed

### 1. Frontend (`src/pages/ProxyAppointmentFormAsignee.tsx`)

#### Added State Management
```typescript
const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; name: string }>>([]);
const [assignee, setAssignee] = useState({
  id: '',
  name: '',
  email: '',
  memberNumber: '',
  appointmentType: 'discretional' | 'instructional',
  allowedCandidates: string[]
});
```

#### Data Fetching
- **Fetch Employees**: `GET /api/admin/employees` to populate the allowed candidates list
- **Fetch Current User**: `GET /api/auth/verify` to prepopulate assignee details (name, email, member number)

#### UI Components Added
1. **Section 5: Proxy Member (You)** - Shows prepopulated assignee details
2. **Appointment Type Selector** - Radio buttons for Discretional/Instructional
3. **Allowed Candidates Multi-Select** - Grid of checkboxes (shows when Instructional selected)
   - Lists all available employees
   - Tracks selected candidates in `assignee.allowedCandidates`
   - Shows count of selected employees

#### Validation Enhanced
- Validates assignee name is loaded
- Validates assignee membership number exists
- Validates at least one employee selected when appointment type is Instructional
- Displays error messages inline for assignee-related issues

#### Payload Structure
```json
{
  "proxy_groups": { ... },
  "proxy_group_members": [
    {
      "full_name": "Assignee Name",
      "membership_number": "12345",
      "appointment_type": "INSTRUCTIONAL",
      "allowedCandidates": [1, 2, 3],
      "votes_allocated": 0
    },
    // ... other members
  ],
  "assignee": {
    "id": "userId",
    "memberNumber": "12345",
    "appointmentType": "INSTRUCTIONAL",
    "allowedCandidates": [1, 2, 3]
  }
}
```

#### Event Dispatch
- On successful submission, dispatches `window.dispatchEvent(new Event('proxyDataUpdated'))`
- This triggers VotingStatusBar to refresh and show updated proxy data

### 2. Backend (`server/routes/proxy.js`)

#### POST `/api/proxy/proxy-form` Enhancements

**Flexible Field Naming**
```javascript
const memberAllowedCandidates = member.allowed_candidates || member.allowedCandidates || [];
```
Accepts both snake_case and camelCase for compatibility.

**Assignee Processing Logic**
```javascript
if (req.body.assignee && (req.body.assignee.allowedCandidates || req.body.assignee.allowed_candidates)) {
  const assigneeObj = req.body.assignee;
  const allowedList = assigneeObj.allowedCandidates || assigneeObj.allowed_candidates || [];
  
  // Find the proxy_group_member record for this assignee
  const memberMembershipNumber = assigneeObj.memberNumber || assigneeObj.membershipNumber;
  let pgmRows = await database.query(`
    SELECT id FROM proxy_group_members 
    WHERE group_id = ${proxyGroupId} AND membership_number = '${memberMembershipNumber}'
  `);
  
  // Insert allowed candidates
  if (pgmRows && pgmRows.length > 0) {
    const proxyMemberIdForAssignee = pgmRows[0].id;
    for (const candidateId of allowedList) {
      await Proxy.addAllowedCandidate({
        proxy_member_id: proxyMemberIdForAssignee,
        employee_id: candidateId
      });
    }
  }
}
```

**Database Operations**
1. Creates `proxy_groups` record with principal details
2. Creates `proxy_group_members` for each member (including assignee)
3. For INSTRUCTIONAL members, inserts rows into `proxy_member_allowed_candidates`
4. Creates `vote_splitting_settings` for vote tracking
5. Deducts allocated votes from principal's vote_weight

### 3. Database Schema

**Tables Involved**
- `proxy_groups` - Group metadata and appointment type
- `proxy_group_members` - Individual proxy members with votes_allocated
- `proxy_member_allowed_candidates` - Restricts which employees instructional proxies can vote for
- `vote_splitting_settings` - Tracks vote allocation per proxy member
- `users` - Principal and member user records

**Key Relationships**
```
proxy_groups (1) ──────< (N) proxy_group_members
                                   │
                                   │
                                   v (1)
                                (N) proxy_member_allowed_candidates
                                   │
                                   │
                                   v (N)
                                   employees
```

## Testing Checklist

### Frontend Tests
- [ ] Assignee name/email/member number loads correctly
- [ ] Employee list populates in allowed candidates section
- [ ] Appointment type radio buttons work (Discretional/Instructional)
- [ ] Multi-select shows only when Instructional selected
- [ ] Checkbox selection updates `assignee.allowedCandidates` array
- [ ] Selection count displays correctly
- [ ] Validation errors show when:
  - [ ] Assignee not loaded
  - [ ] No employees selected for Instructional type
- [ ] Form submits successfully
- [ ] Success alert displays
- [ ] `proxyDataUpdated` event fires

### Backend Tests
- [ ] POST request with assignee object succeeds
- [ ] `proxy_group_members` record created for assignee
- [ ] `proxy_member_allowed_candidates` rows inserted correctly
- [ ] Accepts both `allowedCandidates` and `allowed_candidates` fields
- [ ] Handles missing assignee gracefully (no crash)
- [ ] Returns appropriate error messages

### Database Tests
```sql
-- Verify proxy group created
SELECT * FROM proxy_groups WHERE principal_id = [user_id] ORDER BY created_at DESC;

-- Verify assignee as proxy member
SELECT * FROM proxy_group_members WHERE group_id = [group_id];

-- Verify allowed candidates
SELECT 
  pgm.full_name,
  pgm.appointment_type,
  pmac.employee_id,
  e.name as candidate_name
FROM proxy_group_members pgm
LEFT JOIN proxy_member_allowed_candidates pmac ON pmac.proxy_member_id = pgm.id
LEFT JOIN employees e ON e.id = pmac.employee_id
WHERE pgm.group_id = [group_id];
```

### Integration Tests
- [ ] Submit form from ProxyAppointmentFormAsignee
- [ ] Navigate to ViewMyProxy page
- [ ] Verify assignee shown as proxy member
- [ ] Verify allowed candidates displayed for instructional appointments
- [ ] Check VotingStatusBar updates automatically
- [ ] Verify myProxyGroups shows assignee with allowed candidates

## API Endpoints Used

### Frontend → Backend
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/employees` | GET | Fetch employees for allowed candidates |
| `/api/auth/verify` | GET | Get current logged-in user details |
| `/api/proxy/proxy-form` | POST | Submit proxy form with assignee |

### Cross-Component Events
| Event | Trigger | Listener |
|-------|---------|----------|
| `proxyDataUpdated` | ProxyAppointmentFormAsignee (on submit success) | VotingStatusBar, ViewMyProxy |

## Error Handling

### Frontend Errors
- **Assignee not loaded**: Shows error banner "Assignee details not loaded. Please refresh the page."
- **Missing membership number**: "Assignee membership number missing."
- **No candidates selected**: "Please select at least one employee for instructional proxy"
- **Network errors**: Alert with error message from server

### Backend Errors
- **Principal not found**: Throws "Principal member not found in users table"
- **Member not found**: Throws "Member [name] not found in users table"
- **Database errors**: Returns 500 with error message

## Known Issues & Limitations
1. **Lint Warnings**: `addProxyMember` and `downloadPDF` show as unused but are actually used in UI
2. **Token Refresh**: No automatic retry if auth token expires during fetch
3. **Duplicate Prevention**: No check for duplicate allowed candidate selections (database allows)
4. **Assignee Override**: If assignee manually added in proxy_group_members AND provided as top-level assignee, may create duplicate entries

## Future Enhancements
- [ ] Add vote allocation UI for assignee (currently defaults to 0)
- [ ] Allow editing allowed candidates after form submission
- [ ] Add bulk select/deselect for allowed candidates
- [ ] Implement debounced search for employee list
- [ ] Add assignee photo/avatar display
- [ ] Support multiple assignees per form
- [ ] Add preview mode before final submission

## Deployment Notes
1. Ensure migration `add_vote_allocation.sql` has been run
2. Verify `proxy_member_allowed_candidates` table exists
3. Check API endpoint `/api/admin/employees` is accessible
4. Confirm CORS settings allow frontend to call backend
5. Test with real user accounts (not just admin)

## Related Documentation
- `PROXY_MANAGEMENT_GUIDE.md` - Complete proxy system overview
- `VOTE_DELEGATION_SYSTEM.md` - Vote allocation and delegation
- `MY_PROXY_MEMBERS_TAB.md` - Proxy member viewing and editing

---
**Last Updated**: 2025-11-19  
**Status**: ✅ Implementation Complete
