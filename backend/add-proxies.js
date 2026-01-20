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

async function checkAndAddProxies() {
  try {
    await sql.connect(config);
    
    // Get active users
    const activeUsers = await sql.query`
      SELECT TOP 10 UserID, FirstName, LastName, Email, Role 
      FROM Users 
      WHERE IsActive = 1
      ORDER BY UserID
    `;
    
    console.log(`Found ${activeUsers.recordset.length} active users`);
    activeUsers.recordset.forEach((u, i) => {
      console.log(`  ${i+1}. UserID ${u.UserID}: ${u.FirstName} ${u.LastName} (${u.Role})`);
    });
    
    if (activeUsers.recordset.length >= 4) {
      console.log('\n=== CREATING PENDING PROXY ASSIGNMENTS ===\n');
      
      const users = activeUsers.recordset;
      const sessionId = 1;
      
      // Create 4 pending proxy assignments
      const proxyPairs = [
        [0, 1], // User 0 assigns to User 1
        [2, 3], // User 2 assigns to User 3
        [1, 0], // User 1 assigns to User 0
        [3, 2]  // User 3 assigns to User 2
      ];
      
      for (const [principalIdx, proxyIdx] of proxyPairs) {
        const principal = users[principalIdx];
        const proxy = users[proxyIdx];
        
        await sql.query`
          INSERT INTO ProxyAssignments (
            SessionID, PrincipalUserID, ProxyUserID,
            ProxyType, IsActive, StartDate,
            CreatedAt, UpdatedAt
          )
          VALUES (
            ${sessionId},
            ${principal.UserID},
            ${proxy.UserID},
            'discretionary',
            0,
            DATEADD(DAY, 7, GETDATE()),
            GETDATE(),
            GETDATE()
          )
        `;
        
        console.log(`✓ ${principal.FirstName} ${principal.LastName} → ${proxy.FirstName} ${proxy.LastName}`);
      }
      
      console.log('\n✅ Created 4 pending proxy assignments!');
    }
    
    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAndAddProxies();
