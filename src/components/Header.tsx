import React, { useState, useEffect } from 'react';
import { FolderPlus, LogOut, Vote, Shield, UserCheck, Sparkles, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VotingStatusBar from './VotingStatusBar';
import VotingTimerBar from './VotingTimerBar';
import { notificationService } from '../services/notificationService';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Listen for new notifications
      const handleNewNotification = () => loadNotifications();
      window.addEventListener('notificationCreated', handleNewNotification);
      
      return () => {
        window.removeEventListener('notificationCreated', handleNewNotification);
      };
    }
  }, [user]);

  const loadNotifications = () => {
    if (!user) return;
    const userNotifications = notificationService.getNotifications(user.email);
    setNotifications(userNotifications.slice(0, 5)); // Show last 5
    setUnreadCount(notificationService.getUnreadCount(user.email));
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(user!.email);
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
    <>
      {/* AGM Timer Bar - Shows globally when timer is active */}
      <VotingTimerBar />
      
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg sticky top-0 z-50"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left Section */}
            <motion.div 
              className="flex items-center space-x-3 flex-shrink-0 cursor-pointer"
              whileHover={{ scale: 1.05 }} 
              onClick={() => navigate('/home')}
            >
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Vote className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">WeVote</h1>
                <p className="text-xs text-blue-100">Professional Voting Platform</p>
              </div>
            </motion.div>

            {user && (
              <>
                {/* Right Section */}
                <div className="flex items-center space-x-2 md:space-x-4">
                  {/* Demo Features - Available to all users */}
                  {/* <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/demo')}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 p-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-bold hidden lg:block">🎉 See Features!</span>
                  </motion.button> */}

                  {/* Voting - Available to all authenticated users */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/voting')}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span className="text-sm font-medium hidden lg:block">Voting</span>
                  </motion.button>

                  {/* Proxy Assignment - Available to all authenticated users */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/proxy-assignment')}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span className="text-sm font-medium hidden lg:block">Proxy</span>
                  </motion.button>

                  {/* Admin Dashboard - Only for admin, super_admin */}
                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/admin')}
                      className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium hidden lg:block">Admin</span>
                    </motion.button>
                  )}

                  {/* Super Admin Dashboard - Only for super_admin */}
                  {user.role === 'super_admin' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/superadmin')}
                      className="bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 p-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium hidden lg:block">Super Admin</span>
                    </motion.button>
                  )}

                  {/* Auditor Portal - Only for auditor, super_admin */}
                  {(user.role === 'auditor' || user.role === 'super_admin') && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/auditor')}
                      className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium hidden lg:block">Auditor</span>
                    </motion.button>
                  )}

                  {/* Notification Bell */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm relative"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </motion.button>

                    {/* Notification Dropdown */}
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold">Notifications</h3>
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-white/90 hover:text-white underline"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>

                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>No notifications</p>
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <div
                                  key={notif.id}
                                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                                    !notif.read ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={() => handleMarkAsRead(notif.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-sm">
                                        {notif.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {notif.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {getTimeAgo(notif.createdAt)}
                                      </p>
                                    </div>
                                    {!notif.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {notifications.length > 0 && (
                            <div className="p-3 bg-gray-50 text-center">
                              <button
                                onClick={() => {
                                  setShowNotifications(false);
                                  navigate('/notifications');
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View All Notifications
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div 
                    className="flex items-center space-x-3 cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/profile')}
                    title="View Profile"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-blue-100 capitalize">{user.role}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center hover:bg-white/40 transition-all">
                      <span className="text-lg font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.header>
      
      {/* VotingStatusBar - Shows throughout the app when user is logged in */}
      {user && <VotingStatusBar />}
    </>
  );
};

export default Header;
