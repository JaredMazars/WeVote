// =====================================================
// VoteSplittingSettings Model
// Manages proxy voting and vote distribution settings
// =====================================================

const { getPool } = require('../config/database');
const logger = require('../config/logger');

class VoteSplittingSettings {
  /**
   * Get settings for an organization
   */
  static async getByOrganization(organizationId) {
    const pool = await getPool();
    
    const query = `
      SELECT 
        SettingID,
        OrganizationID,
        Enabled,
        MinProxyVoters,
        MaxProxyVoters,
        MinIndividualVotes,
        MaxIndividualVotes,
        UpdatedBy,
        CreatedAt,
        UpdatedAt
      FROM VoteSplittingSettings
      WHERE OrganizationID = @organizationId;
    `;
    
    const result = await pool.request()
      .input('organizationId', organizationId)
      .query(query);
    
    return result.recordset[0] || null;
  }

  /**
   * Create or update settings for an organization
   */
  static async upsert(organizationId, settings, userId) {
    const pool = await getPool();
    
    // Check if settings exist
    const existing = await this.getByOrganization(organizationId);
    
    if (existing) {
      // Update existing settings
      const query = `
        UPDATE VoteSplittingSettings
        SET 
          Enabled = @enabled,
          MinProxyVoters = @minProxyVoters,
          MaxProxyVoters = @maxProxyVoters,
          MinIndividualVotes = @minIndividualVotes,
          MaxIndividualVotes = @maxIndividualVotes,
          UpdatedBy = @userId,
          UpdatedAt = GETDATE()
        WHERE OrganizationID = @organizationId;
        
        SELECT * FROM VoteSplittingSettings
        WHERE OrganizationID = @organizationId;
      `;
      
      const result = await pool.request()
        .input('organizationId', organizationId)
        .input('enabled', settings.enabled ?? existing.Enabled)
        .input('minProxyVoters', settings.min_proxy_voters ?? existing.MinProxyVoters)
        .input('maxProxyVoters', settings.max_proxy_voters ?? existing.MaxProxyVoters)
        .input('minIndividualVotes', settings.min_individual_votes ?? existing.MinIndividualVotes)
        .input('maxIndividualVotes', settings.max_individual_votes ?? existing.MaxIndividualVotes)
        .input('userId', userId)
        .query(query);
      
      logger.info(`Vote splitting settings updated for organization ${organizationId} by user ${userId}`);
      return result.recordset[0];
    } else {
      // Create new settings
      const query = `
        INSERT INTO VoteSplittingSettings (
          OrganizationID,
          Enabled,
          MinProxyVoters,
          MaxProxyVoters,
          MinIndividualVotes,
          MaxIndividualVotes,
          UpdatedBy
        )
        VALUES (
          @organizationId,
          @enabled,
          @minProxyVoters,
          @maxProxyVoters,
          @minIndividualVotes,
          @maxIndividualVotes,
          @userId
        );
        
        SELECT * FROM VoteSplittingSettings
        WHERE SettingID = SCOPE_IDENTITY();
      `;
      
      const result = await pool.request()
        .input('organizationId', organizationId)
        .input('enabled', settings.enabled ?? false)
        .input('minProxyVoters', settings.min_proxy_voters ?? 1)
        .input('maxProxyVoters', settings.max_proxy_voters ?? 10)
        .input('minIndividualVotes', settings.min_individual_votes ?? 1)
        .input('maxIndividualVotes', settings.max_individual_votes ?? 5)
        .input('userId', userId)
        .query(query);
      
      logger.info(`Vote splitting settings created for organization ${organizationId} by user ${userId}`);
      return result.recordset[0];
    }
  }

  /**
   * Delete settings for an organization
   */
  static async delete(organizationId) {
    const pool = await getPool();
    
    const query = `
      DELETE FROM VoteSplittingSettings
      WHERE OrganizationID = @organizationId;
    `;
    
    await pool.request()
      .input('organizationId', organizationId)
      .query(query);
    
    logger.info(`Vote splitting settings deleted for organization ${organizationId}`);
    return true;
  }
}

module.exports = VoteSplittingSettings;
