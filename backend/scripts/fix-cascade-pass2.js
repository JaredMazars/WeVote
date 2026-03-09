/**
 * Fix pass 2: Handle the 5 failed FKs that caused "multiple cascade paths"
 *
 * Problem: SQL Server doesn't allow two CASCADE paths from one table to another.
 * If a table has e.g. UserID (CASCADE) + SetBy (CASCADE) → error.
 *
 * Fix:
 *  - VoteAllocations.SetBy     → revert to SET NULL (UserID is the owner)
 *  - VoteAllocations.UserID    → CASCADE (retry now that SetBy is SET NULL)
 *  - ProxyAssignments.ProxyUserID → SET NULL
 *  - SessionAdmins.AssignedBy  → SET NULL (after making column nullable if needed)
 *  - AGMSessions.CreatedBy     → SET NULL (after making nullable if needed)
 *  - Employees.UserID          → investigate + fix
 */

const { executeQuery, getPool } = require('../src/config/database');
const sql = require('mssql');

async function remakeFK(pool, table, col, refCol, fkName, action) {
  // Ensure column is nullable if SET NULL
  if (action === 'SET NULL') {
    const typeInfo = await executeQuery(
      `SELECT c.is_nullable, t.name AS type_name, c.max_length, c.precision, c.scale
       FROM sys.columns c
       INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
       INNER JOIN sys.tables tb ON c.object_id = tb.object_id
       WHERE tb.name = @table AND c.name = @col`,
      { table, col }
    );
    const ci = typeInfo.recordset[0];
    if (ci && !ci.is_nullable) {
      // Make column nullable first
      const typeStr = ci.type_name === 'nvarchar' ? `NVARCHAR(${ci.max_length === -1 ? 'MAX' : ci.max_length / 2})`
                    : ci.type_name === 'int'      ? 'INT'
                    : ci.type_name === 'bigint'   ? 'BIGINT'
                    : 'INT';
      console.log(`  → Altering [${table}].[${col}] to allow NULL...`);
      await pool.request().query(`ALTER TABLE [${table}] ALTER COLUMN [${col}] ${typeStr} NULL`);
    }
  }

  // Drop old FK (it may have been left in an inconsistent state — try both drop outcomes)
  try {
    await pool.request().query(`ALTER TABLE [${table}] DROP CONSTRAINT [${fkName}]`);
  } catch (e) {
    console.log(`    (Drop skipped or already gone: ${e.message.substring(0, 80)})`);
  }

  // Re-add with correct action
  const addSQL = `ALTER TABLE [${table}] ADD CONSTRAINT [${fkName}] FOREIGN KEY ([${col}]) REFERENCES [Users]([${refCol}]) ON DELETE ${action}`;
  await pool.request().query(addSQL);
  console.log(`✅  [${table}].[${col}]  → ON DELETE ${action}`);
}

