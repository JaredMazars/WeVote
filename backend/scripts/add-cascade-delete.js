/**
 * Migration: Add CASCADE DELETE to all FK constraints that reference Users
 *
 * Strategy:
 *  - "Ownership" columns (UserID, VoterUserID, PrincipalUserID, ProxyUserID)
 *      → ON DELETE CASCADE  (row belongs to the user, delete it with them)
 *  - "Metadata" reference columns (CreatedBy, SetBy, ApprovedBy, NominatedBy, etc.)
 *      → ON DELETE SET NULL if the column is nullable, CASCADE if NOT NULL
 *
 * This is for direct SQL testing convenience only.
 * The app uses soft-delete (IsActive=0) and never hard-deletes users.
 */

const { executeQuery, getPool } = require('../src/config/database');
const sql = require('mssql');

// -------------------------------------------------------
// Columns where the row "belongs" to the user → CASCADE
// -------------------------------------------------------
const CASCADE_COLUMNS = new Set([
  'UserID',
  'VoterUserID',
  'PrincipalUserID',
  'ProxyUserID',
  'RecipientUserID',
]);

(async () => {
  console.log('🔧 Connecting to database...');
  const pool = await getPool();

  // ── Step 1: get every FK + its column nullability in one query ──────────
  const fkRows = await executeQuery(`
    SELECT
      fk.name        AS FK_Name,
      tp.name        AS Parent_Table,
      cp.name        AS Parent_Column,
      cp.is_nullable AS Is_Nullable,
      fk.delete_referential_action_desc AS Current_Action
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc
      ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tp
      ON fkc.parent_object_id = tp.object_id
    INNER JOIN sys.columns cp
      ON fkc.parent_object_id = cp.object_id
     AND fkc.parent_column_id = cp.column_id
    INNER JOIN sys.tables tr
      ON fkc.referenced_object_id = tr.object_id
    INNER JOIN sys.columns cr
      ON fkc.referenced_object_id = cr.object_id
     AND fkc.referenced_column_id = cr.column_id
    WHERE tr.name = 'Users'
    ORDER BY tp.name, fk.name
  `);

  // ── Step 2: also get the parent-table column we're FK-ing FROM ───────────
  //    (needed to reconstruct the ADD CONSTRAINT statement)
  const colDefs = await executeQuery(`
    SELECT
      tp.name        AS Parent_Table,
      cp.name        AS Parent_Column,
      cr.name        AS Referenced_Column
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tp  ON fkc.parent_object_id = tp.object_id
    INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    INNER JOIN sys.tables tr  ON fkc.referenced_object_id = tr.object_id
    INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    WHERE tr.name = 'Users'
  `);

  const refColMap = {};
  colDefs.recordset.forEach(r => {
    refColMap[`${r.Parent_Table}.${r.Parent_Column}`] = r.Referenced_Column;
  });

  const rows = fkRows.recordset;
  let altered = 0, skipped = 0, errors = 0;

  console.log(`\nFound ${rows.length} FKs referencing Users\n`);

  for (const row of rows) {
    const { FK_Name, Parent_Table, Parent_Column, Is_Nullable, Current_Action } = row;
    const refCol = refColMap[`${Parent_Table}.${Parent_Column}`] || 'UserID';

    // Decide action
    let desiredAction;
    if (CASCADE_COLUMNS.has(Parent_Column)) {
      desiredAction = 'CASCADE';
    } else if (Is_Nullable) {
      desiredAction = 'SET NULL';
    } else {
      // NOT NULL metadata column — must use CASCADE (can't SET NULL)
      desiredAction = 'CASCADE';
    }

    if (Current_Action === desiredAction || 
        (Current_Action === 'CASCADE' && desiredAction === 'CASCADE') ||
        (Current_Action === 'SET_NULL' && desiredAction === 'SET NULL')) {
      console.log(`⏭️  SKIP  [${Parent_Table}].[${Parent_Column}] — already ${Current_Action}`);
      skipped++;
      continue;
    }

    const dropSQL   = `ALTER TABLE [${Parent_Table}] DROP CONSTRAINT [${FK_Name}]`;
    const addSQL    = `ALTER TABLE [${Parent_Table}] ADD CONSTRAINT [${FK_Name}] FOREIGN KEY ([${Parent_Column}]) REFERENCES [Users]([${refCol}]) ON DELETE ${desiredAction}`;

    try {
      await pool.request().query(dropSQL);
      await pool.request().query(addSQL);
      console.log(`✅  [${Parent_Table}].[${Parent_Column}]  → ON DELETE ${desiredAction}`);
      altered++;
    } catch (err) {
      console.error(`❌  [${Parent_Table}].[${Parent_Column}]  FAILED: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`✅ Altered : ${altered}`);
  console.log(`⏭️  Skipped : ${skipped}`);
  console.log(`❌ Errors  : ${errors}`);
  console.log(`─────────────────────────────────────────`);

  process.exit(errors > 0 ? 1 : 0);
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
