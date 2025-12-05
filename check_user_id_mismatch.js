// Check user_id data types and values
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import sql from 'mssql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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

async function checkUserIdMismatch() {
  try {
    console.log('🔍 Checking user_id data type mismatch...');
    
    await sql.connect(dbConfig);
    
    // Check audit_logs user_id values
    console.log('\n📋 Audit logs user_id values:');
    const auditUserIds = await sql.query(`
      SELECT DISTINCT user_id, COUNT(*) as count
      FROM audit_logs 
      WHERE user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY user_id
    `);
    
    auditUserIds.recordset.forEach(row => {
      console.log(`   user_id: '${row.user_id}' (${row.count} entries)`);
    });

    // Check users table id values
    console.log('\n👥 Users table id values:');
    const userIds = await sql.query(`
      SELECT id, name, email
      FROM users
      ORDER BY id
    `);
    
    userIds.recordset.forEach(user => {
      console.log(`   id: ${user.id} (${typeof user.id}) - ${user.name} (${user.email})`);
    });

    // Try the problematic query with CAST
    console.log('\n🔧 Testing fixed query with CAST...');
    const fixedQuery = await sql.query(`
      SELECT TOP 3
        al.id,
        al.user_id,
        u.name as user_name,
        u.email as user_email,
        al.action_type,
        al.action_category,
        al.description,
        al.status,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON CAST(al.user_id AS INT) = u.id
      ORDER BY al.created_at DESC
    `);
    
    console.log('✅ Fixed query results:');
    fixedQuery.recordset.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.action_category}] ${log.action_type} - User: ${log.user_name || 'N/A'} (ID: ${log.user_id})`);
    });

  } catch (error) {
    console.error('❌ Error checking user_id mismatch:', error);
  } finally {
    await sql.close();
  }
}

checkUserIdMismatch();
