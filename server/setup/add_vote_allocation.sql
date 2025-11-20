-- Add vote allocation column to proxy_group_members table
-- This allows tracking how many votes each proxy member receives

USE wevote;
GO

-- Add votes_allocated column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('proxy_group_members') 
    AND name = 'votes_allocated'
)
BEGIN
    ALTER TABLE proxy_group_members
    ADD votes_allocated INT NOT NULL DEFAULT 0;
    
    PRINT 'Added votes_allocated column to proxy_group_members table';
END
ELSE
BEGIN
    PRINT 'votes_allocated column already exists in proxy_group_members table';
END
GO

-- Add total_votes_delegated column to proxy_groups table to track total
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('proxy_groups') 
    AND name = 'total_votes_delegated'
)
BEGIN
    ALTER TABLE proxy_groups
    ADD total_votes_delegated INT NOT NULL DEFAULT 0;
    
    PRINT 'Added total_votes_delegated column to proxy_groups table';
END
ELSE
BEGIN
    PRINT 'total_votes_delegated column already exists in proxy_groups table';
END
GO

-- View the updated table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'proxy_group_members'
ORDER BY ORDINAL_POSITION;
GO

PRINT 'Vote allocation schema update completed successfully!';
GO
