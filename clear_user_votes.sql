-- Clear all votes for jaredmoodley9@gmail.com
-- Run this SQL script in your database

-- Get the user ID
DECLARE @userId INT;
DECLARE @userName NVARCHAR(255);
DECLARE @deletedCount INT;

SELECT @userId = id, @userName = name 
FROM users 
WHERE email = 'jaredmoodley9@gmail.com';

-- Check if user exists
IF @userId IS NULL
BEGIN
    PRINT '❌ User with email jaredmoodley9@gmail.com not found';
END
ELSE
BEGIN
    PRINT '=================================================';
    PRINT '🔄 CLEARING VOTES FOR USER';
    PRINT '=================================================';
    PRINT 'User ID: ' + CAST(@userId AS NVARCHAR(10));
    PRINT 'User Name: ' + @userName;
    PRINT 'Email: jaredmoodley9@gmail.com';
    PRINT '';
    
    -- Count current votes
    SELECT @deletedCount = COUNT(*) 
    FROM votes 
    WHERE voter_id = @userId;
    
    PRINT 'Current Votes: ' + CAST(@deletedCount AS NVARCHAR(10));
    PRINT '';
    
    -- Delete all votes
    DELETE FROM votes 
    WHERE voter_id = @userId;
    
    PRINT '✅ Deleted ' + CAST(@deletedCount AS NVARCHAR(10)) + ' votes';
    
    -- Recalculate employee vote counts
    UPDATE employees 
    SET total_votes = (
        SELECT COUNT(*) 
        FROM votes 
        WHERE employee_id = employees.id 
        AND valid_vote = 1
    ),
    updated_at = GETDATE();
    
    PRINT '✅ Recalculated employee vote counts';
    
    PRINT '';
    PRINT '=================================================';
    PRINT '✅ VOTES CLEARED SUCCESSFULLY';
    PRINT '=================================================';
    
    -- Show final status
    SELECT 
        u.id as user_id,
        u.email,
        u.name,
        ISNULL(u.max_votes_allowed, 5) as max_votes_allowed,
        COUNT(v.id) as actual_votes_in_db
    FROM users u
    LEFT JOIN votes v ON v.voter_id = u.id AND v.valid_vote = 1
    WHERE u.id = @userId
    GROUP BY u.id, u.email, u.name, u.max_votes_allowed;
END