(async () => {
  console.log('🔧 Connecting...');
  const pool = await getPool();

  // ── Step A: Fix VoteAllocations ───────────────────────────────────────────
  // SetBy had CASCADE set in pass 1, blocking UserID. Revert SetBy to SET NULL first.
  console.log('\n── VoteAllocations ──');
  await remakeFK(pool, 'VoteAllocations', 'SetBy',  'UserID', 'FK__VoteAlloc__SetBy__2AD55B43',  'SET NULL');
  await remakeFK(pool, 'VoteAllocations', 'UserID', 'UserID', 'FK__VoteAlloc__UserI__2CBDA3B5', 'CASCADE');

  // ── Step B: Fix ProxyAssignments.ProxyUserID ─────────────────────────────
  // PrincipalUserID already got CASCADE; ProxyUserID must be SET NULL
  console.log('\n── ProxyAssignments ──');
  await remakeFK(pool, 'ProxyAssignments', 'ProxyUserID', 'UserID', 'FK__ProxyAssi__Proxy__16CE6296', 'SET NULL');

  // ── Step C: Fix SessionAdmins.AssignedBy ─────────────────────────────────
  // UserID is already CASCADE; AssignedBy must be SET NULL
  console.log('\n── SessionAdmins ──');
  await remakeFK(pool, 'SessionAdmins', 'AssignedBy', 'UserID', 'FK__SessionAd__Assig__214BF109', 'SET NULL');

  // ── Step D: Fix AGMSessions.CreatedBy ────────────────────────────────────
  // Likely blocked by a cascade chain through other tables. Use SET NULL.
  console.log('\n── AGMSessions ──');
  await remakeFK(pool, 'AGMSessions', 'CreatedBy', 'UserID', 'FK__AGMSessio__Creat__00DF2177', 'SET NULL');

  // ── Step E: Fix Employees.UserID ─────────────────────────────────────────
  // This fails because: deleting a User cascades to CandidateVotes via VoterUserID,
  // AND also via Users → Employees → Candidates (if Candidates FK to Employees cascades)
  // Check if Candidates has CASCADE on EmployeeID → Employees
  console.log('\n── Employees (diagnosing) ──');
  const candFKs = await executeQuery(`
    SELECT fk.name, fk.delete_referential_action_desc
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tp  ON fkc.parent_object_id = tp.object_id
    INNER JOIN sys.tables tr  ON fkc.referenced_object_id = tr.object_id
    INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    WHERE tp.name = 'Candidates' AND tr.name = 'Employees'
  `);
  console.log('Candidates→Employees FKs:', candFKs.recordset);

  const cvFKs = await executeQuery(`
    SELECT fk.name, fk.delete_referential_action_desc, cp.name AS col
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tp  ON fkc.parent_object_id = tp.object_id
    INNER JOIN sys.tables tr  ON fkc.referenced_object_id = tr.object_id
    INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    WHERE tp.name = 'CandidateVotes' AND tr.name = 'Candidates'
  `);
  console.log('CandidateVotes→Candidates FKs:', cvFKs.recordset);

  // If Candidates→Employees is CASCADE, and CandidateVotes→Candidates is CASCADE,
  // then Users→CandidateVotes.VoterUserID AND Users→Employees→Candidates→CandidateVotes
  // are BOTH cascading to CandidateVotes → multiple cascade path error on Employees.UserID
  //
  // Fix: drop the CandidateVotes→Candidates CASCADE (change to NO ACTION / SET NULL)
  // since Employees.UserID ownership is more important.
  const hasCandCascade = cvFKs.recordset.some(r => r.delete_referential_action_desc === 'CASCADE');
  if (hasCandCascade) {
    console.log('\n  CandidateVotes→Candidates has CASCADE — need to change to NO ACTION first');
    for (const fk of cvFKs.recordset) {
      if (fk.delete_referential_action_desc === 'CASCADE') {
        // Get referenced columns
        const refCols = await executeQuery(`
          SELECT cp.name AS parent_col, cr.name AS ref_col
          FROM sys.foreign_key_columns fkc
          INNER JOIN sys.foreign_keys fk2 ON fk2.object_id = fkc.constraint_object_id
          INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
          INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
          WHERE fk2.name = '${fk.name}'
        `);
        const rc = refCols.recordset[0];
        await pool.request().query(`ALTER TABLE [CandidateVotes] DROP CONSTRAINT [${fk.name}]`);
        await pool.request().query(`ALTER TABLE [CandidateVotes] ADD CONSTRAINT [${fk.name}] FOREIGN KEY ([${rc.parent_col}]) REFERENCES [Candidates]([${rc.ref_col}]) ON DELETE NO ACTION`);
        console.log(`  ✅ Changed CandidateVotes.[${rc.parent_col}] FK to NO ACTION`);
      }
    }
  }

  // Retry Employees.UserID CASCADE
  await remakeFK(pool, 'Employees', 'UserID', 'UserID', 'FK__Employees__UserI__1209AD79', 'CASCADE');

  console.log('\n✅ Pass 2 complete');
  process.exit(0);
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
