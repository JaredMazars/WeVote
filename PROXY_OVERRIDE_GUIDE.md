# Proxy Vote Override Feature - Implementation Guide

## 🎯 Overview

The proxy voting system now supports **proxy vote override**, allowing the principal member (assignor) to vote themselves even after assigning a proxy. When they vote, their vote **overrides** any proxy vote cast on their behalf.

---

## 🔄 How It Works

### Scenario 1: Principal Member Votes Before Proxy
```
1. Alice assigns David as her proxy (Alice has 2 votes)
2. Alice changes her mind and votes herself
3. Alice's vote = 2 votes (her full weight)
4. David can still vote, but only with his own vote + other proxies
```

### Scenario 2: Proxy Votes First, Then Principal Member Overrides
```
1. Alice assigns David as her proxy (Alice has 2 votes)
2. David votes YES (his vote = 1 + 2 + 3 = 6 votes for himself + Alice + Bob)
3. Alice returns and votes NO herself
4. System automatically:
   - Removes Alice's 2 votes from David's vote
   - David's vote now = 1 + 3 = 4 votes (himself + Bob only)
   - Alice's vote = 2 votes (her full weight)
5. Final tally:
   - YES: 4 votes (David + Bob's proxy)
   - NO: 2 votes (Alice)
```

---

## 📊 Updated Logic Flow

### Before (Old Behavior)
```
Principal assigns proxy → Proxy votes → Principal CANNOT vote
```

### After (New Behavior with Override)
```
Principal assigns proxy → Proxy votes → Principal CAN STILL vote
                                      ↓
                        Principal's vote overrides proxy vote
                                      ↓
                        Vote weights automatically adjusted
```

---

## 💻 Code Changes

### 1. Updated `checkVoteEligibility()` Function

**Before:**
- Returned `canVote: false` if proxy was assigned
- Showed message: "You assigned David Wilson as your proxy holder. They will vote on your behalf."

**After:**
- Returns `canVote: true` even if proxy is assigned
- Adds new fields:
  - `willOverride: true` - If proxy already voted
  - `overrideMessage` - Explains what will happen
  - `hasProxy: true` - If proxy assigned but hasn't voted yet
  - `proxyMessage` - Info message about proxy

### 2. Updated `castVote()` Function

**New Steps Added:**
1. Check if this is an override scenario
2. Find the proxy holder's vote
3. Remove the principal's vote weight from proxy's total
4. Remove the principal from proxy's assignee list
5. Update the proxy vote's `is_proxy_vote` flag if needed
6. Record the principal's own vote separately
7. Return success with override notification

---

## 🎨 UI Changes

### New Warning Banners

#### 1. Proxy Override Warning (Orange)
Shown when proxy already voted on your behalf:
```
┌─────────────────────────────────────────────┐
│  ⚠️  Override Proxy Vote                    │
│                                              │
│  You assigned David Wilson as your proxy    │
│  and they already voted. Your vote will     │
│  override their proxy vote on your behalf.  │
└─────────────────────────────────────────────┘
```

#### 2. Proxy Assignment Info (Blue)
Shown when proxy assigned but hasn't voted yet:
```
┌─────────────────────────────────────────────┐
│  ✓  You Have a Proxy Assigned               │
│                                              │
│  You assigned David Wilson as your proxy,   │
│  but you can still vote yourself. Your vote │
│  will take precedence.                      │
└─────────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Test Case 1: Override After Proxy Vote

**Setup:**
```typescript
// Alice assigns David as proxy
mockUsers[0].proxy_assignee_id = 4;  // Alice → David
mockUsers[0].vote_weight = 2;

