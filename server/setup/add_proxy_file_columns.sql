-- Add proxy file upload columns to users table
-- Run this script to enable manual proxy PDF upload feature

-- Add proxy_method column (digital or manual)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'proxy_method'
)
BEGIN
    ALTER TABLE users ADD proxy_method NVARCHAR(20) NULL DEFAULT 'digital';
    PRINT 'Added proxy_method column to users table';
END
ELSE
BEGIN
    PRINT 'proxy_method column already exists';
END

-- Add proxy_file_path column (stores file location)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'proxy_file_path'
)
BEGIN
    ALTER TABLE users ADD proxy_file_path NVARCHAR(500) NULL;
    PRINT 'Added proxy_file_path column to users table';
END
ELSE
BEGIN
    PRINT 'proxy_file_path column already exists';
END

-- Add proxy_file_name column (stores original filename)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'proxy_file_name'
)
BEGIN
    ALTER TABLE users ADD proxy_file_name NVARCHAR(255) NULL;
    PRINT 'Added proxy_file_name column to users table';
END
ELSE
BEGIN
    PRINT 'proxy_file_name column already exists';
END

-- Add proxy_uploaded_at column (tracks when file was uploaded)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'proxy_uploaded_at'
)
BEGIN
    ALTER TABLE users ADD proxy_uploaded_at DATETIME NULL;
    PRINT 'Added proxy_uploaded_at column to users table';
END
ELSE
BEGIN
    PRINT 'proxy_uploaded_at column already exists';
END

PRINT 'Proxy file upload columns setup complete!';
