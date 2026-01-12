/**
 * Meeting Management Service
 * Full AGM lifecycle management with dummy data
 */

export interface Meeting {
  id: string;
  title: string;
  description: string;
  type: 'AGM' | 'EGM' | 'Board Meeting' | 'Committee Meeting';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  location: string;
  isVirtual: boolean;
  meetingUrl?: string;
  agenda: AgendaItem[];
  attendees: Attendee[];
  documents: MeetingDocument[];
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  presenter: string;
  duration: number;
  order: number;
  completed: boolean;
  notes?: string;
}

export interface Attendee {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: 'organizer' | 'chair' | 'member' | 'observer';
  status: 'invited' | 'accepted' | 'declined' | 'attended' | 'absent';
  checkedInAt?: string;
  votingEligible: boolean;
}

export interface MeetingDocument {
  id: string;
  name: string;
  type: 'agenda' | 'minutes' | 'report' | 'presentation' | 'other';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
}

class MeetingService {
  private readonly STORAGE_KEY = 'meetings';
  private readonly ATTENDANCE_KEY = 'meetingAttendance';

  /**
   * Get all meetings
   */
  getAllMeetings(): Meeting[] {
    const meetings = localStorage.getItem(this.STORAGE_KEY);
    return meetings ? JSON.parse(meetings) : this.getDummyMeetings();
  }

  /**
   * Get meeting by ID
   */
  getMeetingById(id: string): Meeting | null {
    const meetings = this.getAllMeetings();
    return meetings.find(m => m.id === id) || null;
  }

