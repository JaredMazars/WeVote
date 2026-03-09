/**
 * Fix cascade trigger: replace AFTER DELETE with INSTEAD OF DELETE.
 *
 * Why: NO ACTION FKs are checked BEFORE AFTER triggers fire, so SQL Server
 *      blocks the DELETE before our cleanup trigger can run.
 *      INSTEAD OF triggers fire BEFORE constraint checks, letting us delete
 *      child rows first and then explicitly delete from Users.
 *      When we do the explicit DELETE FROM Users inside the trigger, all
 *      CASCADE FKs (Attendance, AuditLog, etc.) fire automatically.
 */

const { getPool, executeQuery } = require('../src/config/database');

async function run() {
  await getPool();
  console.log('Connected.\n');

  const steps = [
    {
      name: 'Drop old AFTER trigger',
      sql: `IF OBJECT_ID('trg_Users_CascadeDelete', 'TR') IS NOT NULL
              DROP TRIGGER trg_Users_CascadeDelete`,
    },
    {
      name: 'Create INSTEAD OF DELETE trigger',
      sql: `
CREATE TRIGGER trg_Users_CascadeDelete
ON Users
INSTEAD OF DELETE
AS
BEGIN
  SET NOCOUNT ON;

  -- 1. Clear FK references that use NO ACTION (must be done BEFORE deleting Users)

  -- VoteAllocations.UserID  (NO ACTION FK)
  DELETE va
  FROM VoteAllocations va
  INNER JOIN deleted d ON va.UserID = d.UserID;

  -- Candidates.EmployeeID → Employees (Candidates uses NO ACTION on EmployeeID)
  -- Must NULL this before deleting Employees
  UPDATE Candidates
  SET EmployeeID = NULL
  WHERE EmployeeID IN (
    SELECT EmployeeID FROM Employees
    WHERE UserID IN (SELECT UserID FROM deleted)
  );

  -- Employees.UserID  (NO ACTION FK)
  DELETE e
  FROM Employees e
  INNER JOIN deleted d ON e.UserID = d.UserID;

  -- SessionAdmins.AssignedBy  (NO ACTION FK, nullable)
  UPDATE SessionAdmins
  SET AssignedBy = NULL
  WHERE AssignedBy IN (SELECT UserID FROM deleted);

  -- ProxyAssignments.ProxyUserID  (NO ACTION FK, nullable)
  UPDATE ProxyAssignments
  SET ProxyUserID = NULL
  WHERE ProxyUserID IN (SELECT UserID FROM deleted);

  -- 2. Now actually delete the Users rows.
  --    All CASCADE FKs (Attendance, AuditLog, CandidateVotes, Notifications,
  --    ProxyAssignments.PrincipalUserID, ResolutionVotes, SessionAdmins.UserID,
  --    SessionReports, SessionVoteLimits, UserVoteTracking, VoteHashes,
  --    VoteSplittingSettings, WhatsAppMessages) fire automatically here.
  --    SET NULL FKs (AGMSessions.CreatedBy, Candidates.NominatedBy,
  --    Departments.ManagerUserID, Employees.ApprovedBy, Resolutions.ProposedBy,
  --    VoteAllocations.SetBy) also fire automatically here.
  DELETE u
  FROM Users u
  INNER JOIN deleted d ON u.UserID = d.UserID;

END`,
    },
  ];

  let allOk = true;
  for (const step of steps) {
    try {
      await executeQuery(step.sql);
      console.log(`✅ ${step.name}`);
    } catch (err) {
      console.error(`❌ ${step.name}: ${err.message}`);
      allOk = false;
    }
  }

  console.log(allOk ? '\n🎉 Trigger replaced successfully.' : '\n⚠️  Some steps failed.');
  process.exit(allOk ? 0 : 1);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
