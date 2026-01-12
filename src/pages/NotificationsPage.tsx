import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = () => {
    if (!user) return;
    const allNotifications = notificationService.getNotifications(user.email);
    setNotifications(allNotifications);
    setStats({
      total: allNotifications.length,
      unread: notificationService.getUnreadCount(user.email),
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(user!.email);
    loadNotifications();
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
    loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      vote_cast: '🗳️',
      vote_verified: '✅',
      proxy_assigned: '👥',
      proxy_revoked: '🚫',
      meeting_reminder: '📅',
      meeting_started: '▶️',
      qa_answered: '💬',
      resolution_published: '📄',
      document_uploaded: '📁',
      system_alert: '⚠️',
      security_alert: '🔐',
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🔔 Notifications
          </h1>
          <p className="text-slate-600">
            Stay updated with all your voting activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <p className="text-sm text-slate-600 mb-1">Total Notifications</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <p className="text-sm text-slate-600 mb-1">Unread</p>
            <p className="text-3xl font-bold text-red-600">{stats.unread}</p>
          </motion.div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Unread ({stats.unread})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Read ({stats.total - stats.unread})
              </button>
            </div>

            {stats.unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                ✓ Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <span className="text-6xl">🔔</span>
              <p className="text-slate-500 mt-4">No notifications to show</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow ${
                  !notif.read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{getNotificationIcon(notif.type)}</span>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {notif.title}
                          {!notif.read && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              NEW
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        notif.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : notif.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : notif.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {notif.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-xs text-slate-400">
                        {getTimeAgo(notif.createdAt)}
                      </span>

                      <div className="flex gap-2">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {notif.actionUrl && (
                      <button
                        onClick={() => window.location.href = notif.actionUrl}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {notif.actionText || 'View'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
