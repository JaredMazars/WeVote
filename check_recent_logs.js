import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function checkRecentLogs() {
  try {
    console.log('📡 Connecting to database...');
    const pool = await sql.connect(config);
    
    console.log('✅ Connected! Fetching recent audit logs...\n');
    
    const result = await pool.request()
      .query('SELECT TOP 10 * FROM audit_logs ORDER BY created_at DESC');
    
    console.log(`📊 Found ${result.recordset.length} recent logs:\n`);
    
    result.recordset.forEach((log, index) => {
      console.log(`🔹 Log #${index + 1}`);
      console.log(`   ID:          ${log.id}`);
      console.log(`   Category:    ${log.action_category}`);
      console.log(`   Action:      ${log.action_type}`);
      console.log(`   Description: ${log.description}`);
      console.log(`   User ID:     ${log.user_id || 'N/A'}`);
      console.log(`   Status:      ${log.status}`);
      console.log(`   IP Address:  ${log.ip_address || 'N/A'}`);
      console.log(`   Created:     ${log.created_at}`);
      console.log('   ---\n');
    });
    
    await pool.close();
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkRecentLogs();
