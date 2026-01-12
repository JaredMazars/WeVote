// =====================================================
// Vote Allocation Model
// Handles vote allocation limits per user/session
// =====================================================

const sql = require('mssql');
const { getPool } = require('../config/database');
const logger = require('../config/logger');

class VoteAllocation {
  // Create or update vote allocation for a user
  static async create(allocationData) {
    try {
      const pool = await getPool();
      
      const { userId, sessionId, maxCandidateVotes, maxResolutionVotes, allowSplitVoting, notes } = allocationData;

      // Check if allocation already exists
      const existingCheck = await pool.request()
        .input('userId', sql.Int, userId)
        .input('sessionId', sql.Int, sessionId)
        .query(`
          SELECT AllocationID 
          FROM VoteAllocations 
          WHERE UserID = @userId AND SessionID = @sessionId
        `);

      if (existingCheck.recordset.length > 0) {
        // Update existing allocation
        const result = await pool.request()
          .input('userId', sql.Int, userId)
          .input('sessionId', sql.Int, sessionId)
          .input('maxCandidateVotes', sql.Int, maxCandidateVotes)
          .input('maxResolutionVotes', sql.Int, maxResolutionVotes)
          .input('allowSplitVoting', sql.Bit, allowSplitVoting || false)
          .input('notes', sql.NVarChar, notes || null)
          .input('updatedAt', sql.DateTime, new Date())
          .query(`
            UPDATE VoteAllocations
            SET 
              MaxCandidateVotes = @maxCandidateVotes,
              MaxResolutionVotes = @maxResolutionVotes,
              AllowSplitVoting = @allowSplitVoting,
              Notes = @notes,
              UpdatedAt = @updatedAt
            WHERE UserID = @userId AND SessionID = @sessionId;

            SELECT * FROM VoteAllocations WHERE UserID = @userId AND SessionID = @sessionId;
          `);

        logger.info(`Vote allocation updated for user ${userId} in session ${sessionId}`);
        return result.recordset[0];
      } else {
        // Create new allocation
        const result = await pool.request()
          .input('userId', sql.Int, userId)
          .input('sessionId', sql.Int, sessionId)
          .input('maxCandidateVotes', sql.Int, maxCandidateVotes)
          .input('maxResolutionVotes', sql.Int, maxResolutionVotes)
          .input('allowSplitVoting', sql.Bit, allowSplitVoting || false)
          .input('notes', sql.NVarChar, notes || null)
          .query(`
            INSERT INTO VoteAllocations (
              UserID, SessionID, MaxCandidateVotes, MaxResolutionVotes, 
              AllowSplitVoting, Notes, CreatedAt
            )
            VALUES (
              @userId, @sessionId, @maxCandidateVotes, @maxResolutionVotes,
              @allowSplitVoting, @notes, GETDATE()
            );

            SELECT * FROM VoteAllocations WHERE AllocationID = SCOPE_IDENTITY();
          `);

        logger.info(`Vote allocation created for user ${userId} in session ${sessionId}`);
        return result.recordset[0];
      }
    } catch (error) {
      logger.error('Error creating/updating vote allocation:', error);
      throw new Error(`Failed to create vote allocation: ${error.message}`);
    }
  }

  // Get all allocations for a session
  static async findBySession(sessionId) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('sessionId', sql.Int, sessionId)
        .query(`
          SELECT 
            va.AllocationID,
            va.UserID,
            va.SessionID,
            va.MaxCandidateVotes,
            va.MaxResolutionVotes,
            va.AllowSplitVoting,
            va.Notes,
            va.CreatedAt,
            va.UpdatedAt,
            u.FirstName + ' ' + u.LastName AS UserName,
            u.Email,
            u.Role,
            -- Current vote usage
            (SELECT COUNT(*) FROM CandidateVotes cv WHERE cv.VoterUserID = va.UserID AND cv.SessionID = va.SessionID) AS CandidateVotesUsed,
            (SELECT COUNT(*) FROM ResolutionVotes rv WHERE rv.VoterUserID = va.UserID AND rv.SessionID = va.SessionID) AS ResolutionVotesUsed,
            -- Remaining votes
            (va.MaxCandidateVotes - (SELECT COUNT(*) FROM CandidateVotes cv WHERE cv.VoterUserID = va.UserID AND cv.SessionID = va.SessionID)) AS CandidateVotesRemaining,
            (va.MaxResolutionVotes - (SELECT COUNT(*) FROM ResolutionVotes rv WHERE rv.VoterUserID = va.UserID AND rv.SessionID = va.SessionID)) AS ResolutionVotesRemaining
          FROM VoteAllocations va
          INNER JOIN Users u ON va.UserID = u.UserID
          WHERE va.SessionID = @sessionId
          ORDER BY u.LastName, u.FirstName
        `);

