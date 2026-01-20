const http = require('http');

// First login to get a valid token
function login(callback) {
  const postData = JSON.stringify({
    email: 'superadmin@forvismazars.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        callback(null, result);
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on('error', (error) => callback(error));
  req.write(postData);
  req.end();
}

function makeRequest(path, token, callback) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        callback(null, { status: res.statusCode, data: JSON.parse(data) });
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on('error', (error) => callback(error));
  req.end();
}

async function testEndpoints() {
  console.log('=== Testing Approvals Dashboard API ===\n');
  
  // Step 1: Login
  console.log('1. Logging in as superadmin...');
  login((err, loginResult) => {
    if (err) {
      console.error('Login Error:', err.message);
      return;
    }
    
    console.log('Login Status:', loginResult.success ? 'SUCCESS' : 'FAILED');
    if (!loginResult.success || !loginResult.token) {
      console.error('Failed to get token:', loginResult.message);
      return;
    }
    
    const token = loginResult.token;
    console.log('Token received:', token.substring(0, 50) + '...\n');
    
    // Step 2: Test Pending Users
    console.log('2. Testing GET /api/users/pending/registrations');
    makeRequest('/api/users/pending/registrations', token, (err, result) => {
      if (err) {
        console.error('Error:', err.message);
        return;
      }
      console.log('Status:', result.status);
      if (result.status === 200) {
        console.log('✅ SUCCESS - Pending Users Count:', result.data.count || result.data.data?.length || 0);
        if (result.data.data && result.data.data.length > 0) {
          console.log('Sample user:', result.data.data[0]);
        }
      } else {
        console.log('❌ FAILED:', JSON.stringify(result.data, null, 2));
      }
      console.log('');
      
      // Step 3: Test Pending Proxies
      console.log('3. Testing GET /api/proxy/pending/assignments');
      makeRequest('/api/proxy/pending/assignments', token, (err, result) => {
        if (err) {
          console.error('Error:', err.message);
          return;
        }
        console.log('Status:', result.status);
        if (result.status === 200) {
          console.log('✅ SUCCESS - Pending Proxies Count:', result.data.count || result.data.data?.length || 0);
          if (result.data.data && result.data.data.length > 0) {
            console.log('Sample proxy:', result.data.data[0]);
          }
        } else {
          console.log('❌ FAILED:', JSON.stringify(result.data, null, 2));
        }
        console.log('\n=== Test Complete ===');
      });
    });
  });
}

testEndpoints();
