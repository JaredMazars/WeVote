// =====================================================
// Department Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Department = require('../models/Department');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.use(authenticateToken);

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', [
  query('organizationId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const organizationId = req.query.organizationId ? parseInt(req.query.organizationId) : null;
  const departments = await Department.findAll(organizationId);
  res.json({ count: departments.length, departments });
}));

// @route   GET /api/departments/:id
// @desc    Get single department
// @access  Private
router.get('/:id', [
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const department = await Department.findById(parseInt(req.params.id));
  
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  res.json({ department });
}));

// @route   POST /api/departments
// @desc    Create department
// @access  Private (Admin/Super Admin)
router.post('/', [
  authorizeRoles('super_admin', 'admin'),
  body('organizationId').isInt().withMessage('Organization ID is required'),
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').optional().isString(),
  body('description').optional().isString(),
  body('managerId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  
  logger.info(`Department created: ${department.DepartmentName} by user ${req.user.userId}`);
  
  res.status(201).json({ message: 'Department created successfully', department });
}));

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Admin/Super Admin)
router.put('/:id', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const department = await Department.update(parseInt(req.params.id), req.body);
  
  logger.info(`Department updated: ID ${req.params.id} by user ${req.user.userId}`);
  
  res.json({ message: 'Department updated successfully', department });
}));

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Super Admin)
router.delete('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const result = await Department.delete(parseInt(req.params.id));
  
  logger.info(`Department deleted: ID ${req.params.id} by user ${req.user.userId}`);
  
  res.json(result);
}));

module.exports = router;
