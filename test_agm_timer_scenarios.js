const API_BASE = 'http://localhost:3001/api/admin';

// Helper to format date for datetime-local input
function getDateTimeLocal(minutesFromNow) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesFromNow);
  return date.toISOString();
}

async function testScenarios() {
  console.log('🧪 Testing AGM Timer Scenarios\n');
  console.log('=' .repeat(60));

  // Scenario 1: Set AGM for 5 minutes in the future
  console.log('\n📅 Scenario 1: AGM scheduled for 5 minutes from now');
  const futureStart = getDateTimeLocal(5);
  const futureEnd = getDateTimeLocal(65); // 65 minutes = 1 hour 5 minutes
  
  const futureStartTime = new Date(futureStart).toTimeString().substring(0, 5);
  const futureEndTime = new Date(futureEnd).toTimeString().substring(0, 5);

  try {
    const response1 = await fetch(`${API_BASE}/agm-timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: futureStartTime,
        end: futureEndTime,
        startedAt: futureStart
      })
    });

    const result1 = await response1.json();
    console.log('✅ Response:', JSON.stringify(result1, null, 2));
    console.log(`   Expected behavior: Timer shows "AGM STARTS IN 5:00"`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Scenario 2: Set AGM starting now
  console.log('\n📅 Scenario 2: AGM starting now (active)');
  const nowStart = getDateTimeLocal(-1); // 1 minute ago to ensure it's active
  const nowEnd = getDateTimeLocal(60); // 60 minutes from now
  
  const nowStartTime = new Date(nowStart).toTimeString().substring(0, 5);
  const nowEndTime = new Date(nowEnd).toTimeString().substring(0, 5);

  try {
    const response2 = await fetch(`${API_BASE}/agm-timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: nowStartTime,
        end: nowEndTime,
        startedAt: nowStart
      })
    });

    const result2 = await response2.json();
    console.log('✅ Response:', JSON.stringify(result2, null, 2));
    console.log(`   Expected behavior: Timer shows "AGM IN PROGRESS - VOTING ACTIVE" with countdown`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Scenario 3: Get current status
  console.log('\n📅 Scenario 3: Get current AGM status');
  try {
    const response3 = await fetch(`${API_BASE}/agm-timer/status`);
    const result3 = await response3.json();
    console.log('✅ Current Status:', JSON.stringify(result3, null, 2));
    
    if (result3.agmTimer.active) {
      const startedAt = new Date(result3.agmTimer.startedAt);
      const now = new Date();
      const diffMinutes = Math.floor((now - startedAt) / 60000);
      
      if (diffMinutes < 0) {
        console.log(`   Status: AGM scheduled to start in ${Math.abs(diffMinutes)} minutes`);
      } else {
        console.log(`   Status: AGM is active (started ${diffMinutes} minutes ago)`);
      }
    } else {
      console.log(`   Status: No active AGM`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Scenario 4: End AGM
  console.log('\n📅 Scenario 4: End AGM session');
  try {
    const response4 = await fetch(`${API_BASE}/agm-timer/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result4 = await response4.json();
    console.log('✅ Response:', JSON.stringify(result4, null, 2));
    console.log(`   Expected behavior: Timer shows "AGM SESSION ENDED"`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ All scenarios tested!\n');
}

// Run tests
testScenarios().catch(console.error);
