const Candidate = require('./src/models/Candidate');
const Resolution = require('./src/models/Resolution');
const Proxy = require('./src/models/Proxy');

async function testAllModels() {
  try {
    console.log('=== COMPREHENSIVE MODEL TESTING ===\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Candidates
    try {
      console.log('1️⃣  Testing Candidates...');
      const candidates = await Candidate.findAll();
      console.log(`   ✅ Candidates: ${candidates.length} records`);
      passed++;
    } catch (error) {
      console.log(`   ❌ Candidates failed: ${error.message}`);
      failed++;
    }
    
    // Test 2: Resolutions
    try {
      console.log('2️⃣  Testing Resolutions...');
      const resolutions = await Resolution.findAll();
      console.log(`   ✅ Resolutions: ${resolutions.length} records`);
      passed++;
    } catch (error) {
      console.log(`   ❌ Resolutions failed: ${error.message}`);
      failed++;
    }
    
    // Test 3: Proxy Assignments
    try {
      console.log('3️⃣  Testing Proxy Assignments...');
      const proxies = await Proxy.findAll();
      console.log(`   ✅ Proxy Assignments: ${proxies.length} records`);
      passed++;
    } catch (error) {
      console.log(`   ❌ Proxy Assignments failed: ${error.message}`);
      failed++;
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50));
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

testAllModels();
