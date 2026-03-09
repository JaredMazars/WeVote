// =====================================================
// AGM Sessions Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const AGMSession = require('../models/AGMSession');
const SessionAdmin = require('../models/SessionAdmin');
const { validate } = require('../middleware/validator');
const { authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @route   GET /api/sessions
// @desc    Get all AGM sessions
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { status, sessionType } = req.query;
  
  const filters = {};

  if (status) filters.status = status;
  if (sessionType) filters.sessionType = sessionType;

  const sessions = await AGMSession.findAll(filters);

  res.json({
    count: sessions.length,
    sessions
  });
}));

// @route   GET /api/sessions/:id
// @desc    Get single AGM session
// @access  Private
router.get('/:id', [
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const session = await AGMSession.findById(parseInt(req.params.id));

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  res.json({ session });
}));

// @route   POST /api/sessions
// @desc    Create new AGM session
// @access  Private (Super Admin only)
router.post('/', [
  authorizeRoles('super_admin'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('scheduledStartTime').isISO8601().withMessage('Valid start time required'),
  body('scheduledEndTime').isISO8601().withMessage('Valid end time required'),
  body('quorumRequired').optional().isFloat({ min: 0, max: 100 }).withMessage('Quorum must be between 0 and 100'),
  body('totalVoters').optional().isInt({ min: 0 }).withMessage('Total voters must be a positive integer'),
  validate
], asyncHandler(async (req, res) => {
  const sessionData = {
    ...req.body,
    organizationId: req.user.organizationId,
    createdBy: req.user.userId
  };

  const session = await AGMSession.create(sessionData);

  logger.info(`AGM Session created: ${session.Title} by user ${req.user.userId}`);

  res.status(201).json({
    message: 'AGM session created successfully',
    session
  });
}));

// @route   PUT /api/sessions/:id
// @desc    Update AGM session
// @access  Private (Super Admin or Admin)
router.put('/:id', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);

  // Check if session exists
  const existingSession = await AGMSession.findById(sessionId);
  
  if (!existingSession) {
    throw new AppError('Session not found', 404);
  }

  // Update session
  const updatedSession = await AGMSession.update(sessionId, req.body);

  logger.info(`AGM Session updated: ${updatedSession.SessionID} by user ${req.user.userId}`);

  res.json({
    message: 'Session updated successfully',
    session: updatedSession
  });
}));

// @route   POST /api/sessions/:id/start
// @desc    Start AGM session
// @access  Private (Super Admin or Admin)
router.post('/:id/start', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);

  try {
    const session = await AGMSession.start(sessionId);
    logger.info(`AGM Session started: ${sessionId} by user ${req.user.userId}`);
    res.json({ message: 'Session started successfully', session });
  } catch (error) {
    throw new AppError(error.message || 'Failed to start session', 400);
  }
}));

// @route   POST /api/sessions/:id/end
// @desc    End AGM session
// @access  Private (Super Admin or Admin)
router.post('/:id/end', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);

  try {
    const session = await AGMSession.end(sessionId);
    logger.info(`AGM Session ended: ${sessionId} by user ${req.user.userId}`);
    res.json({ message: 'Session ended successfully', session });
  } catch (error) {
    throw new AppError(error.message || 'Failed to end session', 400);
  }
}));

// @route   POST /api/sessions/:id/resume
// @desc    Resume a completed AGM session
// @access  Private (Super Admin or Admin)
router.post('/:id/resume', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);

  const session = await AGMSession.findById(sessionId);
  
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  if (session.Status !== 'completed') {
    throw new AppError('Only completed sessions can be resumed', 400);
  }

  // Resume session by setting it back to in_progress
  const resumedSession = await AGMSession.update(sessionId, {
    status: 'in_progress',
    actualEndTime: null,
    updatedBy: req.user.userId,
    updatedAt: new Date()
  });

  logger.info(`AGM Session resumed: ${sessionId} by user ${req.user.userId}`);

  res.json({
    message: 'Session resumed successfully',
    session: resumedSession
  });
}));

