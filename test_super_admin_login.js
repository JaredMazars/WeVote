import bcrypt from 'bcryptjs';
import database from './server/config/database.js';

async function testSuperAdminLogin() {
  console.log('🔍 Testing Super Admin Login...\n');

  try {
    // 1. Check if super admin exists
    console.log('1. Checking if super admin exists...');
    const checkSql = `
      SELECT u.id, u.email, u.name, u.password_hash, 
             r.name as role_name, r.id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = 'superadmin@wevote.com'
    `;
    
    const userResults = await database.query(checkSql);
    
    if (!userResults || userResults.length === 0) {
      console.log('❌ Super admin user not found!');
      return;
    }
    
    const user = userResults[0];
    console.log('✅ Super admin found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role_name: user.role_name,
      role_id: user.role_id,
      password_hash_length: user.password_hash ? user.password_hash.length : 0
    });

    // 2. Test current password
    console.log('\n2. Testing current password...');
    const testPassword = 'SuperAdmin123!';
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`Password "${testPassword}" is valid:`, isValidPassword);

    if (!isValidPassword) {
      console.log('\n3. Generating new password hash...');
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('New hash generated:', newHash);
      
      console.log('\n4. Updating password in database...');
      const updateSql = `
        UPDATE users 
        SET password_hash = '${newHash}', updated_at = GETDATE()
        WHERE id = ${user.id}
      `;
      
      await database.query(updateSql);
      console.log('✅ Password updated successfully!');
      
      // Test the new password
      console.log('\n5. Testing new password...');
      const isNewPasswordValid = await bcrypt.compare(testPassword, newHash);
      console.log(`New password "${testPassword}" is valid:`, isNewPasswordValid);
    } else {
      console.log('✅ Password is already correct!');
    }

    // 6. Test full login flow simulation
    console.log('\n6. Testing login flow simulation...');
    const loginTestSql = `
      SELECT u.id, u.email, u.password_hash, u.name, u.surname, u.avatar_url, 
             u.role_id, u.is_active, u.email_verified, u.last_login,
             u.created_at, u.updated_at,
             r.name as role_name, r.description as role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = 'superadmin@wevote.com' AND u.is_active = 1
    `;
    
    const loginResults = await database.query(loginTestSql);
    const loginUser = loginResults[0];
    
    if (!loginUser) {
      console.log('❌ User not found or not active');
      return;
    }
    
    const finalPasswordTest = await bcrypt.compare(testPassword, loginUser.password_hash);
    
    console.log('Login simulation result:', {
      userFound: !!loginUser,
      isActive: loginUser.is_active,
      passwordValid: finalPasswordTest,
      role: loginUser.role_name
    });
    
    if (loginUser && finalPasswordTest) {
      console.log('\n✅ Super admin login should work now!');
      console.log('Credentials:');
      console.log('  Email: superadmin@wevote.com');
      console.log('  Password: SuperAdmin123!');
    } else {
      console.log('\n❌ There are still issues with the login');
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testSuperAdminLogin()
  .then(() => {
    console.log('\n🔄 Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
