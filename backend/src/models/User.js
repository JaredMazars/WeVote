// =====================================================
// User Model - Handles all user-related database operations
// =====================================================

const { executeQuery, sql } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

class User {
  // Find user by email
  static async findByEmail(email) {
    try {
      const query = `
        SELECT 
          u.UserID, u.OrganizationID, u.Email, u.PasswordHash, u.Salt,
          u.FirstName, u.LastName, u.Role, u.IsActive, u.IsEmailVerified,
          u.ProfilePictureURL, u.PhoneNumber, u.LastLoginAt, u.RequiresPasswordChange,
          o.Name AS OrganizationName
        FROM Users u
        INNER JOIN Organizations o ON u.OrganizationID = o.OrganizationID
        WHERE u.Email = @email
      `;
      
      const result = await executeQuery(query, { email });
      return result.recordset[0] || null;
    } catch (err) {
      logger.error('Error finding user by email:', err);
      throw err;
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const query = `
        SELECT 
          u.UserID, u.OrganizationID, u.Email, u.FirstName, u.LastName,
          u.Role, u.IsActive, u.IsEmailVerified, u.ProfilePictureURL,
          u.PhoneNumber, u.LastLoginAt, u.CreatedAt, u.RequiresPasswordChange,
          o.Name AS OrganizationName,
          e.EmployeeID, e.EmployeeNumber, e.Position, e.DepartmentID,
          e.Shares, e.MembershipTier, e.Bio,
          d.Name AS DepartmentName
        FROM Users u
        INNER JOIN Organizations o ON u.OrganizationID = o.OrganizationID
        LEFT JOIN Employees e ON u.UserID = e.UserID
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        WHERE u.UserID = @userId
      `;
      
      const result = await executeQuery(query, { userId });
      return result.recordset[0] || null;
    } catch (err) {
      logger.error('Error finding user by ID:', err);
      throw err;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { 
        organizationId, email, password, firstName, lastName, 
        role = 'voter', phoneNumber 
      } = userData;

      // Hash password
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
      const passwordHash = await bcrypt.hash(password, salt);

      const query = `
        INSERT INTO Users (
          OrganizationID, Email, PasswordHash, Salt, FirstName, LastName,
          Role, PhoneNumber, IsActive, IsEmailVerified, RequiresPasswordChange
        )
        OUTPUT INSERTED.*
        VALUES (
          @organizationId, @email, @passwordHash, @salt, @firstName, @lastName,
          @role, @phoneNumber, 1, @isEmailVerified, @requiresPasswordChange
        )
      `;

      // Set RequiresPasswordChange to true for admin/auditor roles
      const requiresPasswordChange = (role === 'admin' || role === 'auditor') ? 1 : 0;
      // Auto-verify email for admin/auditor since they receive email with password
      const isEmailVerified = (role === 'admin' || role === 'auditor') ? 1 : 0;

      const result = await executeQuery(query, {
        organizationId,
        email,
        passwordHash,
        salt,
        firstName,
        lastName,
        role,
        phoneNumber: phoneNumber || null,
        requiresPasswordChange,
        isEmailVerified
      });

      return result.recordset[0];
    } catch (err) {
      logger.error('Error creating user:', err);
      throw err;
    }
  }