// @route   POST /api/sessions/:id/reset
// @desc    Reset AGM session - Clear all votes and data, reset to scheduled
// @access  Private (Super Admin or Admin)
router.post('/:id/reset', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { executeQuery } = require('../config/database');

  const session = await AGMSession.findById(sessionId);
  
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Delete all candidate votes for this session
  try {
    await executeQuery(
      'DELETE FROM CandidateVotes WHERE SessionID = @sessionId',
      { sessionId }
    );
    logger.info(`Deleted candidate votes for session ${sessionId}`);
  } catch (error) {
    logger.warn(`Could not delete candidate votes: ${error.message}`);
  }

  // Delete all resolution votes for this session
  try {
    await executeQuery(
      'DELETE FROM ResolutionVotes WHERE SessionID = @sessionId',
      { sessionId }
    );
    logger.info(`Deleted resolution votes for session ${sessionId}`);
  } catch (error) {
    logger.warn(`Could not delete resolution votes: ${error.message}`);
  }

  // Delete user vote tracking records
  try {
    await executeQuery(
      'DELETE FROM UserVoteTracking WHERE SessionID = @sessionId',
      { sessionId }
    );
    logger.info(`Deleted vote tracking for session ${sessionId}`);
  } catch (error) {
    logger.warn(`Could not delete vote tracking: ${error.message}`);
  }

  // Delete proxy assignments for this session
  try {
    await executeQuery(
      'DELETE FROM ProxyAssignments WHERE SessionID = @sessionId',
      { sessionId }
    );
    logger.info(`Deleted proxy assignments for session ${sessionId}`);
  } catch (error) {
    logger.warn(`Could not delete proxy assignments: ${error.message}`);
  }

  // Reset session status and clear timestamps
  const resetSession = await AGMSession.update(sessionId, {
    status: 'scheduled',
    actualStartTime: null,
    actualEndTime: null,
    updatedBy: req.user.userId,
    updatedAt: new Date()
  });

  logger.info(`AGM Session RESET: ${sessionId} by user ${req.user.userId} - All votes and data cleared`);

  res.json({
    message: 'Session reset successfully - All votes and data cleared',
    session: resetSession
  });
}));

// @route   DELETE /api/sessions/:id
// @desc    Delete AGM session
// @access  Private (Super Admin only)
router.delete('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);

  // Check if session exists
  const session = await AGMSession.findById(sessionId);
  
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  await AGMSession.delete(sessionId);

  logger.info(`AGM Session deleted: ${sessionId} by user ${req.user.userId}`);

  res.json({
    message: 'Session deleted successfully'
  });
}));

// @route   GET /api/sessions/:id/statistics
// @desc    Get session statistics
// @access  Private
router.get('/:id/statistics', [
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);

  const statistics = await AGMSession.getStatistics(sessionId);

  if (!statistics) {
    throw new AppError('Session not found', 404);
  }

  res.json({ statistics });
}));

// @route   POST /api/sessions/:id/limits
// @desc    Set session-wide vote limits
// @access  Private (Super Admin)
router.post('/:id/limits', [
  authorizeRoles('super_admin'),
  param('id').isInt(),
  body('defaultCandidateVotes').optional().isInt({ min: 0 }),
  body('defaultResolutionVotes').optional().isInt({ min: 0 }),
  body('allowSplitVoting').optional().isBoolean(),
  body('enforceVoteLimits').optional().isBoolean(),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const limits = req.body;

  const result = await AGMSession.update(sessionId, {
    defaultCandidateVotes: limits.defaultCandidateVotes,
    defaultResolutionVotes: limits.defaultResolutionVotes,
    allowSplitVoting: limits.allowSplitVoting,
    enforceVoteLimits: limits.enforceVoteLimits
  });

  logger.info(`Session ${sessionId} vote limits set by user ${req.user.userId}`);

  res.json({
    message: 'Session vote limits updated successfully',
    session: result
  });
}));

// @route   GET /api/sessions/:id/limits
// @desc    Get session vote limits
// @access  Private
router.get('/:id/limits', [
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const session = await AGMSession.findById(parseInt(req.params.id));

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  res.json({
    sessionId: session.SessionID,
    limits: {
      defaultCandidateVotes: session.DefaultCandidateVotes || null,
      defaultResolutionVotes: session.DefaultResolutionVotes || null,
      allowSplitVoting: session.AllowSplitVoting || false,
      enforceVoteLimits: session.EnforceVoteLimits || false
    }
  });
}));

// @route   POST /api/sessions/:id/admins
// @desc    Assign admin to session
// @access  Private (Super Admin only)
router.post('/:id/admins', [
  authorizeRoles('super_admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  body('userId').isInt().withMessage('Valid user ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { userId } = req.body;

  // Check if session exists
  const session = await AGMSession.findById(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Check if already assigned
  const isAlreadyAssigned = await SessionAdmin.isAssigned(sessionId, userId);
  if (isAlreadyAssigned) {
    throw new AppError('Admin already assigned to this session', 400);
  }

  const assignment = await SessionAdmin.assign(sessionId, userId, req.user.userId);

  // Send email notification to the assigned admin
  try {
    const User = require('../models/User');
    const { sendSessionAssignmentEmail } = require('../services/emailService');
    
    const user = await User.findById(userId);
    if (user && user.Email) {
      const sessionDate = new Date(session.ScheduledStartTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Only send notification email WITHOUT password
      // Password should only be sent when creating a new admin, not when assigning to session
      await sendSessionAssignmentEmail({
        email: user.Email,
        firstName: user.FirstName,
        sessionTitle: session.Title,
        sessionDate: sessionDate,
        role: user.Role
        // No password parameter - admin already has their credentials
      });

      logger.info(`Session assignment notification sent to ${user.Email} for session ${session.Title}`);
    }
  } catch (emailError) {
    logger.error('Failed to send session assignment email:', emailError);
    // Don't fail the assignment if email fails
  }

  res.status(201).json({
    message: 'Admin assigned to session successfully',
    assignment
  });
}));

// @route   DELETE /api/sessions/:id/admins/:userId
// @desc    Remove admin from session
// @access  Private (Super Admin or Admin)
router.delete('/:id/admins/:userId', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  param('userId').isInt().withMessage('Valid user ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);

  logger.info(`Attempting to unassign admin ${userId} from session ${sessionId}`);

  // Check if admin is assigned to this session
  const isAssigned = await SessionAdmin.isAssigned(sessionId, userId);
  if (!isAssigned) {
    logger.warn(`Admin ${userId} is not assigned to session ${sessionId}`);
    return res.status(404).json({
      message: 'Admin is not assigned to this session'
    });
  }

  await SessionAdmin.unassign(sessionId, userId);

  logger.info(`Admin ${userId} successfully removed from session ${sessionId}`);
  res.json({
    message: 'Admin removed from session successfully'
  });
}));

// @route   GET /api/sessions/:id/admins
// @desc    Get all admins assigned to a session
// @access  Private
router.get('/:id/admins', [
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);

  const admins = await SessionAdmin.getAdminsBySession(sessionId);

  res.json({
    count: admins.length,
    admins
  });
}));

