// =====================================================
// Organization Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const Organization = require('../models/Organization');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.use(authenticateToken);

// @route   GET /api/organizations
// @desc    Get all organizations
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const organizations = await Organization.findAll();
  res.json({ count: organizations.length, organizations });
}));

// @route   GET /api/organizations/:id
// @desc    Get single organization
// @access  Private
router.get('/:id', [
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const organization = await Organization.findById(parseInt(req.params.id));
  
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  res.json({ organization });
}));

// @route   POST /api/organizations
// @desc    Create organization
// @access  Private (Super Admin)
router.post('/', [
  authorizeRoles('super_admin'),
  body('name').trim().notEmpty().withMessage('Organization name is required'),
  body('type').optional().isString(),
  body('industry').optional().isString(),
  body('email').optional().isEmail(),
  body('phoneNumber').optional().isString(),
  body('website').optional().isURL(),
  validate
], asyncHandler(async (req, res) => {
  const organization = await Organization.create(req.body);
  
  logger.info(`Organization created: ${organization.OrganizationName} by user ${req.user.userId}`);
  
  res.status(201).json({ message: 'Organization created successfully', organization });
}));

// @route   PUT /api/organizations/:id
// @desc    Update organization
// @access  Private (Super Admin)
router.put('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const organization = await Organization.update(parseInt(req.params.id), req.body);
  
  logger.info(`Organization updated: ID ${req.params.id} by user ${req.user.userId}`);
  
  res.json({ message: 'Organization updated successfully', organization });
}));

// @route   DELETE /api/organizations/:id
// @desc    Delete organization
// @access  Private (Super Admin)
router.delete('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const result = await Organization.delete(parseInt(req.params.id));
  
  logger.info(`Organization deleted: ID ${req.params.id} by user ${req.user.userId}`);
  
  res.json(result);
}));

module.exports = router;
