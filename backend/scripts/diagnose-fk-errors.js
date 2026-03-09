// Run each SQL statement alone to expose the true underlying error
const { getPool } = require('../src/config/database');

async function run(pool, label, tsql) {
  try {
    await pool.request().query(tsql);
    console.log("OK  " + label);
    return true;
  } catch (e) {
    console.log("ERR " + label);
    console.log("    " + e.message.replace(/\n/g, " ").substring(0, 400));
    return false;
  }
}

(async () => {
  const pool = await getPool();

  // Show existing FKs on Employees and Candidates (cascade path diagnosis)
  const res = await pool.request().query(`
    SELECT tp.name AS tbl, cp.name AS col, tr.name AS ref_tbl,
           fk.delete_referential_action_desc AS action, fk.name AS fk_name
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables tp  ON fkc.parent_object_id  = tp.object_id
    JOIN sys.tables tr  ON fkc.referenced_object_id = tr.object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    WHERE tp.name IN ('Employees','Candidates','CandidateVotes','VoteAllocations','SessionAdmins','ProxyAssignments')
    ORDER BY tp.name, cp.name
  `);
  console.log("\n=== Current FK map for affected tables ===");
  res.recordset.forEach(r => console.log(
    r.action.padEnd(10), r.tbl.padEnd(22), r.col.padEnd(22), "->", r.ref_tbl.padEnd(18), r.fk_name
  ));

  // Employees.UserID CASCADE
  console.log("\n--- Employees.UserID CASCADE ---");
  await run(pool, "drop old FK",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__Employees__UserI__1209AD79') ALTER TABLE [Employees] DROP CONSTRAINT [FK__Employees__UserI__1209AD79]");
  await run(pool, "add CASCADE FK",
    "ALTER TABLE [Employees] ADD CONSTRAINT [FK__Employees__UserI__1209AD79] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID]) ON DELETE CASCADE");

  // VoteAllocations.UserID CASCADE
  console.log("\n--- VoteAllocations.UserID CASCADE ---");
  await run(pool, "drop old FK",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__VoteAlloc__UserI__2CBDA3B5') ALTER TABLE [VoteAllocations] DROP CONSTRAINT [FK__VoteAlloc__UserI__2CBDA3B5]");
  await run(pool, "add CASCADE FK",
    "ALTER TABLE [VoteAllocations] ADD CONSTRAINT [FK__VoteAlloc__UserI__2CBDA3B5] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID]) ON DELETE CASCADE");

  // SessionAdmins.AssignedBy SET NULL
  console.log("\n--- SessionAdmins.AssignedBy SET NULL ---");
  await run(pool, "make nullable", "ALTER TABLE [SessionAdmins] ALTER COLUMN [AssignedBy] INT NULL");
  await run(pool, "drop old FK",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__SessionAd__Assig__214BF109') ALTER TABLE [SessionAdmins] DROP CONSTRAINT [FK__SessionAd__Assig__214BF109]");
  await run(pool, "add SET NULL FK",
    "ALTER TABLE [SessionAdmins] ADD CONSTRAINT [FK__SessionAd__Assig__214BF109] FOREIGN KEY ([AssignedBy]) REFERENCES [Users]([UserID]) ON DELETE SET NULL");

  // ProxyAssignments.ProxyUserID SET NULL
  console.log("\n--- ProxyAssignments.ProxyUserID SET NULL ---");
  await run(pool, "make nullable", "ALTER TABLE [ProxyAssignments] ALTER COLUMN [ProxyUserID] INT NULL");
  await run(pool, "drop old FK",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK__ProxyAssi__Proxy__16CE6296') ALTER TABLE [ProxyAssignments] DROP CONSTRAINT [FK__ProxyAssi__Proxy__16CE6296]");
  await run(pool, "add SET NULL FK",
    "ALTER TABLE [ProxyAssignments] ADD CONSTRAINT [FK__ProxyAssi__Proxy__16CE6296] FOREIGN KEY ([ProxyUserID]) REFERENCES [Users]([UserID]) ON DELETE SET NULL");

  process.exit(0);
})().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
