import fetch from 'node-fetch';

async function testAuditAPI() {
  console.log('🧪 Testing Audit Logs API Endpoint\n');
  console.log('=' .repeat(50));
  
  try {
    console.log('📡 Making request to: http://localhost:3001/api/audit-logs\n');
    
    const response = await fetch('http://localhost:3001/api/audit-logs');
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Content-Type: ${response.headers.get('content-type')}\n`);
    
    const data = await response.json();
    
    console.log('✅ Response Data Structure:');
    console.log(`   - success: ${data.success}`);
    console.log(`   - message: ${data.message}`);
    console.log(`   - logs count: ${data.logs ? data.logs.length : 0}`);
    console.log(`   - pagination: page ${data.page} of ${data.totalPages} (${data.total} total records)\n`);
    
    if (data.logs && data.logs.length > 0) {
      console.log('📋 Sample Log Entry:');
      console.log('=' .repeat(50));
      const firstLog = data.logs[0];
      console.log(`   ID:              ${firstLog.id}`);
      console.log(`   User ID:         ${firstLog.user_id || 'N/A'}`);
      console.log(`   Action Category: ${firstLog.action_category}`);
      console.log(`   Action Type:     ${firstLog.action_type}`);
      console.log(`   Description:     ${firstLog.description}`);
      console.log(`   Status:          ${firstLog.status}`);
      console.log(`   IP Address:      ${firstLog.ip_address || 'N/A'}`);
      console.log(`   Created At:      ${firstLog.created_at}`);
      console.log(`   Entity Type:     ${firstLog.entity_type || 'N/A'}`);
      console.log(`   Entity ID:       ${firstLog.entity_id || 'N/A'}`);
      console.log('=' .repeat(50));
      
      console.log('\n📊 All Logs Summary:');
      console.log('=' .repeat(50));
      data.logs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.action_category}] ${log.action_type} - ${log.description.substring(0, 60)}...`);
      });
    } else {
      console.log('⚠️  No logs found in response');
    }
    
    console.log('\n✅ API Test Complete!\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Ensure your backend server is running (node server/app.js)');
    console.log('   2. Ensure your frontend is running (npm run dev)');
    console.log('   3. Navigate to Admin Dashboard → Audit Trail tab');
    console.log('   4. Check browser console for "Fetched audit logs" message');
    console.log('   5. Verify logs appear in the table\n');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n⚠️  Make sure your backend server is running!');
    console.log('   Run: cd server && node app.js\n');
  }
}

testAuditAPI();
