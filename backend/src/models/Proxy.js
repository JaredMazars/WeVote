// =====================================================
// Proxy Model
// Handles all proxy voting assignment operations
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Proxy {
  // Create proxy assignment
  static async create(proxyData) {
    try {
      const query = `
        INSERT INTO ProxyAssignments (
          SessionID, PrincipalUserID, ProxyUserID, ProxyType,
          StartDate, EndDate, IsActive
        )
        OUTPUT INSERTED.*
        VALUES (
          @sessionId, @principalUserId, @proxyUserId, @proxyType,
          GETDATE(), @endDate, 1
        )
      `;

      const params = {
        sessionId: proxyData.sessionId,
        principalUserId: proxyData.principalUserId,
        proxyUserId: proxyData.proxyUserId,
        proxyType: proxyData.proxyType || 'general',
        endDate: proxyData.endDate || null
      };

      const result = await executeQuery(query, params);
      const newProxy = result.recordset[0];

      logger.info(`Proxy assignment created: Principal ${proxyData.principalUserId} -> Proxy ${proxyData.proxyUserId}`);
      return await this.findById(newProxy.ProxyID);
    } catch (error) {
      logger.error('Error in Proxy.create:', error);
      throw error;
    }
  }

  // Get single proxy by ID
  static async findById(proxyId) {
    try {
      const query = `
        SELECT 
          pa.ProxyID,
          pa.SessionID,
          s.Title as SessionTitle,
          pa.PrincipalUserID,
          principal.FirstName + ' ' + principal.LastName as PrincipalName,
          principal.Email as PrincipalEmail,
          pa.ProxyUserID,
          proxyUser.FirstName + ' ' + proxyUser.LastName as ProxyName,
          proxyUser.Email as ProxyEmail,
          pa.ProxyType,
          pa.StartDate,
          pa.EndDate,
          pa.IsActive,
          pa.CreatedAt,
          pa.UpdatedAt
        FROM ProxyAssignments pa
        INNER JOIN Users principal ON pa.PrincipalUserID = principal.UserID
        INNER JOIN Users proxyUser ON pa.ProxyUserID = proxyUser.UserID
        LEFT JOIN AGMSessions s ON pa.SessionID = s.SessionID
        WHERE pa.ProxyID = @proxyId
      `;

      const result = await executeQuery(query, { proxyId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Proxy.findById:', error);
      throw error;
    }
  }

  // Get proxy assignments for a user (as principal)
  static async getAssignmentsByPrincipal(principalUserId, sessionId = null) {
    try {
      let query = `
        SELECT 
          pa.ProxyID,
          pa.SessionID,
          s.Title as SessionTitle,
          pa.PrincipalUserID,
          pa.ProxyUserID,
          proxyUser.FirstName + ' ' + proxyUser.LastName as ProxyName,
          proxyUser.Email as ProxyEmail,
          pa.ProxyType,
          pa.StartDate,
          pa.EndDate,
          pa.IsActive,
          pa.CreatedAt,
          pa.UpdatedAt
        FROM ProxyAssignments pa
        INNER JOIN Users proxyUser ON pa.ProxyUserID = proxyUser.UserID
        LEFT JOIN AGMSessions s ON pa.SessionID = s.SessionID
        WHERE pa.PrincipalUserID = @principalUserId
        AND pa.IsActive = 1
      `;

      const params = { principalUserId };

      if (sessionId) {
        query += ' AND pa.SessionID = @sessionId';
        params.sessionId = sessionId;
      }

      query += ' ORDER BY pa.CreatedAt DESC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Proxy.getAssignmentsByPrincipal:', error);
      throw error;
    }
  }

  // Get proxy assignments for a user (as proxy holder)
  static async getAssignmentsByProxyHolder(proxyUserId, sessionId = null) {
    try {
      let query = `
        SELECT 
          pa.ProxyID,
          pa.SessionID,
          s.Title as SessionTitle,
          pa.PrincipalUserID,
          principalUser.FirstName + ' ' + principalUser.LastName as PrincipalName,
          principalUser.Email as PrincipalEmail,
          pa.ProxyUserID,
          pa.ProxyType,
          pa.StartDate,
          pa.EndDate,
          pa.IsActive,
          pa.CreatedAt,
          pa.UpdatedAt
        FROM ProxyAssignments pa
        INNER JOIN Users principalUser ON pa.PrincipalUserID = principalUser.UserID
        LEFT JOIN AGMSessions s ON pa.SessionID = s.SessionID
        WHERE pa.ProxyUserID = @proxyUserId
        AND pa.IsActive = 1
      `;

      const params = { proxyUserId };

      if (sessionId) {
        query += ' AND pa.SessionID = @sessionId';
        params.sessionId = sessionId;
      }

      query += ' ORDER BY pa.CreatedAt DESC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Proxy.getAssignmentsByProxyHolder:', error);
      throw error;
    }
  }

  // Get all proxy assignments (for admin)
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          pa.ProxyID,
          pa.SessionID,
          s.Title as SessionTitle,
          pa.PrincipalUserID,
          principal.FirstName + ' ' + principal.LastName as PrincipalName,
          pa.ProxyUserID,
          proxyUser.FirstName + ' ' + proxyUser.LastName as ProxyName,
          pa.ProxyType,
          pa.StartDate,
          pa.EndDate,
          pa.IsActive,
          pa.CreatedAt
        FROM ProxyAssignments pa
        INNER JOIN Users principal ON pa.PrincipalUserID = principal.UserID
        INNER JOIN Users proxyUser ON pa.ProxyUserID = proxyUser.UserID
        LEFT JOIN AGMSessions s ON pa.SessionID = s.SessionID
        WHERE 1=1
      `;

      const params = {};

      if (filters.sessionId) {
        query += ' AND pa.SessionID = @sessionId';
        params.sessionId = filters.sessionId;
      }

      if (filters.isActive !== undefined) {
        query += ' AND pa.IsActive = @isActive';
        params.isActive = filters.isActive ? 1 : 0;
      }

      query += ' ORDER BY pa.CreatedAt DESC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Proxy.findAll:', error);
      throw error;
    }
  }

  // Calculate vote weight for a user in a session
  static async calculateVoteWeight(userId, sessionId) {
    try {
      const query = `
        SELECT 
          1 as OwnVote,
          COUNT(pa.ProxyID) as ProxyCount,
          (1 + COUNT(pa.ProxyID)) as TotalWeight,
          STRING_AGG(
            principalUser.FirstName + ' ' + principalUser.LastName,
            ', '
          ) as ProxyAssigneeNames
        FROM Users u
        LEFT JOIN ProxyAssignments pa ON u.UserID = pa.ProxyUserID
          AND pa.IsActive = 1
          AND pa.SessionID = @sessionId
          AND (pa.EndDate IS NULL OR pa.EndDate > GETDATE())
        LEFT JOIN Users principalUser ON pa.PrincipalUserID = principalUser.UserID
        WHERE u.UserID = @userId
        GROUP BY u.UserID
      `;

      const result = await executeQuery(query, { userId, sessionId });
      
      if (result.recordset.length === 0) {
        return {
          ownVote: 1,
          proxyCount: 0,
          totalWeight: 1,
          proxyAssignees: []
        };
      }

      const data = result.recordset[0];
      return {
        ownVote: data.OwnVote,
        proxyCount: data.ProxyCount,
        totalWeight: data.TotalWeight,
        proxyAssignees: data.ProxyAssigneeNames ? data.ProxyAssigneeNames.split(', ') : []
      };
    } catch (error) {
      logger.error('Error in Proxy.calculateVoteWeight:', error);
      throw error;
    }
  }

  // Get proxy assignees for a proxy holder
  static async getProxyAssignees(proxyHolderId, sessionId) {
    try {
      const query = `
        SELECT 
          pa.ProxyAssignmentID,
          pa.PrincipalUserID,
          u.FirstName + ' ' + u.LastName as PrincipalName,
          u.Email as PrincipalEmail,
          pa.AssignmentType,
          pa.MaxVotesAllowed,
          pa.Notes
        FROM ProxyAssignments pa
        INNER JOIN Users u ON pa.PrincipalUserID = u.UserID
        WHERE pa.ProxyHolderUserID = @proxyHolderId
        AND pa.IsActive = 1
        AND (pa.AGMSessionID = @sessionId OR pa.AGMSessionID IS NULL)
        AND (pa.ValidUntil IS NULL OR pa.ValidUntil > GETDATE())
        ORDER BY u.LastName, u.FirstName
      `;

      const result = await executeQuery(query, { proxyHolderId, sessionId });
      return result.recordset;
    } catch (error) {
      logger.error('Error in Proxy.getProxyAssignees:', error);
      throw error;
    }
  }

  // Create instructional proxy with specific instructions
  static async createInstructional(instructionData) {
    try {
      // First create the proxy assignment
      const proxyQuery = `
        INSERT INTO ProxyAssignments (
          PrincipalUserID, ProxyHolderUserID, AGMSessionID,
          AssignmentType, ValidFrom, ValidUntil, IsActive
        )
        OUTPUT INSERTED.ProxyAssignmentID
        VALUES (
          @principalUserId, @proxyHolderId, @sessionId,
          'instructional', GETDATE(), @validUntil, 1
        )
      `;

      const proxyResult = await executeQuery(proxyQuery, {
        principalUserId: instructionData.principalUserId,
        proxyHolderId: instructionData.proxyHolderId,
        sessionId: instructionData.sessionId,
        validUntil: instructionData.validUntil || null
      });

      const proxyAssignmentId = proxyResult.recordset[0].ProxyAssignmentID;

      // Insert instructions
      if (instructionData.instructions && instructionData.instructions.length > 0) {
        for (const instruction of instructionData.instructions) {
          await executeQuery(`
            INSERT INTO ProxyInstructions (
              ProxyAssignmentID, InstructionType, TargetID,
              VoteChoice, Priority, Notes
            )
            VALUES (
              @proxyAssignmentId, @instructionType, @targetId,
              @voteChoice, @priority, @notes
            )
          `, {
            proxyAssignmentId,
            instructionType: instruction.type, // 'candidate' or 'resolution'
            targetId: instruction.targetId,
            voteChoice: instruction.voteChoice,
            priority: instruction.priority || 1,
            notes: instruction.notes || null
          });
        }
      }

      logger.info(`Instructional proxy created: Assignment ID ${proxyAssignmentId}`);
      return { proxyAssignmentId, message: 'Instructional proxy created successfully' };
    } catch (error) {
      logger.error('Error in Proxy.createInstructional:', error);
      throw error;
    }
  }

  // Get proxy instructions
  static async getInstructions(proxyAssignmentId) {
    try {
      const query = `
        SELECT 
          pi.*,
          CASE 
            WHEN pi.InstructionType = 'candidate' THEN c.FirstName + ' ' + c.LastName
            WHEN pi.InstructionType = 'resolution' THEN r.Title
          END as TargetName
        FROM ProxyInstructions pi
        LEFT JOIN Candidates c ON pi.InstructionType = 'candidate' AND pi.TargetID = c.CandidateID
        LEFT JOIN Resolutions r ON pi.InstructionType = 'resolution' AND pi.TargetID = r.ResolutionID
        WHERE pi.ProxyAssignmentID = @proxyAssignmentId
        ORDER BY pi.Priority, pi.CreatedAt
      `;

      const result = await executeQuery(query, { proxyAssignmentId });
      return result.recordset;
    } catch (error) {
      logger.error('Error in Proxy.getInstructions:', error);
      throw error;
    }
  }

  // Revoke proxy assignment
  static async revoke(proxyAssignmentId, revokedBy) {
    try {
      const query = `
        UPDATE ProxyAssignments
        SET IsActive = 0,
            UpdatedAt = GETDATE()
        WHERE ProxyID = @proxyAssignmentId
      `;

      await executeQuery(query, { proxyAssignmentId });
      
      logger.info(`Proxy assignment revoked: ID ${proxyAssignmentId}`);
      return await this.findById(proxyAssignmentId);
    } catch (error) {
      logger.error('Error in Proxy.revoke:', error);
      throw error;
    }
  }

  // Check if user can vote as proxy
  static async canVoteAsProxy(proxyHolderId, principalUserId, sessionId) {
    try {
      const query = `
        SELECT TOP 1
          pa.ProxyAssignmentID,
          pa.AssignmentType,
          pa.MaxVotesAllowed,
          CASE 
            WHEN pa.ValidUntil IS NOT NULL AND pa.ValidUntil < GETDATE() THEN 0
            ELSE 1
          END as IsValid
        FROM ProxyAssignments pa
        WHERE pa.ProxyHolderUserID = @proxyHolderId
        AND pa.PrincipalUserID = @principalUserId
        AND pa.IsActive = 1
        AND (pa.AGMSessionID = @sessionId OR pa.AGMSessionID IS NULL)
      `;

      const result = await executeQuery(query, { proxyHolderId, principalUserId, sessionId });
      
      if (result.recordset.length === 0) {
        return { canVote: false, reason: 'No proxy assignment found' };
      }

      const proxy = result.recordset[0];
      
      if (!proxy.IsValid) {
        return { canVote: false, reason: 'Proxy assignment has expired' };
      }

      return { canVote: true, proxyAssignmentId: proxy.ProxyAssignmentID, assignmentType: proxy.AssignmentType };
    } catch (error) {
      logger.error('Error in Proxy.canVoteAsProxy:', error);
      throw error;
    }
  }

  // Get all active proxies for a session
  static async getSessionProxies(sessionId) {
    try {
      const query = `
        SELECT 
          pa.*,
          principalUser.FirstName + ' ' + principalUser.LastName as PrincipalName,
          proxyUser.FirstName + ' ' + proxyUser.LastName as ProxyHolderName,
          s.Title as SessionTitle
        FROM ProxyAssignments pa
        INNER JOIN Users principalUser ON pa.PrincipalUserID = principalUser.UserID
        INNER JOIN Users proxyUser ON pa.ProxyHolderUserID = proxyUser.UserID
        LEFT JOIN AGMSessions s ON pa.AGMSessionID = s.AGMSessionID
        WHERE pa.IsActive = 1
        AND (pa.AGMSessionID = @sessionId OR pa.AGMSessionID IS NULL)
        AND (pa.ValidUntil IS NULL OR pa.ValidUntil > GETDATE())
        ORDER BY proxyUser.LastName, proxyUser.FirstName
      `;

      const result = await executeQuery(query, { sessionId });
      return result.recordset;
    } catch (error) {
      logger.error('Error in Proxy.getSessionProxies:', error);
      throw error;
    }
  }

  // Update proxy assignment
  static async update(proxyAssignmentId, updates) {
    try {
      const allowedUpdates = ['MaxVotesAllowed', 'CanDelegate', 'Notes', 'ValidUntil'];

      const setClauses = [];
      const params = { proxyAssignmentId };

      Object.keys(updates).forEach(key => {
        const dbKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (allowedUpdates.includes(dbKey)) {
          setClauses.push(`${dbKey} = @${key}`);
          params[key] = updates[key];
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      const query = `
        UPDATE ProxyAssignments
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE ProxyAssignmentID = @proxyAssignmentId
      `;

      const result = await executeQuery(query, params);
      
      logger.info(`Proxy assignment updated: ID ${proxyAssignmentId}`);
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Proxy.update:', error);
      throw error;
    }
  }
}

module.exports = Proxy;
