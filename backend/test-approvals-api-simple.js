const http = require('http');

// Admin credentials (see START_SERVERS.md / DEMO_CREDENTIALS.md)
const credentials = {
  email: 'admin@forvismazars.com',
  password: 'Admin@2026'
};

async function testApprovalsAPI() {
  try {
    console.log('\n=== Testing Approvals API Endpoints ===\n');
    
    // Step 1: Login to get token
    console.log('1. Logging in as admin...');
    const loginData = JSON.stringify(credentials);
    
    const loginPromise = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Login failed: ${res.statusCode} ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    const loginResult = await loginPromise;
    const token = loginResult.token;
    console.log('✅ Login successful, got token\n');
    
    // Step 2: Test GET /api/users/pending/registrations
    console.log('2. Testing GET /api/users/pending/registrations...');
    const pendingUsersPromise = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/users/pending/registrations',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`   Status: ${res.statusCode}`);
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log(`   ✅ Found ${result.data?.length || 0} pending users`);
            if (result.data && result.data.length > 0) {
              console.log('   First user:', result.data[0]);
            }
            resolve(result);
          } else {
            console.log(`   ❌ Error: ${data}`);
            reject(new Error(`Failed: ${res.statusCode} ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    await pendingUsersPromise;
    console.log('');
    
    // Step 3: Test GET /api/proxy/pending/assignments
    console.log('3. Testing GET /api/proxy/pending/assignments...');
    const pendingProxiesPromise = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/proxy/pending/assignments',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`   Status: ${res.statusCode}`);
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log(`   ✅ Found ${result.data?.length || 0} pending proxies`);
            if (result.data && result.data.length > 0) {
              console.log('   First proxy:', result.data[0]);
            }
            resolve(result);
          } else {
            console.log(`   ❌ Error: ${data}`);
            reject(new Error(`Failed: ${res.statusCode} ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    await pendingProxiesPromise;
    
    console.log('\n✅ All API tests completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testApprovalsAPI();
