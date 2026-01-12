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

async function checkSchema() {
  try {
    const pool = await sql.connect(config);
    
    const tables = ['ProxyInstructions', 'UserVoteTracking', 'VoteStatistics', 'SessionReports', 'AuditLog'];
    
    for (const table of tables) {
      console.log(`\n=== ${table} SCHEMA ===`);
      const result = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${table}'
        ORDER BY ORDINAL_POSITION
      `);
      result.recordset.forEach(col => {
        console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
