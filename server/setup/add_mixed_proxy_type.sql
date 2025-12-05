-- =============================================
-- Migration: Add MIXED appointment type support
-- Date: 2025-11-20
-- Description: Updates proxy system to support mixed (discretional + instructional) appointment types
-- =============================================

-- Step 1: Add votes_allocated column to proxy_group_members (if not exists)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[proxy_group_members]') 
    AND name = 'votes_allocated'
)
BEGIN
    ALTER TABLE [dbo].[proxy_group_members] 
    ADD [votes_allocated] [int] NOT NULL DEFAULT (0);
    
    PRINT 'Added votes_allocated column to proxy_group_members table';
END
ELSE
BEGIN
    PRINT 'votes_allocated column already exists in proxy_group_members table';
END
GO

-- Step 2: Add discretional_votes column to proxy_group_members (if not exists)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[proxy_group_members]') 
    AND name = 'discretional_votes'
)
BEGIN
    ALTER TABLE [dbo].[proxy_group_members] 
    ADD [discretional_votes] [int] NOT NULL DEFAULT (0);
    
    PRINT 'Added discretional_votes column to proxy_group_members table';
END
ELSE
BEGIN
    PRINT 'discretional_votes column already exists in proxy_group_members table';
END
GO

-- Step 3: Add instructional_votes column to proxy_group_members (if not exists)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[proxy_group_members]') 
    AND name = 'instructional_votes'
)
BEGIN
    ALTER TABLE [dbo].[proxy_group_members] 
    ADD [instructional_votes] [int] NOT NULL DEFAULT (0);
    
    PRINT 'Added instructional_votes column to proxy_group_members table';
END
ELSE
BEGIN
    PRINT 'instructional_votes column already exists in proxy_group_members table';
END
GO

-- Step 4: Drop existing CHECK constraint on proxy_group_members.appointment_type
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID(N'[dbo].[proxy_group_members]') 
AND definition LIKE '%appointment_type%';

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @SQL NVARCHAR(500);
    SET @SQL = 'ALTER TABLE [dbo].[proxy_group_members] DROP CONSTRAINT ' + @ConstraintName;
    EXEC sp_executesql @SQL;
    PRINT 'Dropped old appointment_type constraint: ' + @ConstraintName;
END
GO

-- Step 5: Add new CHECK constraint that includes MIXED
ALTER TABLE [dbo].[proxy_group_members]
ADD CONSTRAINT CK_proxy_group_members_appointment_type 
CHECK ([appointment_type] IN ('DISCRETIONAL', 'INSTRUCTIONAL', 'MIXED', NULL));
GO

PRINT 'Added new appointment_type constraint allowing MIXED type';
GO

-- Step 6: Update existing data to set vote splits based on appointment type
UPDATE [dbo].[proxy_group_members]
SET 
    [discretional_votes] = CASE 
        WHEN [appointment_type] = 'DISCRETIONAL' THEN ISNULL([votes_allocated], 0)
        ELSE 0 
    END,
    [instructional_votes] = CASE 
        WHEN [appointment_type] = 'INSTRUCTIONAL' THEN ISNULL([votes_allocated], 0)
        ELSE 0 
    END
WHERE [votes_allocated] IS NOT NULL AND [votes_allocated] > 0;
GO

PRINT 'Updated existing proxy_group_members with vote splits';
GO

-- Step 7: Verify the changes
SELECT 
    'proxy_group_members' AS TableName,
    COUNT(*) AS TotalRecords,
    COUNT(CASE WHEN appointment_type = 'DISCRETIONAL' THEN 1 END) AS Discretional,
    COUNT(CASE WHEN appointment_type = 'INSTRUCTIONAL' THEN 1 END) AS Instructional,
    COUNT(CASE WHEN appointment_type = 'MIXED' THEN 1 END) AS Mixed,
    SUM(votes_allocated) AS TotalVotesAllocated,
    SUM(discretional_votes) AS TotalDiscretionalVotes,
    SUM(instructional_votes) AS TotalInstructionalVotes
FROM [dbo].[proxy_group_members];
GO

PRINT 'Migration completed successfully!';
GO

-- =============================================
-- Validation: Ensure vote splits match total
-- =============================================
SELECT 
    id,
    full_name,
    appointment_type,
    votes_allocated,
    discretional_votes,
    instructional_votes,
    (discretional_votes + instructional_votes) AS calculated_total,
    CASE 
        WHEN (discretional_votes + instructional_votes) != votes_allocated 
        THEN 'MISMATCH' 
        ELSE 'OK' 
    END AS validation_status
FROM [dbo].[proxy_group_members]
WHERE votes_allocated > 0;
GO
