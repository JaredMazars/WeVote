// =====================================================
// Attendance Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Attendance = require('../models/Attendance');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.use(authenticateToken);

// @route   POST /api/attendance/check-in
// @desc    Check in to session
// @access  Private
router.post('/check-in', [
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('checkInMethod').optional().isString(),
  body('location').optional().isString(),
  body('deviceInfo').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  const attendanceData = {
    sessionId: req.body.sessionId,
    userId: req.user.userId,
    checkInMethod: req.body.checkInMethod || 'web',
    ipAddress: req.ip,
    location: req.body.location,
    deviceInfo: req.body.deviceInfo
  };

  const attendance = await Attendance.checkIn(attendanceData);
  
  logger.info(`User ${req.user.userId} checked in to session ${req.body.sessionId}`);
  
  res.status(201).json({ 
    message: 'Checked in successfully', 
    attendance 
  });
}));

// @route   POST /api/attendance/check-out
// @desc    Check out from session
// @access  Private
router.post('/check-out', [
  body('sessionId').isInt().withMessage('Session ID is required'),
  validate
], asyncHandler(async (req, res) => {
  const result = await Attendance.checkOut(req.body.sessionId, req.user.userId);
  
  logger.info(`User ${req.user.userId} checked out from session ${req.body.sessionId}`);
  
  res.json(result);
}));

// @route   GET /api/attendance/session/:sessionId
// @desc    Get session attendance list
// @access  Private (Admin/Super Admin/Auditor)
router.get('/session/:sessionId', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const attendees = await Attendance.getSessionAttendance(parseInt(req.params.sessionId));
  
  res.json({ 
    sessionId: parseInt(req.params.sessionId),
    count: attendees.length,
    attendees 
  });
}));

// @route   GET /api/attendance/user/:userId
// @desc    Get user's check-in status for current session
// @access  Private
router.get('/user/:userId', [
  param('userId').isInt(),
  query('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const sessionId = parseInt(req.query.sessionId);

  // Users can only check their own status unless admin
  if (userId !== req.user.userId && !['super_admin', 'admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Not authorized to view this user\'s status', 403);
  }

  const status = await Attendance.getUserStatus(sessionId, userId);
  
  res.json({ sessionId, userId, status });
}));

// @route   GET /api/attendance/history/:userId
// @desc    Get user's attendance history
// @access  Private
router.get('/history/:userId', [
  param('userId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  // Users can only view their own history unless admin
  if (userId !== req.user.userId && !['super_admin', 'admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Not authorized to view this user\'s history', 403);
  }

  const history = await Attendance.getUserHistory(userId);
  
  res.json({ 
    userId,
    count: history.length,
    history 
  });
}));

// @route   GET /api/attendance/live/:sessionId
// @desc    Get live attendance feed (recent check-ins)
// @access  Private
router.get('/live/:sessionId', [
  param('sessionId').isInt(),
  query('minutes').optional().isInt({ min: 1, max: 1440 }),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const minutes = req.query.minutes ? parseInt(req.query.minutes) : 30;

  const liveAttendance = await Attendance.getLiveAttendance(sessionId, minutes);
  
  res.json({ 
    sessionId,
    timeWindowMinutes: minutes,
    count: liveAttendance.length,
    attendees: liveAttendance 
  });
}));

// @route   GET /api/attendance/statistics/:sessionId
// @desc    Get attendance statistics for session
// @access  Private (Admin/Super Admin/Auditor)
router.get('/statistics/:sessionId', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const statistics = await Attendance.getStatistics(parseInt(req.params.sessionId));
  
  res.json({ 
    sessionId: parseInt(req.params.sessionId),
    statistics 
  });
}));

module.exports = router;
