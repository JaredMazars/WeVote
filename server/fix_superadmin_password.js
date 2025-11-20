import bcrypt from 'bcryptjs';
import database from './config/database.js';

async function fixSuperAdminPassword() {
  try {
    const password = 'SuperAdmin123!';
    console.log('Generating hash for password:', password);
    
    // Generate proper bcrypt hash
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Generated hash:', hashedPassword);
    
    // Update the super admin user with correct password hash
    const updateSql = `
      UPDATE users 
      SET password_hash = '${hashedPassword}', updated_at = GETDATE()
      WHERE email = 'superadmin@wevote.com'
    `;
    
    console.log('Updating super admin password...');
    await database.query(updateSql);
    
    // Verify the update
    const checkSql = `
      SELECT id, email, password_hash, role_id 
      FROM users 
      WHERE email = 'superadmin@wevote.com'
    `;
    
    const result = await database.query(checkSql);
    if (result && result.length > 0) {
      const user = result[0];
      console.log('✅ Super admin password updated successfully!');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Role ID:', user.role_id);
      console.log('New password hash:', user.password_hash);
      
      // Test the hash
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log('Password verification test:', isValid ? '✅ PASS' : '❌ FAIL');
      
    } else {
      console.log('❌ Super admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing super admin password:', error);
  }
}

fixSuperAdminPassword();
