const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function checkUser() {
  try {
    await sql.connect(config);
    
    // Check if user exists
    const result = await sql.query`
      SELECT UserID, Email, FirstName, LastName, Role, IsActive, PasswordHash
      FROM Users 
      WHERE Email = 'employee@forvismazars.com'
    `;
    
    if (result.recordset.length === 0) {
      console.log('❌ User not found. Creating user...');
      
      // Create the user
      const passwordHash = await bcrypt.hash('employee123', 12);
      
      await sql.query`
        INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, IsActive)
        VALUES ('employee@forvismazars.com', ${passwordHash}, 'Employee', 'User', 'employee', 1)
      `;
      
      console.log('✅ User created successfully');
      
      // Fetch the newly created user
      const newUser = await sql.query`
        SELECT UserID, Email, FirstName, LastName, Role, IsActive
        FROM Users 
        WHERE Email = 'employee@forvismazars.com'
      `;
      
      console.log('\n📋 User Details:');
      console.log(newUser.recordset[0]);
    } else {
      console.log('✅ User found:');
      console.log(result.recordset[0]);
      
      // Test password
      const user = result.recordset[0];
      const passwordMatch = await bcrypt.compare('employee123', user.PasswordHash);
      
      console.log('\n🔐 Password test:');
      console.log('Password matches:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('\n⚠️ Password does not match. Updating password...');
        const newPasswordHash = await bcrypt.hash('employee123', 12);
        await sql.query`
          UPDATE Users 
          SET PasswordHash = ${newPasswordHash}
          WHERE Email = 'employee@forvismazars.com'
        `;
        console.log('✅ Password updated');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
