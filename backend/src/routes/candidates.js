// =====================================================
// Candidate Routes
// API endpoints for candidate management
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Candidate = require('../models/Candidate');
const Employee = require('../models/Employee');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/candidates
// @desc    Get all candidates with optional filters
// @access  Private
router.get('/', [
  query('sessionId').optional().isInt().withMessage('Session ID must be an integer'),
  query('categoryId').optional().isInt().withMessage('Category ID must be an integer'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('department').optional().isString().withMessage('Department must be a string'),
  validate
], asyncHandler(async (req, res) => {
  const filters = {
    sessionId: req.query.sessionId ? parseInt(req.query.sessionId) : null,
    categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : null,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    department: req.query.department || null
  };

  // Remove null filters
  Object.keys(filters).forEach(key => filters[key] === null && delete filters[key]);

  const candidates = await Candidate.findAll(filters);

  res.json({
    count: candidates.length,
    candidates
  });
}));

// @route   GET /api/candidates/categories
// @desc    Get all candidate categories
// @access  Private
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Candidate.getCategories();

  res.json({
    count: categories.length,
    categories
  });
}));

// @route   GET /api/candidates/category/:categoryId
// @desc    Get candidates by category
// @access  Private
router.get('/category/:categoryId', [
  param('categoryId').isInt().withMessage('Category ID must be an integer'),
  query('sessionId').optional().isInt().withMessage('Session ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const categoryId = parseInt(req.params.categoryId);
  const sessionId = req.query.sessionId ? parseInt(req.query.sessionId) : null;

  const candidates = await Candidate.findByCategory(categoryId, sessionId);

  res.json({
    count: candidates.length,
    candidates
  });
}));

// @route   GET /api/candidates/:id
// @desc    Get single candidate by ID
// @access  Private
router.get('/:id', [
  param('id').isInt().withMessage('Candidate ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const candidateId = parseInt(req.params.id);

  const candidate = await Candidate.findById(candidateId);

  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  res.json({ candidate });
}));

// @route   POST /api/candidates
// @desc    Create new candidate
// @access  Private (Super Admin or Admin)
router.post('/', [
  authorizeRoles('super_admin', 'admin'),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('employeeId').isInt().withMessage('Employee ID is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('nominationReason').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  // Create the candidate linked to an existing employee
  const candidateData = {
    sessionId: req.body.sessionId,
    employeeId: req.body.employeeId,
    category: req.body.category,
    nominatedBy: req.user.userId,
    nominationReason: req.body.nominationReason || null
  };

  const candidate = await Candidate.create(candidateData);

  logger.info(`Candidate created by user ${req.user.userId}: ${candidate.FirstName} ${candidate.LastName} (Employee ID: ${req.body.employeeId})`);

  res.status(201).json({
    message: 'Candidate created successfully',
    candidate
  });
}));

// @route   PUT /api/candidates/:id
// @desc    Update candidate
// @access  Private (Super Admin or Admin)
router.put('/:id', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt().withMessage('Candidate ID must be an integer'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('phoneNumber').optional().isString(),
  body('department').optional().isString(),
  body('position').optional().isString(),
  body('categoryId').optional().isInt(),
  body('bio').optional().isString(),
  body('profilePictureURL').optional().isURL(),
  body('isActive').optional().isBoolean(),
  body('displayOrder').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const candidateId = parseInt(req.params.id);

  const candidate = await Candidate.update(candidateId, req.body);

  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  logger.info(`Candidate updated by user ${req.user.userId}: ID ${candidateId}`);

  res.json({
    message: 'Candidate updated successfully',
    candidate
  });
}));

// @route   DELETE /api/candidates/:id
// @desc    Delete candidate
// @access  Private (Super Admin only)
router.delete('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt().withMessage('Candidate ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const candidateId = parseInt(req.params.id);

  const result = await Candidate.delete(candidateId);

  logger.info(`Candidate deleted by user ${req.user.userId}: ID ${candidateId}`);

  res.json(result);
}));

// @route   GET /api/candidates/:id/statistics
// @desc    Get candidate voting statistics
// @access  Private
router.get('/:id/statistics', [
  param('id').isInt().withMessage('Candidate ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const candidateId = parseInt(req.params.id);

  const statistics = await Candidate.getStatistics(candidateId);

  if (!statistics) {
    throw new AppError('Candidate not found', 404);
  }

  res.json({ statistics });
}));

module.exports = router;
