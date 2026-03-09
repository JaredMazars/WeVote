const { executeQuery, getPool } = require('../src/config/database');

(async () => {
  const pool = await getPool();

  const tables = await executeQuery('SELECT name FROM sys.tables ORDER BY name');
  console.log('All tables:', tables.recordset.map(t => t.name).join(', '));

  const allCasc = await executeQuery(`
    SELECT tp.name AS from_tbl, tr.name AS to_tbl, cp.name AS from_col
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
    WHERE fk.delete_referential_action_desc = 'CASCADE'
    ORDER BY tp.name
  `);
  console.log('\nAll CASCADE FKs:');
  allCasc.recordset.forEach(r => console.log(`  ${r.from_tbl}.${r.from_col} --> ${r.to_tbl}`));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
