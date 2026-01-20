const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { executeQuery } = require('../config/database');

// @route   GET /api/audit/logs
// @desc    Get all audit logs with optional filtering
// @access  Private (Auditor, Super Admin only)
router.get('/logs', authenticateToken, authorizeRoles('auditor', 'super_admin', 'admin'), asyncHandler(async (req, res) => {
  const { userId, action, entityType, startDate, endDate, limit = 100 } = req.query;
  
  let query = `
    SELECT TOP (@limit)
      al.LogID,
      al.UserID,
      u.FirstName + ' ' + u.LastName as UserName,
      u.Email as UserEmail,
      al.Action,
      al.EntityType,
      al.EntityID,
      al.Details,
      al.IPAddress,
      al.UserAgent,
      al.CreatedAt as Timestamp
    FROM AuditLog al
    LEFT JOIN Users u ON al.UserID = u.UserID
    WHERE 1=1
  `;
  
  const params = { limit: parseInt(limit) };
  
  if (userId) {
    query += ' AND al.UserID = @userId';
    params.userId = parseInt(userId);
  }
  
  if (action) {
    query += ' AND al.Action LIKE @action';
    params.action = `%${action}%`;
  }
  
  if (entityType) {
    query += ' AND al.EntityType = @entityType';
    params.entityType = entityType;
  }
  
  if (startDate) {
    query += ' AND al.CreatedAt >= @startDate';
    params.startDate = new Date(startDate);
  }
  
  if (endDate) {
    query += ' AND al.CreatedAt <= @endDate';
    params.endDate = new Date(endDate);
  }
  
  query += ' ORDER BY al.CreatedAt DESC';
  
  const result = await executeQuery(query, params);
  
  res.json({
    count: result.recordset.length,
    logs: result.recordset
  });
}));

// @route   GET /api/audit/stats
// @desc    Get audit statistics
// @access  Private (Auditor, Super Admin only)
router.get('/stats', authenticateToken, authorizeRoles('auditor', 'super_admin'), asyncHandler(async (req, res) => {
  const stats = await executeQuery(`
    SELECT 
      COUNT(*) as TotalActions,
      COUNT(DISTINCT UserID) as UniqueUsers,
      COUNT(DISTINCT Action) as UniqueActionTypes,
      COUNT(CASE WHEN CreatedAt >= DATEADD(day, -1, GETDATE()) THEN 1 END) as Last24Hours,
      COUNT(CASE WHEN CreatedAt >= DATEADD(day, -7, GETDATE()) THEN 1 END) as Last7Days
    FROM AuditLog
  `);
  
  const topActions = await executeQuery(`
    SELECT TOP 10
      Action,
      COUNT(*) as Count
    FROM AuditLog
    GROUP BY Action
    ORDER BY Count DESC
  `);
  
  res.json({
    summary: stats.recordset[0],
    topActions: topActions.recordset
  });
}));

// @route   GET /api/audit/quorum/:sessionId
// @desc    Get live quorum tracking for session
// @access  Private (Auditor, Super Admin only)
router.get('/quorum/:sessionId', authenticateToken, authorizeRoles('auditor', 'super_admin', 'admin'), asyncHandler(async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  
  const quorum = await executeQuery(`
    SELECT 
      s.SessionID,
      s.Title as SessionTitle,
      s.QuorumRequired,
      COUNT(DISTINCT va.UserID) as RegisteredVoters,
      (SELECT COUNT(DISTINCT VoterUserID) FROM CandidateVotes WHERE SessionID = @sessionId) as CandidateVoters,
      (SELECT COUNT(DISTINCT VoterUserID) FROM ResolutionVotes WHERE SessionID = @sessionId) as ResolutionVoters,
      CASE 
        WHEN COUNT(DISTINCT va.UserID) >= s.QuorumRequired THEN 1 
        ELSE 0 
      END as QuorumMet
    FROM AGMSessions s
    LEFT JOIN VoteAllocations va ON s.SessionID = va.SessionID
    WHERE s.SessionID = @sessionId
    GROUP BY s.SessionID, s.Title, s.QuorumRequired
  `, { sessionId });
  
  if (quorum.recordset.length === 0) {
    throw new AppError('Session not found', 404);
  }
  
  res.json({
    quorum: quorum.recordset[0]
  });
}));

// Get all audit logs with optional filtering (original endpoint for backward compatibility)
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { userId, action, entityType, startDate, endDate, limit = 100 } = req.query;
  
  let query = `
    SELECT TOP (@limit)
      al.LogID,
      al.UserID,
      u.FirstName + ' ' + u.LastName as UserName,
      u.Email as UserEmail,
      al.Action,
      al.EntityType,
      al.EntityID,
      al.Details,
      al.IPAddress,
      al.UserAgent,
      al.CreatedAt as Timestamp
    FROM AuditLog al
    LEFT JOIN Users u ON al.UserID = u.UserID
    WHERE 1=1
  `;
  
  const params = { limit: parseInt(limit) };
  
  if (userId) {
    query += ' AND al.UserID = @userId';
    params.userId = parseInt(userId);
  }
  
  if (action) {
    query += ' AND al.Action LIKE @action';
    params.action = `%${action}%`;
  }
  
  if (entityType) {
    query += ' AND al.EntityType = @entityType';
    params.entityType = entityType;
  }
  
  if (startDate) {
    query += ' AND al.CreatedAt >= @startDate';
    params.startDate = new Date(startDate);
  }
  
  if (endDate) {
    query += ' AND al.CreatedAt <= @endDate';
    params.endDate = new Date(endDate);
  }
  
  query += ' ORDER BY al.CreatedAt DESC';
  
  const result = await executeQuery(query, params);
  
  res.json({
    success: true,
    data: result.recordset,
    count: result.recordset.length
  });
}));

// Create audit log entry
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { action, entityType, entityId, details } = req.body;
  const userId = req.user.userId;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  
  await executeQuery(`
    INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
    VALUES (@userId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, GETDATE())
  `, {
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress: ipAddress.substring(0, 45),
    userAgent: userAgent.substring(0, 500)
  });
  
  res.json({
    success: true,
    message: 'Audit log created successfully'
  });
}));

module.exports = router;
