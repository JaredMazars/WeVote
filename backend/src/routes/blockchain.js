// =====================================================
// Blockchain Routes
// API endpoints for blockchain vote verification
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const VoteHash = require('../models/VoteHash');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.use(authenticateToken);

// @route   POST /api/blockchain/record-vote
// @desc    Store vote hash in blockchain
// @access  Private (System use - called after vote is cast)
router.post('/record-vote', [
  body('voteId').isInt().withMessage('Vote ID is required'),
  body('userId').isInt().withMessage('User ID is required'),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('voteType').isIn(['candidate', 'resolution']).withMessage('Vote type must be candidate or resolution'),
  body('voteData').isObject().withMessage('Vote data is required'),
  validate
], asyncHandler(async (req, res) => {
  const { voteId, userId, sessionId, voteType, voteData } = req.body;

  // Only allow users to record their own votes or admins
  if (userId !== req.user.userId && !['super_admin', 'admin'].includes(req.user.role)) {
    throw new AppError('Not authorized to record vote hash', 403);
  }

  // Get the last hash in the chain for this session
  const lastHash = await VoteHash.getLastHash(sessionId);
  const previousHash = lastHash ? lastHash.Hash : null;

  // Generate hash for this vote
  const hash = VoteHash.generateHash({
    voteId,
    userId,
    sessionId,
    candidateId: voteData.candidateId || null,
    resolutionId: voteData.resolutionId || null,
    voteValue: voteData.voteValue,
    voteWeight: voteData.voteWeight || 1,
    timestamp: new Date()
  }, previousHash);

  // Store in database
  const voteHash = await VoteHash.create({
    voteId,
    hash,
    previousHash,
    timestamp: new Date(),
    userId,
    sessionId,
    voteType,
    blockchainMetadata: {
      blockNumber: lastHash ? lastHash.HashID + 1 : 1,
      previousBlockId: lastHash ? lastHash.HashID : null
    }
  });

  logger.info(`Vote hash recorded for vote ${voteId} by user ${userId}`);

  res.status(201).json({
    message: 'Vote recorded in blockchain successfully',
    voteHash: {
      hashId: voteHash.HashID,
      hash: voteHash.Hash,
      previousHash: voteHash.PreviousHash,
      timestamp: voteHash.Timestamp,
      blockNumber: voteHash.BlockchainMetadata ? JSON.parse(voteHash.BlockchainMetadata).blockNumber : null
    }
  });
}));

// @route   GET /api/blockchain/verify/:hash
// @desc    Verify vote by hash
// @access  Private
router.get('/verify/:hash', [
  param('hash').isLength({ min: 64, max: 64 }).withMessage('Invalid hash format'),
  validate
], asyncHandler(async (req, res) => {
  const hash = req.params.hash;

  const voteHash = await VoteHash.findByHash(hash);

  if (!voteHash) {
    throw new AppError('Vote hash not found', 404);
  }

  // Verify the hash
  const verification = await VoteHash.verifyHash(voteHash.VoteID);

  res.json({
    found: true,
    voteHash: {
      hashId: voteHash.HashID,
      voteId: voteHash.VoteID,
      userId: voteHash.UserID,
      userName: voteHash.UserName,
      sessionId: voteHash.SessionID,
      sessionName: voteHash.SessionName,
      voteType: voteHash.VoteType,
      timestamp: voteHash.Timestamp,
      hash: voteHash.Hash,
      previousHash: voteHash.PreviousHash
    },
    verification
  });
}));

// @route   GET /api/blockchain/vote/:voteId
// @desc    Get hash for specific vote
// @access  Private
router.get('/vote/:voteId', [
  param('voteId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const voteId = parseInt(req.params.voteId);

  const voteHash = await VoteHash.findByVoteId(voteId);

  if (!voteHash) {
    throw new AppError('No hash found for this vote', 404);
  }

  // Verify the hash
  const verification = await VoteHash.verifyHash(voteId);

  res.json({
    voteHash: {
      hashId: voteHash.HashID,
      voteId: voteHash.VoteID,
      hash: voteHash.Hash,
      previousHash: voteHash.PreviousHash,
      timestamp: voteHash.Timestamp,
      voteType: voteHash.VoteType
    },
    verification
  });
}));

// @route   GET /api/blockchain/session/:sessionId/chain
// @desc    Get entire blockchain chain for session
// @access  Private (Admin/Super Admin/Auditor)
router.get('/session/:sessionId/chain', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);

  const chain = await VoteHash.getSessionChain(sessionId);

  res.json({
    sessionId,
    chainLength: chain.length,
    chain: chain.map(block => ({
      hashId: block.HashID,
      voteId: block.VoteID,
      hash: block.Hash,
      previousHash: block.PreviousHash,
      timestamp: block.Timestamp,
      userName: block.UserName,
      voteType: block.VoteType
    }))
  });
}));

// @route   GET /api/blockchain/session/:sessionId/verify
// @desc    Verify entire session blockchain chain
// @access  Private (Admin/Super Admin/Auditor)
router.get('/session/:sessionId/verify', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);

  const verification = await VoteHash.verifySessionChain(sessionId);

  res.json(verification);
}));

// @route   GET /api/blockchain/statistics
// @desc    Get blockchain statistics
// @access  Private (Admin/Super Admin/Auditor)
router.get('/statistics', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  query('sessionId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = req.query.sessionId ? parseInt(req.query.sessionId) : null;

  const statistics = await VoteHash.getStatistics(sessionId);

  res.json({
    sessionId,
    statistics
  });
}));

module.exports = router;
