-- Create Custom Super Admin User
-- This script creates a new super admin user with custom credentials

USE WeVoteDB;
GO

-- First, ensure the super admin role exists (role_id = 0)
IF NOT EXISTS (SELECT 1 FROM roles WHERE id = 0)
BEGIN
    SET IDENTITY_INSERT roles ON;
    INSERT INTO roles (id, name, description) 
    VALUES (0, 'super_admin', 'Super Administrator with full system access');
    SET IDENTITY_INSERT roles OFF;
END
GO

-- Create custom super admin user
-- Email: admin.bilal@wevote.com
-- Password: W3V0t3@dmin2025!

DECLARE @email NVARCHAR(255) = 'admin.bilal@wevote.com';
DECLARE @hashedPassword NVARCHAR(255) = '$2b$10$YourHashedPasswordHere'; -- This will be set by the Node.js script

-- Check if user already exists
IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
BEGIN
    INSERT INTO users (
        email,
        password,
        name,
        role_id,
        member_number,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        @email,
        @hashedPassword,
        'Bilal Administrator',
        0, -- Super Admin role
        'SA001',
        1,
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Custom Super Admin user created successfully!';
    PRINT 'Email: admin.bilal@wevote.com';
    PRINT 'Password: W3V0t3@dmin2025!';
    PRINT 'Role: Super Admin (role_id = 0)';
END
ELSE
BEGIN
    PRINT 'User with email admin.bilal@wevote.com already exists.';
    
    -- Update existing user to super admin role
    UPDATE users 
    SET role_id = 0,
        name = 'Bilal Administrator',
        member_number = 'SA001',
        is_active = 1,
        updated_at = GETDATE()
    WHERE email = @email;
    
    PRINT 'Existing user updated to Super Admin role.';
END
GO

-- Verify the user was created/updated
SELECT 
    id,
    email,
    name,
    role_id,
    member_number,
    is_active,
    created_at
FROM users 
WHERE email = 'admin.bilal@wevote.com';
GO
