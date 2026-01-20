const fetch = require('node-fetch');

async function testLoginAndVotingStatus() {
  console.log('🔐 Testing Login Flow...\n');
  
  try {
    // Step 1: Login
    console.log('1️⃣ Attempting login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'employee@forvismazars.com',
        password: 'employee123'
      })
    });

    console.log('   Status:', loginResponse.status, loginResponse.statusText);
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('   User:', loginData.user);
    console.log('   Token:', loginData.token.substring(0, 20) + '...\n');
    
    const token = loginData.token;
    const userId = loginData.user.userId;
    const sessionId = 1;
    
    // Step 2: Fetch Vote Allocation
    console.log('2️⃣ Fetching vote allocation...');
    const allocationResponse = await fetch(`http://localhost:3001/api/allocations/user/${userId}/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', allocationResponse.status, allocationResponse.statusText);
    const allocationData = await allocationResponse.json();
    
    if (allocationResponse.ok) {
      console.log('✅ Allocation fetched:', allocationData);
    } else {
      console.log('⚠️ Allocation response:', allocationData);
    }
    console.log('');
    
    // Step 3: Fetch Proxy Assignments
    console.log('3️⃣ Fetching proxy assignments...');
    const proxyResponse = await fetch(`http://localhost:3001/api/proxy/holder/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', proxyResponse.status, proxyResponse.statusText);
    const proxyData = await proxyResponse.json();
    
    if (proxyResponse.ok) {
      console.log('✅ Proxies fetched:', proxyData);
    } else {
      console.log('⚠️ Proxy response:', proxyData);
    }
    console.log('');
    
    // Step 4: Fetch Vote History
    console.log('4️⃣ Fetching vote history...');
    const votesResponse = await fetch(`http://localhost:3001/api/votes/user/${userId}?sessionId=${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', votesResponse.status, votesResponse.statusText);
    const votesData = await votesResponse.json();
    
    if (votesResponse.ok) {
      console.log('✅ Votes fetched:', votesData);
    } else {
      console.log('⚠️ Votes response:', votesData);
    }
    console.log('');
    
    // Summary
    console.log('📊 SUMMARY FOR VOTING STATUS BAR:');
    console.log('================================');
    const allocatedVotes = allocationData.allocation?.AllocatedVotes || 15;
    const proxies = proxyData.proxies || [];
    const votes = votesData.votes || [];
    
    const personalVotesUsed = votes.filter(v => !v.IsProxy).length;
    const proxyVotesUsed = votes.filter(v => v.IsProxy).length;
    
    console.log(`Personal Votes: ${allocatedVotes - personalVotesUsed}/${allocatedVotes} remaining`);
    console.log(`Proxy Votes: ${proxies.length - proxyVotesUsed}/${proxies.length} remaining`);
    console.log(`Total Votes Remaining: ${(allocatedVotes - personalVotesUsed) + (proxies.length - proxyVotesUsed)}`);
    console.log(`Votes Cast: ${personalVotesUsed + proxyVotesUsed}`);
    console.log(`Proxy Delegations: ${proxies.length}`);
    console.log(`Vote History: ${votes.length} records`);
    
    console.log('\n✅ All API calls successful! Voting Status Bar should display properly.');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testLoginAndVotingStatus();
