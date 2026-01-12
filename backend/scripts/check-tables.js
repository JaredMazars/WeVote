const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function checkTables() {
  const pool = await sql.connect(config);
  
  try {
    const tables = ['AGMSessions', 'VoteAllocations', 'ProxyAssignments'];
    
    for (const table of tables) {
      console.log(`\n=== ${table} ===`);
      const result = await pool.request()
        .query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' ORDER BY ORDINAL_POSITION`);
      console.log('Columns:', result.recordset.map(r => r.COLUMN_NAME).join(', '));
    }
    
  } finally {
    await pool.close();
  }
}

checkTables().then(() => process.exit(0)).catch(err => {console.error(err); process.exit(1);});
