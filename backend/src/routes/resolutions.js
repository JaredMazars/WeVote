// =====================================================
// Resolution Routes
// API endpoints for resolution management
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Resolution = require('../models/Resolution');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/resolutions
// @desc    Get all resolutions with optional filters
// @access  Private
router.get('/', [
  query('sessionId').optional().isInt().withMessage('Session ID must be an integer'),
  query('categoryId').optional().isInt().withMessage('Category ID must be an integer'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  validate
], asyncHandler(async (req, res) => {
  const filters = {
    sessionId: req.query.sessionId ? parseInt(req.query.sessionId) : null,
    categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : null,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
  };

  // Remove null filters
  Object.keys(filters).forEach(key => filters[key] === null && delete filters[key]);

  const resolutions = await Resolution.findAll(filters);

  res.json({
    success: true,
    data: resolutions,
    count: resolutions.length
  });
}));

// @route   GET /api/resolutions/categories
// @desc    Get all resolution categories
// @access  Private
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Resolution.getCategories();

  res.json({
    count: categories.length,
    categories
  });
}));

// @route   GET /api/resolutions/category/:categoryId
// @desc    Get resolutions by category
// @access  Private
router.get('/category/:categoryId', [
  param('categoryId').isInt().withMessage('Category ID must be an integer'),
  query('sessionId').optional().isInt().withMessage('Session ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const categoryId = parseInt(req.params.categoryId);
  const sessionId = req.query.sessionId ? parseInt(req.query.sessionId) : null;

  const resolutions = await Resolution.findByCategory(categoryId, sessionId);

  res.json({
    count: resolutions.length,
    resolutions
  });
}));

// @route   GET /api/resolutions/:id
// @desc    Get single resolution by ID
// @access  Private
router.get('/:id', [
  param('id').isInt().withMessage('Resolution ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const resolutionId = parseInt(req.params.id);

  const resolution = await Resolution.findById(resolutionId);

  if (!resolution) {
    throw new AppError('Resolution not found', 404);
  }

  res.json({ resolution });
}));

// @route   POST /api/resolutions
// @desc    Create new resolution
// @access  Private (Super Admin or Admin)
router.post('/', [
  authorizeRoles('super_admin', 'admin'),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('fullText').optional().isString(),
  body('categoryId').optional().isInt().withMessage('Category ID must be an integer'),
  body('secondedBy').optional().isInt().withMessage('Seconded by must be a user ID'),
  body('requiredMajority').optional().isInt({ min: 0, max: 100 }).withMessage('Required majority must be between 0 and 100'),
  body('displayOrder').optional().isInt().withMessage('Display order must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const resolutionData = {
    ...req.body,
    proposedBy: req.user.userId
  };

  const resolution = await Resolution.create(resolutionData);

  logger.info(`Resolution created by user ${req.user.userId}: ${resolution.Title}`);

  res.status(201).json({
    message: 'Resolution created successfully',
    resolution
  });
}));

// @route   PUT /api/resolutions/:id
// @desc    Update resolution
// @access  Private (Super Admin or Admin)
router.put('/:id', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Resolution ID must be an integer'),
  body('title').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('fullText').optional().isString(),
  body('categoryId').optional().isInt(),
  body('secondedBy').optional().isInt(),
  body('requiredMajority').optional().isInt({ min: 0, max: 100 }),
  body('isActive').optional().isBoolean(),
  body('displayOrder').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const resolutionId = parseInt(req.params.id);

  const resolution = await Resolution.update(resolutionId, req.body);

  if (!resolution) {
    throw new AppError('Resolution not found', 404);
  }

  logger.info(`Resolution updated by user ${req.user.userId}: ID ${resolutionId}`);

  res.json({
    message: 'Resolution updated successfully',
    resolution
  });
}));

// @route   DELETE /api/resolutions/:id
// @desc    Delete resolution
// @access  Private (Super Admin only)
router.delete('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt().withMessage('Resolution ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const resolutionId = parseInt(req.params.id);

  const result = await Resolution.delete(resolutionId);

  logger.info(`Resolution deleted by user ${req.user.userId}: ID ${resolutionId}`);

  res.json(result);
}));

// @route   GET /api/resolutions/:id/statistics
// @desc    Get resolution voting statistics
// @access  Private
router.get('/:id/statistics', [
  param('id').isInt().withMessage('Resolution ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const resolutionId = parseInt(req.params.id);

  const statistics = await Resolution.getStatistics(resolutionId);

  if (!statistics) {
    throw new AppError('Resolution not found', 404);
  }

  res.json({ statistics });
}));

module.exports = router;
