import AuditLog from './server/models/AuditLog.js';

async function createTestAuditLog() {
  try {
    console.log('🧪 Creating test audit log entry...');
    
    const testLog = {
      user_id: '1',
      action_type: 'test_action',
      action_category: 'SYSTEM',
      description: 'Test audit log entry for frontend display',
      entity_type: 'test',
      entity_id: '1',
      metadata: { test: true, created_by: 'admin_test' },
      ip_address: '127.0.0.1',
      user_agent: 'Test Browser',
      status: 'success'
    };
    
    const result = await AuditLog.create(testLog);
    console.log('✅ Test audit log created:', result);
    
    // Now fetch all logs to see if it worked
    console.log('📋 Fetching all audit logs...');
    const allLogs = await AuditLog.getAll({ limit: 10 });
    console.log('📊 Found logs:', allLogs.data?.length || 0);
    
    if (allLogs.data && allLogs.data.length > 0) {
      console.log('🎯 Sample log:', allLogs.data[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestAuditLog();
