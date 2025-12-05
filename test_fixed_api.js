// Test the fixed audit logs API
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'server/.env') });

async function testAuditLogsAPIFixed() {
  try {
    console.log('🧪 Testing fixed audit logs API...');
    
    // Make a direct API call without authentication to test the query
    const response = await fetch('http://localhost:3001/api/audit-logs', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(`📡 Response status: ${response.status}`);
    console.log('📊 API Response:', JSON.stringify(result, null, 2));

    // The response should show an authentication error but not a database error

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testAuditLogsAPIFixed();
