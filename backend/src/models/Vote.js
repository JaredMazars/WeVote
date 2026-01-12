// =====================================================
// Vote Model - Candidate and Resolution Voting
// =====================================================

const { executeQuery, executeStoredProcedure } = require('../config/database');
const logger = require('../config/logger');

class Vote {
  // Cast vote for candidate using stored procedure
  static async castCandidateVote(voteData) {
    try {
      const {
        sessionId, candidateId, voterUserId,
        votesToAllocate, isProxyVote = false, proxyId = null
      } = voteData;

      const result = await executeStoredProcedure('sp_CastCandidateVote', {
        SessionID: sessionId,
        CandidateID: candidateId,
        VoterUserID: voterUserId,
        VotesToAllocate: votesToAllocate,
        IsProxyVote: isProxyVote,
        ProxyID: proxyId
      });

      return result.recordset[0];
    } catch (err) {
      logger.error('Error casting candidate vote:', err);
      throw err;
    }
  }

  // Cast vote for resolution using stored procedure
  static async castResolutionVote(voteData) {
    try {
      const {
        sessionId, resolutionId, voterUserId, voteChoice,
        votesToAllocate = 1, isProxyVote = false, proxyId = null
      } = voteData;

      const result = await executeStoredProcedure('sp_CastResolutionVote', {
        SessionID: sessionId,
        ResolutionID: resolutionId,
        VoterUserID: voterUserId,
        VoteChoice: voteChoice,
        VotesToAllocate: votesToAllocate,
        IsProxyVote: isProxyVote,
        ProxyID: proxyId
      });

      return result.recordset[0];
    } catch (err) {
      logger.error('Error casting resolution vote:', err);
      throw err;
    }
  }

  // Get user's vote allocation for a session
  static async getUserVoteAllocation(sessionId, userId) {
    try {
      const query = `
        SELECT * FROM vw_UserVoteAllocations
        WHERE SessionID = @sessionId AND UserID = @userId
      `;

      const result = await executeQuery(query, { sessionId, userId });
      return result.recordset[0] || null;
    } catch (err) {
      logger.error('Error getting user vote allocation:', err);
      throw err;
    }
  }

  // Get candidate results for a session
  static async getCandidateResults(sessionId) {
    try {
      const query = `
        SELECT * FROM vw_CandidateResults
        WHERE SessionID = @sessionId
        ORDER BY TotalVotesAllocated DESC, CandidateName
      `;

      const result = await executeQuery(query, { sessionId });
      return result.recordset;
    } catch (err) {
      logger.error('Error getting candidate results:', err);
      throw err;
    }
  }

  // Get resolution results for a session
  static async getResolutionResults(sessionId) {
    try {
      const query = `
        SELECT * FROM vw_ResolutionResults
        WHERE SessionID = @sessionId
        ORDER BY ResolutionID
      `;

      const result = await executeQuery(query, { sessionId });
      return result.recordset;
    } catch (err) {
      logger.error('Error getting resolution results:', err);
      throw err;
    }
  }

  // Get user's voting history
  static async getUserVotingHistory(userId, sessionId = null) {
    try {
      let query = `
        SELECT 
          'candidate' AS VoteType,
          cv.VoteID,
          cv.SessionID,
          s.Title AS SessionTitle,
          cv.VotedAt,
          cv.VotesAllocated,
          cv.IsProxyVote,
          c.CandidateID AS EntityID,
          u.FirstName + ' ' + u.LastName AS EntityName,
          c.Category
        FROM CandidateVotes cv
        INNER JOIN AGMSessions s ON cv.SessionID = s.SessionID
        INNER JOIN Candidates c ON cv.CandidateID = c.CandidateID
        INNER JOIN Employees e ON c.EmployeeID = e.EmployeeID
        INNER JOIN Users u ON e.UserID = u.UserID
        WHERE cv.VoterUserID = @userId
      `;

      if (sessionId) {
        query += ' AND cv.SessionID = @sessionId';
      }

      query += `
        UNION ALL
        SELECT 
          'resolution' AS VoteType,
          rv.VoteID,
          rv.SessionID,
          s.Title AS SessionTitle,
          rv.VotedAt,
          rv.VotesAllocated,
          rv.IsProxyVote,
          r.ResolutionID AS EntityID,
          r.Title AS EntityName,
          rv.VoteChoice AS Category
        FROM ResolutionVotes rv
        INNER JOIN AGMSessions s ON rv.SessionID = s.SessionID
        INNER JOIN Resolutions r ON rv.ResolutionID = r.ResolutionID
        WHERE rv.VoterUserID = @userId
      `;

      if (sessionId) {
        query += ' AND rv.SessionID = @sessionId';
      }

      query += ' ORDER BY VotedAt DESC';

      const params = { userId };
      if (sessionId) {
        params.sessionId = sessionId;
      }

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (err) {
      logger.error('Error getting user voting history:', err);
      throw err;
    }
  }
}

module.exports = Vote;
