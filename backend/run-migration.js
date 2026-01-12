const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || process.env.DB_ENCRYPT === 'yes',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'no' ? false : true,
    enableArithAbort: true,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000
  }
};

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await sql.connect(config);
    console.log('Connected successfully!');

    // Check if column already exists
    const checkResult = await sql.query`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'RequiresPasswordChange'
    `;

    if (checkResult.recordset.length > 0) {
      console.log('✓ RequiresPasswordChange column already exists');
    } else {
      console.log('Adding RequiresPasswordChange column...');
      
      // Add the column
      await sql.query`ALTER TABLE Users ADD RequiresPasswordChange BIT DEFAULT 0`;
      console.log('✓ Column added successfully');

      // Set default values for existing rows
      await sql.query`UPDATE Users SET RequiresPasswordChange = 0 WHERE RequiresPasswordChange IS NULL`;
      console.log('✓ Default values set');
    }

    await sql.close();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
