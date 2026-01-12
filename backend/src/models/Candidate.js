// =====================================================
// Candidate Model
// Handles all database operations for candidates
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Candidate {
  // Get all candidates or filter by session
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          c.CandidateID,
          c.SessionID,
          s.Title as SessionTitle,
          c.EmployeeID,
          emp.UserID,
          u.FirstName,
          u.LastName,
          u.Email,
          u.PhoneNumber,
          emp.Position,
          d.Name as DepartmentName,
          emp.Bio,
          u.ProfilePictureURL,
          c.Category,
          c.NominatedBy,
          nominator.FirstName + ' ' + nominator.LastName as NominatedByName,
          c.NominationReason,
          c.Status,
          c.TotalVotesReceived,
          c.CreatedAt,
          c.UpdatedAt
        FROM Candidates c
        LEFT JOIN AGMSessions s ON c.SessionID = s.SessionID
        LEFT JOIN Employees emp ON c.EmployeeID = emp.EmployeeID
        LEFT JOIN Users u ON emp.UserID = u.UserID
        LEFT JOIN Departments d ON emp.DepartmentID = d.DepartmentID
        LEFT JOIN Users nominator ON c.NominatedBy = nominator.UserID
        WHERE 1=1
      `;

      const params = {};

      if (filters.sessionId) {
        query += ' AND c.SessionID = @sessionId';
        params.sessionId = filters.sessionId;
      }

      if (filters.categoryId) {
        query += ' AND c.Category = @categoryId';
        params.categoryId = filters.categoryId;
      }

      if (filters.isActive !== undefined) {
        query += ' AND c.Status = @status';
        params.status = filters.isActive ? 'active' : 'inactive';
      }

      if (filters.department) {
        query += ' AND d.Name = @department';
        params.department = filters.department;
      }

      query += ' ORDER BY c.CandidateID ASC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Candidate.findAll:', error);
      throw error;
    }
  }

  // Get single candidate by ID
  static async findById(candidateId) {
    try {
      const query = `
        SELECT 
          c.CandidateID,
          c.SessionID,
          s.Title as SessionTitle,
          s.Status as SessionStatus,
          c.EmployeeID,
          emp.UserID,
          u.FirstName,
          u.LastName,
          u.Email,
          u.PhoneNumber,
          emp.Position,
          d.Name as DepartmentName,
          emp.Bio,
          u.ProfilePictureURL,
          c.Category,
          c.NominatedBy,
          nominator.FirstName + ' ' + nominator.LastName as NominatedByName,
          nominator.Email as NominatorEmail,
          c.NominationReason,
          c.Status,
          c.TotalVotesReceived,
          c.CreatedAt,
          c.UpdatedAt
        FROM Candidates c
        LEFT JOIN AGMSessions s ON c.SessionID = s.SessionID
        LEFT JOIN Employees emp ON c.EmployeeID = emp.EmployeeID
        LEFT JOIN Users u ON emp.UserID = u.UserID
        LEFT JOIN Departments d ON emp.DepartmentID = d.DepartmentID
        LEFT JOIN Users nominator ON c.NominatedBy = nominator.UserID
        WHERE c.CandidateID = @candidateId
      `;

      const result = await executeQuery(query, { candidateId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Candidate.findById:', error);
      throw error;
    }
  }

  // Create new candidate
  static async create(candidateData) {
    try {
      const query = `
        INSERT INTO Candidates (
          SessionID, EmployeeID, Category, NominatedBy, NominationReason, Status
        )
        OUTPUT INSERTED.*
        VALUES (
          @sessionId, @employeeId, @category, @nominatedBy, @nominationReason, 'active'
        )
      `;

      const params = {
        sessionId: candidateData.sessionId,
        employeeId: candidateData.employeeId,
        category: candidateData.category,
        nominatedBy: candidateData.nominatedBy || null,
        nominationReason: candidateData.nominationReason || null
      };

      const result = await executeQuery(query, params);
      const newCandidate = result.recordset[0];

      logger.info(`Candidate created: EmployeeID ${newCandidate.EmployeeID} for category ${newCandidate.Category} (ID: ${newCandidate.CandidateID})`);
      
      // Fetch the full candidate with employee details
      return await this.findById(newCandidate.CandidateID);
    } catch (error) {
      logger.error('Error in Candidate.create:', error);
      throw error;
    }
  }

  // Update candidate
  static async update(candidateId, updates) {
    try {
      const allowedUpdates = [
        'Category', 'NominationReason', 'Status'
      ];

      const setClauses = [];
      const params = { candidateId };

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
        UPDATE Candidates
        SET ${setClauses.join(', ')}
        WHERE CandidateID = @candidateId
      `;

      await executeQuery(query, params);

      logger.info(`Candidate updated: ID ${candidateId}`);
      
      // Return the updated candidate with employee details
      return await this.findById(candidateId);
    } catch (error) {
      logger.error('Error in Candidate.update:', error);
      throw error;
    }
  }

  // Delete candidate
  static async delete(candidateId) {
    try {
      // Check if candidate has votes
      const voteCheck = await executeQuery(
        'SELECT COUNT(*) as VoteCount FROM CandidateVotes WHERE CandidateID = @candidateId',
        { candidateId }
      );

      if (voteCheck.recordset[0].VoteCount > 0) {
        throw new Error('Cannot delete candidate with existing votes');
      }

      const query = 'DELETE FROM Candidates WHERE CandidateID = @candidateId';
      await executeQuery(query, { candidateId });

      logger.info(`Candidate deleted: ID ${candidateId}`);
      return { message: 'Candidate deleted successfully' };
    } catch (error) {
      logger.error('Error in Candidate.delete:', error);
      throw error;
    }
  }

  // Get candidate vote statistics
  static async getStatistics(candidateId) {
    try {
      const query = `
        SELECT 
          c.CandidateID,
          u.FirstName + ' ' + u.LastName as CandidateName,
          c.Category,
          c.TotalVotesReceived
        FROM Candidates c
        LEFT JOIN Employees emp ON c.EmployeeID = emp.EmployeeID
        LEFT JOIN Users u ON emp.UserID = u.UserID
        WHERE c.CandidateID = @candidateId
      `;

      const result = await executeQuery(query, { candidateId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Candidate.getStatistics:', error);
      throw error;
    }
  }

  // Get all candidate categories
  static async getCategories() {
    try {
      const query = `
        SELECT DISTINCT Category
        FROM Candidates
        WHERE Status = 'active'
        ORDER BY Category ASC
      `;

      const result = await executeQuery(query);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Candidate.getCategories:', error);
      throw error;
    }
  }

  // Get candidates by category
  static async findByCategory(category, sessionId = null) {
    try {
      let query = `
        SELECT 
          c.CandidateID,
          c.SessionID,
          s.Title as SessionTitle,
          c.EmployeeID,
          emp.UserID,
          u.FirstName,
          u.LastName,
          u.Email,
          u.PhoneNumber,
          emp.Position,
          d.Name as DepartmentName,
          emp.Bio,
          u.ProfilePictureURL,
          c.Category,
          c.NominatedBy,
          nominator.FirstName + ' ' + nominator.LastName as NominatedByName,
          c.NominationReason,
          c.Status,
          c.TotalVotesReceived,
          c.CreatedAt,
          c.UpdatedAt
        FROM Candidates c
        LEFT JOIN AGMSessions s ON c.SessionID = s.SessionID
        LEFT JOIN Employees emp ON c.EmployeeID = emp.EmployeeID
        LEFT JOIN Users u ON emp.UserID = u.UserID
        LEFT JOIN Departments d ON emp.DepartmentID = d.DepartmentID
        LEFT JOIN Users nominator ON c.NominatedBy = nominator.UserID
        WHERE c.Category = @category
        AND c.Status = 'active'
      `;

      const params = { category };

      if (sessionId) {
        query += ' AND c.SessionID = @sessionId';
        params.sessionId = sessionId;
      }

      query += ' ORDER BY c.CandidateID ASC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Candidate.findByCategory:', error);
      throw error;
    }
  }
}

module.exports = Candidate;
