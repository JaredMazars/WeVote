require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 30000
  }
};

async function seedProxyInstructions() {
  let pool;
  
  try {
    console.log('🌱 Seeding Proxy Instructions...\n');
    
    pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Get Robert Proxy's user ID
    const userResult = await pool.request()
      .input('email', sql.NVarChar, 'proxy.holder@forvismazars.com')
      .query('SELECT UserID, FirstName, LastName FROM Users WHERE Email = @email');
    
    if (userResult.recordset.length === 0) {
      console.log('❌ Robert Proxy user not found. Please seed users first.');
      return;
    }

    const robertUserId = userResult.recordset[0].UserID;
    console.log(`✅ Found Robert Proxy - UserID: ${robertUserId}\n`);

    // Get active AGM session
    const sessionResult = await pool.request()
      .query('SELECT TOP 1 SessionID, Title FROM AGMSessions WHERE Status = \'active\' ORDER BY SessionID DESC');
    
    if (sessionResult.recordset.length === 0) {
      console.log('❌ No active AGM session found. Creating one...');
      
      // Get a user to be the creator
      const creatorResult = await pool.request()
        .query('SELECT TOP 1 UserID FROM Users WHERE Role IN (\'super_admin\', \'admin\')');
      
      const creatorId = creatorResult.recordset[0].UserID;
      
      // Create an active session
      const createSessionResult = await pool.request()
        .input('creatorId', sql.Int, creatorId)
        .query(`
          INSERT INTO AGMSessions (
            OrganizationID, Title, Description, SessionType, 
            ScheduledStartTime, ScheduledEndTime, Status, CreatedBy, CreatedAt
          )
          VALUES (
            1, 'Annual General Meeting 2024', 'AGM for testing proxy instructions', 'Annual',
            GETDATE(), DATEADD(day, 1, GETDATE()), 'active', @creatorId, GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS SessionID;
        `);
      
      var newSessionId = createSessionResult.recordset[0].SessionID;
      console.log(`✅ Created active AGM session - SessionID: ${newSessionId}\n`);
    }

    const sessionId = sessionResult.recordset.length > 0 
      ? sessionResult.recordset[0].SessionID 
      : newSessionId;

    // Get some users who can be principals (users other than Robert)
    const principalsResult = await pool.request()
      .input('robertId', sql.Int, robertUserId)
      .query(`
        SELECT TOP 3 UserID, FirstName, LastName, Email 
        FROM Users 
        WHERE UserID != @robertId AND IsActive = 1 AND Email != 'super.admin@forvismazars.com'
        ORDER BY UserID
      `);

    if (principalsResult.recordset.length === 0) {
      console.log('❌ No other users found to create proxy assignments');
      return;
    }

    console.log(`✅ Found ${principalsResult.recordset.length} users to create proxy assignments\n`);

    // Get some candidates for instructions
    const candidatesResult = await pool.request()
      .query('SELECT TOP 3 CandidateID, Category FROM Candidates WHERE Status = \'active\'');

    // Get some resolutions for instructions
    const resolutionsResult = await pool.request()
      .query('SELECT TOP 2 ResolutionID, Title FROM Resolutions WHERE Status = \'active\'');

    console.log(`✅ Found ${candidatesResult.recordset.length} candidates and ${resolutionsResult.recordset.length} resolutions\n`);

    // Create instructional proxy assignments with instructions
    for (let i = 0; i < principalsResult.recordset.length; i++) {
      const principal = principalsResult.recordset[i];
      
      console.log(`\n📝 Creating instructional proxy for ${principal.FirstName} ${principal.LastName}...`);

      // Create proxy assignment
      const proxyResult = await pool.request()
        .input('principalId', sql.Int, principal.UserID)
        .input('proxyUserId', sql.Int, robertUserId)
        .input('sessionId', sql.Int, sessionId)
        .input('proxyType', sql.NVarChar, 'instructional')
        .input('startDate', sql.DateTime2, new Date())
        .input('endDate', sql.DateTime2, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days from now
        .query(`
          INSERT INTO ProxyAssignments (
            PrincipalUserID, ProxyUserID, SessionID, ProxyType, 
            StartDate, EndDate, IsActive, CreatedAt
          )
          VALUES (
            @principalId, @proxyUserId, @sessionId, @proxyType,
            @startDate, @endDate, 1, GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS ProxyID;
        `);

      const proxyId = proxyResult.recordset[0].ProxyID;
      console.log(`✅ Created ProxyAssignment ID: ${proxyId}`);

      // Add instructions for candidates
      let instructionCount = 0;
      for (let j = 0; j < Math.min(candidatesResult.recordset.length, 2); j++) {
        const candidate = candidatesResult.recordset[j];
        
        await pool.request()
          .input('proxyId', sql.Int, proxyId)
          .input('candidateId', sql.Int, candidate.CandidateID)
          .input('instructionType', sql.NVarChar, 'vote_for_candidate')
          .input('votesToAllocate', sql.Int, 1)
          .input('notes', sql.NVarChar, `Vote for Candidate ID ${candidate.CandidateID} - ${candidate.Category}`)
          .query(`
            INSERT INTO ProxyInstructions (
              ProxyID, CandidateID, InstructionType, VotesToAllocate, Notes, CreatedAt
            )
            VALUES (
              @proxyId, @candidateId, @instructionType, @votesToAllocate, @notes, GETDATE()
            )
          `);
        
        instructionCount++;
        console.log(`   ✅ Added candidate instruction: Candidate ${candidate.CandidateID} (${candidate.Category})`);
      }

      // Add instructions for resolutions
      for (let j = 0; j < Math.min(resolutionsResult.recordset.length, 1); j++) {
        const resolution = resolutionsResult.recordset[j];
        const voteType = j === 0 ? 'vote_yes' : 'vote_no';
        
        await pool.request()
          .input('proxyId', sql.Int, proxyId)
          .input('resolutionId', sql.Int, resolution.ResolutionID)
          .input('instructionType', sql.NVarChar, voteType)
          .input('votesToAllocate', sql.Int, 1)
          .input('notes', sql.NVarChar, `${voteType === 'vote_yes' ? 'Support' : 'Oppose'} ${resolution.Title}`)
          .query(`
            INSERT INTO ProxyInstructions (
              ProxyID, ResolutionID, InstructionType, VotesToAllocate, Notes, CreatedAt
            )
            VALUES (
              @proxyId, @resolutionId, @instructionType, @votesToAllocate, @notes, GETDATE()
            )
          `);
        
        instructionCount++;
        console.log(`   ✅ Added resolution instruction: ${voteType} for ${resolution.Title}`);
      }

      console.log(`✅ Total ${instructionCount} instructions created for this proxy`);
    }

    console.log('\n\n✅ PROXY INSTRUCTIONS SEEDED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  - Proxy Holder: Robert Proxy (${robertUserId})`);
    console.log(`  - Proxy Assignments: ${principalsResult.recordset.length}`);
    console.log(`  - AGM Session: ${sessionId}`);
    console.log('\nYou can now test the "View Instructions" button in the Admin Dashboard!\n');

  } catch (error) {
    console.error('❌ Error seeding proxy instructions:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seed function
seedProxyInstructions()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
