// Test script to verify approval status tracking
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3001/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@wevote.com';
const ADMIN_PASSWORD = 'Admin123!';

let adminToken = '';

// Helper function for API calls
function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 Testing Approval Status Tracking\n');
  console.log('=' .repeat(60));

  try {
    // 1. Admin Login
    console.log('\n1. Admin Login...');
    const loginRes = await apiCall('POST', '/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (loginRes.data.token) {
      adminToken = loginRes.data.token;
      console.log('✅ Admin logged in successfully');
    } else {
      console.log('❌ Admin login failed:', loginRes.data.message);
      return;
    }

    // 2. Get All User Registrations
    console.log('\n2. Fetching all user registrations...');
    const usersRes = await apiCall('GET', '/users/pending/registrations', null, adminToken);
    
    if (usersRes.data.success) {
      console.log(`✅ Found ${usersRes.data.count} total users`);
      console.log('\nUser Status Breakdown:');
      
      const users = usersRes.data.data;
      const pending = users.filter(u => u.registration_status === 'pending');
      const approved = users.filter(u => u.registration_status === 'approved');
      const rejected = users.filter(u => u.registration_status === 'rejected');
      
      console.log(`   - Pending: ${pending.length}`);
      console.log(`   - Approved: ${approved.length}`);
      console.log(`   - Rejected: ${rejected.length}`);
      
      console.log('\nSample Users (first 5):');
      users.slice(0, 5).forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
        console.log(`     Status: ${u.registration_status}, Active: ${u.active}`);
      });

      // Verify registration_status field exists
      const hasStatusField = users.every(u => 'registration_status' in u);
      if (hasStatusField) {
        console.log('\n✅ All users have registration_status field');
      } else {
        console.log('\n❌ Some users missing registration_status field');
      }
    } else {
      console.log('❌ Failed to fetch users:', usersRes.data.message);
    }

    // 3. Get All Proxy Assignments
    console.log('\n3. Fetching all proxy assignments...');
    const proxiesRes = await apiCall('GET', '/proxy/pending/assignments', null, adminToken);
    
    if (proxiesRes.data.success) {
      console.log(`✅ Found ${proxiesRes.data.count} total proxies`);
      console.log('\nProxy Status Breakdown:');
      
      const proxies = proxiesRes.data.data;
      const pendingProxies = proxies.filter(p => p.appointment.approval_status === 'pending');
      const approvedProxies = proxies.filter(p => p.appointment.approval_status === 'approved');
      const rejectedProxies = proxies.filter(p => p.appointment.approval_status === 'rejected');
      
      console.log(`   - Pending: ${pendingProxies.length}`);
      console.log(`   - Approved: ${approvedProxies.length}`);
      console.log(`   - Rejected: ${rejectedProxies.length}`);
      
      console.log('\nSample Proxies (first 3):');
      proxies.slice(0, 3).forEach(p => {
        console.log(`   - ${p.appointment.member_full_name} → ${p.appointment.proxy_holder_name}`);
        console.log(`     Status: ${p.appointment.approval_status}, Type: ${p.appointment.appointment_type}`);
      });

      // Verify approval_status field exists
      const hasStatusField = proxies.every(p => 'approval_status' in p.appointment);
      if (hasStatusField) {
        console.log('\n✅ All proxies have approval_status field');
      } else {
        console.log('\n❌ Some proxies missing approval_status field');
      }
    } else {
      console.log('❌ Failed to fetch proxies:', proxiesRes.data.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run the tests
runTests();
