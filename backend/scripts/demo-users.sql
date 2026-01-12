-- =====================================================
-- Demo Users for WeVote Platform
-- Password for ALL users: "Demo@123"
-- =====================================================

-- Note: These are hashed passwords using bcrypt with 12 rounds
-- To generate: bcrypt.hash('Demo@123', 12)
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TT6WqKN8YkqAqXq6YqXq6YqXq6YqXq

-- This is a SAMPLE hash - you'll need to run the actual bcrypt generation
-- Use the backend API or a bcrypt tool to generate the real hash

-- =====================================================
-- SUPER ADMIN USER
-- =====================================================
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role, 
  OrganizationID, IsActive, IsEmailVerified, 
  CreatedAt, LastLogin
) VALUES (
  'superadmin@forvismazars.com',
  '$2b$12$HASH_HERE', -- Replace with actual bcrypt hash of 'Demo@123'
  'Super',
  'Administrator',
  'super_admin',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);

-- =====================================================
-- ADMIN USER
-- =====================================================
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role,
  OrganizationID, IsActive, IsEmailVerified,
  CreatedAt, LastLogin
) VALUES (
  'admin@forvismazars.com',
  '$2b$12$HASH_HERE', -- Replace with actual bcrypt hash of 'Demo@123'
  'John',
  'Administrator',
  'admin',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);

-- =====================================================
-- AUDITOR USER
-- =====================================================
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role,
  OrganizationID, IsActive, IsEmailVerified,
  CreatedAt, LastLogin
) VALUES (
  'auditor@forvismazars.com',
  '$2b$12$HASH_HERE', -- Replace with actual bcrypt hash of 'Demo@123'
  'Sarah',
  'Auditor',
  'auditor',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);

-- =====================================================
-- EMPLOYEE USER
-- =====================================================
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role,
  OrganizationID, IsActive, IsEmailVerified,
  CreatedAt, LastLogin
) VALUES (
  'employee@forvismazars.com',
  '$2b$12$HASH_HERE', -- Replace with actual bcrypt hash of 'Demo@123'
  'Michael',
  'Employee',
  'employee',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);

-- =====================================================
-- REGULAR USER (VOTER)
-- =====================================================
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role,
  OrganizationID, IsActive, IsEmailVerified,
  CreatedAt, LastLogin
) VALUES (
  'user@forvismazars.com',
  '$2b$12$HASH_HERE', -- Replace with actual bcrypt hash of 'Demo@123'
  'Jane',
  'User',
  'user',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);

-- =====================================================
-- ADDITIONAL TEST USERS FOR PROXY VOTING
-- =====================================================

-- User 2 - For proxy testing
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role,
  OrganizationID, IsActive, IsEmailVerified,
  CreatedAt, LastLogin
) VALUES (
  'proxy.holder@forvismazars.com',
  '$2b$12$HASH_HERE',
  'Robert',
  'Proxy',
  'employee',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);

-- User 3 - For voting testing
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role,
  OrganizationID, IsActive, IsEmailVerified,
  CreatedAt, LastLogin
) VALUES (
  'voter1@forvismazars.com',
  '$2b$12$HASH_HERE',
  'Emily',
  'Voter',
  'user',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);

-- User 4 - For voting testing
INSERT INTO Users (
  Email, PasswordHash, FirstName, LastName, Role,
  OrganizationID, IsActive, IsEmailVerified,
  CreatedAt, LastLogin
) VALUES (
  'voter2@forvismazars.com',
  '$2b$12$HASH_HERE',
  'David',
  'Smith',
  'user',
  1,
  1,
  1,
  GETDATE(),
  GETDATE()
);
