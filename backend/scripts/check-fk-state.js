const { executeQuery, getPool } = require('../src/config/database');

(async () => {
  await getPool();

  const r1 = await executeQuery(`
    SELECT
      fk.name AS FK_Name,
      tp.name AS Table_Name,
      cp.name AS Col,
      cr.name AS Ref_Col,
      fk.delete_referential_action_desc AS Action
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
    JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    WHERE tr.name = 'Users'
    ORDER BY tp.name, cp.name
  `);

  console.log('\n=== FKs referencing Users ===');
  console.log('Action     Table                          Column                    RefCol   FK_Name');
  console.log('─'.repeat(110));
  r1.recordset.forEach(r =>
    console.log(
      r.Action.padEnd(10),
      r.Table_Name.padEnd(30),
      r.Col.padEnd(25),
      r.Ref_Col.padEnd(8),
      r.FK_Name
    )
  );

  // Also check CandidateVotes->Candidates (was changed to NO ACTION in pass2)
  const r2 = await executeQuery(`
    SELECT fk.name, fk.delete_referential_action_desc AS Action, cp.name AS Col
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    WHERE tp.name = 'CandidateVotes' AND tr.name = 'Candidates'
  `);
  console.log('\n=== CandidateVotes -> Candidates ===');
  r2.recordset.forEach(r => console.log(r.Action.padEnd(10), r.Col, r.name));

  // Also check Employees->Users
  const r3 = await executeQuery(`
    SELECT fk.name, fk.delete_referential_action_desc AS Action, cp.name AS Col
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
    JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
    JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    WHERE tp.name = 'Employees' AND tr.name = 'Users'
  `);
  console.log('\n=== Employees -> Users ===');
  r3.recordset.forEach(r => console.log(r.Action.padEnd(10), r.Col, r.name));

  process.exit(0);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
