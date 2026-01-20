// =====================================================
// Proxy Routes
// API endpoints for proxy voting management
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Proxy = require('../models/Proxy');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// All routes require authentication
router.use(authenticateToken);

// @route   POST /api/proxy/appoint
// @desc    Create proxy assignment
// @access  Private
router.post('/appoint', [
  body('principalUserId').isInt().withMessage('Principal user ID is required'),
  body('proxyHolderId').isInt().withMessage('Proxy holder ID is required'),
  body('sessionId').optional().isInt(),
  body('assignmentType').optional().isIn(['discretionary', 'instructional']),
  body('validUntil').optional().isISO8601(),
  body('maxVotesAllowed').optional().isInt({ min: 1 }),
  body('canDelegate').optional().isBoolean(),
  body('notes').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  // Users can only assign their own proxy, admins can assign any
  if (req.user.userId !== req.body.principalUserId && !['admin', 'super_admin'].includes(req.user.role)) {
    throw new AppError('Unauthorized to create proxy assignment for this user', 403);
  }

  // Map API field names to model field names
  const proxyData = {
    principalUserId: req.body.principalUserId,
    proxyUserId: req.body.proxyHolderId, // API uses proxyHolderId, DB/model uses proxyUserId
    sessionId: req.body.sessionId,
    proxyType: req.body.assignmentType || 'general',
    endDate: req.body.validUntil,
    maxVotesAllowed: req.body.maxVotesAllowed,
    canDelegate: req.body.canDelegate,
    notes: req.body.notes
  };

  const proxy = await Proxy.create(proxyData);

  logger.info(`Proxy assignment created: Principal ${req.body.principalUserId} -> Proxy ${req.body.proxyHolderId}`);

  res.status(201).json({
    message: 'Proxy assignment created successfully',
    proxy
  });
}));

// @route   POST /api/proxy/instructional
// @desc    Create instructional proxy with specific voting instructions
// @access  Private
router.post('/instructional', [
  body('principalUserId').isInt().withMessage('Principal user ID is required'),
  body('proxyHolderId').isInt().withMessage('Proxy holder ID is required'),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('instructions').isArray().withMessage('Instructions array is required'),
  body('instructions.*.type').isIn(['candidate', 'resolution']),
  body('instructions.*.targetId').isInt(),
  body('instructions.*.votesAllocated').isInt({ min: 1 }),
  validate
], asyncHandler(async (req, res) => {
  // Users can only assign their own proxy
  if (req.user.userId !== req.body.principalUserId && !['admin', 'super_admin'].includes(req.user.role)) {
    throw new AppError('Unauthorized to create instructional proxy', 403);
  }

  // Map API field names to model field names
  const instructionalData = {
    principalUserId: req.body.principalUserId,
    proxyUserId: req.body.proxyHolderId, // API uses proxyHolderId, DB/model uses proxyUserId
    sessionId: req.body.sessionId,
    instructions: req.body.instructions
  };

  const result = await Proxy.createInstructional(instructionalData);

  logger.info(`Instructional proxy created: Principal ${req.body.principalUserId} -> Proxy ${req.body.proxyHolderId}`);

  res.status(201).json({
    message: 'Instructional proxy created successfully',
    ...result
  });
}));

// @route   GET /api/proxy/appointments/:userId
// @desc    Get proxy assignments where user is the principal
// @access  Private
router.get('/appointments/:userId', [
  param('userId').isInt(),
  query('sessionId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const sessionId = req.query.sessionId ? parseInt(req.query.sessionId) : null;

  // Users can only view their own appointments, admins can view any
  if (req.user.userId !== userId && !['admin', 'super_admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Unauthorized to view these proxy appointments', 403);
  }

  const appointments = await Proxy.getAssignmentsByPrincipal(userId, sessionId);

  res.json({
    count: appointments.length,
    appointments
  });
}));

