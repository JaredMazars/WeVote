// =====================================================
// SessionAdmin Model
// Manages admin assignments to AGM sessions
// =====================================================

const { getPool } = require('../config/database');
const logger = require('../config/logger');

class SessionAdmin {
  /**
   * Assign admin to session
   */
  static async assign(sessionId, userId, assignedBy) {
    const pool = await getPool();
    
    const query = `
      INSERT INTO SessionAdmins (SessionID, UserID, AssignedBy)
      VALUES (@sessionId, @userId, @assignedBy);
      
      SELECT * FROM SessionAdmins 
      WHERE SessionAdminID = SCOPE_IDENTITY();
    `;
    
    const result = await pool.request()
      .input('sessionId', sessionId)
      .input('userId', userId)
      .input('assignedBy', assignedBy)
      .query(query);
    
    logger.info(`Admin ${userId} assigned to session ${sessionId} by user ${assignedBy}`);
    return result.recordset[0];
  }

  /**
   * Remove admin from session
   */
  static async unassign(sessionId, userId) {
    const pool = await getPool();
    
    const query = `
      DELETE FROM SessionAdmins 
      WHERE SessionID = @sessionId AND UserID = @userId;
    `;
    
    await pool.request()
      .input('sessionId', sessionId)
      .input('userId', userId)
      .query(query);
    
    logger.info(`Admin ${userId} removed from session ${sessionId}`);
    return true;
  }

  /**
   * Get all admins assigned to a session
   */
  static async getAdminsBySession(sessionId) {
    const pool = await getPool();
    
    const query = `
      SELECT 
        sa.SessionAdminID,
        sa.SessionID,
        sa.UserID,
        sa.AssignedAt,
        u.Email,
        u.FirstName,
        u.LastName,
        u.Role
      FROM SessionAdmins sa
      INNER JOIN Users u ON sa.UserID = u.UserID
      WHERE sa.SessionID = @sessionId
      ORDER BY sa.AssignedAt DESC;
    `;
    
    const result = await pool.request()
      .input('sessionId', sessionId)
      .query(query);
    
    return result.recordset;
  }

  /**
   * Get all sessions assigned to an admin
   */
  static async getSessionsByAdmin(userId) {
    const pool = await getPool();
    
    const query = `
      SELECT 
        sa.SessionAdminID,
        sa.SessionID,
        sa.AssignedAt,
        s.Title,
        s.Description,
        s.Status,
        s.ScheduledStartTime,
        s.ScheduledEndTime
      FROM SessionAdmins sa
      INNER JOIN AGMSessions s ON sa.SessionID = s.SessionID
      WHERE sa.UserID = @userId
      ORDER BY s.ScheduledStartTime DESC;
    `;
    
    const result = await pool.request()
      .input('userId', userId)
      .query(query);
    
    return result.recordset;
  }

  /**
   * Check if admin is assigned to session
   */
  static async isAssigned(sessionId, userId) {
    const pool = await getPool();
    
    const query = `
      SELECT COUNT(*) as Count
      FROM SessionAdmins
      WHERE SessionID = @sessionId AND UserID = @userId;
    `;
    
    const result = await pool.request()
      .input('sessionId', sessionId)
      .input('userId', userId)
      .query(query);
    
    return result.recordset[0].Count > 0;
  }

  /**
   * Get all admin-session assignments
   */
  static async getAll() {
    const pool = await getPool();
    
    const query = `
      SELECT 
        sa.SessionAdminID,
        sa.SessionID,
        sa.UserID,
        sa.AssignedAt,
        u.Email,
        u.FirstName,
        u.LastName,
        u.Role,
        s.Title as SessionTitle
      FROM SessionAdmins sa
      INNER JOIN Users u ON sa.UserID = u.UserID
      INNER JOIN AGMSessions s ON sa.SessionID = s.SessionID
      ORDER BY sa.AssignedAt DESC;
    `;
    
    const result = await pool.request().query(query);
    
    return result.recordset;
  }
}

module.exports = SessionAdmin;
