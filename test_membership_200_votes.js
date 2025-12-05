/**
 * Test Script: Verify Vote Allocation for Membership ID 200
 * 
 * This script tests:
 * 1. Login with jaredmoodley1212@gmail.com
 * 2. Fetch voting status using user ID (like VotingStatusBar does)
 * 3. Verify personalVotesTotal is returned correctly
 * 4. Check if membership number 200 belongs to this user
 */

const API_BASE_URL = 'http://localhost:3001';

async function testMembership200Votes() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING VOTE ALLOCATION FOR MEMBERSHIP ID 200');
  console.log('='.repeat(80));
  console.log('');

  try {
    // STEP 1: Login as jaredmoodley1212@gmail.com
    console.log('📝 STEP 1: Login');
    console.log('-'.repeat(80));
    console.log('Email: jaredmoodley1212@gmail.com');
    console.log('Attempting login...');
    
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jaredmoodley1212@gmail.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.token) {
      console.error('❌ LOGIN FAILED');
      console.error('Response:', JSON.stringify(loginData, null, 2));
      return;
    }

    console.log('✅ Login successful!');
    console.log('User ID:', loginData.user.id);
    console.log('User Name:', loginData.user.name);
    console.log('User Email:', loginData.user.email);
    console.log('Membership Number:', loginData.user.membershipNumber);
    console.log('Token:', loginData.token.substring(0, 30) + '...');
    console.log('');

    const userId = loginData.user.id;
    const token = loginData.token;
    const membershipNumber = loginData.user.membershipNumber;

    // Check if this user has membership number 200
    if (membershipNumber === '200' || membershipNumber === 200) {
      console.log('✅ CONFIRMED: This user has membership number 200');
    } else {
      console.log(`⚠️  WARNING: This user's membership number is ${membershipNumber}, NOT 200`);
      console.log('   The test will continue to check their vote allocation...');
    }
    console.log('');

    // STEP 2: Fetch voting status (same as VotingStatusBar)
    console.log('📝 STEP 2: Fetch Voting Status');
    console.log('-'.repeat(80));
    console.log(`Endpoint: ${API_BASE_URL}/api/voting-status/status/${userId}`);
    console.log('Method: GET');
    console.log('Headers: Authorization Bearer token');
    console.log('');
    
    const statusResponse = await fetch(`${API_BASE_URL}/api/voting-status/status/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response Status:', statusResponse.status, statusResponse.statusText);
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('❌ API REQUEST FAILED');
      console.error('Error:', errorText);
      return;
    }

    const statusData = await statusResponse.json();
    console.log('');
    console.log('📊 API Response (Full):');
    console.log(JSON.stringify(statusData, null, 2));
    console.log('');

    // STEP 3: Verify and display vote allocation
    console.log('📝 STEP 3: Verify Vote Allocation');
    console.log('-'.repeat(80));

    if (!statusData.success) {
      console.error('❌ API returned success=false');
      console.error('Message:', statusData.message || 'No message');
      return;
    }

    if (!statusData.data) {
      console.error('❌ API returned no data object');
      return;
    }

    const data = statusData.data;

    console.log('✅ API Response Structure Valid');
    console.log('');
    console.log('📊 VOTE ALLOCATION DETAILS:');
    console.log('─'.repeat(80));
    console.log(`Personal Votes Total:      ${data.personalVotesTotal || 0}`);
    console.log(`Personal Votes Remaining:  ${data.personalVotesRemaining || 0}`);
    console.log(`Personal Votes Used:       ${(data.personalVotesTotal || 0) - (data.personalVotesRemaining || 0)}`);
    console.log('─'.repeat(80));
    console.log(`Proxy Votes Total:         ${data.proxyVotesTotal || 0}`);
    console.log(`Proxy Votes Remaining:     ${data.proxyVotesRemaining || 0}`);
    console.log(`Proxy Votes Used:          ${(data.proxyVotesTotal || 0) - (data.proxyVotesRemaining || 0)}`);
    console.log('─'.repeat(80));
    console.log(`TOTAL Votes Remaining:     ${data.totalVotesRemaining || 0}`);
    console.log(`TOTAL Votes Used:          ${data.totalVotesUsed || 0}`);
    console.log(`TOTAL Votes Available:     ${(data.totalVotesRemaining || 0) + (data.totalVotesUsed || 0)}`);
    console.log('─'.repeat(80));
    console.log('');

    // STEP 4: Summary and ProxyAppointmentForm integration check
    console.log('📝 STEP 4: ProxyAppointmentForm Integration Check');
    console.log('-'.repeat(80));

    const personalVotesTotal = data.personalVotesTotal || 0;
    
    console.log('Field ProxyAppointmentForm should use: result.data.personalVotesTotal');
    console.log('Value that should be set:              ' + personalVotesTotal);
    console.log('');
    
    if (personalVotesTotal > 0) {
      console.log('✅ SUCCESS: User has ' + personalVotesTotal + ' vote(s) available for allocation');
      console.log('');
      console.log('ProxyAppointmentForm should:');
      console.log('  1. Set formData.totalAvailableVotes = ' + personalVotesTotal);
      console.log('  2. Display "' + personalVotesTotal + ' Available Votes" in the status bar');
      console.log('  3. Allow allocation up to ' + personalVotesTotal + ' votes to proxy members');
      console.log('');
      console.log('Expected Vote Status Bar Display:');
      console.log('┌─────────────────────────────────────────────┐');
      console.log('│ Vote Allocation                             │');
      console.log(`│ ${personalVotesTotal} Available Votes | 0 Allocated | ${personalVotesTotal} Remaining       │`);
      console.log('└─────────────────────────────────────────────┘');
    } else {
      console.log('⚠️  WARNING: User has 0 votes available');
      console.log('This could mean:');
      console.log('  - User has already used all their votes');
      console.log('  - User has not been assigned any votes');
      console.log('  - There is a data issue in the database');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('🎉 TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('❌ TEST FAILED WITH ERROR');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testMembership200Votes();
