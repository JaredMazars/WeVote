// Quick test to verify email service works
require('dotenv').config();
const { sendSessionAssignmentEmail } = require('./src/services/emailService');

async function testEmail() {
  try {
    console.log('Testing email service...');
    console.log('SMTP Configuration:');
    console.log('- Host:', process.env.SMTP_HOST);
    console.log('- Port:', process.env.SMTP_PORT);
    console.log('- User:', process.env.SMTP_USER);
    console.log('- Password:', process.env.SMTP_PASSWORD ? '****' : 'NOT SET');
    
    const result = await sendSessionAssignmentEmail({
      email: process.env.SMTP_USER, // Send to yourself for testing
      firstName: 'Test Admin',
      sessionTitle: '2024 Annual General Meeting',
      sessionDate: 'Wednesday, December 8, 2025 at 02:00 PM',
      role: 'admin'
    });
    
    console.log('\n✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('\nCheck your inbox at:', process.env.SMTP_USER);
    
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    console.error('\nPlease check:');
    console.error('1. SMTP_USER and SMTP_PASSWORD are correct in .env');
    console.error('2. If using Gmail, you need an App Password (not your regular password)');
    console.error('3. Enable "Less secure app access" or use App Passwords in Gmail');
  }
  process.exit(0);
}

testEmail();
