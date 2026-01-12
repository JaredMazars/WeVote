# Vote Allocation Synchronization - Complete Test Guide

## ✅ What's Been Fixed

### Problem
- Vote counter didn't match VotingStatusBar numbers
- Allocating votes didn't deduct from VotingStatusBar

### Solution
- **Synchronized initialization**: Both start with same number (20 votes from VotingStatusBar dummy data)
- **Real-time bidirectional sync**: Changes in proxy form update VotingStatusBar instantly
- **Event-driven architecture**: Uses CustomEvents for communication

## 🔄 How Synchronization Works

### 1. On Page Load
```
VotingStatusBar loads with dummy data (20 remaining votes)
    ↓
Broadcasts 'votingStatusLoaded' event with vote count
    ↓
ProxyAssignment page listens and sets: totalAvailableVotes = 20
    ↓
Both show: 20 votes available ✅
```

### 2. When Allocating Votes
```
User enters 5 instructional votes on ProxyAssignment page
    ↓
Page updates: Allocated = 5, Remaining = 15
    ↓
Dispatches 'proxyVoteAllocation' event with allocated count
    ↓
VotingStatusBar receives event
    ↓
VotingStatusBar updates: totalVotesRemaining = 15
    ↓
Both show: 15 votes remaining ✅
```

## 🧪 Complete Test Scenarios

### Test 1: Initial Sync Verification
**Steps:**
1. Open app: http://localhost:5173/
2. Login and look at **VotingStatusBar** (top of page)
   - Should show: **20 votes remaining** (Personal: 8, Proxy: 12)
3. Click **"Proxy Assignment"** button in header
4. Scroll to **Vote Allocation** section

**Expected Result:**
```
✅ Vote Allocation Counter shows:
   Available: 20
   Allocated: 0
   Remaining: 20
   
✅ Matches VotingStatusBar numbers exactly!
```

### Test 2: Instructional Vote Allocation
**Steps:**
1. On ProxyAssignment page
2. Enter **5** in "Number of Instructional Votes"
3. Watch both counters

**Expected Result:**
```
✅ Local Counter:
   Available: 20
   Allocated: 5
   Remaining: 15
   
✅ VotingStatusBar (at top):
   Updates to show: 15 remaining votes
   
✅ Blue badge shows: "5 Votes"
✅ Success message: "Successfully allocated 5 votes"
```

### Test 3: Discretionary Vote Allocation
**Steps:**
1. Clear instructional votes (set to 0)
2. Enter **7** in "Number of Discretionary Votes"
3. Watch both counters

**Expected Result:**
```
✅ Local Counter:
   Available: 20
   Allocated: 7
   Remaining: 13
   
✅ VotingStatusBar:
   Updates to show: 13 remaining votes
   
✅ Green badge shows: "7 Votes"
```

### Test 4: Mixed Allocation (Both Types)
**Steps:**
1. Enter **3** instructional votes
2. Enter **4** discretionary votes
3. Total = 7 votes allocated

**Expected Result:**
```
✅ Local Counter:
   Available: 20
   Allocated: 7 (3 + 4)
   Remaining: 13
   
✅ VotingStatusBar:
   Updates to show: 13 remaining votes
   
✅ Success message:
   "Successfully allocated 7 votes 
   (3 instructional + 4 discretionary)"
```

### Test 5: Real-Time Updates
**Steps:**
1. Start with 5 instructional votes
2. Watch counters update
3. Change to 8 instructional votes
4. Watch counters update again
5. Add 2 discretionary votes
6. Watch both counters

**Expected Result:**
```
Step 1-2:
✅ Local: 20/5/15
✅ VotingStatusBar: 15 remaining

Step 3-4:
✅ Local: 20/8/12
✅ VotingStatusBar: 12 remaining

Step 5-6:
✅ Local: 20/10/10 (8 instructional + 2 discretionary)
✅ VotingStatusBar: 10 remaining

All updates happen INSTANTLY as you type!
```

### Test 6: Over-Allocation Prevention
**Steps:**
1. Enter **15** instructional votes
2. Enter **10** discretionary votes (total = 25, exceeds 20)

**Expected Result:**
```
✅ Local Counter shows:
   Available: 20
   Allocated: 25
   Remaining: -5 (red, negative)
   
✅ Red warning appears:
   "You've allocated more votes than available!"
   
✅ VotingStatusBar still shows correct remaining
   
✅ User cannot proceed (form validation prevents submission)
```

### Test 7: Navigate Away and Return
**Steps:**
1. Allocate 5 votes on ProxyAssignment page
2. Click "Back to Voting" or navigate to /home
3. Check VotingStatusBar (should show 15 remaining)
4. Return to ProxyAssignment page
5. Check if numbers are still correct

**Expected Result:**
```
✅ VotingStatusBar maintains 15 remaining across navigation
✅ On return, page re-syncs with VotingStatusBar
✅ Numbers match perfectly
```

## 📊 Visual Indicators

### VotingStatusBar (Top of Every Page)
```
┌──────────────────────────────────────┐
│  Personal Votes: 8/15                 │
│  Proxy Votes: 12/20                   │
│  Total Remaining: 20 → updates to 15  │
└──────────────────────────────────────┘
```

### Vote Allocation Section (ProxyAssignment Page)
```
┌─────────────────────────────────────────┐
│  Available    Allocated    Remaining    │
│     20            5            15        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📋 Instructional Votes          [5]    │
│  Input: [5]                      Votes  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🎯 Discretionary Votes          [0]    │
│  Input: [0]                      Votes  │
└─────────────────────────────────────────┘

✅ Successfully allocated 5 votes
   (5 instructional + 0 discretionary)
```

## 🔍 Debug Console Logs

Open browser console (F12) to see:
```
Dummy Data Loaded: { totalVotesRemaining: 20, ... }
Proxy votes being allocated: { allocated: 5, remaining: 15 }
votingStatusLoaded event dispatched
requestVotingStatus event received
```

## 🎯 Key Features Verified

1. ✅ **Initial Sync**: Both start with 20 votes (from VotingStatusBar)
2. ✅ **Real-Time Updates**: Changes propagate instantly
3. ✅ **Bidirectional Sync**: VotingStatusBar → ProxyForm → VotingStatusBar
4. ✅ **Live Calculation**: Remaining = Available - Allocated
5. ✅ **Over-Allocation Warning**: Red alert when exceeding limit
6. ✅ **Success Feedback**: Green message showing breakdown
7. ✅ **Visual Badges**: Blue/Green counters for each vote type
8. ✅ **Persistent State**: VotingStatusBar maintains count across navigation

## 🚀 Quick Test Checklist

- [ ] VotingStatusBar shows 20 remaining on load
- [ ] ProxyAssignment shows 20 available on load
- [ ] Numbers match exactly
- [ ] Entering instructional votes updates both counters
- [ ] Entering discretionary votes updates both counters
- [ ] Mixed allocation (both types) calculates correctly
- [ ] Over-allocation shows red warning
- [ ] Real-time updates happen as you type
- [ ] VotingStatusBar deducts allocated votes
- [ ] Success message shows correct breakdown

## 🎉 Expected Final Behavior

**Before Allocation:**
- VotingStatusBar: **20 votes remaining**
- ProxyAssignment: **20 available, 0 allocated, 20 remaining**

**After Allocating 3 Instructional + 4 Discretionary:**
- VotingStatusBar: **13 votes remaining** ✅
- ProxyAssignment: **20 available, 7 allocated, 13 remaining** ✅
- Both perfectly synchronized! 🎯

---

**Test URL:** http://localhost:5173/proxy-assignment

**Navigation:** Header → "Proxy Assignment" button
