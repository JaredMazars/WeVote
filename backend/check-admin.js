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

async function checkAdmins() {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT UserID, Email, FirstName, LastName, Role, PasswordHash
      FROM Users 
      WHERE Email LIKE '%admin%' OR Role = 'admin'
      ORDER BY UserID
    `;
    
    console.log('🔍 ADMIN USERS FOUND:');
    console.log('='.repeat(80));
    result.recordset.forEach(user => {
      console.log(`ID: ${user.UserID}`);
      console.log(`Email: ${user.Email}`);
      console.log(`Name: ${user.FirstName} ${user.LastName}`);
      console.log(`Role: ${user.Role}`);
      console.log(`Has Password: ${user.PasswordHash ? 'YES' : 'NO'}`);
      console.log('-'.repeat(80));
    });
    
    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAdmins();
