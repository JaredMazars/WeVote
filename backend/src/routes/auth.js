// =====================================================
// Authentication Routes
// =====================================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, param } = require('express-validator');
const User = require('../models/User');
const { validate } = require('../middleware/validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.UserID,
      email: user.Email,
      role: user.Role,
      organizationId: user.OrganizationID
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findByEmail(email);
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.IsActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Verify password
  const isPasswordValid = await User.verifyPassword(password, user.PasswordHash);
  
  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw new AppError('Invalid email or password', 401);
  }

  // If user successfully logs in with generated password, verify their email automatically
  if (user.RequiresPasswordChange && !user.IsEmailVerified) {
    const { executeQuery } = require('../config/database');
    await executeQuery(`
      UPDATE Users 
      SET IsEmailVerified = 1 
      WHERE UserID = @userId
    `, { userId: user.UserID });
    
    user.IsEmailVerified = true;
    logger.info(`Email auto-verified for user ${email} on first login with generated password`);
  }

  // Update last login
  await User.updateLastLogin(user.UserID);

  // Generate token
  const token = generateToken(user);

  // Remove sensitive data
  delete user.PasswordHash;
  delete user.Salt;

  logger.info(`User logged in: ${user.Email} (${user.Role})`);

  res.json({
    message: 'Login successful',
    token,
    user: {
      userId: user.UserID,
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      role: user.Role,
      organizationId: user.OrganizationID,
      organizationName: user.OrganizationName,
      isEmailVerified: user.IsEmailVerified,
      requiresPasswordChange: user.RequiresPasswordChange === true || user.RequiresPasswordChange === 1
    }
  });
}));

// @route   POST /api/auth/register
// @desc    Register new user (creates active user immediately - for admin/auditor creation)
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('role').optional().isIn(['user', 'voter', 'admin', 'auditor', 'super_admin']).withMessage('Invalid role'),
  validate
], asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Create user (default organization ID from env)
  const organizationId = parseInt(process.env.DEFAULT_ORG_ID) || 1;
  
  // Default role to 'voter' for all new registrations
  // Candidates can only be created through nomination by admins
  const newUser = await User.create({
    organizationId,
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    role: role || 'voter'
  });

  // Generate token
  const token = generateToken(newUser);

  logger.info(`New user registered: ${newUser.Email} with role: ${newUser.Role}`);

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      userId: newUser.UserID,
      email: newUser.Email,
      firstName: newUser.FirstName,
      lastName: newUser.LastName,
      role: newUser.Role,
      organizationId: newUser.OrganizationID
    }
  });
}));

// @route   POST /api/auth/register-pending
// @desc    Register new user (creates pending user requiring admin approval)
// @access  Public
router.post('/register-pending', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('phoneNumber').optional().isString().withMessage('Valid phone number required'),
  body('title').optional().isString(),
  body('idNumber').optional().isString(),
  body('idType').optional().isString(),
  body('dateOfBirth').optional().isISO8601(),
  body('streetAddress').optional().isString(),
  body('city').optional().isString(),
  body('province').optional().isString(),
  body('postalCode').optional().isString(),
  body('country').optional().isString(),
  body('goodStandingIdNumber').optional().isString(),
  body('proxyVoteForm').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  const { email, firstName, lastName, phoneNumber, title, idNumber, idType, 
          dateOfBirth, streetAddress, city, province, postalCode, country,
          goodStandingIdNumber, proxyVoteForm } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Create pending user (default organization ID from env)
  const organizationId = parseInt(process.env.DEFAULT_ORG_ID) || 1;
  
  // Create pending user (IsActive=0, RequiresPasswordChange=1)
  const newUser = await User.createPending({
    organizationId,
    email,
    firstName,
    lastName,
    phoneNumber,
    role: 'voter' // All registrations default to voter
  });

  // TODO: Store additional registration data (address, etc.) in a separate table if needed
  // For now, we'll just create the user and admin can see them in pending approvals

  logger.info(`New pending user registered: ${newUser.Email} - awaiting admin approval`);

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Your account is pending admin approval. You will receive an email with login credentials once approved.',
    user: {
      userId: newUser.UserID,
      email: newUser.Email,
      firstName: newUser.FirstName,
      lastName: newUser.LastName,
      role: newUser.Role
    }
  });
}));

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  // Get user
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await User.verifyPassword(currentPassword, user.PasswordHash);
  
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Change password
  await User.changePassword(userId, newPassword);

  logger.info(`Password changed for user: ${user.Email}`);

  res.json({
    message: 'Password changed successfully'
  });
}));

