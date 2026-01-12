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
