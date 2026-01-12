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

async function checkResolutions() {
  try {
    const pool = await sql.connect(config);
    
    console.log('=== RESOLUTIONS TABLE STRUCTURE ===\n');
    
    // Get table structure
    const schemaQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Resolutions'
      ORDER BY ORDINAL_POSITION
    `;
    const schema = await pool.request().query(schemaQuery);
    console.log('Columns:');
    schema.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Get count
    const countQuery = 'SELECT COUNT(*) as total FROM Resolutions';
    const count = await pool.request().query(countQuery);
    console.log(`\nTotal Resolutions: ${count.recordset[0].total}\n`);
    
    if (count.recordset[0].total > 0) {
      // Get sample data
      const sampleQuery = 'SELECT TOP 1 * FROM Resolutions';
      const sample = await pool.request().query(sampleQuery);
      console.log('=== SAMPLE RESOLUTION ===');
      console.log(JSON.stringify(sample.recordset[0], null, 2));
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkResolutions();
