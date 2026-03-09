// Full cascade delete integration test
const { executeQuery, getPool } = require('../src/config/database');

(async () => {
  const pool = await getPool();
  console.log('\n═══════════════════════════════════════════');
  console.log(' Cascade Delete Integration Test');
  console.log('═══════════════════════════════════════════\n');

  // Clean up any leftover test user from a previous failed run
  await executeQuery("DELETE FROM Users WHERE Email = 'cascade_test_DELETE_ME@test.com'");

  // ── 1. Create a test user ─────────────────────────────────────────────────
  const userRes = await executeQuery(`
    INSERT INTO Users (FirstName, LastName, Email, PasswordHash, Salt, Role, OrganizationID, IsActive, IsEmailVerified, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.UserID
    VALUES ('Test', 'CascadeUser', 'cascade_test_DELETE_ME@test.com', 'x', 'testsalt', 'voter', 1, 1, 1, GETDATE(), GETDATE())
  `);
  const userId = userRes.recordset[0].UserID;
  console.log(`✅ Created test user  UserID=${userId}`);

  // ── 2. Create Employee linked to user ─────────────────────────────────────
  const empRes = await executeQuery(`
    INSERT INTO Employees (UserID, OrganizationID, IsGoodStanding, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.EmployeeID
    VALUES (${userId}, 1, 1, GETDATE(), GETDATE())
  `);
  const empId = empRes.recordset[0].EmployeeID;
  console.log(`✅ Created employee   EmployeeID=${empId}`);

  // ── 3. Get an active session ──────────────────────────────────────────────
  const sessRes = await executeQuery(`SELECT TOP 1 SessionID FROM AGMSessions ORDER BY SessionID`);
  const sessionId = sessRes.recordset[0]?.SessionID || 1;

  // ── 4. Add VoteAllocation ─────────────────────────────────────────────────
  const vaRes = await executeQuery(`
    INSERT INTO VoteAllocations (UserID, SessionID, AllocatedVotes, CreatedAt)
    OUTPUT INSERTED.AllocationID
    VALUES (${userId}, ${sessionId}, 2, GETDATE())
  `);
  const allocId = vaRes.recordset[0].AllocationID;
  console.log(`✅ Created VoteAlloc  AllocationID=${allocId}`);

  // ── 5. Add AuditLog entry ─────────────────────────────────────────────────
  const auditRes = await executeQuery(`
    INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
    OUTPUT INSERTED.LogID
    VALUES (${userId}, 'TEST_ACTION', 'Test', 1, 'cascade test', 'system', 'test', GETDATE())
  `);
  const auditId = auditRes.recordset[0].LogID;
  console.log(`✅ Created AuditLog   LogID=${auditId}`);

  // ── 6. Add SessionAdmins.AssignedBy reference ─────────────────────────────
  // Find an existing SessionAdmin row and set AssignedBy to our test user
  const saRes = await executeQuery(`SELECT TOP 1 SessionAdminID FROM SessionAdmins`);
  let saId = null;
  if (saRes.recordset.length > 0) {
    saId = saRes.recordset[0].SessionAdminID;
    await executeQuery(`UPDATE SessionAdmins SET AssignedBy = ${userId} WHERE SessionAdminID = ${saId}`);
    console.log(`✅ Set SessionAdmins.AssignedBy = ${userId} (AdminID=${saId})`);
  } else {
    console.log('⚠️  No SessionAdmins rows to test AssignedBy — skip');
  }

  // ── 7. Snapshot what exists ───────────────────────────────────────────────
  console.log('\n── Before DELETE ──');
  const before = await executeQuery(`
    SELECT 
      (SELECT COUNT(*) FROM Employees WHERE UserID = ${userId}) AS Employees,
      (SELECT COUNT(*) FROM VoteAllocations WHERE UserID = ${userId}) AS VoteAllocations,
      (SELECT COUNT(*) FROM AuditLog WHERE UserID = ${userId}) AS AuditLog,
      (SELECT COUNT(*) FROM SessionAdmins WHERE AssignedBy = ${userId}) AS SessionAdmins_AssignedBy
  `);
  const b = before.recordset[0];
  console.log(`  Employees:              ${b.Employees}`);
  console.log(`  VoteAllocations:        ${b.VoteAllocations}`);
  console.log(`  AuditLog:               ${b.AuditLog}`);
  console.log(`  SessionAdmins.AssignedBy: ${b.SessionAdmins_AssignedBy}`);

  // ── 8. DELETE the user ────────────────────────────────────────────────────
  console.log(`\n── DELETE FROM Users WHERE UserID = ${userId} ──`);
  await executeQuery(`DELETE FROM Users WHERE UserID = ${userId}`);
  console.log('  Delete executed.');

  // ── 9. Snapshot what remains ──────────────────────────────────────────────
  console.log('\n── After DELETE ──');
  const after = await executeQuery(`
    SELECT 
      (SELECT COUNT(*) FROM Users WHERE UserID = ${userId}) AS Users,
      (SELECT COUNT(*) FROM Employees WHERE UserID = ${userId}) AS Employees,
      (SELECT COUNT(*) FROM VoteAllocations WHERE UserID = ${userId}) AS VoteAllocations,
      (SELECT COUNT(*) FROM AuditLog WHERE UserID = ${userId}) AS AuditLog,
      (SELECT COUNT(*) FROM SessionAdmins WHERE AssignedBy = ${userId}) AS SessionAdmins_AssignedBy
  `);
  const a = after.recordset[0];

  const check = (label, val, expected) => {
    const ok = val === expected;
    console.log(`  ${ok ? '✅' : '❌'} ${label.padEnd(35)} ${val} (expected ${expected})`);
    return ok;
  };

  let allPassed = true;
  allPassed &= check('Users row deleted',              a.Users,              0);
  allPassed &= check('Employees cascade deleted',      a.Employees,          0);
  allPassed &= check('VoteAllocations cascade deleted',a.VoteAllocations,    0);
  allPassed &= check('AuditLog cascade deleted',       a.AuditLog,           0);
  allPassed &= check('SessionAdmins.AssignedBy NULLed',a.SessionAdmins_AssignedBy, 0);

  console.log('\n' + '═'.repeat(43));
  console.log(allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED');
  console.log('═'.repeat(43));

  process.exit(allPassed ? 0 : 1);
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
