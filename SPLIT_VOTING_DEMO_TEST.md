# Split Voting Testing Guide for demo@wevote.com

## Quick Start Testing

### Login Credentials
- **Email**: `demo@wevote.com`
- **Password**: `demo123`

### User Setup
When you log in as demo@wevote.com, you are **User ID 1** with the following proxy assignments:

| Proxy Member | Email | Vote Weight | Member # |
|--------------|-------|-------------|----------|
| Shane Johnson | shane@wevote.com | 2 votes | MEM002 |
| Bob Williams | bob@wevote.com | 3 votes | MEM003 |
| Mary Davis | mary@wevote.com | 5 votes | MEM004 |

### Your Voting Power

#### Option 1: Regular Vote
- **Weight**: 1 vote
- **Uses**: Only your own vote
- **When**: You want to vote independently

#### Option 2: Proxy Vote (All Proxies)
- **Weight**: 11 votes total
  - Your vote: 1
  - Shane: 2
  - Bob: 3
  - Mary: 5
- **Uses**: All proxy assignments
- **When**: All proxies agree on the candidate

#### Option 3: Split Vote ⭐
- **Weight**: Variable (1 + selected proxies)
- **Uses**: Only the proxies you select
- **When**: Strategic voting needed

## Split Voting Test Scenarios

### Scenario 1: Vote for Damien with Shane + Bob
1. Log in as demo@wevote.com
2. Navigate to Candidate Voting
3. Click on **Damien Rodriguez** card
4. Select **"Split Vote"** option
5. Check ✅ **Shane Johnson** (2 votes)
6. Check ✅ **Bob Williams** (3 votes)
7. Leave ❌ **Mary Davis** unchecked
8. Verify total weight shows: **6 votes**
   - Your vote (1) + 2 selected proxies
9. Click **"Cast Split Vote"**
10. Check console for: `Split Vote: Using 2 of 3 available proxies`

**Expected Result**: Vote recorded with weight of 6

### Scenario 2: Vote for Lisa with Mary Only
1. Click on **Lisa Martinez** card
2. Select **"Split Vote"** option
3. Leave ❌ Shane Johnson unchecked
4. Leave ❌ Bob Williams unchecked
5. Check ✅ **Mary Davis** (5 votes)
6. Verify total weight shows: **6 votes**
   - Your vote (1) + 1 selected proxy
7. Click **"Cast Split Vote"**

**Expected Result**: Vote recorded with weight of 6 (different proxies than Damien)

### Scenario 3: Vote for John with All Proxies
1. Click on **John Miller** card
2. Select **"Split Vote"** option
3. Check ✅ All three proxies:
   - Shane Johnson (2 votes)
   - Bob Williams (3 votes)
   - Mary Davis (5 votes)
4. Verify total weight shows: **11 votes**
   - Your vote (1) + 3 selected proxies
5. Click **"Cast Split Vote"**

**Expected Result**: Vote recorded with weight of 11 (same as full proxy vote)

### Scenario 4: Compare Regular vs Proxy vs Split
1. **Sarah Johnson** - Vote with **Regular Vote** (1 vote)
2. **Mike Thompson** - Vote with **Proxy Vote** (11 votes)
3. **Emily Chen** - Vote with **Split Vote** selecting Bob + Mary (9 votes)
4. Compare the different weights used

## Visual UI Elements to Test

### Vote Type Selection Modal
When you click a candidate, you should see **3 buttons**:

```
┌──────────────────────────────────────┐
│ [User Icon]                          │
│ Regular Vote                         │
│ Vote with your own voting power      │
│ 1 vote                               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ [Shield Icon]                        │
│ Proxy Vote                           │
│ Vote including all proxy votes       │
│ 11 total votes                       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ [Users Icon]                    NEW! │
│ Split Vote                           │
│ Select specific proxies to vote for │
│ this candidate                       │
│ Choose from 3 proxies                │
└──────────────────────────────────────┘
```

### Split Vote Proxy Selection
After clicking "Split Vote", you should see:

```
Select Proxies to Vote With
─────────────────────────────────────

□ Shane Johnson              2 votes
  Senior Developer

☑ Bob Williams              3 votes
  Team Lead

☑ Mary Davis                5 votes
  Project Manager

─────────────────────────────────────
Total Vote Weight: 9
Your vote (1) + 2 selected proxies
```

