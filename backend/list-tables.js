const sql = require('mssql');

const config = {
  user: 'admin1',
  password: 'wevote123$',
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function listTables() {
  try {
    const pool = await sql.connect(config);
    
    const query = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      ORDER BY TABLE_NAME
    `;
    
    const result = await pool.request().query(query);
    
    console.log('=== ALL TABLES IN DATABASE ===\n');
    result.recordset.forEach(t => {
      console.log(`  - ${t.TABLE_NAME}`);
    });
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listTables();
