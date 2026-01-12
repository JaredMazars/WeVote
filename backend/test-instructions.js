const fetch = require('node-fetch');

async function testInstructions() {
  console.log('🧪 Testing Proxy Instructions Endpoint\n');
  
  try {
    // First, login to get a token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@forvismazars.com',
        password: 'Admin123!'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.token) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginData.token;
    
    // Get proxy assignments first to find one with instructions
    console.log('\n2️⃣ Getting proxy assignments...');
    const assignmentsResponse = await fetch('http://localhost:3001/api/proxy/assignments', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const assignmentsData = await assignmentsResponse.json();
    console.log(`✅ Found ${assignmentsData.count} proxy assignments`);
    
    // Find one with instructions
    const proxyWithInstructions = assignmentsData.data.find(p => p.InstructionCount > 0);
    
    if (!proxyWithInstructions) {
      console.log('⚠️ No proxy assignments with instructions found');
      return;
    }
    
    console.log(`\n📋 Testing proxy ID: ${proxyWithInstructions.ProxyID}`);
    console.log(`   Principal: ${proxyWithInstructions.GrantorFirstName} ${proxyWithInstructions.GrantorLastName}`);
    console.log(`   Proxy Holder: ${proxyWithInstructions.ProxyFirstName} ${proxyWithInstructions.ProxyLastName}`);
    console.log(`   Instruction Count: ${proxyWithInstructions.InstructionCount}`);
    
    // Now test the instructions endpoint
    console.log('\n3️⃣ Fetching instructions...');
    const instructionsResponse = await fetch(
      `http://localhost:3001/api/proxy/instructions/${proxyWithInstructions.ProxyID}`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const instructionsData = await instructionsResponse.json();
    
    console.log(`\n📊 Response Status: ${instructionsResponse.status}`);
    console.log(`✅ Success: ${instructionsData.success}`);
    console.log(`📋 Instructions Count: ${instructionsData.count}`);
    
    if (instructionsData.data && instructionsData.data.length > 0) {
      console.log('\n📝 Instructions Details:');
      instructionsData.data.forEach((instruction, idx) => {
        console.log(`\n   Instruction ${idx + 1}:`);
        console.log(`   - Type: ${instruction.InstructionType}`);
        
        if (instruction.CandidateID) {
          console.log(`   - Candidate: ${instruction.CandidateName || 'N/A'}`);
          console.log(`   - Position: ${instruction.CandidatePosition || 'N/A'}`);
          console.log(`   - Votes to Allocate: ${instruction.VotesToAllocate}`);
        }
        
        if (instruction.ResolutionID) {
          console.log(`   - Resolution: ${instruction.ResolutionTitle || 'N/A'}`);
          console.log(`   - Description: ${instruction.ResolutionDescription || 'N/A'}`);
        }
        
        if (instruction.Notes) {
          console.log(`   - Notes: ${instruction.Notes}`);
        }
      });
    } else {
      console.log('⚠️ No instruction details returned');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testInstructions();
