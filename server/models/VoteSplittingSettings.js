import database from '../config/database.js';

class VoteSplittingSettings {
  static async getSettings() {
    try {
      const sql = `
        SELECT setting_name, is_enabled, min_proxy_voters, max_proxy_voters, 
               min_individual_votes, max_individual_votes, created_at, updated_at
        FROM vote_splitting_settings 
        WHERE setting_name = 'proxy_vote_splitting'
      `;
      const result = await database.query(sql);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting vote splitting settings:', error);
      throw error;
    }
  }

  static async updateSettings(settingsData) {
    try {
      const { is_enabled, min_proxy_voters, max_proxy_voters, min_individual_votes, max_individual_votes } = settingsData;
      
      const sql = `
        UPDATE vote_splitting_settings 
        SET is_enabled = ${is_enabled ? 1 : 0},
            min_proxy_voters = ${min_proxy_voters},
            max_proxy_voters = ${max_proxy_voters},
            min_individual_votes = ${min_individual_votes},
            max_individual_votes = ${max_individual_votes},
            updated_at = GETDATE()
        WHERE setting_name = 'proxy_vote_splitting'
      `;
      
      await database.query(sql);
      return await this.getSettings();
    } catch (error) {
      console.error('Error updating vote splitting settings:', error);
      throw error;
    }
  }

  static async getProxyGroupLimits(proxyGroupId) {
    try {
      const sql = `
        SELECT pg.vote_splitting_enabled, pg.min_votes_per_user, pg.max_votes_per_user,
               COUNT(pgm.id) as total_members
        FROM proxy_groups pg
        LEFT JOIN proxy_group_members pgm ON pg.id = pgm.group_id
        WHERE pg.id = ${proxyGroupId}
        GROUP BY pg.id, pg.vote_splitting_enabled, pg.min_votes_per_user, pg.max_votes_per_user
      `;
      const result = await database.query(sql);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting proxy group limits:', error);
      throw error;
    }
  }

  static async updateProxyGroupLimits(proxyGroupId, limitsData) {
    try {
      const { vote_splitting_enabled, min_votes_per_user, max_votes_per_user } = limitsData;
      
      const sql = `
        UPDATE proxy_groups 
        SET vote_splitting_enabled = ${vote_splitting_enabled ? 1 : 0},
            min_votes_per_user = ${min_votes_per_user},
            max_votes_per_user = ${max_votes_per_user}
        WHERE id = ${proxyGroupId}
      `;
      
      await database.query(sql);
      return await this.getProxyGroupLimits(proxyGroupId);
    } catch (error) {
      console.error('Error updating proxy group limits:', error);
      throw error;
    }
  }

  static async getProxyVoterLimits(proxyGroupId) {
    try {
      const sql = `
        SELECT pvl.id, pvl.user_id, u.name, u.email, 
               pvl.max_votes_allowed, pvl.votes_used,
               (pvl.max_votes_allowed - pvl.votes_used) as remaining_votes
        FROM proxy_voter_limits pvl
        JOIN users u ON pvl.user_id = u.id
        WHERE pvl.proxy_group_id = ${proxyGroupId}
        ORDER BY u.name
      `;
      const result = await database.query(sql);
      return result;
    } catch (error) {
      console.error('Error getting proxy voter limits:', error);
      throw error;
    }
  }

  static async setProxyVoterLimits(proxyGroupId, voterLimits) {
    try {
      // First, delete existing limits for this group
      await database.query(`DELETE FROM proxy_voter_limits WHERE proxy_group_id = ${proxyGroupId}`);
      
      // Insert new limits
      for (const limit of voterLimits) {
        const sql = `
          INSERT INTO proxy_voter_limits (proxy_group_id, user_id, max_votes_allowed, votes_used)
          VALUES (${proxyGroupId}, ${limit.user_id}, ${limit.max_votes_allowed}, 0)
        `;
        await database.query(sql);
      }
      
      return await this.getProxyVoterLimits(proxyGroupId);
    } catch (error) {
      console.error('Error setting proxy voter limits:', error);
      throw error;
    }
  }

  static async distributeVote(voteId, distributions) {
    try {
      // First, clear any existing distributions for this vote
      await database.query(`DELETE FROM vote_distributions WHERE proxy_vote_id = ${voteId}`);
      
      // Insert new distributions
      for (const dist of distributions) {
        const sql = `
          INSERT INTO vote_distributions 
          (proxy_vote_id, distributed_to_user_id, vote_weight, vote_type, target_id)
          VALUES (${voteId}, ${dist.user_id}, ${dist.weight}, '${dist.vote_type}', ${dist.target_id})
        `;
        await database.query(sql);
      }
      
      // Update the proxy voter limits usage
      for (const dist of distributions) {
        const updateSql = `
          UPDATE proxy_voter_limits 
          SET votes_used = votes_used + ${dist.weight},
              updated_at = GETDATE()
          WHERE proxy_group_id = (SELECT group_id FROM votes WHERE id = ${voteId})
            AND user_id = ${dist.user_id}
        `;
        await database.query(updateSql);
      }
      
      return true;
    } catch (error) {
      console.error('Error distributing vote:', error);
      throw error;
    }
  }

  static async getVoteDistributions(voteId) {
    try {
      const sql = `
        SELECT vd.id, vd.distributed_to_user_id, u.name, u.email,
               vd.vote_weight, vd.vote_type, vd.target_id, vd.is_active
        FROM vote_distributions vd
        JOIN users u ON vd.distributed_to_user_id = u.id
        WHERE vd.proxy_vote_id = ${voteId} AND vd.is_active = 1
        ORDER BY u.name
      `;
      const result = await database.query(sql);
      return result;
    } catch (error) {
      console.error('Error getting vote distributions:', error);
      throw error;
    }
  }
}

export default VoteSplittingSettings;
