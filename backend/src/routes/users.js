// =====================================================
// Users Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const User = require('../models/User');
const { validate } = require('../middleware/validator');
const { authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @route   POST /api/users
// @desc    Create new user (Admin and Super Admin only)
// @access  Private
router.post('/', [
  authorizeRoles('admin', 'super_admin'),
  body('email').isEmail().withMessage('Valid email required'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['user', 'voter', 'employee', 'admin', 'auditor']).withMessage('Invalid role'),
  body('phoneNumber').optional().isMobilePhone(),
  validate,
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, password, role, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const userData = {
      organizationId: req.user.organizationId || 1,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
      phoneNumber: phoneNumber || null
    };

    const newUser = await User.create(userData);

    // Remove sensitive data
    delete newUser.PasswordHash;
    delete newUser.Salt;

    logger.info(`User created by admin ${req.user.userId}: ${newUser.Email}`);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  })
]);

// @route   GET /api/users
// @desc    Get all users (Admin and Super Admin only)
// @access  Private
router.get('/', [
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { role, isActive } = req.query;
    
    const filters = {
      organizationId: req.user.organizationId
    };

    if (role) {
      // Support comma-separated roles: role=admin,auditor
      filters.roles = role.includes(',') ? role.split(',') : [role];
    }
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const users = await User.findAll(filters);

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { PasswordHash, Salt, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      count: sanitizedUsers.length,
      users: sanitizedUsers
    });
  })
]);

// @route   GET /api/users/pending/registrations
// @desc    Get all user registrations (for admin approval interface)
// @access  Private (Admin/Super Admin)
router.get('/pending/registrations', [
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { executeQuery } = require('../config/database');

    const result = await executeQuery(`
      SELECT 
        UserID as id,
        FirstName + ' ' + LastName as name,
        FirstName as first_name,
        LastName as last_name,
        Email as email,
        PhoneNumber as phone,
        Role as role_name,
        IsActive as active,
        RequiresPasswordChange,
        CASE 
          WHEN IsActive = 1 THEN 'approved'
          WHEN IsActive = 0 THEN 'pending'
          ELSE 'rejected'
        END as registration_status,
        CreatedAt as created_at,
        UpdatedAt as updated_at
      FROM Users
      WHERE RequiresPasswordChange = 1
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  })
]);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', [
  param('id').isInt().withMessage('Valid user ID required'),
  validate,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    // Users can only view their own profile unless admin/super_admin
    if (userId !== req.user.userId && 
        !['admin', 'super_admin'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove sensitive data
    delete user.PasswordHash;
    delete user.Salt;

    res.json({ user });
  })
]);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phoneNumber').optional().isMobilePhone(),
  validate,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    // Users can only update their own profile unless admin/super_admin
    if (userId !== req.user.userId && 
        !['admin', 'super_admin'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    const updatedUser = await User.updateProfile(userId, req.body);

    // Remove sensitive data
    delete updatedUser.PasswordHash;
    delete updatedUser.Salt;

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  })
]);

// @route   PUT /api/users/:id/approve
// @desc    Approve a pending user registration - generates password, sends email, logs to audit
// @access  Private (Admin/Super Admin)
router.put('/:id/approve', [
  param('id').isInt().withMessage('Valid user ID required'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const sql = require('mssql');
    const { getPool, executeQuery } = require('../config/database');
    const pool = await getPool();
    const User = require('../models/User');
    const { sendUserApprovalEmail } = require('../services/emailService');

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate random password (12 characters: uppercase, lowercase, numbers)
    const generatePassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const all = uppercase + lowercase + numbers;
      
      let password = '';
      // Ensure at least one of each type
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      
      // Fill the rest randomly
      for (let i = 3; i < 12; i++) {
        password += all[Math.floor(Math.random() * all.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const generatedPassword = generatePassword();

    // Update user password with generated password
    await User.changePassword(userId, generatedPassword);

    // Update user to active but keep RequiresPasswordChange = 1 (they must change on first login)
    await pool.request()
      .input('userId', sql.Int, userId)
      .query`
        UPDATE Users 
        SET IsActive = 1, 
            RequiresPasswordChange = 1,
            UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `;

    // Send email with generated password
    try {
      await sendUserApprovalEmail({
        email: user.Email,
        firstName: user.FirstName,
        password: generatedPassword
      });
      logger.info(`Approval email sent to ${user.Email} with generated password`);
    } catch (emailError) {
      logger.error(`Failed to send approval email to ${user.Email}:`, emailError);
      // Don't fail the approval if email fails, but log it
    }

    // Log to audit
    try {
      await executeQuery(`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (@adminUserId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, GETDATE())
      `, {
        adminUserId: req.user.userId,
        action: 'USER_APPROVED',
        entityType: 'User',
        entityId: userId,
        details: `Approved user registration for ${user.Email}. Generated password sent via email.`,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      });
    } catch (auditError) {
      logger.error('Failed to log approval to audit:', auditError);
      // Don't fail the approval if audit logging fails
    }

    res.json({
      success: true,
      message: 'User registration approved successfully. Password generated and email sent.'
    });
  })
]);

// @route   PUT /api/users/:id/reject
// @desc    Reject a pending user registration
// @access  Private (Admin/Super Admin)
router.put('/:id/reject', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('reason').optional().isString(),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const sql = require('mssql');
    const { getPool } = require('../config/database');
    const pool = await getPool();

    // Delete the rejected user
    await pool.request()
      .input('userId', sql.Int, userId)
      .query`DELETE FROM Users WHERE UserID = @userId`;

    res.json({
      success: true,
      message: 'User registration rejected and removed'
    });
  })
]);

// @route   DELETE /api/users/:id
// @desc    Delete user (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [
  param('id').isInt().withMessage('Valid user ID required'),
  validate,
  authorizeRoles('super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    // Cannot delete yourself
    if (userId === req.user.userId) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete user
    await User.delete(userId);

    res.json({
      message: 'User deleted successfully',
      deletedUserId: userId
    });
  })
]);

module.exports = router;
