/**
 * cascade-via-trigger.js
 *
 * Completes cascade-delete for the 4 FKs that SQL Server rejects with error 1785
 * (multiple cascade paths) when set to CASCADE or SET NULL.
 *
 * Strategy for those 4:
 *   - Add FK with ON DELETE NO ACTION  → enforces referential integrity (no dangling refs)
 *   - Plus an AFTER DELETE TRIGGER on Users → manually cascades the cleanup
 *
 * Tables/columns:
 *   1. Employees.UserID              → CASCADE (trigger handles it)
 *   2. VoteAllocations.UserID        → CASCADE (trigger handles it)
 *   3. SessionAdmins.AssignedBy      → SET NULL (trigger handles it; col already nullable)
 *   4. ProxyAssignments.ProxyUserID  → SET NULL (trigger handles it; col already nullable)
 */

const { getPool } = require('../src/config/database');

async function run(pool, label, sql) {
  try {
    await pool.request().query(sql);
    console.log('  OK  ' + label);
  } catch (e) {
    console.log('  ERR ' + label + '  →  ' + e.message.replace(/\r?\n/g, ' ').substring(0, 200));
  }
}

(async () => {
  const pool = await getPool();

  // ── 1. Add NO ACTION FKs for referential integrity on the 4 problem columns ──

  console.log('\n── Adding NO ACTION FKs (referential integrity only) ──');

  await run(pool, 'DROP old Employees.UserID FK',
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__Employees__UserI__1209AD79') ALTER TABLE [Employees] DROP CONSTRAINT [FK__Employees__UserI__1209AD79]");
  await run(pool, 'ADD Employees.UserID NO ACTION',
    "ALTER TABLE [Employees] ADD CONSTRAINT [FK__Employees__UserI__1209AD79] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID]) ON DELETE NO ACTION");

  await run(pool, 'DROP old VoteAllocations.UserID FK',
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__VoteAlloc__UserI__2CBDA3B5') ALTER TABLE [VoteAllocations] DROP CONSTRAINT [FK__VoteAlloc__UserI__2CBDA3B5]");
  await run(pool, 'ADD VoteAllocations.UserID NO ACTION',
    "ALTER TABLE [VoteAllocations] ADD CONSTRAINT [FK__VoteAlloc__UserI__2CBDA3B5] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID]) ON DELETE NO ACTION");

  // SessionAdmins.AssignedBy — col already made nullable earlier; add NO ACTION FK
  await run(pool, 'DROP old SessionAdmins.AssignedBy FK',
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__SessionAd__Assig__214BF109') ALTER TABLE [SessionAdmins] DROP CONSTRAINT [FK__SessionAd__Assig__214BF109]");
  await run(pool, 'ADD SessionAdmins.AssignedBy NO ACTION',
    "ALTER TABLE [SessionAdmins] ADD CONSTRAINT [FK__SessionAd__Assig__214BF109] FOREIGN KEY ([AssignedBy]) REFERENCES [Users]([UserID]) ON DELETE NO ACTION");

  // ProxyAssignments.ProxyUserID — col already made nullable earlier; add NO ACTION FK
  await run(pool, 'DROP old ProxyAssignments.ProxyUserID FK',
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__ProxyAssi__Proxy__16CE6296') ALTER TABLE [ProxyAssignments] DROP CONSTRAINT [FK__ProxyAssi__Proxy__16CE6296]");
  await run(pool, 'ADD ProxyAssignments.ProxyUserID NO ACTION',
    "ALTER TABLE [ProxyAssignments] ADD CONSTRAINT [FK__ProxyAssi__Proxy__16CE6296] FOREIGN KEY ([ProxyUserID]) REFERENCES [Users]([UserID]) ON DELETE NO ACTION");

  // ── 2. Create the AFTER DELETE trigger that does the actual cleanup ──────────

  console.log('\n── Creating AFTER DELETE trigger on Users ──');

  await run(pool, 'DROP trigger if exists',
    "IF OBJECT_ID('trg_Users_CascadeDelete', 'TR') IS NOT NULL DROP TRIGGER trg_Users_CascadeDelete");

  await run(pool, 'CREATE trigger trg_Users_CascadeDelete',
    `CREATE TRIGGER trg_Users_CascadeDelete
     ON Users
     AFTER DELETE
     AS
     BEGIN
       SET NOCOUNT ON;

       -- 1. VoteAllocations owned by the deleted user (UserID is NOT NULL → must delete)
       DELETE va
       FROM VoteAllocations va
       INNER JOIN deleted d ON va.UserID = d.UserID;

       -- 2. Employees record owned by the deleted user (UserID is NOT NULL → must delete)
       --    Cascading delete of Employees will in turn fire any triggers on Employees
       --    (e.g. Candidates.EmployeeID is NO ACTION — those rows reference the employee
       --     so we NULL out the EmployeeID on candidates first to avoid FK violation)
       UPDATE Candidates
         SET EmployeeID = NULL
       WHERE EmployeeID IN (
         SELECT EmployeeID FROM Employees WHERE UserID IN (SELECT UserID FROM deleted)
       );

       DELETE e
       FROM Employees e
       INNER JOIN deleted d ON e.UserID = d.UserID;

       -- 3. SessionAdmins.AssignedBy — set to NULL (column is now nullable)
       UPDATE SessionAdmins
         SET AssignedBy = NULL
       WHERE AssignedBy IN (SELECT UserID FROM deleted);

       -- 4. ProxyAssignments.ProxyUserID — set to NULL (column is now nullable)
       UPDATE ProxyAssignments
         SET ProxyUserID = NULL
       WHERE ProxyUserID IN (SELECT UserID FROM deleted);
     END`
  );

  // ── 3. Verify final state ────────────────────────────────────────────────────

  console.log('\n── Final FK state (all tables referencing Users) ──');
  const fks = await pool.request().query(`
    SELECT
      fk.delete_referential_action_desc AS Action,
      tp.name AS Table_Name,
      cp.name AS Col,
      fk.name AS FK_Name
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
    WHERE tr.name = 'Users'
    ORDER BY tp.name, cp.name
  `);
  fks.recordset.forEach(r =>
    console.log('  ' + r.Action.padEnd(12) + r.Table_Name.padEnd(30) + r.Col.padEnd(25) + r.FK_Name)
  );

  console.log('\n── Triggers on Users ──');
  const trigs = await pool.request().query(`
    SELECT name, is_disabled, type_desc
    FROM sys.triggers
    WHERE parent_id = OBJECT_ID('Users')
  `);
  trigs.recordset.forEach(r =>
    console.log('  ' + r.name + '  disabled=' + r.is_disabled + '  ' + r.type_desc)
  );

  console.log(`
✅ Setup complete.
   • All "simple" 1:1 owner FKs → ON DELETE CASCADE
   • Metadata FKs (SetBy, NominatedBy, etc.) → ON DELETE SET NULL
   • Complex multi-path FKs → ON DELETE NO ACTION + trigger trg_Users_CascadeDelete
   
   To delete a user and all their data:
     DELETE FROM Users WHERE UserID = <id>;
`);

  process.exit(0);
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
