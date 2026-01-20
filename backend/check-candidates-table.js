require('dotenv').config();
const sql = require('mssql');

async function checkCandidatesTable() {
  const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
  
  const pool = await sql.connect(config);
  
  const columns = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Candidates'
    ORDER BY ORDINAL_POSITION
  `);
  
  console.log('\n📋 Candidates Table Structure:');
  console.log('='.repeat(70));
  columns.recordset.forEach(col => {
    console.log(`${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE}`);
  });
  
  // Get sample candidate
  const sample = await pool.request().query(`SELECT TOP 1 * FROM Candidates`);
  console.log('\n✅ Sample Candidate:');
  console.log(JSON.stringify(sample.recordset[0], null, 2));
  
  await pool.close();
}

checkCandidatesTable().catch(console.error);
