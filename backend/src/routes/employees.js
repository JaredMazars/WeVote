// =====================================================
// Employee Routes
// API endpoints for employee management
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Employee = require('../models/Employee');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/employees
// @desc    Get all employees with filters
// @access  Private (Admin/Super Admin)
router.get('/', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  query('organizationId').optional().isInt(),
  query('departmentId').optional().isInt(),
  query('employmentStatus').optional().isIn(['active', 'inactive', 'terminated']),
  query('isApproved').optional().isBoolean(),
  validate
], asyncHandler(async (req, res) => {
  const filters = {
    organizationId: req.query.organizationId ? parseInt(req.query.organizationId) : null,
    departmentId: req.query.departmentId ? parseInt(req.query.departmentId) : null,
    employmentStatus: req.query.employmentStatus || null,
    isApproved: req.query.isApproved !== undefined ? req.query.isApproved === 'true' : undefined
  };

  // Remove null filters
  Object.keys(filters).forEach(key => filters[key] === null && delete filters[key]);

  const employees = await Employee.findAll(filters);

  res.json({
    count: employees.length,
    employees
  });
}));

// @route   GET /api/employees/managers
// @desc    Get list of managers
// @access  Private
router.get('/managers', [
  query('organizationId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const organizationId = req.query.organizationId ? parseInt(req.query.organizationId) : null;

  const managers = await Employee.getManagers(organizationId);

  res.json({
    count: managers.length,
    managers
  });
}));

// @route   GET /api/employees/status/:userId
// @desc    Check employee status for a user
// @access  Private
router.get('/status/:userId', [
  param('userId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  // Users can check their own status, admins can check any
  if (req.user.userId !== userId && !['admin', 'super_admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Unauthorized to check this employee status', 403);
  }

  const status = await Employee.checkStatus(userId);

  if (!status) {
    throw new AppError('Employee record not found', 404);
  }

  res.json({ status });
}));

// @route   GET /api/employees/statistics
// @desc    Get employee statistics
// @access  Private (Admin/Super Admin)
router.get('/statistics', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  query('organizationId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const organizationId = req.query.organizationId ? parseInt(req.query.organizationId) : null;

  const statistics = await Employee.getStatistics(organizationId);

  res.json({ statistics });
}));

// @route   GET /api/employees/:id
// @desc    Get single employee by ID
// @access  Private
router.get('/:id', [
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const employeeId = parseInt(req.params.id);

  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Users can view their own record, admins can view any
  if (req.user.userId !== employee.UserID && !['admin', 'super_admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Unauthorized to view this employee', 403);
  }

  res.json({ employee });
}));

// @route   POST /api/employees/register
// @desc    Register new employee
// @access  Private
router.post('/register', [
  body('userId').isInt().withMessage('User ID is required'),
  body('organizationId').isInt().withMessage('Organization ID is required'),
  body('employeeNumber').optional().isString(),
  body('departmentId').optional().isInt(),
  body('jobTitle').optional().isString(),
  body('managerId').optional().isInt(),
  body('hireDate').optional().isISO8601(),
  body('skills').optional().isString(),
  body('achievements').optional().isString(),
  body('phoneNumber').optional().isString(),
  body('emergencyContact').optional().isString(),
  body('emergencyPhone').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  // Users can register themselves, admins can register anyone
  if (req.user.userId !== req.body.userId && !['admin', 'super_admin'].includes(req.user.role)) {
    throw new AppError('Unauthorized to register this user as employee', 403);
  }

  const employee = await Employee.create(req.body);

  logger.info(`Employee registered: UserID ${req.body.userId} by user ${req.user.userId}`);

  res.status(201).json({
    message: 'Employee registered successfully. Awaiting admin approval.',
    employee
  });
}));

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private
router.put('/:id', [
  param('id').isInt(),
  body('employeeNumber').optional().isString(),
  body('departmentId').optional().isInt(),
  body('jobTitle').optional().isString(),
  body('managerId').optional().isInt(),
  body('hireDate').optional().isISO8601(),
  body('employmentStatus').optional().isIn(['active', 'inactive', 'terminated']),
  body('skills').optional().isString(),
  body('achievements').optional().isString(),
  body('phoneNumber').optional().isString(),
  body('emergencyContact').optional().isString(),
  body('emergencyPhone').optional().isString(),
  body('profileCompletionPercentage').optional().isInt({ min: 0, max: 100 }),
  validate
], asyncHandler(async (req, res) => {
  const employeeId = parseInt(req.params.id);

  const employee = await Employee.findById(employeeId);
  
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Users can update their own record, admins can update any
  if (req.user.userId !== employee.UserID && !['admin', 'super_admin'].includes(req.user.role)) {
    throw new AppError('Unauthorized to update this employee', 403);
  }

  const updatedEmployee = await Employee.update(employeeId, req.body);

  logger.info(`Employee updated: ID ${employeeId} by user ${req.user.userId}`);

  res.json({
    message: 'Employee updated successfully',
    employee: updatedEmployee
  });
}));

// @route   POST /api/employees/:id/approve
// @desc    Approve employee registration
// @access  Private (Admin/Super Admin)
router.post('/:id/approve', [
  authorizeRoles('super_admin', 'admin'),
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const employeeId = parseInt(req.params.id);

  const approvedEmployee = await Employee.approve(employeeId, req.user.userId);

  if (!approvedEmployee) {
    throw new AppError('Employee not found', 404);
  }

  logger.info(`Employee approved: ID ${employeeId} by user ${req.user.userId}`);

  res.json({
    message: 'Employee approved successfully',
    employee: approvedEmployee
  });
}));

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Super Admin only)
router.delete('/:id', [
  authorizeRoles('super_admin'),
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const employeeId = parseInt(req.params.id);

  const result = await Employee.delete(employeeId);

  logger.info(`Employee deleted: ID ${employeeId} by user ${req.user.userId}`);

  res.json(result);
}));

// @route   POST /api/employees/send-whatsapp
// @desc    Send WhatsApp message to employees
// @access  Private (Admin/Super Admin)
router.post('/send-whatsapp', [
  authorizeRoles('super_admin', 'admin'),
  body('employees').isArray().withMessage('Employees array is required'),
  body('message').notEmpty().withMessage('Message is required'),
  validate
], asyncHandler(async (req, res) => {
  const { employees, message } = req.body;

  // TODO: Implement WhatsApp API integration
  // For now, just log the request
  logger.info(`WhatsApp notification requested by user ${req.user.userId} for ${employees.length} employees`);

  res.json({
    message: 'WhatsApp notifications queued successfully',
    recipientCount: employees.length
  });
}));

module.exports = router;