      return result.recordset;
    } catch (error) {
      logger.error('Error finding allocations by session:', error);
      throw new Error(`Failed to get session allocations: ${error.message}`);
    }
  }

  // Get allocation for specific user in session
  static async findByUser(userId, sessionId) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('sessionId', sql.Int, sessionId)
        .query(`
          SELECT 
            va.*,
            -- Current vote usage
            (SELECT COUNT(*) FROM CandidateVotes cv WHERE cv.VoterUserID = va.UserID AND cv.SessionID = va.SessionID) AS CandidateVotesUsed,
            (SELECT COUNT(*) FROM ResolutionVotes rv WHERE rv.VoterUserID = va.UserID AND rv.SessionID = va.SessionID) AS ResolutionVotesUsed,
            -- Remaining votes
            (va.MaxCandidateVotes - (SELECT COUNT(*) FROM CandidateVotes cv WHERE cv.VoterUserID = va.UserID AND cv.SessionID = va.SessionID)) AS CandidateVotesRemaining,
            (va.MaxResolutionVotes - (SELECT COUNT(*) FROM ResolutionVotes rv WHERE rv.VoterUserID = va.UserID AND rv.SessionID = va.SessionID)) AS ResolutionVotesRemaining
          FROM VoteAllocations va
          WHERE va.UserID = @userId AND va.SessionID = @sessionId
        `);

      return result.recordset[0] || null;
    } catch (error) {
      logger.error('Error finding allocation by user:', error);
      throw new Error(`Failed to get user allocation: ${error.message}`);
    }
  }

  // Update allocation
  static async update(allocationId, updates) {
    try {
      const pool = await getPool();
      
      const allowedFields = [
        'MaxCandidateVotes', 
        'MaxResolutionVotes', 
        'AllowSplitVoting',
        'Notes'
      ];
      
      const setClauses = [];
      const request = pool.request();
      
      Object.keys(updates).forEach(key => {
        const dbField = key.charAt(0).toUpperCase() + key.slice(1);
        if (allowedFields.includes(dbField)) {
          setClauses.push(`${dbField} = @${key}`);
          
          if (dbField === 'AllowSplitVoting') {
            request.input(key, sql.Bit, updates[key]);
          } else if (dbField.includes('Votes')) {
            request.input(key, sql.Int, updates[key]);
          } else {
            request.input(key, sql.NVarChar, updates[key]);
          }
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClauses.push('UpdatedAt = @updatedAt');
      request.input('updatedAt', sql.DateTime, new Date());
      request.input('allocationId', sql.Int, allocationId);

      const result = await request.query(`
        UPDATE VoteAllocations
        SET ${setClauses.join(', ')}
        WHERE AllocationID = @allocationId;

        SELECT * FROM VoteAllocations WHERE AllocationID = @allocationId;
      `);

      if (result.recordset.length === 0) {
        throw new Error('Allocation not found');
      }

      logger.info(`Vote allocation updated: ID ${allocationId}`);
      return result.recordset[0];
    } catch (error) {
      logger.error('Error updating allocation:', error);
      throw new Error(`Failed to update allocation: ${error.message}`);
    }
  }

  // Delete allocation
  static async delete(allocationId) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('allocationId', sql.Int, allocationId)
        .query(`
          DELETE FROM VoteAllocations 
          WHERE AllocationID = @allocationId
        `);

      if (result.rowsAffected[0] === 0) {
        throw new Error('Allocation not found');
      }

      logger.info(`Vote allocation deleted: ID ${allocationId}`);
      return { message: 'Vote allocation deleted successfully' };
    } catch (error) {
      logger.error('Error deleting allocation:', error);
      throw new Error(`Failed to delete allocation: ${error.message}`);
    }
  }

  // Get statistics for session allocations
  static async getStatistics(sessionId) {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('sessionId', sql.Int, sessionId)
        .query(`
          SELECT 
            COUNT(DISTINCT va.UserID) AS TotalUsersWithAllocations,
            AVG(CAST(va.MaxCandidateVotes AS FLOAT)) AS AvgCandidateVotesAllocated,
            AVG(CAST(va.MaxResolutionVotes AS FLOAT)) AS AvgResolutionVotesAllocated,
            SUM(va.MaxCandidateVotes) AS TotalCandidateVotesAllocated,
            SUM(va.MaxResolutionVotes) AS TotalResolutionVotesAllocated,
            COUNT(CASE WHEN va.AllowSplitVoting = 1 THEN 1 END) AS UsersAllowedSplitVoting,
            -- Actual usage
            (SELECT COUNT(*) FROM CandidateVotes cv WHERE cv.SessionID = @sessionId) AS TotalCandidateVotesCast,
            (SELECT COUNT(*) FROM ResolutionVotes rv WHERE rv.SessionID = @sessionId) AS TotalResolutionVotesCast
          FROM VoteAllocations va
          WHERE va.SessionID = @sessionId
        `);

      return result.recordset[0];
    } catch (error) {
      logger.error('Error getting allocation statistics:', error);
      throw new Error(`Failed to get allocation statistics: ${error.message}`);
    }
  }

  // Check if user has votes remaining
  static async hasVotesRemaining(userId, sessionId, voteType = 'candidate') {
    try {
      const allocation = await this.findByUser(userId, sessionId);
      
      if (!allocation) {
        // No allocation = unlimited votes
        return { hasVotes: true, unlimited: true };
      }

      const votesRemaining = voteType === 'candidate' 
        ? allocation.CandidateVotesRemaining 
        : allocation.ResolutionVotesRemaining;

      return {
        hasVotes: votesRemaining > 0,
        votesRemaining,
        votesUsed: voteType === 'candidate' ? allocation.CandidateVotesUsed : allocation.ResolutionVotesUsed,
        maxVotes: voteType === 'candidate' ? allocation.MaxCandidateVotes : allocation.MaxResolutionVotes,
        unlimited: false
      };
    } catch (error) {
      logger.error('Error checking votes remaining:', error);
      throw new Error(`Failed to check votes remaining: ${error.message}`);
    }
  }
}

module.exports = VoteAllocation;
