// Test all API endpoints
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

async function testEndpoints() {
  console.log('🧪 Testing WeVote API Endpoints\n');
  
  try {
    // 1. Test Login
    console.log('1️⃣ Testing Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@forvismazars.com',
      password: 'Admin@2026'
    });
    authToken = loginRes.data.token;
    console.log('   ✅ Login successful\n');
    
    const headers = { Authorization: `Bearer ${authToken}` };
    
    // 2. Test Users
    console.log('2️⃣ Testing GET /users...');
    const usersRes = await axios.get(`${BASE_URL}/users`, { headers });
    console.log(`   ✅ Users: ${usersRes.data.length} found\n`);
    
    // 3. Test Employees
    console.log('3️⃣ Testing GET /employees...');
    const employeesRes = await axios.get(`${BASE_URL}/employees`, { headers });
    console.log(`   ✅ Employees: ${employeesRes.data.length} found\n`);
    
    // 4. Test Departments
    console.log('4️⃣ Testing GET /departments...');
    const deptRes = await axios.get(`${BASE_URL}/departments`, { headers });
    console.log(`   ✅ Departments: ${deptRes.data.length} found\n`);
    
    // 5. Test Sessions
    console.log('5️⃣ Testing GET /sessions...');
    const sessionsRes = await axios.get(`${BASE_URL}/sessions`, { headers });
    console.log(`   ✅ Sessions: ${sessionsRes.data.length} found\n`);
    
    // 6. Test Candidates
    console.log('6️⃣ Testing GET /candidates...');
    const candidatesRes = await axios.get(`${BASE_URL}/candidates`, { headers });
    console.log(`   ✅ Candidates: ${candidatesRes.data.length} found\n`);
    
    // 7. Test Resolutions
    console.log('7️⃣ Testing GET /resolutions...');
    const resolutionsRes = await axios.get(`${BASE_URL}/resolutions`, { headers });
    console.log(`   ✅ Resolutions: ${resolutionsRes.data.length} found\n`);
    
    // 8. Test Proxy
    console.log('8️⃣ Testing GET /proxy...');
    const proxyRes = await axios.get(`${BASE_URL}/proxy`, { headers });
    console.log(`   ✅ Proxy: ${proxyRes.data.length} found\n`);
    
    console.log('🎉 All tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('   Endpoint:', error.config?.url);
    console.error('   Status:', error.response?.status);
  }
}

testEndpoints();
