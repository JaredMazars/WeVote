// =====================================================
// Voting Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const Vote = require('../models/Vote');
const AGMSession = require('../models/AGMSession');
const User = require('../models/User');
const { validate } = require('../middleware/validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { sendVoteConfirmationEmail } = require('../services/emailService');

// @route   POST /api/votes/candidate
// @desc    Cast vote for candidate
// @access  Private
router.post('/candidate', [
  body('sessionId').isInt().withMessage('Valid session ID required'),
  body('candidateId').isInt().withMessage('Valid candidate ID required'),
  body('votesToAllocate').isInt({ min: 1 }).withMessage('Votes to allocate must be at least 1'),
  validate
], asyncHandler(async (req, res) => {
  const { sessionId, candidateId, votesToAllocate } = req.body;
  const voterUserId = req.user.userId;

  // 0. Role-based voting eligibility check
  if (!['voter', 'admin', 'super_admin'].includes(req.user.role)) {
    throw new AppError('You are not authorised to vote. Your account has not been approved as a voter. Please contact an administrator.', 403);
  }

  // 0b. Good standing check (voters only) — vote IS cast but flagged if not in good standing
  let notGoodStanding = false;
  if (req.user.role === 'voter') {
    const { executeQuery } = require('../config/database');
    const standingRes = await executeQuery(
      'SELECT IsGoodStanding, GoodStandingNote FROM Users WHERE UserID = @userId',
      { userId: voterUserId }
    );
    const standing = standingRes.recordset[0];
    if (!standing || !standing.IsGoodStanding) {
      notGoodStanding = true;
    }
  }

  // 1. Duplicate vote prevention
  const alreadyVoted = await Vote.hasVotedForCandidate(voterUserId, sessionId, candidateId);
  if (alreadyVoted) {
    throw new AppError('You have already voted for this candidate in this session', 409);
  }

  // 2. Quorum enforcement
  const session = await AGMSession.findById(sessionId);
  if (session && session.TotalVoters > 0 && !session.QuorumReached) {
    const attendeeCount = await Vote.getAttendanceCount(sessionId);
    const quorumPct = (attendeeCount / session.TotalVoters) * 100;
    if (quorumPct < (session.QuorumRequired || 50)) {
      throw new AppError(
        `Quorum not met (${quorumPct.toFixed(1)}% present, ${session.QuorumRequired || 50}% required). Voting cannot proceed until quorum is reached.`,
        403
      );
    }
  }

  const voteData = { sessionId, candidateId, votesToAllocate, voterUserId };
  const result = await Vote.castCandidateVote(voteData);

  logger.info(`Candidate vote cast: Session ${sessionId}, Candidate ${candidateId} by user ${voterUserId}${notGoodStanding ? ' [FLAGGED — not in good standing]' : ''}`);

  // If not in good standing, log the flagged vote and notify (non-blocking)
  if (notGoodStanding) {
    const { executeQuery } = require('../config/database');
    executeQuery(`
      INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
      VALUES (@uid, 'VOTE_CAST_NOT_GOOD_STANDING', 'CandidateVote', @cid, @details, @ip, @ua, GETDATE())
    `, {
      uid: voterUserId,
      cid: candidateId,
      details: `Vote recorded but flagged — user ${voterUserId} cast candidate vote while not in good standing. VoteID: ${result?.VoteID || 'N/A'}`,
      ip: req.ip || 'unknown',
      ua: req.headers['user-agent'] || 'unknown'
    }).catch(e => logger.warn('Audit log failed (non-fatal):', e.message));
    User.findById(voterUserId).then(voter => {
      if (voter?.Email) {
        const { sendNotGoodStandingEmail } = require('../services/emailService');
        sendNotGoodStandingEmail({ email: voter.Email, firstName: voter.FirstName }).catch(() => {});
      }
    }).catch(() => {});
  }

  // 3. Fire-and-forget vote confirmation email (never block the response)
  try {
    const voter = await User.findById(voterUserId);
    if (voter?.Email) {
      const candidateRes = await require('../config/database').executeQuery(
        `SELECT e.FirstName + ' ' + e.LastName AS FullName FROM Candidates c
         INNER JOIN Employees emp ON c.EmployeeID = emp.EmployeeID
         INNER JOIN Users e ON emp.UserID = e.UserID
         WHERE c.CandidateID = @candidateId`,
        { candidateId }
      );
      const candidateName = candidateRes.recordset[0]?.FullName || `Candidate #${candidateId}`;
      sendVoteConfirmationEmail({
        email: voter.Email,
        firstName: voter.FirstName,
        voteType: 'Candidate Vote',
        entityName: candidateName,
        voteId: result?.VoteID || 'N/A',
        sessionTitle: session?.Title || `Session #${sessionId}`
      }).catch(err => logger.warn('Vote confirmation email failed (non-fatal):', err.message));
    }
  } catch (emailErr) {
    logger.warn('Could not send vote confirmation email (non-fatal):', emailErr.message);
  }

  res.json({
    message: notGoodStanding
      ? 'Your vote has been recorded but flagged for review — your account is not currently in good standing. Please contact an administrator.'
      : 'Vote cast successfully',
    flagged: notGoodStanding,
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
  const { sessionId, resolutionId, voteChoice, votesToAllocate } = req.body;
  const voterUserId = req.user.userId;

  // 0. Role-based voting eligibility check
  if (!['voter', 'admin', 'super_admin'].includes(req.user.role)) {
    throw new AppError('You are not authorised to vote. Your account has not been approved as a voter. Please contact an administrator.', 403);
  }

  // 0b. Good standing check (voters only) — vote IS cast but flagged if not in good standing
  let notGoodStanding = false;
  if (req.user.role === 'voter') {
    const { executeQuery } = require('../config/database');
    const standingRes = await executeQuery(
      'SELECT IsGoodStanding, GoodStandingNote FROM Users WHERE UserID = @userId',
      { userId: voterUserId }
    );
    const standing = standingRes.recordset[0];
    if (!standing || !standing.IsGoodStanding) {
      notGoodStanding = true;
    }
  }

  // 1. Duplicate vote prevention
  const alreadyVoted = await Vote.hasVotedForResolution(voterUserId, sessionId, resolutionId);
  if (alreadyVoted) {
    throw new AppError('You have already voted on this resolution in this session', 409);
  }

  // 2. Quorum enforcement
  const session = await AGMSession.findById(sessionId);
  if (session && session.TotalVoters > 0 && !session.QuorumReached) {
    const attendeeCount = await Vote.getAttendanceCount(sessionId);
    const quorumPct = (attendeeCount / session.TotalVoters) * 100;
    if (quorumPct < (session.QuorumRequired || 50)) {
      throw new AppError(
        `Quorum not met (${quorumPct.toFixed(1)}% present, ${session.QuorumRequired || 50}% required). Voting cannot proceed until quorum is reached.`,
        403
      );
    }
  }

  const voteData = { sessionId, resolutionId, voteChoice, votesToAllocate: votesToAllocate || 1, voterUserId };
  const result = await Vote.castResolutionVote(voteData);

  logger.info(`Resolution vote cast: Session ${sessionId}, Resolution ${resolutionId}, Choice: ${voteChoice} by user ${voterUserId}${notGoodStanding ? ' [FLAGGED — not in good standing]' : ''}`);

  // If not in good standing, log the flagged vote and notify (non-blocking)
  if (notGoodStanding) {
    const { executeQuery } = require('../config/database');
    executeQuery(`
      INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
      VALUES (@uid, 'VOTE_CAST_NOT_GOOD_STANDING', 'ResolutionVote', @rid, @details, @ip, @ua, GETDATE())
    `, {
      uid: voterUserId,
      rid: resolutionId,
      details: `Vote recorded but flagged — user ${voterUserId} cast resolution vote while not in good standing. VoteID: ${result?.VoteID || 'N/A'}`,
      ip: req.ip || 'unknown',
      ua: req.headers['user-agent'] || 'unknown'
    }).catch(e => logger.warn('Audit log failed (non-fatal):', e.message));
    User.findById(voterUserId).then(voter => {
      if (voter?.Email) {
        const { sendNotGoodStandingEmail } = require('../services/emailService');
        sendNotGoodStandingEmail({ email: voter.Email, firstName: voter.FirstName }).catch(() => {});
      }
    }).catch(() => {});
  }

  // 3. Fire-and-forget vote confirmation email
  try {
    const voter = await User.findById(voterUserId);
    if (voter?.Email) {
      const resRes = await require('../config/database').executeQuery(
        `SELECT Title FROM Resolutions WHERE ResolutionID = @resolutionId`,
        { resolutionId }
      );
      const resTitle = resRes.recordset[0]?.Title || `Resolution #${resolutionId}`;
      const choiceLabel = voteChoice === 'yes' ? 'In Favour' : voteChoice === 'no' ? 'Against' : 'Abstain';
      sendVoteConfirmationEmail({
        email: voter.Email,
        firstName: voter.FirstName,
        voteType: 'Resolution Vote',
        entityName: `${resTitle} — ${choiceLabel}`,
        voteId: result?.VoteID || 'N/A',
        sessionTitle: session?.Title || `Session #${sessionId}`
      }).catch(err => logger.warn('Vote confirmation email failed (non-fatal):', err.message));
    }
  } catch (emailErr) {
    logger.warn('Could not send vote confirmation email (non-fatal):', emailErr.message);
  }

  res.json({
    message: notGoodStanding
      ? 'Your vote has been recorded but flagged for review — your account is not currently in good standing. Please contact an administrator.'
      : 'Vote cast successfully',
    flagged: notGoodStanding,
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
// @desc    Get voting history — all votes for admins/auditors, own votes for regular users
// @access  Private
router.get('/history', asyncHandler(async (req, res) => {
  const { userId, role } = req.user;
  const { sessionId } = req.query;
  const parsedSessionId = sessionId ? parseInt(sessionId) : null;

  let history;
  if (['admin', 'super_admin', 'auditor'].includes(role)) {
    // Admins see all votes with voter names
    history = await Vote.getAllVotingHistory(parsedSessionId);
  } else {
    // Regular users see only their own votes
    history = await Vote.getUserVotingHistory(userId, parsedSessionId);
  }

  res.json({
    success: true,
    count: history.length,
    data: history
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
      u_cand.FirstName + ' ' + u_cand.LastName AS CandidateName,
      cv.VoterUserID,
      'Voter-' + CAST(cv.VoterUserID AS NVARCHAR) as VoterIdentifier,
      cv.VotesAllocated,
      cv.IsProxyVote,
      cv.ProxyID,
      cv.VotedAt
    FROM CandidateVotes cv
    INNER JOIN AGMSessions s ON cv.SessionID = s.SessionID
    INNER JOIN Candidates c ON cv.CandidateID = c.CandidateID
    INNER JOIN Employees emp_c ON c.EmployeeID = emp_c.EmployeeID
    INNER JOIN Users u_cand ON emp_c.UserID = u_cand.UserID
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
        r.Title AS ResolutionTitle,
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

// @route   GET /api/votes/results/stream/:sessionId
// @desc    Server-Sent Events stream for live voting results
// @access  Private (token via query param for EventSource compatibility)
router.get('/results/stream/:sessionId', asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendUpdate = async () => {
    try {
      const [candidates, resolutions] = await Promise.all([
        Vote.getCandidateResults(sessionId),
        Vote.getResolutionResults(sessionId)
      ]);
      res.write(`data: ${JSON.stringify({ candidates, resolutions, timestamp: new Date().toISOString() })}\n\n`);
    } catch (err) {
      logger.error('SSE results stream error:', err);
    }
  };

  await sendUpdate();
  const interval = setInterval(sendUpdate, 10000);
  req.on('close', () => {
    clearInterval(interval);
    logger.info(`Results stream closed for session ${sessionId}`);
  });
}));

module.exports = router;