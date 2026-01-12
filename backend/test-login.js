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

async function testLogin() {
  try {
    await sql.connect(config);
    
    const email = 'employee@forvismazars.com';
    const password = 'employee123';
    
    console.log('🔐 TESTING LOGIN');
    console.log('='.repeat(80));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('');
    
    // Get user
    const result = await sql.query`
      SELECT UserID, Email, PasswordHash, FirstName, LastName, Role
      FROM Users
      WHERE Email = ${email}
    `;
    
    if (result.recordset.length === 0) {
      console.log('❌ User not found!');
      await sql.close();
      return;
    }
    
    const user = result.recordset[0];
    console.log(`✅ User found: ${user.FirstName} ${user.LastName}`);
    console.log(`Role: ${user.Role}`);
    console.log(`Password Hash: ${user.PasswordHash.substring(0, 30)}...`);
    console.log('');
    
    // Test password
    const isValid = await bcrypt.compare(password, user.PasswordHash);
    console.log(`Password validation: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValid) {
      console.log('');
      console.log('⚠️  Password mismatch! Generating new hash for reference:');
      const newHash = await bcrypt.hash(password, 10);
      console.log(`New hash: ${newHash}`);
      
      console.log('');
      console.log('🔧 To fix, run this SQL:');
      console.log(`UPDATE Users SET PasswordHash = '${newHash}' WHERE Email = '${email}'`);
    }
    
    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
