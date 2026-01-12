// =====================================================
// Fix Deleted User - Restore email and role
// =====================================================

const { executeQuery } = require('./src/config/database');

async function fixDeletedUser() {
  try {
    console.log('Fixing deleted user ID 16...');

    // Restore the email by removing the "deleted_16_" prefix
    const fixEmail = `
      UPDATE Users
      SET Email = REPLACE(Email, 'deleted_16_', ''),
          Role = 'user',
          IsActive = 1
      WHERE UserID = 16
        AND Email LIKE 'deleted_16_%'
    `;

    await executeQuery(fixEmail);
    console.log('✓ User 16 restored successfully');
    console.log('  - Email restored to: jaredmoodley9@gmail.com');
    console.log('  - Role set to: user');
    console.log('  - Account activated');

    // Verify the fix
    const verify = `
      SELECT UserID, Email, Role, IsActive
      FROM Users
      WHERE UserID = 16
    `;
    
    const result = await executeQuery(verify);
    console.log('\nVerification:');
    console.log(result.recordset[0]);

    process.exit(0);
  } catch (error) {
    console.error('Error fixing user:', error);
    process.exit(1);
  }
}

fixDeletedUser();
