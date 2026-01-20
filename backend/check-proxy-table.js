require('dotenv').config();
const sql = require('mssql');

async function checkProxyTable() {
  try {
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
    
    // Get column names from INFORMATION_SCHEMA
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ProxyAssignments'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📋 ProxyAssignments Table Structure:');
    console.log('='.repeat(60));
    columns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE}`);
    });
    
    // Get the proxy we just created
    const proxy = await pool.request().query(`SELECT TOP 1 * FROM ProxyAssignments WHERE ProxyID = 27`);
    
    console.log('\n✅ Proxy 27 Data:');
    console.log(JSON.stringify(proxy.recordset[0], null, 2));
    
    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProxyTable();