// Bob assigns David as proxy
mockUsers[1].proxy_assignee_id = 4;  // Bob → David
mockUsers[1].vote_weight = 3;
```

**Steps:**
1. David votes YES
   ```typescript
   castVote(4, 101, 'Yes');
   // Result: { success: true, vote_weight: 6 }
   // (1 own + 2 Alice + 3 Bob)
   ```

2. Check results
   ```typescript
   getMotionResults(101);
   // YES: 6 votes (100%)
   ```

3. Alice votes NO (override)
   ```typescript
   castVote(1, 101, 'No');
   // Result: { success: true, vote_weight: 2, overridden: true }
   ```

4. Check updated results
   ```typescript
   getMotionResults(101);
   // YES: 4 votes (67%) - David + Bob
   // NO: 2 votes (33%) - Alice
   ```

**Console Output:**
```
Override: Removed 2 vote(s) from proxy holder's vote. New weight: 4
Vote recorded successfully. Your vote counts as 2 vote(s). (Your proxy vote was overridden)
```

---

### Test Case 2: Principal Votes Before Proxy

**Setup:**
```typescript
mockUsers[0].proxy_assignee_id = 4;  // Alice → David
mockUsers[0].vote_weight = 2;
```

**Steps:**
1. Alice votes YES (before David)
   ```typescript
   checkVoteEligibility(1, 101);
   // Result: { canVote: true, hasProxy: true, proxyMessage: "..." }
   
   castVote(1, 101, 'Yes');
   // Result: { success: true, vote_weight: 2 }
   ```

2. David tries to vote
   ```typescript
   calculateVoteWeight(4);
   // Result: { totalWeight: 1, proxyCount: 0 }
   // Alice not counted as proxy anymore (she voted herself)
   ```

---

### Test Case 3: Multiple Proxies, One Overrides

**Setup:**
```typescript
mockUsers[0].proxy_assignee_id = 4;  // Alice → David (2 votes)
mockUsers[1].proxy_assignee_id = 4;  // Bob → David (3 votes)
mockUsers[2].proxy_assignee_id = null; // Charlie votes himself (1 vote)
```

**Steps:**
1. David votes YES
   ```typescript
   castVote(4, 101, 'Yes');
   // Result: vote_weight = 6 (1 + 2 + 3)
   ```

2. Charlie votes NO
   ```typescript
   castVote(3, 101, 'No');
   // Result: vote_weight = 1
   ```

3. Alice overrides and votes NO
   ```typescript
   castVote(1, 101, 'No');
   // Result: vote_weight = 2, overridden = true
   ```

4. Final Results
   ```typescript
   getMotionResults(101);
   // YES: 4 votes (57%) - David + Bob
   // NO: 3 votes (43%) - Charlie + Alice
   ```

---

## 🎯 User Experience Flow

### Scenario: Alice Assigned Proxy but Changes Mind

#### Step 1: Initial State
- Alice logs in
- Sees message: "You have a proxy assigned (David Wilson)"
- Blue info banner displayed

#### Step 2: Alice Decides to Vote
- Clicks on candidate
- Sees both Regular and Proxy vote options
- Regular vote shows: "1 vote" (just her own weight)

#### Step 3: David Already Voted
- Alice returns later
- Orange warning banner appears
- Message: "Your proxy already voted. Your vote will override theirs."

#### Step 4: Alice Votes
- Selects candidate
- Clicks "Confirm Vote"
- Success message: "Vote recorded (Your proxy vote was overridden)"

#### Step 5: Confirmation
- Vote weight breakdown shown
- Alice's vote: 2 votes (her full weight)
- David's updated vote: 4 votes (reduced from 6)

---

## 📝 Implementation Details

### Vote Weight Adjustment Logic

```typescript
// When Alice overrides:
const proxyHolderVote = mockVotes.find(v => 
  v.user_id === user.proxy_assignee_id && 
  v.motion_id === motionId
);

