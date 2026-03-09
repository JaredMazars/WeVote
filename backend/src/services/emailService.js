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
                <a href="${loginUrl}/login" class="button" style="color: white;">Login to WeVote</a>
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
                <a href="${loginUrl}/login" class="button" style="color: white;">Login to WeVote</a>
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
                <a href="${loginUrl}/login" class="button" style="color: white;">Go to Dashboard</a>
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
                <a href="${loginUrl}/login" class="button" style="color: white;">Login to WeVote</a>
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


// ─────────────────────────────────────────────────────────────
// Vote Confirmation Email
// ─────────────────────────────────────────────────────────────
const sendVoteConfirmationEmail = async ({ email, firstName, voteType, entityName, voteId, sessionTitle }) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const receiptUrl = `${frontendUrl}/vote-receipt/${voteId}`;
    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✅ Vote Confirmed — ${sessionTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px; margin:0;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <div style="background:linear-gradient(135deg,#0072CE,#171C8F); padding:32px 24px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:24px;">Vote Confirmed</h1>
                <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">${sessionTitle}</p>
              </div>
              <div style="padding:32px 24px;">
                <p style="color:#464B4B; font-size:16px;">Dear ${firstName || 'Voter'},</p>
                <p style="color:#464B4B; font-size:15px;">Your vote has been securely recorded on the WeVote platform.</p>
                <table style="width:100%; border-collapse:collapse; margin:24px 0; font-size:14px;">
                  <tr style="background:#f8f9fa;">
                    <td style="padding:12px 16px; color:#464B4B; font-weight:600; border:1px solid #e9ecef; width:40%;">Vote ID</td>
                    <td style="padding:12px 16px; color:#0072CE; font-family:monospace; border:1px solid #e9ecef;">#${voteId}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; color:#464B4B; font-weight:600; border:1px solid #e9ecef;">Vote Type</td>
                    <td style="padding:12px 16px; color:#464B4B; border:1px solid #e9ecef;">${voteType}</td>
                  </tr>
                  <tr style="background:#f8f9fa;">
                    <td style="padding:12px 16px; color:#464B4B; font-weight:600; border:1px solid #e9ecef;">Selection</td>
                    <td style="padding:12px 16px; color:#464B4B; border:1px solid #e9ecef;">${entityName}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; color:#464B4B; font-weight:600; border:1px solid #e9ecef;">Session</td>
                    <td style="padding:12px 16px; color:#464B4B; border:1px solid #e9ecef;">${sessionTitle}</td>
                  </tr>
                  <tr style="background:#f8f9fa;">
                    <td style="padding:12px 16px; color:#464B4B; font-weight:600; border:1px solid #e9ecef;">Timestamp</td>
                    <td style="padding:12px 16px; color:#464B4B; border:1px solid #e9ecef;">${new Date().toUTCString()}</td>
                  </tr>
                </table>
                <div style="text-align:center; margin:28px 0;">
                  <a href="${receiptUrl}" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#0072CE,#171C8F); color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700; font-size:15px;">
                    🧾 View Your Vote Receipt →
                  </a>
                  <p style="color:#999; font-size:12px; margin-top:10px;">Or copy this link:<br/><span style="color:#0072CE; font-family:monospace; font-size:11px;">${receiptUrl}</span></p>
                </div>
                <p style="color:#464B4B; font-size:14px;">Keep this email as permanent proof of your participation. Your receipt URL will always be accessible while the platform is running.</p>
                <p style="color:#999; font-size:13px; margin-top:24px;">This is an automated message — please do not reply.</p>
              </div>
              <div style="background:#f8f9fa; padding:16px 24px; text-align:center; border-top:1px solid #e9ecef;">
                <p style="color:#999; font-size:12px; margin:0;">WeVote | Forvis Mazars &bull; Secure Digital Voting Platform</p>
              </div>
            </div>
          </body>
        </html>`
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Vote confirmation email sent to ${email} for vote #${voteId}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to send vote confirmation email:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// Registration Acknowledgment Email (sent immediately on signup)
// ─────────────────────────────────────────────────────────────
const sendRegistrationAcknowledgmentEmail = async ({ email, firstName }) => {
  try {
    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '\u23f3 Registration Received \u2014 Pending Admin Approval',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px; margin:0;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <div style="background:linear-gradient(135deg,#0072CE,#171C8F); padding:32px 24px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:24px;">Registration Received</h1>
                <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">WeVote &#8212; Forvis Mazars</p>
              </div>
              <div style="padding:32px 24px;">
                <p style="color:#464B4B; font-size:16px;">Dear ${firstName || 'Member'},</p>
                <p style="color:#464B4B; font-size:15px;">Thank you for registering with the WeVote platform. Your application has been received and is currently <strong>pending review</strong> by an administrator.</p>
                <div style="background:#fefce8; border-left:4px solid #f59e0b; padding:16px; margin:24px 0; border-radius:0 8px 8px 0;">
                  <p style="margin:0; color:#92400e; font-weight:600; font-size:14px;">&#9203; What happens next?</p>
                  <ol style="margin:8px 0 0; color:#464B4B; font-size:13px; padding-left:20px;">
                    <li style="margin-top:6px;">An administrator will review your registration.</li>
                    <li style="margin-top:6px;">Once approved, you will receive a <strong>second email</strong> containing your login credentials.</li>
                    <li style="margin-top:6px;">You will be asked to set a new password on your first login.</li>
                    <li style="margin-top:6px;">You can then log in and participate in voting sessions.</li>
                  </ol>
                </div>
                <p style="color:#464B4B; font-size:14px;">You do not need to take any action at this time. If you have questions, please contact your administrator.</p>
                <p style="color:#999; font-size:13px; margin-top:24px;">This is an automated message &#8212; please do not reply.</p>
              </div>
              <div style="background:#f8f9fa; padding:16px 24px; text-align:center; border-top:1px solid #e9ecef;">
                <p style="color:#999; font-size:12px; margin:0;">WeVote | Forvis Mazars &bull; Secure Digital Voting Platform</p>
              </div>
            </div>
          </body>
        </html>`
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Registration acknowledgment email sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to send registration acknowledgment email:', error);
    throw error;
  }
};

