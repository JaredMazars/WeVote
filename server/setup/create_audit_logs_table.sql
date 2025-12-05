-- Create audit_logs table for comprehensive system logging
-- This table tracks all major actions in the WeVote application

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(255) NULL, -- User who performed the action (NULL for system actions)
        action_type NVARCHAR(100) NOT NULL, -- Specific action (e.g., 'login', 'vote_cast', 'user_created')
        action_category NVARCHAR(50) NOT NULL, -- Category (AUTH, VOTE, PROXY, ADMIN, RESOLUTION, TIMER, SYSTEM)
        description NVARCHAR(MAX) NOT NULL, -- Human-readable description of the action
        entity_type NVARCHAR(100) NULL, -- Type of entity affected (user, employee, resolution, proxy, etc.)
        entity_id NVARCHAR(255) NULL, -- ID of the affected entity
        metadata NVARCHAR(MAX) NULL, -- Additional data in JSON format
        ip_address NVARCHAR(100) NULL, -- IP address of the request
        user_agent NVARCHAR(500) NULL, -- Browser/client information
        status NVARCHAR(20) DEFAULT 'success', -- success, failure, warning
        created_at DATETIME DEFAULT GETDATE(),
        
        -- Indexes for better query performance
        INDEX idx_user_id (user_id),
        INDEX idx_action_type (action_type),
        INDEX idx_action_category (action_category),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created_at (created_at),
        INDEX idx_status (status)
    );
    
    PRINT 'audit_logs table created successfully';
END
ELSE
BEGIN
    PRINT 'audit_logs table already exists';
END
GO

-- Add foreign key constraint to users table (optional, allows orphaned logs if user is deleted)
-- Uncomment if you want to enforce referential integrity
-- IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_audit_logs_users')
-- BEGIN
--     ALTER TABLE audit_logs
--     ADD CONSTRAINT FK_audit_logs_users
--     FOREIGN KEY (user_id) REFERENCES users(id)
--     ON DELETE SET NULL;
-- END
-- GO

PRINT 'Audit log system setup complete';
PRINT '';
PRINT 'Action Categories:';
PRINT '  - AUTH: Authentication actions (login, logout, password changes)';
PRINT '  - VOTE: Voting actions (vote cast, removed, edited)';
PRINT '  - PROXY: Proxy management (assigned, revoked, groups)';
PRINT '  - ADMIN: Administrative actions (user/employee/resolution management)';
PRINT '  - RESOLUTION: Resolution-specific actions';
PRINT '  - TIMER: AGM timer actions (start, stop, update)';
PRINT '  - SYSTEM: System-level actions (exports, bulk operations)';
