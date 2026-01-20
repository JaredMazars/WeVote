// =====================================================
// Voting Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const Vote = require('../models/Vote');
const { validate } = require('../middleware/validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @route   POST /api/votes/candidate
// @desc    Cast vote for candidate
// @access  Private
router.post('/candidate', [
  body('sessionId').isInt().withMessage('Valid session ID required'),
  body('candidateId').isInt().withMessage('Valid candidate ID required'),
  body('votesToAllocate').isInt({ min: 1 }).withMessage('Votes to allocate must be at least 1'),
  validate
], asyncHandler(async (req, res) => {
  const voteData = {
    ...req.body,
    voterUserId: req.user.userId
  };

  const result = await Vote.castCandidateVote(voteData);

  logger.info(`Candidate vote cast: Session ${req.body.sessionId}, Candidate ${req.body.candidateId} by user ${req.user.userId}`);

  res.json({
    message: 'Vote cast successfully',
    result
  });
}));

// @route   POST /api/votes/resolution
// @desc    Cast vote for resolution
// @access  Private
router.post('/resolution', [
  body('sessionId').isInt().withMessage('Valid session ID required'),
  body('resolutionId').isInt().withMessage('Valid resolution ID required'),
  body('voteChoice').isIn(['yes', 'no', 'abstain']).withMessage('Vote choice must be yes, no, or abstain'),
  body('votesToAllocate').optional().isInt({ min: 1 }).withMessage('Votes to allocate must be at least 1'),
  validate
], asyncHandler(async (req, res) => {
  const voteData = {
    ...req.body,
    voterUserId: req.user.userId
  };

  const result = await Vote.castResolutionVote(voteData);

  logger.info(`Resolution vote cast: Session ${req.body.sessionId}, Resolution ${req.body.resolutionId}, Choice: ${req.body.voteChoice} by user ${req.user.userId}`);

  res.json({
    message: 'Vote cast successfully',
    result
  });
}));

// @route   GET /api/votes/allocation/:sessionId
// @desc    Get user's vote allocation for a session
// @access  Private
router.get('/allocation/:sessionId', [
  param('sessionId').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const userId = req.user.userId;

  const allocation = await Vote.getUserVoteAllocation(sessionId, userId);

  if (!allocation) {
    throw new AppError('No vote allocation found for this session', 404);
  }

  res.json({ allocation });
}));

// @route   GET /api/votes/results/candidates/:sessionId
// @desc    Get candidate voting results
// @access  Private
router.get('/results/candidates/:sessionId', [
  param('sessionId').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);

  const results = await Vote.getCandidateResults(sessionId);

  res.json({
    count: results.length,
    results
  });
}));

// @route   GET /api/votes/results/resolutions/:sessionId
// @desc    Get resolution voting results
// @access  Private
router.get('/results/resolutions/:sessionId', [
  param('sessionId').isInt().withMessage('Valid session ID required'),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);

  const results = await Vote.getResolutionResults(sessionId);

  res.json({
    count: results.length,
    results
  });
}));

// @route   GET /api/votes/history
// @desc    Get user's voting history
// @access  Private
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { sessionId } = req.query;

  const history = await Vote.getUserVotingHistory(
    userId,
    sessionId ? parseInt(sessionId) : null
  );

  res.json({
    count: history.length,
    history
  });
}));

// @route   GET /api/votes/user/:userId
// @desc    Get user's votes (for vote tracking/history)
// @access  Private
router.get('/user/:userId', [
  param('userId').isInt().withMessage('Valid user ID required'),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { sessionId } = req.query;

  // Users can only view their own votes, admins can view any
  if (req.user.userId !== userId && !['admin', 'super_admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Unauthorized to view these votes', 403);
  }

  const history = await Vote.getUserVotingHistory(
    userId,
    sessionId ? parseInt(sessionId) : null
  );

  res.json({
    count: history.length,
    votes: history
  });
}));

// @route   GET /api/votes/verify/:transactionId
// @desc    Verify vote by vote ID
// @access  Private - Any authenticated user
router.get('/verify/:voteId', [
  param('voteId').isInt().withMessage('Vote ID must be a number'),
  validate
], asyncHandler(async (req, res) => {
  const { voteId } = req.params;

  const { executeQuery } = require('../config/database');
  
  // Check candidate votes first
  let vote = await executeQuery(`
    SELECT 
      cv.VoteID,
      'candidate' as VoteType,
      cv.SessionID,
      s.Title as SessionTitle,
      cv.CandidateID,
      c.Category as CandidateName,
      cv.VoterUserID,
      'Voter-' + CAST(cv.VoterUserID AS NVARCHAR) as VoterIdentifier,
      cv.VotesAllocated,
      cv.IsProxyVote,
      cv.ProxyID,
      cv.VotedAt
    FROM CandidateVotes cv
    INNER JOIN AGMSessions s ON cv.SessionID = s.SessionID
    INNER JOIN Candidates c ON cv.CandidateID = c.CandidateID
    WHERE cv.VoteID = @voteId
  `, { voteId });

  if (vote.recordset.length === 0) {
    // Check resolution votes if not found in candidate votes
    vote = await executeQuery(`
      SELECT 
        rv.VoteID,
        'resolution' as VoteType,
        rv.SessionID,
        s.Title as SessionTitle,
        rv.ResolutionID,
        r.ResolutionTitle,
        rv.VoterUserID,
        'Voter-' + CAST(rv.VoterUserID AS NVARCHAR) as VoterIdentifier,
        rv.VoteChoice,
        rv.VotesAllocated,
        rv.IsProxyVote,
        rv.ProxyID,
        rv.VotedAt
      FROM ResolutionVotes rv
      INNER JOIN AGMSessions s ON rv.SessionID = s.SessionID
      INNER JOIN Resolutions r ON rv.ResolutionID = r.ResolutionID
      WHERE rv.VoteID = @voteId
    `, { voteId });
  }

  if (vote.recordset.length === 0) {
    throw new AppError('Vote not found', 404);
  }

  const voteData = vote.recordset[0];


  res.json({
    verified: true,
    voteId: voteData.VoteID,
    vote: {
      voteType: voteData.VoteType,
      sessionTitle: voteData.SessionTitle,
      entityName: voteData.CandidateName || voteData.ResolutionTitle,
      voteChoice: voteData.VoteChoice || null,
      votesAllocated: voteData.VotesAllocated,
      votedAt: voteData.VotedAt,
      isProxyVote: voteData.IsProxyVote,
      proxyId: voteData.ProxyID,
      // Anonymize voter for privacy
      voterIdentifier: voteData.VoterIdentifier
    }
  });
}));

module.exports = router;