  /**
   * Create new meeting
   */
  createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt'>): Meeting {
    const newMeeting: Meeting = {
      ...meeting,
      id: `MTG-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const meetings = this.getAllMeetings();
    meetings.push(newMeeting);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(meetings));

    window.dispatchEvent(new CustomEvent('meetingCreated', { detail: newMeeting }));
    return newMeeting;
  }

  /**
   * Update meeting
   */
  updateMeeting(id: string, updates: Partial<Meeting>): Meeting | null {
    const meetings = this.getAllMeetings();
    const index = meetings.findIndex(m => m.id === id);

    if (index === -1) return null;

    meetings[index] = { ...meetings[index], ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(meetings));

    window.dispatchEvent(new CustomEvent('meetingUpdated', { detail: meetings[index] }));
    return meetings[index];
  }

  /**
   * Delete meeting
   */
  deleteMeeting(id: string): boolean {
    const meetings = this.getAllMeetings();
    const filtered = meetings.filter(m => m.id !== id);

    if (filtered.length === meetings.length) return false;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('meetingDeleted', { detail: { id } }));
    return true;
  }

  /**
   * Start meeting
   */
  startMeeting(id: string): Meeting | null {
    return this.updateMeeting(id, {
      status: 'in-progress',
      startedAt: new Date().toISOString(),
    });
  }

  /**
   * End meeting
   */
  endMeeting(id: string): Meeting | null {
    return this.updateMeeting(id, {
      status: 'completed',
      endedAt: new Date().toISOString(),
    });
  }

  /**
   * Add agenda item
   */
  addAgendaItem(meetingId: string, item: Omit<AgendaItem, 'id' | 'order'>): Meeting | null {
    const meeting = this.getMeetingById(meetingId);
    if (!meeting) return null;

    const newItem: AgendaItem = {
      ...item,
      id: `AGENDA-${Date.now()}`,
      order: meeting.agenda.length + 1,
    };

    meeting.agenda.push(newItem);
    return this.updateMeeting(meetingId, { agenda: meeting.agenda });
  }

  /**
   * Check in attendee
   */
  checkInAttendee(meetingId: string, userId: string): Meeting | null {
    const meeting = this.getMeetingById(meetingId);
    if (!meeting) return null;

    const attendeeIndex = meeting.attendees.findIndex(a => a.userId === userId);
    if (attendeeIndex === -1) return null;

    meeting.attendees[attendeeIndex].status = 'attended';
    meeting.attendees[attendeeIndex].checkedInAt = new Date().toISOString();

    // Store attendance record
    this.recordAttendance(meetingId, userId);

    return this.updateMeeting(meetingId, { attendees: meeting.attendees });
  }

  /**
   * Record attendance
   */
  private recordAttendance(meetingId: string, userId: string): void {
    const attendance = this.getAttendanceRecords();
    attendance.push({
      meetingId,
      userId,
      checkedInAt: new Date().toISOString(),
    });
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(attendance));
  }

  /**
   * Get attendance records
   */
  getAttendanceRecords(): any[] {
    const records = localStorage.getItem(this.ATTENDANCE_KEY);
    return records ? JSON.parse(records) : [];
  }

  /**
   * Get meeting statistics
   */
  getMeetingStats() {
    const meetings = this.getAllMeetings();
    return {
      total: meetings.length,
      scheduled: meetings.filter(m => m.status === 'scheduled').length,
      inProgress: meetings.filter(m => m.status === 'in-progress').length,
      completed: meetings.filter(m => m.status === 'completed').length,
      cancelled: meetings.filter(m => m.status === 'cancelled').length,
      upcomingThisWeek: meetings.filter(m => {
        const meetingDate = new Date(m.scheduledDate);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return m.status === 'scheduled' && meetingDate <= weekFromNow;
      }).length,
    };
  }

  /**
   * Get dummy meetings for testing
   */
  private getDummyMeetings(): Meeting[] {
    return [
      {
        id: 'MTG-001',
        title: 'Annual General Meeting 2025',
        description: 'Annual shareholders meeting for FY2025 results and board elections',
        type: 'AGM',
        status: 'scheduled',
        scheduledDate: '2025-12-15',
        scheduledTime: '14:00',
        duration: 180,
        location: 'Head Office - Conference Room A',
        isVirtual: true,
        meetingUrl: 'https://meet.wevote.com/agm-2025',
        agenda: [
          {
            id: 'AGENDA-001',
            title: 'Welcome and Opening Remarks',
            description: 'CEO opening address',
            presenter: 'John Smith - CEO',
            duration: 15,
            order: 1,
            completed: false,
          },
          {
            id: 'AGENDA-002',
            title: 'Financial Results Presentation',
            description: 'FY2025 financial performance review',
            presenter: 'Sarah Johnson - CFO',
            duration: 30,
            order: 2,
            completed: false,
          },
          {
            id: 'AGENDA-003',
            title: 'Board Elections',
            description: 'Election of 3 board members',
            presenter: 'Election Committee',
            duration: 45,
            order: 3,
            completed: false,
          },
          {
            id: 'AGENDA-004',
            title: 'Special Resolutions',
            description: 'Vote on proposed amendments',
            presenter: 'Legal Committee',
            duration: 30,
            order: 4,
            completed: false,
          },
          {
            id: 'AGENDA-005',
            title: 'Q&A Session',
            description: 'Open floor for shareholder questions',
            presenter: 'All Board Members',
            duration: 45,
            order: 5,
            completed: false,
          },
        ],
        attendees: [
          {
            id: 'ATT-001',
            userId: '1',
            userName: 'John Smith',
            email: 'john@company.com',
            role: 'chair',
            status: 'accepted',
            votingEligible: true,
          },
          {
            id: 'ATT-002',
            userId: '2',
            userName: 'Sarah Johnson',
            email: 'sarah@company.com',
            role: 'member',
            status: 'accepted',
            votingEligible: true,
          },
          {
            id: 'ATT-003',
            userId: '3',
            userName: 'Michael Chen',
            email: 'michael@company.com',
            role: 'member',
            status: 'invited',
            votingEligible: true,
          },
        ],
        documents: [
          {
            id: 'DOC-001',
            name: 'AGM Agenda 2025.pdf',
            type: 'agenda',
            url: '/documents/agm-agenda-2025.pdf',
            uploadedBy: 'Admin',
            uploadedAt: '2025-12-01T10:00:00Z',
            size: 245000,
          },
          {
            id: 'DOC-002',
            name: 'Financial Report FY2025.pdf',
            type: 'report',
            url: '/documents/financial-report-2025.pdf',
            uploadedBy: 'Sarah Johnson',
            uploadedAt: '2025-12-05T15:30:00Z',
            size: 1250000,
          },
        ],
        createdBy: 'Admin',
        createdAt: '2025-11-01T09:00:00Z',
      },
      {
        id: 'MTG-002',
        title: 'Q4 Board Meeting',
        description: 'Quarterly board review and strategic planning',
        type: 'Board Meeting',
        status: 'completed',
        scheduledDate: '2025-11-30',
        scheduledTime: '10:00',
        duration: 120,
        location: 'Virtual',
        isVirtual: true,
        meetingUrl: 'https://meet.wevote.com/q4-board',
        agenda: [],
        attendees: [],
        documents: [],
        createdBy: 'Admin',
        createdAt: '2025-11-15T09:00:00Z',
        startedAt: '2025-11-30T10:00:00Z',
        endedAt: '2025-11-30T12:00:00Z',
      },
    ];
  }

  /**
   * Clear all meetings (testing only)
   */
  clearMeetings(): void {
    if (confirm('⚠️ WARNING: This will delete all meeting data. Continue?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.ATTENDANCE_KEY);
      alert('✅ All meetings cleared');
    }
  }
}

export const meetingService = new MeetingService();
