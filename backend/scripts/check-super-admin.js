const sql = require('mssql');
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

async function checkSuperAdmin() {
  try {
    await sql.connect(config);
    
    const result = await sql.query`
      SELECT UserID, Email, Role, FirstName, LastName 
      FROM Users 
      WHERE Role = 'super_admin'
    `;
    
    console.log('\n🔐 Super Admin Users:\n');
    
    if (result.recordset.length === 0) {
      console.log('❌ No super admin users found!\n');
    } else {
      result.recordset.forEach(u => {
        console.log(`   Email: ${u.Email}`);
        console.log(`   Name: ${u.FirstName} ${u.LastName}`);
        console.log(`   Role: ${u.Role}`);
        console.log(`   UserID: ${u.UserID}\n`);
      });
      
      console.log('📋 Login with:');
      console.log('   Email: super.admin@forvismazars.com');
      console.log('   Password: SuperAdmin@2026');
      console.log('\n✨ After login, look for the blue "Super Admin" button in the navbar!\n');
    }
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSuperAdmin();
