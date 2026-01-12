/**
 * Notification Center Service
 * In-app notifications with real-time updates
 */

export type NotificationType =
  | 'vote_cast'
  | 'vote_verified'
  | 'proxy_assigned'
  | 'proxy_revoked'
  | 'meeting_reminder'
  | 'meeting_started'
  | 'qa_answered'
  | 'resolution_published'
  | 'document_uploaded'
  | 'system_alert'
  | 'security_alert';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  icon?: string;
  data?: Record<string, any>;
}

class NotificationService {
  private readonly STORAGE_KEY = 'notifications';
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  /**
   * Get all notifications for user
   */
  getNotifications(userId: string): Notification[] {
    const allNotifications = this.getAllNotifications();
    return allNotifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter(n => !n.read).length;
  }

  /**
   * Create notification
   */
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      actionLabel?: string;
      priority?: Notification['priority'];
      data?: Record<string, any>;
    }
  ): Notification {
    const notification: Notification = {
      id: this.generateId(),
      userId,
      type,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      read: false,
      createdAt: new Date().toISOString(),
      priority: options?.priority || 'medium',
      icon: this.getIconForType(type),
      data: options?.data,
    };

    const notifications = this.getAllNotifications();
    notifications.push(notification);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));

    // Notify listeners
    this.notifyListeners(userId);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('notificationCreated', { detail: notification }));

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);

    return notification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notifications = this.getAllNotifications();
    const notification = notifications.find(n => n.id === notificationId);

    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));

      this.notifyListeners(notification.userId);
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(userId: string): void {
    const notifications = this.getAllNotifications();
    let updated = false;

    notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        n.readAt = new Date().toISOString();
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
      this.notifyListeners(userId);
    }
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): void {
    const notifications = this.getAllNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);

    if (filteredNotifications.length < notifications.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredNotifications));
      if (notification) {
        this.notifyListeners(notification.userId);
      }
    }
  }

  /**
   * Clear all notifications for user
   */
  clearAll(userId: string): void {
    const notifications = this.getAllNotifications();
    const filteredNotifications = notifications.filter(n => n.userId !== userId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredNotifications));
    this.notifyListeners(userId);
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(userId: string, callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current notifications
    callback(this.getNotifications(userId));

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get notification statistics
   */
  getStats(userId: string): {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<string, number>;
    todayCount: number;
  } {
    const notifications = this.getNotifications(userId);
    const today = new Date().setHours(0, 0, 0, 0);

    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
      todayCount: 0,
    };

    notifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      stats.byPriority[n.priority]++;
      
      if (new Date(n.createdAt).getTime() >= today) {
        stats.todayCount++;
      }
    });

    return stats;
  }

  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: Notification): void {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
    };

    const browserNotification = new Notification(notification.title, options);

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(userId: string): void {
    const notifications = this.getNotifications(userId);
    this.listeners.forEach(callback => callback(notifications));
  }

  /**
   * Get icon for notification type
   */
  private getIconForType(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      vote_cast: '🗳️',
      vote_verified: '✅',
      proxy_assigned: '👤',
      proxy_revoked: '🚫',
      meeting_reminder: '📅',
      meeting_started: '▶️',
      qa_answered: '💬',
      resolution_published: '📄',
      document_uploaded: '📁',
      system_alert: 'ℹ️',
      security_alert: '⚠️',
    };
    return icons[type] || 'ℹ️';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get all notifications
   */
  private getAllNotifications(): Notification[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const dummyNotifications = this.getDummyNotifications();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dummyNotifications));
      return dummyNotifications;
    }
    return JSON.parse(data);
  }

  /**
   * Get dummy notifications
   */
  private getDummyNotifications(): Notification[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'NOTIF-001',
        userId: 'USR-001',
        type: 'vote_cast',
        title: 'Vote Successfully Cast',
        message: 'Your vote for Sarah Johnson has been recorded and verified on the blockchain.',
        actionUrl: '/verify',
        actionLabel: 'View Certificate',
        read: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        priority: 'high',
        icon: '🗳️',
      },
      {
        id: 'NOTIF-002',
        userId: 'USR-001',
        type: 'meeting_reminder',
        title: 'AGM Tomorrow',
        message: 'Annual General Meeting 2025 starts tomorrow at 2:00 PM. Don\'t forget to review the agenda.',
        actionUrl: '/meetings',
        actionLabel: 'View Meeting',
        read: false,
        createdAt: yesterday.toISOString(),
        priority: 'medium',
        icon: '📅',
      },
      {
        id: 'NOTIF-003',
        userId: 'USR-001',
        type: 'qa_answered',
        title: 'Your Question Answered',
        message: 'The board has answered your question about revenue projections.',
        actionUrl: '/qa',
        actionLabel: 'View Answer',
        read: true,
        createdAt: twoDaysAgo.toISOString(),
        readAt: yesterday.toISOString(),
        priority: 'medium',
        icon: '💬',
      },
      {
        id: 'NOTIF-004',
        userId: 'USR-001',
        type: 'document_uploaded',
        title: 'New Document Available',
        message: 'Financial Report Q4 2024.pdf has been uploaded.',
        actionUrl: '/documents',
        actionLabel: 'View Documents',
        read: true,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        readAt: twoDaysAgo.toISOString(),
        priority: 'low',
        icon: '📁',
      },
    ];
  }
}

export const notificationService = new NotificationService();
