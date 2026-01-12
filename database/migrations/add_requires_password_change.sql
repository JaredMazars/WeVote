-- Add RequiresPasswordChange column to Users table
-- This tracks if user needs to change password on first login

ALTER TABLE Users
ADD RequiresPasswordChange BIT DEFAULT 0;

-- Update the column to be NOT NULL with default
ALTER TABLE Users
ALTER COLUMN RequiresPasswordChange BIT NOT NULL;

-- Set default value for existing rows
UPDATE Users
SET RequiresPasswordChange = 0
WHERE RequiresPasswordChange IS NULL;

PRINT 'Successfully added RequiresPasswordChange column to Users table';
