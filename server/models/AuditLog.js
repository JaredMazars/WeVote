import sql from 'mssql';
import database from '../config/database.js';

/**
 * AuditLog Model
 * Tracks all major actions in the system
 * 
 * Action Categories:
 * - AUTH: login, logout, password_change, forgot_password, failed_login
 * - VOTE: vote_cast, vote_removed, vote_edited, proxy_vote_cast, proxy_vote_removed, split_vote_cast
 * - PROXY: proxy_assigned, proxy_revoked, proxy_group_created, proxy_group_updated
 * - ADMIN: user_created, user_updated, user_deleted, employee_created, employee_updated
 * - RESOLUTION: resolution_created, resolution_updated, resolution_deleted
 * - TIMER: agm_timer_started, agm_timer_stopped, agm_timer_updated
 * - SYSTEM: data_export, settings_changed, bulk_action
 */

class AuditLog {
  /**
   * Create an audit log entry
   * @param {Object} logData - The audit log data
   * @param {string} logData.user_id - ID of user performing action
   * @param {string} logData.action_type - Type of action (e.g., 'vote_cast', 'login')
   * @param {string} logData.action_category - Category (AUTH, VOTE, PROXY, ADMIN, etc.)
   * @param {string} logData.description - Human-readable description
   * @param {string} logData.entity_type - Type of entity affected (employee, resolution, user, etc.)
   * @param {string} logData.entity_id - ID of affected entity
   * @param {Object} logData.metadata - Additional data (JSON)
   * @param {string} logData.ip_address - IP address of request
   * @param {string} logData.user_agent - Browser/client info
   * @param {string} logData.status - success, failure, warning
   */
  static async create(logData) {
    try {
      const pool = await database.getPool();
      
      const result = await pool.request()
        .input('user_id', sql.NVarChar, logData.user_id || null)
        .input('action_type', sql.NVarChar, logData.action_type)
        .input('action_category', sql.NVarChar, logData.action_category)
        .input('description', sql.NVarChar, logData.description)
        .input('entity_type', sql.NVarChar, logData.entity_type || null)
        .input('entity_id', sql.NVarChar, logData.entity_id || null)
        .input('metadata', sql.NVarChar, JSON.stringify(logData.metadata || {}))
        .input('ip_address', sql.NVarChar, logData.ip_address || null)
        .input('user_agent', sql.NVarChar, logData.user_agent || null)
        .input('status', sql.NVarChar, logData.status || 'success')
        .query(`
          INSERT INTO audit_logs (
            user_id, action_type, action_category, description,
            entity_type, entity_id, metadata, ip_address, user_agent, status, created_at
          )
          VALUES (
            @user_id, @action_type, @action_category, @description,
            @entity_type, @entity_id, @metadata, @ip_address, @user_agent, @status, GETDATE()
          )
        `);

      return { success: true };
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error - logging failures shouldn't break the app
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all audit logs with filtering and pagination
   */
  static async getAll(filters = {}) {
    try {
      console.log('🔍 [AUDITLOG-MODEL] Starting getAll with filters:', filters);
      
      const pool = await database.getPool();
      console.log('✅ [AUDITLOG-MODEL] Database pool acquired');
      
      const {
        page = 1,
        limit = 50,
        user_id,
        action_category,
        action_type,
        status,
        start_date,
        end_date,
        search
      } = filters;

      const offset = (page - 1) * limit;
      console.log(`📊 [AUDITLOG-MODEL] Pagination - page: ${page}, limit: ${limit}, offset: ${offset}`);

      let whereClause = 'WHERE 1=1';
      const request = pool.request();

      if (user_id) {
        whereClause += ' AND al.user_id = @user_id';
        request.input('user_id', sql.NVarChar, user_id);
        console.log(`🎯 [AUDITLOG-MODEL] Filter by user_id: ${user_id}`);
      }

      if (action_category) {
        whereClause += ' AND al.action_category = @action_category';
        request.input('action_category', sql.NVarChar, action_category);
        console.log(`🏷️ [AUDITLOG-MODEL] Filter by action_category: ${action_category}`);
      }

      if (action_type) {
        whereClause += ' AND al.action_type = @action_type';
        request.input('action_type', sql.NVarChar, action_type);
        console.log(`🔧 [AUDITLOG-MODEL] Filter by action_type: ${action_type}`);
      }

      if (status) {
        whereClause += ' AND al.status = @status';
        request.input('status', sql.NVarChar, status);
        console.log(`📈 [AUDITLOG-MODEL] Filter by status: ${status}`);
      }

      if (start_date) {
        whereClause += ' AND al.created_at >= @start_date';
        request.input('start_date', sql.DateTime, new Date(start_date));
        console.log(`📅 [AUDITLOG-MODEL] Filter by start_date: ${start_date}`);
      }

      if (end_date) {
        whereClause += ' AND al.created_at <= @end_date';
        request.input('end_date', sql.DateTime, new Date(end_date));
        console.log(`📅 [AUDITLOG-MODEL] Filter by end_date: ${end_date}`);
      }

      if (search) {
        whereClause += ' AND (al.description LIKE @search OR u.name LIKE @search OR u.email LIKE @search)';
        request.input('search', sql.NVarChar, `%${search}%`);
        console.log(`🔍 [AUDITLOG-MODEL] Filter by search: ${search}`);
      }

      request.input('limit', sql.Int, limit);
      request.input('offset', sql.Int, offset);

      console.log(`📋 [AUDITLOG-MODEL] Final WHERE clause: ${whereClause}`);
      console.log('🚀 [AUDITLOG-MODEL] Executing main query...');

      const result = await request.query(`
        SELECT 
          al.id,
          al.user_id,
          u.name as user_name,
          u.email as user_email,
          al.action_type,
          al.action_category,
          al.description,
          al.entity_type,
          al.entity_id,
          al.metadata,
          al.ip_address,
          al.user_agent,
          al.status,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users u ON TRY_CAST(al.user_id AS INT) = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

      console.log(`✅ [AUDITLOG-MODEL] Main query executed, found ${result.recordset.length} records`);

      // Get total count
      console.log('🔢 [AUDITLOG-MODEL] Executing count query...');
      const countResult = await pool.request()
        .input('user_id', sql.NVarChar, user_id || null)
        .input('action_category', sql.NVarChar, action_category || null)
        .input('action_type', sql.NVarChar, action_type || null)
        .input('status', sql.NVarChar, status || null)
        .input('start_date', sql.DateTime, start_date ? new Date(start_date) : null)
        .input('end_date', sql.DateTime, end_date ? new Date(end_date) : null)
        .input('search', sql.NVarChar, search ? `%${search}%` : null)
        .query(`
          SELECT COUNT(*) as total
          FROM audit_logs al
          LEFT JOIN users u ON TRY_CAST(al.user_id AS INT) = u.id
          ${whereClause}
        `);

      const total = countResult.recordset[0].total;
      console.log(`🔢 [AUDITLOG-MODEL] Total count: ${total}`);

      return {
        success: true,
        data: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('💥 [AUDITLOG-MODEL] Error in getAll:', error);
      console.error('💥 [AUDITLOG-MODEL] Error stack:', error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStats(filters = {}) {
    try {
      const pool = await database.getPool();
      const { start_date, end_date } = filters;

      let whereClause = 'WHERE 1=1';
      const request = pool.request();

      if (start_date) {
        whereClause += ' AND created_at >= @start_date';
        request.input('start_date', sql.DateTime, new Date(start_date));
      }

      if (end_date) {
        whereClause += ' AND created_at <= @end_date';
        request.input('end_date', sql.DateTime, new Date(end_date));
      }

      // Get category breakdown
      const categoryStats = await request.query(`
        SELECT 
          action_category,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count
        FROM audit_logs
        ${whereClause}
        GROUP BY action_category
        ORDER BY count DESC
      `);

      // Get top users by activity
      const topUsers = await pool.request()
        .input('start_date', sql.DateTime, start_date ? new Date(start_date) : null)
        .input('end_date', sql.DateTime, end_date ? new Date(end_date) : null)
        .query(`
          SELECT TOP 10
            al.user_id,
            u.name,
            u.email,
            COUNT(*) as action_count
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.id
          ${whereClause}
          GROUP BY al.user_id, u.name, u.email
          ORDER BY action_count DESC
        `);

      // Get daily activity
      const dailyActivity = await pool.request()
        .input('start_date', sql.DateTime, start_date ? new Date(start_date) : null)
        .input('end_date', sql.DateTime, end_date ? new Date(end_date) : null)
        .query(`
          SELECT 
            CAST(created_at AS DATE) as date,
            COUNT(*) as count
          FROM audit_logs
          ${whereClause}
          GROUP BY CAST(created_at AS DATE)
          ORDER BY date DESC
        `);

      return {
        success: true,
        data: {
          categoryStats: categoryStats.recordset,
          topUsers: topUsers.recordset,
          dailyActivity: dailyActivity.recordset
        }
      };
    } catch (error) {
      console.error('Error fetching audit log stats:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get logs for a specific user
   */
  static async getByUserId(userId, limit = 50) {
    try {
      const pool = await database.getPool();
      
      const result = await pool.request()
        .input('user_id', sql.NVarChar, userId)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit)
            id, action_type, action_category, description,
            entity_type, entity_id, metadata, ip_address,
            status, created_at
          FROM audit_logs
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);

      return { success: true, data: result.recordset };
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get logs for a specific entity
   */
  static async getByEntity(entityType, entityId, limit = 50) {
    try {
      const pool = await database.getPool();
      
      const result = await pool.request()
        .input('entity_type', sql.NVarChar, entityType)
        .input('entity_id', sql.NVarChar, entityId)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit)
            al.id,
            al.user_id,
            u.name as user_name,
            u.email as user_email,
            al.action_type,
            al.action_category,
            al.description,
            al.metadata,
            al.status,
            al.created_at
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.id
          WHERE al.entity_type = @entity_type AND al.entity_id = @entity_id
          ORDER BY al.created_at DESC
        `);

      return { success: true, data: result.recordset };
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      return { success: false, message: error.message };
    }
  }
}

export default AuditLog;