const sendNotGoodStandingEmail = async ({ email, firstName }) => {
  try {
    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '\u26a0\ufe0f Vote Not Recorded \u2014 Account Not in Good Standing',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px; margin:0;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <div style="background:linear-gradient(135deg,#dc2626,#991b1b); padding:32px 24px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:24px;">Vote Not Recorded</h1>
                <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">WeVote \u2014 Forvis Mazars</p>
              </div>
              <div style="padding:32px 24px;">
                <p style="color:#464B4B; font-size:16px;">Dear ${firstName || 'Member'},</p>
                <p style="color:#464B4B; font-size:15px;">Your recent vote could <strong>not be recorded</strong> because your account is currently <strong>not in good standing</strong>.</p>
                <div style="background:#fef2f2; border-left:4px solid #dc2626; padding:16px; margin:24px 0; border-radius:0 8px 8px 0;">
                  <p style="margin:0; color:#dc2626; font-weight:600; font-size:14px;">&#10006; Vote not counted</p>
                  <p style="margin:4px 0 0; color:#464B4B; font-size:13px;">Please contact your administrator to resolve your account status and restore your voting eligibility.</p>
                </div>
                <p style="color:#999; font-size:13px; margin-top:24px;">This is an automated message \u2014 please do not reply.</p>
              </div>
              <div style="background:#f8f9fa; padding:16px 24px; text-align:center; border-top:1px solid #e9ecef;">
                <p style="color:#999; font-size:12px; margin:0;">WeVote | Forvis Mazars &bull; Secure Digital Voting Platform</p>
              </div>
            </div>
          </body>
        </html>`
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Not-good-standing email sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to send not-good-standing email:', error);
    throw error;
  }
};

const sendVoterPromotionEmail = async ({ email, firstName, password }) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const mailOptions = {
      from: `"WeVote Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Your Account Has Been Approved — You Can Now Vote',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px; margin:0;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <div style="background:linear-gradient(135deg,#0072CE,#171C8F); padding:32px 24px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:24px;">You're Approved to Vote!</h1>
                <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">WeVote — Forvis Mazars</p>
              </div>
              <div style="padding:32px 24px;">
                <p style="color:#464B4B; font-size:16px;">Dear ${firstName || 'Member'},</p>
                <p style="color:#464B4B; font-size:15px;">Great news! Your account has been reviewed and approved. You are now a confirmed voter and can participate in all active AGM sessions.</p>
                ${password ? `<div style="background:#f0f9ff; border-left:4px solid #0072CE; padding:16px; margin:24px 0; border-radius:0 8px 8px 0;"><p style="margin:0; color:#0072CE; font-weight:600; font-size:14px;">Your login credentials</p><p style="margin:8px 0 0; color:#464B4B; font-size:13px;"><strong>Email:</strong> ${email}</p><p style="margin:4px 0 0; color:#464B4B; font-size:13px;"><strong>Temporary password:</strong> <code style="background:#e8f4fd; padding:2px 6px; border-radius:4px;">${password}</code></p><p style="margin:8px 0 0; color:#464B4B; font-size:12px;">You will be prompted to change your password on first login.</p></div>` : ''}
                <div style="text-align:center; margin:28px 0;">
                  <a href="${frontendUrl}/login" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#0072CE,#171C8F); color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700; font-size:15px;">
                    Login to WeVote &rarr;
                  </a>
                </div>
                <p style="color:#999; font-size:13px; margin-top:24px;">This is an automated message — please do not reply.</p>
              </div>
              <div style="background:#f8f9fa; padding:16px 24px; text-align:center; border-top:1px solid #e9ecef;">
                <p style="color:#999; font-size:12px; margin:0;">WeVote | Forvis Mazars &bull; Secure Digital Voting Platform</p>
              </div>
            </div>
          </body>
        </html>`
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Voter promotion email sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to send voter promotion email:', error);
    throw error;
  }
};

module.exports = {
  sendAdminCredentialsEmail,
  sendUserApprovalEmail,
  sendSessionAssignmentEmail,
  sendPasswordResetEmail,
  sendVoteConfirmationEmail,
  sendVoterPromotionEmail,
  sendNotGoodStandingEmail,
  sendRegistrationAcknowledgmentEmail,
  verifyEmailConfig
};
