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

async function setupVoterData() {
  const pool = await sql.connect(config);
  
  try {
    console.log('🔗 Connected to database\n');
    
    // Get voter user ID
    const userResult = await pool.request()
      .query("SELECT UserID FROM Users WHERE Email = 'voter@forvismazars.com'");
    
    if (userResult.recordset.length === 0) {
      console.log('❌ Voter user not found');
      return;
    }
    
    const voterId = userResult.recordset[0].UserID;
    console.log(`✅ Found voter user ID: ${voterId}\n`);
    
    // Check for active AGM session
    console.log('1️⃣ Checking for active AGM session...');
    const sessionResult = await pool.request()
      .query(`
        SELECT TOP 1 SessionID, Title, ScheduledStartTime, ScheduledEndTime, Status
        FROM AGMSessions 
        WHERE OrganizationID = 1 
        ORDER BY CreatedAt DESC
      `);
    
    let sessionId;
    if (sessionResult.recordset.length === 0) {
      console.log('   No session found. Creating one...');
      const createSession = await pool.request()
        .query(`
          INSERT INTO AGMSessions (
            OrganizationID, Title, Description, SessionType, 
            ScheduledStartTime, ScheduledEndTime, Status, CreatedBy
          )
          OUTPUT INSERTED.SessionID
          VALUES (
            1, 'Annual General Meeting 2026', 'Annual general meeting for voting',
            'AGM', DATEADD(hour, -1, GETDATE()), DATEADD(day, 7, GETDATE()),
            'Active', 1
          )
        `);
      sessionId = createSession.recordset[0].SessionID;
      console.log(`   ✅ Created session ID: ${sessionId}`);
    } else {
      sessionId = sessionResult.recordset[0].SessionID;
      console.log(`   ✅ Found session: ${sessionResult.recordset[0].Title} (ID: ${sessionId})`);
    }
    
    // Check for vote allocation
    console.log('\n2️⃣ Checking vote allocation...');
    const allocationResult = await pool.request()
      .input('userId', sql.Int, voterId)
      .input('sessionId', sql.Int, sessionId)
      .query(`
        SELECT * FROM VoteAllocations 
        WHERE UserID = @userId AND SessionID = @sessionId
      `);
    
    if (allocationResult.recordset.length === 0) {
      console.log('   No allocation found. Creating one...');
      await pool.request()
        .input('userId', sql.Int, voterId)
        .input('sessionId', sql.Int, sessionId)
        .query(`
          INSERT INTO VoteAllocations (
            UserID, SessionID, AllocatedVotes, Reason, BasedOn, SetBy
          )
          VALUES (@userId, @sessionId, 15, 'Standard allocation for employee', 'Membership', 1)
        `);
      console.log('   ✅ Created vote allocation: 15 votes');
    } else {
      const allocation = allocationResult.recordset[0];
      console.log(`   ✅ Found allocation: ${allocation.AllocatedVotes} votes`);
    }
    
    // Check for proxy assignments (people who gave their votes to this voter)
    console.log('\n3️⃣ Checking proxy assignments...');
    const proxyResult = await pool.request()
      .input('proxyUserId', sql.Int, voterId)
      .query(`
        SELECT pa.*, 
               u.FirstName + ' ' + u.LastName as PrincipalName,
               u.Email as PrincipalEmail
        FROM ProxyAssignments pa
        JOIN Users u ON pa.PrincipalUserID = u.UserID
        WHERE pa.ProxyUserID = @proxyUserId 
        AND pa.IsActive = 1
        AND (pa.EndDate IS NULL OR pa.EndDate > GETDATE())
      `);
    
    if (proxyResult.recordset.length === 0) {
      console.log('   No proxy assignments found. Creating sample proxies...');
      
      // Get 2 other users to assign their proxy to voter
      const otherUsers = await pool.request()
        .input('voterId', sql.Int, voterId)
        .query(`
          SELECT TOP 2 UserID, FirstName, LastName, Email 
          FROM Users 
          WHERE UserID != @voterId 
          AND Role IN ('Employee', 'admin')
          AND IsActive = 1
        `);
      
      if (otherUsers.recordset.length > 0) {
        for (const user of otherUsers.recordset) {
          await pool.request()
            .input('principalId', sql.Int, user.UserID)
            .input('proxyUserId', sql.Int, voterId)
            .input('sessionId', sql.Int, sessionId)
            .query(`
              INSERT INTO ProxyAssignments (
                SessionID, PrincipalUserID, ProxyUserID, ProxyType,
                StartDate, IsActive
              )
              VALUES (
                @sessionId, @principalId, @proxyUserId, 'DISCRETIONARY',
                GETDATE(), 1
              )
            `);
          console.log(`   ✅ Created proxy: ${user.FirstName} ${user.LastName} → John Voter`);
        }
      } else {
        console.log('   ⚠️ No other users found to create proxy assignments');
      }
    } else {
      console.log(`   ✅ Found ${proxyResult.recordset.length} proxy assignment(s):`);
      proxyResult.recordset.forEach(proxy => {
        console.log(`      - ${proxy.PrincipalName} (${proxy.ProxyType})`);
      });
    }
    
    console.log('\n========================================');
    console.log('✅ VOTER DATA SETUP COMPLETE');
    console.log('========================================');
    console.log(`User ID: ${voterId}`);
    console.log(`Session ID: ${sessionId}`);
    console.log('Vote allocations and proxy assignments created!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.close();
  }
}

setupVoterData()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
