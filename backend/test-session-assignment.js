// =====================================================
// Test Session Assignment Email with Password
// =====================================================

const { executeQuery } = require('./src/config/database');
const { sendSessionAssignmentEmail } = require('./src/services/emailService');

async function testSessionAssignment() {
  try {
    console.log('Testing session assignment email...\n');

    // Get a test user
    const getUserQuery = `
      SELECT TOP 1 
        UserID, Email, FirstName, LastName, Role, RequiresPasswordChange
      FROM Users
      WHERE Role IN ('admin', 'auditor')
      ORDER BY UserID DESC
    `;
    
    const userResult = await executeQuery(getUserQuery);
    const user = userResult.recordset[0];

    if (!user) {
      console.log('❌ No admin/auditor users found');
      process.exit(1);
    }

    console.log('Test User:', {
      UserID: user.UserID,
      Email: user.Email,
      FirstName: user.FirstName,
      Role: user.Role,
      RequiresPasswordChange: user.RequiresPasswordChange
    });

    // Generate a test password
    const crypto = require('crypto');
    const testPassword = crypto.randomBytes(6).toString('hex');

    console.log('\nGenerated Password:', testPassword);
    console.log('\nSending test email...');

    // Send test email WITH password
    await sendSessionAssignmentEmail({
      email: user.Email,
      firstName: user.FirstName,
      sessionTitle: 'TEST SESSION - 2026 Annual Meeting',
      sessionDate: 'Thursday, January 9, 2026, 10:00 AM',
      role: user.Role,
      password: testPassword // Always send for testing
    });

    console.log('\n✅ Test email sent successfully!');
    console.log('Check your inbox:', user.Email);
    console.log('\nThe email should include:');
    console.log('  - Session details');
    console.log('  - Yellow box with password:', testPassword);
    console.log('  - Warning about changing password on first login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSessionAssignment();
