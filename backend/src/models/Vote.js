// =====================================================
// Vote Model - Candidate and Resolution Voting
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Vote {
  // Cast vote for candidate using direct SQL
  static async castCandidateVote(voteData) {
    try {
      const {
        sessionId, candidateId, voterUserId,
        votesToAllocate, isProxyVote = false, proxyId = null
      } = voteData;

      const result = await executeQuery(`
        INSERT INTO CandidateVotes (SessionID, CandidateID, VoterUserID, VotesAllocated, IsProxyVote, ProxyID, VotedAt)
        OUTPUT INSERTED.VoteID, INSERTED.VotedAt
        VALUES (@sessionId, @candidateId, @voterUserId, @votesToAllocate, @isProxyVote, @proxyId, GETDATE())
      `, { sessionId, candidateId, voterUserId, votesToAllocate, isProxyVote: isProxyVote ? 1 : 0, proxyId });

      // Write audit log (non-fatal)
      try {
        await executeQuery(`
          INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
          VALUES (@voterUserId, 'CAST_CANDIDATE_VOTE', 'CandidateVote', @candidateId,
            'Candidate vote cast in session ' + CAST(@sessionId AS NVARCHAR) + ' - votes: ' + CAST(@votesToAllocate AS NVARCHAR),
            'system', 'server', GETDATE())
        `, { voterUserId, candidateId, sessionId, votesToAllocate });
      } catch (auditErr) {
        logger.warn('Audit log failed for candidate vote:', auditErr.message);
      }

      return result.recordset[0];
    } catch (err) {
      logger.error('Error casting candidate vote:', err);
      throw err;
    }
  }

  // Cast vote for resolution using direct SQL
  static async castResolutionVote(voteData) {
    try {
      const {
        sessionId, resolutionId, voterUserId, voteChoice,
        votesToAllocate = 1, isProxyVote = false, proxyId = null
      } = voteData;

      const result = await executeQuery(`
        INSERT INTO ResolutionVotes (SessionID, ResolutionID, VoterUserID, VoteChoice, VotesAllocated, IsProxyVote, ProxyID, VotedAt)
        OUTPUT INSERTED.VoteID, INSERTED.VotedAt
        VALUES (@sessionId, @resolutionId, @voterUserId, @voteChoice, @votesToAllocate, @isProxyVote, @proxyId, GETDATE())
      `, { sessionId, resolutionId, voterUserId, voteChoice, votesToAllocate, isProxyVote: isProxyVote ? 1 : 0, proxyId });

      // Update running totals on Resolutions table (non-fatal)
      try {
        const col = voteChoice === 'yes' ? 'TotalYesVotes' : voteChoice === 'no' ? 'TotalNoVotes' : 'TotalAbstainVotes';
        await executeQuery(`
          UPDATE Resolutions SET ${col} = ISNULL(${col}, 0) + @votesToAllocate WHERE ResolutionID = @resolutionId
        `, { votesToAllocate, resolutionId });
      } catch (updateErr) {
        logger.warn('Running total update failed:', updateErr.message);
      }

      // Write audit log (non-fatal)
      try {
        await executeQuery(`
          INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
          VALUES (@voterUserId, 'CAST_RESOLUTION_VOTE', 'ResolutionVote', @resolutionId,
            'Resolution vote (' + @voteChoice + ') in session ' + CAST(@sessionId AS NVARCHAR),
            'system', 'server', GETDATE())
        `, { voterUserId, resolutionId, voteChoice, sessionId });
      } catch (auditErr) {
        logger.warn('Audit log failed for resolution vote:', auditErr.message);
      }

      return result.recordset[0];
    } catch (err) {
      logger.error('Error casting resolution vote:', err);
      throw err;
    }
  }

  // Get user's vote allocation for a session
  static async getUserVoteAllocation(sessionId, userId) {
    try {
      const result = await executeQuery(`
        SELECT
          va.AllocationID,
          va.SessionID,
          va.UserID,
          va.MaxCandidateVotes,
          va.MaxResolutionVotes,
          ISNULL((SELECT COUNT(*) FROM CandidateVotes cv WHERE cv.VoterUserID = va.UserID AND cv.SessionID = va.SessionID AND cv.IsProxyVote = 0), 0) AS CandidateVotesUsed,
          ISNULL((SELECT COUNT(*) FROM ResolutionVotes rv WHERE rv.VoterUserID = va.UserID AND rv.SessionID = va.SessionID AND rv.IsProxyVote = 0), 0) AS ResolutionVotesUsed
        FROM VoteAllocations va
        WHERE va.SessionID = @sessionId AND va.UserID = @userId
      `, { sessionId, userId });

      return result.recordset[0] || null;
    } catch (err) {
      logger.error('Error getting user vote allocation:', err);
      throw err;
    }
  }

  // Get candidate results for a session
  static async getCandidateResults(sessionId) {
    try {
      const result = await executeQuery(`
        SELECT
          c.CandidateID,
          u.FirstName + ' ' + u.LastName AS CandidateName,
          c.Category,
          e.Position,
          ISNULL(SUM(cv.VotesAllocated), 0) AS TotalVotesAllocated,
          COUNT(cv.VoteID) AS VoteCount
        FROM Candidates c
        INNER JOIN Employees e ON c.EmployeeID = e.EmployeeID
        INNER JOIN Users u ON e.UserID = u.UserID
        LEFT JOIN CandidateVotes cv ON c.CandidateID = cv.CandidateID AND cv.SessionID = @sessionId
        WHERE c.SessionID = @sessionId OR @sessionId IS NULL
        GROUP BY c.CandidateID, u.FirstName, u.LastName, c.Category, e.Position
        ORDER BY TotalVotesAllocated DESC, CandidateName
      `, { sessionId });

      return result.recordset;
    } catch (err) {
      logger.error('Error getting candidate results:', err);
      throw err;
    }
  }

  // Get resolution results for a session
  static async getResolutionResults(sessionId) {
    try {
      const result = await executeQuery(`
        SELECT
          r.ResolutionID,
          r.Title AS ResolutionTitle,
          r.Description,
          r.RequiredMajority,
          ISNULL(SUM(CASE WHEN rv.VoteChoice = 'yes' THEN rv.VotesAllocated ELSE 0 END), 0) AS TotalYesVotes,
          ISNULL(SUM(CASE WHEN rv.VoteChoice = 'no' THEN rv.VotesAllocated ELSE 0 END), 0) AS TotalNoVotes,
          ISNULL(SUM(CASE WHEN rv.VoteChoice = 'abstain' THEN rv.VotesAllocated ELSE 0 END), 0) AS TotalAbstainVotes,
          COUNT(rv.VoteID) AS TotalVotesCast
        FROM Resolutions r
        LEFT JOIN ResolutionVotes rv ON r.ResolutionID = rv.ResolutionID AND rv.SessionID = @sessionId
        WHERE r.SessionID = @sessionId OR @sessionId IS NULL
        GROUP BY r.ResolutionID, r.Title, r.Description, r.RequiredMajority
        ORDER BY r.ResolutionID
      `, { sessionId });

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
  // Get ALL votes across all users (admin view) with voter names
  static async getAllVotingHistory(sessionId = null) {
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
          cv.VoterUserID,
          uv.FirstName + ' ' + uv.LastName AS VoterName,
          uv.Email AS VoterEmail,
          c.CandidateID AS EntityID,
          uc.FirstName + ' ' + uc.LastName AS EntityName,
          c.Category
        FROM CandidateVotes cv
        INNER JOIN AGMSessions s ON cv.SessionID = s.SessionID
        INNER JOIN Users uv ON cv.VoterUserID = uv.UserID
        INNER JOIN Candidates c ON cv.CandidateID = c.CandidateID
        INNER JOIN Employees e ON c.EmployeeID = e.EmployeeID
        INNER JOIN Users uc ON e.UserID = uc.UserID
      `;

      if (sessionId) {
        query += ' WHERE cv.SessionID = @sessionId';
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
          rv.VoterUserID,
          uv.FirstName + ' ' + uv.LastName AS VoterName,
          uv.Email AS VoterEmail,
          r.ResolutionID AS EntityID,
          r.Title AS EntityName,
          rv.VoteChoice AS Category
        FROM ResolutionVotes rv
        INNER JOIN AGMSessions s ON rv.SessionID = s.SessionID
        INNER JOIN Users uv ON rv.VoterUserID = uv.UserID
        INNER JOIN Resolutions r ON rv.ResolutionID = r.ResolutionID
      `;

      if (sessionId) {
        query += ' WHERE rv.SessionID = @sessionId';
      }

      query += ' ORDER BY VotedAt DESC';

      const params = sessionId ? { sessionId } : {};
      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (err) {
      logger.error('Error getting all voting history:', err);
      throw err;
    }
  }

  // Check if user has already voted for a specific candidate in this session
  static async hasVotedForCandidate(userId, sessionId, candidateId) {
    try {
      const result = await executeQuery(
        `SELECT TOP 1 VoteID FROM CandidateVotes
         WHERE VoterUserID = @userId AND SessionID = @sessionId AND CandidateID = @candidateId AND IsProxyVote = 0`,
        { userId, sessionId, candidateId }
      );
      return result.recordset.length > 0;
    } catch (err) {
      logger.error('Error checking candidate vote:', err);
      throw err;
    }
  }

  // Check if user has already voted on a specific resolution in this session
  static async hasVotedForResolution(userId, sessionId, resolutionId) {
    try {
      const result = await executeQuery(
        `SELECT TOP 1 VoteID FROM ResolutionVotes
         WHERE VoterUserID = @userId AND SessionID = @sessionId AND ResolutionID = @resolutionId AND IsProxyVote = 0`,
        { userId, sessionId, resolutionId }
      );
      return result.recordset.length > 0;
    } catch (err) {
      logger.error('Error checking resolution vote:', err);
      throw err;
    }
  }

  // Get count of checked-in attendees for quorum calculation
  static async getAttendanceCount(sessionId) {
    try {
      const result = await executeQuery(
        `SELECT COUNT(*) AS cnt FROM Attendance WHERE SessionID = @sessionId AND CheckedIn = 1`,
        { sessionId }
      );
      return result.recordset[0]?.cnt || 0;
    } catch (err) {
      logger.error('Error getting attendance count:', err);
      return 0; // non-fatal, fall through to allow voting
    }
  }
}

module.exports = Vote;
