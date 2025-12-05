// Simple test script to verify AGM Timer functionality

console.log('🚀 Testing AGM Timer functionality...');

async function testAgmTimer() {
  try {
    // Test setting AGM timer
    console.log('📡 Testing AGM Timer API...');
    
    const response = await fetch('http://localhost:3001/api/admin/agm-timer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: '15:00', end: '17:00' })
    });
    
    const result = await response.json();
    console.log('✅ AGM Timer API Response:', result);
    
    if (result.success) {
      console.log('🎉 AGM Timer set successfully!');
      console.log('📅 Timer Details:', {
        start: result.agmTimer.start,
        end: result.agmTimer.end,
        active: result.agmTimer.active,
        startedAt: result.agmTimer.startedAt
      });
    } else {
      console.log('❌ Failed to set AGM timer:', result.message);
    }
    
    // Test getting AGM timer status
    console.log('\n📡 Testing AGM Timer Status API...');
    const statusResponse = await fetch('http://localhost:3001/api/admin/agm-timer/status');
    const statusResult = await statusResponse.json();
    console.log('✅ AGM Timer Status:', statusResult);
    
  } catch (error) {
    console.error('💥 Error testing AGM Timer:', error);
  }
}

// Run the test
testAgmTimer();
