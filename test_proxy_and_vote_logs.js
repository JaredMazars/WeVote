// Test script to verify proxy groups and vote logs APIs
const API_BASE = 'http://localhost:3001';

async function testProxyGroupsAPI() {
  console.log('\n🧪 TESTING PROXY GROUPS API\n');
  console.log('=' .repeat(60));

  try {
    console.log('🔍 Fetching proxy groups from:', `${API_BASE}/api/proxy/admin/all-groups`);
    
    const response = await fetch(`${API_BASE}/api/proxy/admin/all-groups`, {
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
      return null;
    }

    const result = await response.json();
    
    console.log('\n✅ PROXY GROUPS API RESPONSE:');
    console.log('   Success:', result.success);
    console.log('   Data length:', result.data?.length || 0);
    
    if (result.data && result.data.length > 0) {
      console.log('\n📋 FIRST 2 PROXY GROUPS:');
      console.log('=' .repeat(60));
      result.data.slice(0, 2).forEach((group, index) => {
        console.log(`\n${index + 1}. Group ID: ${group.id}`);
        console.log(`   Principal: ${group.principal_name} (ID: ${group.principal_id})`);
        console.log(`   Email: ${group.principal_email}`);
        console.log(`   Total Members: ${group.total_members || 0}`);
        console.log(`   Has Votes Cast: ${group.has_votes_cast ? 'Yes' : 'No'}`);
        console.log(`   Created: ${group.created_at}`);
      });
    } else {
      console.log('\n⚠️ No proxy groups found');
    }

    return result;
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return null;
  }
}

async function testVoteLogsAPI() {
  console.log('\n\n🧪 TESTING VOTE LOGS API\n');
  console.log('=' .repeat(60));

  try {
    console.log('🔍 Fetching vote logs from:', `${API_BASE}/api/admin/votes/logs`);
    
    const response = await fetch(`${API_BASE}/api/admin/votes/logs`, {
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
      return null;
    }

    const result = await response.json();
    
    console.log('\n✅ VOTE LOGS API RESPONSE:');
    console.log('   Success:', result.success);
    console.log('   Logs length:', result.logs?.length || 0);
    
    if (result.logs && result.logs.length > 0) {
      console.log('\n📋 FIRST 3 VOTE LOGS:');
      console.log('=' .repeat(60));
      result.logs.slice(0, 3).forEach((log, index) => {
        console.log(`\n${index + 1}. Vote ID: ${log.id}`);
        console.log(`   Voter ID: ${log.voter_id}`);
        console.log(`   Voter Email: ${log.voter_email || 'N/A'}`);
        console.log(`   Vote Type: ${log.vote_type}`);
        console.log(`   Employee ID: ${log.employee_id || 'N/A'}`);
        console.log(`   Resolution ID: ${log.resolution_id || 'N/A'}`);
        console.log(`   Vote Weight: ${log.vote_weight}`);
        console.log(`   Valid Vote: ${log.valid_vote ? 'Yes' : 'No'}`);
        console.log(`   Created: ${log.created_at}`);
      });
    } else {
      console.log('\n⚠️ No vote logs found');
    }

    return result;
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 STARTING API TESTS');
  console.log('='.repeat(60));

  const proxyResult = await testProxyGroupsAPI();
  const voteResult = await testVoteLogsAPI();

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Proxy Groups API: ${proxyResult ? 'WORKING' : 'FAILED'}`);
  console.log(`   - Found ${proxyResult?.data?.length || 0} proxy groups`);
  console.log(`✅ Vote Logs API: ${voteResult ? 'WORKING' : 'FAILED'}`);
  console.log(`   - Found ${voteResult?.logs?.length || 0} vote logs`);
  console.log('='.repeat(60));
  console.log('\n💡 Make sure backend server is running on port 3001\n');
}

// Run all tests
runTests();
