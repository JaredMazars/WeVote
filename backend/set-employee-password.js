const { executeQuery } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function setKnownPassword() {
  try {
    const email = 'employee@forvismazars.com';
    const newPassword = 'employee123';
    
    console.log(`\n🔑 Setting known password for ${email}...\n`);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user
    const updateQuery = `
      UPDATE Users 
      SET PasswordHash = @hashedPassword,
          Salt = @salt,
          RequiresPasswordChange = 0,
          IsEmailVerified = 1
      WHERE Email = @email
    `;
    
    await executeQuery(updateQuery, {
      hashedPassword,
      salt,
      email
    });
    
    console.log('✅ Password updated successfully!\n');
    console.log('='.repeat(60));
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log(`Email:    ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log('='.repeat(60));
    console.log('\n✨ You can now login with these credentials!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setKnownPassword();
