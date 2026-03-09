/**
 * cascade-fix-final.js
 *
 * Completes the cascade-delete setup so that deleting a row from Users
 * automatically removes / nulls all dependent rows.
 *
 * Strategy per column:
 *   "Owner" columns (UserID, VoterUserID, PrincipalUserID, RecipientUserID …)
 *       ➜ ON DELETE CASCADE  (row belongs to that user, dies with them)
 *   "Metadata" reference columns (CreatedBy, SetBy, AssignedBy, ApprovedBy …)
 *       ➜ ON DELETE SET NULL (just clear the reference, keep the row)
 *
 * SQL Server "multiple cascade paths" rule:
 *   Two different CASCADE paths from one table to the same target table are banned.
 *   Affected pairs already handled in earlier passes:
 *     • CandidateVotes.CandidateID → Candidates  → now NO ACTION  (pass 2 ✅)
 *     • VoteAllocations.SetBy → Users             → now SET NULL   (pass 2 ✅)
 *   New ones handled below:
 *     • AGMSessions.CreatedBy → SET NULL (avoids Users→AGMSessions→VoteAllocations
 *       colliding with Users→VoteAllocations.UserID CASCADE)
 *
 * The app itself NEVER hard-deletes users — it only sets IsActive = 0.
 * This setup is purely for direct SQL testing convenience.
 */

const { executeQuery, getPool } = require('../src/config/database');
const sql = require('mssql');

// ── helpers ─────────────────────────────────────────────────────────────────

async function getColInfo(pool, table, col) {
  const r = await pool.request()
    .input('t', sql.NVarChar, table)
    .input('c', sql.NVarChar, col)
    .query(`
      SELECT c.is_nullable, tp.name AS type_name, c.max_length, c.precision, c.scale
      FROM sys.columns c
      JOIN sys.tables t2 ON c.object_id = t2.object_id
      JOIN sys.types tp  ON c.user_type_id = tp.user_type_id
      WHERE t2.name = @t AND c.name = @c
    `);
  return r.recordset[0] || null;
}

function colTypeStr(info) {
  if (!info) return 'INT';
  switch (info.type_name) {
    case 'nvarchar': return `NVARCHAR(${info.max_length === -1 ? 'MAX' : info.max_length / 2})`;
    case 'varchar':  return `VARCHAR(${info.max_length === -1 ? 'MAX' : info.max_length})`;
    case 'bigint':   return 'BIGINT';
    default:         return 'INT';
  }
}

async function makeNullable(pool, table, col) {
  const info = await getColInfo(pool, table, col);
  if (!info) { console.log(`    ⚠️  Column ${table}.${col} not found`); return false; }
  if (info.is_nullable) { return true; } // already nullable
  const ts = colTypeStr(info);
  console.log(`    → ALTER TABLE [${table}] ALTER COLUMN [${col}] ${ts} NULL`);
  await pool.request().query(`ALTER TABLE [${table}] ALTER COLUMN [${col}] ${ts} NULL`);
  return true;
}

async function dropFK(pool, table, fkName) {
  try {
    await pool.request().query(`ALTER TABLE [${table}] DROP CONSTRAINT [${fkName}]`);
    console.log(`    dropped ${fkName}`);
  } catch (e) {
    console.log(`    (drop skipped — ${e.message.substring(0, 80)})`);
  }
}

async function addFK(pool, table, col, refTable, refCol, fkName, action) {
  const sql = `ALTER TABLE [${table}] ADD CONSTRAINT [${fkName}] FOREIGN KEY ([${col}]) REFERENCES [${refTable}]([${refCol}]) ON DELETE ${action}`;
  console.log(`    + ${sql.substring(0, 120)}`);
  await pool.request().query(sql);
}

async function applyFK(pool, { table, col, refTable, refCol, fkName, action, existingFKName }) {
  console.log(`\n── ${table}.${col} → ${refTable}.${refCol}  [${action}] ──`);
  try {
    if (action === 'SET NULL') {
      await makeNullable(pool, table, col);
    }
    if (existingFKName) await dropFK(pool, table, existingFKName);
    await dropFK(pool, table, fkName); // drop target name too in case of leftover
    await addFK(pool, table, col, refTable, refCol, fkName, action);
    console.log(`  ✅ Done`);
    return true;
  } catch (e) {
    console.error(`  ❌ FAILED: ${e.message}`);
    return false;
  }
}

