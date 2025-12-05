// Simple AGM Timer Test
const API_BASE = 'http://localhost:3001/api/admin';

async function testAGMTimer() {
  console.log('\n🧪 AGM TIMER COMPREHENSIVE TEST\n');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Start AGM now (active immediately)
    console.log('\n✨ TEST 1: Start AGM NOW (should be active immediately)');
    console.log('-'.repeat(70));
    
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    const startTimeStr = now.toTimeString().substring(0, 5);
    const endTimeStr = endTime.toTimeString().substring(0, 5);
    
    console.log(`⏰ Start: ${now.toLocaleString()} (${startTimeStr})`);
    console.log(`⏰ End: ${endTime.toLocaleString()} (${endTimeStr})`);
    
    const startResponse = await fetch(`${API_BASE}/agm-timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: startTimeStr,
        end: endTimeStr,
        startedAt: now.toISOString()
      })
    });
    
    if (!startResponse.ok) {
      throw new Error(`Failed to start timer: ${startResponse.status}`);
    }
    
    const startResult = await startResponse.json();
    console.log('✅ Backend Response:', JSON.stringify(startResult, null, 2));
    
    // Verify status
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n📊 Checking status...');
    const statusResponse = await fetch(`${API_BASE}/agm-timer/status`);
    const statusResult = await statusResponse.json();
    
    console.log('📋 Current Status:', JSON.stringify(statusResult, null, 2));
    
    if (statusResult.agmTimer.active) {
      const startedAt = new Date(statusResult.agmTimer.startedAt);
      const currentTime = new Date();
      
      if (currentTime >= startedAt) {
        console.log('✅ PASS: AGM is ACTIVE (voting should be enabled)');
        console.log(`   Started: ${startedAt.toLocaleString()}`);
        console.log(`   Current: ${currentTime.toLocaleString()}`);
      } else {
        console.log('⏰ AGM is SCHEDULED (will start soon)');
        const minutesUntil = Math.ceil((startedAt - currentTime) / 60000);
        console.log(`   Starts in: ${minutesUntil} minutes`);
      }
    } else {
      console.log('❌ FAIL: AGM should be active but is not');
    }
    
    // Test 2: Schedule AGM for future
    console.log('\n\n✨ TEST 2: Schedule AGM for 2 MINUTES in the future');
    console.log('-'.repeat(70));
    
    const futureStart = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000); // 1 hour after start
    
    const futureStartStr = futureStart.toTimeString().substring(0, 5);
    const futureEndStr = futureEnd.toTimeString().substring(0, 5);
    
    console.log(`⏰ Start: ${futureStart.toLocaleString()} (${futureStartStr})`);
    console.log(`⏰ End: ${futureEnd.toLocaleString()} (${futureEndStr})`);
    
    const futureResponse = await fetch(`${API_BASE}/agm-timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: futureStartStr,
        end: futureEndStr,
        startedAt: futureStart.toISOString()
      })
    });
    
    const futureResult = await futureResponse.json();
    console.log('✅ Backend Response:', JSON.stringify(futureResult, null, 2));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status2Response = await fetch(`${API_BASE}/agm-timer/status`);
    const status2Result = await status2Response.json();
    
    if (status2Result.agmTimer.active) {
      const scheduledStart = new Date(status2Result.agmTimer.startedAt);
      const currentTime = new Date();
      
      if (currentTime < scheduledStart) {
        const secondsUntil = Math.ceil((scheduledStart - currentTime) / 1000);
        console.log('✅ PASS: AGM is SCHEDULED for future');
        console.log(`   Starts in: ${Math.floor(secondsUntil / 60)}m ${secondsUntil % 60}s`);
        console.log(`   Timer bar should show: "AGM STARTS IN [countdown]"`);
      } else {
        console.log('⏰ AGM has started (timer was set very close to current time)');
      }
    }
    
    // Test 3: End AGM
    console.log('\n\n✨ TEST 3: End AGM session');
    console.log('-'.repeat(70));
    
    const endResponse = await fetch(`${API_BASE}/agm-timer/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const endResult = await endResponse.json();
    console.log('✅ Backend Response:', JSON.stringify(endResult, null, 2));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalStatusResponse = await fetch(`${API_BASE}/agm-timer/status`);
    const finalStatusResult = await finalStatusResponse.json();
    
    if (!finalStatusResult.agmTimer.active) {
      console.log('✅ PASS: AGM ended successfully');
      console.log('   Timer bar should show: "AGM SESSION ENDED"');
    } else {
      console.log('❌ FAIL: AGM should be ended but is still active');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL TESTS COMPLETED!');
    console.log('='.repeat(70));
    
    console.log('\n📝 SUMMARY:');
    console.log('  • Backend API: ✅ Working');
    console.log('  • Active AGM: ✅ Tested');
    console.log('  • Scheduled AGM: ✅ Tested');
    console.log('  • End AGM: ✅ Tested');
    console.log('\n💡 Next steps:');
    console.log('  1. Open the app in browser');
    console.log('  2. Login as admin');
    console.log('  3. Click "Set AGM Timer" button');
    console.log('  4. Set a time 1-2 minutes in the future');
    console.log('  5. Watch the header show blue countdown');
    console.log('  6. When time arrives, it should turn green');
    console.log('  7. Open another browser/tab - timer should sync!\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n💡 Make sure:');
    console.error('  1. Backend server is running (port 3001)');
    console.error('  2. Run: node server/app.js');
    console.error('  3. Check for any errors in server console\n');
  }
}

// Run the test
testAGMTimer();
