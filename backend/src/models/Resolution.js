// =====================================================
// Resolution Model
// Handles all database operations for resolutions
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Resolution {
  // Get all resolutions or filter by session
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          r.ResolutionID,
          r.SessionID,
          s.Title as SessionTitle,
          r.Title as ResolutionTitle,
          r.Description,
          r.Category,
          r.ProposedBy,
          u.FirstName + ' ' + u.LastName as ProposedByName,
          r.RequiredMajority,
          r.Status,
          r.TotalYesVotes,
          r.TotalNoVotes,
          r.TotalAbstainVotes,
          r.CreatedAt,
          r.UpdatedAt,
          (r.TotalYesVotes + r.TotalNoVotes + r.TotalAbstainVotes) as TotalVotes
        FROM Resolutions r
        LEFT JOIN AGMSessions s ON r.SessionID = s.SessionID
        LEFT JOIN Users u ON r.ProposedBy = u.UserID
        WHERE 1=1
      `;

      const params = {};

      if (filters.sessionId) {
        query += ' AND r.SessionID = @sessionId';
        params.sessionId = filters.sessionId;
      }

      if (filters.category) {
        query += ' AND r.Category = @category';
        params.category = filters.category;
      }

      if (filters.status) {
        query += ' AND r.Status = @status';
        params.status = filters.status;
      }

      query += ' ORDER BY r.ResolutionID ASC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Resolution.findAll:', error);
      throw error;
    }
  }

  // Get single resolution by ID
  static async findById(resolutionId) {
    try {
      const query = `
        SELECT 
          r.ResolutionID,
          r.SessionID,
          s.Title as SessionTitle,
          s.Status as SessionStatus,
          r.Title as ResolutionTitle,
          r.Description,
          r.Category,
          r.ProposedBy,
          u.FirstName + ' ' + u.LastName as ProposedByName,
          u.Email as ProposerEmail,
          r.RequiredMajority,
          r.Status,
          r.TotalYesVotes,
          r.TotalNoVotes,
          r.TotalAbstainVotes,
          r.CreatedAt,
          r.UpdatedAt,
          (r.TotalYesVotes + r.TotalNoVotes + r.TotalAbstainVotes) as TotalVotes
        FROM Resolutions r
        LEFT JOIN AGMSessions s ON r.SessionID = s.SessionID
        LEFT JOIN Users u ON r.ProposedBy = u.UserID
        WHERE r.ResolutionID = @resolutionId
      `;

      const result = await executeQuery(query, { resolutionId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Resolution.findById:', error);
      throw error;
    }
  }

  // Create new resolution
  static async create(resolutionData) {
    try {
      const query = `
        INSERT INTO Resolutions (
          SessionID, Title, Description, Category,
          ProposedBy, RequiredMajority, Status
        )
        OUTPUT INSERTED.*
        VALUES (
          @sessionId, @title, @description, @category,
          @proposedBy, @requiredMajority, 'active'
        )
      `;

      const params = {
        sessionId: resolutionData.sessionId,
        title: resolutionData.title,
        description: resolutionData.description || null,
        category: resolutionData.category || null,
        proposedBy: resolutionData.proposedBy || null,
        requiredMajority: resolutionData.requiredMajority || 50 // Default 50%
      };

      const result = await executeQuery(query, params);
      const newResolution = result.recordset[0];

      logger.info(`Resolution created: ${newResolution.Title} (ID: ${newResolution.ResolutionID})`);
      
      // Return with full details
      return await this.findById(newResolution.ResolutionID);
    } catch (error) {
      logger.error('Error in Resolution.create:', error);
      throw error;
    }
  }

  // Update resolution
  static async update(resolutionId, updates) {
    try {
      const allowedUpdates = [
        'Title', 'Description', 'Category', 'RequiredMajority', 'Status'
      ];

      const setClauses = [];
      const params = { resolutionId };

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
        UPDATE Resolutions
        SET ${setClauses.join(', ')}
        WHERE ResolutionID = @resolutionId
      `;

      await executeQuery(query, params);

      logger.info(`Resolution updated: ID ${resolutionId}`);
      
      // Return with full details
      return await this.findById(resolutionId);
    } catch (error) {
      logger.error('Error in Resolution.update:', error);
      throw error;
    }
  }

  // Delete resolution
  static async delete(resolutionId) {
    try {
      // Check if resolution has votes
      const voteCheck = await executeQuery(
        'SELECT COUNT(*) as VoteCount FROM ResolutionVotes WHERE ResolutionID = @resolutionId',
        { resolutionId }
      );

      if (voteCheck.recordset[0].VoteCount > 0) {
        throw new Error('Cannot delete resolution with existing votes');
      }

      const query = 'DELETE FROM Resolutions WHERE ResolutionID = @resolutionId';
      await executeQuery(query, { resolutionId });

      logger.info(`Resolution deleted: ID ${resolutionId}`);
      return { message: 'Resolution deleted successfully' };
    } catch (error) {
      logger.error('Error in Resolution.delete:', error);
      throw error;
    }
  }

  // Get resolution vote statistics
  static async getStatistics(resolutionId) {
    try {
      const query = `
        SELECT 
          r.ResolutionID,
          r.Title as ResolutionTitle,
          r.RequiredMajority,
          cat.CategoryName,
          COUNT(DISTINCT rv.VoteID) as TotalVotesCast,
          SUM(rv.VotesToAllocate) as TotalVoteWeight,
          SUM(CASE WHEN rv.VoteChoice = 'yes' THEN rv.VotesToAllocate ELSE 0 END) as YesVoteWeight,
          SUM(CASE WHEN rv.VoteChoice = 'no' THEN rv.VotesToAllocate ELSE 0 END) as NoVoteWeight,
          SUM(CASE WHEN rv.VoteChoice = 'abstain' THEN rv.VotesToAllocate ELSE 0 END) as AbstainVoteWeight,
          COUNT(DISTINCT CASE WHEN rv.IsProxyVote = 1 THEN rv.VoteID END) as ProxyVotes,
          COUNT(DISTINCT CASE WHEN rv.IsProxyVote = 0 THEN rv.VoteID END) as DirectVotes,
          COUNT(DISTINCT rv.VoterUserID) as UniqueVoters,
          CASE 
            WHEN SUM(CASE WHEN rv.VoteChoice IN ('yes', 'no') THEN rv.VotesToAllocate ELSE 0 END) > 0 THEN
              (SUM(CASE WHEN rv.VoteChoice = 'yes' THEN rv.VotesToAllocate ELSE 0 END) * 100.0) / 
              SUM(CASE WHEN rv.VoteChoice IN ('yes', 'no') THEN rv.VotesToAllocate ELSE 0 END)
            ELSE 0
          END as YesPercentage,
          CASE 
            WHEN SUM(CASE WHEN rv.VoteChoice IN ('yes', 'no') THEN rv.VotesToAllocate ELSE 0 END) > 0 THEN
              CASE 
                WHEN (SUM(CASE WHEN rv.VoteChoice = 'yes' THEN rv.VotesToAllocate ELSE 0 END) * 100.0) / 
                     SUM(CASE WHEN rv.VoteChoice IN ('yes', 'no') THEN rv.VotesToAllocate ELSE 0 END) >= r.RequiredMajority 
                THEN 'PASSED'
                ELSE 'FAILED'
              END
            ELSE 'PENDING'
          END as Status
        FROM Resolutions r
        LEFT JOIN ResolutionVotes rv ON r.ResolutionID = rv.ResolutionID
        LEFT JOIN ResolutionCategories cat ON r.CategoryID = cat.CategoryID
        WHERE r.ResolutionID = @resolutionId
        GROUP BY r.ResolutionID, r.Title, r.RequiredMajority, cat.CategoryName
      `;

      const result = await executeQuery(query, { resolutionId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Resolution.getStatistics:', error);
      throw error;
    }
  }

  // Get all resolution categories
  static async getCategories() {
    try {
      const query = `
        SELECT 
          CategoryID,
          CategoryName,
          Description,
          DisplayOrder,
          IsActive
        FROM ResolutionCategories
        WHERE IsActive = 1
        ORDER BY DisplayOrder ASC, CategoryName ASC
      `;

      const result = await executeQuery(query);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Resolution.getCategories:', error);
      throw error;
    }
  }

  // Get resolutions by category
  static async findByCategory(categoryId, sessionId = null) {
    try {
      let query = `
        SELECT 
          r.*,
          (SELECT COUNT(*) FROM ResolutionVotes WHERE ResolutionID = r.ResolutionID) as TotalVotes
        FROM Resolutions r
        WHERE r.CategoryID = @categoryId
        AND r.IsActive = 1
      `;

      const params = { categoryId };

      if (sessionId) {
        query += ' AND r.AGMSessionID = @sessionId';
        params.sessionId = sessionId;
      }

      query += ' ORDER BY r.DisplayOrder ASC, r.ResolutionID ASC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Resolution.findByCategory:', error);
      throw error;
    }
  }
}

module.exports = Resolution;
