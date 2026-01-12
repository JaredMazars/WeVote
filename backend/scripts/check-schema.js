// Check database schema columns
require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || process.env.DB_ENCRYPT === 'yes',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes',
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

async function checkSchema() {
  let pool;
  
  try {
    pool = await sql.connect(config);
    
    const tables = ['Employees', 'Departments', 'Organizations', 'AGMSessions'];
    
    for (const table of tables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TABLE: ${table}`);
      console.log('='.repeat(60));
      
      const result = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${table}'
        ORDER BY ORDINAL_POSITION
      `);
      
      if (result.recordset.length > 0) {
        result.recordset.forEach(col => {
          const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
          const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
          console.log(`  ${col.COLUMN_NAME.padEnd(35)} ${col.DATA_TYPE}${length} ${nullable}`);
        });
      } else {
        console.log(`  ⚠️  Table not found`);
      }
    }
    
    console.log(`\n${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkSchema();
