const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function verifyEmails() {
  const pool = await sql.connect(config);
  
  try {
    console.log('🔗 Connected to database\n');
    
    // Update all users to have verified emails
    const result = await pool.request()
      .query(`
        UPDATE Users 
        SET IsEmailVerified = 1
        WHERE Email IN ('voter@forvismazars.com', 'admin@forvismazars.com', 'super.admin@forvismazars.com', 'auditor@forvismazars.com')
      `);
    
    console.log(`✅ Updated ${result.rowsAffected[0]} users to have verified emails\n`);
    
    // Verify the update
    const verifyResult = await pool.request()
      .query(`
        SELECT Email, FirstName, LastName, Role, IsEmailVerified 
        FROM Users 
        WHERE Email IN ('voter@forvismazars.com', 'admin@forvismazars.com', 'super.admin@forvismazars.com', 'auditor@forvismazars.com')
        ORDER BY Email
      `);
    
    console.log('========================================');
    console.log('✅ EMAIL VERIFICATION STATUS');
    console.log('========================================\n');
    
    verifyResult.recordset.forEach(user => {
      const status = user.IsEmailVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED';
      console.log(`${status} - ${user.Email}`);
      console.log(`   Name: ${user.FirstName} ${user.LastName}`);
      console.log(`   Role: ${user.Role}\n`);
    });
    
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.close();
  }
}

verifyEmails()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
