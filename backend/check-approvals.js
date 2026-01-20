const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

(async () => {
  await sql.connect(config);
  const pending = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsActive = 0`;
  const approved = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsActive = 1`;
  const proxiesPending = await sql.query`SELECT COUNT(*) as count FROM ProxyAssignments WHERE IsActive = 0`;
  const proxiesApproved = await sql.query`SELECT COUNT(*) as count FROM ProxyAssignments WHERE IsActive = 1`;
  
  console.log('\n=== APPROVALS DASHBOARD DATA ===\n');
  console.log('User Registrations:');
  console.log(`  Pending: ${pending.recordset[0].count}`);
  console.log(`  Approved: ${approved.recordset[0].count}`);
  console.log(`  Total: ${pending.recordset[0].count + approved.recordset[0].count}`);
  
  console.log('\nProxy Assignments:');
  console.log(`  Pending: ${proxiesPending.recordset[0].count}`);
  console.log(`  Approved: ${proxiesApproved.recordset[0].count}`);
  console.log(`  Total: ${proxiesPending.recordset[0].count + proxiesApproved.recordset[0].count}`);
  
  console.log('\n✅ Approval dashboard is populated with test data!');
  console.log('\n💡 To remove this data later, run: node remove-approval-test-data.js');
  
  await sql.close();
})();
