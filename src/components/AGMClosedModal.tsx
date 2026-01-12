import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, AlertTriangle, ShieldAlert, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface AGMSession {
  SessionID: number;
  Title: string;
  Status: 'scheduled' | 'in_progress' | 'completed';
  ScheduledStartTime: string;
  ScheduledEndTime: string;
  ActualEndTime?: string;
}

interface AGMClosedModalProps {
  onClose?: () => void;
}

const AGMClosedModal: React.FC<AGMClosedModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agmSession, setAgmSession] = useState<AGMSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAGMStatus();
  }, []);

  const checkAGMStatus = async () => {
    try {
      // Check for active session
      const response = await api.get('/sessions?status=in_progress');
      const sessions = (response.data as any)?.sessions || [];
      
      if (sessions.length === 0) {
        // No active session, check for completed
        const completedResponse = await api.get('/sessions?status=completed');
        const completedSessions = (completedResponse.data as any)?.sessions || [];
        
        if (completedSessions.length > 0) {
          setAgmSession(completedSessions[0]);
        }
      } else {
        setAgmSession(null); // Session is active, don't show modal
      }
    } catch (error) {
      console.error('Error checking AGM status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    if (onClose) onClose();
    navigate('/home');
  };

  if (loading) return null;

  // Don't show modal if there's an active session or user is auditor
  if (!agmSession || agmSession.Status === 'in_progress') return null;

  // For auditors, don't block - they can still see data
  if (user?.role === 'auditor') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-white rounded-3xl max-w-2xl w-full p-10 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="bg-red-100 p-6 rounded-full">
              <XCircle className="h-20 w-20 text-red-600" />
            </div>

            {/* Title */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                AGM Session Closed
              </h2>
              <p className="text-xl text-gray-600">
                {agmSession.Title}
              </p>
            </div>

            {/* Message */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 w-full">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-2">Voting is Currently Unavailable</h3>
                  <p className="text-gray-700 mb-3">
                    The AGM session has ended and voting is no longer accepting submissions. 
                    {user?.role === 'admin' ? ' As an admin, you can view results in the Admin Dashboard.' : ' Please check with your administrator for results.'}
                  </p>
                  {agmSession.ActualEndTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Session ended: {new Date(agmSession.ActualEndTime).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role-specific messages */}
            {user?.role === 'admin' && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 w-full">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 text-left">
                    <span className="font-semibold">Admin Access:</span> While voting is closed, you can still access the Admin Dashboard to view results, generate reports, and manage the session data.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 w-full mt-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    navigate('/admin');
                  }}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-semibold text-lg"
                >
                  Go to Admin Dashboard
                </button>
              )}
              <button
                onClick={handleGoHome}
                className={`${user?.role === 'admin' ? 'flex-1' : 'w-full'} px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold text-lg`}
              >
                Return to Home
              </button>
            </div>

            {/* Additional info */}
            <p className="text-sm text-gray-500 mt-4">
              Contact your administrator if you believe this is an error or need assistance.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AGMClosedModal;
