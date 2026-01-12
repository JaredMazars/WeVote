# Vote Assignment System - Quick Start Guide

## 🎯 What Was Implemented

A **hierarchical vote management system** where:
1. **Super Admins** set global voting limits for the entire organization
2. **Regular Admins** assign individual vote counts to users within those limits

---

## 🚀 Quick Start

### For Super Admins

1. **Navigate to Super Admin Dashboard**
   ```
   http://localhost:5174/superadmin
   ```

2. **Set Global Vote Limits**
   - Click "Global Vote Limits" tab
   - Set three values:
     - **Minimum** (e.g., 1) - Floor for all users
     - **Maximum** (e.g., 10) - Ceiling for all users
     - **Default** (e.g., 3) - Recommended starting value
   - Click "Save Vote Limits"

3. **Done!** Regular admins can now assign votes within your boundaries.

---

### For Regular Admins

1. **Navigate to Admin Dashboard**
   ```
   http://localhost:5174/admin
   ```

2. **Go to Users Tab**
   - You'll see all users with an "Assigned Votes" column
   - Users show either "3 votes" or "Not assigned"

3. **Assign Votes to a User**
   - Click "Assign Votes" button next to user's name
   - Modal opens showing:
     - User information
     - Super admin's boundaries (e.g., "Between 1 and 10 votes")
     - Large number input
     - Slider for easy adjustment
     - Quick select buttons (Min/Default/Max)

4. **Set Vote Count**
   - Enter a number between min and max
   - Or use the slider
   - Or click Quick Select buttons
   - System validates in real-time

5. **Save**
   - Click "Assign Votes" button
   - Confirmation message appears
   - User table updates immediately

---

## 📊 Features

### Super Admin Dashboard
✅ **Global Vote Limits Tab**
- Three large input cards (Min/Max/Default)
- Visual range indicator
- Reset to defaults button
- Info box explaining the system
- Beautiful gradient styling

✅ **Vote Splitting Tab**
- Proxy voting configuration
- Enable/disable toggle
- Min/max proxy voter settings

### Admin Dashboard  
✅ **Enhanced Users Table**
- New "Assigned Votes" column with badge
- "Assign Votes" / "Edit Votes" action button
- Vote count displayed per user

✅ **Vote Assignment Modal**
- User profile card
- Boundary information from super admin
- Large number input (keyboard friendly)
- Range slider (mouse friendly)
- Quick select buttons (one-click presets)
- Real-time validation with visual feedback
- Success/error messages

---

## 🎨 Visual Design

