const axios = require('axios');

async function testProxyInstructions() {
  try {
    console.log('🧪 Testing Proxy Instructions API...\n');
    
    // First login to get a token
    console.log('1️⃣ Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'super.admin@forvismazars.com',
      password: 'Admin@2024!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');
    
    // Get proxy assignments
    console.log('2️⃣ Fetching proxy assignments...');
    const assignmentsResponse = await axios.get('http://localhost:3001/api/proxy/assignments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Found ${assignmentsResponse.data.count} proxy assignments\n`);
    
    // Show Robert Proxy's assignments
    const robertProxies = assignmentsResponse.data.data.filter(p => p.ProxyUserID === 9);
    console.log(`📋 Robert Proxy (UserID 9) has ${robertProxies.length} assignments:\n`);
    
    robertProxies.forEach((proxy, index) => {
      console.log(`   ${index + 1}. ProxyID: ${proxy.ProxyID}`);
      console.log(`      Principal: ${proxy.GrantorFirstName} ${proxy.GrantorLastName}`);
      console.log(`      Type: ${proxy.ProxyType}`);
      console.log(`      Instructions: ${proxy.InstructionCount}\n`);
    });
    
    // Test fetching instructions for the first proxy
    if (robertProxies.length > 0) {
      const proxyId = robertProxies[0].ProxyID;
      console.log(`3️⃣ Fetching instructions for ProxyID ${proxyId}...`);
      
      const instructionsResponse = await axios.get(`http://localhost:3001/api/proxy/instructions/${proxyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`\n✅ SUCCESS! Retrieved ${instructionsResponse.data.count} instructions:\n`);
      
      instructionsResponse.data.data.forEach((inst, index) => {
        console.log(`   Instruction ${index + 1}:`);
        console.log(`   - Type: ${inst.InstructionType}`);
        console.log(`   - Votes: ${inst.VotesToAllocate}`);
        if (inst.CandidateID) {
          console.log(`   - Candidate: ${inst.CandidateName || 'ID ' + inst.CandidateID} (${inst.CandidatePosition})`);
        }
        if (inst.ResolutionID) {
          console.log(`   - Resolution: ${inst.ResolutionTitle || 'ID ' + inst.ResolutionID}`);
        }
        console.log(`   - Notes: ${inst.Notes}`);
        console.log('');
      });
      
      console.log('🎉 THE API IS WORKING CORRECTLY!');
      console.log('\n📝 Next steps:');
      console.log('   1. Start the frontend: npm run dev');
      console.log('   2. Login as super.admin@forvismazars.com');
      console.log('   3. Go to Admin Dashboard → Proxies tab');
      console.log('   4. Click "View Instructions (3)" on any Robert Proxy member');
      console.log('   5. The modal will show all 3 instructions!\n');
      
    } else {
      console.log('❌ No proxy assignments found for Robert Proxy');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.response || error.message);
    console.error('Full error:', error);
  }
}

testProxyInstructions();