### Real-time Weight Updates
As you check/uncheck boxes:
- Weight updates immediately
- blue highlight on selected proxies
- Counter shows "X selected proxies"

### Submit Button States
- **Disabled**: No proxies selected (gray)
- **Enabled**: At least 1 proxy selected (blue gradient)
- **Loading**: "Casting Vote..." with spinner

## Browser Console Checks

Open the browser console (F12) to see debug logs:

### When selecting proxies:
```
Split Vote: Using 2 of 3 available proxies
```

### When submitting vote:
```
Vote recorded successfully. Your vote counts as 6 vote(s). (Split vote: 2 of 3 proxies used)
```

### Vote object structure:
```javascript
{
  id: 1,
  user_id: 1,
  motion_id: 1,
  vote_value: "Yes",
  is_proxy_vote: true,
  proxy_count: 2,
  proxy_assignees: [
    { id: 2, name: "Shane Johnson", voteWeight: 2 },
    { id: 3, name: "Bob Williams", voteWeight: 3 }
  ],
  vote_weight: 6,
  voted_at: "2025-12-05T...",
  candidate_id: "1",
  split_vote: true,
  selected_proxy_ids: [2, 3]
}
```

## Edge Cases to Test

### Test 1: No Selection
1. Click Split Vote
2. Don't select any proxies
3. Submit button should be **DISABLED**
4. Hover shows "Select at least one proxy"

### Test 2: Select All
1. Click Split Vote
2. Select all 3 proxies
3. Weight should be **11** (same as full proxy vote)
4. Should still record as split_vote: true

### Test 3: Toggle Selection
1. Check Shane → Weight: 3
2. Check Bob → Weight: 6
3. Uncheck Shane → Weight: 4
4. Check Mary → Weight: 9
5. Verify smooth transitions

### Test 4: Cancel and Retry
1. Click Split Vote
2. Select some proxies
3. Click "Back" button
4. Select Split Vote again
5. Should start fresh (no proxies selected)

### Test 5: Multiple Candidates
1. Vote for Candidate A with Shane + Bob
2. Vote for Candidate B with Mary only
3. Vote for Candidate C with all proxies
4. Each should have different weights recorded

## Success Indicators

✅ **Split Vote button appears** (only with 2+ proxies)
✅ **Checkbox list shows all 3 proxy members**
✅ **Vote weights displayed correctly** (2, 3, 5)
✅ **Total weight updates in real-time**
✅ **blue styling on selected items**
✅ **Submit button enables/disables correctly**
✅ **Success modal shows after submission**
✅ **Console logs show split vote details**
✅ **Can vote for multiple candidates with different proxy selections**

## Troubleshooting

### Split Vote button not showing
- **Check**: Are you logged in as demo@wevote.com?
- **Verify**: User ID should be '1' in console
- **Confirm**: proxyVoting.ts shows 3 users assigned to user 1

### Weight always shows 1
- **Check**: Are the proxy assignees loading?
- **Verify**: Console should show proxy assignees array
- **Confirm**: calculateVoteWeight() returns correct data

### Submit button always disabled
- **Check**: Is at least one proxy checkbox checked?
- **Verify**: selectedProxyIds array has at least 1 ID
- **Debug**: Log selectedProxyIds state value

### Vote not recording
- **Check**: Console for error messages
- **Verify**: castVote() function is being called
- **Confirm**: mockVotes array is being updated

## Next Steps After Testing

Once split voting works for demo@wevote.com:

1. **Create more test users** with different proxy configurations
2. **Test instructional vs discretional** proxy types
3. **Add split voting to Resolution voting** (Yes/No/Abstain)
4. **Build admin dashboard** to view split vote analytics
5. **Export split vote reports** showing proxy selection patterns

## Support

If issues occur:
- Check browser console for errors
- Review `proxyVoting.ts` mock data
- Verify user ID mapping in `api.ts`
- Test with different candidates
- Clear browser cache/localStorage

---

**Quick Test Command**: Log in as demo@wevote.com, click any candidate, select Split Vote, choose 2 proxies, verify weight = 1 + their combined votes, submit!
