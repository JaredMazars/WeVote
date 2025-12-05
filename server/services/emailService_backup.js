import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// HTML Email Template - Welcome
const createWelcomeEmailHTML = (userName, userEmail, userPassword) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to WeVote</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">🎉 Welcome to WeVote!</h1>
              <p style="color: #ffffff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">Your account is ready</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #464B4B; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="color: #464B4B; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Your WeVote account has been successfully created! You can now log in and start participating in secure voting.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 12px; border-left: 4px solid #0072CE; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #171C8F; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">🔐 Your Login Credentials</h3>
                    <p style="color: #464B4B; font-size: 14px; margin: 0 0 10px 0;">
                      <strong>Email:</strong> <span style="color: #0072CE;">${userEmail}</span>
                    </p>
                    <p style="color: #464B4B; font-size: 14px; margin: 0;">
                      <strong>Password:</strong> <code style="background-color: #ffffff; padding: 5px 10px; border-radius: 4px; color: #171C8F; font-family: 'Courier New', monospace;">${userPassword}</code>
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Login Now →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 12px; margin: 0;">© 2025 WeVote Platform by Forvis Mazars</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Plain Text Template - Welcome
const createWelcomeEmailText = (userName, userEmail, userPassword) => {
  return `Welcome to WeVote, ${userName}!\n\nYour account has been successfully created.\n\nLOGIN CREDENTIALS:\nEmail: ${userEmail}\nPassword: ${userPassword}\n\nLogin here: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n\n© 2025 WeVote Platform by Forvis Mazars`;
};

// HTML Email Template - Password Reset
const createPasswordResetEmailHTML = (userName, tempPassword) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - WeVote</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">🔐 Password Reset</h1>
              <p style="color: #ffffff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">Your temporary password is ready</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #464B4B; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="color: #464B4B; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password. Here's your temporary password:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 12px; border-left: 4px solid #dc3545; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #dc3545; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">🔑 Temporary Password</h3>
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; border: 2px dashed #dc3545;">
                      <code style="color: #dc3545; font-size: 24px; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 2px;">${tempPassword}</code>
                    </div>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-radius: 8px; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                      ⚠️ <strong>Important:</strong> This is a temporary password. You'll be prompted to create a new password after login.
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Login & Change Password →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 12px; margin: 0;">© 2025 WeVote Platform by Forvis Mazars</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Plain Text Template - Password Reset
const createPasswordResetEmailText = (userName, tempPassword) => {
  return `Password Reset - WeVote\n\nHello ${userName},\n\nWe received a request to reset your password.\n\nTEMPORARY PASSWORD: ${tempPassword}\n\nIMPORTANT: This is a temporary password. You'll be prompted to create a new password after login.\n\nLogin here: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login\n\n© 2025 WeVote Platform by Forvis Mazars`;
};

// Register Email Template
const createRegisterEmailText = (userName) => {
  return `Hello ${userName},\n\nThank you for registering with WeVote!\n\nOur team will review your request shortly. Once approved, you'll receive your login credentials.\n\nWe'll be in touch soon!\n\nThe WeVote Team\n© 2025 WeVote Platform by Forvis Mazars`;
};

// Approval Email Template
const createApprovalEmailText = (userName) => {
  return `Hello ${userName},\n\nCongratulations! Your WeVote account has been approved.\n\nYou now have full access to the platform. Check your email for login credentials.\n\nThe WeVote Team\n© 2025 WeVote Platform by Forvis Mazars`;
};

// Send Welcome Email
export const sendWelcomeEmail = async (userEmail, userName, userPassword) => {
  try {
    console.log(`📧 Preparing welcome email for: ${userEmail}`);
    const mailOptions = {
      from: {
        name: 'WeVote Platform',
        address: process.env.EMAIL_USER || 'noreply@wevote.com'
      },
      to: userEmail,
      subject: '🎉 Welcome to WeVote - Your Account is Ready!',
      html: createWelcomeEmailHTML(userName, userEmail, userPassword),
      text: createWelcomeEmailText(userName, userEmail, userPassword)
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully!');
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Password Reset Email
export const sendPasswordResetEmail = async (userEmail, userName, tempPassword) => {
  try {
    console.log(`📧 Preparing password reset email for: ${userEmail}`);
    const mailOptions = {
      from: {
        name: 'WeVote Platform',
        address: process.env.EMAIL_USER || 'noreply@wevote.com'
      },
      to: userEmail,
      subject: '🔐 Password Reset - WeVote',
      html: createPasswordResetEmailHTML(userName, tempPassword),
      text: createPasswordResetEmailText(userName, tempPassword)
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully!');
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Password reset email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Register Email
export const sendRegisterEmail = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: { name: 'WeVote Platform', address: process.env.EMAIL_USER || 'noreply@wevote.com' },
      to: userEmail,
      subject: '🎉 Welcome to WeVote - Pending Approval',
      text: createRegisterEmailText(userName)
    };
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Send Approval Email
export const sendApproveGoodStandingEmail = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: { name: 'WeVote Platform', address: process.env.EMAIL_USER || 'noreply@wevote.com' },
      to: userEmail,
      subject: '✅ Account Approved - WeVote',
      text: createApprovalEmailText(userName)
    };
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Test connection
export const testConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service ready!');
    return true;
  } catch (error) {
    console.error('❌ Email config error:', error.message);
    return false;
  }
};

export const sendTestEmail = async (testEmail = 'test@example.com') => {
  return await sendWelcomeEmail(testEmail, 'Test User', 'test123');
};

const emailService = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendRegisterEmail,
  sendApproveGoodStandingEmail,
  testConnection,
  sendTestEmail
};

export default emailService;
