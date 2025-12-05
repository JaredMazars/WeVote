// Activate admin accounts and test login
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

async function fixAdminAccounts() {
  try {
    await sql.connect(dbConfig);
    
    // Activate user ID 1 (admin@company.com) 
    console.log('🔧 Activating admin@company.com...');
    await sql.query(`
      UPDATE users 
      SET active = 1, is_active = 1 
      WHERE id = 1
    `);
    
    // Also activate user ID 171 (jaredmoodley9@gmail.com) 
    console.log('🔧 Ensuring jaredmoodley9@gmail.com is active...');
    await sql.query(`
      UPDATE users 
      SET active = 1, is_active = 1 
      WHERE id = 171
    `);
    
    console.log('✅ Admin accounts activated');
    
    // Verify the changes
    const result = await sql.query(`
      SELECT id, email, name, role_id, active, is_active 
      FROM users 
      WHERE id IN (1, 171)
    `);
    
    console.log('\n📋 Updated admin accounts:');
    result.recordset.forEach(user => {
      console.log(`ID ${user.id}: ${user.email} | Active: ${user.active}/${user.is_active} | Role: ${user.role_id}`);
    });

  } catch (error) {
    console.error('Error fixing admin accounts:', error);
  } finally {
    await sql.close();
  }
}

fixAdminAccounts();
