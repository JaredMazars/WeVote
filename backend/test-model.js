const Candidate = require('./src/models/Candidate');

async function testModel() {
  try {
    console.log('=== TESTING CANDIDATE MODEL ===\n');
    
    // Test findAll
    console.log('1. Testing findAll()...');
    const candidates = await Candidate.findAll();
    console.log(`✅ Found ${candidates.length} candidates`);
    
    if (candidates.length > 0) {
      console.log('\n=== SAMPLE CANDIDATE ===');
      console.log(JSON.stringify(candidates[0], null, 2));
      console.log('\nHas FirstName?', !!candidates[0].FirstName);
      console.log('Has LastName?', !!candidates[0].LastName);
      console.log('Has DepartmentName?', !!candidates[0].DepartmentName);
      console.log('Has EmployeeID?', !!candidates[0].EmployeeID);
      console.log('Has Category?', !!candidates[0].Category);
    }
    
    // Test findById
    if (candidates.length > 0) {
      console.log('\n2. Testing findById()...');
      const candidate = await Candidate.findById(candidates[0].CandidateID);
      console.log(`✅ Found candidate: ${candidate.FirstName} ${candidate.LastName}`);
      console.log(`   Department: ${candidate.DepartmentName}`);
      console.log(`   Category: ${candidate.Category}`);
    }
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testModel();
