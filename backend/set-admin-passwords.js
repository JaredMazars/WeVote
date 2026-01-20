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
    
    const adminEmails = ['admin@wevote.com', 'superadmin@wevote.com', 'auditor@wevote.com'];
    const passwords = {
      'admin@wevote.com': 'Admin123!',
      'superadmin@wevote.com': 'Super123!',
      'auditor@wevote.com': 'Audit123!'
    };
    
    console.log('\n=== SETTING ADMIN PASSWORDS ===\n');
    
    for (const email of adminEmails) {
      const password = passwords[email];
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(password, salt);
      
      const result = await sql.query`
        UPDATE Users 
        SET PasswordHash = ${hash}, Salt = ${salt}, IsActive = 1, RequiresPasswordChange = 0
        WHERE Email = ${email}
      `;
      
      if (result.rowsAffected[0] > 0) {
        console.log(`✓ ${email}`);
        console.log(`  Password: ${password}\n`);
      } else {
        console.log(`✗ ${email} - User not found\n`);
      }
    }
    
    console.log('=== ADMIN CREDENTIALS ===');
    console.log('admin@wevote.com / Admin123!');
    console.log('superadmin@wevote.com / Super123!');
    console.log('auditor@wevote.com / Audit123!\n');
    
    await sql.close();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
