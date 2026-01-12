// =====================================================
// Employee Model
// Handles all database operations for employees
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Employee {
  // Find employee by user ID
  static async findByUserId(userId) {
    try {
      const query = `
        SELECT 
          e.*,
          u.Email,
          u.FirstName as UserFirstName,
          u.LastName as UserLastName,
          o.Name as OrganizationName,
          d.Name as DepartmentName,
          m.FirstName + ' ' + m.LastName as ManagerName,
          m.Email as ManagerEmail
        FROM Employees e
        INNER JOIN Users u ON e.UserID = u.UserID
        LEFT JOIN Organizations o ON e.OrganizationID = o.OrganizationID
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Users m ON e.ManagerID = m.UserID
        WHERE e.UserID = @userId
      `;

      const result = await executeQuery(query, { userId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Employee.findByUserId:', error);
      throw error;
    }
  }

  // Find employee by ID
  static async findById(employeeId) {
    try {
      const query = `
        SELECT 
          e.*,
          u.Email,
          u.FirstName as UserFirstName,
          u.LastName as UserLastName,
          o.Name as OrganizationName,
          d.Name as DepartmentName,
          m.FirstName + ' ' + m.LastName as ManagerName
        FROM Employees e
        INNER JOIN Users u ON e.UserID = u.UserID
        LEFT JOIN Organizations o ON e.OrganizationID = o.OrganizationID
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Users m ON e.ManagerID = m.UserID
        WHERE e.EmployeeID = @employeeId
      `;

      const result = await executeQuery(query, { employeeId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Employee.findById:', error);
      throw error;
    }
  }

  // Get all employees with filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          e.EmployeeID,
          e.UserID,
          e.EmployeeNumber,
          e.OrganizationID,
          o.Name as OrganizationName,
          e.DepartmentID,
          d.Name as DepartmentName,
          e.Position as JobTitle,
          e.ManagerID,
          m.FirstName + ' ' + m.LastName as ManagerName,
          e.HireDate,
          e.RegistrationStatus,
          e.Bio,
          e.Shares,
          e.MembershipTier,
          e.RegistrationStatus as EmploymentStatus,
          e.ApprovedBy,
          e.ApprovedAt,
          u.Email,
          u.FirstName,
          u.LastName
        FROM Employees e
        INNER JOIN Users u ON e.UserID = u.UserID
        LEFT JOIN Organizations o ON e.OrganizationID = o.OrganizationID
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Users m ON e.ManagerID = m.UserID
        WHERE 1=1
      `;

      const params = {};

      if (filters.organizationId) {
        query += ' AND e.OrganizationID = @organizationId';
        params.organizationId = filters.organizationId;
      }

      if (filters.departmentId) {
        query += ' AND e.DepartmentID = @departmentId';
        params.departmentId = filters.departmentId;
      }

      if (filters.employmentStatus) {
        query += ' AND e.RegistrationStatus = @employmentStatus';
        params.employmentStatus = filters.employmentStatus;
      }

      if (filters.isApproved !== undefined) {
        query += ' AND e.IsApproved = @isApproved';
        params.isApproved = filters.isApproved ? 1 : 0;
      }

      query += ' ORDER BY u.LastName, u.FirstName';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Employee.findAll:', error);
      throw error;
    }
  }

  // Create new employee record
  static async create(employeeData) {
    try {
      const query = `
        INSERT INTO Employees (
          UserID, EmployeeNumber, OrganizationID, DepartmentID,
          Position, ManagerID, HireDate, Bio,
          Shares, MembershipTier, RegistrationStatus
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId, @employeeNumber, @organizationId, @departmentId,
          @position, @managerId, @hireDate, @bio,
          @shares, @membershipTier, @registrationStatus
        )
      `;

      const params = {
        userId: employeeData.userId,
        employeeNumber: employeeData.employeeNumber || null,
        organizationId: employeeData.organizationId,
        departmentId: employeeData.departmentId || null,
        position: employeeData.jobTitle || employeeData.position || null,
        managerId: employeeData.managerId || null,
        hireDate: employeeData.hireDate || new Date().toISOString(),
        bio: employeeData.bio || null,
        shares: employeeData.shares || 0,
        membershipTier: employeeData.membershipTier || 'Bronze',
        registrationStatus: employeeData.registrationStatus || 'approved'
      };

      const result = await executeQuery(query, params);
      const newEmployee = result.recordset[0];

      logger.info(`Employee created: UserID ${employeeData.userId}, EmployeeID ${newEmployee.EmployeeID}`);
      return newEmployee;
    } catch (error) {
      logger.error('Error in Employee.create:', error);
      throw error;
    }
  }

  // Update employee
  static async update(employeeId, updates) {
    try {
      const allowedUpdates = [
        'EmployeeNumber', 'DepartmentID', 'Position', 'ManagerID',
        'HireDate', 'RegistrationStatus', 'Bio', 'Shares',
        'MembershipTier'
      ];

      const setClauses = [];
      const params = { employeeId };

      Object.keys(updates).forEach(key => {
        let dbKey = key.charAt(0).toUpperCase() + key.slice(1);
        // Map jobTitle to Position
        if (key === 'jobTitle') dbKey = 'Position';
        if (key === 'employmentStatus') dbKey = 'RegistrationStatus';
        
        if (allowedUpdates.includes(dbKey)) {
          setClauses.push(`${dbKey} = @${key}`);
          params[key] = updates[key];
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      const query = `
        UPDATE Employees
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE EmployeeID = @employeeId
      `;

      const result = await executeQuery(query, params);
      const updatedEmployee = result.recordset[0];

      logger.info(`Employee updated: ID ${employeeId}`);
      return updatedEmployee;
    } catch (error) {
      logger.error('Error in Employee.update:', error);
      throw error;
    }
  }

  // Approve employee
  static async approve(employeeId, approvedBy) {
    try {
      const query = `
        UPDATE Employees
        SET IsApproved = 1,
            ApprovedBy = @approvedBy,
            ApprovedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE EmployeeID = @employeeId
      `;

      const result = await executeQuery(query, { employeeId, approvedBy });
      const approvedEmployee = result.recordset[0];

      logger.info(`Employee approved: ID ${employeeId} by user ${approvedBy}`);
      return approvedEmployee;
    } catch (error) {
      logger.error('Error in Employee.approve:', error);
      throw error;
    }
  }

  // Get managers list
  static async getManagers(organizationId = null) {
    try {
      let query = `
        SELECT DISTINCT
          u.UserID,
          u.FirstName,
          u.LastName,
          u.Email,
          e.JobTitle,
          d.DepartmentName
        FROM Employees e
        INNER JOIN Users u ON e.UserID = u.UserID
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        WHERE e.RegistrationStatus = 'approved'
        AND e.IsApproved = 1
        AND (e.JobTitle LIKE '%Manager%' OR e.JobTitle LIKE '%Director%' OR e.JobTitle LIKE '%Lead%')
      `;

      const params = {};

      if (organizationId) {
        query += ' AND e.OrganizationID = @organizationId';
        params.organizationId = organizationId;
      }

      query += ' ORDER BY u.LastName, u.FirstName';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Employee.getManagers:', error);
      throw error;
    }
  }

  // Check employee status for user
  static async checkStatus(userId) {
    try {
      const query = `
        SELECT 
          e.EmployeeID,
          e.RegistrationStatus,
          e.Position,
          e.HireDate,
          CASE 
            WHEN e.RegistrationStatus = 'pending' THEN 'pending_approval'
            WHEN e.RegistrationStatus = 'approved' THEN 'active'
            WHEN e.RegistrationStatus = 'rejected' THEN 'inactive'
            ELSE 'pending_approval'
          END as Status
        FROM Employees e
        WHERE e.UserID = @userId
      `;

      const result = await executeQuery(query, { userId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Employee.checkStatus:', error);
      throw error;
    }
  }

  // Get employee statistics
  static async getStatistics(organizationId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as TotalEmployees,
          SUM(CASE WHEN IsApproved = 1 THEN 1 ELSE 0 END) as ApprovedEmployees,
          SUM(CASE WHEN IsApproved = 0 THEN 1 ELSE 0 END) as PendingApproval,
          SUM(CASE WHEN RegistrationStatus = 'approved' THEN 1 ELSE 0 END) as ActiveEmployees,
          AVG(CAST(ProfileCompletionPercentage as FLOAT)) as AvgProfileCompletion
        FROM Employees
        WHERE 1=1
      `;

      const params = {};

      if (organizationId) {
        query += ' AND OrganizationID = @organizationId';
        params.organizationId = organizationId;
      }

      const result = await executeQuery(query, params);
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Employee.getStatistics:', error);
      throw error;
    }
  }

  // Delete employee
  static async delete(employeeId) {
    try {
      const query = 'DELETE FROM Employees WHERE EmployeeID = @employeeId';
      await executeQuery(query, { employeeId });

      logger.info(`Employee deleted: ID ${employeeId}`);
      return { message: 'Employee deleted successfully' };
    } catch (error) {
      logger.error('Error in Employee.delete:', error);
      throw error;
    }
  }
}

module.exports = Employee;
