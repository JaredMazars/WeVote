import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
};

// Alternative SMTP configuration (uncomment if needed)
/*
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};
*/

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// HTML Email Template
const createWelcomeEmailHTML = (userName, userEmail, userPassword) => {
  
};

// Plain Text Template
const createWelcomeEmailText = (userName, userEmail, userPassword) => {
  return `
Welcome to WeVote, ${userName}!

Your account has been successfully created.

LOGIN CREDENTIALS:
Email: ${userEmail}
Password: ${userPassword}

SECURITY NOTICE: Keep these credentials secure and consider changing your password after first login.

Login here: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

FEATURES:
• Vote for employees and resolutions
• View real-time voting results
• Secure and anonymous voting
• Access from any device

Need help? Contact support@wevote.com

© 2025 WeVote Platform by Forvis Mazars
`;
};


const createRegisterEmailText = (userName, userEmail) => {
  return (
    `Hello ${userName},\n\n` +
    `Thank you for registering with WeVote!\n\n` +
    `We're excited to have you on board. Our team will review your request shortly and, once approved, you'll receive your login credentials including a secure password which can be changed to your desire on login.\n\n` +
    `In the meantime, if you have any questions or need assistance, feel free to reach out to us at support@wevote.com.\n\n` +
    `FEATURES TO LOOK FORWARD TO:\n` +
    `• Vote on employee matters and resolutions\n` +
    `• View real-time voting results\n` +
    `• Enjoy secure and anonymous participation\n` +
    `• Access the platform from any device\n\n` +
    `We’ll be in touch soon!\n\n` +
    `Warm regards,\n` +
    `The WeVote Team\n` +
    `© 2025 WeVote Platform by Forvis Mazars`
  );
};


const createApprovalEmailText = (userName, userEmail) => {
  return (
    `Hello ${userName},\n\n` +
    `Congratulations! Your account has been officially approved for good-standing status on WeVote.\n\n` +
    `You now have full access to the platform and its features. Your login credentials have been securely generated and sent to your registered email address. You may change your password upon first login for added security.\n\n` +
    `FEATURES YOU CAN NOW ENJOY:\n` +
    `• Participate in employee votes and resolutions\n` +
    `• View real-time voting outcomes\n` +
    `• Engage in secure and anonymous decision-making\n` +
    `• Access the platform from any device, anytime\n\n` +
    `If you have any questions or need assistance, feel free to reach out to us at support@wevote.com.\n\n` +
    `Welcome aboard — we're thrilled to have you!\n\n` +
    `Warm regards,\n` +
    `The WeVote Team\n` +
    `© 2025 WeVote Platform by Forvis Mazars`
  );
};

// Main email sending function
export const sendApproveGoodStandingEmail = async (userEmail, userName) => {
  try {
    console.log(` Preparing welcome email for: ${userEmail}`);

    const mailOptions = {
      from: {
        name: 'WeVote Platform',
        address: process.env.EMAIL_USER || 'noreply@wevote.com'
      },
      to: userEmail,
      subject: '🎉 Welcome to WeVote - Your Account is Ready!',
      html: createApprovalEmailText(userName, userEmail),
      text: createApprovalEmailText(userName, userEmail)
    };

    console.log('📤 Sending email...');
    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log(' Message ID:', result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Welcome email sent successfully'
    };

  } catch (error) {
    console.error(' Email sending failed:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send welcome email'
    };
  }
};


// Main email sending function
export const sendWelcomeEmail = async (userEmail, userName, userPassword) => {
  try {
    console.log(` Preparing welcome email for: ${userEmail}`);

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

    console.log('📤 Sending email...');
    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log(' Message ID:', result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Welcome email sent successfully'
    };

  } catch (error) {
    console.error(' Email sending failed:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send welcome email'
    };
  }
};


export const sendRegisterEmail = async (userEmail, userName) => {
  try {
    console.log(` Preparing welcome email for: ${userEmail}`);

    const mailOptions = {
      from: {
        name: 'WeVote Platform',
        address: process.env.EMAIL_USER || 'noreply@wevote.com'
      },
      to: userEmail,
      subject: '🎉 Welcome to WeVote - Your Account is Pending!',
      html: createRegisterEmailText(userName, userEmail),
      text: createRegisterEmailText(userName, userEmail)
    };

    console.log('📤 Sending email...');
    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log(' Message ID:', result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      message: 'Welcome email sent successfully'
    };

  } catch (error) {
    console.error(' Email sending failed:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send welcome email'
    };
  }
};


// Test email connection
export const testConnection = async () => {
  try {
    console.log('🔍 Testing email connection...');
    await transporter.verify();
    console.log('✅ Email service is ready!');
    return true;
  } catch (error) {
    console.error(' Email configuration error:', error.message);
    return false;
  }
};

// Send test email
export const sendTestEmail = async (testEmail = 'test@example.com') => {
  return await sendWelcomeEmail(testEmail, 'Test User', 'test123');
};

// Default export object
const emailService = {
  sendWelcomeEmail,
  sendRegisterEmail,
  sendApproveGoodStandingEmail,
  testConnection,
  sendTestEmail
};

export default emailService;