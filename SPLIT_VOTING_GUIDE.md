# Split Voting Feature - Complete Guide

## Overview

The Split Voting feature allows proxy holders to select specific proxy members for individual votes, providing granular control over proxy voting allocation. Instead of casting all proxy votes together (all-or-nothing), proxy holders can now choose which proxy members' votes to include for each candidate or resolution.

## Feature Highlights

✨ **Granular Control**: Select specific proxies for each vote
🎯 **Real-time Weight Calculation**: See vote weight update as you select proxies
📊 **Visual Selection UI**: Checkbox interface with vote weights
🔍 **Transparent Display**: Clear breakdown of selected proxies and their weights
⚡ **Smart Logic**: Automatically includes your own vote plus selected proxies

## Use Cases

### Scenario 1: Strategic Candidate Voting
**Steve (Proxy Holder)** has proxy appointments from:
- Shane (2 votes)
- Bob (3 votes)
- Mary (5 votes)

**Voting Strategy:**
- **For Damien**: Steve selects Shane + Bob = 1 (own) + 2 + 3 = **6 votes**
- **For Lisa**: Steve selects only Mary = 1 (own) + 5 = **6 votes**
- **For John**: Steve selects all proxies = 1 + 2 + 3 + 5 = **11 votes**

### Scenario 2: Departmental Alignment
**Marketing Manager** with proxies from:
- Design Team Member (2 votes)
- Content Writer (1 vote)
- Social Media Specialist (3 votes)

For a **Design-focused candidate**, only select Design Team Member.
For a **Content strategy candidate**, select Content Writer + Social Media Specialist.

## How It Works

### 1. Vote Type Selection

When viewing a candidate, you'll see three voting options:

#### Regular Vote
- Vote with only your own voting power
- Default: 1 vote
- Use when you want to vote independently

#### Proxy Vote
- Vote with all assigned proxy votes
- Includes your vote + all proxy members
- All-or-nothing approach

#### Split Vote ⭐ NEW
- Select specific proxies for this vote
- Only appears if you have **2 or more proxies**
- Provides maximum flexibility

### 2. Proxy Selection Interface

When you choose Split Vote:

```
┌─────────────────────────────────────────┐
│ Select Proxies to Vote With            │
├─────────────────────────────────────────┤
│ □ Shane Johnson                  2 votes│
│   Senior Developer                       │
├─────────────────────────────────────────┤
│ ☑ Bob Williams                   3 votes│
│   Team Lead                              │
├─────────────────────────────────────────┤
│ ☑ Mary Davis                     5 votes│
│   Project Manager                        │
└─────────────────────────────────────────┘

Total Vote Weight: 9
Your vote (1) + 2 selected proxies
```

### 3. Real-time Weight Calculation

As you check/uncheck proxies:
- Total weight updates instantly
- Shows breakdown: Your vote (1) + Selected proxies (X)
- Visual feedback with blue highlight for selected proxies

### 4. Vote Submission

Submit button:
- **Disabled** if no proxies selected
- **blue gradient** styling for split votes
- Shows "Cast Split Vote" text
- Loading state during submission

## Technical Implementation

### Backend Logic (proxyVoting.ts)

#### Updated castVote Function

```typescript
export const castVote = (
  userId: number, 
  motionId: number, 
  voteValue: VoteValue,
  candidateId?: string,
  selectedProxyIds?: number[]
): MockVote => {
  // Get all proxy assignees
  const allProxyAssignees = getProxyAssignees(userId);
  
  // Filter based on split voting selection
  let proxyAssignees = allProxyAssignees;
  let isSplitVote = false;
  
  if (selectedProxyIds !== undefined) {
    if (selectedProxyIds.length === 0) {
      // Empty array = only own vote, no proxies
      proxyAssignees = [];
    } else {
      // Filter to only selected proxies
      proxyAssignees = allProxyAssignees.filter(
        assignee => selectedProxyIds.includes(assignee.id)
      );
      isSplitVote = true;
    }
  }
  
  // Calculate vote weight
  const voteWeight = 1 + proxyAssignees.reduce(
    (sum, assignee) => sum + (assignee.voteWeight || 1), 
    0
  );
  
  // Create vote record
  const vote: MockVote = {
    id: mockVotes.length + 1,
    userId,
    motionId,
    voteValue,
    voteWeight,
    timestamp: new Date().toISOString(),
    isProxyVote: proxyAssignees.length > 0,
    candidate_id: candidateId,
    split_vote: isSplitVote,
    selected_proxy_ids: isSplitVote ? selectedProxyIds : undefined
  };
  
  return vote;
};
```

