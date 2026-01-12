const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { authenticateToken } = require('../middleware/auth');

// Get all audit logs with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
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
    
    const request = new sql.Request();
    request.input('limit', sql.Int, parseInt(limit));
    
    if (userId) {
      query += ' AND al.UserID = @userId';
      request.input('userId', sql.Int, parseInt(userId));
    }
    
    if (action) {
      query += ' AND al.Action LIKE @action';
      request.input('action', sql.NVarChar, `%${action}%`);
    }
    
    if (entityType) {
      query += ' AND al.EntityType = @entityType';
      request.input('entityType', sql.NVarChar, entityType);
    }
    
    if (startDate) {
      query += ' AND al.CreatedAt >= @startDate';
      request.input('startDate', sql.DateTime, new Date(startDate));
    }
    
    if (endDate) {
      query += ' AND al.CreatedAt <= @endDate';
      request.input('endDate', sql.DateTime, new Date(endDate));
    }
    
    query += ' ORDER BY al.CreatedAt DESC';
    
    const result = await request.query(query);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// Create audit log entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, entityType, entityId, details } = req.body;
    const userId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    const request = new sql.Request();
    const result = await request
      .input('userId', sql.Int, userId)
      .input('action', sql.NVarChar, action)
      .input('entityType', sql.NVarChar, entityType)
      .input('entityId', sql.Int, entityId)
      .input('details', sql.NVarChar, details)
      .input('ipAddress', sql.NVarChar, ipAddress.substring(0, 45))
      .input('userAgent', sql.NVarChar, userAgent.substring(0, 500))
      .query(`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (@userId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, GETDATE())
      `);
    
    res.json({
      success: true,
      message: 'Audit log created successfully'
    });
    
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create audit log',
      error: error.message
    });
  }
});

module.exports = router;
