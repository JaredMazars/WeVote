// Test the exact query used by the AuditLog model
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'server/.env') });

import sql from 'mssql';

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function testAuditLogQuery() {
  try {
    console.log('🔄 Connecting to database...');
    await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    // Test the exact query from AuditLog.getAll
    const query = `
      SELECT 
        al.id,
        al.user_id,
        u.name as user_name,
        u.email as user_email,
        al.action_type,
        al.action_category,
        al.description,
        al.entity_type,
        al.entity_id,
        al.metadata,
        al.ip_address,
        al.user_agent,
        al.status,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
      ORDER BY al.created_at DESC
      OFFSET 0 ROWS
      FETCH NEXT 50 ROWS ONLY
    `;

    console.log('📋 Testing AuditLog.getAll query...');
    const result = await sql.query(query);
    
    console.log(`📊 Query returned ${result.recordset.length} records`);
    
    if (result.recordset.length > 0) {
      console.log('\n✅ Sample record:');
      const sample = result.recordset[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   User ID: ${sample.user_id}`);
      console.log(`   User Name: ${sample.user_name || 'N/A'}`);
      console.log(`   User Email: ${sample.user_email || 'N/A'}`);
      console.log(`   Action Category: ${sample.action_category}`);
      console.log(`   Action Type: ${sample.action_type}`);
      console.log(`   Description: ${sample.description}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Created At: ${sample.created_at}`);
      console.log(`   IP Address: ${sample.ip_address}`);
    }

    // Also check if users table exists
    console.log('\n🔍 Checking users table...');
    try {
      const userCheck = await sql.query('SELECT TOP 1 * FROM users WHERE id = 171');
      console.log('✅ Users table accessible');
      if (userCheck.recordset.length > 0) {
        console.log(`   Found user: ${userCheck.recordset[0].name || 'No name'} (${userCheck.recordset[0].email || 'No email'})`);
      }
    } catch (userError) {
      console.log('⚠️  Users table issue:', userError.message);
    }

  } catch (error) {
    console.error('❌ Error testing query:', error);
  } finally {
    await sql.close();
  }
}

testAuditLogQuery();