#### Key Changes:
- Added `selectedProxyIds?: number[]` parameter
- Filters proxy assignees based on selection
- Sets `split_vote: true` flag
- Stores `selected_proxy_ids` for audit trail
- Calculates weight from selected proxies only

### Frontend UI (CandidateVoting.tsx)

#### State Management

```typescript
const [voteType, setVoteType] = useState<'regular' | 'proxy' | 'split' | null>(null);
const [selectedProxyIds, setSelectedProxyIds] = useState<number[]>([]);
const [splitVoteWeight, setSplitVoteWeight] = useState(0);
```

#### Proxy Selection Function

```typescript
const toggleProxySelection = (proxyId: number) => {
  setSelectedProxyIds(prev => {
    const newSelection = prev.includes(proxyId)
      ? prev.filter(id => id !== proxyId)
      : [...prev, proxyId];
    
    // Calculate new weight
    const selectedProxies = voteWeight.proxyAssignees.filter(
      (assignee: any) => newSelection.includes(assignee.id)
    );
    const newWeight = voteWeight.ownVote + selectedProxies.reduce(
      (sum: number, assignee: any) => sum + (assignee.voteWeight || 1), 
      0
    );
    setSplitVoteWeight(newWeight);
    
    return newSelection;
  });
};
```

#### Vote Submission Handler

```typescript
const handleSubmitVote = async () => {
  if (!selectedCandidate || !voteType || !user) return;
  
  const userId = parseInt(user.id);
  const candidateId = selectedCandidate.id;
  const voteValue = 'Yes';
  
  if (voteType === 'split') {
    // Cast split vote with selected proxies only
    castVote(userId, 1, voteValue, candidateId, selectedProxyIds);
  } else if (voteType === 'proxy') {
    // Cast full proxy vote
    castVote(userId, 1, voteValue, candidateId);
  } else {
    // Cast regular vote (own vote only)
    castVote(userId, 1, voteValue, candidateId, []);
  }
  
  // ... rest of submission logic
};
```

## UI Components

### Split Vote Button
```tsx
{voteWeight.proxyCount > 1 && (
  <button
    onClick={() => handleVoteTypeSelect('split')}
    className="p-6 border-2 border-blue-500 rounded-xl hover:bg-blue-50 transition-all group"
  >
    <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
    <p className="font-bold text-[#464B4B] mb-1">Split Vote</p>
    <p className="text-sm text-[#464B4B]/60">
      Select specific proxies to vote for this candidate
    </p>
    <div className="mt-3 text-blue-600 font-semibold">
      Choose from {voteWeight.proxyCount} proxies
    </div>
  </button>
)}
```

### Proxy Checkbox List
```tsx
<div className="space-y-3 mb-6">
  {voteWeight.proxyAssignees.map((assignee: any) => (
    <label
      key={assignee.id}
      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
        selectedProxyIds.includes(assignee.id)
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={selectedProxyIds.includes(assignee.id)}
          onChange={() => toggleProxySelection(assignee.id)}
          className="w-5 h-5 text-blue-600 rounded"
        />
        <div>
          <p className="font-semibold text-[#464B4B]">{assignee.name}</p>
          <p className="text-xs text-[#464B4B]/60">{assignee.position}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-blue-600">
          {assignee.voteWeight || 1} vote{(assignee.voteWeight || 1) > 1 ? 's' : ''}
        </p>
      </div>
    </label>
  ))}
</div>
```

### Weight Display
```tsx
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
  <div className="flex justify-between items-center">
    <span className="text-[#464B4B]/70">Total Vote Weight:</span>
    <div className="text-right">
      <p className="text-2xl font-bold text-blue-600">{splitVoteWeight}</p>
      <p className="text-xs text-[#464B4B]/60">
        Your vote (1) + {selectedProxyIds.length} selected {selectedProxyIds.length === 1 ? 'proxy' : 'proxies'}
      </p>
    </div>
  </div>
</div>
```

## Testing Scenarios

### Test 1: Split Vote with Multiple Proxies
1. Log in as user with 2+ proxy assignments
2. Click on any candidate
3. Select "Split Vote" option
4. Check/uncheck different proxies
5. Verify weight updates in real-time
6. Submit vote
7. Check console for split vote log