// ── main ────────────────────────────────────────────────────────────────────

(async () => {
  const pool = await getPool();
  let ok = 0, fail = 0;

  const plan = [
    // ── Employees.UserID (no FK exists yet — cascade path safe because
    //    CandidateVotes→Candidates is NO ACTION from pass 2)
    {
      table: 'Employees', col: 'UserID',
      refTable: 'Users', refCol: 'UserID',
      fkName: 'FK__Employees__UserI__1209AD79',
      action: 'CASCADE',
    },

    // ── VoteAllocations.UserID (no FK exists yet — SetBy is SET NULL so path safe)
    {
      table: 'VoteAllocations', col: 'UserID',
      refTable: 'Users', refCol: 'UserID',
      fkName: 'FK__VoteAlloc__UserI__2CBDA3B5',
      action: 'CASCADE',
    },

    // ── AGMSessions.CreatedBy
    //    Must be SET NULL, not CASCADE, to avoid:
    //    Users→AGMSessions(CreatedBy CASCADE)→VoteAllocations(SessionID CASCADE)
    //    colliding with Users→VoteAllocations(UserID CASCADE)
    {
      table: 'AGMSessions', col: 'CreatedBy',
      refTable: 'Users', refCol: 'UserID',
      fkName: 'FK__AGMSessio__Creat__00DF2177',
      action: 'SET NULL',           // metadata ref → SET NULL avoids multi-path
    },

    // ── SessionAdmins.AssignedBy
    //    UserID already CASCADE; AssignedBy is a different path so SET NULL
    {
      table: 'SessionAdmins', col: 'AssignedBy',
      refTable: 'Users', refCol: 'UserID',
      fkName: 'FK__SessionAd__Assig__214BF109',
      action: 'SET NULL',
    },

    // ── ProxyAssignments.ProxyUserID
    //    PrincipalUserID already CASCADE; ProxyUserID must be SET NULL
    {
      table: 'ProxyAssignments', col: 'ProxyUserID',
      refTable: 'Users', refCol: 'UserID',
      fkName: 'FK__ProxyAssi__Proxy__16CE6296',
      action: 'SET NULL',
    },
  ];

  // ── ProxyAppointments — check columns, add all needed FKs
  const paCols = await executeQuery(`
    SELECT c.name AS Col, tp.name AS type_name, c.is_nullable
    FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    JOIN sys.types tp ON c.user_type_id = tp.user_type_id
    WHERE t.name = 'ProxyAppointments'
  `);
  console.log('\n── ProxyAppointments columns ──');
  paCols.recordset.forEach(c => console.log(`  ${c.Col.padEnd(30)} ${c.type_name}  nullable=${c.is_nullable}`));

  // Determine FK plan for ProxyAppointments from its columns
  const paColNames = paCols.recordset.map(c => c.Col);
  const proxyAppFK = [];
  if (paColNames.includes('PrincipalUserID'))
    proxyAppFK.push({ table:'ProxyAppointments', col:'PrincipalUserID', refTable:'Users', refCol:'UserID', fkName:'FK__ProxyAppt__Princ__PA001', action:'CASCADE' });
  if (paColNames.includes('HolderUserID'))
    proxyAppFK.push({ table:'ProxyAppointments', col:'HolderUserID', refTable:'Users', refCol:'UserID', fkName:'FK__ProxyAppt__Holde__PA002', action:'SET NULL' });
  if (paColNames.includes('SessionID'))
    proxyAppFK.push({ table:'ProxyAppointments', col:'SessionID', refTable:'AGMSessions', refCol:'SessionID', fkName:'FK__ProxyAppt__Sessi__PA003', action:'CASCADE' });

  const allPlan = [...plan, ...proxyAppFK];

  for (const item of allPlan) {
    const success = await applyFK(pool, item);
    success ? ok++ : fail++;
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log(`✅  Success : ${ok}`);
  console.log(`❌  Failed  : ${fail}`);
  console.log('════════════════════════════════════════');

  if (fail === 0) {
    console.log('\n🎉 All done! Deleting a Users row will now cascade/null all dependents.');
    console.log('   Test:  DELETE FROM Users WHERE UserID = <id>');
  }

  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
