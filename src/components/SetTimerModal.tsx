import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface SetTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetTimerModal: React.FC<SetTimerModalProps> = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load existing timer settings if available
      const savedStartDateTime = localStorage.getItem('agmStartDateTime');
      const savedEndTime = localStorage.getItem('agmTimerEndTime');
      
      if (savedStartDateTime) {
        const startDateTime = new Date(savedStartDateTime);
        const dateStr = startDateTime.toISOString().split('T')[0];
        const timeStr = startDateTime.toTimeString().slice(0, 5);
        setStartDate(dateStr);
        setStartTime(timeStr);
      } else {
        // Default to today
        const today = new Date();
        setStartDate(today.toISOString().split('T')[0]);
      }
      
      if (savedEndTime) {
        setEndTime(savedEndTime);
      }
      
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const validateAndSave = () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!startDate) {
      setError('Please select a start date');
      return;
    }
    if (!startTime) {
      setError('Please select a start time');
      return;
    }
    if (!endTime) {
      setError('Please select an end time');
      return;
    }

    // Parse times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Calculate total minutes for comparison
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if end is after start (allowing next-day scenarios)
    if (endMinutes <= startMinutes) {
      // End time is on the next day - this is valid
      console.log('End time is on the next day');
    }

    // Create start datetime
    const startDateTime = new Date(`${startDate}T${startTime}:00`);

    // Save to localStorage
    localStorage.setItem('agmStartDateTime', startDateTime.toISOString());
    localStorage.setItem('agmTimerEndTime', endTime);

    // If timer is already running, update it
    const timerStatus = localStorage.getItem('agmTimerStart');
    if (timerStatus) {
      localStorage.setItem('agmTimerStart', new Date().toISOString());
    }

    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('agmTimerUpdated'));

    setSuccess(true);
    
    // Close modal after success
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return null;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    // If negative, end time is next day
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const duration = calculateDuration();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#464B4B]">Set AGM Timer</h2>
              </div>
              <p className="text-[#464B4B]/70">Configure the voting session timeframe</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Start Date */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-[#464B4B] mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-[#464B4B] mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Start Time</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-[#464B4B] mb-2">
                  <Clock className="h-4 w-4" />
                  <span>End Time</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                />
                <p className="text-xs text-[#464B4B]/60 mt-2">
                  If end time is before start time, it will be treated as next day
                </p>
              </div>

              {/* Duration Preview */}
              {duration && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Duration: {duration}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">{error}</span>
                  </div>
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border-2 border-green-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Timer settings saved successfully!</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mt-8">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={validateAndSave}
                disabled={success}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {success ? 'Saved!' : 'Save Timer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SetTimerModal;
