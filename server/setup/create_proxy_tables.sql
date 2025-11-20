-- Create Proxy Tables for WeVote System
-- This script creates the necessary tables for proxy voting functionality

-- 1. Proxy Groups Table (Main table for proxy delegations)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='proxy_groups' and xtype='U')
BEGIN
    CREATE TABLE proxy_groups (
        id INT IDENTITY(1,1) PRIMARY KEY,
        principal_id INT NOT NULL,  -- The user delegating their votes
        appointment_type NVARCHAR(50) DEFAULT 'both', -- 'employee', 'resolution', or 'both'
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        valid_until DATETIME NULL,
        FOREIGN KEY (principal_id) REFERENCES users(id) ON DELETE CASCADE
    );
    PRINT 'proxy_groups table created';
END
ELSE
    PRINT 'proxy_groups table already exists';

-- 2. Proxy Group Members Table (Users who can vote as proxies)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='proxy_group_members' and xtype='U')
BEGIN
    CREATE TABLE proxy_group_members (
        id INT IDENTITY(1,1) PRIMARY KEY,
        group_id INT NOT NULL,
        member_id INT NOT NULL,  -- The user who will vote as proxy
        appointment_type NVARCHAR(50) DEFAULT 'DISCRETIONARY', -- 'DISCRETIONARY' or 'INSTRUCTIONAL'
        initials NVARCHAR(10) NULL,
        surname NVARCHAR(100) NULL,
        full_name NVARCHAR(200) NULL,
        membership_number NVARCHAR(50) NULL,
        id_number NVARCHAR(50) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (group_id) REFERENCES proxy_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE NO ACTION,
        UNIQUE(group_id, member_id)  -- A user can only be in a group once
    );
    PRINT 'proxy_group_members table created';
END
ELSE
    PRINT 'proxy_group_members table already exists';

-- 3. Proxy Member Allowed Candidates (For INSTRUCTIONAL proxies)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='proxy_member_allowed_candidates' and xtype='U')
BEGIN
    CREATE TABLE proxy_member_allowed_candidates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        proxy_member_id INT NOT NULL,  -- References proxy_group_members.id
        employee_id INT NOT NULL,  -- The employee they're allowed to vote for
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (proxy_member_id) REFERENCES proxy_group_members(id) ON DELETE CASCADE,
        UNIQUE(proxy_member_id, employee_id)  -- Can't add same candidate twice
    );
    PRINT 'proxy_member_allowed_candidates table created';
END
ELSE
    PRINT 'proxy_member_allowed_candidates table already exists';

-- 4. Proxy Appointments Table (Proxy form submissions)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='proxy_appointments' and xtype='U')
BEGIN
    CREATE TABLE proxy_appointments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        member_membership_number NVARCHAR(50) NOT NULL,  -- Principal's member number
        group_id INT NULL,  -- References proxy_groups.id
        appointment_type NVARCHAR(50) DEFAULT 'general',
        status NVARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
        form_data NVARCHAR(MAX) NULL,  -- JSON data from proxy form
        created_at DATETIME DEFAULT GETDATE(),
        approved_at DATETIME NULL,
        FOREIGN KEY (group_id) REFERENCES proxy_groups(id) ON DELETE SET NULL
    );
    PRINT 'proxy_appointments table created';
END
ELSE
    PRINT 'proxy_appointments table already exists';

-- 5. Create indexes for better query performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_proxy_groups_principal' AND object_id = OBJECT_ID('proxy_groups'))
BEGIN
    CREATE INDEX IX_proxy_groups_principal ON proxy_groups(principal_id);
    PRINT 'Index IX_proxy_groups_principal created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_proxy_group_members_group' AND object_id = OBJECT_ID('proxy_group_members'))
BEGIN
    CREATE INDEX IX_proxy_group_members_group ON proxy_group_members(group_id);
    PRINT 'Index IX_proxy_group_members_group created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_proxy_group_members_member' AND object_id = OBJECT_ID('proxy_group_members'))
BEGIN
    CREATE INDEX IX_proxy_group_members_member ON proxy_group_members(member_id);
    PRINT 'Index IX_proxy_group_members_member created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_proxy_member_allowed_candidates_member' AND object_id = OBJECT_ID('proxy_member_allowed_candidates'))
BEGIN
    CREATE INDEX IX_proxy_member_allowed_candidates_member ON proxy_member_allowed_candidates(proxy_member_id);
    PRINT 'Index IX_proxy_member_allowed_candidates_member created';
END

PRINT '';
PRINT '========================================';
PRINT 'Proxy tables setup complete!';
PRINT '========================================';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Insert test proxy groups';
PRINT '2. Add proxy members to groups';
PRINT '3. For INSTRUCTIONAL proxies, add allowed candidates';
PRINT '';
