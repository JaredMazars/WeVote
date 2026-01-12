import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock } from 'lucide-react';

interface VotingLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDateTime?: Date | null;
  endTime?: string;
}

const VotingLockedModal: React.FC<VotingLockedModalProps> = ({ 
  isOpen, 
  onClose, 
  startDateTime, 
  endTime 
}) => {
  const formatSchedule = () => {
    if (!startDateTime || !endTime) {
      return 'The AGM voting session has not been scheduled yet.';
    }

    const dateStr = startDateTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = startDateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `Scheduled for ${dateStr} from ${timeStr} to ${endTime}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-full"
              >
                <AlertTriangle className="h-12 w-12 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#464B4B] mb-3">
                Voting Session Not Active
              </h2>
              <p className="text-[#464B4B]/70 mb-4">
                The AGM voting session is currently not active. You can only cast votes during the scheduled voting period.
              </p>

              {/* Schedule Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Session Schedule</p>
                    <p className="text-sm text-blue-700">{formatSchedule()}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Need Assistance?</strong><br />
                  Please contact your administrator if you believe this is an error or if you need to vote urgently.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              Got It
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VotingLockedModal;
