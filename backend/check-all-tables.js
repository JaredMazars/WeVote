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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function checkAllTables() {
  try {
    const pool = await sql.connect(config);
    
    const tables = [
      'ProxyAssignments',
      'ProxyInstructions',
      'UserVoteTracking',
      'VoteStatistics',
      'CandidateVotes',
      'ResolutionVotes',
      'SessionReports',
      'AuditLog',
      'VoteAllocations'
    ];
    
    for (const tableName of tables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`=== ${tableName.toUpperCase()} ===`);
      console.log('='.repeat(60));
      
      // Check if table exists
      const existsQuery = `
        SELECT COUNT(*) as TableExists
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = '${tableName}'
      `;
      const exists = await pool.request().query(existsQuery);
      
      if (exists.recordset[0].TableExists === 0) {
        console.log(`❌ Table does not exist!`);
        continue;
      }
      
      // Get table structure
      const schemaQuery = `
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `;
      const schema = await pool.request().query(schemaQuery);
      console.log('\nColumns:');
      schema.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Get count
      const countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
      const count = await pool.request().query(countQuery);
      console.log(`\nTotal Records: ${count.recordset[0].total}`);
      
      if (count.recordset[0].total > 0) {
        // Get sample data
        const sampleQuery = `SELECT TOP 1 * FROM ${tableName}`;
        const sample = await pool.request().query(sampleQuery);
        console.log('\nSample Record:');
        console.log(JSON.stringify(sample.recordset[0], null, 2));
      }
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllTables();
