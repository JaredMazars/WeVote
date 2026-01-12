// =====================================================
// Department Model
// Handles all database operations for departments
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Department {
  // Get all departments with optional organization filter
  static async findAll(organizationId = null) {
    try {
      let query = `
        SELECT 
          d.*,
          o.Name as OrganizationName,
          m.FirstName + ' ' + m.LastName as ManagerName,
          (SELECT COUNT(*) FROM Employees WHERE DepartmentID = d.DepartmentID) as EmployeeCount
        FROM Departments d
        LEFT JOIN Organizations o ON d.OrganizationID = o.OrganizationID
        LEFT JOIN Users m ON d.ManagerUserID = m.UserID
        WHERE d.IsActive = 1
      `;

      const params = {};

      if (organizationId) {
        query += ' AND d.OrganizationID = @organizationId';
        params.organizationId = organizationId;
      }

      query += ' ORDER BY o.Name, d.Name';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Department.findAll:', error);
      throw error;
    }
  }

  // Get single department by ID
  static async findById(departmentId) {
    try {
      const query = `
        SELECT 
          d.*,
          o.Name as OrganizationName,
          m.FirstName + ' ' + m.LastName as ManagerName,
          m.Email as ManagerEmail,
          (SELECT COUNT(*) FROM Employees WHERE DepartmentID = d.DepartmentID) as EmployeeCount
        FROM Departments d
        LEFT JOIN Organizations o ON d.OrganizationID = o.OrganizationID
        LEFT JOIN Users m ON d.ManagerUserID = m.UserID
        WHERE d.DepartmentID = @departmentId
      `;

      const result = await executeQuery(query, { departmentId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Department.findById:', error);
      throw error;
    }
  }

  // Create new department
  static async create(deptData) {
    try {
      const query = `
        INSERT INTO Departments (
          OrganizationID, Name, Code,
          Description, ManagerUserID, IsActive,
          CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @organizationId, @name, @code,
          @description, @managerId, 1,
          GETDATE(), GETDATE()
        )
      `;

      const params = {
        organizationId: deptData.organizationId,
        name: deptData.name,
        code: deptData.code || null,
        description: deptData.description || null,
        managerId: deptData.managerId || null,
        parentDepartmentId: deptData.parentDepartmentId || null
      };

      const result = await executeQuery(query, params);
      const newDept = result.recordset[0];

      logger.info(`Department created: ${newDept.Name} (ID: ${newDept.DepartmentID})`);
      return newDept;
    } catch (error) {
      logger.error('Error in Department.create:', error);
      throw error;
    }
  }

  // Update department
  static async update(departmentId, updates) {
    try {
      const allowedUpdates = [
        'Name', 'Code', 'Description',
        'ManagerUserID', 'IsActive'
      ];

      const setClauses = [];
      const params = { departmentId };

      Object.keys(updates).forEach(key => {
        const dbKey = key === 'name' ? 'Name' : 
                     key === 'code' ? 'Code' :
                     key === 'description' ? 'Description' :
                     key === 'managerId' ? 'ManagerUserID' :
                     key === 'isActive' ? 'IsActive' : null;
        
        if (dbKey && allowedUpdates.includes(dbKey)) {
          setClauses.push(`${dbKey} = @${key}`);
          params[key] = updates[key];
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      setClauses.push('UpdatedAt = GETDATE()');

      const query = `
        UPDATE Departments
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE DepartmentID = @departmentId
      `;

      const result = await executeQuery(query, params);
      const updatedDept = result.recordset[0];

      logger.info(`Department updated: ID ${departmentId}`);
      return updatedDept;
    } catch (error) {
      logger.error('Error in Department.update:', error);
      throw error;
    }
  }

  // Delete department
  static async delete(departmentId) {
    try {
      // Check for employees
      const checkQuery = `
        SELECT COUNT(*) as EmployeeCount 
        FROM Employees 
        WHERE DepartmentID = @departmentId
      `;

      const checkResult = await executeQuery(checkQuery, { departmentId });
      
      if (checkResult.recordset[0].EmployeeCount > 0) {
        throw new Error('Cannot delete department with existing employees');
      }

      const query = 'DELETE FROM Departments WHERE DepartmentID = @departmentId';
      await executeQuery(query, { departmentId });

      logger.info(`Department deleted: ID ${departmentId}`);
      return { message: 'Department deleted successfully' };
    } catch (error) {
      logger.error('Error in Department.delete:', error);
      throw error;
    }
  }
}

module.exports = Department;
