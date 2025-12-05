import bcrypt from 'bcrypt';
import database from './config/database.js';

const CUSTOM_SUPERADMIN_CREDENTIALS = {
  email: 'admin.bilal@wevote.com',
  password: 'W3V0t3@dmin2025!',
  name: 'Bilal Administrator',
  memberNumber: 'SA001',
  roleId: 0 // Super Admin role
};

async function createCustomSuperAdmin() {
  try {
    console.log('🔐 Creating custom Super Admin user...\n');

    // Check if user already exists
    const existingUserQuery = `
      SELECT id, email, name, role_id 
      FROM users 
      WHERE email = '${CUSTOM_SUPERADMIN_CREDENTIALS.email}'
    `;
    
    const existingUsers = await database.query(existingUserQuery);

    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  User already exists!');
      console.log('Existing user:', existingUsers[0]);
      
      // Ask if we should update the password
      console.log('\n📝 Updating password and role...');
      
      const hashedPassword = await bcrypt.hash(CUSTOM_SUPERADMIN_CREDENTIALS.password, 10);
      
      const updateQuery = `
        UPDATE users 
        SET password_hash = '${hashedPassword}',
            role_id = ${CUSTOM_SUPERADMIN_CREDENTIALS.roleId},
            name = '${CUSTOM_SUPERADMIN_CREDENTIALS.name}',
            member_number = '${CUSTOM_SUPERADMIN_CREDENTIALS.memberNumber}',
            is_active = 1,
            updated_at = GETDATE()
        WHERE email = '${CUSTOM_SUPERADMIN_CREDENTIALS.email}'
      `;
      
      await database.query(updateQuery);
      console.log('✅ User updated successfully!');
    } else {
      // Create new user
      console.log('📝 Creating new Super Admin user...');
      
      const hashedPassword = await bcrypt.hash(CUSTOM_SUPERADMIN_CREDENTIALS.password, 10);
      
      const insertQuery = `
        INSERT INTO users (
          email,
          password_hash,
          name,
          role_id,
          member_number,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          '${CUSTOM_SUPERADMIN_CREDENTIALS.email}',
          '${hashedPassword}',
          '${CUSTOM_SUPERADMIN_CREDENTIALS.name}',
          ${CUSTOM_SUPERADMIN_CREDENTIALS.roleId},
          '${CUSTOM_SUPERADMIN_CREDENTIALS.memberNumber}',
          1,
          GETDATE(),
          GETDATE()
        )
      `;
      
      await database.query(insertQuery);
      console.log('✅ Super Admin user created successfully!');
    }

    // Verify the user
    console.log('\n🔍 Verifying user...');
    const verifyQuery = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.member_number,
        u.role_id,
        r.name as role_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = '${CUSTOM_SUPERADMIN_CREDENTIALS.email}'
    `;
    
    const verifiedUser = await database.query(verifyQuery);
    
    if (verifiedUser && verifiedUser.length > 0) {
      console.log('\n✨ User Details:');
      console.log('=====================================');
      console.log(`ID:              ${verifiedUser[0].id}`);
      console.log(`Email:           ${verifiedUser[0].email}`);
      console.log(`Name:            ${verifiedUser[0].name}`);
      console.log(`Member Number:   ${verifiedUser[0].member_number}`);
      console.log(`Role ID:         ${verifiedUser[0].role_id}`);
      console.log(`Role Name:       ${verifiedUser[0].role_name || 'N/A'}`);
      console.log(`Active:          ${verifiedUser[0].is_active ? 'Yes' : 'No'}`);
      console.log(`Created:         ${verifiedUser[0].created_at}`);
      console.log('=====================================\n');
      
      console.log('🎉 LOGIN CREDENTIALS:');
      console.log('=====================================');
      console.log(`Email:    ${CUSTOM_SUPERADMIN_CREDENTIALS.email}`);
      console.log(`Password: ${CUSTOM_SUPERADMIN_CREDENTIALS.password}`);
      console.log('=====================================\n');
      
      console.log('✅ Setup complete! You can now login with these credentials.');
      console.log('🔗 Navigate to: http://localhost:5173/super-admin-login\n');
    }

  } catch (error) {
    console.error('❌ Error creating custom super admin:', error);
    throw error;
  }
}

// Run the script
createCustomSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