  // Create pending user (for registration - requires admin approval)
  static async createPending(userData) {
    try {
      const { 
        organizationId, email, firstName, lastName, 
        role = 'voter', phoneNumber 
      } = userData;

      // Generate a temporary placeholder password (will be replaced on approval)
      const tempPassword = 'PendingApproval' + Date.now();
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      const query = `
        INSERT INTO Users (
          OrganizationID, Email, PasswordHash, Salt, FirstName, LastName,
          Role, PhoneNumber, IsActive, IsEmailVerified, RequiresPasswordChange
        )
        OUTPUT INSERTED.*
        VALUES (
          @organizationId, @email, @passwordHash, @salt, @firstName, @lastName,
          @role, @phoneNumber, 0, 0, 1
        )
      `;

      const result = await executeQuery(query, {
        organizationId,
        email,
        passwordHash,
        salt,
        firstName,
        lastName,
        role,
        phoneNumber: phoneNumber || null
      });

      return result.recordset[0];
    } catch (err) {
      logger.error('Error creating pending user:', err);
      throw err;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login
  static async updateLastLogin(userId) {
    try {
      const query = `
        UPDATE Users 
        SET LastLoginAt = GETDATE()
        WHERE UserID = @userId
      `;
      
      await executeQuery(query, { userId });
    } catch (err) {
      logger.error('Error updating last login:', err);
      throw err;
    }
  }

  // Update user profile
  static async updateProfile(userId, updates) {
    try {
      const allowedFields = ['FirstName', 'LastName', 'PhoneNumber', 'ProfilePictureURL'];
      const setClauses = [];
      const params = { userId };

      Object.keys(updates).forEach(key => {
        const dbField = key.charAt(0).toUpperCase() + key.slice(1);
        if (allowedFields.includes(dbField)) {
          setClauses.push(`${dbField} = @${key}`);
          params[key] = updates[key];
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      const updateQuery = `
        UPDATE Users
        SET ${setClauses.join(', ')}, UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `;

      await executeQuery(updateQuery, params);
      
      // Fetch updated user separately to avoid trigger conflict
      const selectQuery = `
        SELECT * FROM Users WHERE UserID = @userId
      `;
      const result = await executeQuery(selectQuery, { userId });
      return result.recordset[0];
    } catch (err) {
      logger.error('Error updating user profile:', err);
      throw err;
    }
  }

  // Get all users with optional filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          u.UserID, u.Email, u.FirstName, u.LastName, u.Role,
          u.IsActive, u.PhoneNumber, u.CreatedAt,
          o.Name AS OrganizationName
        FROM Users u
        INNER JOIN Organizations o ON u.OrganizationID = o.OrganizationID
        WHERE 1=1
      `;

      const params = {};

      if (filters.organizationId) {
        query += ' AND u.OrganizationID = @organizationId';
        params.organizationId = filters.organizationId;
      }

      if (filters.role) {
        query += ' AND u.Role = @role';
        params.role = filters.role;
      }

      if (filters.roles && filters.roles.length > 0) {
        // Handle multiple roles with IN clause
        const rolePlaceholders = filters.roles.map((_, i) => `@role${i}`).join(', ');
        query += ` AND u.Role IN (${rolePlaceholders})`;
        filters.roles.forEach((role, i) => {
          params[`role${i}`] = role;
        });
      }

      if (filters.isActive !== undefined) {
        query += ' AND u.IsActive = @isActive';
        params.isActive = filters.isActive;
      }

      query += ' ORDER BY u.CreatedAt DESC';

      const result = await executeQuery(query, params);
      return result.recordset;
    } catch (err) {
      logger.error('Error fetching all users:', err);
      throw err;
    }
  }

  // Change password
  static async changePassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      const query = `
        UPDATE Users
        SET PasswordHash = @passwordHash, Salt = @salt, UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `;

      await executeQuery(query, {
        userId,
        passwordHash,
        salt
      });

      return true;
    } catch (err) {
      logger.error('Error changing password:', err);
      throw err;
    }
  }

  // Verify email
  static async verifyEmail(userId) {
    try {
      const query = `
        UPDATE Users
        SET IsEmailVerified = 1, EmailVerificationToken = NULL, UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `;

      await executeQuery(query, { userId });
      return true;
    } catch (err) {
      logger.error('Error verifying email:', err);
      throw err;
    }
  }

  // Clear password change requirement
  static async clearPasswordChangeRequirement(userId) {
    try {
      const query = `
        UPDATE Users
        SET RequiresPasswordChange = 0
        WHERE UserID = @userId
      `;

      await executeQuery(query, { userId });
      logger.info(`Password change requirement cleared for user: ${userId}`);
      return true;
    } catch (err) {
      logger.error('Error clearing password change requirement:', err);
      throw err;
    }
  }

  // Delete user
  static async delete(userId) {
    try {
      // First, remove from SessionAdmins to avoid foreign key issues
      const deleteSessionAdmins = `
        DELETE FROM SessionAdmins
        WHERE UserID = @userId
      `;
      await executeQuery(deleteSessionAdmins, { userId });

      // Get current user info to check if they have an employee record
      const checkEmployee = `
        SELECT e.EmployeeID 
        FROM Employees e 
        WHERE e.UserID = @userId
      `;
      const employeeResult = await executeQuery(checkEmployee, { userId });
      const hasEmployee = employeeResult.recordset.length > 0;

      // Demote to 'user' role (or 'employee' if they have an employee record)
      // Keep email intact, keep account active
      const newRole = hasEmployee ? 'employee' : 'user';
      const query = `
        UPDATE Users
        SET Role = @newRole
        WHERE UserID = @userId
      `;

      await executeQuery(query, { userId, newRole });
      logger.info(`User demoted from admin/auditor to ${newRole}: UserID ${userId}`);
      return true;
    } catch (err) {
      logger.error('Error demoting user:', err);
      throw err;
    }
  }
}

module.exports = User;
