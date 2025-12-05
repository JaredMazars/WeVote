// Check what user accounts exist for login testing
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import sql from 'mssql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'server/.env') });

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

async function checkUserAccounts() {
  try {
    await sql.connect(dbConfig);
    console.log('📋 Available user accounts:');
    
    const result = await sql.query(`
      SELECT TOP 10 id, email, name, role_id, active, is_active, password_hash 
      FROM users 
      WHERE role_id IN (0, 1) OR email LIKE '%admin%'
      ORDER BY id
    `);
    
    result.recordset.forEach(user => {
      console.log(`ID ${user.id}: ${user.email} | ${user.name} | Role: ${user.role_id} | Active: ${user.active}/${user.is_active} | Pass: ${user.password_hash?.substring(0, 20)}...`);
    });

    // Also check the specific user we need (ID 171)
    console.log('\n🎯 Target user (ID 171):');
    const targetUser = await sql.query(`
      SELECT id, email, name, role_id, active, is_active, password_hash 
      FROM users 
      WHERE id = 171
    `);
    
    if (targetUser.recordset.length > 0) {
      const user = targetUser.recordset[0];
      console.log(`ID ${user.id}: ${user.email} | ${user.name} | Role: ${user.role_id} | Active: ${user.active}/${user.is_active}`);
      console.log(`Password hash: ${user.password_hash}`);
      
      // Check if password is plain text or hashed
      if (user.password_hash && !user.password_hash.startsWith('$2b$')) {
        console.log('⚠️  Password appears to be plain text, not hashed');
      }
    }

    // Let's also check which users have been used in audit logs
    console.log('\n📊 Users in audit logs:');
    const auditUsers = await sql.query(`
      SELECT DISTINCT al.user_id, u.email, u.name, u.role_id, COUNT(*) as log_count
      FROM audit_logs al
      LEFT JOIN users u ON TRY_CAST(al.user_id AS INT) = u.id
      WHERE al.user_id IS NOT NULL
      GROUP BY al.user_id, u.email, u.name, u.role_id
      ORDER BY log_count DESC
    `);
    
    auditUsers.recordset.forEach(user => {
      console.log(`User ${user.user_id}: ${user.email || 'Unknown'} | ${user.name || 'Unknown'} | Role: ${user.role_id || 'Unknown'} | ${user.log_count} logs`);
    });

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await sql.close();
  }
}

checkUserAccounts();
