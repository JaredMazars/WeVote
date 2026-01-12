const bcrypt = require('bcryptjs');
const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function resetPasswords() {
  try {
    await sql.connect(config);
    
    // Admin accounts with their passwords
    const accounts = [
      { email: 'superadmin@wevote.com', password: 'SuperAdmin123!', name: 'Super Admin' },
      { email: 'admin@wevote.com', password: 'Admin123!', name: 'Admin User' },
      { email: 'superadmin@forvismazars.com', password: 'SuperAdmin123!', name: 'Super Administrator' },
      { email: 'admin@forvismazars.com', password: 'Admin123!', name: 'John Administrator' },
    ];
    
    console.log('🔐 RESETTING ADMIN PASSWORDS');
    console.log('='.repeat(80));
    
    for (const account of accounts) {
      console.log(`\n📧 ${account.email} (${account.name})`);
      console.log(`   Password: ${account.password}`);
      
      // Generate new hash
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(account.password, salt);
      
      // Update in database
      const result = await sql.query`
        UPDATE Users 
        SET PasswordHash = ${passwordHash}, Salt = ${salt}
        WHERE Email = ${account.email}
      `;
      
      if (result.rowsAffected[0] > 0) {
        console.log('   ✅ Password updated successfully');
        
        // Verify the password works
        const testResult = await sql.query`SELECT PasswordHash FROM Users WHERE Email = ${account.email}`;
        const storedHash = testResult.recordset[0].PasswordHash;
        const isValid = await bcrypt.compare(account.password, storedHash);
        console.log(`   🔍 Verification: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
      } else {
        console.log('   ❌ User not found!');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL PASSWORDS RESET SUCCESSFULLY!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   admin@forvismazars.com / Admin123!');
    console.log('   superadmin@forvismazars.com / SuperAdmin123!');
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetPasswords();
