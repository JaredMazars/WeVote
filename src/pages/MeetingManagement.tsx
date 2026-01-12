import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  meetingService, 
  type Meeting, 
  type AgendaItem, 
  type Attendee 
} from '../services/meetingService';

export default function MeetingManagement() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in-progress' | 'completed'>('all');
  const [stats, setStats] = useState({ scheduled: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    loadMeetings();
    loadStats();

    // Listen for meeting events
    const handleMeetingCreated = () => loadMeetings();
    const handleMeetingUpdated = () => loadMeetings();
    
    window.addEventListener('meetingCreated', handleMeetingCreated);
    window.addEventListener('meetingUpdated', handleMeetingUpdated);
    
    return () => {
      window.removeEventListener('meetingCreated', handleMeetingCreated);
      window.removeEventListener('meetingUpdated', handleMeetingUpdated);
    };
  }, []);

  const loadMeetings = () => {
    const allMeetings = meetingService.getAllMeetings();
    setMeetings(allMeetings);
  };

  const loadStats = () => {
    const meetingStats = meetingService.getMeetingStats();
    setStats({
      scheduled: meetingStats.scheduled,
      inProgress: meetingStats.inProgress,
      completed: meetingStats.completed,
    });
  };

  const filteredMeetings = filterStatus === 'all' 
    ? meetings 
    : meetings.filter(m => m.status === filterStatus);

  const handleStartMeeting = (meetingId: string) => {
    meetingService.startMeeting(meetingId);
    loadMeetings();
    loadStats();
  };

  const handleEndMeeting = (meetingId: string) => {
    meetingService.endMeeting(meetingId);
    loadMeetings();
    loadStats();
  };

  const handleCheckIn = (meetingId: string, attendeeId: string) => {
    meetingService.checkInAttendee(meetingId, attendeeId);
    loadMeetings();
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting(meetingService.getMeetingById(meetingId)!);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Meeting Management
          </h1>
          <p className="text-slate-600">
            Manage AGMs, board meetings, and shareholder gatherings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Scheduled</p>
                <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                📅
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-green-600">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                ▶️
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-slate-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions & Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('scheduled')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setFilterStatus('in-progress')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'in-progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Completed
              </button>
            </div>

            <button
              onClick={() => alert('Create meeting functionality coming soon')}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <span>➕</span>
              Create Meeting
            </button>
          </div>
        </div>

        {/* Meetings List */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMeetings.map((meeting) => (
              <motion.div
                key={meeting.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            meeting.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-700'
                              : meeting.status === 'in-progress'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {meeting.status === 'in-progress' ? 'In Progress' : meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                          </span>
                          <span className="text-sm text-slate-500">{meeting.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>📅</span>
                        <span>{new Date(meeting.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>⏰</span>
                        <span>{meeting.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>👥</span>
                        <span>{meeting.attendees.length} attendees</span>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>📍</span>
                          <span>{meeting.location}</span>
                        </div>
                      )}
                    </div>

                    {meeting.description && (
                      <p className="text-slate-600 mb-4">{meeting.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {meeting.meetingUrl && (
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        >
                          <span>🎥</span>
                          Join Virtual Meeting
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedMeeting(meeting)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        <span>📄</span>
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {meeting.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartMeeting(meeting.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <span>▶️</span>
                        Start Meeting
                      </button>
                    )}
                    {meeting.status === 'in-progress' && (
                      <button
                        onClick={() => handleEndMeeting(meeting.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <span>⏸️</span>
                        End Meeting
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredMeetings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl text-slate-300 mx-auto mb-4">📅</div>
              <p className="text-slate-500 text-lg">No meetings found</p>
            </div>
          )}
        </div>

        {/* Meeting Details Modal */}
        <AnimatePresence>
          {selectedMeeting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedMeeting(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {selectedMeeting.title}
                      </h2>
                      <p className="text-slate-600">{selectedMeeting.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMeeting(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Agenda */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Agenda</h3>
                    <div className="space-y-2">
                      {selectedMeeting.agenda.map((item: AgendaItem, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="text-sm text-slate-600">
                              {item.presenter} • {item.duration} min
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      Attendees ({selectedMeeting.attendees.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedMeeting.attendees.map((attendee: Attendee) => (
                        <div
                          key={attendee.userId}
                          className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{attendee.userName}</p>
                            <p className="text-sm text-slate-600">{attendee.role}</p>
                          </div>
                          {selectedMeeting.status === 'in-progress' && !attendee.checkedInAt && (
                            <button
                              onClick={() => handleCheckIn(selectedMeeting.id, attendee.userId)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                            >
                              <span>✅</span>
                              Check In
                            </button>
                          )}
                          {attendee.checkedInAt && (
                            <span className="text-green-600 font-medium">✓ Checked In</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  {selectedMeeting.documents.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">Documents</h3>
                      <div className="space-y-2">
                        {selectedMeeting.documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-blue-600 text-xl">📄</span>
                              <div>
                                <p className="font-medium text-slate-900">{doc.name}</p>
                                <p className="text-sm text-slate-600">
                                  {doc.type} • {doc.size}
                                </p>
                              </div>
                            </div>
                            <a
                              href={doc.url}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
