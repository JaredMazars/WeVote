// Check all missing/incomplete FKs and column nullability
const { executeQuery, getPool } = require('../src/config/database');

(async () => {
  await getPool();

  // Check FKs on all tables of interest
  const tables = ['Employees','VoteAllocations','AGMSessions','SessionAdmins','ProxyAssignments','ProxyAppointments'];
  
  for (const tbl of tables) {
    const r = await executeQuery(`
      SELECT
        fk.name AS FK_Name,
        tp.name AS Table_Name,
        cp.name AS Col,
        tr.name AS Ref_Table,
        cr.name AS Ref_Col,
        fk.delete_referential_action_desc AS Action,
        cp.is_nullable AS Nullable,
        tp2.name AS type_name,
        cp.max_length
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
      JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
      JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
      JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
      JOIN sys.types tp2 ON cp.user_type_id = tp2.user_type_id
      WHERE tp.name = '${tbl}'
    `);
    if (r.recordset.length) {
      console.log(`\n── ${tbl} ──`);
      r.recordset.forEach(row =>
        console.log(`  ${row.Action.padEnd(10)} [${row.Col}] → ${row.Ref_Table}.${row.Ref_Col}  nullable=${row.Nullable}  type=${row.type_name}  FK=${row.FK_Name}`)
      );
    } else {
      console.log(`\n── ${tbl} ── (no FKs found)`);
    }

    // Also show columns that might be missing FK
    const cols = await executeQuery(`
      SELECT c.name AS Col, tp2.name AS type_name, c.is_nullable, c.max_length
      FROM sys.columns c
      JOIN sys.tables t ON c.object_id = t.object_id
      JOIN sys.types tp2 ON c.user_type_id = tp2.user_type_id
      WHERE t.name = '${tbl}' AND (c.name LIKE '%UserID%' OR c.name LIKE '%By' OR c.name LIKE '%user%')
    `);
    cols.recordset.forEach(c =>
      console.log(`    col: ${c.Col.padEnd(25)} type=${c.type_name}  nullable=${c.is_nullable}`)
    );
  }

  process.exit(0);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
