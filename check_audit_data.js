// Simple test script without external dependencies
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

async function checkAuditLogsInDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    // Check if audit_logs table exists and has data
    const result = await sql.query(`
      SELECT TOP 10 
        id, action_category, action_type, user_id, status, 
        description, created_at, ip_address
      FROM audit_logs 
      ORDER BY created_at DESC
    `);

    console.log(`📊 Found ${result.recordset.length} audit logs in database:`);
    console.log('');
    
    result.recordset.forEach((log, index) => {
      console.log(`${index + 1}. [${log.action_category}] ${log.action_type}`);
      console.log(`   User ID: ${log.user_id || 'N/A'}`);
      console.log(`   Status: ${log.status}`);
      console.log(`   Description: ${log.description}`);
      console.log(`   Created: ${log.created_at}`);
      console.log(`   IP: ${log.ip_address || 'N/A'}`);
      console.log('');
    });

    // Check total count
    const countResult = await sql.query('SELECT COUNT(*) as total FROM audit_logs');
    console.log(`📈 Total audit logs in database: ${countResult.recordset[0].total}`);

  } catch (error) {
    console.error('❌ Error checking audit logs:', error);
  } finally {
    await sql.close();
  }
}

checkAuditLogsInDatabase();