### Color Scheme
- **Super Admin Dashboard**: 
  - Blue gradient header (#0072CE to #171C8F)
  - Colored input cards (Blue/blue/Green)
  - Crown icon for super admin identity

- **Admin Dashboard**:
  - Vote badges: Blue-blue gradient when assigned
  - Action buttons: Blue gradient with Vote icon
  - Modal: White with gradient accents

### Interactions
- Smooth animations with Framer Motion
- Hover effects on all buttons
- Scale transforms on clicks
- Fade in/out modals
- Responsive slider

---

## 💾 Data Storage

### Current (Development)
```javascript
// Super admin saves to localStorage
localStorage.setItem('voteLimits', JSON.stringify({
  min_votes_per_user: 1,
  max_votes_per_user: 10,
  default_votes_per_user: 3
}));

// Admin reads from localStorage
const limits = JSON.parse(localStorage.getItem('voteLimits'));

// User votes stored in users array
users.map(u => ({ ...u, assignedVotes: 5 }));
```

### Production (To Implement)
- API endpoints: `/api/superadmin/vote-limits` (GET/PUT)
- Database table: `vote_limits`
- User column: `assigned_votes` in `users` table
- Audit table: `vote_assignments` for history

---

## ✅ Validation Rules

### Super Admin
- Min must be ≥ 1
- Max must be ≥ Min
- Default must be between Min and Max

### Regular Admin
- Vote count must be ≥ Min set by super admin
- Vote count must be ≤ Max set by super admin
- Real-time error messages if limits violated
- Button disabled when invalid

---

## 🧪 Test Scenarios

### Test 1: Happy Path
1. Super admin sets min=1, max=10, default=3
2. Admin assigns 5 votes to user "Demo User"
3. User table shows "5 votes"
4. ✅ Success

### Test 2: Boundary Violation
1. Super admin sets min=2, max=8
2. Admin tries to assign 1 vote → ❌ Error shown
3. Admin tries to assign 10 votes → ❌ Error shown
4. Admin assigns 5 votes → ✅ Success

### Test 3: Edit Existing
1. User has 3 votes assigned
2. Admin clicks "Edit Votes"
3. Modal shows current: 3
4. Admin changes to 7
5. Saves successfully
6. Table updates to "7 votes"

### Test 4: No Limits Set
1. Super admin hasn't set limits yet
2. System uses default: min=1, max=10, default=3
3. Admin can still assign votes

---

## 📱 Routes

| Route | Role | Purpose |
|-------|------|---------|
| `/superadmin` | Super Admin | Set global vote limits |
| `/admin` | Regular Admin | Assign votes to users |
| `/home` | All Users | Access voting |

---

## 🔧 Key Files

### Created
- ✅ `src/pages/SuperAdminDashboard.tsx` (485 lines)
- ✅ `VOTE_ASSIGNMENT_SYSTEM.md` (Complete documentation)
- ✅ `VOTE_ASSIGNMENT_QUICK_START.md` (This file)

### Modified
- ✅ `src/pages/AdminDashboard.tsx` (Added vote assignment)
- ✅ `src/App.tsx` (Added /superadmin route)

---

## 📝 Mock Data

### Default Vote Limits
```javascript
{
  min_votes_per_user: 1,
  max_votes_per_user: 10,
  default_votes_per_user: 3
}
```

### Sample Users with Votes
```javascript
[
  { id: 1, name: 'Demo User', assignedVotes: 5 },
  { id: 2, name: 'Shane Johnson', assignedVotes: 3 },
  { id: 3, name: 'Bob Williams', assignedVotes: undefined },
  { id: 4, name: 'Mary Davis', assignedVotes: 7 }
]
```

---

## 🎯 User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                         │
│  Sets: Min=1, Max=10, Default=3                         │
│  Action: Click "Save Vote Limits"                       │
└────────────────┬────────────────────────────────────────┘
                 │ Saves to localStorage
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   REGULAR ADMIN                          │
│  1. Sees users in table                                 │
│  2. Clicks "Assign Votes" on Bob Williams               │
│  3. Modal opens with limits: 1-10                       │
│  4. Assigns 6 votes using slider                        │
│  5. Clicks "Assign Votes" button                        │
└────────────────┬────────────────────────────────────────┘
                 │ Updates user object
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    REGULAR USER                          │
│  Bob Williams now has 6 votes                           │
│  Can distribute 6 votes across candidates               │
│  Total votes cast ≤ 6                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Usage Examples

### Example 1: Equal Voting
**Goal**: Everyone gets 1 vote

**Super Admin**:
```
Min: 1
Max: 1  
Default: 1
```

**Admin**: No choice, everyone gets 1 vote

---

### Example 2: Seniority-Based
**Goal**: Senior staff get more votes

**Super Admin**:
```
Min: 1
Max: 10
Default: 3
```

**Admin**:
- Junior: 1-2 votes
- Mid: 3-5 votes
- Senior: 6-8 votes
- Exec: 9-10 votes

---

### Example 3: Department Size
**Goal**: Larger departments get more representation

**Super Admin**:
```
Min: 1
Max: 20
Default: 5
```

**Admin**:
- Small dept: 3 votes
- Medium dept: 8 votes
- Large dept: 15 votes

---

## 🐛 Troubleshooting

**Issue**: Vote limits not showing in admin modal
```javascript
// Check localStorage
console.log(localStorage.getItem('voteLimits'));
```

**Issue**: Can't assign votes
```javascript
// Check if limits are loaded
console.log(voteLimits); // Should show {min, max, default}
```

**Issue**: Modal not opening
```javascript
// Check state
console.log('showVoteModal:', showVoteModal);
console.log('selectedUser:', selectedUserForVotes);
```

---

## 🎉 Success Indicators

You've successfully implemented the system if:
- ✅ `/superadmin` route loads with vote limits tab
- ✅ Can set and save min/max/default values
- ✅ `/admin` users table shows "Assigned Votes" column
- ✅ "Assign Votes" button opens modal
- ✅ Modal enforces super admin boundaries
- ✅ Vote assignment updates user table
- ✅ Slider and quick select buttons work
- ✅ Validation prevents out-of-bounds assignments

---

## 📞 Need Help?

1. Check `VOTE_ASSIGNMENT_SYSTEM.md` for detailed documentation
2. Review code comments in `SuperAdminDashboard.tsx`
3. Test with mock data before production
4. Verify localStorage has `voteLimits` key

---

**Status**: ✅ Fully Implemented  
**Last Updated**: December 5, 2025  
**Version**: 1.0  
