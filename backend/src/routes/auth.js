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
// @desc    Register new user
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
  
  const newUser = await User.create({
    organizationId,
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    role: role || 'user'
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

  logger.info(`Password updated successfully for user: ${user.Email}`);

  res.json({
    success: true,
    message: 'Password updated successfully'
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
