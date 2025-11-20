import database from '../config/database.js';

class TempVote {
  static async castTempVote(voteData) {
    const { voter_id, vote_type, target_id, comment, is_anonymous, ip_address, user_agent } = voteData;

    try {
      // Check if user has already voted (in both temp and final tables)
      const hasVoted = await this.hasUserVoted(voter_id, vote_type, target_id);
      if (hasVoted) {
        throw new Error('User has already voted for this item');
      }

      // Determine which column to use based on vote type
      const targetColumn = vote_type === 'employee' ? 'employee_id' : 'resolution_id';
      
      const sql = `
        INSERT INTO temp_votes (
          voter_id, vote_type, ${targetColumn}, comment, 
          is_anonymous, ip_address, user_agent, created_at, created_by
        )
        VALUES (
          ${voter_id}, 
          '${vote_type}', 
          ${target_id}, 
          ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'}, 
          ${is_anonymous ? 1 : 0}, 
          '${ip_address || ''}', 
          '${user_agent || ''}', 
          GETDATE(),
          'web_user'
        )
      `;
      
      await database.query(sql);

      // Get the temp vote ID
      const getIdSql = `SELECT SCOPE_IDENTITY() as id`;
      const idResult = await database.query(getIdSql);
      
      return idResult[0].id;
    } catch (error) {
      console.error('Error casting temp vote:', error);
      throw error;
    }
  }

  static async hasUserVoted(userId, voteType, targetId) {
    try {
      const targetColumn = voteType === 'employee' ? 'employee_id' : 'resolution_id';
      
      // Check both temp_votes and final votes tables
      const tempVoteSql = `
        SELECT COUNT(*) as count
        FROM temp_votes
        WHERE voter_id = ${userId}
        AND vote_type = '${voteType}'
        AND ${targetColumn} = ${targetId}
        AND is_migrated = 0
      `;
      
      const finalVoteSql = `
        SELECT COUNT(*) as count
        FROM votes
        WHERE voter_id = ${userId}
        AND vote_type = '${voteType}'
        AND ${targetColumn} = ${targetId}
      `;
      
      const [tempResult, finalResult] = await Promise.all([
        database.query(tempVoteSql),
        database.query(finalVoteSql)
      ]);
      
      return (tempResult[0].count > 0) || (finalResult[0].count > 0);
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  static async getUserTempVotes(userId) {
    const sql = `
      SELECT tv.id, tv.vote_type, tv.created_at, tv.comment, tv.is_migrated,
             tv.migration_status, tv.scheduled_migration_at, tv.temp_vote_expires_at,
             CASE 
               WHEN tv.vote_type = 'employee' THEN u.name
               WHEN tv.vote_type = 'resolution' THEN r.title
               ELSE 'Unknown'
             END as target_name,
             CASE 
               WHEN tv.vote_type = 'employee' THEN tv.employee_id
               WHEN tv.vote_type = 'resolution' THEN tv.resolution_id
               ELSE NULL
             END as target_id,
             dbo.fn_can_modify_temp_vote(tv.id) as can_modify
      FROM temp_votes tv
      LEFT JOIN employees e ON tv.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN resolutions r ON tv.resolution_id = r.id
      WHERE tv.voter_id = ${userId}
      ORDER BY tv.created_at DESC
    `;
    return await database.query(sql);
  }

  static async updateTempVote(tempVoteId, userId, updateData) {
    try {
      // Check if user can modify this vote
      const canModifySql = `
        SELECT dbo.fn_can_modify_temp_vote(${tempVoteId}) as can_modify,
               voter_id
        FROM temp_votes 
        WHERE id = ${tempVoteId}
      `;
      
      const result = await database.query(canModifySql);
      if (!result || result.length === 0) {
        throw new Error('Temp vote not found');
      }
      
      if (result[0].voter_id !== userId) {
        throw new Error('Unauthorized: Cannot modify another user\'s vote');
      }
      
      if (!result[0].can_modify) {
        throw new Error('Vote can no longer be modified (migration period has started)');
      }

      // Update the temp vote
      const { comment } = updateData;
      const updateSql = `
        UPDATE temp_votes
        SET comment = ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
            updated_at = GETDATE()
        WHERE id = ${tempVoteId}
        AND voter_id = ${userId}
      `;
      
      await database.query(updateSql);
      return true;
    } catch (error) {
      console.error('Error updating temp vote:', error);
      throw error;
    }
  }

  static async deleteTempVote(tempVoteId, userId) {
    try {
      // Check if user can modify this vote
      const canModifySql = `
        SELECT dbo.fn_can_modify_temp_vote(${tempVoteId}) as can_modify,
               voter_id
        FROM temp_votes 
        WHERE id = ${tempVoteId}
      `;
      
      const result = await database.query(canModifySql);
      if (!result || result.length === 0) {
        throw new Error('Temp vote not found');
      }
      
      if (result[0].voter_id !== userId) {
        throw new Error('Unauthorized: Cannot delete another user\'s vote');
      }
      
      if (!result[0].can_modify) {
        throw new Error('Vote can no longer be deleted (migration period has started)');
      }

      // Delete the temp vote
      const deleteSql = `
        DELETE FROM temp_votes
        WHERE id = ${tempVoteId}
        AND voter_id = ${userId}
      `;
      
      await database.query(deleteSql);
      return true;
    } catch (error) {
      console.error('Error deleting temp vote:', error);
      throw error;
    }
  }

  static async getTempVoteStats() {
    const sql = `SELECT * FROM vw_temp_vote_stats`;
    const results = await database.query(sql);
    return results[0];
  }

  static async getVoteSettings() {
    const sql = `
      SELECT setting_name, setting_value, setting_type, description
      FROM vote_settings
      WHERE is_active = 1
      ORDER BY setting_name
    `;
    return await database.query(sql);
  }

  static async updateVoteSetting(settingName, settingValue, updatedBy = 'system') {
    const sql = `
      UPDATE vote_settings
      SET setting_value = '${settingValue.replace(/'/g, "''")}',
          updated_at = GETDATE(),
          updated_by = '${updatedBy}'
      WHERE setting_name = '${settingName}'
      AND is_active = 1
    `;
    
    await database.query(sql);
    return true;
  }

  static async migrateTempVotes(batchSize = 100, forceMigration = false) {
    try {
      const sql = `
        EXEC sp_migrate_temp_votes 
        @batch_size = ${batchSize}, 
        @force_migration = ${forceMigration ? 1 : 0}
      `;
      
      const results = await database.query(sql);
      return results[0];
    } catch (error) {
      console.error('Error migrating temp votes:', error);
      throw error;
    }
  }

  static async cleanupTempVotes(daysToKeep = 7) {
    try {
      const sql = `EXEC sp_cleanup_temp_votes @days_to_keep = ${daysToKeep}`;
      const results = await database.query(sql);
      return results[0];
    } catch (error) {
      console.error('Error cleaning up temp votes:', error);
      throw error;
    }
  }

  static async getMigrationLogs(limit = 100) {
    const sql = `
      SELECT TOP (${limit}) 
        vml.id, vml.temp_vote_id, vml.final_vote_id, vml.migration_status,
        vml.migration_started_at, vml.migration_completed_at, vml.error_message,
        vml.migration_method, vml.processed_by, vml.batch_id,
        u.name as voter_name, tv.vote_type
      FROM vote_migration_logs vml
      LEFT JOIN temp_votes tv ON vml.temp_vote_id = tv.id
      LEFT JOIN users u ON tv.voter_id = u.id
      ORDER BY vml.migration_started_at DESC
    `;
    
    return await database.query(sql);
  }
}

export default TempVote;