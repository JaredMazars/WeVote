const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: { encrypt: true, trustServerCertificate: true }
};

(async () => {
  try {
    console.log('\n=== WEVOTE SYSTEM READINESS CHECK ===\n');
    
    await sql.connect(config);
    
    // Check users
    const users = await sql.query`
      SELECT COUNT(*) as count FROM Users WHERE IsActive = 1
    `;
    console.log(`✓ Active Users: ${users.recordset[0].count}`);
    
    // Check admins
    const admins = await sql.query`
      SELECT Email, Role FROM Users 
      WHERE Role IN ('admin', 'super_admin', 'auditor') 
      AND IsActive = 1
    `;
    console.log(`✓ Admin Accounts: ${admins.recordset.length}`);
    admins.recordset.forEach(a => console.log(`  - ${a.Email} (${a.Role})`));
    
    // Check AGM Sessions
    const sessions = await sql.query`
      SELECT SessionID, Title, ScheduledStartTime, Status 
      FROM AGMSessions 
      ORDER BY CreatedAt DESC
    `;
    console.log(`\n✓ AGM Sessions: ${sessions.recordset.length}`);
    if (sessions.recordset.length > 0) {
      sessions.recordset.slice(0, 3).forEach(s => {
        console.log(`  - ID ${s.SessionID}: ${s.Title} (${s.Status})`);
      });
    } else {
      console.log('  ⚠️  No AGM sessions found - need to create one for voting');
    }
    
    // Check Candidates
    const candidates = await sql.query`
      SELECT CandidateID, c.SessionID, emp.Position, u.FirstName, u.LastName, 
             d.Name as Department, c.Status
      FROM Candidates c
      LEFT JOIN Employees emp ON c.EmployeeID = emp.EmployeeID
      LEFT JOIN Users u ON emp.UserID = u.UserID
      LEFT JOIN Departments d ON emp.DepartmentID = d.DepartmentID
      WHERE c.Status = 'active'
    `;
    console.log(`\n✓ Active Candidates: ${candidates.recordset.length}`);
    if (candidates.recordset.length > 0) {
      candidates.recordset.slice(0, 5).forEach(c => {
        console.log(`  - ${c.FirstName} ${c.LastName} - ${c.Position} (${c.Department || 'No Dept'})`);
      });
    } else {
      console.log('  ⚠️  No candidates found - need to create candidates for voting');
    }
    
    // Check Resolutions
    const resolutions = await sql.query`
      SELECT ResolutionID, Title, Status FROM Resolutions
    `;
    console.log(`\n✓ Resolutions: ${resolutions.recordset.length}`);
    if (resolutions.recordset.length > 0) {
      resolutions.recordset.slice(0, 3).forEach(r => {
        console.log(`  - ${r.Title} (${r.Status})`);
      });
    } else {
      console.log('  ⚠️  No resolutions found - need to create resolutions for voting');
    }
    
    // Check Votes
    const candidateVotes = await sql.query`
      SELECT COUNT(*) as count FROM CandidateVotes
    `;
    const resolutionVotes = await sql.query`
      SELECT COUNT(*) as count FROM ResolutionVotes
    `;
    const totalVotes = candidateVotes.recordset[0].count + resolutionVotes.recordset[0].count;
    console.log(`\n✓ Total Votes Cast: ${totalVotes} (${candidateVotes.recordset[0].count} candidate, ${resolutionVotes.recordset[0].count} resolution)`);
    
    // Check Proxy Assignments
    const proxies = await sql.query`
      SELECT COUNT(*) as count FROM ProxyAssignments WHERE IsActive = 1
    `;
    console.log(`✓ Active Proxy Assignments: ${proxies.recordset[0].count}`);
    
    // Check Vote Allocations
    const allocations = await sql.query`
      SELECT AllocationID, UserID, SessionID, AllocatedVotes
      FROM VoteAllocations
      ORDER BY CreatedAt DESC
    `;
    console.log(`\n✓ Vote Allocations: ${allocations.recordset.length}`);
    if (allocations.recordset.length > 0) {
      allocations.recordset.slice(0, 3).forEach(a => {
        console.log(`  - User ${a.UserID} in Session ${a.SessionID}: ${a.AllocatedVotes} votes`);
      });
    } else {
      console.log('  ⚠️  No vote allocations - users may not be able to vote');
    }
    
    console.log('\n=== SYSTEM STATUS ===');
    const ready = sessions.recordset.length > 0 && 
                  candidates.recordset.length > 0 && 
                  allocations.recordset.length > 0;
    
    if (ready) {
      console.log('✅ System is ready for testing!\n');
    } else {
      console.log('⚠️  System needs setup:');
      if (sessions.recordset.length === 0) console.log('  - Create AGM Session');
      if (candidates.recordset.length === 0) console.log('  - Add Candidates');
      if (allocations.recordset.length === 0) console.log('  - Allocate votes to users');
      console.log('');
    }
    
    await sql.close();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
