const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

// Helper function to make HTTP GET request
const httpGet = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
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

const testEndpoints = async () => {
  console.log('🔍 Testing API Endpoints\n');
  console.log('='.repeat(60));

  // Test 1: Candidates
  console.log('\n📋 1. TESTING CANDIDATES ENDPOINT');
  try {
    const response = await httpGet(`${BASE_URL}/candidates`);
    if (response.status === 200) {
      console.log(`✅ GET /api/candidates: ${response.status}`);
      console.log(`   Found ${response.data.length} candidates`);
      if (response.data.length > 0) {
        const first = response.data[0];
        console.log(`   Sample: ${first.FirstName} ${first.LastName} - ${first.Category}`);
      }
    } else if (response.status === 401) {
      console.log(`⚠️  GET /api/candidates: ${response.status} (Auth required)`);
    } else {
      console.log(`❌ GET /api/candidates: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ GET /api/candidates: ${error.message}`);
  }

  // Test 2: Resolutions
  console.log('\n📋 2. TESTING RESOLUTIONS ENDPOINT');
  try {
    const response = await httpGet(`${BASE_URL}/resolutions`);
    if (response.status === 200) {
      console.log(`✅ GET /api/resolutions: ${response.status}`);
      console.log(`   Found ${response.data.length} resolutions`);
      if (response.data.length > 0) {
        const first = response.data[0];
        console.log(`   Sample: ${first.ResolutionTitle || first.Title} - ${first.Status}`);
      }
    } else {
      console.log(`❌ GET /api/resolutions: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ GET /api/resolutions: ${error.message}`);
  }

  // Test 3: Proxy Assignments
  console.log('\n📋 3. TESTING PROXY ASSIGNMENTS ENDPOINT');
  try {
    const response = await httpGet(`${BASE_URL}/proxies`);
    if (response.status === 200) {
      console.log(`✅ GET /api/proxies: ${response.status}`);
      console.log(`   Found ${response.data.length} proxy assignments`);
      if (response.data.length > 0) {
        const first = response.data[0];
        console.log(`   Sample: ${first.PrincipalName} → ${first.ProxyName} (${first.ProxyType})`);
      }
    } else if (response.status === 404) {
      console.log(`❌ GET /api/proxies: 404 (Route not found)`);
    } else {
      console.log(`❌ GET /api/proxies: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ GET /api/proxies: ${error.message}`);
  }

  // Test 4: Sessions
  console.log('\n📋 4. TESTING SESSIONS ENDPOINT');
  try {
    const response = await httpGet(`${BASE_URL}/sessions`);
    if (response.status === 200) {
      console.log(`✅ GET /api/sessions: ${response.status}`);
      console.log(`   Found ${response.data.length} sessions`);
    } else if (response.status === 500) {
      console.log(`❌ GET /api/sessions: 500 (Server error - model issue)`);
      if (response.data.error) {
        console.log(`   Error: ${response.data.error}`);
      }
    } else {
      console.log(`❌ GET /api/sessions: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ GET /api/sessions: ${error.message}`);
  }

  // Test 5: Audit Logs
  console.log('\n📋 5. TESTING AUDIT LOGS ENDPOINT');
  try {
    const response = await httpGet(`${BASE_URL}/audit-logs`);
    if (response.status === 200) {
      console.log(`✅ GET /api/audit-logs: ${response.status}`);
      console.log(`   Found ${response.data.length} audit logs`);
    } else if (response.status === 404) {
      console.log(`❌ GET /api/audit-logs: 404 (Route not found)`);
    } else {
      console.log(`❌ GET /api/audit-logs: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ GET /api/audit-logs: ${error.message}`);
  }

  // Test 6: Reports
  console.log('\n📋 6. TESTING REPORTS ENDPOINT');
  try {
    const response = await httpGet(`${BASE_URL}/reports`);
    if (response.status === 200) {
      console.log(`✅ GET /api/reports: ${response.status}`);
      console.log(`   Found ${response.data.length} reports`);
    } else if (response.status === 404) {
      console.log(`❌ GET /api/reports: 404 (Route not found)`);
    } else {
      console.log(`❌ GET /api/reports: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ GET /api/reports: ${error.message}`);
  }

  // Test 7: Vote Statistics
  console.log('\n📋 7. TESTING VOTE STATISTICS ENDPOINT');
  try {
    const response = await httpGet(`${BASE_URL}/vote-statistics`);
    if (response.status === 200) {
      console.log(`✅ GET /api/vote-statistics: ${response.status}`);
      console.log(`   Found ${response.data.length} statistics records`);
    } else if (response.status === 404) {
      console.log(`❌ GET /api/vote-statistics: 404 (Route not found)`);
    } else {
      console.log(`❌ GET /api/vote-statistics: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ GET /api/vote-statistics: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY');
  console.log('   ✅ = Endpoint exists and returns data');
  console.log('   ❌ = Endpoint missing or has errors');
  console.log('   ⚠️  = Endpoint exists but requires authentication');
  console.log('\n');
};

// Run tests
testEndpoints().catch(console.error);
