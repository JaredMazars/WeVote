# Database Schema Alignment - Full Report

## Tables Status

### ✅ Working Tables (Data Exists)
1. **Candidates** - 8 records ✅ FIXED
2. **Resolutions** - 5 records ✅ FIXED  
3. **VoteAllocations** - 11 records - NEEDS MODEL FIX
4. **CandidateVotes** - 5 records - NEEDS MODEL FIX
5. **ResolutionVotes** - 8 records - NEEDS MODEL FIX

### ⚠️ Empty Tables (Schema Exists, No Data)
6. **ProxyAssignments** - 0 records - NEEDS MODEL FIX + TEST DATA
7. **ProxyInstructions** - 0 records - NEEDS MODEL FIX + TEST DATA
8. **UserVoteTracking** - 0 records - NEEDS MODEL + ROUTE
9. **VoteStatistics** - 0 records - NEEDS MODEL + ROUTE
10. **SessionReports** - 0 records - NEEDS MODEL + ROUTE
11. **AuditLog** - 0 records - NEEDS MODEL FIX

## Schema Issues Found

### ProxyAssignments (Actual Schema)
```sql
- ProxyID (int) PRIMARY KEY
- SessionID (int) NOT NULL
- PrincipalUserID (int) NOT NULL
- ProxyUserID (int) NOT NULL
- ProxyType (nvarchar) NOT NULL
- StartDate (datetime2)
- EndDate (datetime2)
- IsActive (bit)
- CreatedAt (datetime2)
- UpdatedAt (datetime2)
```

**Proxy.js Model Issues:**
- Queries: `ProxyHolderUserID` ❌ Should be: `ProxyUserID`
- Queries: `AGMSessionID` ❌ Should be: `SessionID`
- Queries: `AssignmentType` ❌ Should be: `ProxyType`
- Queries: `ValidFrom`, `ValidUntil` ❌ Should be: `StartDate`, `EndDate`
- Queries: `MaxVotesAllowed`, `CanDelegate`, `Notes` ❌ Don't exist

### VoteAllocations (Actual Schema)
```sql
- AllocationID (int) PRIMARY KEY
- SessionID (int) NOT NULL
- UserID (int) NOT NULL
- AllocatedVotes (int) NOT NULL
- Reason (nvarchar)
- BasedOn (nvarchar)
- SetBy (int) NOT NULL
- CreatedAt (datetime2)
- UpdatedAt (datetime2)
```

**Model Status:** Needs verification

### CandidateVotes (Actual Schema)
```sql
- VoteID (int) PRIMARY KEY
- SessionID (int) NOT NULL
- CandidateID (int) NOT NULL
- VoterUserID (int) NOT NULL
- VotesAllocated (int)
- IsProxyVote (bit)
- ProxyID (int)
- VotedAt (datetime2)
```

**Model Status:** Needs verification

### ResolutionVotes (Actual Schema)
```sql
- VoteID (int) PRIMARY KEY
- SessionID (int) NOT NULL
- ResolutionID (int) NOT NULL
- VoterUserID (int) NOT NULL
- VoteChoice (nvarchar) NOT NULL  -- 'yes', 'no', 'abstain'
- VotesAllocated (int)
- IsProxyVote (bit)
- ProxyID (int)
- VotedAt (datetime2)
```

**Model Status:** Needs verification

### AuditLog (Actual Schema)
```sql
- LogID (int) PRIMARY KEY
- UserID (int)
- OrganizationID (int)
- Action (nvarchar) NOT NULL
- EntityType (nvarchar)
- EntityID (int)
- Details (nvarchar)
- IPAddress (nvarchar)
- UserAgent (nvarchar)
- CreatedAt (datetime2)
```

**Model Status:** Needs to be created

## Required Actions

### IMMEDIATE FIXES (Models with wrong column names)

1. **Proxy.js** - Fix column names to match ProxyAssignments
   - `ProxyHolderUserID` → `ProxyUserID`
   - `AGMSessionID` → `SessionID`
   - `AssignmentType` → `ProxyType`
   - Remove: `MaxVotesAllowed`, `CanDelegate`, `Notes`

2. **Vote.js** - Verify alignment with CandidateVotes/ResolutionVotes tables

3. **VoteAllocation.js** - Verify alignment with VoteAllocations table

### CREATE NEW MODELS

4. **AuditLog.js** - Create new model for audit logging
5. **VoteTracking.js** - Create for UserVoteTracking table
6. **VoteStatistics.js** - Create for VoteStatistics table  
7. **SessionReport.js** - Create for SessionReports table

### CREATE TEST DATA

8. Add sample ProxyAssignments
9. Add sample ProxyInstructions
10. Generate VoteStatistics from existing votes
11. Create sample AuditLog entries

## Frontend API Methods Status

From `api.ts`:
- ✅ getResolutions() - Working
- ✅ getCandidates() - Working
- ✅ getVoteAllocations() - Should work
- ⚠️ getProxyGroups() - Endpoint exists but model needs fix
- ⚠️ getProxyAssignments() - Endpoint exists but model needs fix
- ⚠️ getVoteLogs() - Uses `/votes/history` - needs verification
- ⚠️ getCandidateVotes() - Uses `/votes/results/candidates/:id`
- ⚠️ getResolutionVotes() - Uses `/votes/results/resolutions/:id`
- ❌ getAuditLogs() - Returns empty array (not implemented)

## Testing Plan

1. Fix Proxy model → Test ProxyAssignments CRUD
2. Verify Vote model → Test vote retrieval
3. Verify VoteAllocation model → Test allocation retrieval
4. Create AuditLog model → Test audit logging
5. Add test data for empty tables
6. Test all admin dashboard tabs load data
