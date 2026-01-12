const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function testAPIs() {
  try {
    await sql.connect(config);
    
    // Test 1: Resolutions
    console.log('\n📋 TEST 1: RESOLUTIONS API');
    console.log('='.repeat(80));
    const resolutions = await sql.query`
      SELECT ResolutionID, Title, Description, Category, Status,
             TotalYesVotes, TotalNoVotes, TotalAbstainVotes, CreatedAt
      FROM Resolutions
      ORDER BY ResolutionID
    `;
    console.log(`Found ${resolutions.recordset.length} resolutions`);
    resolutions.recordset.forEach(r => {
      console.log(`  ID: ${r.ResolutionID}, Title: "${r.Title}", Status: ${r.Status}`);
    });
    
    // Test 2: Proxy Assignments
    console.log('\n🤝 TEST 2: PROXY ASSIGNMENTS API');
    console.log('='.repeat(80));
    const proxies = await sql.query`
      SELECT 
        pa.ProxyID,
        pa.PrincipalUserID,
        principal.FirstName AS PrincipalFirstName,
        principal.LastName AS PrincipalLastName,
        pa.ProxyUserID,
        proxy.FirstName AS ProxyFirstName,
        proxy.LastName AS ProxyLastName,
        pa.ProxyType,
        pa.IsActive
      FROM ProxyAssignments pa
      LEFT JOIN Users principal ON pa.PrincipalUserID = principal.UserID
      LEFT JOIN Users proxy ON pa.ProxyUserID = proxy.UserID
      WHERE pa.IsActive = 1
      ORDER BY pa.ProxyID
    `;
    console.log(`Found ${proxies.recordset.length} active proxy assignments`);
    proxies.recordset.forEach(p => {
      console.log(`  ProxyID: ${p.ProxyID}`);
      console.log(`    Principal: ${p.PrincipalFirstName} ${p.PrincipalLastName} (UserID: ${p.PrincipalUserID})`);
      console.log(`    Proxy: ${p.ProxyFirstName} ${p.ProxyLastName} (UserID: ${p.ProxyUserID})`);
      console.log(`    Type: ${p.ProxyType}`);
    });
    
    // Test 3: Check what the API route actually returns
    console.log('\n🔍 TEST 3: PROXY ROUTE QUERY STRUCTURE');
    console.log('='.repeat(80));
    const proxyRouteQuery = await sql.query`
      SELECT 
        pa.ProxyID,
        pa.SessionID,
        pa.PrincipalUserID,
        grantor.FirstName AS GrantorFirstName,
        grantor.LastName AS GrantorLastName,
        pa.ProxyUserID,
        proxy.FirstName AS ProxyFirstName,
        proxy.LastName AS ProxyLastName,
        pa.ProxyType,
        pa.StartDate,
        pa.EndDate,
        pa.IsActive,
        pa.CreatedAt,
        s.Title AS SessionTitle,
        COUNT(pi.InstructionID) as InstructionCount
      FROM ProxyAssignments pa
      LEFT JOIN Users grantor ON pa.PrincipalUserID = grantor.UserID
      LEFT JOIN Users proxy ON pa.ProxyUserID = proxy.UserID
      LEFT JOIN AGMSessions s ON pa.SessionID = s.SessionID
      LEFT JOIN ProxyInstructions pi ON pa.ProxyID = pi.ProxyID
      WHERE pa.IsActive = 1
      GROUP BY pa.ProxyID, pa.SessionID, pa.PrincipalUserID, 
               grantor.FirstName, grantor.LastName, pa.ProxyUserID,
               proxy.FirstName, proxy.LastName, pa.ProxyType,
               pa.StartDate, pa.EndDate, pa.IsActive, pa.CreatedAt,
               s.Title
      ORDER BY pa.ProxyID
    `;
    console.log(`Proxy route would return ${proxyRouteQuery.recordset.length} records`);
    console.log('\nFirst record structure:');
    if (proxyRouteQuery.recordset.length > 0) {
      console.log(JSON.stringify(proxyRouteQuery.recordset[0], null, 2));
    }
    
    await sql.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testAPIs();
