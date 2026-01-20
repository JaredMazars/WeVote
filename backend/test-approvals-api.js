const http = require('http');

function makeRequest(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic3VwZXJhZG1pbkBmb3J2aXNtYXphcnMuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzM0MDc3MDUwLCJleHAiOjE3MzQxNjM0NTB9.test'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      callback(null, { status: res.statusCode, data: JSON.parse(data) });
    });
  });

  req.on('error', (error) => callback(error));
  req.end();
}

async function testEndpoints() {
  console.log('Testing Approvals Dashboard API Endpoints\n');
  
  // Test 1: Pending Users
  console.log('1. Testing GET /api/users/pending/registrations');
  makeRequest('/api/users/pending/registrations', (err, result) => {
    if (err) {
      console.error('Error:', err.message);
      return;
    }
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    console.log('Pending Users Count:', result.data.count);
    console.log('');
    
    // Test 2: Pending Proxies
    console.log('2. Testing GET /api/proxy/pending/assignments');
    makeRequest('/api/proxy/pending/assignments', (err, result) => {
      if (err) {
        console.error('Error:', err.message);
        return;
      }
      console.log('Status:', result.status);
      console.log('Response:', JSON.stringify(result.data, null, 2));
      console.log('Pending Proxies Count:', result.data.count);
    });
  });
}

testEndpoints();
