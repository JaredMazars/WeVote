// Quick login test script
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

async function checkUserAuth() {
  try {
    console.log('🔍 Checking user authentication setup...');
    
    await sql.connect(dbConfig);
    
    // Check if we have admin users
    const adminCheck = await sql.query(`
      SELECT TOP 5 id, name, email, role, role_id, is_active 
      FROM users 
      WHERE role IN ('admin', 'super_admin') OR role_id IN (0, 1)
      ORDER BY id
    `);
    
    console.log('\n👥 Admin users found:');
    adminCheck.recordset.forEach(user => {
      console.log(`   ${user.id}: ${user.name || 'No name'} (${user.email}) - Role: ${user.role} (ID: ${user.role_id}) - Active: ${user.is_active}`);
    });

    // Try to find user with ID 171 that was used in test logs
    const testUserCheck = await sql.query(`
      SELECT id, name, email, role, role_id, is_active 
      FROM users 
      WHERE id = '171'
    `);
    
    if (testUserCheck.recordset.length > 0) {
      const user = testUserCheck.recordset[0];
      console.log(`\n🎯 Test user (ID 171): ${user.name || 'No name'} (${user.email}) - Role: ${user.role} (ID: ${user.role_id}) - Active: ${user.is_active}`);
    } else {
      console.log('\n⚠️  Test user (ID 171) not found in users table');
    }

  } catch (error) {
    console.error('❌ Error checking user auth:', error);
  } finally {
    await sql.close();
  }
}

checkUserAuth();
