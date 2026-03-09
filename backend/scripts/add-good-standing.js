// =====================================================
// Migration: Add IsGoodStanding + GoodStandingNote to Employees
// and seed existing approved employees as in good standing
// Run: node backend/scripts/add-good-standing.js
// =====================================================

require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes' ||
      process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

(async () => {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected.\n');

    // 1. Add IsGoodStanding column (skip if already exists)
    console.log('Adding IsGoodStanding column...');
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'IsGoodStanding'
      )
      ALTER TABLE Employees ADD IsGoodStanding BIT NOT NULL DEFAULT 1
    `);
    console.log('✅ IsGoodStanding column ready');

    // 2. Add GoodStandingNote column
    console.log('Adding GoodStandingNote column...');
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'GoodStandingNote'
      )
      ALTER TABLE Employees ADD GoodStandingNote NVARCHAR(500) NULL
    `);
    console.log('✅ GoodStandingNote column ready');

    // 3. Add GoodStandingUpdatedAt column
    console.log('Adding GoodStandingUpdatedAt column...');
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'GoodStandingUpdatedAt'
      )
      ALTER TABLE Employees ADD GoodStandingUpdatedAt DATETIME NULL
    `);
    console.log('✅ GoodStandingUpdatedAt column ready');

    // 4. Set all existing approved employees to good standing by default
    const result = await pool.request().query(`
      UPDATE Employees
      SET IsGoodStanding = 1,
          GoodStandingUpdatedAt = GETDATE()
      WHERE IsApproved = 1
      AND IsGoodStanding IS NULL OR IsGoodStanding = 0
    `);
    console.log(`✅ Set ${result.rowsAffected[0]} existing approved employees as in good standing`);

    // 5. Add 'voter' as a valid role for future use
    console.log('\n✅ Migration complete!');
    console.log('\nRole hierarchy:');
    console.log('  user     = basic account (no employee record) → CANNOT vote');
    console.log('  employee = has employee record → CAN vote IF IsApproved=1 AND IsGoodStanding=1');
    console.log('  voter    = explicitly confirmed voter → CAN vote (standing implicit)');
    console.log('  admin    = org admin');
    console.log('  auditor  = read-only');
    console.log('  super_admin = full system access');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
})();
