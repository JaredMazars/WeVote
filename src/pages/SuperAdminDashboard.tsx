import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Save, 
  RefreshCw,
  RotateCcw,
  SkipForward,
  ToggleLeft,
  ToggleRight,
  Crown,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Play,
  Square,
  UserCog,
  AlertCircle,
  Search,
  KeyRound,
  Copy,
  Check,
  UserMinus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

// ===== UTILITY FUNCTIONS =====
// Generate secure random password
const generateSecurePassword = (length = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// ===== INTERFACES =====
interface VoteSplittingSettings {
  id: number;
  enabled: boolean;
  min_proxy_voters: number;
  max_proxy_voters: number;
  min_individual_votes: number;
  max_individual_votes: number;
  updated_at: string;
}

interface AGMSession {
  id: number;
  organizationId: number;
  organizationName: string;
  title: string;
  description: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  quorumRequired: number;
  totalVoters: number;
  totalVotesCast: number;
  assignedAdmins: string[];
  createdBy: string;
  createdAt: string;
}

interface Admin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'auditor';
  assignedSessions: number;
}

// ===== MAIN COMPONENT =====
const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'sessions' | 'admins' | 'vote-splitting'>('sessions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Vote Settings State
  const [voteSplittingSettings, setVoteSplittingSettings] = useState<VoteSplittingSettings>({
    id: 1,
    enabled: false,
    min_proxy_voters: 1,
    max_proxy_voters: 10,
    min_individual_votes: 1,
    max_individual_votes: 5,
    updated_at: new Date().toISOString()
  });
  const [selectedSessionForVoting, setSelectedSessionForVoting] = useState<number | null>(null);

  // AGM Sessions State
  const [sessions, setSessions] = useState<AGMSession[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAssignSessionModal, setShowAssignSessionModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [adminSessionAssignments, setAdminSessionAssignments] = useState<{ [adminId: number]: number[] }>({});
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPasswordForm, setNewPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'admin' as 'admin' | 'auditor',
    assignedSessions: [] as number[],
    isExistingUser: false,
    selectedUserId: null as number | null
  });
  
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<AGMSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<number | 'all'>('all');
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const [adminFilterSearch, setAdminFilterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Form States
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    quorumRequired: 50,
    totalVoters: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  // Generate password when Add Admin modal opens
  useEffect(() => {
    if (showAddAdminModal) {
      // Auto-select the current session tab if viewing a specific session
      const preSelectedSessions = selectedSessionFilter !== 'all' ? [selectedSessionFilter as number] : [];
      
      if (!newAdminForm.password) {
        setNewAdminForm(prev => ({
          ...prev,
          password: generateSecurePassword(),
          assignedSessions: preSelectedSessions
        }));
      } else {
        // Just update assigned sessions if password already exists
        setNewAdminForm(prev => ({
          ...prev,
          assignedSessions: preSelectedSessions
        }));
      }
    }
  }, [showAddAdminModal, selectedSessionFilter]);

  // Check if user requires password change on component mount
  useEffect(() => {
    const checkPasswordChangeRequired = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/check-password-change', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.requiresPasswordChange) {
            setShowPasswordChangeModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking password change requirement:', error);
      }
    };
    checkPasswordChangeRequired();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load sessions first, then load assignments based on those sessions
      await loadSessions();
      await loadAdmins();
      await loadVoteSplittingSettings();
      // Load assignments after sessions are loaded
      await loadAdminSessionAssignmentsAfterSessions();
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const loadedSessions = data.sessions?.map((s: any) => ({
          id: s.SessionID,
          organizationId: s.OrganizationID,
          organizationName: s.OrganizationName || 'Organization',
          title: s.Title,
          description: s.Description || '',
          scheduledStartTime: s.ScheduledStartTime,
          scheduledEndTime: s.ScheduledEndTime,
          status: s.Status,
          quorumRequired: s.QuorumRequired,
          totalVoters: s.TotalVoters || 0,
          totalVotesCast: s.TotalVotesCast || 0,
          assignedAdmins: [],
          createdBy: s.CreatedByName || 'Admin',
          createdAt: s.CreatedAt
        })) || [];
        setSessions(loadedSessions);
        
        // Load assigned admins for each session
        for (const session of loadedSessions) {
          loadSessionAdmins(session.id);
        }

        // Load admin session assignments using the loaded sessions
        await loadAdminAssignmentsForSessions(loadedSessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadSessionAdmins = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/admins`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const adminNames = data.admins?.map((a: any) => `${a.FirstName} ${a.LastName}`) || [];
        
        // Update session with admin names
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, assignedAdmins: adminNames } : s
        ));
      }
    } catch (error) {
      console.error(`Error loading admins for session ${sessionId}:`, error);
    }
  };

  const loadAdmins = async () => {
    try {
      console.log('Loading admins from backend...');
      const response = await fetch('http://localhost:3001/api/users?role=admin,auditor', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Admin response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Admin data received:', data);
        const adminUsers = data.users?.map((u: any) => ({
          id: u.UserID,
          email: u.Email,
          firstName: u.FirstName || 'Admin',
          lastName: u.LastName || 'User',
          role: u.Role,
          assignedSessions: 0
        })) || [];
        console.log('Mapped admin users:', adminUsers);
        setAdmins(adminUsers);
      } else {
        console.error('Failed to load admins, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };



  const loadAdminAssignmentsForSessions = async (loadedSessions: any[]) => {
    try {
      console.log('Loading admin session assignments for', loadedSessions.length, 'sessions...');
      const assignments: { [adminId: number]: number[] } = {};
      
      // Load assignments for each session
      for (const session of loadedSessions) {
        console.log(`Loading admins for session ${session.id}: ${session.title}`);
        const response = await fetch(`http://localhost:3001/api/sessions/${session.id}/admins`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const admins = data.admins || [];
          console.log(`Session ${session.id} has ${admins.length} admins:`, admins);
          
          // Build reverse mapping: admin -> sessions
          for (const admin of admins) {
            if (!assignments[admin.UserID]) {
              assignments[admin.UserID] = [];
            }
            assignments[admin.UserID].push(session.id);
          }
        }
      }
      
      console.log('Admin session assignments loaded:', assignments);
      setAdminSessionAssignments(assignments);
    } catch (error) {
      console.error('Error loading admin-session assignments:', error);
    }
  };

  const loadAdminSessionAssignments = async () => {
    // This is kept for backward compatibility but now relies on sessions state
    try {
      console.log('Loading admin session assignments (legacy call)...');
      const assignments: { [adminId: number]: number[] } = {};
      
      // Load assignments for each session
      for (const session of sessions) {
        console.log(`Loading admins for session ${session.id}: ${session.title}`);
        const response = await fetch(`http://localhost:3001/api/sessions/${session.id}/admins`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const admins = data.admins || [];
          console.log(`Session ${session.id} has ${admins.length} admins:`, admins);
          
          // Build reverse mapping: admin -> sessions
          for (const admin of admins) {
            if (!assignments[admin.UserID]) {
              assignments[admin.UserID] = [];
            }
            assignments[admin.UserID].push(session.id);
          }
        }
      }
      
      console.log('Admin session assignments loaded:', assignments);
      setAdminSessionAssignments(assignments);
    } catch (error) {
      console.error('Error loading admin-session assignments:', error);
    }
  };

  const loadAdminSessionAssignmentsAfterSessions = async () => {
    // This function is no longer needed since loadSessions now calls loadAdminAssignmentsForSessions
    // But keeping it to avoid breaking the loadAllData call
    console.log('loadAdminSessionAssignmentsAfterSessions called (no-op since loadSessions handles it)');
  };

  const loadVoteSplittingSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/vote-splitting', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setVoteSplittingSettings({
            id: data.settings.id || 1,
            enabled: data.settings.enabled || false,
            min_proxy_voters: data.settings.min_proxy_voters || 1,
            max_proxy_voters: data.settings.max_proxy_voters || 10,
            min_individual_votes: data.settings.min_individual_votes || 1,
            max_individual_votes: data.settings.max_individual_votes || 5,
            updated_at: data.settings.updated_at || new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error loading vote splitting settings:', error);
    }
  };



  // ===== SESSION HANDLERS =====
  const handleCreateSession = async () => {
    if (!sessionForm.title || !sessionForm.scheduledStartTime || !sessionForm.scheduledEndTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Convert datetime-local format to ISO 8601 format for SQL Server
      const startTime = new Date(sessionForm.scheduledStartTime).toISOString();
      const endTime = new Date(sessionForm.scheduledEndTime).toISOString();

      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: sessionForm.title,
          description: sessionForm.description,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          quorumRequired: sessionForm.quorumRequired,
          totalVoters: sessionForm.totalVoters
        })
      });

      if (response.ok) {
        setShowCreateSessionModal(false);
        setSessionForm({
          title: '',
          description: '',
          scheduledStartTime: '',
          scheduledEndTime: '',
          quorumRequired: 50,
          totalVoters: 0
        });
        
        setSuccessMessage('AGM Session created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reload sessions from backend
        loadSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create session');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditSession = (session: AGMSession) => {
    setEditingSession(session);
    // Convert ISO dates to datetime-local format (YYYY-MM-DDTHH:mm)
    const startDate = new Date(session.scheduledStartTime);
    const endDate = new Date(session.scheduledEndTime);
    
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setSessionForm({
      title: session.title,
      description: session.description,
      scheduledStartTime: formatDateForInput(startDate),
      scheduledEndTime: formatDateForInput(endDate),
      quorumRequired: session.quorumRequired,
      totalVoters: session.totalVoters
    });
    setShowEditSessionModal(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession || !sessionForm.title || !sessionForm.scheduledStartTime || !sessionForm.scheduledEndTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const startTime = new Date(sessionForm.scheduledStartTime).toISOString();
      const endTime = new Date(sessionForm.scheduledEndTime).toISOString();

      const response = await fetch(`http://localhost:3001/api/sessions/${editingSession.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: sessionForm.title,
          description: sessionForm.description,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          quorumRequired: sessionForm.quorumRequired,
          totalVoters: sessionForm.totalVoters
        })
      });

      if (response.ok) {
        setShowEditSessionModal(false);
        setEditingSession(null);
        setSessionForm({
          title: '',
          description: '',
          scheduledStartTime: '',
          scheduledEndTime: '',
          quorumRequired: 50,
          totalVoters: 0
        });
        
        setSuccessMessage('AGM Session updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        loadSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update session');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleStartSession = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.setItem('agmTimerStart', new Date().toISOString());
        localStorage.setItem('agmTimerStatus', 'running');
        setSuccessMessage('Session started successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Force reload sessions to get updated status from backend
        await loadSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start session');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setError('Failed to start session');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.setItem('agmTimerEnd', new Date().toISOString());
        localStorage.setItem('agmTimerStatus', 'ended');
        setSuccessMessage('Session ended successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Force reload sessions to get updated status from backend
        await loadSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to end session');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleResumeSession = async (sessionId: number) => {
    if (!confirm('Resume this completed session? Voting will become active again.')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.removeItem('agmTimerEnd');
        localStorage.setItem('agmTimerStatus', 'running');
        setSuccessMessage('Session resumed! Voting is now active again.');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Force reload sessions to get updated status from backend
        await loadSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to resume session');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error resuming session:', error);
      setError('Failed to resume session');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleResetSession = async (sessionId: number) => {
    const confirmed = confirm(
      '⚠️ RESET SESSION?\n\n' +
      'This will:\n' +
      '• Delete ALL votes cast in this session\n' +
      '• Clear all attendance records\n' +
      '• Remove all blockchain records\n' +
      '• Reset status to "scheduled"\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Type "RESET" to confirm.'
    );
    
    if (!confirmed) return;
    
    const confirmation = prompt('Type RESET in capital letters to confirm:');
    if (confirmation !== 'RESET') {
      setError('Reset cancelled - confirmation did not match');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.removeItem('agmTimerStart');
        localStorage.removeItem('agmTimerEnd');
        localStorage.removeItem('agmTimerStatus');
        setSuccessMessage('Session RESET complete! All votes and data cleared.');
        setTimeout(() => setSuccessMessage(null), 5000);
        loadSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reset session');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Error resetting session:', error);
      setError('Failed to reset session');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccessMessage('Session deleted!');
        setTimeout(() => setSuccessMessage(null), 3000);
        loadSessions();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session');
    }
  };

  // ===== ADMIN MANAGEMENT HANDLERS =====
  const handleAddAdmin = async () => {
    // Validation
    if (newAdminForm.isExistingUser) {
      if (!newAdminForm.selectedUserId) {
        setError('Please select an admin/auditor');
        return;
      }
    } else {
      if (!newAdminForm.email || !newAdminForm.firstName || !newAdminForm.lastName || !newAdminForm.password) {
        setError('Please fill in all required fields');
        return;
      }
    }

    try {
      let newAdminId: number;

      if (newAdminForm.isExistingUser) {
        // Assign existing admin/auditor to sessions
        if (!newAdminForm.selectedUserId) {
          throw new Error('Please select an admin/auditor');
        }

        newAdminId = newAdminForm.selectedUserId;
      } else {
        // Create new admin user
        const response = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: newAdminForm.email,
            password: newAdminForm.password,
            firstName: newAdminForm.firstName,
            lastName: newAdminForm.lastName,
            role: newAdminForm.role
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create admin');
        }

        const data = await response.json();
        newAdminId = data.user?.userId;
        
        // Send email with credentials
        try {
          await fetch('http://localhost:3001/api/auth/send-admin-credentials', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: newAdminForm.email,
              firstName: newAdminForm.firstName,
              password: newAdminForm.password,
              role: newAdminForm.role
            })
          });
        } catch (emailError) {
          console.error('Failed to send credentials email:', emailError);
        }
      }
        
      // Assign to sessions if any selected
      if (newAdminId && newAdminForm.assignedSessions.length > 0) {
        // Assign admin to each selected session via backend
        for (const sessionId of newAdminForm.assignedSessions) {
          try {
            await fetch(`http://localhost:3001/api/sessions/${sessionId}/admins`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ userId: newAdminId })
            });
          } catch (error) {
            console.error(`Failed to assign admin to session ${sessionId}:`, error);
          }
        }
        
        // Update local assignments state
        setAdminSessionAssignments({
          ...adminSessionAssignments,
          [newAdminId]: newAdminForm.assignedSessions
        });
        
        // Reload sessions to get updated admin assignments
        loadSessions();
      }
      
      if (newAdminForm.isExistingUser) {
        setSuccessMessage(`Admin assigned to session(s) successfully!`);
      } else {
        setSuccessMessage(`${newAdminForm.role === 'admin' ? 'Admin' : 'Auditor'} created! Credentials email sent to ${newAdminForm.email}`);
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      setShowAddAdminModal(false);
      setNewAdminForm({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'admin',
        assignedSessions: [],
        isExistingUser: false,
        selectedUserId: null
      });
      loadAdmins();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      setError(error.message || 'Failed to add admin user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPasswordForm.newPassword || !newPasswordForm.confirmPassword) {
      setError('Please fill in both password fields');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (newPasswordForm.newPassword !== newPasswordForm.confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (newPasswordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/first-login-password-change', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword: newPasswordForm.newPassword })
      });

      if (response.ok) {
        setSuccessMessage('Password changed successfully! You can now access all features.');
        setTimeout(() => {
          setSuccessMessage(null);
          setShowPasswordChangeModal(false);
          setNewPasswordForm({ newPassword: '', confirmPassword: '' });
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to change password');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteAdmin = async (adminId: number, adminEmail: string) => {
    if (!confirm(`⚠️ REMOVE ${adminEmail} as admin?\n\nThis will:\n• Demote them to regular user\n• Remove them from ALL sessions\n• Keep their account active\n\nContinue?`)) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccessMessage('Admin privileges removed successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        // Reload both admins and session assignments
        await loadAdmins();
        await loadAdminSessionAssignments();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to remove admin');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      setError('Failed to remove admin');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUnassignAdminFromSession = async (adminId: number, adminEmail: string, sessionId: number) => {
    const sessionTitle = sessions.find(s => s.id === sessionId)?.title;
    if (!confirm(`Remove ${adminEmail} from "${sessionTitle}"?\n\nThey will remain as an admin user and can still be assigned to other sessions.`)) return;

    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/admins/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccessMessage(`Admin unassigned from session successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Update local state
        const currentAssignments = adminSessionAssignments[adminId] || [];
        const updatedAssignments = currentAssignments.filter(id => id !== sessionId);
        setAdminSessionAssignments({
          ...adminSessionAssignments,
          [adminId]: updatedAssignments
        });
        
        // Reload session admins
        await loadSessionAdmins(sessionId);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to unassign admin from session');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Error unassigning admin from session:', error);
      setError('Failed to unassign admin from session');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAssignAdminToSession = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowAssignSessionModal(true);
  };

  const handleToggleSessionAssignment = async (sessionId: number) => {
    if (!selectedAdmin) return;

    const currentAssignments = adminSessionAssignments[selectedAdmin.id] || [];
    const isAssigned = currentAssignments.includes(sessionId);

    try {
      if (isAssigned) {
        // Unassign admin from session
        const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/admins/${selectedAdmin.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const updatedAssignments = currentAssignments.filter(id => id !== sessionId);
          setAdminSessionAssignments({
            ...adminSessionAssignments,
            [selectedAdmin.id]: updatedAssignments
          });
          loadSessionAdmins(sessionId);
          setSuccessMessage(`${selectedAdmin.firstName} unassigned from session`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to unassign admin');
        }
      } else {
        // Assign admin to session
        const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/admins`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: selectedAdmin.id })
        });

        if (response.ok) {
          const updatedAssignments = [...currentAssignments, sessionId];
          setAdminSessionAssignments({
            ...adminSessionAssignments,
            [selectedAdmin.id]: updatedAssignments
          });
          loadSessionAdmins(sessionId);
          setSuccessMessage(`${selectedAdmin.firstName} assigned to session successfully`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to assign admin');
        }
      }
    } catch (error) {
      console.error('Error toggling session assignment:', error);
      setError('Failed to update session assignment');
    }
  };

  const getAdminAssignedSessions = (adminId: number): number => {
    return (adminSessionAssignments[adminId] || []).length;
  };

  // ===== VOTE SETTINGS HANDLERS =====
  const handleSaveVoteSplitting = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/vote-splitting', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: voteSplittingSettings.enabled,
          min_proxy_voters: voteSplittingSettings.min_proxy_voters,
          max_proxy_voters: voteSplittingSettings.max_proxy_voters,
          min_individual_votes: voteSplittingSettings.min_individual_votes,
          max_individual_votes: voteSplittingSettings.max_individual_votes
        })
      });

      if (response.ok) {
        setSuccessMessage('Vote splitting settings saved successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save vote splitting settings');
      }
    } catch (error) {
      console.error('Error saving vote splitting settings:', error);
      setError('Failed to save vote splitting settings');
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.organizationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
    in_progress: 'bg-green-100 text-green-700 border-green-300',
    completed: 'bg-gray-100 text-gray-700 border-gray-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
        <Header />
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-[#0072CE] animate-spin" />
            <p className="text-[#464B4B]/70">Loading Super Admin Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Super Admin Control Panel</h1>
                <p className="text-blue-100">Create AGM sessions, assign admins & set vote limits for candidates</p>
              </div>
            </div>
            <div className="flex gap-3">
              {activeTab === 'sessions' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateSessionModal(true)}
                  className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-all duration-200 backdrop-blur-sm font-semibold flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create AGM Session
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin')}
                className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-all duration-200 backdrop-blur-sm font-semibold"
              >
                Back to Admin
              </motion.button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold mt-1">{sessions.length}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-sm">Active Sessions</p>
              <p className="text-3xl font-bold mt-1">{sessions.filter(s => s.status === 'in_progress').length}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-sm">Total Admins</p>
              <p className="text-3xl font-bold mt-1">{admins.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-800 font-semibold"
            >
              ✓ {successMessage}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 font-semibold"
            >
              ✗ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto">
          <TabButton
            icon={Calendar}
            label="AGM Sessions"
            isActive={activeTab === 'sessions'}
            onClick={() => setActiveTab('sessions')}
            badge={sessions.length}
          />
          <TabButton
            icon={UserCog}
            label="Admin Management"
            isActive={activeTab === 'admins'}
            onClick={() => setActiveTab('admins')}
            badge={admins.length}
          />
          <TabButton
            icon={Settings}
            label="Vote Splitting"
            isActive={activeTab === 'vote-splitting'}
            onClick={() => setActiveTab('vote-splitting')}
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* ===== AGM SESSIONS TAB ===== */}
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                {/* Search, Filter, and View Controls */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="flex gap-2 border-2 border-gray-200 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'compact' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="Compact View"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900 text-lg">Multi-Session Management</p>
                      <p className="text-blue-700 mt-1">
                        Create multiple AGM sessions for different meetings. Each session has its own timeline, 
                        assigned admins, and vote allocations. Perfect for managing Q1, Q2, Annual, and Special meetings.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sessions Grid/List with Pagination */}
                <div className={viewMode === 'grid' ? 'grid gap-6' : 'space-y-3'}>
                  {filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((session) => (
                    viewMode === 'compact' ? (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-gradient-to-br from-[#0072CE] to-[#171C8F] w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold">
                            {session.id}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">{session.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[session.status]}`}>
                                {session.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{new Date(session.scheduledStartTime).toLocaleDateString()} • {session.assignedAdmins?.length || 0} admins</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{session.quorumRequired}% quorum</span>
                          {session.status === 'in_progress' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              className="px-4 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-lg font-semibold text-sm"
                            >
                              Active
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900">{session.title}</h3>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${statusColors[session.status]}`}>
                              {session.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-4">{session.description}</p>
                          
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">Start Date</p>
                              <p className="text-sm font-bold text-gray-900 mt-1">
                                {new Date(session.scheduledStartTime).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">Quorum</p>
                              <p className="text-sm font-bold text-gray-900 mt-1">{session.quorumRequired}%</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">Voters</p>
                              <p className="text-sm font-bold text-gray-900 mt-1">{session.totalVoters}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl">
                              <p className="text-xs text-gray-500 font-medium">Admins</p>
                              <p className="text-sm font-bold text-gray-900 mt-1">{session.assignedAdmins?.length || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartSession(session.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium"
                          >
                            <Play className="w-4 h-4" />
                            Start Session
                          </button>
                        )}
                        {session.status === 'in_progress' && (
                          <button
                            onClick={() => handleEndSession(session.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium"
                          >
                            <Square className="w-4 h-4" />
                            End Session
                          </button>
                        )}
                        {session.status === 'completed' && (
                          <button
                            onClick={() => handleResumeSession(session.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium"
                            title="Resume voting - Continue from where it ended"
                          >
                            <SkipForward className="w-4 h-4" />
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => handleResetSession(session.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-medium"
                          title="Reset session - Clear ALL votes and data"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </button>
                        <button
                          onClick={() => handleEditSession(session)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                    )
                  ))}\n                  
                  {filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length === 0 && filteredSessions.length > 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-200">
                      <p className="text-gray-500 text-lg">No sessions on this page</p>
                    </div>
                  )}
                  
                  {filteredSessions.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200">
                      <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                      <p className="text-gray-500 text-2xl font-medium mb-6">No AGM sessions found</p>
                      <button
                        onClick={() => setShowCreateSessionModal(true)}
                        className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white px-8 py-4 rounded-xl hover:shadow-2xl transition-all font-medium text-lg"
                      >
                        Create Your First AGM Session
                      </button>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filteredSessions.length > itemsPerPage && (
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow">
                    <p className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length} sessions
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.ceil(filteredSessions.length / itemsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
                          return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                        })
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-2 py-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                currentPage === page
                                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))
                      }
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredSessions.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(filteredSessions.length / itemsPerPage)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          currentPage === Math.ceil(filteredSessions.length / itemsPerPage)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== ADMINS TAB ===== */}
            {activeTab === 'admins' && (
              <div className="space-y-6">
                {/* Session Filter Buttons with Search */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Filter by AGM Session</h3>
                    {sessions.length > 5 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search sessions..."
                          value={adminFilterSearch}
                          onChange={(e) => setAdminFilterSearch(e.target.value)}
                          className="pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072CE] focus:border-transparent w-64"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSessionFilter('all')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-sm ${
                        selectedSessionFilter === 'all'
                          ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-white/20">
                        {admins.length}
                      </span>
                    </motion.button>
                    
                    {sessions
                      .filter(s => s.title.toLowerCase().includes(adminFilterSearch.toLowerCase()))
                      .map((session) => {
                      const adminCount = admins.filter(admin => 
                        (adminSessionAssignments[admin.id] || []).includes(session.id)
                      ).length;
                      
                      return (
                        <motion.button
                          key={session.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSessionFilter(session.id)}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${
                            selectedSessionFilter === session.id
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {session.title.length > 25 ? session.title.substring(0, 25) + '...' : session.title}
                          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                            selectedSessionFilter === session.id
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {adminCount}
                          </span>
                        </motion.button>
                      );
                    })}
                    
                    {sessions.length === 0 && (
                      <p className="text-gray-500 text-sm italic">No AGM sessions created yet</p>
                    )}
                  </div>
                  {sessions.filter(s => s.title.toLowerCase().includes(adminFilterSearch.toLowerCase())).length === 0 && adminFilterSearch && (
                    <p className="text-center text-gray-500 text-sm mt-4">No sessions match "{adminFilterSearch}"</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Admin & Auditor Management</h2>
                      {selectedSessionFilter !== 'all' && (
                        <p className="text-gray-600 mt-2">
                          Showing admins assigned to: <span className="font-semibold">
                            {sessions.find(s => s.id === selectedSessionFilter)?.title}
                          </span>
                        </p>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddAdminModal(true)}
                      className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Add Admin/Auditor
                    </motion.button>
                  </div>
                  
                  <div className="grid gap-4">
                    {admins
                      .filter(admin => {
                        if (selectedSessionFilter === 'all') return true;
                        return (adminSessionAssignments[admin.id] || []).includes(selectedSessionFilter as number);
                      })
                      .map((admin) => (
                      <div key={admin.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-[#0072CE] to-[#171C8F] w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                            {admin.firstName[0]}{admin.lastName[0]}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{admin.firstName} {admin.lastName}</h3>
                            <p className="text-gray-600">{admin.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                {admin.role.toUpperCase()}
                              </span>
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                {getAdminAssignedSessions(admin.id)} Sessions
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-2">
                            <p className="text-gray-600 text-sm">User ID</p>
                            <p className="text-2xl font-bold text-gray-900">{admin.id}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAssignAdminToSession(admin)}
                            className="p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all"
                            title="Assign to Sessions"
                          >
                            <Calendar className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (selectedSessionFilter === 'all') {
                                handleDeleteAdmin(admin.id, admin.email);
                              } else {
                                handleUnassignAdminFromSession(admin.id, admin.email, selectedSessionFilter as number);
                              }
                            }}
                            className="p-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all"
                            title={selectedSessionFilter === 'all' ? 'Delete Admin Permanently' : 'Remove from This Session'}
                          >
                            {selectedSessionFilter === 'all' ? (
                              <Trash2 className="w-5 h-5" />
                            ) : (
                              <UserMinus className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    ))}
                    
                    {admins.filter(admin => {
                      if (selectedSessionFilter === 'all') return true;
                      return (adminSessionAssignments[admin.id] || []).includes(selectedSessionFilter as number);
                    }).length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        {selectedSessionFilter === 'all' ? (
                          <>
                            <p className="text-gray-500 text-lg">No admin users found</p>
                            <p className="text-gray-400 text-sm mt-2">Click the button above to add your first admin</p>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-500 text-lg">No admins assigned to this session</p>
                            <p className="text-gray-400 text-sm mt-2">Click the calendar icon on an admin to assign them to sessions</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== VOTE SPLITTING TAB ===== */}
            {activeTab === 'vote-splitting' && (
              <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-[#464B4B] mb-2">Vote Splitting Configuration</h2>
                  <p className="text-[#464B4B]/70">Control proxy voting and vote distribution settings</p>
                </div>

                {/* AGM Session Selector */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-[#464B4B] uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Select AGM Session *
                    </label>
                    {sessions.length > 4 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={sessionSearchTerm}
                          onChange={(e) => setSessionSearchTerm(e.target.value)}
                          className="pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#0072CE] focus:border-transparent w-56"
                        />
                      </div>
                    )}
                  </div>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-semibold">No AGM sessions available</p>
                      <p className="text-gray-400 text-sm mt-1">Create a session first in the AGM Sessions tab</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {sessions
                        .filter(s => s.title.toLowerCase().includes(sessionSearchTerm.toLowerCase()))
                        .map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSessionForVoting(session.id)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                            selectedSessionForVoting === session.id
                              ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white border-blue-600 shadow-lg'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-bold text-base ${
                              selectedSessionForVoting === session.id ? 'text-white' : 'text-gray-900'
                            }`}>
                              {session.title.length > 30 ? session.title.substring(0, 30) + '...' : session.title}
                            </h3>
                            {selectedSessionForVoting === session.id && (
                              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                              selectedSessionForVoting === session.id
                                ? 'bg-white/20 border-white/40 text-white'
                                : statusColors[session.status]
                            }`}>
                              {session.status.toUpperCase()}
                            </span>
                            <span className={`text-xs ${
                              selectedSessionForVoting === session.id ? 'text-white/90' : 'text-gray-600'
                            }`}>
                              {new Date(session.scheduledStartTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {sessions.filter(s => s.title.toLowerCase().includes(sessionSearchTerm.toLowerCase())).length === 0 && sessionSearchTerm && (
                        <div className="col-span-full text-center py-8 bg-white rounded-xl">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-semibold">No sessions match "{sessionSearchTerm}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings Section - Only show if session selected */}
                {selectedSessionForVoting ? (
                  <>
                    <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-2xl p-4">
                      <div>
                        <h3 className="font-bold text-gray-900">Proxy Voting & Vote Splitting</h3>
                        <p className="text-sm text-gray-600">Configuration for {sessions.find(s => s.id === selectedSessionForVoting)?.title}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setVoteSplittingSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                          voteSplittingSettings.enabled
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'bg-gray-300 text-[#464B4B]'
                        }`}
                      >
                        {voteSplittingSettings.enabled ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                        {voteSplittingSettings.enabled ? 'Enabled' : 'Disabled'}
                      </motion.button>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <label className="block text-sm font-bold text-[#464B4B] mb-3 uppercase tracking-wide">
                      Minimum Votes
                    </label>
                    <input
                      type="number"
                      value={voteSplittingSettings.min_proxy_voters}
                      onChange={(e) => setVoteSplittingSettings(prev => ({
                        ...prev,
                        min_proxy_voters: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-[#0072CE] text-lg font-bold"
                      min="1"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <label className="block text-sm font-bold text-[#464B4B] mb-3 uppercase tracking-wide">
                      Maximum Votes
                    </label>
                    <input
                      type="number"
                      value={voteSplittingSettings.max_proxy_voters}
                      onChange={(e) => setVoteSplittingSettings(prev => ({
                        ...prev,
                        max_proxy_voters: parseInt(e.target.value) || 10
                      }))}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-[#0072CE] text-lg font-bold"
                      min="1"
                    />
                  </div>
                </div>

                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveVoteSplitting}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-semibold"
                      >
                        <Save className="h-5 w-5" />
                        Save Settings for {sessions.find(s => s.id === selectedSessionForVoting)?.title}
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select an AGM Session</h3>
                    <p className="text-gray-600">Choose an AGM session above to configure its vote splitting settings</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New AGM Session</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Session Title *</label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})}
                    placeholder="Annual General Meeting 2025"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm({...sessionForm, description: e.target.value})}
                    placeholder="Company-wide AGM for fiscal year 2025"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={sessionForm.scheduledStartTime}
                      onChange={(e) => setSessionForm({...sessionForm, scheduledStartTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={sessionForm.scheduledEndTime}
                      onChange={(e) => setSessionForm({...sessionForm, scheduledEndTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quorum Required (%)</label>
                    <input
                      type="number"
                      value={sessionForm.quorumRequired}
                      onChange={(e) => setSessionForm({...sessionForm, quorumRequired: parseInt(e.target.value) || 50})}
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total Voters</label>
                    <input
                      type="number"
                      value={sessionForm.totalVoters}
                      onChange={(e) => setSessionForm({...sessionForm, totalVoters: parseInt(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowCreateSessionModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-semibold"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Session Modal */}
      <AnimatePresence>
        {showEditSessionModal && editingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
            onClick={() => {
              setShowEditSessionModal(false);
              setEditingSession(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Edit AGM Session</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Session Title *</label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})}
                    placeholder="Q1 2026 Annual General Meeting"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm({...sessionForm, description: e.target.value})}
                    placeholder="Quarterly review and planning session"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={sessionForm.scheduledStartTime}
                      onChange={(e) => setSessionForm({...sessionForm, scheduledStartTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Time *</label>
                    <input
                      type="datetime-local"
                      value={sessionForm.scheduledEndTime}
                      onChange={(e) => setSessionForm({...sessionForm, scheduledEndTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quorum Required (%)</label>
                    <input
                      type="number"
                      value={sessionForm.quorumRequired}
                      onChange={(e) => setSessionForm({...sessionForm, quorumRequired: parseInt(e.target.value) || 50})}
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total Voters</label>
                    <input
                      type="number"
                      value={sessionForm.totalVoters}
                      onChange={(e) => setSessionForm({...sessionForm, totalVoters: parseInt(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowEditSessionModal(false);
                    setEditingSession(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSession}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-semibold"
                >
                  Update Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowAddAdminModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Add Admin/Auditor User</h2>
              
              {/* Toggle between Create New and Select Existing */}
              <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewAdminForm({...newAdminForm, isExistingUser: false, selectedUserId: null})}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    !newAdminForm.isExistingUser
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create New User
                </button>
                <button
                  type="button"
                  onClick={() => setNewAdminForm({...newAdminForm, isExistingUser: true})}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    newAdminForm.isExistingUser
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Select Existing User
                </button>
              </div>
              
              <div className="space-y-4">{!newAdminForm.isExistingUser ? (
                <>
                  {/* Create New User Form */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role *</label>
                    <select
                      value={newAdminForm.role}
                      onChange={(e) => setNewAdminForm({...newAdminForm, role: e.target.value as 'admin' | 'auditor'})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                      placeholder="admin@forvismazars.com"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        value={newAdminForm.firstName}
                        onChange={(e) => setNewAdminForm({...newAdminForm, firstName: e.target.value})}
                        placeholder="John"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={newAdminForm.lastName}
                        onChange={(e) => setNewAdminForm({...newAdminForm, lastName: e.target.value})}
                        placeholder="Doe"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Generated Password *</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newAdminForm.password}
                          readOnly
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl bg-gray-50 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(newAdminForm.password);
                            setPasswordCopied(true);
                            setTimeout(() => setPasswordCopied(false), 2000);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Copy password"
                        >
                          {passwordCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewAdminForm({...newAdminForm, password: generateSecurePassword()})}
                        className="px-4 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                        title="Generate new password"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      🔐 This password will be emailed to the admin. They must change it on first login.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Select Existing User */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Admin/Auditor *</label>
                    <select
                      value={newAdminForm.selectedUserId || ''}
                      onChange={(e) => {
                        const userId = parseInt(e.target.value);
                        const selectedUser = admins.find(u => u.id === userId);
                        if (selectedUser) {
                          setNewAdminForm({
                            ...newAdminForm,
                            selectedUserId: userId,
                            email: selectedUser.email,
                            firstName: selectedUser.firstName || '',
                            lastName: selectedUser.lastName || ''
                          });
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    >
                      <option value="">-- Select an admin/auditor --</option>
                      {admins.map(admin => (
                        <option key={admin.id} value={admin.id}>
                          {admin.firstName} {admin.lastName} ({admin.email}) - {admin.role}
                        </option>
                      ))}
                    </select>
                    {newAdminForm.selectedUserId && (
                      <p className="text-xs text-blue-600 mt-2">
                        ℹ️ This admin will be assigned to the selected session(s)
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Shared: AGM Session Assignment */}
              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Assign to AGM Sessions</label>
                  {sessions.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No AGM sessions available</p>
                      <p className="text-gray-400 text-xs mt-1">Create a session first in the AGM Sessions tab</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3">
                      {sessions.map((session) => {
                        const isSelected = newAdminForm.assignedSessions.includes(session.id);
                        return (
                          <div
                            key={session.id}
                            onClick={() => {
                              const updatedSessions = isSelected
                                ? newAdminForm.assignedSessions.filter(id => id !== session.id)
                                : [...newAdminForm.assignedSessions, session.id];
                              setNewAdminForm({...newAdminForm, assignedSessions: updatedSessions});
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-2 border-blue-500'
                                : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{session.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(session.scheduledStartTime).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusColors[session.status]}`}>
                              {session.status.toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {newAdminForm.assignedSessions.length} session{newAdminForm.assignedSessions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowAddAdminModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAdmin}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-semibold"
                >
                  {newAdminForm.isExistingUser 
                    ? 'Assign to Session' 
                    : `Create ${newAdminForm.role === 'admin' ? 'Admin' : 'Auditor'}`
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Sessions Modal */}
      <AnimatePresence>
        {showAssignSessionModal && selectedAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowAssignSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Assign Sessions</h2>
              <p className="text-gray-600 mb-6">
                Assign <span className="font-semibold">{selectedAdmin.firstName} {selectedAdmin.lastName}</span> to AGM sessions
              </p>
              
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No AGM sessions available</p>
                    <p className="text-gray-400 text-sm mt-2">Create a session first in the AGM Sessions tab</p>
                  </div>
                ) : (
                  sessions.map((session) => {
                    const isAssigned = (adminSessionAssignments[selectedAdmin.id] || []).includes(session.id);
                    return (
                      <motion.div
                        key={session.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isAssigned
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSessionAssignment(session.id);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-gray-900">{session.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${statusColors[session.status]}`}>
                                {session.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">
                              {new Date(session.scheduledStartTime).toLocaleDateString()} - {session.assignedAdmins?.length || 0} admins assigned
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isAssigned
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isAssigned && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowAssignSessionModal(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-semibold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First Login Password Change Modal */}
      <AnimatePresence>
        {showPasswordChangeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Change Your Password</h2>
                <p className="text-gray-600">
                  For security reasons, you must set a new password before continuing.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">New Password *</label>
                  <input
                    type="password"
                    value={newPasswordForm.newPassword}
                    onChange={(e) => setNewPasswordForm({...newPasswordForm, newPassword: e.target.value})}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    value={newPasswordForm.confirmPassword}
                    onChange={(e) => setNewPasswordForm({...newPasswordForm, confirmPassword: e.target.value})}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handlePasswordChange();
                    }}
                  />
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Password requirements:</strong>
                  </p>
                  <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4 list-disc">
                    <li>At least 8 characters long</li>
                    <li>Passwords must match</li>
                    <li>Cannot be the same as your temporary password</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg"
              >
                Set New Password
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for tab buttons
const TabButton = ({ isActive, onClick, icon: Icon, label, badge = 0 }: {
  isActive: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  badge?: number;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
      isActive
        ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
        : 'bg-white text-[#464B4B] hover:bg-gray-50 border-2 border-gray-200'
    }`}
  >
    <Icon className="h-5 w-5" />
    {label}
    {badge > 0 && (
      <span className={`ml-2 px-2 py-1 text-xs rounded-full font-bold ${
        isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
      }`}>
        {badge}
      </span>
    )}
  </motion.button>
);

export default SuperAdminDashboard;
