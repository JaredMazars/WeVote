# Quick Reference: Admin Dashboard Data & Features

## 🎯 All Tabs Overview

### ✅ **Users Tab**
- **Data Source**: `/api/users`
- **Shows**: All registered users with employee IDs
- **Features**: Create, Edit, Delete, Toggle Status
- **Expected Count**: 11 users

### ✅ **Candidates Tab** ⭐ ENHANCED
- **Data Source**: `/api/candidates`
- **Shows**: Candidates with departments and vote counts
- **Features**: 
  - Create with **employee dropdown selection** 🆕
  - Auto-fill candidate details from employee 🆕
  - Link to **AGM Session** 🆕
  - Edit, Delete, Toggle Status
- **Expected Count**: 8 candidates

### ✅ **Resolutions Tab** ⭐ ENHANCED
- **Data Source**: `/api/resolutions`
- **Shows**: Resolutions with Yes/No/Abstain vote counts
- **Features**:
  - Create with **AGM Session selection** 🆕
  - Set required majority percentage 🆕
  - Toggle abstain voting 🆕
  - Edit, Delete, Update Status
- **Expected Count**: 5 resolutions

### ✅ **Proxy Groups Tab**
- **Data Source**: `/api/proxy/assignments`
- **Shows**: Proxy assignments grouped by holder
- **Features**: View proxy types, members, vote weights
- **Expected Count**: Varies (depends on proxy setup)

### ✅ **Vote Logs Tab** ⭐ WITH AGM SESSION
- **Data Source**: `/api/votes/history`
- **Shows**: All votes with **AGM Session column** 🆕
- **Features**: Search, filter, see proxy votes
- **Expected Count**: 13 votes
- **Session Info**: Shows "2024 Annual General Meeting"

### ✅ **Voting Results Tab**
- **Data Source**: `/api/votes/results/candidates/:sessionId` & `/api/votes/results/resolutions/:sessionId`
- **Shows**: Vote tallies and percentages
- **Features**: Filter by session, sort by votes/name
- **Expected Data**: Real-time vote counts

### ⚠️ **Audit Logs Tab**
- **Status**: Backend endpoint not implemented
- **Shows**: Empty array with message
- **Future**: Will show system activity logs

### ✅ **AGM Reports Tab**
- **Data Source**: Aggregates from other tabs
- **Shows**: Comprehensive AGM statistics
- **Features**: Export to Excel, PDF generation
- **Live Data**: Pulls from candidates, resolutions, votes

---

## 🔥 New Features

### **Employee Selection in Candidate Creation**
When you create a candidate:
1. Select AGM Session (required)
2. Choose employee from dropdown
3. Fields auto-fill: Name, Email, Department, Position
4. Add bio/achievements
5. Save → Candidate linked to employee & session

**Dropdown Shows**:
```
John Smith (EMP0001) - Engineering
Jane Doe (EMP0002) - Marketing
Bob Wilson (EMP0003) - Finance
...
```

### **AGM Session Tracking**
Every candidate and resolution is now linked to:
- Specific AGM Session
- Session date and title
- Enables historical tracking

### **Vote Logs with Session Info**
Vote Logs table now displays:
| User | AGM Session | Vote Type | Target | Weight | Proxy |
|------|-------------|-----------|--------|--------|-------|
| John | 2024 AGM | candidate | Alice | 3 | ✓ |
| Jane | 2024 AGM | resolution | Remote Work | 1 | ✗ |

---

## 📡 API Endpoints Used

```
Authentication:
POST   /api/auth/login

Users:
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
PATCH  /api/users/:id/status

Employees:
GET    /api/employees                    🆕

Departments:
GET    /api/departments                  🆕

Sessions:
GET    /api/sessions                     🆕

Candidates:
GET    /api/candidates
POST   /api/candidates                   🔄 Enhanced with sessionId, employee data
PUT    /api/candidates/:id
DELETE /api/candidates/:id
PATCH  /api/candidates/:id/status

Resolutions:
GET    /api/resolutions
POST   /api/resolutions                  🔄 Enhanced with sessionId, settings
PUT    /api/resolutions/:id
DELETE /api/resolutions/:id
PATCH  /api/resolutions/:id/status

Votes:
GET    /api/votes/history                🔄 Returns SessionTitle now
GET    /api/votes/results/candidates/:sessionId
GET    /api/votes/results/resolutions/:sessionId

Proxy:
GET    /api/proxy/assignments
GET    /api/proxy/groups

Audit:
GET    /api/audit                        ⚠️ Not implemented yet
```