// @route   GET /api/proxy/for-user/:userId
// @desc    Get proxy assignments where user is the proxy holder
// @access  Private
router.get('/for-user/:userId', [
  param('userId').isInt(),
  query('sessionId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const sessionId = req.query.sessionId ? parseInt(req.query.sessionId) : null;

  // Users can only view their own proxy holder assignments, admins can view any
  if (req.user.userId !== userId && !['admin', 'super_admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Unauthorized to view these proxy assignments', 403);
  }

  const assignments = await Proxy.getAssignmentsByProxyHolder(userId, sessionId);

  res.json({
    count: assignments.length,
    assignments
  });
}));

// @route   GET /api/proxy/vote-weight/:userId/:sessionId
// @desc    Calculate vote weight for user in session
// @access  Private
router.get('/vote-weight/:userId/:sessionId', [
  param('userId').isInt(),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const sessionId = parseInt(req.params.sessionId);

  const voteWeight = await Proxy.calculateVoteWeight(userId, sessionId);

  res.json({ voteWeight });
}));

// @route   GET /api/proxy/holder/:userId
// @desc    Get all proxy assignments where user is the proxy holder
// @access  Private
router.get('/holder/:userId', [
  param('userId').isInt().withMessage('Valid user ID required'),
  validate
], asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  // Users can only view their own proxy assignments, admins can view any
  if (req.user.userId !== userId && !['admin', 'super_admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Unauthorized to view these proxy assignments', 403);
  }

  // Get all active proxy assignments where this user is the proxy holder
  const proxies = await Proxy.getAssignmentsByProxyHolder(userId);

  res.json({
    count: proxies.length,
    proxies
  });
}));

// @route   GET /api/proxy/assignees/:proxyHolderId/:sessionId
// @desc    Get list of assignees for a proxy holder in a session
// @access  Private
router.get('/assignees/:proxyHolderId/:sessionId', [
  param('proxyHolderId').isInt(),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const proxyHolderId = parseInt(req.params.proxyHolderId);
  const sessionId = parseInt(req.params.sessionId);

  // Users can only view their own assignees, admins can view any
  if (req.user.userId !== proxyHolderId && !['admin', 'super_admin', 'auditor'].includes(req.user.role)) {
    throw new AppError('Unauthorized to view these assignees', 403);
  }

  const assignees = await Proxy.getProxyAssignees(proxyHolderId, sessionId);

  res.json({
    count: assignees.length,
    assignees
  });
}));

// @route   GET /api/proxy/instructions/:proxyAssignmentId
// @desc    Get proxy instructions for an assignment
// @access  Private
router.get('/instructions/:proxyAssignmentId', [
  param('proxyAssignmentId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const proxyAssignmentId = parseInt(req.params.proxyAssignmentId);

  const instructions = await Proxy.getInstructions(proxyAssignmentId);

  res.json({
    count: instructions.length,
    instructions
  });
}));

// @route   GET /api/proxy/session/:sessionId
// @desc    Get all active proxies for a session
// @access  Private (Admin/Super Admin/Auditor)
router.get('/session/:sessionId', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);

  const proxies = await Proxy.getSessionProxies(sessionId);

  res.json({
    count: proxies.length,
    proxies
  });
}));

// @route   GET /api/proxy/assignments
// @desc    Get all proxy assignments (Admin Dashboard)
// @access  Private (Admin/Super Admin/Auditor)
router.get('/assignments', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  query('userId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId) : null;
  
  const { executeQuery } = require('../config/database');
  
  let query = `
    SELECT 
      pa.ProxyID,
      pa.SessionID,
      pa.PrincipalUserID AS GrantorUserID,
      grantor.FirstName AS GrantorFirstName,
      grantor.LastName AS GrantorLastName,
      pa.ProxyUserID,
      proxy.FirstName AS ProxyFirstName,
      proxy.LastName AS ProxyLastName,
      pa.ProxyType,
      pa.StartDate,
      pa.EndDate,
      pa.IsActive,
      pa.CreatedAt,
      s.Title AS SessionTitle,
      COUNT(pi.InstructionID) as InstructionCount
    FROM ProxyAssignments pa
    LEFT JOIN Users grantor ON pa.PrincipalUserID = grantor.UserID
    LEFT JOIN Users proxy ON pa.ProxyUserID = proxy.UserID
    LEFT JOIN AGMSessions s ON pa.SessionID = s.SessionID
    LEFT JOIN ProxyInstructions pi ON pa.ProxyID = pi.ProxyID
    WHERE pa.IsActive = 1
    ${userId ? 'AND (pa.PrincipalUserID = @userId OR pa.ProxyUserID = @userId)' : ''}
    GROUP BY pa.ProxyID, pa.SessionID, pa.PrincipalUserID, 
             grantor.FirstName, grantor.LastName, pa.ProxyUserID,
             proxy.FirstName, proxy.LastName, pa.ProxyType,
             pa.StartDate, pa.EndDate, pa.IsActive, pa.CreatedAt,
             s.Title
    ORDER BY pa.ProxyID DESC
  `;
  
  const result = await executeQuery(query, userId ? { userId } : {});

  res.json({
    success: true,
    data: result.recordset,
    count: result.recordset.length
  });
}));

