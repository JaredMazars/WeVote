const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

async function createProxyGroupsWithInstructions() {
  try {
    console.log('🤝 CREATING COMPREHENSIVE PROXY GROUPS\n');
    console.log('='.repeat(80));
    
    await sql.connect(config);
    
    // Clear existing test proxies (keep only the first 6 from seed data)
    console.log('\n🧹 Cleaning up test proxies...');
    await sql.query`DELETE FROM ProxyInstructions WHERE ProxyID > 6`;
    await sql.query`DELETE FROM ProxyAssignments WHERE ProxyID > 6`;
    
    // Get available users and candidates
    const users = await sql.query`SELECT TOP 10 UserID, FirstName + ' ' + LastName as Name FROM Users WHERE IsActive = 1`;
    const candidates = await sql.query`SELECT TOP 8 CandidateID FROM Candidates WHERE Status = 'active'`;
    const resolutions = await sql.query`SELECT TOP 5 ResolutionID FROM Resolutions WHERE Status = 'active'`;
    
    console.log(`✅ Found ${users.recordset.length} users, ${candidates.recordset.length} candidates, ${resolutions.recordset.length} resolutions`);
    
    // **PROXY GROUP 1: Pure Discretionary (No Instructions)**
    console.log('\n📋 1. Creating DISCRETIONARY proxy (no instructions)...');
    const proxy1 = await sql.query`
      INSERT INTO ProxyAssignments (SessionID, PrincipalUserID, ProxyUserID, ProxyType, StartDate, EndDate, IsActive)
      OUTPUT INSERTED.ProxyID
      VALUES (1, ${users.recordset[0].UserID}, ${users.recordset[1].UserID}, 'discretionary', GETDATE(), '2025-12-31', 1)
    `;
    console.log(`   ✅ Proxy ID ${proxy1.recordset[0].ProxyID}: ${users.recordset[0].Name} → ${users.recordset[1].Name}`);
    console.log(`      Type: DISCRETIONARY (proxy votes at their own discretion)`);
    
    // **PROXY GROUP 2: Pure Instructional (All Instructions)**
    console.log('\n📋 2. Creating INSTRUCTIONAL proxy (all instructions)...');
    const proxy2 = await sql.query`
      INSERT INTO ProxyAssignments (SessionID, PrincipalUserID, ProxyUserID, ProxyType, StartDate, EndDate, IsActive)
      OUTPUT INSERTED.ProxyID
      VALUES (1, ${users.recordset[2].UserID}, ${users.recordset[3].UserID}, 'instructional', GETDATE(), '2025-12-31', 1)
    `;
    const proxy2Id = proxy2.recordset[0].ProxyID;
    console.log(`   ✅ Proxy ID ${proxy2Id}: ${users.recordset[2].Name} → ${users.recordset[3].Name}`);
    console.log(`      Type: INSTRUCTIONAL (must follow specific instructions)`);
    
    // Add instructions for proxy 2 - Candidate votes
    await sql.query`
      INSERT INTO ProxyInstructions (ProxyID, CandidateID, InstructionType, VotesToAllocate, Notes)
      VALUES 
        (${proxy2Id}, ${candidates.recordset[0].CandidateID}, 'allocate', 10, 'Strong performer this year'),
        (${proxy2Id}, ${candidates.recordset[1].CandidateID}, 'allocate', 5, 'Consistent contributor')
    `;
    console.log(`      ✅ Added 2 candidate instructions (allocate 10 and 5 votes)`);
    
    // Add instructions for proxy 2 - Resolution votes
    await sql.query`
      INSERT INTO ProxyInstructions (ProxyID, ResolutionID, InstructionType, Notes)
      VALUES 
        (${proxy2Id}, ${resolutions.recordset[0].ResolutionID}, 'vote_yes', 'Strongly support this initiative'),
        (${proxy2Id}, ${resolutions.recordset[1].ResolutionID}, 'vote_no', 'Do not support at this time')
    `;
    console.log(`      ✅ Added 2 resolution instructions (YES and NO votes)`);
    
    // **PROXY GROUP 3: Mixed (Discretionary with SOME instructions)**
    console.log('\n📋 3. Creating MIXED proxy (discretionary + some instructions)...');
    const proxy3 = await sql.query`
      INSERT INTO ProxyAssignments (SessionID, PrincipalUserID, ProxyUserID, ProxyType, StartDate, EndDate, IsActive)
      OUTPUT INSERTED.ProxyID
      VALUES (1, ${users.recordset[4].UserID}, ${users.recordset[5].UserID}, 'discretionary', GETDATE(), '2025-12-31', 1)
    `;
    const proxy3Id = proxy3.recordset[0].ProxyID;
    console.log(`   ✅ Proxy ID ${proxy3Id}: ${users.recordset[4].Name} → ${users.recordset[5].Name}`);
    console.log(`      Type: DISCRETIONARY with partial instructions`);
    
    // Add SOME instructions (leaving some discretion)
    await sql.query`
      INSERT INTO ProxyInstructions (ProxyID, CandidateID, InstructionType, VotesToAllocate, Notes)
      VALUES 
        (${proxy3Id}, ${candidates.recordset[2].CandidateID}, 'allocate', 7, 'Preferred candidate')
    `;
    console.log(`      ✅ Added 1 candidate instruction (rest is discretionary)`);
    
    await sql.query`
      INSERT INTO ProxyInstructions (ProxyID, ResolutionID, InstructionType, Notes)
      VALUES 
        (${proxy3Id}, ${resolutions.recordset[2].ResolutionID}, 'vote_yes', 'Important for company growth')
    `;
    console.log(`      ✅ Added 1 resolution instruction (rest is discretionary)`);
    
    // **PROXY GROUP 4: Instructional with Abstain**
    console.log('\n📋 4. Creating INSTRUCTIONAL proxy (with abstain votes)...');
    const proxy4 = await sql.query`
      INSERT INTO ProxyAssignments (SessionID, PrincipalUserID, ProxyUserID, ProxyType, StartDate, EndDate, IsActive)
      OUTPUT INSERTED.ProxyID
      VALUES (1, ${users.recordset[6].UserID}, ${users.recordset[7].UserID}, 'instructional', GETDATE(), '2025-12-31', 1)
    `;
    const proxy4Id = proxy4.recordset[0].ProxyID;
    console.log(`   ✅ Proxy ID ${proxy4Id}: ${users.recordset[6].Name} → ${users.recordset[7].Name}`);
    console.log(`      Type: INSTRUCTIONAL (including abstain votes)`);
    
    await sql.query`
      INSERT INTO ProxyInstructions (ProxyID, ResolutionID, InstructionType, Notes)
      VALUES 
        (${proxy4Id}, ${resolutions.recordset[3].ResolutionID}, 'abstain', 'Conflict of interest - remain neutral'),
        (${proxy4Id}, ${resolutions.recordset[4].ResolutionID}, 'vote_yes', 'Full support')
    `;
    console.log(`      ✅ Added 2 resolution instructions (ABSTAIN and YES)`);
    
    // **PROXY GROUP 5: Multiple candidates from same principal**
    console.log('\n📋 5. Creating INSTRUCTIONAL proxy (multiple candidates)...');
    const proxy5 = await sql.query`
      INSERT INTO ProxyAssignments (SessionID, PrincipalUserID, ProxyUserID, ProxyType, StartDate, EndDate, IsActive)
      OUTPUT INSERTED.ProxyID
      VALUES (1, ${users.recordset[8].UserID}, ${users.recordset[1].UserID}, 'instructional', GETDATE(), '2025-12-31', 1)
    `;
    const proxy5Id = proxy5.recordset[0].ProxyID;
    console.log(`   ✅ Proxy ID ${proxy5Id}: ${users.recordset[8].Name} → ${users.recordset[1].Name}`);
    console.log(`      Type: INSTRUCTIONAL (spread votes across candidates)`);
    
    await sql.query`
      INSERT INTO ProxyInstructions (ProxyID, CandidateID, InstructionType, VotesToAllocate, Notes)
      VALUES 
        (${proxy5Id}, ${candidates.recordset[3].CandidateID}, 'allocate', 8, 'Top performer'),
        (${proxy5Id}, ${candidates.recordset[4].CandidateID}, 'allocate', 6, 'Second choice'),
        (${proxy5Id}, ${candidates.recordset[5].CandidateID}, 'allocate', 4, 'Third choice')
    `;
    console.log(`      ✅ Added 3 candidate instructions (8, 6, 4 votes distributed)`);
    
    // Log audit entries for each proxy
    console.log('\n📝 Creating audit log entries...');
    for (let i = 0; i < 5; i++) {
      await sql.query`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (
          2,
          'PROXY_CREATED',
          'ProxyAssignment',
          ${proxy1.recordset[0].ProxyID + i},
          'Created new proxy assignment via admin dashboard',
          '127.0.0.1',
          'WeVote Admin Dashboard',
          GETDATE()
        )
      `;
    }
    console.log(`   ✅ Added 5 audit log entries for proxy creation`);
    
    // Verify final counts
    console.log('\n📊 VERIFICATION');
    console.log('-'.repeat(80));
    
    const proxyCount = await sql.query`SELECT COUNT(*) as count FROM ProxyAssignments WHERE IsActive = 1`;
    console.log(`✅ Total Active Proxy Assignments: ${proxyCount.recordset[0].count}`);
    
    const instructionCount = await sql.query`SELECT COUNT(*) as count FROM ProxyInstructions`;
    console.log(`✅ Total Proxy Instructions: ${instructionCount.recordset[0].count}`);
    
    const auditCount = await sql.query`SELECT COUNT(*) as count FROM AuditLog`;
    console.log(`✅ Total Audit Log Entries: ${auditCount.recordset[0].count}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ PROXY GROUPS CREATED SUCCESSFULLY!\n');
    
    console.log('Summary:');
    console.log('  1. Pure Discretionary - No instructions');
    console.log('  2. Pure Instructional - Full candidate & resolution instructions');
    console.log('  3. Mixed - Discretionary with partial instructions');
    console.log('  4. Instructional - Including abstain votes');
    console.log('  5. Instructional - Multiple candidates with vote distribution');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sql.close();
  }
}

createProxyGroupsWithInstructions();
