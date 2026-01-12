# Proxy Vote Allocation System - Implementation Guide

## ✅ What's Been Implemented

### 1. **ProxyAppointmentForm** - Real-Time Vote Tracking
Located: `src/components/ProxyAppointmentForm.tsx`

#### Features:
- **Vote Allocation Summary Box** (after email field):
  - Shows **Available Votes** (total you have)
  - Shows **Allocated** (votes you're assigning in this form)
  - Shows **Remaining** (available - allocated)
  - Red alert if you over-allocate

- **Top Banner**:
  - Large vote counter showing remaining votes
  - Breakdown: Instructional + Discretionary votes
  - Updates in real-time as you type

- **Two Vote Types**:
  - **Instructional Votes**: Select specific candidates (you decide who they vote for)
  - **Discretionary Votes**: Number only (proxy decides who to vote for)

### 2. **VotingStatusBar** - Synced Across App
Located: `src/components/VotingStatusBar.tsx`

#### Features:
- Now listens for `proxyVoteAllocation` events
- Updates automatically when you allocate votes in ProxyAppointmentForm
- Deducts from your total available votes
- Shows throughout the entire app (added to Header)

### 3. **Real-Time Synchronization**
When you change vote allocation in the form:
1. ✅ Local counter updates instantly
2. ✅ Event dispatched to VotingStatusBar
3. ✅ VotingStatusBar deducts from your total
4. ✅ Both displays stay in sync

## 🎯 How It Works

### Event Communication System
```typescript
// ProxyAppointmentForm dispatches event when votes change
window.dispatchEvent(new CustomEvent('proxyVoteAllocation', {
  detail: {
    allocated: 5,  // Total votes being assigned
    remaining: 10  // Votes left after allocation
  }
}));

// VotingStatusBar listens and updates
window.addEventListener('proxyVoteAllocation', handleProxyVoteAllocation);
```

## 📊 Vote Allocation Summary Layout

```
┌─────────────────────────────────────────────┐
│  Vote Allocation                       🗳️   │
├─────────────────────────────────────────────┤
│    15              5              10         │
│  Available      Allocated      Remaining    │
└─────────────────────────────────────────────┘
```

## 🧪 Testing Instructions

### Test Scenario 1: Basic Allocation
1. Navigate to `/proxy-form`
2. Look at VotingStatusBar at top (shows 15 available votes)
3. Scroll down, see Vote Allocation box (15 available, 0 allocated, 15 remaining)
4. Enter 3 instructional votes
5. **Expected**: 
   - Allocation box shows: 15 / 3 / 12
   - Top banner shows: "12 Votes Remaining"
   - VotingStatusBar updates to show 12 remaining

### Test Scenario 2: Mixed Allocation
1. Enter 2 instructional votes
2. Add 2 candidates from dropdown
3. Enter 3 discretionary votes
4. **Expected**:
   - Allocation box shows: 15 / 5 / 10
   - Banner shows: "2 + 3" split
   - VotingStatusBar: 10 votes remaining

### Test Scenario 3: Over-Allocation Warning
1. Enter 10 instructional votes
2. Enter 10 discretionary votes (total = 20, exceeds 15)
3. **Expected**:
   - Red alert: "You've allocated more votes than available!"
   - Submit button disabled
   - Negative remaining count

### Test Scenario 4: Real-Time Updates
1. Enter 5 instructional votes
2. Watch allocation box update immediately
3. Change to 3 instructional votes
4. Watch numbers adjust in real-time
5. **Expected**: Smooth, instant updates

## 🔧 Backend Integration (Future)

### API Endpoint Needed
```
GET /api/voting/available-votes/:userId
Response: {
  totalVotes: 15,
  assignedVotes: 0,
  remainingVotes: 15
}
```

### Submit Payload
```json
{
  "proxyEmail": "proxy@example.com",
  "instructionalVotes": 2,
  "discretionaryVotes": 3,
  "instructionalCandidates": [
    { "candidateId": "1", "candidateName": "Sarah Johnson" },
    { "candidateId": "2", "candidateName": "Michael Chen" }
  ],
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

## 📝 Current State Variables

### ProxyAppointmentForm
- `totalAvailableVotes`: 15 (hardcoded dummy data)
- `votesAlreadyAssigned`: 0 (will come from API)
- `votesRemaining`: Calculated (available - assigned - current allocation)
- `totalAllocatedVotes`: Current form allocation

### VotingStatusBar
- `personalVotesRemaining`: 8 (dummy data)
- `personalVotesTotal`: 15 (dummy data)
- Updates when `proxyVoteAllocation` event fires

## ✨ Key Features

1. ✅ **Real-time sync** between form and status bar
2. ✅ **Visual vote allocation summary** matching your requested design
3. ✅ **Over-allocation prevention** with warnings
4. ✅ **Dual vote types** (instructional + discretionary)
5. ✅ **Global visibility** (VotingStatusBar in Header)
6. ✅ **Animated updates** with Framer Motion
7. ✅ **Responsive design** for mobile/desktop

## 🎨 UI Components Added

- **Vote Allocation Summary Box**: Blue-themed, 3-column grid
- **Vote icon** (🗳️) next to heading
- **Color coding**:
  - Blue: Available votes
  - Green: Allocated votes
  - Gray: Remaining votes
  - Red: Over-allocation warning

## 🚀 Ready to Test!

Open: http://localhost:5173/proxy-form

Watch the magic:
1. Type in vote numbers
2. See allocation box update
3. See top banner update
4. See VotingStatusBar (at top of page) update
5. Everything stays in sync! 🎉
