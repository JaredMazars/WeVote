import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import Header from '../components/Header';

interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  attendees: any[];
}

export default function CandidateCheckIn() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [checkedInMeetings, setCheckedInMeetings] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get current user from localStorage
  const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user);
    }
    return { id: 'demo-user', name: 'Demo User', email: 'demo@wevote.com' };
  };

  const currentUser = getCurrentUser();

  useEffect(() => {
    loadMeetings();
    loadCheckedInMeetings();
  }, []);

  const loadMeetings = () => {
    // Load meetings from localStorage
    const storedMeetings = localStorage.getItem('meetings');
    if (storedMeetings) {
      const allMeetings = JSON.parse(storedMeetings);
      // Only show scheduled or in-progress meetings
      const availableMeetings = allMeetings.filter((m: Meeting) => 
        m.status === 'scheduled' || m.status === 'in-progress'
      );
      setMeetings(availableMeetings);
    } else {
      // Create sample meetings if none exist
      const sampleMeetings: Meeting[] = [
        {
          id: '1',
          title: 'Annual General Meeting 2024',
          description: 'Annual shareholders meeting to discuss company performance and future direction',
          startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          endTime: new Date(Date.now() + 90000000).toISOString(),
          location: 'Main Conference Room',
          status: 'scheduled',
          attendees: []
        },
        {
          id: '2',
          title: 'Q1 Board Meeting',
          description: 'Quarterly board meeting to review financial performance',
          startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (in progress)
          endTime: new Date(Date.now() + 3600000).toISOString(),
          location: 'Board Room',
          status: 'in-progress',
          attendees: []
        },
        {
          id: '3',
          title: 'Employee Recognition Ceremony',
          description: 'Celebrate outstanding employee achievements',
          startTime: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
          endTime: new Date(Date.now() + 176400000).toISOString(),
          location: 'Grand Hall',
          status: 'scheduled',
          attendees: []
        }
      ];
      localStorage.setItem('meetings', JSON.stringify(sampleMeetings));
      setMeetings(sampleMeetings.filter(m => m.status !== 'completed'));
    }
  };

  const loadCheckedInMeetings = () => {
    const checkedIn = JSON.parse(localStorage.getItem('userCheckedInMeetings') || '{}');
    setCheckedInMeetings(checkedIn[currentUser.id] || []);
  };

  const handleCheckIn = async (meetingId: string, meetingTitle: string) => {
    setLoading(meetingId);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add to meeting attendees
      const storedMeetings = localStorage.getItem('meetings');
      if (storedMeetings) {
        const allMeetings = JSON.parse(storedMeetings);
        const updatedMeetings = allMeetings.map((m: Meeting) => {
          if (m.id === meetingId) {
            return {
              ...m,
              attendees: [
                ...(m.attendees || []),
                {
                  userId: currentUser.id,
                  userName: currentUser.name || currentUser.email,
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

      // Update live attendance for auditor portal
      const liveAttendance = JSON.parse(localStorage.getItem('liveAttendance') || '[]');
      liveAttendance.push({
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email,
        checkedInAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        status: 'present'
      });
      localStorage.setItem('liveAttendance', JSON.stringify(liveAttendance));

      // Save to user's checked-in meetings
      const checkedIn = JSON.parse(localStorage.getItem('userCheckedInMeetings') || '{}');
      if (!checkedIn[currentUser.id]) {
        checkedIn[currentUser.id] = [];
      }
      checkedIn[currentUser.id].push(meetingId);
      localStorage.setItem('userCheckedInMeetings', JSON.stringify(checkedIn));

      setCheckedInMeetings([...checkedInMeetings, meetingId]);
      setSuccessMessage(`Successfully checked in to "${meetingTitle}"! 🎉`);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const isCheckedIn = (meetingId: string) => {
    return checkedInMeetings.includes(meetingId);
  };

  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);

    if (meeting.status === 'in-progress') {
      return { text: 'In Progress', color: 'bg-green-100 text-green-700', icon: '▶️' };
    }
    if (meeting.status === 'scheduled' && now < startTime) {
      return { text: 'Upcoming', color: 'bg-blue-100 text-blue-700', icon: '📅' };
    }
    if (meeting.status === 'scheduled' && now >= startTime && now <= endTime) {
      return { text: 'Check-In Open', color: 'bg-amber-100 text-amber-700', icon: '✋' };
    }
    return { text: 'Closed', color: 'bg-gray-100 text-gray-700', icon: '🔒' };
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

  const canCheckIn = (meeting: Meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);
    
    // Can check in if meeting is in progress or within 30 minutes before start
    const thirtyMinutesBeforeStart = new Date(startTime.getTime() - 30 * 60000);
    
    return meeting.status === 'in-progress' || 
           (now >= thirtyMinutesBeforeStart && now <= endTime);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0072CE] to-[#171C8F] bg-clip-text text-transparent mb-2">
            Meeting Check-In
          </h1>
          <p className="text-[#464B4B]">
            Mark your attendance for upcoming and active meetings
          </p>
        </motion.div>

        {/* Success Alert */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-6 bg-green-50 border-2 border-green-500 rounded-2xl p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Meetings</p>
                <p className="text-3xl font-bold text-[#0072CE]">{meetings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#0072CE]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Checked In</p>
                <p className="text-3xl font-bold text-green-600">{checkedInMeetings.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-amber-600">
                  {meetings.length - checkedInMeetings.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          {meetings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl p-12 text-center"
            >
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Meetings Available
              </h3>
              <p className="text-gray-500">
                There are currently no meetings available for check-in.
              </p>
            </motion.div>
          ) : (
            meetings.map((meeting, index) => {
              const status = getMeetingStatus(meeting);
              const checkedIn = isCheckedIn(meeting.id);
              const allowCheckIn = canCheckIn(meeting);

              return (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      {/* Title and Status */}
                      <div className="flex items-start gap-3 mb-3">
                        <h3 className="text-xl font-bold text-[#171C8F] flex-1">
                          {meeting.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                          {status.icon} {status.text}
                        </span>
                      </div>

                      {/* Meeting Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#0072CE]" />
                          <span>{formatDateTime(meeting.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#0072CE]" />
                          <span>{meeting.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#0072CE]" />
                          <span>{meeting.attendees?.length || 0} attendees</span>
                        </div>
                      </div>

                      {/* Description */}
                      {meeting.description && (
                        <p className="text-gray-600 text-sm">
                          {meeting.description}
                        </p>
                      )}
                    </div>

                    {/* Check-In Button */}
                    <div className="flex-shrink-0">
                      {checkedIn ? (
                        <div className="bg-green-50 border-2 border-green-500 rounded-xl px-6 py-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-semibold">Checked In ✓</span>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={allowCheckIn ? { scale: 1.05 } : {}}
                          whileTap={allowCheckIn ? { scale: 0.95 } : {}}
                          onClick={() => handleCheckIn(meeting.id, meeting.title)}
                          disabled={loading !== null || !allowCheckIn}
                          className={`
                            px-6 py-3 rounded-xl font-semibold text-white
                            flex items-center gap-2 shadow-lg transition-all
                            ${!allowCheckIn
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] hover:shadow-xl'
                            }
                          `}
                        >
                          {loading === meeting.id ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Checking In...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              {allowCheckIn ? 'Check In Now' : 'Not Available'}
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-blue-50 border-2 border-[#0072CE] rounded-2xl p-6"
        >
          <h4 className="font-semibold text-[#171C8F] mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Important Information
          </h4>
          <ul className="text-sm text-gray-700 space-y-1 ml-7">
            <li>• Check-in opens 30 minutes before the meeting starts</li>
            <li>• You can check in until the meeting ends</li>
            <li>• Once checked in, you cannot undo your attendance</li>
            <li>• Attendance is recorded with timestamp and IP address</li>
            <li>• Admins and auditors can view all attendance records</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
