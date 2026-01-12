// =====================================================
// Vote Splitting Settings Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const VoteSplittingSettings = require('../models/VoteSplittingSettings');
const { validate } = require('../middleware/validator');
const { authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @route   GET /api/vote-splitting
// @desc    Get vote splitting settings for organization
// @access  Private (Admin, Super Admin)
router.get('/', [
  authorizeRoles('admin', 'super_admin')
], asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const settings = await VoteSplittingSettings.getByOrganization(organizationId);

  if (!settings) {
    // Return default settings if none exist
    return res.json({
      settings: {
        enabled: false,
        min_proxy_voters: 1,
        max_proxy_voters: 10,
        min_individual_votes: 1,
        max_individual_votes: 5
      }
    });
  }

  res.json({
    settings: {
      id: settings.SettingID,
      enabled: settings.Enabled,
      min_proxy_voters: settings.MinProxyVoters,
      max_proxy_voters: settings.MaxProxyVoters,
      min_individual_votes: settings.MinIndividualVotes,
      max_individual_votes: settings.MaxIndividualVotes,
      updated_at: settings.UpdatedAt
    }
  });
}));

// @route   POST /api/vote-splitting
// @desc    Create or update vote splitting settings
// @access  Private (Super Admin only)
router.post('/', [
  authorizeRoles('super_admin'),
  body('enabled').optional().isBoolean().withMessage('Enabled must be a boolean'),
  body('min_proxy_voters').optional().isInt({ min: 1 }).withMessage('Min proxy voters must be at least 1'),
  body('max_proxy_voters').optional().isInt({ min: 1 }).withMessage('Max proxy voters must be at least 1'),
  body('min_individual_votes').optional().isInt({ min: 1 }).withMessage('Min individual votes must be at least 1'),
  body('max_individual_votes').optional().isInt({ min: 1 }).withMessage('Max individual votes must be at least 1'),
  validate
], asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const userId = req.user.userId;

  const settings = await VoteSplittingSettings.upsert(organizationId, req.body, userId);

  logger.info(`Vote splitting settings saved for organization ${organizationId} by user ${userId}`);

  res.json({
    message: 'Vote splitting settings saved successfully',
    settings: {
      id: settings.SettingID,
      enabled: settings.Enabled,
      min_proxy_voters: settings.MinProxyVoters,
      max_proxy_voters: settings.MaxProxyVoters,
      min_individual_votes: settings.MinIndividualVotes,
      max_individual_votes: settings.MaxIndividualVotes,
      updated_at: settings.UpdatedAt
    }
  });
}));

// @route   DELETE /api/vote-splitting
// @desc    Delete vote splitting settings
// @access  Private (Super Admin only)
router.delete('/', [
  authorizeRoles('super_admin')
], asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  await VoteSplittingSettings.delete(organizationId);

  logger.info(`Vote splitting settings deleted for organization ${organizationId}`);

  res.json({
    message: 'Vote splitting settings deleted successfully'
  });
}));

module.exports = router;
