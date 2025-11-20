import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function testProxyData() {
  let pool;
  try {
    console.log('🔍 Connecting to database...\n');
    pool = await sql.connect(config);
    
    // Check what tables exist
    console.log('🔍 Checking existing tables...\n');
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_NAME LIKE '%proxy%'
      ORDER BY TABLE_NAME
    `);
    console.log('Proxy-related tables found:');
    console.log(JSON.stringify(tablesResult.recordset, null, 2));
    console.log('\n');
    
    // Check ALL tables
    const allTablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    console.log(`Total tables in database: ${allTablesResult.recordset.length}`);
    console.log(JSON.stringify(allTablesResult.recordset.map(t => t.TABLE_NAME), null, 2));
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    if (pool) await pool.close();
    process.exit(1);
  }
}

testProxyData();
