const sql = require('mssql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  port: 1433,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function fixSuperAdmin() {
  try {
    await sql.connect(config);
    
    // Check all super admin accounts
    const allSuperAdmins = await sql.query`
      SELECT UserID, Email, Role, FirstName, LastName 
      FROM Users 
      WHERE Role = 'super_admin'
    `;
    
    console.log('\n📋 All Super Admin Accounts:\n');
    allSuperAdmins.recordset.forEach(u => {
      console.log(`   UserID: ${u.UserID}`);
      console.log(`   Email: ${u.Email}`);
      console.log(`   Name: ${u.FirstName} ${u.LastName}\n`);
    });
    
    // Check if super.admin@forvismazars.com exists
    const superDotAdmin = await sql.query`
      SELECT UserID, Email, Role FROM Users 
      WHERE Email = 'super.admin@forvismazars.com'
    `;
    
    if (superDotAdmin.recordset.length === 0) {
      console.log('❌ super.admin@forvismazars.com NOT FOUND\n');
      console.log('🔧 Creating super.admin@forvismazars.com account...\n');
      
      const newHash = await bcrypt.hash('SuperAdmin@2026', 10);
      
      await sql.query`
        INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, IsEmailVerified, IsActive)
        VALUES ('super.admin@forvismazars.com', ${newHash}, 'Super', 'Admin', 'super_admin', 1, 1)
      `;
      
      console.log('✅ Created super.admin@forvismazars.com\n');
    } else {
      console.log('✅ super.admin@forvismazars.com EXISTS\n');
      console.log('🔧 Resetting password...\n');
      
      const newHash = await bcrypt.hash('SuperAdmin@2026', 10);
      
      await sql.query`
        UPDATE Users 
        SET PasswordHash = ${newHash}, IsEmailVerified = 1, IsActive = 1, Role = 'super_admin'
        WHERE Email = 'super.admin@forvismazars.com'
      `;
      
      console.log('✅ Password reset complete\n');
    }
    
    console.log('🎯 Login Credentials:');
    console.log('   Email: super.admin@forvismazars.com');
    console.log('   Password: SuperAdmin@2026\n');
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixSuperAdmin();
