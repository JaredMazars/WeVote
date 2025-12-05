// Simple test to verify audit logs API is working
const API_BASE = 'http://localhost:3001';

async function testAuditLogsAPI() {
  console.log('\n🧪 TESTING AUDIT LOGS API\n');
  console.log('=' .repeat(60));

  try {
    console.log('🔍 Fetching audit logs from:', `${API_BASE}/api/audit-logs`);
    
    const response = await fetch(`${API_BASE}/api/audit-logs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.log('❌ Response not OK');
      const text = await response.text();
      console.log('Response body:', text);
      return;
    }

    const result = await response.json();
    
    console.log('\n✅ API RESPONSE:');
    console.log('   Success:', result.success);
    console.log('   Data length:', result.data?.length || 0);
    console.log('   Pagination:', result.pagination);
    
    if (result.data && result.data.length > 0) {
      console.log('\n📋 FIRST 3 AUDIT LOGS:');
      console.log('=' .repeat(60));
      result.data.slice(0, 3).forEach((log, index) => {
        console.log(`\n${index + 1}. ID: ${log.id}`);
        console.log(`   User: ${log.user_name || 'N/A'} (ID: ${log.user_id})`);
        console.log(`   Action: ${log.action_type} (${log.action_category})`);
        console.log(`   Description: ${log.description}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Created: ${log.created_at}`);
      });
    } else {
      console.log('\n⚠️ No audit logs found in database');
      console.log('   This might mean:');
      console.log('   - The audit_logs table is empty');
      console.log('   - The database connection is not working');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE - API IS WORKING!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Stack:', error.stack);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running on port 3001');
    console.log('   2. Database is connected');
    console.log('   3. audit_logs table exists');
  }
}

// Run the test
testAuditLogsAPI();
