-- Check if proxy file columns exist in users table
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'users'
    AND COLUMN_NAME IN ('proxy_file_path', 'proxy_file_name', 'proxy_uploaded_at')
ORDER BY 
    COLUMN_NAME;

-- If columns don't exist, run this:
-- ALTER TABLE users ADD proxy_file_path VARCHAR(500) NULL;
-- ALTER TABLE users ADD proxy_file_name VARCHAR(255) NULL;
-- ALTER TABLE users ADD proxy_uploaded_at DATETIME NULL;
