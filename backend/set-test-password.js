const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: { encrypt: true, trustServerCertificate: true }
};

(async () => {
  try {
    await sql.connect(config);
    
    const testPassword = 'TestUser@123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(testPassword, salt);
    
    const users = await sql.query`
      SELECT TOP 10 UserID, Email, FirstName, LastName, IsActive
      FROM Users 
      WHERE Email LIKE '%@forvismazars.com'
      AND Email NOT LIKE 'admin%'
      AND Email NOT LIKE 'super%'
      AND Email NOT LIKE 'auditor%'
      ORDER BY CreatedAt DESC
    `;
    
    console.log('\n');
    console.log('  TEST USER CREDENTIALS SETUP                           ');
    console.log('\n');
    
    let approved = users.recordset.filter(u => u.IsActive === 1 || u.IsActive === true);
    
    if (approved.length === 0) {
      console.log(' No approved test users found.\n');
      console.log('Pending users that need approval:');
      users.recordset.filter(u => !u.IsActive).forEach(u => {
        console.log(`   ID ${u.UserID}: ${u.Email}`);
      });
    } else {
      console.log('Setting password: TestUser@123\n');
      
      for (const user of approved) {
        await sql.query`
          UPDATE Users 
          SET PasswordHash = ${hash}, 
              Salt = ${salt},
              RequiresPasswordChange = 0
          WHERE UserID = ${user.UserID}
        `;
        
        console.log(` ${user.Email}`);
        console.log(`   Name: ${user.FirstName} ${user.LastName}`);
        console.log(`   Password: TestUser@123`);
        console.log('');
      }
      
      console.log('');
      console.log('You can now login with these credentials!');
      console.log('\n');
    }
    
    await sql.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
