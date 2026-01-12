import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Calendar, MapPin, Clock } from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (meetingId: string) => void;
}

export default function CheckInModal({ isOpen, onClose, onCheckIn }: CheckInModalProps) {
  const [activeMeeting, setActiveMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkForActiveMeeting();
    }
  }, [isOpen]);

  const checkForActiveMeeting = () => {
    // Check if AGM timer is active
    const timerStart = localStorage.getItem('agmTimerStart');
    const timerEnd = localStorage.getItem('agmTimerEnd');
    
    if (timerStart && !timerEnd) {
      // AGM is active, load meetings
      const storedMeetings = localStorage.getItem('meetings');
      if (storedMeetings) {
        const meetings = JSON.parse(storedMeetings);
        const active = meetings.find((m: any) => m.status === 'in-progress');
        if (active) {
          // Check if user already checked in
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const checkedInMeetings = JSON.parse(localStorage.getItem('userCheckedInMeetings') || '{}');
          const userCheckedIn = checkedInMeetings[user.id]?.includes(active.id);
          
          if (!userCheckedIn) {
            setActiveMeeting(active);
          }
        }
      }
    }
  };

  const handleCheckIn = async () => {
    if (!activeMeeting) return;
    
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Add to meeting attendees
      const storedMeetings = localStorage.getItem('meetings');
      if (storedMeetings) {
        const meetings = JSON.parse(storedMeetings);
        const updatedMeetings = meetings.map((m: any) => {
          if (m.id === activeMeeting.id) {
            return {
              ...m,
              attendees: [
                ...(m.attendees || []),
                {
                  userId: user.id,
                  userName: user.name || user.email,
                  checkedInAt: new Date().toISOString(),
                  ipAddress: '192.168.1.1',
                  status: 'present'
                }
              ]
            };
          }
          return m;
        });
        localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
      }

      // Update live attendance
      const liveAttendance = JSON.parse(localStorage.getItem('liveAttendance') || '[]');
      liveAttendance.push({
        userId: user.id,
        userName: user.name || user.email,
        checkedInAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        status: 'present'
      });
      localStorage.setItem('liveAttendance', JSON.stringify(liveAttendance));

      // Save to user's checked-in meetings
      const checkedInMeetings = JSON.parse(localStorage.getItem('userCheckedInMeetings') || '{}');
      if (!checkedInMeetings[user.id]) {
        checkedInMeetings[user.id] = [];
      }
      checkedInMeetings[user.id].push(activeMeeting.id);
      localStorage.setItem('userCheckedInMeetings', JSON.stringify(checkedInMeetings));

      setCheckedIn(true);
      onCheckIn(activeMeeting.id);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!activeMeeting) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={checkedIn ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            {!loading && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            {!checkedIn ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#171C8F] mb-2">
                    Meeting Check-In Required
                  </h2>
                  <p className="text-gray-600">
                    Please mark your attendance for the active meeting
                  </p>
                </div>

                {/* Meeting Details */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-[#171C8F] mb-4">
                    {activeMeeting.title}
                  </h3>
                  
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#0072CE]" />
                      <span>{formatDateTime(activeMeeting.startTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#0072CE]" />
                      <span>{activeMeeting.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#0072CE]" />
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        ▶️ In Progress
                      </span>
                    </div>
                  </div>

                  {activeMeeting.description && (
                    <p className="mt-4 text-gray-600 text-sm">
                      {activeMeeting.description}
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-amber-800 text-sm">
                    ⚠️ <strong>Important:</strong> Your attendance is required to participate in voting during this meeting. 
                    Please check in now to confirm your presence.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Skip for Now
                  </button>
                  
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Check In Now
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // Success State
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-green-700 mb-2">
                  Successfully Checked In!
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Your attendance has been recorded for {activeMeeting.title}
                </p>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-green-800 text-sm">
                    ✓ You can now participate in voting and discussions during the meeting.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
