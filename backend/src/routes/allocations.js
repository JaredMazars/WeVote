// =====================================================
// Vote Allocation Routes
// API endpoints for managing vote allocations
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const VoteAllocation = require('../models/VoteAllocation');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.use(authenticateToken);

// @route   POST /api/allocations
// @desc    Set vote allocation for user
// @access  Private (Admin/Super Admin)
router.post('/', [
  authorizeRoles('super_admin', 'admin'),
  body('userId').isInt().withMessage('User ID is required'),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('maxCandidateVotes').isInt({ min: 0 }).withMessage('Max candidate votes must be a positive integer'),
  body('maxResolutionVotes').isInt({ min: 0 }).withMessage('Max resolution votes must be a positive integer'),
  body('allowSplitVoting').optional().isBoolean(),
  body('notes').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  const allocation = await VoteAllocation.create(req.body);
  
  logger.info(`Vote allocation set for user ${req.body.userId} in session ${req.body.sessionId} by admin ${req.user.userId}`);
  
  res.status(201).json({ 
    message: 'Vote allocation set successfully', 
    allocation 
  });
}));

// @route   GET /api/allocations/session/:sessionId
// @desc    Get all allocations for a session
// @access  Private (Admin/Super Admin/Auditor)
router.get('/session/:sessionId', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const allocations = await VoteAllocation.findBySession(parseInt(req.params.sessionId));
  
  res.json({ 
    sessionId: parseInt(req.params.sessionId),
    count: allocations.length,
    allocations 
  });
}));

// @route   GET /api/allocations/user/:userId/:sessionId
// @desc    Get user's allocation for session
// @access  Private
router.get('/user/:userId/:sessionId', [
  param('userId').isInt(),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const sessionId = parseInt(req.params.sessionId);

  // Users can check their own allocation, admins can check any
  if (userId !== req.user.userId && !['super_admin', 'admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Not authorized to view this allocation', 403);
  }

  const allocation = await VoteAllocation.findByUser(userId, sessionId);
  
  if (!allocation) {
    return res.json({ 
      message: 'No allocation set (unlimited votes)',
      unlimited: true,
      userId,
      sessionId
    });
  }

  res.json({ allocation });
}));

// @route   GET /api/allocations/check-votes/:userId/:sessionId
// @desc    Check if user has votes remaining
// @access  Private
router.get('/check-votes/:userId/:sessionId', [
  param('userId').isInt(),
  param('sessionId').isInt(),
  query('type').optional().isIn(['candidate', 'resolution']),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const sessionId = parseInt(req.params.sessionId);
  const voteType = req.query.type || 'candidate';

  // Users can check their own votes, admins can check any
  if (userId !== req.user.userId && !['super_admin', 'admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Not authorized to check votes for this user', 403);
  }

  const votesInfo = await VoteAllocation.hasVotesRemaining(userId, sessionId, voteType);
  
  res.json({ 
    userId,
    sessionId,
    voteType,
    ...votesInfo
  });
}));

// @route   PUT /api/allocations/:id
// @desc    Update vote allocation
// @access  Private (Admin/Super Admin)
router.put('/:id', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt(),
  body('maxCandidateVotes').optional().isInt({ min: 0 }),
  body('maxResolutionVotes').optional().isInt({ min: 0 }),
  body('allowSplitVoting').optional().isBoolean(),
  body('notes').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  const allocation = await VoteAllocation.update(parseInt(req.params.id), req.body);
  
  logger.info(`Vote allocation ${req.params.id} updated by admin ${req.user.userId}`);
  
  res.json({ 
    message: 'Vote allocation updated successfully', 
    allocation 
  });
}));

// @route   DELETE /api/allocations/:id
// @desc    Delete vote allocation
// @access  Private (Super Admin)
router.delete('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const result = await VoteAllocation.delete(parseInt(req.params.id));
  
  logger.info(`Vote allocation ${req.params.id} deleted by admin ${req.user.userId}`);
  
  res.json(result);
}));

// @route   GET /api/allocations/statistics/:sessionId
// @desc    Get allocation statistics for session
// @access  Private (Admin/Super Admin/Auditor)
router.get('/statistics/:sessionId', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const statistics = await VoteAllocation.getStatistics(parseInt(req.params.sessionId));
  
  res.json({ 
    sessionId: parseInt(req.params.sessionId),
    statistics 
  });
}));

module.exports = router;
