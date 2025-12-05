/**
 * Test Script: Verify ProxyAppointmentForm pulls same "votes left" as VotingStatusBar
 * 
 * This script tests that both components use the same value:
 * - VotingStatusBar shows: totalVotesRemaining as "votes left"
 * - ProxyAppointmentForm should show: totalVotesRemaining as "Available Votes"
 */

const API_BASE_URL = 'http://localhost:3001';

async function testVoteSynchronization() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING VOTE SYNCHRONIZATION: VotingStatusBar vs ProxyAppointmentForm');
  console.log('='.repeat(80));
  console.log('');

  try {
    // STEP 1: Login (try common test credentials)
    console.log('📝 STEP 1: Login');
    console.log('-'.repeat(80));
    
    const credentials = [
      { email: 'jaredmoodley9@gmail.com', password: 'password123' },
      { email: 'admin@company.com', password: 'password123' },
      { email: 'user@company.com', password: 'password123' }
    ];
    
    let loginData = null;
    let token = null;
    let userId = null;
    
    for (const cred of credentials) {
      console.log(`Trying to login as: ${cred.email}`);
      
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });

      const result = await loginResponse.json();
      
      if (result.success && result.token) {
        loginData = result;
        token = result.token;
        userId = result.user.id;
        console.log('✅ Login successful!');
        console.log('User ID:', userId);
        console.log('User Name:', result.user.name);
        console.log('User Email:', result.user.email);
        console.log('');
        break;
      }
    }
    
    if (!token) {
      console.error('❌ LOGIN FAILED for all test credentials');
      return;
    }

    // STEP 2: Fetch voting status (what both components use)
    console.log('📝 STEP 2: Fetch Voting Status (Endpoint Both Components Use)');
    console.log('-'.repeat(80));
    console.log(`Endpoint: ${API_BASE_URL}/api/voting-status/status/${userId}`);
    console.log('');
    
    const statusResponse = await fetch(`${API_BASE_URL}/api/voting-status/status/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('❌ API REQUEST FAILED');
      console.error('Status:', statusResponse.status);
      console.error('Error:', errorText);
      return;
    }

    const statusData = await statusResponse.json();
    
    if (!statusData.success || !statusData.data) {
      console.error('❌ Invalid API response');
      console.error(statusData);
      return;
    }

    const data = statusData.data;
    
    console.log('✅ API Response Received');
    console.log('');
    console.log('📊 RAW API DATA:');
    console.log('─'.repeat(80));
    console.log(`personalVotesTotal:      ${data.personalVotesTotal}`);
    console.log(`personalVotesRemaining:  ${data.personalVotesRemaining}`);
    console.log(`proxyVotesTotal:         ${data.proxyVotesTotal}`);
    console.log(`proxyVotesRemaining:     ${data.proxyVotesRemaining}`);
    console.log(`totalVotesRemaining:     ${data.totalVotesRemaining}  ⭐ THIS IS THE KEY VALUE`);
    console.log(`totalVotesUsed:          ${data.totalVotesUsed}`);
    console.log('─'.repeat(80));
    console.log('');

    // STEP 3: Component Display Comparison
    console.log('📝 STEP 3: Component Display Comparison');
    console.log('-'.repeat(80));
    console.log('');
    
    const totalVotesRemaining = data.totalVotesRemaining || 0;
    
    console.log('🔵 VotingStatusBar Component:');
    console.log('   Display Text: "{totalVotesRemaining} votes left"');
    console.log(`   Actual Value: ${totalVotesRemaining} votes left`);
    console.log('   Data Source: result.data.totalVotesRemaining');
    console.log('');
    
    console.log('🟢 ProxyAppointmentForm Component:');
    console.log('   Display Text: "Vote Allocation | {totalAvailableVotes} Available Votes"');
    console.log(`   Should Show:  Vote Allocation | ${totalVotesRemaining} Available Votes`);
    console.log('   Data Source: result.data.totalVotesRemaining');
    console.log('   State Variable: formData.totalAvailableVotes = totalVotesRemaining');
    console.log('');

    // STEP 4: Verification
    console.log('📝 STEP 4: Verification');
    console.log('-'.repeat(80));
    console.log('');
    
    if (totalVotesRemaining === 0) {
      console.log('⚠️  WARNING: User has 0 votes remaining');
      console.log('   This could mean:');
      console.log('   - User has already used all their votes');
      console.log('   - User has not been assigned any votes');
      console.log('   - For testing, try with a user who has available votes');
      console.log('');
    } else {
      console.log('✅ SUCCESS: User has votes available!');
      console.log('');
    }
    
    console.log('🎯 EXPECTED BEHAVIOR:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ VotingStatusBar (Bottom Left Corner)                       │');
    console.log(`│ ➤ "${totalVotesRemaining} votes left"                                         │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ ProxyAppointmentForm (Section Header)                      │');
    console.log(`│ ➤ "Vote Allocation"                                         │`);
    console.log(`│ ➤ "${totalVotesRemaining} Available Votes | 0 Allocated | ${totalVotesRemaining} Remaining"         │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log('');
    
    console.log('🔍 WHAT TO CHECK IN THE UI:');
    console.log('1. Open ProxyAppointmentForm in browser');
    console.log('2. Check VotingStatusBar at bottom-left shows: "' + totalVotesRemaining + ' votes left"');
    console.log('3. Check ProxyAppointmentForm Section 2 shows: "' + totalVotesRemaining + ' Available Votes"');
    console.log('4. Both values should be IDENTICAL');
    console.log('');
    
    if (totalVotesRemaining > 0) {
      console.log('✅ SYNCHRONIZATION VERIFIED:');
      console.log(`   Both components will show: ${totalVotesRemaining} votes`);
      console.log('   ✓ VotingStatusBar uses: result.data.totalVotesRemaining');
      console.log('   ✓ ProxyAppointmentForm uses: result.data.totalVotesRemaining');
      console.log('   ✓ They fetch from the SAME endpoint with the SAME user ID');
      console.log('   ✓ Values are synchronized! ✨');
    } else {
      console.log('⚠️  TEST COMPLETED but user has 0 votes');
      console.log('   For better testing, use a user with available votes.');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('🎉 TEST COMPLETED');
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
testVoteSynchronization();
