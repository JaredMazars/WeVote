require('dotenv').config();
const sql = require('mssql');

async function checkProxyInstructions() {
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
    WHERE TABLE_NAME = 'ProxyInstructions'
    ORDER BY ORDINAL_POSITION
  `);
  
  console.log('\n📋 ProxyInstructions Table Structure:');
  console.log('='.repeat(60));
  columns.recordset.forEach(col => {
    console.log(`${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE}`);
  });
  
  await pool.close();
}

checkProxyInstructions().catch(console.error);
