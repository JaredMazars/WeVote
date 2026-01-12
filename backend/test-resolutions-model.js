const Resolution = require('./src/models/Resolution');

async function testResolutions() {
  try {
    console.log('=== TESTING RESOLUTIONS MODEL ===\n');
    
    // Test findAll
    console.log('1. Testing findAll()...');
    const resolutions = await Resolution.findAll();
    console.log(`✅ Found ${resolutions.length} resolutions`);
    
    if (resolutions.length > 0) {
      console.log('\n=== SAMPLE RESOLUTION ===');
      console.log(JSON.stringify(resolutions[0], null, 2));
    }
    
    // Test findById
    if (resolutions.length > 0) {
      console.log('\n2. Testing findById()...');
      const resolution = await Resolution.findById(resolutions[0].ResolutionID);
      console.log(`✅ Found resolution: ${resolution.ResolutionTitle}`);
      console.log(`   Category: ${resolution.Category}`);
      console.log(`   Status: ${resolution.Status}`);
      console.log(`   Yes Votes: ${resolution.TotalYesVotes}`);
      console.log(`   No Votes: ${resolution.TotalNoVotes}`);
      console.log(`   Abstain Votes: ${resolution.TotalAbstainVotes}`);
    }
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testResolutions();
