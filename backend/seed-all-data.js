const sql = require('mssql');

const config = {
  user: 'admin1',
  password: 'wevote123$',
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function seedAllData() {
  try {
    const pool = await sql.connect(config);
    
    console.log('=== SEEDING DATABASE ===\n');
    
    // =====================================================
    // 1. PROXY ASSIGNMENTS
    // =====================================================
    console.log('1. Seeding ProxyAssignments...');
    
    // User 2 (Admin) assigns proxy to User 3 (Regular) for Session 1
    // User 4 (Superadmin) assigns proxy to User 5 (Staff) for Session 1
    // User 6 assigns proxy to User 2 for Session 1
    
    const proxyAssignments = [
      {
        SessionID: 1,
        PrincipalUserID: 2, // Admin User
        ProxyUserID: 3,     // Regular User votes on their behalf
        ProxyType: 'discretionary',
        StartDate: '2024-11-01',
        EndDate: '2024-12-31',
        IsActive: 1
      },
      {
        SessionID: 1,
        PrincipalUserID: 4, // Super Administrator
        ProxyUserID: 5,     // Staff Member votes on their behalf
        ProxyType: 'instructional',
        StartDate: '2024-11-01',
        EndDate: '2024-12-31',
        IsActive: 1
      },
      {
        SessionID: 1,
        PrincipalUserID: 6, // Employee User
        ProxyUserID: 2,     // Admin User votes on their behalf
        ProxyType: 'discretionary',
        StartDate: '2024-11-01',
        EndDate: '2024-12-31',
        IsActive: 1
      }
    ];
    
    for (const proxy of proxyAssignments) {
      await pool.request()
        .input('SessionID', sql.Int, proxy.SessionID)
        .input('PrincipalUserID', sql.Int, proxy.PrincipalUserID)
        .input('ProxyUserID', sql.Int, proxy.ProxyUserID)
        .input('ProxyType', sql.NVarChar, proxy.ProxyType)
        .input('StartDate', sql.DateTime2, proxy.StartDate)
        .input('EndDate', sql.DateTime2, proxy.EndDate)
        .input('IsActive', sql.Bit, proxy.IsActive)
        .query(`
          INSERT INTO ProxyAssignments 
          (SessionID, PrincipalUserID, ProxyUserID, ProxyType, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt)
          VALUES 
          (@SessionID, @PrincipalUserID, @ProxyUserID, @ProxyType, @StartDate, @EndDate, @IsActive, GETDATE(), GETDATE())
        `);
    }
    console.log(`   ✅ Added ${proxyAssignments.length} proxy assignments`);
    
    // =====================================================
    // 2. PROXY INSTRUCTIONS
    // =====================================================
    console.log('\n2. Seeding ProxyInstructions...');
    
    // Get ProxyID for instructional proxy (ProxyID 2 - User 4 -> User 5)
    const proxyResult = await pool.request().query(`
      SELECT ProxyID FROM ProxyAssignments 
      WHERE PrincipalUserID = 4 AND ProxyUserID = 5 AND ProxyType = 'instructional'
    `);
    
    if (proxyResult.recordset.length > 0) {
      const instructionalProxyID = proxyResult.recordset[0].ProxyID;
      
      const proxyInstructions = [
        {
          ProxyID: instructionalProxyID,
          CandidateID: 1,
          ResolutionID: null,
          InstructionType: 'support',
          VotesToAllocate: 1,
          Notes: 'Vote for Super Administrator - excellent leadership'
        },
        {
          ProxyID: instructionalProxyID,
          CandidateID: 2,
          ResolutionID: null,
          InstructionType: 'support',
          VotesToAllocate: 1,
          Notes: 'Vote for Admin User - great team player'
        },
        {
          ProxyID: instructionalProxyID,
          CandidateID: null,
          ResolutionID: 1,
          InstructionType: 'yes',
          VotesToAllocate: 1,
          Notes: 'Support remote work policy extension'
        },
        {
          ProxyID: instructionalProxyID,
          CandidateID: null,
          ResolutionID: 2,
          InstructionType: 'no',
          VotesToAllocate: 1,
          Notes: 'Against sustainability initiative budget'
        }
      ];
      
      for (const instruction of proxyInstructions) {
        await pool.request()
          .input('ProxyID', sql.Int, instruction.ProxyID)
          .input('CandidateID', sql.Int, instruction.CandidateID)
          .input('ResolutionID', sql.Int, instruction.ResolutionID)
          .input('InstructionType', sql.NVarChar, instruction.InstructionType)
          .input('VotesToAllocate', sql.Int, instruction.VotesToAllocate)
          .input('Notes', sql.NVarChar, instruction.Notes)
          .query(`
            INSERT INTO ProxyInstructions 
            (ProxyID, CandidateID, ResolutionID, InstructionType, VotesToAllocate, Notes, CreatedAt)
            VALUES 
            (@ProxyID, @CandidateID, @ResolutionID, @InstructionType, @VotesToAllocate, @Notes, GETDATE())
          `);
      }
      console.log(`   ✅ Added ${proxyInstructions.length} proxy instructions`);
    }
    
    // =====================================================
    // 3. USER VOTE TRACKING
    // =====================================================
    console.log('\n3. Seeding UserVoteTracking...');
    
    // Track which users have voted
    const voteTracking = [
      {
        SessionID: 1,
        UserID: 2,
        TotalVotesUsed: 2,
        TotalVotesAvailable: 5,
        LastVotedAt: '2024-12-08 10:35:00'
      },
      {
        SessionID: 1,
        UserID: 3,
        TotalVotesUsed: 3,
        TotalVotesAvailable: 5,
        LastVotedAt: '2024-12-08 11:05:00'
      },
      {
        SessionID: 1,
        UserID: 5,
        TotalVotesUsed: 1,
        TotalVotesAvailable: 5,
        LastVotedAt: '2024-12-08 09:45:00'
      }
    ];
    
    for (const track of voteTracking) {
      await pool.request()
        .input('SessionID', sql.Int, track.SessionID)
        .input('UserID', sql.Int, track.UserID)
        .input('TotalVotesUsed', sql.Int, track.TotalVotesUsed)
        .input('TotalVotesAvailable', sql.Int, track.TotalVotesAvailable)
        .input('LastVotedAt', sql.DateTime2, track.LastVotedAt)
        .query(`
          INSERT INTO UserVoteTracking 
          (SessionID, UserID, TotalVotesUsed, TotalVotesAvailable, LastVotedAt)
          VALUES 
          (@SessionID, @UserID, @TotalVotesUsed, @TotalVotesAvailable, @LastVotedAt)
        `);
    }
    console.log(`   ✅ Added ${voteTracking.length} vote tracking records`);
    
    // =====================================================
    // 4. VOTE STATISTICS
    // =====================================================
    console.log('\n4. Seeding VoteStatistics...');
    
    const voteStats = [
      {
        SessionID: 1,
        TotalRegisteredVoters: 12,
        TotalVotesCast: 13,
        VoterTurnoutPercentage: 41.67,
        ProxyVotesCount: 0,
        DirectVotesCount: 13,
        TotalCandidates: 8,
        TotalResolutions: 5
      }
    ];
    
    for (const stat of voteStats) {
      await pool.request()
        .input('SessionID', sql.Int, stat.SessionID)
        .input('TotalRegisteredVoters', sql.Int, stat.TotalRegisteredVoters)
        .input('TotalVotesCast', sql.Int, stat.TotalVotesCast)
        .input('VoterTurnoutPercentage', sql.Decimal(5,2), stat.VoterTurnoutPercentage)
        .input('ProxyVotesCount', sql.Int, stat.ProxyVotesCount)
        .input('DirectVotesCount', sql.Int, stat.DirectVotesCount)
        .input('TotalCandidates', sql.Int, stat.TotalCandidates)
        .input('TotalResolutions', sql.Int, stat.TotalResolutions)
        .query(`
          INSERT INTO VoteStatistics 
          (SessionID, TotalRegisteredVoters, TotalVotesCast, VoterTurnoutPercentage, ProxyVotesCount, DirectVotesCount, TotalCandidates, TotalResolutions, UpdatedAt)
          VALUES 
          (@SessionID, @TotalRegisteredVoters, @TotalVotesCast, @VoterTurnoutPercentage, @ProxyVotesCount, @DirectVotesCount, @TotalCandidates, @TotalResolutions, GETDATE())
        `);
    }
    console.log(`   ✅ Added ${voteStats.length} vote statistics records`);
    
    // =====================================================
    // 5. SESSION REPORTS
    // =====================================================
    console.log('\n5. Seeding SessionReports...');
    
    const sessionReports = [
      {
        SessionID: 1,
        ReportType: 'Candidate Results',
        GeneratedBy: 2,
        ReportData: JSON.stringify({
          totalCandidates: 8,
          totalVotes: 5,
          topCandidate: 'Super Administrator',
          categories: ['Employee of the Year', 'Best Team Player', 'Innovation Award']
        })
      },
      {
        SessionID: 1,
        ReportType: 'Resolution Results',
        GeneratedBy: 2,
        ReportData: JSON.stringify({
          totalResolutions: 5,
          passed: 3,
          failed: 1,
          pending: 1
        })
      },
      {
        SessionID: 1,
        ReportType: 'Participation Summary',
        GeneratedBy: 2,
        ReportData: JSON.stringify({
          eligibleVoters: 12,
          actualVoters: 5,
          participationRate: 41.67,
          proxyVotes: 0
        })
      }
    ];
    
    for (const report of sessionReports) {
      await pool.request()
        .input('SessionID', sql.Int, report.SessionID)
        .input('ReportType', sql.NVarChar, report.ReportType)
        .input('GeneratedBy', sql.Int, report.GeneratedBy)
        .input('ReportData', sql.NVarChar(sql.MAX), report.ReportData)
        .query(`
          INSERT INTO SessionReports 
          (SessionID, ReportType, ReportData, GeneratedBy, GeneratedAt)
          VALUES 
          (@SessionID, @ReportType, @ReportData, @GeneratedBy, GETDATE())
        `);
    }
    console.log(`   ✅ Added ${sessionReports.length} session reports`);
    
    // =====================================================
    // 6. AUDIT LOGS
    // =====================================================
    console.log('\n6. Seeding AuditLogs...');
    
    const auditLogs = [
      {
        UserID: 2,
        Action: 'USER_LOGIN',
        EntityType: 'User',
        EntityID: 2,
        Details: 'Admin User logged in successfully',
        IPAddress: '192.168.1.100',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 2,
        Action: 'PROXY_ASSIGNED',
        EntityType: 'ProxyAssignment',
        EntityID: 1,
        Details: 'Admin User assigned proxy to Regular User for Session 1',
        IPAddress: '192.168.1.100',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 3,
        Action: 'VOTE_CAST',
        EntityType: 'CandidateVote',
        EntityID: 1,
        Details: 'Regular User voted for candidate ID 1',
        IPAddress: '192.168.1.105',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 3,
        Action: 'VOTE_CAST',
        EntityType: 'ResolutionVote',
        EntityID: 1,
        Details: 'Regular User voted YES on resolution ID 1',
        IPAddress: '192.168.1.105',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 2,
        Action: 'CANDIDATE_CREATED',
        EntityType: 'Candidate',
        EntityID: 1,
        Details: 'Admin User created new candidate: Super Administrator',
        IPAddress: '192.168.1.100',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 2,
        Action: 'RESOLUTION_CREATED',
        EntityType: 'Resolution',
        EntityID: 1,
        Details: 'Admin User created resolution: Remote Work Policy Extension',
        IPAddress: '192.168.1.100',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 5,
        Action: 'VOTE_CAST',
        EntityType: 'CandidateVote',
        EntityID: 2,
        Details: 'Staff Member voted for candidate ID 2',
        IPAddress: '192.168.1.110',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 2,
        Action: 'REPORT_GENERATED',
        EntityType: 'SessionReport',
        EntityID: 1,
        Details: 'Admin User generated Candidate Results report for Session 1',
        IPAddress: '192.168.1.100',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 4,
        Action: 'PROXY_ASSIGNED',
        EntityType: 'ProxyAssignment',
        EntityID: 2,
        Details: 'Super Administrator assigned instructional proxy to Staff Member',
        IPAddress: '192.168.1.101',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        UserID: 2,
        Action: 'SESSION_UPDATED',
        EntityType: 'AGMSession',
        EntityID: 1,
        Details: 'Admin User updated session status to active',
        IPAddress: '192.168.1.100',
        UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    ];
    
    for (const log of auditLogs) {
      await pool.request()
        .input('UserID', sql.Int, log.UserID)
        .input('Action', sql.NVarChar, log.Action)
        .input('EntityType', sql.NVarChar, log.EntityType)
        .input('EntityID', sql.Int, log.EntityID)
        .input('Details', sql.NVarChar, log.Details)
        .input('IPAddress', sql.NVarChar, log.IPAddress)
        .input('UserAgent', sql.NVarChar, log.UserAgent)
        .query(`
          INSERT INTO AuditLog 
          (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
          VALUES 
          (@UserID, @Action, @EntityType, @EntityID, @Details, @IPAddress, @UserAgent, GETDATE())
        `);
    }
    console.log(`   ✅ Added ${auditLogs.length} audit log entries`);
    
    // =====================================================
    // VERIFICATION
    // =====================================================
    console.log('\n=== VERIFICATION ===\n');
    
    const tables = [
      'ProxyAssignments',
      'ProxyInstructions',
      'UserVoteTracking',
      'VoteStatistics',
      'SessionReports',
      'AuditLog'
    ];
    
    for (const table of tables) {
      const result = await pool.request().query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result.recordset[0].count} records`);
    }
    
    console.log('\n✅ ALL SEED DATA INSERTED SUCCESSFULLY!\n');
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedAllData();
