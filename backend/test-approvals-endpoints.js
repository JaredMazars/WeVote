const sql = require('mssql');
const config = require('./src/config/database');

async function testApprovals() {
  try {
    console.log('\n=== Testing Approvals Endpoints Data ===\n');
    
    const pool = await sql.connect(config);
    
    // Test pending users (what /api/users/pending/registrations should return)
    console.log('1. Pending User Registrations:');
    const pendingUsers = await pool.request().query`
      SELECT UserID, FirstName, LastName, Email, PhoneNumber, IsActive, RequiresPasswordChange
      FROM Users
      WHERE IsActive = 0 AND RequiresPasswordChange = 1
    `;
    console.log(`Found ${pendingUsers.recordset.length} pending users:`);
    pendingUsers.recordset.forEach(u => {
      console.log(`  - ${u.FirstName} ${u.LastName} (${u.Email}) - UserID: ${u.UserID}`);
    });
    
    // Test pending proxies (what /api/proxy/pending/assignments should return)
    console.log('\n2. Pending Proxy Assignments:');
    const pendingProxies = await pool.request().query`
      SELECT 
        pa.ProxyID,
        pa.PrincipalUserID,
        pa.ProxyUserID,
        grantor.FirstName + ' ' + grantor.LastName as GrantorName,
        proxy.FirstName + ' ' + proxy.LastName as ProxyName,
        pa.IsActive
      FROM ProxyAssignments pa
      LEFT JOIN Users grantor ON pa.PrincipalUserID = grantor.UserID
      LEFT JOIN Users proxy ON pa.ProxyUserID = proxy.UserID
      WHERE pa.IsActive = 0
    `;
    console.log(`Found ${pendingProxies.recordset.length} pending proxies:`);
    pendingProxies.recordset.forEach(p => {
      console.log(`  - ${p.GrantorName} → ${p.ProxyName} (ProxyID: ${p.ProxyID})`);
    });
    
    // Show all users for reference
    console.log('\n3. All Users Summary:');
    const allUsers = await pool.request().query`
      SELECT IsActive, COUNT(*) as Count
      FROM Users
      GROUP BY IsActive
    `;
    allUsers.recordset.forEach(r => {
      console.log(`  - IsActive=${r.IsActive}: ${r.Count} users`);
    });
    
    // Show all proxies for reference
    console.log('\n4. All Proxy Assignments Summary:');
    const allProxies = await pool.request().query`
      SELECT IsActive, COUNT(*) as Count
      FROM ProxyAssignments
      GROUP BY IsActive
    `;
    allProxies.recordset.forEach(r => {
      console.log(`  - IsActive=${r.IsActive}: ${r.Count} proxies`);
    });
    
    await pool.close();
    console.log('\n✅ Test complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testApprovals();
