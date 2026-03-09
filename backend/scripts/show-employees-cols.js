const { executeQuery, getPool } = require('../src/config/database');
(async () => {
  await getPool();
  const r = await executeQuery("SELECT c.name, c.is_nullable, tp.name AS type FROM sys.columns c JOIN sys.tables t ON c.object_id=t.object_id JOIN sys.types tp ON c.user_type_id=tp.user_type_id WHERE t.name='Employees' ORDER BY column_id");
  r.recordset.forEach(x => console.log((x.is_nullable ? 'NULL   ' : 'NOTNULL'), x.type.padEnd(12), x.name));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