### Test 2: All Proxies vs Split Vote Comparison
1. Vote for Candidate A using "Proxy Vote" (all proxies)
2. Note total weight (e.g., 11 votes)
3. Vote for Candidate B using "Split Vote" with 2 proxies
4. Note split weight (e.g., 6 votes)
5. Verify different weights recorded

### Test 3: Edge Cases
- **No proxies selected**: Submit button should be disabled
- **Select all proxies**: Weight should match full proxy vote
- **Toggle selection**: Weight should update instantly
- **Cancel and retry**: State should reset properly

## Mock Data Setup

To test split voting, use these mock user IDs:

```typescript
// User 2 (Steve Martinez) - Proxy holder
{
  id: 2,
  name: 'Steve Martinez',
  email: 'steve@forvismazars.com',
  // Has proxies from users 3 and 4
}

// User 3 (Shane Wilson) - Assigned proxy to Steve
{
  id: 3,
  proxy_to_user_id: 2,
  voteWeight: 2
}

// User 4 (Bob Taylor) - Assigned proxy to Steve
{
  id: 4,
  proxy_to_user_id: 2,
  voteWeight: 3
}
```

## Benefits

### For Proxy Holders
- **Flexibility**: Different proxy combinations for different votes
- **Strategic Voting**: Align proxy votes with candidate expertise
- **Transparency**: Clear view of who you're voting for
- **Control**: Maintain independence while respecting proxy appointments

### For Principal Members
- **Granular Delegation**: Know your proxy can split your vote strategically
- **Confidence**: Trust in proxy's ability to vote appropriately
- **Representation**: Better alignment with your preferences

### For the Organization
- **Better Outcomes**: More thoughtful voting decisions
- **Audit Trail**: Complete record of split vote selections
- **Engagement**: Increased participation through flexibility
- **Fairness**: Ensures votes go where they're most appropriate

## Best Practices

### When to Use Split Voting
✅ Different candidates have different areas of expertise
✅ Proxy members have varying levels of knowledge about candidates
✅ Strategic vote allocation needed across multiple candidates
✅ Want to honor specific proxy members' preferences

### When to Use Full Proxy Vote
✅ All proxy members would vote the same way
✅ Candidate is universally supported/opposed
✅ Want to cast maximum vote weight
✅ Time-sensitive voting situation

### When to Use Regular Vote
✅ Personal conviction differs from proxy members
✅ No proxy appointments assigned
✅ Want to vote independently
✅ Testing override functionality

## Troubleshooting

### Split Vote Option Not Appearing
**Problem**: Only Regular and Proxy vote buttons show
**Solution**: Split vote requires 2+ proxy assignments. Check:
```typescript
voteWeight.proxyCount > 1
```

### Vote Weight Not Updating
**Problem**: Weight stays at 1 even when selecting proxies
**Solution**: Verify `toggleProxySelection` function is called on checkbox change

### Submit Button Disabled
**Problem**: Can't submit split vote
**Solution**: Must select at least one proxy. Check:
```typescript
selectedProxyIds.length === 0
```

### Console Errors
**Problem**: Type errors with castVote function
**Solution**: Ensure parameters match signature:
```typescript
castVote(userId, motionId, voteValue, candidateId?, selectedProxyIds?)
```

## Future Enhancements

### Potential Features
- **Save Split Vote Templates**: Save common proxy combinations
- **Proxy Member Preferences**: View proxy members' preferred candidates
- **Split Vote History**: See past split vote selections
- **Bulk Split Voting**: Apply same split pattern to multiple votes
- **Weighted Recommendations**: AI suggests optimal proxy selection

### Analytics Dashboard
- Track split voting patterns
- Measure engagement with split voting feature
- Analyze proxy selection trends
- Report on vote distribution strategies

## Support

For issues or questions:
- Check console logs for split vote debugging
- Review `proxyVoting.ts` for business logic
- Inspect `CandidateVoting.tsx` for UI implementation
- Verify mock data has proper proxy relationships

## Conclusion

The Split Voting feature provides unprecedented flexibility in proxy voting systems. By allowing proxy holders to strategically allocate proxy votes across different candidates, the platform ensures more thoughtful and representative voting outcomes.

**Key Takeaway**: Split voting transforms proxy voting from an all-or-nothing system into a nuanced, strategic tool that respects both proxy holders' judgment and principal members' trust.