// =====================================================
// Voter (VoteAllocation) management for a session
// =====================================================

// @route   GET /api/sessions/:id/voters
// @desc    Get all voters enrolled in a session (via VoteAllocations)
// @access  Private (Admin / Super Admin)
router.get('/:id/voters', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { executeQuery } = require('../config/database');

  const result = await executeQuery(`
    SELECT
      u.UserID,
      u.FirstName,
      u.LastName,
      u.Email,
      u.Role,
      u.IsActive,
      u.IsGoodStanding,
      va.AllocationID,
      va.AllocatedVotes,
      va.CreatedAt as AssignedAt
    FROM VoteAllocations va
    INNER JOIN Users u ON u.UserID = va.UserID
    WHERE va.SessionID = @sessionId
    ORDER BY u.LastName, u.FirstName
  `, { sessionId });

  res.json({
    count: result.recordset.length,
    voters: result.recordset
  });
}));

// @route   POST /api/sessions/:id/voters
// @desc    Assign a voter to a session (creates VoteAllocation)
// @access  Private (Admin / Super Admin)
router.post('/:id/voters', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  body('userId').isInt().withMessage('Valid user ID required'),
  body('allocatedVotes').optional().isInt({ min: 1 }),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { userId, allocatedVotes } = req.body;
  const { executeQuery } = require('../config/database');

  // Verify session exists
  const session = await AGMSession.findById(sessionId);
  if (!session) throw new AppError('Session not found', 404);

  // Reject duplicates
  const existing = await executeQuery(
    `SELECT AllocationID FROM VoteAllocations WHERE UserID = @userId AND SessionID = @sessionId`,
    { userId, sessionId }
  );
  if (existing.recordset.length > 0) {
    throw new AppError('Voter is already assigned to this session', 400);
  }

  // Determine vote allocation
  let votes = allocatedVotes || null;
  if (!votes) {
    try {
      const User = require('../models/User');
      const VoteSplittingSettings = require('../models/VoteSplittingSettings');
      const user = await User.findById(userId);
      const settings = await VoteSplittingSettings.getByOrganization(user.OrganizationID);
      votes = settings?.MinIndividualVotes ?? 2;
    } catch { votes = 2; }
  }

  await executeQuery(`
    INSERT INTO VoteAllocations (UserID, SessionID, AllocatedVotes, Reason, BasedOn, SetBy, CreatedAt, UpdatedAt)
    VALUES (@userId, @sessionId, @votes, 'Manual session assignment by admin', 'admin_assigned', @setBy, GETDATE(), GETDATE())
  `, { userId, sessionId, votes, setBy: req.user.userId });

  logger.info(`Voter ${userId} assigned to session ${sessionId} by admin ${req.user.userId}`);

  res.status(201).json({
    message: 'Voter assigned to session successfully'
  });
}));

// @route   DELETE /api/sessions/:id/voters/:userId
// @desc    Remove a voter from a session
// @access  Private (Admin / Super Admin)
router.delete('/:id/voters/:userId', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Valid session ID required'),
  param('userId').isInt().withMessage('Valid user ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { executeQuery } = require('../config/database');

  const result = await executeQuery(
    `DELETE FROM VoteAllocations WHERE UserID = @userId AND SessionID = @sessionId`,
    { userId, sessionId }
  );

  if (result.rowsAffected[0] === 0) {
    throw new AppError('Voter is not assigned to this session', 404);
  }

  logger.info(`Voter ${userId} removed from session ${sessionId} by admin ${req.user.userId}`);
  res.json({ message: 'Voter removed from session successfully' });
}));

module.exports = router;