// @route   POST /api/auth/send-admin-credentials
// @desc    Send email with admin credentials
// @access  Private (Super Admin only)
router.post('/send-admin-credentials', asyncHandler(async (req, res) => {
  const { email, firstName, password, role } = req.body;
  const { sendAdminCredentialsEmail } = require('../services/emailService');

  try {
    await sendAdminCredentialsEmail({ email, firstName, password, role });
    
    logger.info(`Admin credentials email sent to ${email}`);
    
    res.json({
      message: 'Credentials email sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send credentials email:', error);
    // Don't fail the request if email fails
    res.json({
      message: 'Admin created but email sending failed. Please provide credentials manually.',
      warning: true
    });
  }
}));

// @route   GET /api/auth/check-password-change
// @desc    Check if user requires password change
// @access  Private
router.get('/check-password-change', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    requiresPasswordChange: user.RequiresPasswordChange === true || user.RequiresPasswordChange === 1
  });
}));

// @route   POST /api/auth/first-login-password-change
// @desc    Change password on first login
// @access  Private
router.post('/first-login-password-change', [
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate
], asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.userId;

  // Get user
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Change password
  await User.changePassword(userId, newPassword);

  // Clear the RequiresPasswordChange flag
  await User.clearPasswordChangeRequirement(userId);

  // Log to audit
  const { executeQuery } = require('../config/database');
  try {
    await executeQuery(`
      INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
      VALUES (@userId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, GETDATE())
    `, {
      userId: userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      details: `User changed password on first login`,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  } catch (auditError) {
    logger.error('Failed to log password change to audit:', auditError);
  }

  logger.info(`First-login password changed for user: ${user.Email}`);

  res.json({
    message: 'Password changed successfully'
  });
}));

// @route   PUT /api/auth/update-password/:userId
// @desc    Update password (for temp password flow)
// @access  Public (used during first login)
router.put('/update-password/:userId', [
  param('userId').notEmpty().withMessage('User ID required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { password } = req.body;

  logger.info(`Password update attempt for user ID: ${userId}`);

  // Get user
  const user = await User.findById(userId);
  
  if (!user) {
    logger.warn(`Password update failed - user not found: ${userId}`);
    throw new AppError('User not found', 404);
  }

  // Change password
  await User.changePassword(userId, password);

  // Clear the RequiresPasswordChange flag
  const { executeQuery } = require('../config/database');
  await executeQuery(`
    UPDATE Users 
    SET RequiresPasswordChange = 0 
    WHERE UserID = @userId
  `, { userId });

  // Log to audit
  try {
    await executeQuery(`
      INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
      VALUES (@userId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, GETDATE())
    `, {
      userId: userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      details: `User changed password`,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  } catch (auditError) {
    logger.error('Failed to log password change to audit:', auditError);
  }

  logger.info(`Password updated successfully for user: ${user.Email}`);

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Request password reset - generates temporary password
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  validate
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  
  if (!user) {
    // Don't reveal if email exists for security
    return res.json({
      message: 'If the email exists, a password reset link has been sent.'
    });
  }

  // Generate temporary password (12 characters)
  const crypto = require('crypto');
  const tempPassword = crypto.randomBytes(6).toString('hex') + 'A1!';
  
  // Update user with temp password and set RequiresPasswordChange flag
  await User.changePassword(user.UserID, tempPassword);
  
  const { executeQuery } = require('../config/database');
  await executeQuery(`
    UPDATE Users 
    SET RequiresPasswordChange = 1 
    WHERE UserID = @userId
  `, { userId: user.UserID });

  // Send email with temporary password
  try {
    const { sendPasswordResetEmail } = require('../services/emailService');
    await sendPasswordResetEmail({
      email: user.Email,
      firstName: user.FirstName,
      tempPassword: tempPassword
    });
    
    logger.info(`Password reset email sent to ${email}`);
  } catch (emailError) {
    logger.error('Failed to send password reset email:', emailError);
  }

  // Log to audit
  try {
    await executeQuery(`
      INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
      VALUES (@userId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, GETDATE())
    `, {
      userId: user.UserID,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.UserID,
      details: `Password reset requested for ${email}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    });
  } catch (auditError) {
    logger.error('Failed to log password reset to audit:', auditError);
  }

  res.json({
    message: 'If the email exists, a password reset link has been sent.',
    tempPassword: tempPassword // In production, remove this - only send via email
  });
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with temporary password
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('tempPassword').notEmpty().withMessage('Temporary password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate
], asyncHandler(async (req, res) => {
  const { email, tempPassword, newPassword } = req.body;

  const user = await User.findByEmail(email);
  
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verify temporary password
  const isValid = await User.verifyPassword(email, tempPassword);
  
  if (!isValid) {
    throw new AppError('Invalid temporary password', 401);
  }

  // Update to new password
  await User.changePassword(user.UserID, newPassword);
  
  const { executeQuery } = require('../config/database');
  await executeQuery(`
    UPDATE Users 
    SET RequiresPasswordChange = 0 
    WHERE UserID = @userId
  `, { userId: user.UserID });

  logger.info(`Password reset completed for user: ${email}`);

  res.json({
    message: 'Password reset successfully. You can now login with your new password.',
    success: true
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Remove sensitive data
  delete user.PasswordHash;
  delete user.Salt;

  res.json({
    user
  });
}));

module.exports = router;
