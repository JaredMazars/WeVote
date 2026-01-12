const sql = require('mssql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function checkAdminPassword() {
  try {
    console.log('\n🔍 Checking admin user password...\n');
    
    await sql.connect(config);
    
    // Get admin user
    const result = await sql.query`
      SELECT UserID, Email, PasswordHash, FirstName, LastName, Role 
      FROM Users 
      WHERE Email = 'admin@forvismazars.com'
    `;
    
    if (result.recordset.length === 0) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    const admin = result.recordset[0];
    console.log('✅ Admin user found:');
    console.log(`   UserID: ${admin.UserID}`);
    console.log(`   Email: ${admin.Email}`);
    console.log(`   Name: ${admin.FirstName} ${admin.LastName}`);
    console.log(`   Role: ${admin.Role}`);
    console.log(`   Current Hash: ${admin.PasswordHash.substring(0, 20)}...`);
    
    // Test password
    const testPassword = 'Admin@2026';
    const isValid = await bcrypt.compare(testPassword, admin.PasswordHash);
    
    console.log(`\n🔐 Password Test:`);
    console.log(`   Testing: ${testPassword}`);
    console.log(`   Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValid) {
      console.log('\n🔧 Resetting password to: Admin@2026');
      const newHash = await bcrypt.hash('Admin@2026', 10);
      
      await sql.query`
        UPDATE Users 
        SET PasswordHash = ${newHash}
        WHERE Email = 'admin@forvismazars.com'
      `;
      
      console.log('✅ Password updated successfully!');
    }
    
    console.log('\n📋 Credentials:');
    console.log('   Email: admin@forvismazars.com');
    console.log('   Password: Admin@2026\n');
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminPassword();
