// Quick test for AGM Timer with simple time inputs
const API_BASE = 'http://localhost:3001/api/admin';

async function quickTest() {
  console.log('\n🧪 QUICK AGM TIMER TEST\n');
  console.log('='.repeat(50));
  
  try {
    // Test: Set AGM with simple time format (like modal uses)
    console.log('\n✨ Setting AGM Timer (12:04 - 13:05)');
    
    const now = new Date();
    const startDateTime = new Date(now);
    startDateTime.setHours(12, 4, 0, 0);
    
    const response = await fetch(`${API_BASE}/agm-timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: '12:04',
        end: '13:05',
        startedAt: startDateTime.toISOString()
      })
    });
    
    const result = await response.json();
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.agmTimer.active) {
      console.log('\n✅ SUCCESS! AGM Timer is set');
      console.log(`   Start: ${result.agmTimer.start}`);
      console.log(`   End: ${result.agmTimer.end}`);
      console.log(`   Started At: ${result.agmTimer.startedAt}`);
      
      // Check if it's upcoming or active
      const startedAt = new Date(result.agmTimer.startedAt);
      const currentTime = new Date();
      
      if (currentTime < startedAt) {
        const mins = Math.ceil((startedAt - currentTime) / 60000);
        console.log(`\n🔵 Status: UPCOMING (starts in ${mins} minutes)`);
        console.log('   Header should show: "AGM STARTS IN [countdown]"');
      } else {
        console.log(`\n🟢 Status: ACTIVE`);
        console.log('   Header should show: "AGM IN PROGRESS - VOTING ACTIVE"');
      }
    } else {
      console.log('\n❌ FAILED to set timer');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ Test complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Make sure backend is running: node server/app.js\n');
  }
}

quickTest();
