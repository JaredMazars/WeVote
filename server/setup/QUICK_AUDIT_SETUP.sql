-- Quick Setup Script for Audit Logging System
-- Run this script in your SQL Server database

-- Step 1: Create audit_logs table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(255) NULL,
        action_type NVARCHAR(100) NOT NULL,
        action_category NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        entity_type NVARCHAR(100) NULL,
        entity_id NVARCHAR(255) NULL,
        metadata NVARCHAR(MAX) NULL,
        ip_address NVARCHAR(100) NULL,
        user_agent NVARCHAR(500) NULL,
        status NVARCHAR(20) DEFAULT 'success',
        created_at DATETIME DEFAULT GETDATE(),
        
        INDEX idx_user_id (user_id),
        INDEX idx_action_type (action_type),
        INDEX idx_action_category (action_category),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created_at (created_at),
        INDEX idx_status (status)
    );
    
    PRINT '✅ audit_logs table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️  audit_logs table already exists';
END
GO

-- Step 2: Verify table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'audit_logs'
ORDER BY ORDINAL_POSITION;
GO

-- Step 3: Check indexes
SELECT 
    i.name AS index_name,
    STRING_AGG(c.name, ', ') AS columns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('audit_logs')
GROUP BY i.name
ORDER BY i.name;
GO

PRINT '';
PRINT '=== Audit Logging System Setup Complete ===';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Restart your Node.js server';
PRINT '2. Test login to generate first audit log';
PRINT '3. Access audit trail at: http://localhost:5173/admin/audit-trail';
PRINT '';
PRINT 'Test Query:';
PRINT 'SELECT TOP 10 * FROM audit_logs ORDER BY created_at DESC;';
