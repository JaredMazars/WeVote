// =====================================================
// AGM Session Model
// Handles all database operations for AGM sessions
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class AGMSession {
  // Get all sessions with optional filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          s.*,
          o.Name as OrganizationName,
          u.FirstName + ' ' + u.LastName as CreatedByName,
          u.Email as CreatedByEmail
        FROM AGMSessions s
        LEFT JOIN Organizations o ON s.OrganizationID = o.OrganizationID
        LEFT JOIN Users u ON s.CreatedBy = u.UserID
        WHERE 1=1
      `;

      const params = {};

      if (filters.organizationId) {
        query += ' AND s.OrganizationID = @organizationId';
        params.organizationId = filters.organizationId;
      }

      if (filters.status) {
        // Treat 'in_progress' and 'active' as equivalent active states
        if (filters.status === 'in_progress' || filters.status === 'active') {
          query += " AND s.Status IN ('in_progress', 'active')";
        } else {
          query += ' AND s.Status = @status';
          params.status = filters.status;
        }
      }

      if (filters.sessionType) {
        query += ' AND s.SessionType = @sessionType';
        params.sessionType = filters.sessionType;
      }

      query += ' ORDER BY s.ScheduledStartTime DESC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in AGMSession.findAll:', error);
      throw error;
    }
  }

  // Get session by ID
  static async findById(sessionId) {
    try {
      const query = `
        SELECT 
          s.*,
          o.Name as OrganizationName,
          u.FirstName + ' ' + u.LastName as CreatedByName,
          u.Email as CreatedByEmail
        FROM AGMSessions s
        LEFT JOIN Organizations o ON s.OrganizationID = o.OrganizationID
        LEFT JOIN Users u ON s.CreatedBy = u.UserID
        WHERE s.SessionID = @sessionId
      `;

      const result = await executeQuery(query, { sessionId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in AGMSession.findById:', error);
      throw error;
    }
  }

  // Create new session
  static async create(sessionData) {
    try {
      const query = `
        INSERT INTO AGMSessions (
          OrganizationID, Title, Description, SessionType,
          ScheduledStartTime, ScheduledEndTime, Status,
          QuorumRequired, CreatedBy, CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @organizationId, @title, @description, @sessionType,
          @scheduledStartTime, @scheduledEndTime, @status,
          @quorumRequired, @createdBy, GETDATE(), GETDATE()
        )
      `;

      const params = {
        organizationId: sessionData.organizationId,
        title: sessionData.title,
        description: sessionData.description || null,
        sessionType: sessionData.sessionType || 'AGM',
        scheduledStartTime: sessionData.scheduledStartTime,
        scheduledEndTime: sessionData.scheduledEndTime,
        status: sessionData.status || 'scheduled',
        quorumRequired: sessionData.quorumRequired || 50.0,
        createdBy: sessionData.createdBy
      };

      const result = await executeQuery(query, params);
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in AGMSession.create:', error);
      throw error;
    }
  }

  // Update session
  static async update(sessionId, updateData) {
    try {
      const fields = [];
      const params = { sessionId };

      if (updateData.title !== undefined) {
        fields.push('Title = @title');
        params.title = updateData.title;
      }

      if (updateData.description !== undefined) {
        fields.push('Description = @description');
        params.description = updateData.description;
      }

      if (updateData.sessionType !== undefined) {
        fields.push('SessionType = @sessionType');
        params.sessionType = updateData.sessionType;
      }

      if (updateData.scheduledStartTime !== undefined) {
        fields.push('ScheduledStartTime = @scheduledStartTime');
        params.scheduledStartTime = updateData.scheduledStartTime;
      }

      if (updateData.scheduledEndTime !== undefined) {
        fields.push('ScheduledEndTime = @scheduledEndTime');
        params.scheduledEndTime = updateData.scheduledEndTime;
      }

      if (updateData.actualStartTime !== undefined) {
        fields.push('ActualStartTime = @actualStartTime');
        params.actualStartTime = updateData.actualStartTime;
      }

      if (updateData.actualEndTime !== undefined) {
        fields.push('ActualEndTime = @actualEndTime');
        params.actualEndTime = updateData.actualEndTime;
      }

      if (updateData.status !== undefined) {
        fields.push('Status = @status');
        params.status = updateData.status;
      }

      if (updateData.quorumRequired !== undefined) {
        fields.push('QuorumRequired = @quorumRequired');
        params.quorumRequired = updateData.quorumRequired;
      }

      if (updateData.totalVoters !== undefined) {
        fields.push('TotalVoters = @totalVoters');
        params.totalVoters = updateData.totalVoters;
      }

      if (updateData.totalVotesCast !== undefined) {
        fields.push('TotalVotesCast = @totalVotesCast');
        params.totalVotesCast = updateData.totalVotesCast;
      }

      if (updateData.quorumReached !== undefined) {
        fields.push('QuorumReached = @quorumReached');
        params.quorumReached = updateData.quorumReached;
      }

      fields.push('UpdatedAt = GETDATE()');

      const query = `
        UPDATE AGMSessions
        SET ${fields.join(', ')}
        OUTPUT INSERTED.*
        WHERE SessionID = @sessionId
      `;

      const result = await executeQuery(query, params);
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in AGMSession.update:', error);
      throw error;
    }
  }

  // Delete session
  static async delete(sessionId) {
    try {
      const query = 'DELETE FROM AGMSessions WHERE SessionID = @sessionId';
      await executeQuery(query, { sessionId });
      return true;
    } catch (error) {
      logger.error('Error in AGMSession.delete:', error);
      throw error;
    }
  }

  // Start session
  static async start(sessionId) {
    try {
      const query = `
        UPDATE AGMSessions
        SET Status = 'in_progress',
            ActualStartTime = GETDATE(),
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE SessionID = @sessionId
          AND Status IN ('scheduled', 'active')
      `;

      const result = await executeQuery(query, { sessionId });
      if (!result.recordset[0]) {
        // Session was not updated — check why
        const current = await AGMSession.findById(sessionId);
        if (!current) throw new Error('Session not found');
        if (current.Status === 'in_progress') {
          // Already running — return it (idempotent)
          return current;
        }
        throw new Error(`Cannot start a session with status '${current.Status}'`);
      }
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in AGMSession.start:', error);
      throw error;
    }
  }

  // End session
  static async end(sessionId) {
    try {
      const query = `
        UPDATE AGMSessions
        SET Status = 'completed',
            ActualEndTime = GETDATE(),
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE SessionID = @sessionId
          AND Status IN ('in_progress', 'active')
      `;

      const result = await executeQuery(query, { sessionId });
      if (!result.recordset[0]) {
        // Session was not updated — check why
        const current = await AGMSession.findById(sessionId);
        if (!current) throw new Error('Session not found');
        if (current.Status === 'completed') {
          // Already ended — return it (idempotent)
          return current;
        }
        throw new Error(`Cannot end a session with status '${current.Status}'. Start the session first.`);
      }
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in AGMSession.end:', error);
      throw error;
    }
  }

  // Get active session
  static async getActiveSession(organizationId) {
    try {
      const query = `
        SELECT 
          s.*,
          o.Name as OrganizationName
        FROM AGMSessions s
        LEFT JOIN Organizations o ON s.OrganizationID = o.OrganizationID
        WHERE s.OrganizationID = @organizationId
          AND s.Status IN ('active', 'in_progress')
          AND GETDATE() BETWEEN s.ScheduledStartTime AND s.ScheduledEndTime
        ORDER BY s.ScheduledStartTime DESC
      `;

      const result = await executeQuery(query, { organizationId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in AGMSession.getActiveSession:', error);
      throw error;
    }
  }
}

module.exports = AGMSession;
