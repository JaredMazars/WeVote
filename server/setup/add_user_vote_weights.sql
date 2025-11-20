-- Add vote weight and vote limit columns to users table
-- This allows admins to assign individual vote weights to users within super admin boundaries

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
BEGIN
    -- Add vote_weight column (decimal to allow partial votes like 0.5, 1.5, etc.)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'vote_weight')
    BEGIN
        ALTER TABLE users ADD vote_weight decimal(5,2) NOT NULL DEFAULT 1.0;
        PRINT 'Added vote_weight column to users table';
    END

    -- Add max_votes_allowed column (integer for maximum votes a user can cast)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'max_votes_allowed')
    BEGIN
        ALTER TABLE users ADD max_votes_allowed int NOT NULL DEFAULT 1;
        PRINT 'Added max_votes_allowed column to users table';
    END

    -- Add min_votes_required column (integer for minimum votes a user must cast)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'min_votes_required')
    BEGIN
        ALTER TABLE users ADD min_votes_required int NOT NULL DEFAULT 1;
        PRINT 'Added min_votes_required column to users table';
    END

    -- Add vote_limit_set_by column (track who set the vote limits)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'vote_limit_set_by')
    BEGIN
        ALTER TABLE users ADD vote_limit_set_by nvarchar(255) NULL;
        PRINT 'Added vote_limit_set_by column to users table';
    END

    -- Add vote_limit_updated_at column (track when vote limits were last updated)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'vote_limit_updated_at')
    BEGIN
        ALTER TABLE users ADD vote_limit_updated_at datetime NULL;
        PRINT 'Added vote_limit_updated_at column to users table';
    END

    PRINT 'User vote weight and limit columns added successfully';
END
ELSE
BEGIN
    PRINT 'ERROR: users table does not exist';
END
GO

-- Add constraints to ensure vote limits stay within super admin boundaries
-- This will be enforced in the application logic as well
PRINT 'Vote weight columns added. Admins can now set user vote limits within super admin boundaries.';
GO
