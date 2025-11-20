-- Add Super Admin role (value 0)
IF NOT EXISTS (SELECT * FROM roles WHERE id = 0)
BEGIN
    SET IDENTITY_INSERT roles ON;
    INSERT INTO roles (id, name, description, permissions) 
    VALUES (0, 'Super Admin', 'Ultimate system administrator with all privileges', 'ALL_PERMISSIONS');
    SET IDENTITY_INSERT roles OFF;
    PRINT 'Super Admin role created with id = 0';
END

-- Create a Super Admin user
-- Password: SuperAdmin123! (will be hashed when user logs in and changes password)
IF NOT EXISTS (SELECT * FROM users WHERE email = 'superadmin@wevote.com')
BEGIN
    INSERT INTO users (
        title, email, password_hash, initials, id_number, name, surname,
        avatar_url, role_id, is_active, email_verified, member_number,
        proxy_vote_form, date_of_birth, phone, created_at
    )
    VALUES (
        'Mr', 
        'superadmin@wevote.com', 
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG.aqrJ6za', -- SuperAdmin123!
        'SA', 
        '0000000000', 
        'Super', 
        'Administrator',
        '', 
        0, -- Super Admin role
        1, -- is_active
        1, -- email_verified
        'SA001',
        NULL, -- proxy_vote_form
        '1990-01-01', 
        '0000000000', 
        GETDATE()
    );
    PRINT 'Super Admin user created: superadmin@wevote.com';
    PRINT 'Password: SuperAdmin123!';
END
ELSE
BEGIN
    PRINT 'Super Admin user already exists: superadmin@wevote.com';
END

-- Create vote splitting settings table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'vote_splitting_settings')
BEGIN
    CREATE TABLE vote_splitting_settings (
        id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        setting_name nvarchar(100) NOT NULL UNIQUE,
        is_enabled bit NOT NULL DEFAULT 0,
        min_proxy_voters int NOT NULL DEFAULT 1,
        max_proxy_voters int NOT NULL DEFAULT 10,
        min_individual_votes int NOT NULL DEFAULT 1,
        max_individual_votes int NOT NULL DEFAULT 5,
        created_at datetime NOT NULL DEFAULT GETDATE(),
        updated_at datetime NOT NULL DEFAULT GETDATE(),
        created_by nvarchar(255) NULL DEFAULT 'system'
    );

    -- Insert default settings
    INSERT INTO vote_splitting_settings (setting_name, is_enabled, min_proxy_voters, max_proxy_voters, min_individual_votes, max_individual_votes)
    VALUES ('proxy_vote_splitting', 0, 2, 20, 1, 3);
END

-- Create proxy voter limits table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'proxy_voter_limits')
BEGIN
    CREATE TABLE proxy_voter_limits (
        id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        proxy_group_id int NOT NULL,
        user_id int NOT NULL,
        max_votes_allowed int NOT NULL DEFAULT 1,
        votes_used int NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT GETDATE(),
        updated_at datetime NOT NULL DEFAULT GETDATE(),
        UNIQUE(proxy_group_id, user_id)
    );
    
    -- Add foreign key constraints after table creation to avoid circular dependency issues
    -- Note: Adding foreign keys later to ensure referenced tables exist
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'proxy_groups')
    BEGIN
        ALTER TABLE proxy_voter_limits ADD CONSTRAINT FK_proxy_voter_limits_proxy_group
        FOREIGN KEY (proxy_group_id) REFERENCES proxy_groups(id) ON DELETE CASCADE;
    END
    
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
    BEGIN
        ALTER TABLE proxy_voter_limits ADD CONSTRAINT FK_proxy_voter_limits_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION;
    END
END

-- Create vote distribution tracking table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'vote_distributions')
BEGIN
    CREATE TABLE vote_distributions (
        id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        proxy_vote_id int NOT NULL,
        distributed_to_user_id int NOT NULL,
        vote_weight decimal(3,2) NOT NULL DEFAULT 1.0, -- Allows partial votes like 0.5, 0.33, etc
        vote_type nvarchar(50) NOT NULL, -- 'employee' or 'resolution'
        target_id int NOT NULL, -- employee_id or resolution_id
        is_active bit NOT NULL DEFAULT 1,
        created_at datetime NOT NULL DEFAULT GETDATE(),
        updated_at datetime NOT NULL DEFAULT GETDATE()
    );
    
    -- Add foreign key constraints after table creation
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'votes')
    BEGIN
        ALTER TABLE vote_distributions ADD CONSTRAINT FK_vote_distributions_vote
        FOREIGN KEY (proxy_vote_id) REFERENCES votes(id) ON DELETE CASCADE;
    END
    
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
    BEGIN
        ALTER TABLE vote_distributions ADD CONSTRAINT FK_vote_distributions_user
        FOREIGN KEY (distributed_to_user_id) REFERENCES users(id) ON DELETE NO ACTION;
    END
END

-- Add vote splitting enabled column to proxy_groups table if it doesn't exist
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'proxy_groups')
BEGIN
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'proxy_groups' AND COLUMN_NAME = 'vote_splitting_enabled')
    BEGIN
        ALTER TABLE proxy_groups ADD vote_splitting_enabled bit NOT NULL DEFAULT 0;
        PRINT 'Added vote_splitting_enabled column to proxy_groups table';
    END
    
    -- Add min/max vote limits to proxy_groups table
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'proxy_groups' AND COLUMN_NAME = 'min_votes_per_user')
    BEGIN
        ALTER TABLE proxy_groups ADD min_votes_per_user int NOT NULL DEFAULT 1;
        PRINT 'Added min_votes_per_user column to proxy_groups table';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'proxy_groups' AND COLUMN_NAME = 'max_votes_per_user')
    BEGIN
        ALTER TABLE proxy_groups ADD max_votes_per_user int NOT NULL DEFAULT 1;
        PRINT 'Added max_votes_per_user column to proxy_groups table';
    END
END
ELSE
BEGIN
    PRINT 'WARNING: proxy_groups table does not exist. Please ensure the main database schema is set up first.';
END
