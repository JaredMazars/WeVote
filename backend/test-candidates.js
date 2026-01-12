// Test candidates API endpoint
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

async function testCandidates() {
  try {
    const pool = await sql.connect(config);
    
    // First check what columns exist
    const rawResult = await pool.request().query(`SELECT TOP 1 * FROM Candidates`);
    
    console.log('\n=== CANDIDATES TABLE COLUMNS ===');
    if (rawResult.recordset.length > 0) {
      const columns = Object.keys(rawResult.recordset[0]);
      console.log(columns.join(', '));
      console.log('\n=== FIRST CANDIDATE DATA ===');
      console.log(JSON.stringify(rawResult.recordset[0], null, 2));
    } else {
      console.log('❌ NO CANDIDATES FOUND IN DATABASE!');
    }
    
    // Now check count
    const countResult = await pool.request().query(`SELECT COUNT(*) as Total FROM Candidates`);
    console.log('\n=== TOTAL CANDIDATES ===');
    console.log('Count:', countResult.recordset[0].Total);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testCandidates();
