import sql from 'mssql';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function checkMembershipNumbers() {
  try {
    await sql.connect(dbConfig);
    
    console.log('🔍 Checking for membership number 200:');
    console.log('='.repeat(80));
    
    const member200 = await sql.query(`
      SELECT id, email, name, member_number, role_id, active, is_active
      FROM users 
      WHERE member_number = '200' OR member_number = 200
    `);
    
    if (member200.recordset.length > 0) {
      console.log('\n✅ Found user with membership number 200:');
      member200.recordset.forEach(user => {
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Membership #: ${user.member_number}`);
        console.log(`  Role: ${user.role_id}`);
        console.log(`  Active: ${user.active}/${user.is_active}`);
      });
    } else {
      console.log('❌ No user found with membership number 200');
    }
    
    console.log('\n\n🔍 Checking users with jared in email:');
    console.log('='.repeat(80));
    
    const jaredUsers = await sql.query(`
      SELECT id, email, name, member_number, role_id, active, is_active
      FROM users 
      WHERE email LIKE '%jared%'
      ORDER BY id
    `);
    
    if (jaredUsers.recordset.length > 0) {
      jaredUsers.recordset.forEach(user => {
        console.log(`\n  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Membership #: ${user.member_number || 'NULL'}`);
        console.log(`  Role: ${user.role_id}`);
        console.log(`  Active: ${user.active}/${user.is_active}`);
      });
    }

    console.log('\n\n🔍 All membership numbers:');
    console.log('='.repeat(80));
    
    const allMembers = await sql.query(`
      SELECT id, email, name, member_number, role_id
      FROM users 
      WHERE member_number IS NOT NULL
      ORDER BY CAST(member_number AS INT)
    `);
    
    console.log(`Found ${allMembers.recordset.length} users with membership numbers:\n`);
    allMembers.recordset.forEach(user => {
      console.log(`  #${user.member_number}: ${user.email} (${user.name}) - ID: ${user.id}`);
    });
    
    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMembershipNumbers();
