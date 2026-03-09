const { executeQuery } = require('../src/config/database');

(async () => {
  // Get all FKs referencing Users
  const fks = await executeQuery(`
    SELECT 
      fk.name AS FK_Name,
      tp.name AS Parent_Table,
      cp.name AS Parent_Column,
      fk.delete_referential_action_desc AS Delete_Action
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
    INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
    INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    WHERE tr.name = 'Users'
    ORDER BY tp.name, fk.name
  `);

  console.log('\n=== ALL FK CONSTRAINTS REFERENCING Users ===');
  fks.recordset.forEach(x => {
    const status = x.Delete_Action === 'CASCADE' ? '✅ CASCADE' : `❌ ${x.Delete_Action}`;
    console.log(`  ${status}  [${x.Parent_Table}].[${x.Parent_Column}]  FK: ${x.FK_Name}`);
  });

  const needsCascade = fks.recordset.filter(x => x.Delete_Action !== 'CASCADE');
  console.log(`\n${needsCascade.length} FKs need CASCADE DELETE added`);
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
