# Candidate Display Fix - Summary

## Problem
Candidates were not appearing in the Admin Dashboard Candidates tab, despite 8 candidates existing in the database.

## Root Cause
**Schema Mismatch**: The backend `Candidate.js` model was querying for columns that don't exist in the database:
- Tried to query: `FirstName`, `LastName`, `Department`, `Bio`, etc. directly from `Candidates` table
- Database reality: `Candidates` table only has `EmployeeID` (foreign key), `Category`, `NominationReason`, `Status`, etc.

The database uses a **normalized schema** with foreign key relationships:
```
Candidates -> EmployeeID -> Employees -> UserID -> Users (FirstName, LastName)
                                       -> DepartmentID -> Departments (Name)
```

But the backend was expecting a **denormalized schema** with employee details directly in the Candidates table.

## Solution Applied
Completely rewrote the `Candidate.js` model queries to use proper SQL JOINs:

### Files Modified

#### 1. `backend/src/models/Candidate.js`

**findAll() method**: Now joins with Employees, Users, Departments, and Nominators
```sql
SELECT 
  c.CandidateID,
  c.SessionID,
  s.Title as SessionTitle,
  c.EmployeeID,
  emp.UserID,
  u.FirstName,
  u.LastName,
  u.Email,
  u.PhoneNumber,
  emp.Position,
  d.Name as DepartmentName,
  emp.Bio,
  u.ProfilePictureURL,
  c.Category,
  c.NominatedBy,
  nominator.FirstName + ' ' + nominator.LastName as NominatedByName,
  c.NominationReason,
  c.Status,
  c.TotalVotesReceived,
  c.CreatedAt,
  c.UpdatedAt
FROM Candidates c
LEFT JOIN AGMSessions s ON c.SessionID = s.SessionID
LEFT JOIN Employees emp ON c.EmployeeID = emp.EmployeeID
LEFT JOIN Users u ON emp.UserID = u.UserID
LEFT JOIN Departments d ON emp.DepartmentID = d.DepartmentID
LEFT JOIN Users nominator ON c.NominatedBy = nominator.UserID
```

**findById() method**: Same JOIN structure as findAll()

**create() method**: Now accepts `employeeId` instead of individual employee fields
```javascript
// OLD (incorrect):
{ firstName, lastName, department, position, bio, ... }

// NEW (correct):
{ employeeId, category, nominationReason, nominatedBy }
```

**update() method**: Only allows updating Candidates table fields
```javascript
// Allowed updates: Category, NominationReason, Status
// Employee info cannot be updated through Candidates (must update Employees table)
```

**getStatistics() method**: Updated with proper JOINs

**findByCategory() method**: Updated with proper JOINs

## Database Structure (Actual)

### Candidates Table
```sql
CREATE TABLE Candidates (
    CandidateID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,           -- FK to AGMSessions
    EmployeeID INT NOT NULL,          -- FK to Employees ← KEY FIELD
    Category NVARCHAR(100) NOT NULL,
    NominatedBy INT,                  -- FK to Users
    NominationReason NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'active',
    TotalVotesReceived INT DEFAULT 0,
    CreatedAt DATETIME2,
    UpdatedAt DATETIME2
);
```

### Employees Table
```sql
CREATE TABLE Employees (
    EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,              -- FK to Users ← Links to user details
    EmployeeNumber NVARCHAR(50),
    DepartmentID INT,                 -- FK to Departments
    Position NVARCHAR(100),
    HireDate DATETIME2,
    Bio NVARCHAR(MAX),
    ...
);
```

### Users Table
```sql
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(100),          ← Actual location of FirstName
    LastName NVARCHAR(100),           ← Actual location of LastName
    Email NVARCHAR(255),
    PhoneNumber NVARCHAR(20),
    ProfilePictureURL NVARCHAR(500),
    ...
);
```

### Departments Table
```sql
CREATE TABLE Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100),               ← Actual location of Department name
    Description NVARCHAR(MAX),
    ...
);
```

## Test Results

### Before Fix
```bash
> node test-candidates.js
❌ Error: Invalid column name 'FirstName'
❌ Error: Invalid column name 'Department'
❌ Error: Invalid column name 'Bio'
```

### After Fix
```bash
> node test-model.js
✅ Found 8 candidates

=== SAMPLE CANDIDATE ===
{
  "CandidateID": 1,
  "SessionID": 1,
  "SessionTitle": "2024 Annual General Meeting",
  "EmployeeID": 4,
  "UserID": 4,
  "FirstName": "Super",
  "LastName": "Administrator",
  "Email": "superadmin@forvismazars.com",
  "Position": "Staff Member",
  "DepartmentName": "Operations",
  "Bio": "Professional staff member at Forvis Mazars",
  "Category": "Employee of the Year",
  "NominationReason": "Led 3 major projects, increased team productivity by 40%",
  "Status": "active",
  "TotalVotesReceived": 0
}

Has FirstName? true
Has LastName? true
Has DepartmentName? true
✅ All tests passed!
```

## Frontend Status

The frontend was already enhanced with debugging in a previous session:
- `src/pages/AdminDashboard.tsx` - Has emoji logging (🔍 ✅ ⚠️ ❌)
- `src/services/api.ts` - Has response transformations

No frontend changes were needed - it was already ready to receive and display the data once the backend was fixed.

## Verification Steps

1. **Backend Running**: `npm run dev` in `backend/` folder (port 3001)
2. **Frontend Running**: `npm run dev` in root folder (port 5173)
3. **Open Browser**: http://localhost:5173
4. **Login**: Use admin credentials
5. **Navigate**: Admin Dashboard → Candidates tab
6. **Expected Result**: 8 candidates displayed with names, departments, categories, and vote counts

## Data Flow (Now Working)

```
Database (8 candidates with EmployeeID FK)
    ↓
Backend Candidate.js (JOINs with Employees, Users, Departments)
    ↓
API Response (Full candidate data with FirstName, LastName, DepartmentName)
    ↓
Frontend Transformation (Maps to display format)
    ↓
Admin Dashboard (Displays candidates in table)
```

## Files Created for Testing

1. **backend/check-schema.js** - Verifies database structure and data
2. **backend/test-candidates.js** - Initial test (revealed the problem)
3. **backend/test-model.js** - Final test (confirms the fix works)

## Important Notes

### For Creating New Candidates
When creating a new candidate, you must now provide:
- `sessionId` - The AGM session ID
- `employeeId` - The ID of an existing employee
- `category` - The award category
- `nominationReason` - Why they're nominated
- `nominatedBy` - UserID of the nominator (optional)

Do NOT provide: firstName, lastName, department, position, bio (these come from Employees/Users tables)

### For Updating Candidates
You can only update:
- `category` - Change the award category
- `nominationReason` - Edit the reason for nomination
- `status` - Change between 'active' and 'inactive'

Employee information must be updated through the Employees table, not through Candidates.

## Summary

✅ **Fixed**: Backend Candidate model now uses correct SQL JOINs
✅ **Verified**: Model returns all 8 candidates with employee information
✅ **Aligned**: Code now matches actual database schema
✅ **Ready**: Frontend should display candidates in Admin Dashboard

The root cause was a fundamental mismatch between what the code expected (denormalized schema) and what the database actually has (normalized schema with foreign keys). All queries have been rewritten to use the correct JOIN pattern.
