# 📊 Voting Status Bar - User Guide

## Overview

The **Voting Status Bar** is a floating widget that provides real-time tracking of users' voting power, vote history, proxy delegations, and proxy group members. It appears on all major voting pages and gives users complete visibility into their voting status.

---

## 🎯 Features

### 1. **Floating Status Bar** (Bottom-Left Corner)
- **Collapsed View**: Shows total votes remaining and votes cast
- **Expanded View**: Displays personal votes, proxy votes, and progress bar
- **Always Accessible**: Visible on Home, Voting Selection, Candidate Voting, and Resolution Voting pages
- **Non-Intrusive**: Stays in bottom-left corner, can be collapsed/expanded

### 2. **Detailed Modal** (4 Tabs)

#### **Overview Tab**
- Personal votes remaining/total
- Proxy votes remaining/total  
- Total votes used
- Total available votes
- Recent vote activity (last 3 votes)
- Visual stats cards with icons

#### **Vote History Tab**
- Complete list of all votes cast
- Vote type (Employee/Resolution)
- Target name, position, department
- Vote value (VOTE/ABSTAIN)
- Timestamp
- Proxy indicator (if voted on behalf of someone)
- Vote weight

#### **Proxy Delegations Tab**
- People who have delegated their votes to you
- Remaining votes per delegation
- Vote type restrictions (employee/resolution/both)
- Validity period
- **Proxy Members**: Shows who assigned you and their appointment type
  - **INSTRUCTIONAL**: Can only vote for specific pre-assigned candidates
  - **DISCRETIONARY**: Can vote for any candidate
- Lists allowed candidates for INSTRUCTIONAL proxies

#### **My Proxy Members Tab**
- Groups where you've assigned proxies to vote on your behalf
- Group name and status (Active/Inactive)
- Appointment type (INSTRUCTIONAL/DISCRETIONARY/MIXED)
- Creation date
- **People Who Can Vote for You**: Complete list with:
  - Member name, email, member number
  - Appointment type
  - Explanation of what they can do
  - For INSTRUCTIONAL: Shows exact list of candidates they can vote for

---

## 🚀 How It Works

### For Regular Users

1. **After Login**: Voting Status Bar automatically appears on voting-related pages
2. **Check Your Status**: Click the bar or the eye icon to expand
3. **View Details**: Click "View Details" to open the full modal
4. **Track Votes**: See all your votes in the History tab
5. **Manage Proxies**: View who can vote for you and who you can vote for

### For Proxy Holders

1. **Delegations Tab**: See all people who delegated votes to you
2. **Check Restrictions**: 
   - **INSTRUCTIONAL**: You can only vote for specific candidates listed
   - **DISCRETIONARY**: You can vote for anyone on their behalf
3. **Monitor Usage**: Track how many proxy votes you've used vs. remaining

### For Proxy Assignors

1. **My Proxy Members Tab**: See everyone who can vote on your behalf
2. **Understand Permissions**:
   - **INSTRUCTIONAL**: They can only vote for candidates you pre-selected
   - **DISCRETIONARY**: They can vote for anyone
3. **Group Management**: See which groups are active/inactive

---

## 📱 UI Components

### Collapsed Bar
```
┌─────────────────────────────────────┐
│ [Vote Icon] 15 votes left [5 proxy] │
│             3 votes cast             │
└─────────────────────────────────────┘
```

### Expanded Bar
```
┌─────────────────────────────────────┐
│ [Vote Icon] 15 votes left [5 proxy] │
│             3 votes cast             │
├─────────────────────────────────────┤
│ Personal votes:    10/15            │
│ Proxy votes:        5/8             │
│ Progress: [████████░░] 17%          │
│ [View Details Button]               │
└─────────────────────────────────────┘
```