// @route   GET /api/proxy/pending/assignments
// @desc    Get all proxy assignments (for admin approval interface)
// @access  Private (Admin/Super Admin)
router.get('/pending/assignments', [
  authorizeRoles('super_admin', 'admin'),
  asyncHandler(async (req, res) => {
    const { executeQuery } = require('../config/database');

    const result = await executeQuery(`
      SELECT 
        pa.ProxyID as id,
        pa.SessionID,
        pa.PrincipalUserID,
        principal.FirstName + ' ' + principal.LastName as principal_name,
        principal.Email as principal_email,
        pa.ProxyUserID,
        proxyUser.FirstName + ' ' + proxyUser.LastName as proxy_name,
        proxyUser.Email as proxy_email,
        pa.ProxyType as appointment_type,
        pa.StartDate as start_date,
        pa.IsActive,
        CASE 
          WHEN pa.IsActive = 1 THEN 'approved'
          WHEN pa.IsActive = 0 THEN 'pending'
          ELSE 'rejected'
        END as approval_status,
        pa.CreatedAt as created_at,
        s.Title as session_title
      FROM ProxyAssignments pa
      LEFT JOIN Users principal ON pa.PrincipalUserID = principal.UserID
      LEFT JOIN Users proxyUser ON pa.ProxyUserID = proxyUser.UserID
      LEFT JOIN AGMSessions s ON pa.SessionID = s.SessionID
      ORDER BY pa.CreatedAt DESC
    `);

    // Transform to match frontend format
    const transformedData = result.recordset.map(proxy => ({
      id: proxy.id?.toString(),
      appointment: {
        id: `appt-${proxy.id}`,
        member_full_name: proxy.principal_name,
        member_email: proxy.principal_email,
        proxy_holder_name: proxy.proxy_name,
        proxy_holder_email: proxy.proxy_email,
        appointment_type: proxy.appointment_type || 'discretionary',
        approval_status: proxy.approval_status,
        created_at: proxy.created_at,
        session_title: proxy.session_title
      },
      proxy_assignment: {
        id: proxy.id,
        principal_user_id: proxy.PrincipalUserID,
        proxy_user_id: proxy.ProxyUserID,
        session_id: proxy.SessionID,
        start_date: proxy.start_date
      }
    }));

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });
  })
]);

// @route   PUT /api/proxy/:id/approve
// @desc    Approve a pending proxy assignment
// @access  Private (Admin/Super Admin)
router.put('/:id/approve', [
  param('id').isInt().withMessage('Valid proxy ID required'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const proxyId = parseInt(req.params.id);
    const sql = require('mssql');
    const { getPool } = require('../config/database');
    const pool = await getPool();

    // Update proxy to active
    await pool.request()
      .input('proxyId', sql.Int, proxyId)
      .query`
        UPDATE ProxyAssignments 
        SET IsActive = 1,
            UpdatedAt = GETDATE()
        WHERE ProxyID = @proxyId
      `;

    res.json({
      success: true,
      message: 'Proxy assignment approved successfully'
    });
  })
]);