---

## 🎨 UI Components

### **CandidateCRUDModal**
```typescript
Props:
- candidate: Candidate | null
- employees: any[]         🆕
- sessions: any[]          🆕
- onClose: () => void
- onSave: (data: any) => void

Fields:
- AGM Session dropdown     🆕
- Employee dropdown        🆕
- First Name (auto-fill)   🆕
- Last Name (auto-fill)    🆕
- Email (auto-fill)        🆕
- Department (auto-fill)   🆕
- Position (auto-fill)     🆕
- Bio/Achievements
```

### **ResolutionCRUDModal**
```typescript
Props:
- resolution: Resolution | null
- sessions: any[]          🆕
- onClose: () => void
- onSave: (data: any) => void

Fields:
- AGM Session dropdown     🆕
- Title
- Description
- Required Majority %      🆕
- Allow Abstain checkbox   🆕
```

---

## 🔧 Troubleshooting

### **No data showing in tabs**
1. Check browser console (F12)
2. Look for API Response logs
3. Verify token exists: `localStorage.getItem('token')`
4. Check Network tab for errors

### **Employee dropdown empty**
- Employees not loaded
- Check console: "API Response from /employees"
- Verify backend `/api/employees` endpoint working

### **Session dropdown empty**
- Sessions not loaded
- Check console: "API Response from /sessions"
- Verify at least 1 AGM session exists in database

### **Vote logs missing session info**
- Check console for `/api/votes/history` response
- Verify SessionTitle field in data
- Backend should JOIN with AGMSessions table

---

## ✅ Quick Test Checklist

**Before Creating Candidates**:
- [ ] Login as admin
- [ ] Go to Admin Dashboard
- [ ] Navigate to Candidates tab
- [ ] Click "➕ Add Candidate"
- [ ] Verify AGM Session dropdown has sessions
- [ ] Verify Employee dropdown has employees
- [ ] Select an employee → fields auto-fill
- [ ] Enter bio and save
- [ ] Candidate appears in table

**Before Creating Resolutions**:
- [ ] Navigate to Resolutions tab
- [ ] Click "➕ Add Resolution"
- [ ] Verify AGM Session dropdown has sessions
- [ ] Enter title and description
- [ ] Set majority percentage
- [ ] Toggle abstain option
- [ ] Save
- [ ] Resolution appears in table

**Verify Vote Logs**:
- [ ] Navigate to Vote Logs tab
- [ ] Verify "AGM Session" column exists
- [ ] Verify session titles show (e.g., "2024 Annual General Meeting")
- [ ] Search functionality works
- [ ] Session title included in search

---

## 📊 Database Schema References

### **Candidates Table**
```sql
CandidateID (PK)
SessionID (FK) → AGMSessions     🆕 Required
FirstName                        🆕 Required
LastName                         🆕 Required
Email
PhoneNumber
Department
Position
Bio                              (Previously: NominationReason)
Status
CreatedAt
```

### **Resolutions Table**
```sql
ResolutionID (PK)
SessionID (FK) → AGMSessions     🆕 Required
Title                            Required
Description                      Required
RequiredMajority                 🆕 Default: 50
AllowAbstain                     🆕 Default: true
Status
CreatedAt
```

### **Vote History View**
```sql
VoteID
VoterUserID
VoterName
SessionID                        🆕 From JOIN
SessionTitle                     🆕 From JOIN
VoteType (candidate/resolution)
EntityID
EntityName
VotesAllocated
IsProxyVote
VotedAt
```

---

## 🚀 Next Steps

### **Immediate**:
1. Test candidate creation with employee selection
2. Test resolution creation with session selection
3. Verify all tabs show data
4. Check vote logs have session column

### **Future Enhancements**:
1. Add candidate photos/avatars
2. Add resolution attachments
3. Implement audit logs backend
4. Add real-time vote updates
5. Add email notifications
6. Add data export features
7. Add analytics dashboard

---

## 💡 Tips

- **Always select an AGM Session** when creating candidates or resolutions
- **Use employee dropdown** for candidates to auto-fill details and maintain data consistency
- **Check browser console** for debug logs to troubleshoot issues
- **AGM Session tracking** enables historical analysis of votes across multiple meetings
- **Proxy votes** are clearly indicated in Vote Logs tab
- **Vote weights** are displayed for split/proxy voting

---

**Everything is now connected to the database and AGM sessions! 🎉**

Refresh your browser and test the Admin Dashboard now!
