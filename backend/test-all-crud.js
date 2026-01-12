const Proxy = require('./src/models/Proxy');
const Resolution = require('./src/models/Resolution');
const Candidate = require('./src/models/Candidate');

async function testAllModels() {
  try {
    console.log('='.repeat(70));
    console.log('TESTING ALL MODELS WITH CRUD OPERATIONS');
    console.log('='.repeat(70));
    
    // =====================================================
    // 1. TEST PROXY ASSIGNMENTS
    // =====================================================
    console.log('\n📋 1. TESTING PROXY ASSIGNMENTS\n');
    
    // READ - Get all proxies for a principal
    console.log('   Testing: Get proxies for Principal User (ID 2)...');
    const principalProxies = await Proxy.getAssignmentsByPrincipal(2, 1);
    console.log(`   ✅ Found ${principalProxies.length} proxy assignments`);
    if (principalProxies.length > 0) {
      console.log(`      Sample: ${principalProxies[0].PrincipalName || 'N/A'} → ${principalProxies[0].ProxyName}`);
    }
    
    // READ - Get all proxies for a proxy holder
    console.log('\n   Testing: Get proxies held by User 3...');
    const holderProxies = await Proxy.getAssignmentsByProxyHolder(3, 1);
    console.log(`   ✅ Found ${holderProxies.length} proxy assignments held`);
    if (holderProxies.length > 0) {
      console.log(`      Sample: Voting on behalf of ${holderProxies[0].PrincipalName}`);
    }
    
    // READ - Get proxy by ID
    if (principalProxies.length > 0) {
      console.log(`\n   Testing: Get proxy by ID (${principalProxies[0].ProxyID})...`);
      const proxyDetail = await Proxy.findById(principalProxies[0].ProxyID);
      console.log(`   ✅ Retrieved: ${proxyDetail.PrincipalName} → ${proxyDetail.ProxyName}`);
      console.log(`      Type: ${proxyDetail.ProxyType}, Active: ${proxyDetail.IsActive}`);
    }
    
    // CREATE - Create new proxy
    console.log('\n   Testing: Create new proxy assignment...');
    const newProxy = await Proxy.create({
      sessionId: 1,
      principalUserId: 7, // Test user
      proxyUserId: 2,     // Admin will vote for them
      proxyType: 'discretionary',
      endDate: '2024-12-31'
    });
    console.log(`   ✅ Created proxy: ID ${newProxy.ProxyID}`);
    console.log(`      ${newProxy.PrincipalName} → ${newProxy.ProxyName}`);
    
    // UPDATE - Deactivate proxy
    console.log('\n   Testing: Revoke proxy...');
    await Proxy.revoke(newProxy.ProxyID, 2);
    const revokedProxy = await Proxy.findById(newProxy.ProxyID);
    console.log(`   ✅ Revoked: IsActive = ${revokedProxy.IsActive}`);
    
    // =====================================================
    // 2. TEST RESOLUTIONS
    // =====================================================
    console.log('\n\n📋 2. TESTING RESOLUTIONS\n');
    
    // READ - Get all resolutions
    console.log('   Testing: Get all resolutions...');
    const resolutions = await Resolution.findAll({ sessionId: 1 });
    console.log(`   ✅ Found ${resolutions.length} resolutions`);
    if (resolutions.length > 0) {
      console.log(`      Sample: ${resolutions[0].ResolutionTitle}`);
      console.log(`      Category: ${resolutions[0].Category}, Status: ${resolutions[0].Status}`);
    }
    
    // READ - Get resolution by ID
    if (resolutions.length > 0) {
      console.log(`\n   Testing: Get resolution by ID (${resolutions[0].ResolutionID})...`);
      const resolution = await Resolution.findById(resolutions[0].ResolutionID);
      console.log(`   ✅ Retrieved: ${resolution.ResolutionTitle}`);
      console.log(`      Yes: ${resolution.TotalYesVotes}, No: ${resolution.TotalNoVotes}, Abstain: ${resolution.TotalAbstainVotes}`);
    }
    
    // CREATE - Create new resolution
    console.log('\n   Testing: Create new resolution...');
    const newResolution = await Resolution.create({
      sessionId: 1,
      title: 'Test Resolution - Employee Benefits',
      description: 'Test resolution for employee benefits enhancement',
      category: 'Policy Change',
      proposedBy: 2,
      requiredMajority: 66
    });
    console.log(`   ✅ Created resolution: ID ${newResolution.ResolutionID}`);
    console.log(`      ${newResolution.ResolutionTitle}`);
    
    // UPDATE - Update resolution
    console.log('\n   Testing: Update resolution status...');
    const updatedResolution = await Resolution.update(newResolution.ResolutionID, {
      status: 'under_review',
      description: 'Updated: Test resolution for employee benefits enhancement'
    });
    console.log(`   ✅ Updated: Status = ${updatedResolution.Status}`);
    
    // DELETE - Delete test resolution
    console.log('\n   Testing: Delete resolution...');
    await Resolution.delete(newResolution.ResolutionID);
    console.log(`   ✅ Deleted resolution ID ${newResolution.ResolutionID}`);
    
    // =====================================================
    // 3. TEST CANDIDATES
    // =====================================================
    console.log('\n\n📋 3. TESTING CANDIDATES\n');
    
    // READ - Get all candidates
    console.log('   Testing: Get all candidates...');
    const candidates = await Candidate.findAll({ sessionId: 1 });
    console.log(`   ✅ Found ${candidates.length} candidates`);
    if (candidates.length > 0) {
      console.log(`      Sample: ${candidates[0].FirstName} ${candidates[0].LastName}`);
      console.log(`      Department: ${candidates[0].DepartmentName}, Votes: ${candidates[0].TotalVotesReceived}`);
    }
    
    // READ - Get candidate by ID
    if (candidates.length > 0) {
      console.log(`\n   Testing: Get candidate by ID (${candidates[0].CandidateID})...`);
      const candidate = await Candidate.findById(candidates[0].CandidateID);
      console.log(`   ✅ Retrieved: ${candidate.FirstName} ${candidate.LastName}`);
      console.log(`      Category: ${candidate.Category}, Votes: ${candidate.TotalVotesReceived}`);
    }
    
    // CREATE - Create new candidate
    console.log('\n   Testing: Create new candidate...');
    const newCandidate = await Candidate.create({
      sessionId: 1,
      employeeId: 5, // Staff Member
      category: 'Rising Star Award',
      nominatedBy: 2,
      nominationReason: 'Outstanding performance in Q4 2024'
    });
    console.log(`   ✅ Created candidate: ID ${newCandidate.CandidateID}`);
    console.log(`      ${newCandidate.FirstName} ${newCandidate.LastName} - ${newCandidate.Category}`);
    
    // UPDATE - Update candidate
    console.log('\n   Testing: Update candidate...');
    const updatedCandidate = await Candidate.update(newCandidate.CandidateID, {
      nominationReason: 'Updated: Outstanding performance and leadership in Q4 2024',
      status: 'active'
    });
    console.log(`   ✅ Updated: ${updatedCandidate.FirstName} ${updatedCandidate.LastName}`);
    
    // DELETE - Delete test candidate
    console.log('\n   Testing: Delete candidate...');
    await Candidate.delete(newCandidate.CandidateID);
    console.log(`   ✅ Deleted candidate ID ${newCandidate.CandidateID}`);
    
    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL CRUD OPERATIONS TESTED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\nSummary:');
    console.log(`  ✅ Proxy Assignments: CREATE, READ, UPDATE tested`);
    console.log(`  ✅ Resolutions: CREATE, READ, UPDATE, DELETE tested`);
    console.log(`  ✅ Candidates: CREATE, READ, UPDATE, DELETE tested`);
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAllModels();
