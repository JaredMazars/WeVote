// =====================================================
// Notification Model
// Handles in-app notifications for users
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Notification {
  // Create notification
  static async create(notificationData) {
    try {
      const query = `
        INSERT INTO Notifications (
          UserID, Title, Message, Type
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId, @title, @message, @type
        )
      `;

      const params = {
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info'
      };

      const result = await executeQuery(query, params);
      logger.info(`Notification created for user ${notificationData.userId}`);
      return result.recordset[0];
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, options = {}) {
    try {
      const { unreadOnly = false, limit = 50, offset = 0 } = options;

      let query = `
        SELECT *
        FROM Notifications
        WHERE UserID = @userId
      `;

      if (unreadOnly) {
        query += ` AND IsRead = 0`;
      }

      query += `
        ORDER BY CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const result = await executeQuery(query, { userId, limit, offset });
      return result.recordset;
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) AS UnreadCount
        FROM Notifications
        WHERE UserID = @userId
        AND IsRead = 0
      `;

      const result = await executeQuery(query, { userId });
      return result.recordset[0].UnreadCount;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark as read
  static async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE Notifications
        SET IsRead = 1, ReadAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE NotificationID = @notificationId
        AND UserID = @userId
      `;

      const result = await executeQuery(query, { notificationId, userId });
      
      if (result.recordset.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE Notifications
        SET IsRead = 1, ReadAt = GETDATE()
        WHERE UserID = @userId
        AND IsRead = 0
      `;

      await executeQuery(query, { userId });
      logger.info(`All notifications marked as read for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async delete(notificationId, userId) {
    try {
      const query = `
        DELETE FROM Notifications
        WHERE NotificationID = @notificationId
        AND UserID = @userId
      `;

      const result = await executeQuery(query, { notificationId, userId });
      
      if (result.rowsAffected[0] === 0) {
        throw new Error('Notification not found or access denied');
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all read notifications
  static async deleteAllRead(userId) {
    try {
      const query = `
        DELETE FROM Notifications
        WHERE UserID = @userId
        AND IsRead = 1
      `;

      const result = await executeQuery(query, { userId });
      
      return { 
        success: true, 
        deletedCount: result.rowsAffected[0] 
      };
    } catch (error) {
      logger.error('Error deleting read notifications:', error);
      throw error;
    }
  }

  // Create bulk notifications
  static async createBulk(userIds, notificationData) {
    try {
      const notifications = userIds.map(userId => ({
        ...notificationData,
        userId
      }));

      const promises = notifications.map(n => this.create(n));
      await Promise.all(promises);

      logger.info(`Bulk notifications created for ${userIds.length} users`);
      return { success: true, count: userIds.length };
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOld() {
    try {
      const query = `
        DELETE FROM Notifications
        WHERE CreatedAt < DATEADD(day, -30, GETDATE())
        AND IsRead = 1
      `;

      const result = await executeQuery(query);
      
      logger.info(`Cleaned up ${result.rowsAffected[0]} old notifications`);
      return { success: true, deletedCount: result.rowsAffected[0] };
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = Notification;
