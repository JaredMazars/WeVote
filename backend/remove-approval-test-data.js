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

async function removeTestData() {
  try {
    console.log('Connecting to database...');
    await sql.connect(config);
    console.log('Connected successfully\n');

    console.log('=== REMOVING TEST DATA ===\n');

    // Remove pending proxy assignments (IsActive = 0)
    const deleteProxies = await sql.query`DELETE FROM ProxyAssignments WHERE IsActive = 0`;
    console.log(`✓ Deleted ${deleteProxies.rowsAffected[0]} pending proxy assignments`);

    // Remove pending users and their employees (IsActive = 0 means pending)
    const pendingUsers = await sql.query`SELECT UserID, Email FROM Users WHERE IsActive = 0 AND RequiresPasswordChange = 1`;
    
    for (const user of pendingUsers.recordset) {
      // Delete user (no employee records to delete since we're not creating them)
      await sql.query`DELETE FROM Users WHERE UserID = ${user.UserID}`;
      
      console.log(`✓ Deleted user: ${user.Email}`);
    }

    console.log(`\n✓ Removed ${pendingUsers.recordset.length} pending users`);
    console.log('\n✅ Test data removed successfully!');

    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

removeTestData();
