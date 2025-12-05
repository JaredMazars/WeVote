// Simple test using built-in fetch (Node 18+)
import fetch from 'node-fetch'; // If this fails, we'll use a different approach

async function testAuditAPI() {
  try {
    console.log('🧪 Testing audit logs API directly...');
    
    const response = await fetch('http://localhost:3001/api/audit-logs');
    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📋 Response data:', data);
    
    if (response.status === 401) {
      console.log('✅ API is working - requires authentication as expected');
      console.log('💡 Frontend should use Bearer token in Authorization header');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('MODULE_NOT_FOUND')) {
      console.log('💡 node-fetch not available, trying alternative...');
      
      // Alternative using native http module
      const http = await import('http');
      
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/audit-logs',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('📡 Status:', res.statusCode);
          console.log('📋 Response:', data);
        });
      });
      
      req.on('error', (err) => console.error('❌ Request error:', err));
      req.end();
    }
  }
}

testAuditAPI();
