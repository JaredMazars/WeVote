// =====================================================
// Fix Email Verification for Existing Admins
// =====================================================

const { executeQuery } = require('./src/config/database');

async function fixAdminEmailVerification() {
  try {
    console.log('Fixing email verification for existing admins...\n');

    // Update all admin/auditor users to have IsEmailVerified = 1
    const updateQuery = `
      UPDATE Users
      SET IsEmailVerified = 1
      WHERE Role IN ('admin', 'auditor', 'super_admin')
        AND IsEmailVerified = 0
    `;

    const result = await executeQuery(updateQuery);
    console.log(`✓ Updated ${result.rowsAffected[0]} admin/auditor accounts`);

    // Verify the fix
    const verifyQuery = `
      SELECT UserID, Email, Role, IsEmailVerified, RequiresPasswordChange
      FROM Users
      WHERE Role IN ('admin', 'auditor', 'super_admin')
      ORDER BY UserID
    `;
    
    const verifyResult = await executeQuery(verifyQuery);
    console.log('\nAll admin/auditor users:');
    console.table(verifyResult.recordset);

    process.exit(0);
  } catch (error) {
    console.error('Error fixing email verification:', error);
    process.exit(1);
  }
}

fixAdminEmailVerification();
