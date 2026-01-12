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

async function checkSchema() {
  const pool = await sql.connect(config);
  
  console.log('\n=== USERS TABLE ===');
  let result = await pool.request().query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' 
    ORDER BY ORDINAL_POSITION
  `);
  console.log('Columns:', result.recordset.map(r => r.COLUMN_NAME).join(', '));
  
  console.log('\n=== EMPLOYEES TABLE ===');
  result = await pool.request().query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Employees' 
    ORDER BY ORDINAL_POSITION
  `);
  console.log('Columns:', result.recordset.map(r => r.COLUMN_NAME).join(', '));
  
  await pool.close();
  process.exit(0);
}

checkSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
