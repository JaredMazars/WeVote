const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

let adminToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Test Case 1.1: Valid Registration with Digital Proxy
async function testCase1_1() {
  console.log('\n=== Test Case 1.1: Valid Registration with Digital Proxy ===');
  try {
    const testData = {
      title: 'Mr',
      firstName: 'Test',
      lastName: 'User',
      email: `testuser${Date.now()}@forvismazars.com`,
      phoneNumber: '0821234567',
      idType: 'south_african',
      idNumber: '9001015009087',
      dateOfBirth: '1990-01-01',
      goodStandingIdNumber: 'MEM2024001',
      streetAddress: '123 Test Street',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      country: 'South Africa',
      proxyVoteForm: 'digital'
    };

    const response = await axios.post(`${BASE_URL}/auth/register-pending`, testData);
    
    if (response.data.success) {
      logTest('Registration with digital proxy', true, `User ID: ${response.data.user.userId}`);
      return testData.email;
    } else {
      logTest('Registration with digital proxy', false, response.data.message);
      return null;
    }
  } catch (error) {
    logTest('Registration with digital proxy', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test Case 1.2: Valid Registration with Manual Proxy
async function testCase1_2() {
  console.log('\n=== Test Case 1.2: Valid Registration with Manual Proxy ===');
  try {
    const testData = {
      title: 'Mrs',
      firstName: 'Jane',
      lastName: 'Smith',
      email: `janesmith${Date.now()}@forvismazars.com`,
      phoneNumber: '0829876543',
      idType: 'south_african',
      idNumber: '8505125009088',
      dateOfBirth: '1985-05-12',
      goodStandingIdNumber: 'MEM2024002',
      streetAddress: '456 Oak Avenue',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa',
      proxyVoteForm: 'manual'
    };

    const response = await axios.post(`${BASE_URL}/auth/register-pending`, testData);
    
    if (response.data.success) {
      logTest('Registration with manual proxy', true, `User ID: ${response.data.user.userId}`);
      return testData.email;
    } else {
      logTest('Registration with manual proxy', false, response.data.message);
      return null;
    }
  } catch (error) {
    logTest('Registration with manual proxy', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test Case 1.3: Registration with Abstain
async function testCase1_3() {
  console.log('\n=== Test Case 1.3: Registration with Abstain ===');
  try {
    const testData = {
      title: 'Dr',
      firstName: 'Robert',
      lastName: 'Johnson',
      email: `robertj${Date.now()}@forvismazars.com`,
      phoneNumber: '0831112222',
      idType: 'foreign',
      idNumber: 'P123456789',
      dateOfBirth: '1975-03-20',
      goodStandingIdNumber: 'MEM2024003',
      streetAddress: '789 Pine Road',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
      country: 'South Africa',
      proxyVoteForm: 'abstain'
    };

    const response = await axios.post(`${BASE_URL}/auth/register-pending`, testData);
    
    if (response.data.success) {
      logTest('Registration with abstain', true, `User ID: ${response.data.user.userId}`);
      return testData.email;
    } else {
      logTest('Registration with abstain', false, response.data.message);
      return null;
    }
  } catch (error) {
    logTest('Registration with abstain', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test Case 1.10: Duplicate Email Registration
async function testCase1_10() {
  console.log('\n=== Test Case 1.10: Duplicate Email Registration ===');
  try {
    const testData = {
      title: 'Mr',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@wevote.com', // Existing email
      phoneNumber: '0821234567',
      idType: 'south_african',
      idNumber: '9001015009087',
      dateOfBirth: '1990-01-01',
      goodStandingIdNumber: 'MEM2024099',
      proxyVoteForm: 'digital'
    };

    const response = await axios.post(`${BASE_URL}/auth/register-pending`, testData);
    
    // Should fail
    logTest('Duplicate email prevention', false, 'Should have been rejected but succeeded');
  } catch (error) {
    if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
      logTest('Duplicate email prevention', true, 'Correctly rejected duplicate email');
    } else {
      logTest('Duplicate email prevention', false, error.response?.data?.message || error.message);
    }
  }
}

// Admin Login
async function loginAsAdmin() {
  console.log('\n=== Admin Login ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@wevote.com',
      password: 'Admin123!'
    });
    
    adminToken = response.data.token;
    logTest('Admin login', true, 'Token received');
    return true;
  } catch (error) {
    logTest('Admin login', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test Case 2.1: View Pending Registrations
async function testCase2_1() {
  console.log('\n=== Test Case 2.1: View Pending User Registrations ===');
  try {
    const response = await axios.get(`${BASE_URL}/users/pending/registrations`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success && response.data.count >= 0) {
      logTest('View pending registrations', true, `Found ${response.data.count} pending users`);
      return response.data.data;
    } else {
      logTest('View pending registrations', false, 'Invalid response format');
      return [];
    }
  } catch (error) {
    logTest('View pending registrations', false, error.response?.data?.message || error.message);
    return [];
  }
}

// Test Case 2.2: Approve User
async function testCase2_2(userId) {
  console.log('\n=== Test Case 2.2: Approve User Registration ===');
  if (!userId) {
    logTest('Approve user registration', false, 'No user ID provided');
    return false;
  }
  
  try {
    const response = await axios.put(`${BASE_URL}/users/${userId}/approve`, {}, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      logTest('Approve user registration', true, `User ${userId} approved`);
      return true;
    } else {
      logTest('Approve user registration', false, response.data.message);
      return false;
    }
  } catch (error) {
    logTest('Approve user registration', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test Case 2.5: View Pending Proxies
async function testCase2_5() {
  console.log('\n=== Test Case 2.5: View Pending Proxy Assignments ===');
  try {
    const response = await axios.get(`${BASE_URL}/proxy/pending/assignments`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (response.data.success && response.data.count >= 0) {
      logTest('View pending proxy assignments', true, `Found ${response.data.count} pending proxies`);
      return response.data.data;
    } else {
      logTest('View pending proxy assignments', false, 'Invalid response format');
      return [];
    }
  } catch (error) {
    logTest('View pending proxy assignments', false, error.response?.data?.message || error.message);
    return [];
  }
}

// Main test execution
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   WEVOTE COMPREHENSIVE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Phase 1: Registration Tests
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 1: EMPLOYEE REGISTRATION FLOW                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const email1 = await testCase1_1();
  const email2 = await testCase1_2();
  const email3 = await testCase1_3();
  await testCase1_10();

  // Phase 2: Admin Approval Tests
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 2: ADMIN APPROVAL WORKFLOW                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const loginSuccess = await loginAsAdmin();
  if (loginSuccess) {
    const pendingUsers = await testCase2_1();
    if (pendingUsers && pendingUsers.length > 0) {
      await testCase2_2(pendingUsers[0].id);
    }
    await testCase2_5();
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.message}`);
    });
  }
}

runAllTests();
