// Quick test of admin dashboard APIs
const testEndpoints = async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImVtYWlsIjoiYWRtaW5AZm9ydmlzbWF6YXJzLmNvbSIsInJvbGUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbklkIjoxLCJpYXQiOjE3NjUyNjkwNTksImV4cCI6MTc2NTM1NTQ1OX0.Expy2TIAgCBk_kjuEsaFTicKbNkIpB_c7tcMcJb1le0';
  
  console.log('🧪 TESTING ADMIN DASHBOARD APIs\n');
  console.log('='.repeat(80));
  
  // Test 1: Resolutions
  console.log('\n📋 TEST 1: Resolutions API');
  try {
    const resResponse = await fetch('http://localhost:3001/api/resolutions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const resData = await resResponse.json();
    console.log('Status:', resResponse.status);
    console.log('Response structure:', Object.keys(resData));
    console.log('Success:', resData.success);
    console.log('Data count:', resData.data?.length || resData.count || 0);
    if (resData.data && resData.data[0]) {
      console.log('First resolution FULL:', resData.data[0]);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  
  // Test 2: Proxy Assignments
  console.log('\n🤝 TEST 2: Proxy Assignments API');
  try {
    const proxyResponse = await fetch('http://localhost:3001/api/proxy/assignments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const proxyData = await proxyResponse.json();
    console.log('Status:', proxyResponse.status);
    console.log('Response structure:', Object.keys(proxyData));
    console.log('Success:', proxyData.success);
    console.log('Data count:', proxyData.data?.length || proxyData.count || 0);
    if (proxyData.data && proxyData.data[0]) {
      console.log('First proxy:', {
        ProxyID: proxyData.data[0].ProxyID,
        Principal: `${proxyData.data[0].GrantorFirstName} ${proxyData.data[0].GrantorLastName}`,
        ProxyHolder: `${proxyData.data[0].ProxyFirstName} ${proxyData.data[0].ProxyLastName}`,
        Type: proxyData.data[0].ProxyType
      });
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ API TEST COMPLETE');
};

testEndpoints();
