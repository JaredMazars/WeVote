// Simple test to see actual table structure
require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function checkSchema() {
  try {
    const pool = await sql.connect(config);
    
    // Check Candidates table columns
    console.log('\n=== CANDIDATES TABLE STRUCTURE ===');
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Candidates'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columns:');
    cols.recordset.forEach(c => {
      console.log(`  - ${c.COLUMN_NAME} (${c.DATA_TYPE}) ${c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if any data exists
    const count = await pool.request().query('SELECT COUNT(*) as Total FROM Candidates');
    console.log(`\nTotal Candidates: ${count.recordset[0].Total}`);
    
    if (count.recordset[0].Total > 0) {
      // Get first row to see actual data
      const sample = await pool.request().query('SELECT TOP 1 * FROM Candidates');
      console.log('\n=== SAMPLE CANDIDATE ===');
      console.log(JSON.stringify(sample.recordset[0], null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
