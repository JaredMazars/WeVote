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

async function addTestData() {
  try {
    console.log('Connecting to database...');
    await sql.connect(config);
    console.log('Connected successfully\n');

    // Use default session ID
    const sessionId = 1;

    console.log('=== CREATING PENDING USER REGISTRATIONS ===\n');

    // Create 5 pending user registrations
    const pendingUsers = [
      {
        email: 'james.wilson.pending@forvismazars.com',
        firstName: 'James',
        lastName: 'Wilson',
        phone: '+27 11 555 1001'
      },
      {
        email: 'sarah.martinez.pending@forvismazars.com',
        firstName: 'Sarah',
        lastName: 'Martinez',
        phone: '+27 11 555 1002'
      },
      {
        email: 'michael.brown.pending@forvismazars.com',
        firstName: 'Michael',
        lastName: 'Brown',
        phone: '+27 11 555 1003'
      },
      {
        email: 'emily.davis.pending@forvismazars.com',
        firstName: 'Emily',
        lastName: 'Davis',
        phone: '+27 11 555 1004'
      },
      {
        email: 'david.taylor.pending@forvismazars.com',
        firstName: 'David',
        lastName: 'Taylor',
        phone: '+27 11 555 1005'
      }
    ];

    for (const user of pendingUsers) {
      // Check if user already exists
      const existingUser = await sql.query`SELECT UserID FROM Users WHERE Email = ${user.email}`;
      
      if (existingUser.recordset.length > 0) {
        console.log(`⚠️  User already exists: ${user.firstName} ${user.lastName}`);
        continue;
      }

      // Create user account with inactive status (pending approval)
      await sql.query`
        INSERT INTO Users (
          OrganizationID, Email, PasswordHash, Salt,
          FirstName, LastName, PhoneNumber, Role, IsActive,
          IsEmailVerified, RequiresPasswordChange,
          CreatedAt, UpdatedAt
        )
        VALUES (
          1,
          ${user.email},
          '$2b$10$pendingPasswordHashPlaceholder',
          'pendingSalt',
          ${user.firstName},
          ${user.lastName},
          ${user.phone},
          'voter',
          0,
          0,
          1,
          GETDATE(),
          GETDATE()
        )
      `;

      console.log(`✓ Created pending user: ${user.firstName} ${user.lastName}`);
    }

    console.log('\n=== CREATING PENDING PROXY ASSIGNMENTS ===\n');

    // Get some existing users to use as proxy holders and assignees
    const existingUsers = await sql.query`
      SELECT TOP 10 UserID, FirstName, LastName, Email 
      FROM Users 
      WHERE IsActive = 1 AND Role = 'voter'
      ORDER BY UserID
    `;

    if (existingUsers.recordset.length >= 4) {
      const users = existingUsers.recordset.map(u => ({
        UserID: u.UserID,
        Name: `${u.FirstName} ${u.LastName}`,
        Email: u.Email
      }));

      // Create 4 pending proxy assignments
      const proxyAssignments = [
        {
          principalId: users[0].UserID,
          principalName: users[0].Name,
          proxyUserId: users[1].UserID,
          proxyUserName: users[1].Name,
          type: 'discretionary'
        },
        {
          principalId: users[2].UserID,
          principalName: users[2].Name,
          proxyUserId: users[3].UserID,
          proxyUserName: users[3].Name,
          type: 'instructional'
        },
        {
          principalId: users[1].UserID,
          principalName: users[1].Name,
          proxyUserId: users[0].UserID,
          proxyUserName: users[0].Name,
          type: 'discretionary'
        },
        {
          principalId: users[3].UserID,
          principalName: users[3].Name,
          proxyUserId: users[2].UserID,
          proxyUserName: users[2].Name,
          type: 'instructional'
        }
      ];

      for (const proxy of proxyAssignments) {
        await sql.query`
          INSERT INTO ProxyAssignments (
            SessionID, PrincipalUserID, ProxyUserID,
            ProxyType, IsActive, StartDate,
            CreatedAt, UpdatedAt
          )
          VALUES (
            ${sessionId},
            ${proxy.principalId},
            ${proxy.proxyUserId},
            ${proxy.type},
            0,
            DATEADD(DAY, 7, GETDATE()),
            GETDATE(),
            GETDATE()
          )
        `;

        console.log(`✓ Created pending proxy: ${proxy.principalName} → ${proxy.proxyUserName} (${proxy.type})`);
      }
    } else {
      console.log('⚠️  Not enough active users to create proxy assignments');
    }

    console.log('\n=== SUMMARY ===\n');

    // Count pending users (IsActive = 0)
    const pendingUserCount = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsActive = 0`;
    console.log(`Pending Users: ${pendingUserCount.recordset[0].count}`);

    // Count approved users (IsActive = 1)
    const approvedUserCount = await sql.query`SELECT COUNT(*) as count FROM Users WHERE IsActive = 1`;
    console.log(`Approved Users: ${approvedUserCount.recordset[0].count}`);

    // Count pending proxies (IsActive = 0)
    const pendingProxyCount = await sql.query`SELECT COUNT(*) as count FROM ProxyAssignments WHERE IsActive = 0`;
    console.log(`Pending Proxies: ${pendingProxyCount.recordset[0].count}`);

    // Count approved proxies (IsActive = 1)
    const approvedProxyCount = await sql.query`SELECT COUNT(*) as count FROM ProxyAssignments WHERE IsActive = 1`;
    console.log(`Approved Proxies: ${approvedProxyCount.recordset[0].count}`);

    console.log('\n✅ Test data created successfully!');
    console.log('\n💡 To remove this test data later, run: node remove-approval-test-data.js');

    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addTestData();
