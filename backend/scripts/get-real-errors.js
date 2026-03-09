// Expose real SQL Server error numbers by reading precedingErrors from mssql
const { getPool } = require('../src/config/database');

async function tryFK(pool, label, addSQL, dropSQL) {
  console.log('\n── ' + label + ' ──');
  try {
    await pool.request().query(addSQL);
    console.log('  OK');
  } catch (e) {
    console.log('  FAILED number=' + e.number + ' state=' + e.state);
    console.log('  msg: ' + e.message.substring(0, 300));
    if (e.precedingErrors && e.precedingErrors.length > 0) {
      e.precedingErrors.forEach(pe => {
        console.log('  PRECEDING number=' + pe.number + ' msg: ' + pe.message.substring(0, 300));
      });
    }
  }
  try { await pool.request().query(dropSQL); } catch (_) {}
}

(async () => {
  const pool = await getPool();

  await tryFK(pool,
    'Employees.UserID CASCADE',
    "ALTER TABLE [Employees] ADD CONSTRAINT [FK_test_emp] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID]) ON DELETE CASCADE",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_test_emp') ALTER TABLE [Employees] DROP CONSTRAINT [FK_test_emp]"
  );

  await tryFK(pool,
    'VoteAllocations.UserID CASCADE',
    "ALTER TABLE [VoteAllocations] ADD CONSTRAINT [FK_test_va] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID]) ON DELETE CASCADE",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_test_va') ALTER TABLE [VoteAllocations] DROP CONSTRAINT [FK_test_va]"
  );

  await tryFK(pool,
    'SessionAdmins.AssignedBy SET NULL',
    "ALTER TABLE [SessionAdmins] ADD CONSTRAINT [FK_test_sa] FOREIGN KEY ([AssignedBy]) REFERENCES [Users]([UserID]) ON DELETE SET NULL",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_test_sa') ALTER TABLE [SessionAdmins] DROP CONSTRAINT [FK_test_sa]"
  );

  await tryFK(pool,
    'ProxyAssignments.ProxyUserID SET NULL',
    "ALTER TABLE [ProxyAssignments] ADD CONSTRAINT [FK_test_pa] FOREIGN KEY ([ProxyUserID]) REFERENCES [Users]([UserID]) ON DELETE SET NULL",
    "IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_test_pa') ALTER TABLE [ProxyAssignments] DROP CONSTRAINT [FK_test_pa]"
  );

  process.exit(0);
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
