// =====================================================
// Email Service - Send emails using nodemailer
// =====================================================

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Send admin credentials email
 */
const sendAdminCredentialsEmail = async ({ email, firstName, password, role }) => {
  try {
    const roleLabel = role === 'admin' ? 'Admin' : 'Auditor';
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Welcome to WeVote - Your ${roleLabel} Account`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-left: 4px solid #0072CE; margin: 20px 0; border-radius: 5px; }
            .credential-row { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #464B4B; }
            .credential-value { background: #f4f4f4; padding: 8px 12px; border-radius: 5px; font-family: monospace; margin-top: 5px; display: inline-block; }
            .button { display: inline-block; background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to WeVote</h1>
              <p>Your ${roleLabel} account has been created</p>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              
              <p>You have been added as <strong>${roleLabel}</strong> for the WeVote voting platform. Below are your login credentials:</p>
              
              <div class="credentials">
                <div class="credential-row">
                  <div class="credential-label">Email Address:</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-row">
                  <div class="credential-label">Temporary Password:</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <p style="margin: 10px 0 0 0;">For security reasons, you will be required to change this password upon your first login. Please keep this email secure and do not share your credentials with anyone.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}/login" class="button">Login to WeVote</a>
              </div>
              
              <p style="margin-top: 30px;"><strong>Next Steps:</strong></p>
              <ol>
                <li>Click the "Login to WeVote" button above</li>
                <li>Enter your email and temporary password</li>
                <li>You'll be prompted to create a new secure password</li>
                <li>Start managing AGM sessions!</li>
              </ol>
              
              <p>If you have any questions or need assistance, please contact your system administrator.</p>
              
              <div class="footer">
                <p>This is an automated message from WeVote Platform.</p>
                <p>&copy; ${new Date().getFullYear()} Forvis Mazars. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Admin credentials email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending admin credentials email:', error);
    throw error;
  }
};

/**
 * Send user approval email with generated password
 */
const sendUserApprovalEmail = async ({ email, firstName, password }) => {
  try {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to WeVote - Your Account Has Been Approved',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-left: 4px solid #0072CE; margin: 20px 0; border-radius: 5px; }
            .credential-row { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #464B4B; }
            .credential-value { background: #f4f4f4; padding: 8px 12px; border-radius: 5px; font-family: monospace; margin-top: 5px; display: inline-block; }
            .button { display: inline-block; background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to WeVote</h1>
              <p>Your account has been approved</p>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              
              <p>Great news! Your registration has been approved. You can now access the WeVote voting platform.</p>
              
              <div class="credentials">
                <div class="credential-row">
                  <div class="credential-label">Email Address:</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-row">
                  <div class="credential-label">Temporary Password:</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <p style="margin: 10px 0 0 0;">For security reasons, you will be required to change this password upon your first login. Please keep this email secure and do not share your credentials with anyone.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}/login" class="button">Login to WeVote</a>
              </div>
              
              <p style="margin-top: 30px;"><strong>Next Steps:</strong></p>
              <ol>
                <li>Click the "Login to WeVote" button above</li>
                <li>Enter your email and temporary password</li>
                <li>You'll be prompted to create a new secure password</li>
                <li>Start participating in voting!</li>
              </ol>
              
              <p>If you have any questions or need assistance, please contact your system administrator.</p>
              
              <div class="footer">
                <p>This is an automated message from WeVote Platform.</p>
                <p>&copy; ${new Date().getFullYear()} Forvis Mazars. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`User approval email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending user approval email:', error);
    throw error;
  }
};

/**
 * Send session assignment notification email
 */
const sendSessionAssignmentEmail = async ({ email, firstName, sessionTitle, sessionDate, role, password = null }) => {
  try {
    const roleLabel = role === 'admin' ? 'Admin' : 'Auditor';
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const passwordSection = password ? `
      <div class="session-info" style="background: #fff3cd; border-left-color: #ffc107;">
        <div class="info-row">
          <div class="info-label">⚠️ IMPORTANT - First Time Login:</div>
          <div class="info-value" style="margin-top: 10px;">
            <p style="margin: 5px 0;">Your temporary password is:</p>
            <div style="background: #fff; padding: 15px; border: 2px dashed #ffc107; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #0072CE; text-align: center; margin: 10px 0;">
              ${password}
            </div>
            <p style="margin: 10px 0; color: #856404; font-size: 14px;">
              🔒 You will be required to change this password on your first login for security purposes.
            </p>
          </div>
        </div>
      </div>
    ` : '';

    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: password ? `Session Assignment & Login Credentials - ${sessionTitle}` : `Session Assignment - ${sessionTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .session-info { background: white; padding: 20px; border-left: 4px solid #0072CE; margin: 20px 0; border-radius: 5px; }
            .info-row { margin: 10px 0; }
            .info-label { font-weight: bold; color: #464B4B; }
            .info-value { color: #666; margin-top: 5px; }
            .button { display: inline-block; background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 New Session Assignment</h1>
              <p>You have been assigned to manage an AGM session</p>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              
              <p>You have been assigned as <strong>${roleLabel}</strong> for the following AGM session:</p>
              
              <div class="session-info">
                <div class="info-row">
                  <div class="info-label">Session Title:</div>
                  <div class="info-value">${sessionTitle}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Scheduled Date:</div>
                  <div class="info-value">${sessionDate}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Your Role:</div>
                  <div class="info-value">${roleLabel}</div>
                </div>
              </div>
              
              ${passwordSection}
              
              <p>Please log in to the WeVote platform to access your dashboard and manage this session.</p>
              
              <div style="text-align: center;">
                <a href="${loginUrl}/login" class="button">Go to Dashboard</a>
              </div>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                If you have any questions or need assistance, please contact the Super Admin.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email from WeVote Platform.</p>
              <p>© ${new Date().getFullYear()} WeVote. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Session assignment email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending session assignment email:', error);
    throw error;
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    logger.info('Email service is ready');
    return true;
  } catch (error) {
    logger.error('Email service verification failed:', error);
    return false;
  }
};

/**
 * Send password reset email with temporary password
 */
const sendPasswordResetEmail = async ({ email, firstName, tempPassword }) => {
  try {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'WeVote - Password Reset',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: white; padding: 20px; border-left: 4px solid #0072CE; margin: 20px 0; border-radius: 5px; text-align: center; }
            .temp-password { font-size: 24px; font-weight: bold; font-family: monospace; background: #f4f4f4; padding: 12px 24px; border-radius: 8px; display: inline-block; letter-spacing: 2px; color: #171C8F; }
            .button { display: inline-block; background: linear-gradient(135deg, #0072CE 0%, #171C8F 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>Your temporary password</p>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>You requested a password reset for your WeVote account. Use the temporary password below to log in:</p>
              <div class="password-box">
                <p style="margin:0 0 10px;">Your temporary password:</p>
                <span class="temp-password">${tempPassword}</span>
              </div>
              <div class="warning">
                ⚠️ <strong>Important:</strong> You will be required to set a new password immediately after logging in. This temporary password expires after first use.
              </div>
              <div style="text-align: center;">
                <a href="${loginUrl}/login" class="button">Login to WeVote</a>
              </div>
              <p>If you did not request a password reset, please contact your administrator immediately.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from WeVote. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendAdminCredentialsEmail,
  sendUserApprovalEmail,
  sendSessionAssignmentEmail,
  sendPasswordResetEmail,
  verifyEmailConfig
};
