// =====================================================
// Organization Model
// Handles all database operations for organizations
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Organization {
  // Get all organizations
  static async findAll() {
    try {
      const query = `
        SELECT 
          o.*,
          (SELECT COUNT(*) FROM Users WHERE OrganizationID = o.OrganizationID) as TotalUsers,
          (SELECT COUNT(*) FROM Employees WHERE OrganizationID = o.OrganizationID) as TotalEmployees,
          (SELECT COUNT(*) FROM AGMSessions WHERE OrganizationID = o.OrganizationID) as TotalSessions
        FROM Organizations o
        WHERE o.IsActive = 1
        ORDER BY o.OrganizationName
      `;

      const result = await executeQuery(query);
      return result.recordset;
    } catch (error) {
      logger.error('Error in Organization.findAll:', error);
      throw error;
    }
  }

  // Get single organization by ID
  static async findById(organizationId) {
    try {
      const query = `
        SELECT 
          o.*,
          (SELECT COUNT(*) FROM Users WHERE OrganizationID = o.OrganizationID) as TotalUsers,
          (SELECT COUNT(*) FROM Employees WHERE OrganizationID = o.OrganizationID) as TotalEmployees,
          (SELECT COUNT(*) FROM AGMSessions WHERE OrganizationID = o.OrganizationID) as TotalSessions,
          (SELECT COUNT(*) FROM Departments WHERE OrganizationID = o.OrganizationID) as TotalDepartments
        FROM Organizations o
        WHERE o.OrganizationID = @organizationId
      `;

      const result = await executeQuery(query, { organizationId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Organization.findById:', error);
      throw error;
    }
  }

  // Create new organization
  static async create(orgData) {
    try {
      const query = `
        INSERT INTO Organizations (
          OrganizationName, OrganizationType, Industry,
          Address, City, State, PostalCode, Country,
          PhoneNumber, Email, Website, LogoURL,
          TaxID, IsActive
        )
        OUTPUT INSERTED.*
        VALUES (
          @name, @type, @industry,
          @address, @city, @state, @postalCode, @country,
          @phoneNumber, @email, @website, @logoURL,
          @taxID, 1
        )
      `;

      const params = {
        name: orgData.name,
        type: orgData.type || 'corporate',
        industry: orgData.industry || null,
        address: orgData.address || null,
        city: orgData.city || null,
        state: orgData.state || null,
        postalCode: orgData.postalCode || null,
        country: orgData.country || null,
        phoneNumber: orgData.phoneNumber || null,
        email: orgData.email || null,
        website: orgData.website || null,
        logoURL: orgData.logoURL || null,
        taxID: orgData.taxID || null
      };

      const result = await executeQuery(query, params);
      const newOrg = result.recordset[0];

      logger.info(`Organization created: ${newOrg.OrganizationName} (ID: ${newOrg.OrganizationID})`);
      return newOrg;
    } catch (error) {
      logger.error('Error in Organization.create:', error);
      throw error;
    }
  }

  // Update organization
  static async update(organizationId, updates) {
    try {
      const allowedUpdates = [
        'OrganizationName', 'OrganizationType', 'Industry',
        'Address', 'City', 'State', 'PostalCode', 'Country',
        'PhoneNumber', 'Email', 'Website', 'LogoURL', 'TaxID', 'IsActive'
      ];

      const setClauses = [];
      const params = { organizationId };

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
        UPDATE Organizations
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE OrganizationID = @organizationId
      `;

      const result = await executeQuery(query, params);
      const updatedOrg = result.recordset[0];

      logger.info(`Organization updated: ID ${organizationId}`);
      return updatedOrg;
    } catch (error) {
      logger.error('Error in Organization.update:', error);
      throw error;
    }
  }

  // Delete organization
  static async delete(organizationId) {
    try {
      // Check for related records
      const checkQuery = `
        SELECT 
          (SELECT COUNT(*) FROM Users WHERE OrganizationID = @organizationId) as UserCount,
          (SELECT COUNT(*) FROM AGMSessions WHERE OrganizationID = @organizationId) as SessionCount
      `;

      const checkResult = await executeQuery(checkQuery, { organizationId });
      const counts = checkResult.recordset[0];

      if (counts.UserCount > 0 || counts.SessionCount > 0) {
        throw new Error('Cannot delete organization with existing users or sessions');
      }

      const query = 'DELETE FROM Organizations WHERE OrganizationID = @organizationId';
      await executeQuery(query, { organizationId });

      logger.info(`Organization deleted: ID ${organizationId}`);
      return { message: 'Organization deleted successfully' };
    } catch (error) {
      logger.error('Error in Organization.delete:', error);
      throw error;
    }
  }
}

module.exports = Organization;
