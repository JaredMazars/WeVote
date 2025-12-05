import database from './server/config/database.js';

async function checkAuditLogs() {
  try {
    console.log('🔍 Checking audit_logs table...');
    
    // Check if table exists
    const tableCheck = await database.query(`
      SELECT COUNT(*) as table_count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'audit_logs'
    `);
    
    if (tableCheck[0].table_count === 0) {
      console.log('❌ audit_logs table does not exist');
      return;
    }
    
    console.log('✅ audit_logs table exists');
    
    // Check table structure
    const columns = await database.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'audit_logs'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if we have any data
    const count = await database.query('SELECT COUNT(*) as total FROM audit_logs');
    console.log(`📊 Total audit logs: ${count[0].total}`);
    
    if (count[0].total > 0) {
      // Show some sample data
      const sample = await database.query(`
        SELECT TOP 5 id, user_id, action_type, action_category, description, created_at 
        FROM audit_logs 
        ORDER BY created_at DESC
      `);
      
      console.log('📋 Sample audit logs:');
      sample.forEach(log => {
        console.log(`  - [${log.id}] ${log.action_category}:${log.action_type} - ${log.description} (${log.created_at})`);
      });
    } else {
      console.log('ℹ️ No audit logs found - table is empty');
    }
    
  } catch (error) {
    console.error('❌ Error checking audit logs:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAuditLogs();
