const https = require('https');
const http = require('http');

async function testLoginAPI() {
  try {
    console.log('\n🧪 TESTING LOGIN API\n');
    console.log('='.repeat(60));
    
    const loginData = JSON.stringify({
      email: 'employee@forvismazars.com',
      password: 'employee123'
    });
    
    console.log('Request:');
    console.log(`  URL: http://localhost:3001/api/auth/login`);
    console.log(`  Email: employee@forvismazars.com`);
    console.log(`  Password: employee123`);
    console.log('');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response Status: ${res.statusCode} ${res.statusMessage}`);
        console.log('');
        
        try {
          const data = JSON.parse(responseData);
          
          if (res.statusCode === 200) {
            console.log('✅ LOGIN SUCCESSFUL!\n');
            console.log('Response Data:');
            console.log(JSON.stringify(data, null, 2));
            console.log('\n');
            console.log('='.repeat(60));
            console.log('USER DETAILS:');
            console.log('='.repeat(60));
            console.log(`User ID: ${data.user.userId}`);
            console.log(`Name: ${data.user.firstName} ${data.user.lastName}`);
            console.log(`Email: ${data.user.email}`);
            console.log(`Role: ${data.user.role}`);
            console.log(`Email Verified: ${data.user.isEmailVerified ? 'YES' : 'NO'}`);
            console.log(`Requires Password Change: ${data.user.requiresPasswordChange ? 'YES' : 'NO'}`);
            console.log(`Token: ${data.token.substring(0, 30)}...`);
            console.log('='.repeat(60));
            console.log('\n✨ You should be able to login with these credentials!\n');
          } else {
            console.log('❌ LOGIN FAILED!\n');
            console.log('Error Response:');
            console.log(JSON.stringify(data, null, 2));
            console.log('\n');
          }
        } catch (e) {
          console.log('Raw Response:', responseData);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ API Request Error:', error.message);
    });
    
    req.write(loginData);
    req.end();
  } catch (error) {
    console.error('❌ API Request Error:', error.message);
  }
}

testLoginAPI();