### Modal Tabs
```
┌──────────────────────────────────────────┐
│ Voting Status                        [X] │
│ 15 votes remaining out of 18 total      │
├──────────────────────────────────────────┤
│ Overview | History | Delegations | Groups│
├──────────────────────────────────────────┤
│                                          │
│         [Tab Content Here]               │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🔄 Real-Time Updates

The Voting Status Bar automatically refreshes when:
- ✅ A vote is cast (votingStatusUpdated event)
- ✅ A vote is removed/changed
- ✅ Proxy assignments are updated (proxyDataUpdated event)
- ✅ New proxy delegations are created
- ✅ Proxy groups are activated/deactivated

---

## 🎨 Visual Design

### Color Coding
- **Blue Gradient**: Personal votes and main branding
- **Indigo**: Proxy votes
- **Green**: Completed actions / Used votes
- **Gray**: Total available / Neutral stats
- **Orange**: INSTRUCTIONAL proxy type
- **Green Badge**: DISCRETIONARY proxy type

### Icons
- 🗳️ **Vote**: General voting
- 👤 **User**: Personal/individual
- 👥 **Users**: Groups
- ✓ **UserCheck**: Proxy members
- 📅 **Calendar**: Dates/timeline
- 🏆 **Award**: Candidates/positions
- 🏢 **Building2**: Departments
- ⏰ **Clock**: Remaining/pending
- ✅ **CheckCircle**: Completed/approved

---

## 📊 Data Structure

The component fetches data from:
```
GET /api/voting-status/status/{userId}
```

### Response Structure
```typescript
{
  success: boolean,
  data: {
    personalVotesRemaining: number,
    personalVotesTotal: number,
    proxyVotesRemaining: number,
    proxyVotesTotal: number,
    totalVotesRemaining: number,
    totalVotesUsed: number,
    voteHistory: VoteRecord[],
    proxyDelegations: ProxyDelegation[],
    myProxyGroups: MyProxyGroup[]
  }
}
```

### Key Interfaces
- **VoteRecord**: Individual vote with target, value, timestamp, proxy info
- **ProxyDelegation**: Someone who delegated votes to you
- **ProxyMember**: Person who can vote (with appointment type and allowed candidates)
- **MyProxyGroup**: Group where you assigned proxies to others
- **AllowedCandidate**: Specific candidates for INSTRUCTIONAL proxies

---

## 🔐 Authentication & Authorization

- Requires valid JWT token in localStorage
- User ID retrieved from AuthContext
- API validates user has permission to view their voting status
- Proxy restrictions enforced at API level

---

## 🛠️ Technical Details

### Component Location
```
src/components/VotingStatusBar.tsx
```

### Integration Points
```typescript
// Added to these pages:
- src/pages/Home.tsx
- src/pages/VotingSelection.tsx
- src/pages/CandidateVoting.tsx
- src/pages/ResolutionVoting.tsx
```

### State Management
- Local component state for UI (expanded, modal, active tab)
- Fetches data on mount and when custom events fire
- Uses AuthContext for user authentication

### Event Listeners
```typescript
window.addEventListener('proxyDataUpdated', handleProxyUpdate);
window.addEventListener('votingStatusUpdated', handleVotingStatusUpdate);
```

### Dependencies
- framer-motion: Animations
- lucide-react: Icons
- React Router: Navigation
- AuthContext: User authentication

---

## 📋 Usage Examples

### Example 1: Regular User with No Proxies
```
Personal votes: 5/5
Proxy votes: 0/0
Total votes remaining: 5
Total votes used: 0
```
- User sees only their personal votes
- No proxy tabs shown (empty state)

### Example 2: User with Proxy Delegations
```
Personal votes: 3/5
Proxy votes: 8/10
Total votes remaining: 11
Total votes used: 6
```
- User has used 2 personal votes, 2 proxy votes
- Delegations tab shows 2 people who delegated votes
- One INSTRUCTIONAL (can only vote for candidates A, B, C)
- One DISCRETIONARY (can vote for anyone)

### Example 3: User with Assigned Proxies
```
My Proxy Groups: 2 groups
- Executive Proxy Group (Active)
  - John Doe (DISCRETIONARY) - Can vote for anyone
  - Jane Smith (INSTRUCTIONAL) - Can only vote for:
    * Candidate A (CEO, Finance)
    * Candidate B (CFO, Finance)
```

---

## 🐛 Error Handling

### No User ID
```
Error: User ID not found. Please log in again.
```
- User is redirected to login

### No Token
```
Error: Authentication token not found. Please log in again.
```
- Session expired, user must re-authenticate

### API Error
```
Error: Failed to fetch voting status: [error message]
```
- Shows error in collapsed bar
- User can retry by refreshing page

### No Data
```
Loading voting status...
```
- Shows spinner while fetching
- Graceful handling if data is empty

---

## 🎓 Proxy Appointment Types Explained

### DISCRETIONARY Proxy
- **What it means**: "Vote however you think is best"
- **Flexibility**: Can vote for ANY candidate/resolution
- **Use case**: You trust the proxy to make good decisions
- **Visual**: Green badge

### INSTRUCTIONAL Proxy
- **What it means**: "Only vote for these specific candidates"
- **Restrictions**: Can ONLY vote for pre-selected candidates
- **Use case**: You want control over who gets your votes
- **Visual**: Orange badge with candidate list

---

## 🚨 Important Notes

1. **Backend Required**: This component requires the voting-status API endpoint to be implemented
2. **Real-time Updates**: Ensure your backend emits events when votes/proxies change
3. **Token Expiry**: Component will show errors if JWT token expires
4. **Mobile Responsive**: Bar positioned bottom-left works on all screen sizes
5. **Z-Index**: Bar has z-index of 40, modal has 50 (ensure no conflicts)

---

## 📞 Troubleshooting

### Bar Not Appearing
1. Check if user is logged in (token in localStorage)
2. Verify component is imported in the page
3. Check console for API errors

### Data Not Updating
1. Verify API endpoint is returning correct data structure
2. Check if events are being dispatched:
   ```typescript
   window.dispatchEvent(new Event('votingStatusUpdated'));
   ```
3. Confirm token is valid and not expired

### Proxy Candidates Not Showing
1. Check if `allowedCandidates` array is populated in API response
2. Verify `appointmentType` is 'INSTRUCTIONAL'
3. Ensure candidate objects have `id`, `name`, `position`, `department`

---

## 🎉 Success Indicators

✅ Component loads without errors  
✅ Shows correct vote counts  
✅ Updates in real-time after voting  
✅ Proxy delegations display correctly  
✅ INSTRUCTIONAL proxies show allowed candidates  
✅ Modal opens and tabs work  
✅ Animations are smooth  
✅ Mobile responsive  
✅ Error states handled gracefully  

---

## 🔮 Future Enhancements

- [ ] Push notifications when proxy votes on your behalf
- [ ] Export vote history to CSV
- [ ] Filter vote history by date range
- [ ] Group vote analytics (most voted candidates)
- [ ] Proxy performance metrics
- [ ] Voting reminders for unused votes
- [ ] Comparison with other voters (anonymized)

---

**Built with ❤️ for WeVote Platform**  
*Empowering democratic decision-making through technology*