if (proxyHolderVote) {
  // Remove Alice's weight
  const userWeight = user.vote_weight || 1;
  proxyHolderVote.vote_weight -= userWeight;  // 6 → 4
  proxyHolderVote.proxy_count -= 1;           // 2 → 1
  
  // Remove Alice from assignee list
  proxyHolderVote.proxy_assignees = 
    proxyHolderVote.proxy_assignees.filter(p => p.id !== userId);
  
  // Update proxy flag if no more proxies
  if (proxyHolderVote.proxy_count === 0) {
    proxyHolderVote.is_proxy_vote = false;
  }
}
```

### Vote Recording

```typescript
// Alice's vote is recorded separately
const vote: MockVote = {
  id: mockVotes.length + 1,
  user_id: userId,              // Alice
  motion_id: motionId,
  vote_value: voteValue,        // Her choice
  is_proxy_vote: false,         // Not voting as proxy
  proxy_count: 0,               // Not representing anyone
  proxy_assignees: [],          // Empty
  vote_weight: userWeight,      // Her full weight (2)
  voted_at: new Date().toISOString()
};
```

---

## 🔍 Edge Cases Handled

### 1. Principal Votes, Then Proxy Tries to Vote
- Proxy's vote weight automatically excludes principal
- No manual adjustment needed
- `calculateVoteWeight()` checks if assignees already voted

### 2. Principal Votes Multiple Times
- First vote is recorded
- Second attempt: "You have already voted on this motion"
- Standard double-vote prevention applies

### 3. Proxy Overridden, Then Tries to Vote Again
- Proxy holder's existing vote is already recorded
- Their vote weight remains updated
- They cannot vote again (standard double-vote prevention)

### 4. All Proxies Override
- Proxy holder's vote weight could go down to just their own vote
- `is_proxy_vote` flag changes to `false`
- `proxy_count` becomes 0

---

## 📊 Results Calculation

### Before Override
```typescript
getMotionResults(101);
// {
//   totalVotes: 1,
//   totalWeight: 6,
//   results: {
//     yes: { count: 1, weight: 6, percentage: "100.00" }
//   }
// }
```

### After Override
```typescript
getMotionResults(101);
// {
//   totalVotes: 2,        // Two separate voters now
//   totalWeight: 6,       // Same total (4 + 2)
//   results: {
//     yes: { count: 1, weight: 4, percentage: "66.67" },  // David
//     no: { count: 1, weight: 2, percentage: "33.33" }    // Alice
//   }
// }
```

---

## ✅ Benefits

1. **Flexibility**: Principal members retain voting rights
2. **Transparency**: Clear messaging about what happens
3. **Automatic**: Weight adjustments happen automatically
4. **Accurate**: Results always reflect actual votes
5. **User-Friendly**: Visual warnings and confirmations

---

## 🎓 Summary

The proxy override feature allows:
- ✅ Principal members to vote even after assigning proxy
- ✅ Automatic vote weight adjustment when override occurs
- ✅ Clear UI warnings about override actions
- ✅ Accurate vote tallies with dynamic recalculation
- ✅ Full transparency in the voting process

**Key Principle**: The principal member always has the final say. Their direct vote takes precedence over any proxy vote cast on their behalf.

---

## 🧪 Quick Test Commands

```typescript
// Test override scenario
import { mockUsers, castVote, getMotionResults, resetVotes } from './proxyVoting';

// Reset
resetVotes();

// Setup: Alice → David proxy
mockUsers[0].proxy_assignee_id = 4;
mockUsers[0].vote_weight = 2;

// David votes
castVote(4, 101, 'Yes');
console.log('After David votes:', getMotionResults(101));

// Alice overrides
castVote(1, 101, 'No');
console.log('After Alice overrides:', getMotionResults(101));
```

**Expected Output:**
```
After David votes: { yes: { weight: 2 } }
Override: Removed 2 vote(s) from proxy holder's vote. New weight: 0
After Alice overrides: { yes: { weight: 0 }, no: { weight: 2 } }
```

---

**This feature ensures democratic principles: every member has the right to vote directly, regardless of proxy assignments! 🗳️✨**
