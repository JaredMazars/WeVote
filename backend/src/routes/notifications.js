// =====================================================
// Notification Routes
// API endpoints for in-app notifications
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Notification = require('../models/Notification');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.use(authenticateToken);

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', [
  query('unreadOnly').optional().isBoolean().toBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate
], asyncHandler(async (req, res) => {
  const options = {
    unreadOnly: req.query.unreadOnly || false,
    limit: req.query.limit || 50,
    offset: req.query.offset || 0
  };

  const notifications = await Notification.getUserNotifications(req.user.userId, options);
  const unreadCount = await Notification.getUnreadCount(req.user.userId);

  res.json({
    notifications,
    unreadCount,
    total: notifications.length
  });
}));

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user.userId);
  
  res.json({ unreadCount: count });
}));

// @route   POST /api/notifications
// @desc    Create notification (Admin only)
// @access  Private (Admin/Super Admin)
router.post('/', [
  authorizeRoles('admin', 'super_admin'),
  body('userId').optional().isInt(),
  body('userIds').optional().isArray(),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  validate
], asyncHandler(async (req, res) => {
  const { userId, userIds, ...notificationData } = req.body;

  let result;

  if (userIds && Array.isArray(userIds)) {
    // Bulk notification
    result = await Notification.createBulk(userIds, notificationData);
  } else if (userId) {
    // Single notification
    result = await Notification.create({ ...notificationData, userId });
  } else {
    throw new AppError('Either userId or userIds is required', 400);
  }

  logger.info(`Notification(s) created by admin ${req.user.userId}`);

  res.status(201).json({
    message: 'Notification created successfully',
    notification: result
  });
}));

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', [
  param('id').isInt().withMessage('Valid notification ID required'),
  validate
], asyncHandler(async (req, res) => {
  const notification = await Notification.markAsRead(
    parseInt(req.params.id),
    req.user.userId
  );

  res.json({
    message: 'Notification marked as read',
    notification
  });
}));

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', asyncHandler(async (req, res) => {
  await Notification.markAllAsRead(req.user.userId);

  res.json({
    message: 'All notifications marked as read'
  });
}));

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', [
  param('id').isInt().withMessage('Valid notification ID required'),
  validate
], asyncHandler(async (req, res) => {
  await Notification.delete(parseInt(req.params.id), req.user.userId);

  res.json({
    message: 'Notification deleted successfully'
  });
}));

// @route   DELETE /api/notifications/read
// @desc    Delete all read notifications
// @access  Private
router.delete('/read', asyncHandler(async (req, res) => {
  const result = await Notification.deleteAllRead(req.user.userId);

  res.json({
    message: 'Read notifications deleted successfully',
    deletedCount: result.deletedCount
  });
}));

module.exports = router;
