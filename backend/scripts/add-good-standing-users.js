// Migration: Add IsGoodStanding column to Users table
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

async function migrate() {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected.\n');

    // 1. IsGoodStanding on Users
    const colCheck = await pool.request().query(`
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsGoodStanding'
    `);
    if (colCheck.recordset[0].cnt === 0) {
      await pool.request().query(`
        ALTER TABLE Users ADD IsGoodStanding BIT NOT NULL DEFAULT 1
      `);
      console.log('✅  IsGoodStanding column added to Users');
    } else {
      console.log('ℹ️   IsGoodStanding already exists on Users');
    }

    // 2. GoodStandingNote on Users
    const noteCheck = await pool.request().query(`
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'GoodStandingNote'
    `);
    if (noteCheck.recordset[0].cnt === 0) {
      await pool.request().query(`
        ALTER TABLE Users ADD GoodStandingNote NVARCHAR(500) NULL
      `);
      console.log('✅  GoodStandingNote column added to Users');
    } else {
      console.log('ℹ️   GoodStandingNote already exists on Users');
    }

    // 3. Seed: mark all existing users as good standing
    await pool.request().query(`
      UPDATE Users SET IsGoodStanding = 1 WHERE IsGoodStanding IS NULL
    `);
    console.log('✅  All existing users seeded as good standing');

    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

migrate();