// @route   DELETE /api/proxy/:id/reject
// @desc    Reject and delete a pending proxy assignment
// @access  Private (Admin/Super Admin)
router.delete('/:id/reject', [
  param('id').isInt().withMessage('Valid proxy ID required'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const proxyId = parseInt(req.params.id);
    const sql = require('mssql');
    const { getPool } = require('../config/database');
    const pool = await getPool();

    // Delete the rejected proxy assignment
    await pool.request()
      .input('proxyId', sql.Int, proxyId)
      .query`DELETE FROM ProxyAssignments WHERE ProxyID = @proxyId`;

    res.json({
      success: true,
      message: 'Proxy assignment rejected and removed'
    });
  })
]);

// @route   POST /api/proxy/:id/revoke
// @desc    Revoke proxy assignment
// @access  Private
router.post('/:id/revoke', [
  param('id').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const proxyAssignmentId = parseInt(req.params.id);

  // TODO: Check if user is authorized to revoke (principal or admin)
  
  const revokedProxy = await Proxy.revoke(proxyAssignmentId, req.user.userId);

  if (!revokedProxy) {
    throw new AppError('Proxy assignment not found', 404);
  }

  logger.info(`Proxy assignment revoked: ID ${proxyAssignmentId} by user ${req.user.userId}`);

  res.json({
    message: 'Proxy assignment revoked successfully',
    proxy: revokedProxy
  });
}));

// @route   PUT /api/proxy/:id
// @desc    Update proxy assignment
// @access  Private
router.put('/:id', [
  param('id').isInt(),
  body('maxVotesAllowed').optional().isInt({ min: 1 }),
  body('canDelegate').optional().isBoolean(),
  body('notes').optional().isString(),
  body('validUntil').optional().isISO8601(),
  validate
], asyncHandler(async (req, res) => {
  const proxyAssignmentId = parseInt(req.params.id);

  // TODO: Check if user is authorized to update (principal or admin)

  const updatedProxy = await Proxy.update(proxyAssignmentId, req.body);

  if (!updatedProxy) {
    throw new AppError('Proxy assignment not found', 404);
  }

  logger.info(`Proxy assignment updated: ID ${proxyAssignmentId} by user ${req.user.userId}`);

  res.json({
    message: 'Proxy assignment updated successfully',
    proxy: updatedProxy
  });
}));

// @route   GET /api/proxy/can-vote/:proxyHolderId/:principalUserId/:sessionId
// @desc    Check if proxy holder can vote on behalf of principal
// @access  Private
router.get('/can-vote/:proxyHolderId/:principalUserId/:sessionId', [
  param('proxyHolderId').isInt(),
  param('principalUserId').isInt(),
  param('sessionId').isInt(),
  validate
], asyncHandler(async (req, res) => {
  const proxyHolderId = parseInt(req.params.proxyHolderId);
  const principalUserId = parseInt(req.params.principalUserId);
  const sessionId = parseInt(req.params.sessionId);

  const result = await Proxy.canVoteAsProxy(proxyHolderId, principalUserId, sessionId);

  res.json(result);
}));

// Get detailed instructions for a specific proxy assignment
router.get('/instructions/:proxyId', [
  authorizeRoles('super_admin', 'admin', 'auditor'),
  param('proxyId').isInt().withMessage('Proxy ID must be an integer'),
  validate
], asyncHandler(async (req, res) => {
  const proxyId = parseInt(req.params.proxyId);

  const query = `
    SELECT 
      pi.InstructionID,
      pi.ProxyID,
      pi.CandidateID,
      pi.ResolutionID,
      pi.InstructionType,
      pi.VotesToAllocate,
      pi.Notes,
      pi.CreatedAt,
      e.FirstName + ' ' + e.LastName AS CandidateName,
      c.Category AS CandidatePosition,
      r.Title AS ResolutionTitle,
      r.Description AS ResolutionDescription
    FROM ProxyInstructions pi
    LEFT JOIN Candidates c ON pi.CandidateID = c.CandidateID
    LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
    LEFT JOIN Resolutions r ON pi.ResolutionID = r.ResolutionID
    WHERE pi.ProxyID = @proxyId
    ORDER BY pi.InstructionID
  `;

  const result = await executeQuery(query, { proxyId });

  res.json({
    success: true,
    data: result.recordset,
    count: result.recordset.length
  });
}));

module.exports = router;
