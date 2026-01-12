const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000
  }
};

async function verifyResolutions() {
  try {
    console.log('Connecting to database...');
    await sql.connect(config);
    console.log('Connected successfully\n');

    const result = await sql.query`
      SELECT ResolutionID, Title, Category, Description, Status
      FROM Resolutions 
      WHERE SessionID = 1
      ORDER BY ResolutionID
    `;

    console.log('=== CURRENT RESOLUTIONS IN DATABASE ===\n');
    result.recordset.forEach((r, i) => {
      console.log(`${i + 1}. ${r.Title}`);
      console.log(`   ID: ${r.ResolutionID}`);
      console.log(`   Category: ${r.Category}`);
      console.log(`   Status: ${r.Status}`);
      console.log(`   Description: ${r.Description}`);
      console.log('');
    });

    console.log(`Total: ${result.recordset.length} resolutions`);

    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyResolutions();
