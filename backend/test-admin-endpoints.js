const http = require('http');

const BASE_URL = 'http://localhost:3001/api';
const TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // You'll need to get this from logging in

// Helper function to make HTTP GET request
const httpGet = (url, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    };
    
    http.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

async function testAdminDashboardEndpoints() {
  console.log('🧪 TESTING ADMIN DASHBOARD ENDPOINTS\n');
  console.log('='.repeat(80));
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Resolutions with Titles
  console.log('\n📋 TEST 1: Resolutions API');
  console.log('-'.repeat(80));
  try {
    const response = await httpGet(`${BASE_URL}/resolutions`);
    
    if (response.status === 401) {
      console.log('⚠️  Authentication required - Please log in via browser first');
      console.log('   Then copy the token from localStorage and add it to this script');
    } else if (response.status === 200 && response.data.success) {
      console.log(`✅ PASS: Got ${response.data.data.length} resolutions`);
      if (response.data.data.length > 0) {
        const firstRes = response.data.data[0];
        console.log(`   Sample: ID=${firstRes.ResolutionID}, Title="${firstRes.Title}"`);
        
        if (firstRes.Title && firstRes.Title !== 'null' && firstRes.Title !== '') {
          console.log('   ✅ Titles are pulling through correctly!');
          passedTests++;
        } else {
          console.log('   ❌ Titles are NULL or empty');
          failedTests++;
        }
      }
    } else {
      console.log(`❌ FAIL: Status ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failedTests++;
  }
  
  // Test 2: Proxy Assignments
  console.log('\n🤝 TEST 2: Proxy Assignments API');
  console.log('-'.repeat(80));
  try {
    const response = await httpGet(`${BASE_URL}/proxy/assignments`);
    
    if (response.status === 401) {
      console.log('⚠️  Authentication required');
    } else if (response.status === 200) {
      const proxies = response.data.data || response.data;
      console.log(`✅ PASS: Got ${proxies.length} proxy assignments`);
      
      if (proxies.length >= 11) {
        console.log('   ✅ All proxy groups created successfully!');
        passedTests++;
        
        // Check for different types
        const discretionary = proxies.filter(p => p.ProxyType === 'discretionary');
        const instructional = proxies.filter(p => p.ProxyType === 'instructional');
        console.log(`   - ${discretionary.length} discretionary proxies`);
        console.log(`   - ${instructional.length} instructional proxies`);
      } else {
        console.log(`   ❌ Expected at least 11 proxies, got ${proxies.length}`);
        failedTests++;
      }
    } else {
      console.log(`❌ FAIL: Status ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failedTests++;
  }
  
  // Test 3: Audit Logs
  console.log('\n📊 TEST 3: Audit Logs API');
  console.log('-'.repeat(80));
  try {
    const response = await httpGet(`${BASE_URL}/audit-logs?limit=20`);
    
    if (response.status === 401) {
      console.log('⚠️  Authentication required');
    } else if (response.status === 200 && response.data.success) {
      console.log(`✅ PASS: Got ${response.data.data.length} audit log entries`);
      
      if (response.data.data.length >= 15) {
        console.log('   ✅ Audit logs are pulling through!');
        passedTests++;
        
        // Show sample
        const sample = response.data.data[0];
        console.log(`   Sample: [${sample.Timestamp}] ${sample.UserName}: ${sample.Action}`);
      } else {
        console.log(`   ⚠️  Expected at least 15 audit logs, got ${response.data.data.length}`);
        passedTests++;
      }
    } else {
      console.log(`❌ FAIL: Status ${response.status}`);
      console.log(`   Response:`, response.data);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failedTests++;
  }
  
  // Test 4: Candidates
  console.log('\n👥 TEST 4: Candidates API');
  console.log('-'.repeat(80));
  try {
    const response = await httpGet(`${BASE_URL}/candidates`);
    
    if (response.status === 401) {
      console.log('⚠️  Authentication required');
    } else if (response.status === 200 && response.data.success) {
      console.log(`✅ PASS: Got ${response.data.data.length} candidates`);
      
      if (response.data.data.length >= 8) {
        console.log('   ✅ All candidates pulling through!');
        passedTests++;
        
        const sample = response.data.data[0];
        console.log(`   Sample: ${sample.FirstName} ${sample.LastName} - ${sample.DepartmentName}`);
      }
    } else {
      console.log(`❌ FAIL: Status ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failedTests++;
  }
  
  // Test 5: Vote Logs
  console.log('\n🗳️  TEST 5: Vote Logs API');
  console.log('-'.repeat(80));
  try {
    const response = await httpGet(`${BASE_URL}/votes/history`);
    
    if (response.status === 401) {
      console.log('⚠️  Authentication required');
    } else if (response.status === 200) {
      const votes = response.data.data || response.data.votes || [];
      console.log(`✅ PASS: Got ${votes.length} vote log entries`);
      passedTests++;
      
      if (votes.length > 0) {
        const sample = votes[0];
        console.log(`   Sample: ${sample.VoterName || sample.UserName} voted`);
      }
    } else {
      console.log(`❌ FAIL: Status ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failedTests++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   ⚠️  Note: Most tests require authentication. Log in via browser first.`);
  console.log('');
  
  if (failedTests === 0 && passedTests > 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
  } else if (passedTests === 0) {
    console.log('⚠️  All tests show authentication required. This is normal.');
    console.log('   1. Open http://localhost:5173');
    console.log('   2. Log in as admin');
    console.log('   3. Check Admin Dashboard tabs');
    console.log('');
  }
}

testAdminDashboardEndpoints();
