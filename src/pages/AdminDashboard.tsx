import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  FileText, 
  Shield, 
  Vote, 
  Activity,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Play,
  Square,
  Settings,
  RotateCcw,
  Calendar,
  FileDown,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';
import Header from '../components/Header';
import SetTimerModal from '../components/SetTimerModal';
import * as XLSX from 'xlsx';
import reportService from '../services/reportService';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  employeeId?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  assignedVotes?: number;
}

interface Candidate {
  id: number;
  name: string;
  department: string;
  achievements: string;
  voteCount: number;
  isActive: boolean;
}

interface Resolution {
  id: number;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  status: 'active' | 'closed' | 'pending';
  createdAt: string;
}

interface ProxyGroup {
  id: number;
  proxyHolderName: string;
  proxyHolderId: number;
  type: 'discretionary' | 'instructional' | 'mixed';
  sessionTitle?: string;
  members: Array<{ 
    id: number; 
    proxyAssignmentId: number;
    name: string; 
    voteWeight: number;
    type: 'discretionary' | 'instructional';
    instructionCount: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }>;
  totalVoteWeight: number;
}

interface VoteLog {
  id: number;
  userId: number;
  userName: string;
  voteType: 'candidate' | 'resolution';
  targetId: number;
  targetName: string;
  voteWeight: number;
  timestamp: string;
  isProxyVote: boolean;
  sessionTitle?: string;
  sessionId?: number;
}

interface AuditLog {
  id: number;
  userId?: number | null;
  userName?: string;
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
  ipAddress?: string;
  userAgent?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'candidates' | 'resolutions' | 'proxies' | 'votes' | 'audit' | 'results' | 'reports'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [voteLogs, setVoteLogs] = useState<VoteLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Results tab pagination and filtering
  const [resultsView, setResultsView] = useState<'candidates' | 'resolutions'>('candidates');
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [resultsSearchTerm, setResultsSearchTerm] = useState('');
  const [resultsSortBy, setResultsSortBy] = useState<'votes' | 'name' | 'department'>('votes');
  
  // Vote assignment modal
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedUserForVotes, setSelectedUserForVotes] = useState<User | null>(null);
  const [voteAmount, setVoteAmount] = useState(1);
  const [voteLimits, setVoteLimits] = useState({ min: 1, max: 10, default: 3 });

  // AGM Timer state
  const [showSetTimerModal, setShowSetTimerModal] = useState(false);
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'ended'>('idle');
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<string>('');

  // CRUD Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [selectedInstructions, setSelectedInstructions] = useState<any[]>([]);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editingResolution, setEditingResolution] = useState<Resolution | null>(null);

  // Live quorum and attendance tracking
  const [liveAttendanceCount, setLiveAttendanceCount] = useState(0);
  const [totalEligible] = useState(100);
  const [quorumThreshold] = useState(50);
  const [quorumMet, setQuorumMet] = useState(false);

  useEffect(() => {
    loadData();
    loadTimerStatus();
    // Load reference data once on mount
    loadEmployees();
    loadDepartments();
    loadSessions();
  }, [activeTab]);

  const loadEmployees = async () => {
    try {
      const response = await api.getEmployees();
      if (response.success && response.data) {
        setEmployees(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.getDepartments();
      if (response.success && response.data) {
        setDepartments(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await api.getSessions();
      if (response.success && response.data) {
        setSessions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadTimerStatus = () => {
    const timerStart = localStorage.getItem('agmTimerStart');
    const timerEnd = localStorage.getItem('agmTimerEnd');
    const savedStartDateTime = localStorage.getItem('agmStartDateTime');
    const savedEndTime = localStorage.getItem('agmTimerEndTime');

    if (timerEnd) {
      setTimerStatus('ended');
    } else if (timerStart) {
      setTimerStatus('running');
    } else {
      setTimerStatus('idle');
    }

    if (savedStartDateTime) {
      setStartDateTime(new Date(savedStartDateTime));
    }
    if (savedEndTime) {
      setEndTime(savedEndTime);
    }

    // Listen for timer updates
    const handleTimerUpdate = () => {
      loadTimerStatus();
    };

    window.addEventListener('agmTimerUpdated', handleTimerUpdate);
    return () => window.removeEventListener('agmTimerUpdated', handleTimerUpdate);
  };

  const handleStartTimer = () => {
    const savedStartDateTime = localStorage.getItem('agmStartDateTime');
    const savedEndTime = localStorage.getItem('agmTimerEndTime');

    if (!savedStartDateTime || !savedEndTime) {
      alert('Please set the timer configuration first using the "Set Timer" button.');
      return;
    }

    localStorage.setItem('agmTimerStart', new Date().toISOString());
    localStorage.removeItem('agmTimerEnd');
    setTimerStatus('running');
    window.dispatchEvent(new CustomEvent('agmTimerUpdated'));
  };

  const handleEndTimer = () => {
    if (timerStatus !== 'running') {
      alert('Timer is not currently running.');
      return;
    }

    localStorage.setItem('agmTimerEnd', new Date().toISOString());
    setTimerStatus('ended');
    window.dispatchEvent(new CustomEvent('agmTimerUpdated'));
  };

  const handleResetTimer = () => {
    if (confirm('Are you sure you want to reset the AGM timer? This will clear all timer data.')) {
      localStorage.removeItem('agmTimerStart');
      localStorage.removeItem('agmTimerEnd');
      localStorage.removeItem('agmStartDateTime');
      localStorage.removeItem('agmTimerEndTime');
      setTimerStatus('idle');
      setStartDateTime(null);
      setEndTime('');
      window.dispatchEvent(new CustomEvent('agmTimerUpdated'));
    }
  };

  const formatTimerDisplay = () => {
    if (!startDateTime) return 'Not configured';
    
    const dateStr = startDateTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = startDateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${dateStr} at ${timeStr} → ${endTime}`;
  };

  const loadData = async () => {
    try {
      // Load vote limits from localStorage (set by super admin)
      const savedLimits = localStorage.getItem('voteLimits');
      if (savedLimits) {
        const limits = JSON.parse(savedLimits);
        setVoteLimits({
          min: limits.min_votes_per_user,
          max: limits.max_votes_per_user,
          default: limits.default_votes_per_user
        });
      }

      // Load data from API based on active tab
      switch (activeTab) {
        case 'users':
          await loadUsers();
          break;
        case 'candidates':
          await loadCandidates();
          break;
        case 'resolutions':
          await loadResolutions();
          break;
        case 'proxies':
          await loadProxyGroups();
          break;
        case 'votes':
          await loadVoteLogs();
          break;
        case 'audit':
          await loadAuditLogs();
          break;
        case 'results':
          await loadCandidates();
          await loadResolutions();
          break;
        case 'reports':
          // Reports use data from other tabs
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.success && response.data && Array.isArray(response.data)) {
        // Transform API data to match User interface
        const transformedUsers = response.data.map((user: any) => ({
          id: user.UserID,
          email: user.Email,
          name: `${user.FirstName} ${user.LastName}`,
          employeeId: user.EmployeeID || undefined,
          createdAt: user.CreatedAt,
          lastLogin: user.LastLogin || undefined,
          isActive: user.IsActive,
          assignedVotes: user.AssignedVotes || undefined,
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCandidates = async () => {
    try {
      const response = await api.getCandidates();
      console.log('🔍 Candidates Response:', response);
      
      if (response.success && response.data) {
        // Handle both array and non-array data
        const candidatesArray = Array.isArray(response.data) ? response.data : [];
        
        console.log('🔍 Candidates Array:', candidatesArray);
        console.log('🔍 First Candidate:', candidatesArray[0]);
        
        // Transform API data to match Candidate interface
        const transformedCandidates = candidatesArray.map((candidate: any) => ({
          id: candidate.CandidateID || candidate.id,
          name: candidate.Name || `${candidate.FirstName || ''} ${candidate.LastName || ''}`.trim() || 'Unknown',
          department: candidate.DepartmentName || candidate.Department || 'N/A',
          achievements: candidate.Bio || candidate.NominationReason || candidate.Achievements || '',
          voteCount: candidate.TotalVotesReceived || candidate.VoteCount || 0,
          isActive: candidate.Status === 'active' || candidate.IsActive === true,
        }));
        
        console.log('✅ Transformed Candidates:', transformedCandidates);
        setCandidates(transformedCandidates);
      } else {
        console.warn('⚠️ Candidates response not successful or no data:', response);
      }
    } catch (error) {
      console.error('❌ Error loading candidates:', error);
    }
  };

  const loadResolutions = async () => {
    try {
      const response = await api.getResolutions();
      console.log('🔍 Resolutions Response:', response);
      
      if (response.success && response.data) {
        // Handle both array and non-array data
        const resolutionsArray = Array.isArray(response.data) ? response.data : [];
        
        console.log('🔍 Resolutions Array:', resolutionsArray);
        console.log('🔍 First Resolution:', resolutionsArray[0]);
        
        // Transform API data to match Resolution interface
        const transformedResolutions = resolutionsArray.map((resolution: any) => ({
          id: resolution.ResolutionID || resolution.id,
          title: resolution.ResolutionTitle || resolution.Title || resolution.title || 'Untitled',
          description: resolution.Description || resolution.description || '',
          yesVotes: resolution.TotalYesVotes || resolution.YesVotes || resolution.yesVotes || 0,
          noVotes: resolution.TotalNoVotes || resolution.NoVotes || resolution.noVotes || 0,
          abstainVotes: resolution.TotalAbstainVotes || resolution.AbstainVotes || resolution.abstainVotes || 0,
          status: resolution.Status?.toLowerCase() || resolution.status?.toLowerCase() || 'pending',
          createdAt: resolution.CreatedAt || resolution.createdAt || new Date().toISOString(),
        }));
        
        console.log('✅ Transformed Resolutions:', transformedResolutions);
        setResolutions(transformedResolutions);
      } else {
        console.warn('⚠️ Resolutions response not successful or no data:', response);
      }
    } catch (error) {
      console.error('❌ Error loading resolutions:', error);
    }
  };

  const loadProxyGroups = async () => {
    try {
      const response = await api.getProxyAssignments();
      console.log('🔍 Proxy Assignments Response:', response);
      
      if (response.success && response.data) {
        const proxyArray = Array.isArray(response.data) ? response.data : [];
        console.log('🔍 Proxy Array:', proxyArray);
        
        // Group by proxy holder (the person who will vote on behalf of others)
        const groupedByHolder = proxyArray.reduce((acc: any, proxy: any) => {
          const holderId = proxy.ProxyUserID;
          const holderName = `${proxy.ProxyFirstName || ''} ${proxy.ProxyLastName || ''}`.trim() || 'Unknown';
          
          if (!acc[holderId]) {
            acc[holderId] = {
              id: holderId,
              proxyHolderName: holderName,
              proxyHolderId: holderId,
              type: 'mixed', // Will determine based on members
              sessionTitle: proxy.SessionTitle || 'No Session',
              members: [],
              totalVoteWeight: 0
            };
          }
          
          // Add this principal to the proxy holder's members list
          acc[holderId].members.push({
            id: proxy.GrantorUserID,
            proxyAssignmentId: proxy.ProxyID,
            name: `${proxy.GrantorFirstName || ''} ${proxy.GrantorLastName || ''}`.trim() || 'Unknown',
            voteWeight: 1, // Each person = 1 vote
            type: (proxy.ProxyType || 'discretionary').toLowerCase(),
            instructionCount: proxy.InstructionCount || 0,
            startDate: proxy.StartDate,
            endDate: proxy.EndDate,
            isActive: proxy.IsActive
          });
          
          acc[holderId].totalVoteWeight += 1;
          
          return acc;
        }, {});
        
        // Convert to array and determine overall type
        const transformedProxies = Object.values(groupedByHolder).map((group: any) => {
          const hasInstructional = group.members.some((m: any) => m.type === 'instructional');
          const hasDiscretionary = group.members.some((m: any) => m.type === 'discretionary');
          
          return {
            ...group,
            type: hasInstructional && hasDiscretionary ? 'mixed' : 
                  hasInstructional ? 'instructional' : 'discretionary'
          };
        });
        
        console.log('✅ Transformed Proxy Groups:', transformedProxies);
        setProxyGroups(transformedProxies);
      } else {
        console.warn('⚠️ Proxy groups response not successful or no data:', response);
        setProxyGroups([]);
      }
    } catch (error) {
      console.error('❌ Error loading proxy groups:', error);
      setProxyGroups([]);
    }
  };

  const loadVoteLogs = async () => {
    try {
      const response = await api.getVoteLogs();
      console.log('🔍 Vote Logs Response:', response);
      
      if (response.success && response.data) {
        const votesArray = Array.isArray(response.data) ? response.data : [];
        console.log('🔍 Vote Logs Array:', votesArray);
        console.log('🔍 First Vote Log:', votesArray[0]);
        
        // Transform API data to match VoteLog interface
        const transformedLogs = votesArray.map((vote: any) => ({
          id: vote.VoteID || vote.id,
          userId: vote.VoterUserID || vote.UserID || vote.userId,
          userName: vote.VoterName || vote.UserName || `${vote.FirstName || ''} ${vote.LastName || ''}`.trim() || 'Unknown',
          voteType: (vote.VoteType?.toLowerCase() === 'candidate' ? 'candidate' : 'resolution') as 'candidate' | 'resolution',
          targetId: vote.EntityID || vote.CandidateID || vote.ResolutionID || vote.entityId,
          targetName: vote.EntityName || vote.CandidateName || vote.ResolutionTitle || vote.entityName || 'Unknown',
          voteWeight: vote.VotesAllocated || vote.VoteWeight || vote.voteWeight || 1,
          timestamp: vote.VotedAt || vote.CreatedAt || vote.timestamp || new Date().toISOString(),
          isProxyVote: vote.IsProxyVote || vote.isProxyVote || false,
          sessionTitle: vote.SessionTitle || vote.sessionTitle || 'Unknown Session',
          sessionId: vote.SessionID || vote.sessionId
        }));
        
        console.log('✅ Transformed Vote Logs:', transformedLogs);
        setVoteLogs(transformedLogs);
      } else {
        console.warn('⚠️ Vote logs response not successful or no data:', response);
        setVoteLogs([]);
      }
    } catch (error) {
      console.error('❌ Error loading vote logs:', error);
      setVoteLogs([]);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await api.getAuditLogs();
      if (response.success && response.data && Array.isArray(response.data)) {
        // Transform API data to match AuditLog interface
        const transformedLogs = response.data.map((log: any) => ({
          id: log.LogID,
          userId: log.UserID || null,
          userName: log.UserID ? `${log.FirstName} ${log.LastName}` : 'System',
          action: log.Action,
          description: log.Details || log.Description,
          timestamp: log.Timestamp,
          status: log.Status || 'success',
          ipAddress: log.IPAddress || undefined,
          userAgent: log.UserAgent || undefined,
        }));
        setAuditLogs(transformedLogs);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  // ==================== USER CRUD OPERATIONS ====================
  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const response = await api.createUser(userData);
      if (response.success) {
        await loadUsers(); // Reload users to get the server-generated ID
        setShowUserModal(false);
      } else {
        alert(response.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async (userId: number, userData: Partial<User>) => {
    try {
      const response = await api.updateUser(userId, userData);
      if (response.success) {
        await loadUsers(); // Reload users to get updated data
        setEditingUser(null);
        setShowUserModal(false);
      } else {
        alert(response.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await api.deleteUser(userId);
        if (response.success) {
          await loadUsers(); // Reload users to reflect deletion
        } else {
          alert(response.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        const response = await api.toggleUserStatus(userId, !user.isActive);
        if (response.success) {
          await loadUsers(); // Reload users to reflect status change
        } else {
          alert(response.message || 'Failed to toggle user status');
        }
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to toggle user status');
    }
  };

  // ==================== CANDIDATE CRUD OPERATIONS ====================
  const handleAddCandidate = async (candidateData: Partial<Candidate>) => {
    try {
      const response = await api.createCandidate(candidateData);
      if (response.success) {
        await loadCandidates();
        setShowCandidateModal(false);
      } else {
        alert(response.message || 'Failed to create candidate');
      }
    } catch (error) {
      console.error('Error creating candidate:', error);
      alert('Failed to create candidate');
    }
  };

  const handleUpdateCandidate = async (candidateId: number, candidateData: Partial<Candidate>) => {
    try {
      const response = await api.updateCandidate(candidateId, candidateData);
      if (response.success) {
        await loadCandidates();
        setEditingCandidate(null);
        setShowCandidateModal(false);
      } else {
        alert(response.message || 'Failed to update candidate');
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      alert('Failed to update candidate');
    }
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      try {
        const response = await api.deleteCandidate(candidateId);
        if (response.success) {
          await loadCandidates();
        } else {
          alert(response.message || 'Failed to delete candidate');
        }
      } catch (error) {
        console.error('Error deleting candidate:', error);
        alert('Failed to delete candidate');
      }
    }
  };

  const handleToggleCandidateStatus = async (candidateId: number) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        const newStatus = candidate.isActive ? 'withdrawn' : 'active';
        const response = await api.toggleCandidateStatus(candidateId, newStatus);
        if (response.success) {
          await loadCandidates();
        } else {
          alert(response.message || 'Failed to toggle candidate status');
        }
      }
    } catch (error) {
      console.error('Error toggling candidate status:', error);
      alert('Failed to toggle candidate status');
    }
  };

  // ==================== RESOLUTION CRUD OPERATIONS ====================
  const handleAddResolution = async (resolutionData: Partial<Resolution>) => {
    try {
      const response = await api.createResolution(resolutionData);
      if (response.success) {
        await loadResolutions();
        setShowResolutionModal(false);
      } else {
        alert(response.message || 'Failed to create resolution');
      }
    } catch (error) {
      console.error('Error creating resolution:', error);
      alert('Failed to create resolution');
    }
  };

  const handleUpdateResolution = async (resolutionId: number, resolutionData: Partial<Resolution>) => {
    try {
      const response = await api.updateResolution(resolutionId, resolutionData);
      if (response.success) {
        await loadResolutions();
        setEditingResolution(null);
        setShowResolutionModal(false);
      } else {
        alert(response.message || 'Failed to update resolution');
      }
    } catch (error) {
      console.error('Error updating resolution:', error);
      alert('Failed to update resolution');
    }
  };

  const handleDeleteResolution = async (resolutionId: number) => {
    if (confirm('Are you sure you want to delete this resolution?')) {
      try {
        const response = await api.deleteResolution(resolutionId);
        if (response.success) {
          await loadResolutions();
        } else {
          alert(response.message || 'Failed to delete resolution');
        }
      } catch (error) {
        console.error('Error deleting resolution:', error);
        alert('Failed to delete resolution');
      }
    }
  };

  const handleChangeResolutionStatus = async (resolutionId: number, status: 'active' | 'closed' | 'pending') => {
    try {
      const response = await api.updateResolutionStatus(resolutionId, status);
      if (response.success) {
        await loadResolutions();
      } else {
        alert(response.message || 'Failed to update resolution status');
      }
    } catch (error) {
      console.error('Error updating resolution status:', error);
      alert('Failed to update resolution status');
    }
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'candidates', label: 'Candidates', icon: UserCheck, count: candidates.length },
    { id: 'resolutions', label: 'Resolutions', icon: FileText, count: resolutions.length },
    { id: 'proxies', label: 'Proxy Groups', icon: Shield, count: proxyGroups.length },
    { id: 'votes', label: 'Vote Logs', icon: Vote, count: voteLogs.length },
    { id: 'results', label: 'Voting Results', icon: BarChart3, count: candidates.length + resolutions.length },
    { id: 'reports', label: 'AGM Reports', icon: FileDown, count: 0 },
    { id: 'audit', label: 'Audit Logs', icon: Activity, count: auditLogs.length },
  ];

  const exportData = () => {
    let data: any[] = [];
    let filename = '';

    switch (activeTab) {
      case 'users':
        data = users;
        filename = 'users';
        break;
      case 'candidates':
        data = candidates;
        filename = 'candidates';
        break;
      case 'resolutions':
        data = resolutions;
        filename = 'resolutions';
        break;
      case 'proxies':
        data = proxyGroups;
        filename = 'proxy-groups';
        break;
      case 'votes':
        data = voteLogs;
        filename = 'vote-logs';
        break;
      case 'results':
        // Export combined results data as array
        data = [
          {
            section: 'Candidates',
            results: candidates.map(c => ({
              name: c.name,
              department: c.department,
              voteCount: c.voteCount,
              percentage: candidates.reduce((sum, cand) => sum + cand.voteCount, 0) > 0 
                ? ((c.voteCount / candidates.reduce((sum, cand) => sum + cand.voteCount, 0)) * 100).toFixed(1) 
                : 0
            }))
          },
          {
            section: 'Resolutions',
            results: resolutions.map(r => ({
              title: r.title,
              totalVotes: r.yesVotes + r.noVotes + r.abstainVotes,
              yesVotes: r.yesVotes,
              noVotes: r.noVotes,
              abstainVotes: r.abstainVotes,
              yesPercentage: (r.yesVotes + r.noVotes + r.abstainVotes) > 0 
                ? ((r.yesVotes / (r.yesVotes + r.noVotes + r.abstainVotes)) * 100).toFixed(1) 
                : 0,
              status: r.status
            }))
          }
        ];
        filename = 'voting-results';
        break;
      case 'audit':
        data = auditLogs;
        filename = 'audit-logs';
        break;
    }

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      searchFields.some(field =>
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // ==================== TAMPER-EVIDENT AUDIT LOG FUNCTIONS ====================
  const generateHash = (data: string): string => {
    // Simple hash function for demonstration (in production, use crypto API)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  };

  const addTamperEvidentHashes = (logs: AuditLog[]) => {
    const enhancedLogs = logs.map((log, index) => {
      const dataHash = generateHash(JSON.stringify(log));
      const previousHash = index > 0 ? generateHash(JSON.stringify(logs[index - 1])) : '0000000000000000';
      return {
        ...log,
        dataHash,
        previousHash
      };
    });
    return enhancedLogs;
  };

  const verifyLogIntegrity = (): boolean => {
    const enhancedLogs = addTamperEvidentHashes(auditLogs);
    for (let i = 1; i < enhancedLogs.length; i++) {
      const expectedPrevHash = enhancedLogs[i - 1].dataHash;
      if (enhancedLogs[i].previousHash !== expectedPrevHash) {
        return false;
      }
    }
    return true;
  };

  // ==================== EXCEL EXPORT FUNCTIONS ====================
  const exportAuditLogsToExcel = () => {
    const enhancedLogs = addTamperEvidentHashes(auditLogs);
    const data = enhancedLogs.map(log => ({
      'Log ID': log.id,
      'Timestamp': log.timestamp,
      'User ID': log.userId || 'N/A',
      'User Name': log.userName || 'System',
      'Action': log.action,
      'Description': log.description,
      'Status': log.status,
      'IP Address': log.ipAddress || 'N/A',
      'Data Hash': log.dataHash,
      'Previous Hash': log.previousHash,
      'Integrity': verifyLogIntegrity() ? 'VERIFIED ✓' : 'TAMPERED ✗'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    
    // Auto-size columns
    const maxWidth = data.reduce((w, r) => Math.max(w, String(r['Description']).length), 10);
    ws['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, 
      { wch: 20 }, { wch: maxWidth }, { wch: 10 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }
    ];

    XLSX.writeFile(wb, `AuditLogs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportLiveAttendanceToExcel = () => {
    const attendance = JSON.parse(localStorage.getItem('liveAttendance') || '[]');
    const data = attendance.map((record: any) => ({
      'User ID': record.userId,
      'User Name': record.userName,
      'Check-in Time': new Date(record.checkedInAt).toLocaleString(),
      'IP Address': record.ipAddress,
      'Status': record.status.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Live Attendance');

    // Add quorum summary
    const quorumPercentage = ((liveAttendanceCount / totalEligible) * 100).toFixed(1);
    XLSX.utils.sheet_add_json(ws, [
      {},
      { 'User ID': 'SUMMARY' },
      { 'User ID': 'Total Eligible', 'User Name': totalEligible },
      { 'User ID': 'Present', 'User Name': liveAttendanceCount },
      { 'User ID': 'Attendance %', 'User Name': `${quorumPercentage}%` },
      { 'User ID': 'Quorum Threshold', 'User Name': `${quorumThreshold}%` },
      { 'User ID': 'Quorum Status', 'User Name': quorumMet ? 'MET ✓' : 'NOT MET ✗' }
    ], { origin: -1, skipHeader: true });

    XLSX.writeFile(wb, `Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportFullAuditReport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Audit Logs
    const enhancedLogs = addTamperEvidentHashes(auditLogs);
    const logsData = enhancedLogs.map(log => ({
      'Log ID': log.id,
      'Timestamp': log.timestamp,
      'User': log.userName || 'System',
      'Action': log.action,
      'Description': log.description,
      'Status': log.status,
      'Data Hash': log.dataHash
    }));
    const logsWs = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, logsWs, 'Audit Logs');

    // Sheet 2: Vote Logs
    const votesData = voteLogs.map(vote => ({
      'Vote ID': vote.id,
      'User': vote.userName,
      'Type': vote.voteType,
      'Target': vote.targetName,
      'Weight': vote.voteWeight,
      'Proxy Vote': vote.isProxyVote ? 'Yes' : 'No',
      'Timestamp': vote.timestamp
    }));
    const votesWs = XLSX.utils.json_to_sheet(votesData);
    XLSX.utils.book_append_sheet(wb, votesWs, 'Vote Logs');

    // Sheet 3: Summary
    const summary = [
      { 'Metric': 'Report Type', 'Value': 'Full Admin Audit Report' },
      { 'Metric': 'Generated Date', 'Value': new Date().toLocaleString() },
      {},
      { 'Metric': 'Total Users', 'Value': users.length },
      { 'Metric': 'Active Users', 'Value': users.filter(u => u.isActive).length },
      { 'Metric': 'Total Candidates', 'Value': candidates.length },
      { 'Metric': 'Active Candidates', 'Value': candidates.filter(c => c.isActive).length },
      { 'Metric': 'Total Resolutions', 'Value': resolutions.length },
      { 'Metric': 'Active Resolutions', 'Value': resolutions.filter(r => r.status === 'active').length },
      {},
      { 'Metric': 'Total Audit Logs', 'Value': auditLogs.length },
      { 'Metric': 'Successful Actions', 'Value': auditLogs.filter(l => l.status === 'success').length },
      { 'Metric': 'Failed Actions', 'Value': auditLogs.filter(l => l.status === 'failed').length },
      { 'Metric': 'Total Votes Cast', 'Value': voteLogs.length },
      { 'Metric': 'Proxy Votes', 'Value': voteLogs.filter(v => v.isProxyVote).length },
      {},
      { 'Metric': 'Log Integrity Check', 'Value': verifyLogIntegrity() ? 'VERIFIED ✓' : 'TAMPERED ✗' }
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    XLSX.writeFile(wb, `FullAdminReport_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Load live attendance on mount
  useEffect(() => {
    const attendance = JSON.parse(localStorage.getItem('liveAttendance') || '[]');
    const count = attendance.filter((r: any) => r.status === 'present' || r.status === 'proxy').length;
    setLiveAttendanceCount(count);
    setQuorumMet((count / totalEligible) * 100 >= quorumThreshold);

    // Update every 5 seconds
    const interval = setInterval(() => {
      const attendance = JSON.parse(localStorage.getItem('liveAttendance') || '[]');
      const count = attendance.filter((r: any) => r.status === 'present' || r.status === 'proxy').length;
      setLiveAttendanceCount(count);
      setQuorumMet((count / totalEligible) * 100 >= quorumThreshold);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalEligible, quorumThreshold]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#464B4B] mb-2">Admin Dashboard</h1>
              <p className="text-[#464B4B]/70">Comprehensive system overview and management</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/approvals')}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Admin Approvals</span>
            </motion.button>
          </div>
        </motion.div>

        {/* AGM Timer Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#464B4B] mb-1">AGM Timer Controls</h2>
              <p className="text-[#464B4B]/70">Manage voting session timeframe</p>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold ${
              timerStatus === 'running' 
                ? 'bg-green-100 text-green-700' 
                : timerStatus === 'ended'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              <Clock className="h-5 w-5" />
              <span>
                {timerStatus === 'running' ? 'Active' : timerStatus === 'ended' ? 'Ended' : 'Idle'}
              </span>
            </div>
          </div>

          {/* Timer Info Display */}
          {startDateTime && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-semibold">Configured Schedule</p>
                  <p className="text-blue-900 font-bold">{formatTimerDisplay()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Start Timer Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartTimer}
              disabled={timerStatus === 'running'}
              className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                timerStatus === 'running'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl'
              }`}
            >
              <Play className="h-5 w-5" />
              <span>Start Timer</span>
            </motion.button>

            {/* End Timer Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEndTimer}
              disabled={timerStatus !== 'running'}
              className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                timerStatus !== 'running'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-xl'
              }`}
            >
              <Square className="h-5 w-5" />
              <span>End Timer</span>
            </motion.button>

            {/* Set Timer Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSetTimerModal(true)}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              <Settings className="h-5 w-5" />
              <span>Set Timer</span>
            </motion.button>

            {/* Reset Timer Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResetTimer}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Reset</span>
            </motion.button>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">How to use AGM Timer:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li><strong>Set Timer:</strong> Configure the start date/time and end time</li>
                  <li><strong>Start Timer:</strong> Activate the voting session (requires timer to be set first)</li>
                  <li><strong>End Timer:</strong> Manually end the session before scheduled time</li>
                  <li><strong>Reset:</strong> Clear all timer data and start fresh</li>
                </ul>
                <p className="mt-2 text-amber-900 font-semibold">
                  ⚠️ Users can only vote when the timer is active!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <tab.icon className="h-5 w-5 text-[#0072CE]" />
                <span className="text-2xl font-bold text-[#464B4B]">{tab.count}</span>
              </div>
              <p className="text-sm text-[#464B4B]/70">{tab.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                    : 'text-[#464B4B] hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              />
            </div>
            {(activeTab === 'users' || activeTab === 'candidates' || activeTab === 'resolutions') && (
              <button
                onClick={() => {
                  if (activeTab === 'users') {
                    setEditingUser(null);
                    setShowUserModal(true);
                  } else if (activeTab === 'candidates') {
                    setEditingCandidate(null);
                    setShowCandidateModal(true);
                  } else if (activeTab === 'resolutions') {
                    setEditingResolution(null);
                    setShowResolutionModal(true);
                  }
                }}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <span className="text-xl">➕</span>
                <span>Add New</span>
              </button>
            )}
            <button
              onClick={exportData}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Employee ID</th>
                    <th className="px-6 py-4 text-left">Assigned Votes</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterData(users, ['name', 'email', 'employeeId']).map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-semibold text-[#464B4B]">{user.id}</td>
                      <td className="px-6 py-4 text-[#464B4B] font-semibold">{user.name}</td>
                      <td className="px-6 py-4 text-[#464B4B]">{user.email}</td>
                      <td className="px-6 py-4 text-[#464B4B]">{user.employeeId || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                            user.assignedVotes 
                              ? 'bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {user.assignedVotes ? `${user.assignedVotes} vote${user.assignedVotes !== 1 ? 's' : ''}` : 'Not assigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              user.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.isActive ? '⏸️' : '▶️'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedUserForVotes(user);
                              setVoteAmount(user.assignedVotes || voteLimits.default);
                              setShowVoteModal(true);
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-200 transition-colors text-xs font-semibold"
                          >
                            🗳️ Votes
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserModal(true);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-semibold"
                          >
                            ✏️ Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Department</th>
                    <th className="px-6 py-4 text-left">Achievements</th>
                    <th className="px-6 py-4 text-left">Vote Count</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterData(candidates, ['name', 'department', 'achievements']).map((candidate, index) => (
                    <tr key={candidate.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-semibold text-[#464B4B]">{candidate.id}</td>
                      <td className="px-6 py-4 text-[#464B4B] font-semibold">{candidate.name}</td>
                      <td className="px-6 py-4 text-[#464B4B]">{candidate.department}</td>
                      <td className="px-6 py-4 text-[#464B4B]">{candidate.achievements}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {candidate.voteCount} votes
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          candidate.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {candidate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleCandidateStatus(candidate.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              candidate.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {candidate.isActive ? '⏸️' : '▶️'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingCandidate(candidate);
                              setShowCandidateModal(true);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-semibold"
                          >
                            ✏️ Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'resolutions' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">Title</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Yes</th>
                    <th className="px-6 py-4 text-left">No</th>
                    <th className="px-6 py-4 text-left">Abstain</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Created</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterData(resolutions, ['title', 'description']).map((resolution, index) => (
                    <tr key={resolution.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-semibold text-[#464B4B]">{resolution.id}</td>
                      <td className="px-6 py-4 text-[#464B4B] font-semibold">{resolution.title}</td>
                      <td className="px-6 py-4 text-[#464B4B] text-sm">{resolution.description}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold">
                          {resolution.yesVotes}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold">
                          {resolution.noVotes}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold">
                          {resolution.abstainVotes}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          resolution.status === 'active' ? 'bg-green-100 text-green-700' :
                          resolution.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {resolution.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#464B4B]">{resolution.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={resolution.status}
                            onChange={(e) => handleChangeResolutionStatus(resolution.id, e.target.value as any)}
                            className="px-2 py-1 border-2 border-slate-200 rounded-lg text-xs font-semibold focus:border-[#0072CE] focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                          </select>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingResolution(resolution);
                              setShowResolutionModal(true);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-semibold"
                          >
                            ✏️
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteResolution(resolution.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'proxies' && (
            <div className="p-6 space-y-6">
              {filterData(proxyGroups, ['proxyHolderName']).map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6"
                >
                  {/* Proxy Holder Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#464B4B]">{group.proxyHolderName}</h3>
                        <p className="text-sm text-[#464B4B]/70">Proxy Holder • {group.sessionTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">{group.totalVoteWeight}</p>
                      <p className="text-xs text-[#464B4B]/70">Total Votes</p>
                    </div>
                  </div>

                  {/* Type Badges */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      group.type === 'discretionary' ? 'bg-blue-100 text-blue-700' : 
                      group.type === 'instructional' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {group.type === 'mixed' ? '🔀 MIXED' : group.type.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      👥 {group.members.length} {group.members.length === 1 ? 'Principal' : 'Principals'}
                    </span>
                  </div>

                  {/* Principals List */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#464B4B] mb-2">
                      Voting on behalf of:
                    </p>
                    {group.members.map((member: any) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {member.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#464B4B] font-semibold">{member.name}</p>
                            <div className="flex items-center space-x-2 mt-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                member.type === 'instructional' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {member.type}
                              </span>
                              {member.instructionCount > 0 && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                                  📋 {member.instructionCount} instruction{member.instructionCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              {!member.isActive && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                  Expired
                                </span>
                              )}
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                {member.voteWeight} vote{member.voteWeight !== 1 ? 's' : ''}
                              </span>
                              {member.type === 'instructional' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={async () => {
                                    try {
                                      console.log('🔍 Fetching instructions for ProxyID:', member.proxyAssignmentId);
                                      const instructionsResponse = await api.getProxyInstructions(member.proxyAssignmentId);
                                      console.log('📦 Instructions Response:', instructionsResponse);
                                      
                                      const instructions = instructionsResponse.success && instructionsResponse.data 
                                        ? (Array.isArray(instructionsResponse.data) ? instructionsResponse.data : [])
                                        : [];
                                      
                                      console.log('✅ Parsed Instructions:', instructions);
                                      console.log('👤 Member Name:', member.name);
                                      
                                      setSelectedInstructions(instructions);
                                      setSelectedMemberName(member.name);
                                      setShowInstructionsModal(true);
                                    } catch (error) {
                                      console.error('❌ Error fetching instructions:', error);
                                      setSelectedInstructions([]);
                                      setSelectedMemberName(member.name);
                                      setShowInstructionsModal(true);
                                    }
                                  }}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-semibold"
                                >
                                  View Instructions{member.instructionCount > 0 ? ` (${member.instructionCount})` : ''}
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Footer */}
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#464B4B]/70">
                        {group.members.filter((m: any) => m.type === 'instructional').length} instructional • {' '}
                        {group.members.filter((m: any) => m.type === 'discretionary').length} discretionary
                      </span>
                      <span className="text-[#464B4B]/70">
                        {group.members.filter((m: any) => m.isActive).length} active • {' '}
                        {group.members.filter((m: any) => !m.isActive).length} expired
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {proxyGroups.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-semibold">No proxy assignments found</p>
                  <p className="text-gray-400 text-sm">Proxy assignments will appear here once created</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'votes' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">User</th>
                    <th className="px-6 py-4 text-left">AGM Session</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Target</th>
                    <th className="px-6 py-4 text-left">Vote Weight</th>
                    <th className="px-6 py-4 text-left">Proxy Vote</th>
                    <th className="px-6 py-4 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filterData(voteLogs, ['userName', 'targetName', 'sessionTitle']).map((log, index) => (
                    <tr key={log.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 font-semibold text-[#464B4B]">{log.id}</td>
                      <td className="px-6 py-4 text-[#464B4B]">{log.userName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {log.sessionTitle || 'Unknown Session'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.voteType === 'candidate' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.voteType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#464B4B] font-semibold">{log.targetName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold">
                          {log.voteWeight}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.isProxyVote ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#464B4B] text-sm">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="p-6">
              {/* Results Tab Controls */}
              <div className="mb-6 space-y-4">
                {/* View Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => {
                        setResultsView('candidates');
                        setResultsPage(1);
                        setResultsSearchTerm('');
                      }}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        resultsView === 'candidates'
                          ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                          : 'text-[#464B4B] hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Candidates</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {candidates.length}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setResultsView('resolutions');
                        setResultsPage(1);
                        setResultsSearchTerm('');
                      }}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        resultsView === 'resolutions'
                          ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                          : 'text-[#464B4B] hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Resolutions</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {resolutions.filter(r => r.status === 'active').length}
                        </span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <select
                      value={resultsPerPage}
                      onChange={(e) => {
                        setResultsPerPage(Number(e.target.value));
                        setResultsPage(1);
                      }}
                      className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none font-medium text-sm"
                    >
                      <option value={10}>Show 10</option>
                      <option value={25}>Show 25</option>
                      <option value={50}>Show 50</option>
                      <option value={100}>Show 100</option>
                      <option value={500}>Show 500</option>
                    </select>
                  </div>
                </div>

                {/* Search and Sort */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={resultsSearchTerm}
                      onChange={(e) => {
                        setResultsSearchTerm(e.target.value);
                        setResultsPage(1);
                      }}
                      placeholder={resultsView === 'candidates' ? 'Search candidates...' : 'Search resolutions...'}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                    />
                  </div>
                  {resultsView === 'candidates' && (
                    <select
                      value={resultsSortBy}
                      onChange={(e) => setResultsSortBy(e.target.value as any)}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none font-medium"
                    >
                      <option value="votes">Sort by Votes</option>
                      <option value="name">Sort by Name</option>
                      <option value="department">Sort by Department</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Candidate Results Table */}
              {resultsView === 'candidates' && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {(() => {
                    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
                    let filteredCandidates = candidates.filter(c =>
                      c.name.toLowerCase().includes(resultsSearchTerm.toLowerCase()) ||
                      c.department.toLowerCase().includes(resultsSearchTerm.toLowerCase())
                    );

                    // Sort candidates
                    if (resultsSortBy === 'votes') {
                      filteredCandidates = filteredCandidates.sort((a, b) => b.voteCount - a.voteCount);
                    } else if (resultsSortBy === 'name') {
                      filteredCandidates = filteredCandidates.sort((a, b) => a.name.localeCompare(b.name));
                    } else if (resultsSortBy === 'department') {
                      filteredCandidates = filteredCandidates.sort((a, b) => a.department.localeCompare(b.department));
                    }

                    const totalPages = Math.ceil(filteredCandidates.length / resultsPerPage);
                    const startIndex = (resultsPage - 1) * resultsPerPage;
                    const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + resultsPerPage);

                    return (
                      <>
                        {/* Summary Stats */}
                        <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] p-6 text-white">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <div className="text-3xl font-bold">{candidates.length}</div>
                              <div className="text-white/80 text-sm">Total Candidates</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold">{totalVotes.toLocaleString()}</div>
                              <div className="text-white/80 text-sm">Total Votes Cast</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold">
                                {totalVotes > 0 ? (totalVotes / candidates.length).toFixed(1) : '0'}
                              </div>
                              <div className="text-white/80 text-sm">Average Votes/Candidate</div>
                            </div>
                          </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Candidate</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Department</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Votes</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Vote Share</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Visual</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {paginatedCandidates.map((candidate, idx) => {
                                const globalRank = startIndex + idx + 1;
                                const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
                                
                                return (
                                  <tr key={candidate.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                                        globalRank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                        globalRank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                                        globalRank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                        'bg-gradient-to-r from-[#0072CE] to-[#171C8F]'
                                      }`}>
                                        #{globalRank}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="font-bold text-[#464B4B]">{candidate.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                        {candidate.department}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-2xl font-bold text-[#0072CE]">
                                        {candidate.voteCount.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-lg font-bold text-[#464B4B]">
                                        {percentage.toFixed(2)}%
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="w-32">
                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-[#0072CE] to-[#171C8F]"
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {filteredCandidates.length === 0 && (
                          <div className="text-center py-16">
                            <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-[#464B4B]/70 text-lg">No candidates found matching your search</p>
                          </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-[#464B4B]">
                                Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                                <span className="font-bold">{Math.min(startIndex + resultsPerPage, filteredCandidates.length)}</span> of{' '}
                                <span className="font-bold">{filteredCandidates.length}</span> candidates
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setResultsPage(Math.max(1, resultsPage - 1))}
                                  disabled={resultsPage === 1}
                                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                  Previous
                                </button>
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                      pageNum = i + 1;
                                    } else if (resultsPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (resultsPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = resultsPage - 2 + i;
                                    }
                                    
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() => setResultsPage(pageNum)}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                          resultsPage === pageNum
                                            ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white'
                                            : 'bg-white border-2 border-gray-300 text-[#464B4B] hover:bg-gray-50'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  onClick={() => setResultsPage(Math.min(totalPages, resultsPage + 1))}
                                  disabled={resultsPage === totalPages}
                                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Resolution Results Table */}
              {resultsView === 'resolutions' && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {(() => {
                    const activeResolutions = resolutions.filter(r => r.status === 'active');
                    const filteredResolutions = activeResolutions.filter(r =>
                      r.title.toLowerCase().includes(resultsSearchTerm.toLowerCase()) ||
                      r.description.toLowerCase().includes(resultsSearchTerm.toLowerCase())
                    );

                    const totalPages = Math.ceil(filteredResolutions.length / resultsPerPage);
                    const startIndex = (resultsPage - 1) * resultsPerPage;
                    const paginatedResolutions = filteredResolutions.slice(startIndex, startIndex + resultsPerPage);
                    
                    const totalResolutionVotes = filteredResolutions.reduce((sum, r) => 
                      sum + r.yesVotes + r.noVotes + r.abstainVotes, 0
                    );
                    const passingCount = filteredResolutions.filter(r => {
                      const total = r.yesVotes + r.noVotes + r.abstainVotes;
                      return total > 0 && (r.yesVotes / total) > 0.5;
                    }).length;

                    return (
                      <>
                        {/* Summary Stats */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-6 text-white">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <div className="text-3xl font-bold">{activeResolutions.length}</div>
                              <div className="text-white/80 text-sm">Active Resolutions</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold">{totalResolutionVotes.toLocaleString()}</div>
                              <div className="text-white/80 text-sm">Total Votes Cast</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold">
                                {passingCount} / {activeResolutions.length}
                              </div>
                              <div className="text-white/80 text-sm">Passing Resolutions</div>
                            </div>
                          </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Resolution</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Total Votes</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">For</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Against</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Abstain</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#464B4B] uppercase">Visual</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {paginatedResolutions.map((resolution) => {
                                const totalVotes = resolution.yesVotes + resolution.noVotes + resolution.abstainVotes;
                                const yesPercentage = totalVotes > 0 ? (resolution.yesVotes / totalVotes) * 100 : 0;
                                const noPercentage = totalVotes > 0 ? (resolution.noVotes / totalVotes) * 100 : 0;
                                const abstainPercentage = totalVotes > 0 ? (resolution.abstainVotes / totalVotes) * 100 : 0;
                                const isPassing = yesPercentage > 50;

                                return (
                                  <tr key={resolution.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="font-mono font-bold text-[#464B4B]">
                                        #{resolution.id}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="max-w-md">
                                        <div className="font-bold text-[#464B4B] mb-1">{resolution.title}</div>
                                        <div className="text-xs text-[#464B4B]/60 line-clamp-2">{resolution.description}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-xl font-bold text-[#464B4B]">
                                        {totalVotes.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center space-x-2">
                                        <ThumbsUp className="h-4 w-4 text-green-600" />
                                        <div>
                                          <div className="font-bold text-green-700">{resolution.yesVotes}</div>
                                          <div className="text-xs text-green-600">{yesPercentage.toFixed(1)}%</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center space-x-2">
                                        <ThumbsDown className="h-4 w-4 text-red-600" />
                                        <div>
                                          <div className="font-bold text-red-700">{resolution.noVotes}</div>
                                          <div className="text-xs text-red-600">{noPercentage.toFixed(1)}%</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center space-x-2">
                                        <Minus className="h-4 w-4 text-gray-600" />
                                        <div>
                                          <div className="font-bold text-gray-700">{resolution.abstainVotes}</div>
                                          <div className="text-xs text-gray-600">{abstainPercentage.toFixed(1)}%</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        isPassing 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {isPassing ? '✓ Passing' : '✗ Failing'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="w-48 space-y-1">
                                        <div className="flex items-center space-x-2">
                                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                              style={{ width: `${yesPercentage}%` }}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-red-500 to-blue-500"
                                              style={{ width: `${noPercentage}%` }}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gray-400"
                                              style={{ width: `${abstainPercentage}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {filteredResolutions.length === 0 && (
                          <div className="text-center py-16">
                            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-[#464B4B]/70 text-lg">No resolutions found matching your search</p>
                          </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-[#464B4B]">
                                Showing <span className="font-bold">{startIndex + 1}</span> to{' '}
                                <span className="font-bold">{Math.min(startIndex + resultsPerPage, filteredResolutions.length)}</span> of{' '}
                                <span className="font-bold">{filteredResolutions.length}</span> resolutions
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setResultsPage(Math.max(1, resultsPage - 1))}
                                  disabled={resultsPage === 1}
                                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                  Previous
                                </button>
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                      pageNum = i + 1;
                                    } else if (resultsPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (resultsPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = resultsPage - 2 + i;
                                    }
                                    
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() => setResultsPage(pageNum)}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                          resultsPage === pageNum
                                            ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white'
                                            : 'bg-white border-2 border-gray-300 text-[#464B4B] hover:bg-gray-50'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  onClick={() => setResultsPage(Math.min(totalPages, resultsPage + 1))}
                                  disabled={resultsPage === totalPages}
                                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* AGM Reports Header */}
              <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl shadow-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">AGM Results Reports</h2>
                    <p className="text-white/90">
                      Generate comprehensive voting results reports in PDF and Excel formats
                    </p>
                  </div>
                  <FileDown className="w-16 h-16 opacity-20" />
                </div>
              </div>

              {/* Report Generation Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Comprehensive PDF Report */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0072CE] transition-all"
                  onClick={() => {
                    const timerStart = localStorage.getItem('agmTimerStart');
                    const timerEnd = localStorage.getItem('agmTimerEnd');
                    const duration = timerStart && timerEnd 
                      ? `${Math.floor((new Date(timerEnd).getTime() - new Date(timerStart).getTime()) / (1000 * 60))} minutes`
                      : 'N/A';
                    
                    const reportData = {
                      candidates: candidates.map(c => ({
                        ...c,
                        id: c.id.toString()
                      })),
                      resolutions: resolutions.map(r => ({
                        ...r,
                        id: r.id.toString()
                      })),
                      agmSession: {
                        startTime: timerStart ? new Date(timerStart) : undefined,
                        endTime: timerEnd ? new Date(timerEnd) : undefined,
                        duration: duration,
                        status: (timerStatus === 'running' ? 'active' : timerStatus === 'ended' ? 'ended' : 'not-started') as 'active' | 'ended' | 'not-started'
                      },
                      auditLogs: auditLogs.slice(0, 100).map(log => ({
                        id: log.id.toString(),
                        action: log.action,
                        userName: log.userName,
                        timestamp: log.timestamp,
                        details: log.description,
                        description: log.description,
                        ipAddress: log.ipAddress,
                        userAgent: log.userAgent
                      })),
                      totalUsers: users.length,
                      totalVotesCast: voteLogs.length,
                      quorumStatus: {
                        required: 50,
                        present: voteLogs.length,
                        percentage: (voteLogs.length / users.length) * 100,
                        met: (voteLogs.length / users.length) * 100 >= 50
                      },
                      attendance: {
                        checkedIn: voteLogs.length,
                        total: users.length,
                        percentage: (voteLogs.length / users.length) * 100
                      }
                    };
                    reportService.generateAGMResultsPDF(reportData);
                  }}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4 mx-auto">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#464B4B] text-center mb-2">
                    Full PDF Report
                  </h3>
                  <p className="text-[#464B4B]/70 text-center text-sm mb-4">
                    Complete AGM results with executive summary, candidate rankings, resolution details, and signatures
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-[#464B4B]/60">
                    <div className="flex items-center justify-between">
                      <span>• Executive Summary</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Candidate Results</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Resolution Results</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Detailed Breakdown</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Certification & Signatures</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Generate PDF
                  </button>
                </motion.div>

                {/* Comprehensive Excel Report */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0072CE] transition-all"
                  onClick={() => {
                    const timerStart = localStorage.getItem('agmTimerStart');
                    const timerEnd = localStorage.getItem('agmTimerEnd');
                    const duration = timerStart && timerEnd 
                      ? `${Math.floor((new Date(timerEnd).getTime() - new Date(timerStart).getTime()) / (1000 * 60))} minutes`
                      : 'N/A';
                    
                    const reportData = {
                      candidates: candidates.map(c => ({
                        ...c,
                        id: c.id.toString()
                      })),
                      resolutions: resolutions.map(r => ({
                        ...r,
                        id: r.id.toString()
                      })),
                      agmSession: {
                        startTime: timerStart ? new Date(timerStart) : undefined,
                        endTime: timerEnd ? new Date(timerEnd) : undefined,
                        duration: duration,
                        status: (timerStatus === 'running' ? 'active' : timerStatus === 'ended' ? 'ended' : 'not-started') as 'active' | 'ended' | 'not-started'
                      },
                      auditLogs: auditLogs.slice(0, 100).map(log => ({
                        id: log.id.toString(),
                        action: log.action,
                        userName: log.userName,
                        timestamp: log.timestamp,
                        details: log.description,
                        description: log.description,
                        ipAddress: log.ipAddress,
                        userAgent: log.userAgent
                      })),
                      totalUsers: users.length,
                      totalVotesCast: voteLogs.length,
                      quorumStatus: {
                        required: 50,
                        present: voteLogs.length,
                        percentage: (voteLogs.length / users.length) * 100,
                        met: (voteLogs.length / users.length) * 100 >= 50
                      },
                      attendance: {
                        checkedIn: voteLogs.length,
                        total: users.length,
                        percentage: (voteLogs.length / users.length) * 100
                      }
                    };
                    reportService.generateAGMResultsExcel(reportData);
                  }}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4 mx-auto">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#464B4B] text-center mb-2">
                    Full Excel Report
                  </h3>
                  <p className="text-[#464B4B]/70 text-center text-sm mb-4">
                    Multi-sheet workbook with executive summary, candidate data, resolutions, and audit trail
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-[#464B4B]/60">
                    <div className="flex items-center justify-between">
                      <span>• Executive Summary Sheet</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Candidate Results Sheet</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Resolution Results Sheet</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Resolution Details Sheet</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Audit Trail Sheet</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Generate Excel
                  </button>
                </motion.div>

                {/* Quick Summary PDF */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0072CE] transition-all"
                  onClick={() => {
                    const timerStart = localStorage.getItem('agmTimerStart');
                    const timerEnd = localStorage.getItem('agmTimerEnd');
                    const duration = timerStart && timerEnd 
                      ? `${Math.floor((new Date(timerEnd).getTime() - new Date(timerStart).getTime()) / (1000 * 60))} minutes`
                      : 'N/A';
                    
                    const reportData = {
                      candidates: candidates.map(c => ({
                        ...c,
                        id: c.id.toString()
                      })),
                      resolutions: resolutions.map(r => ({
                        ...r,
                        id: r.id.toString()
                      })),
                      agmSession: {
                        startTime: timerStart ? new Date(timerStart) : undefined,
                        endTime: timerEnd ? new Date(timerEnd) : undefined,
                        duration: duration,
                        status: (timerStatus === 'running' ? 'active' : timerStatus === 'ended' ? 'ended' : 'not-started') as 'active' | 'ended' | 'not-started'
                      },
                      totalUsers: users.length,
                      totalVotesCast: voteLogs.length
                    };
                    reportService.generateQuickSummaryPDF(reportData);
                  }}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4 mx-auto">
                    <ClipboardList className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#464B4B] text-center mb-2">
                    Quick Summary
                  </h3>
                  <p className="text-[#464B4B]/70 text-center text-sm mb-4">
                    Single-page PDF with key voting metrics and top results
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-[#464B4B]/60">
                    <div className="flex items-center justify-between">
                      <span>• Voting Statistics</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Top Candidate</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Resolutions Passed</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Turnout Percentage</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Single Page Format</span>
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Generate Summary
                  </button>
                </motion.div>
              </div>

              {/* AGM Status Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-[#464B4B] mb-4">AGM Session Status</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[#464B4B]/70 font-medium">Status</span>
                      <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                        timerStatus === 'running' ? 'bg-green-100 text-green-700' :
                        timerStatus === 'ended' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {timerStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[#464B4B]/70 font-medium">Total Voters</span>
                      <span className="font-bold text-[#0072CE]">{users.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[#464B4B]/70 font-medium">Votes Cast</span>
                      <span className="font-bold text-[#0072CE]">{voteLogs.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[#464B4B]/70 font-medium">Turnout</span>
                      <span className="font-bold text-[#0072CE]">
                        {((voteLogs.length / users.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[#464B4B]/70 font-medium">Duration</span>
                      <span className="font-bold text-[#0072CE]">
                        {(() => {
                          const timerStart = localStorage.getItem('agmTimerStart');
                          const timerEnd = localStorage.getItem('agmTimerEnd');
                          if (timerStart && timerEnd) {
                            return `${Math.floor((new Date(timerEnd).getTime() - new Date(timerStart).getTime()) / (1000 * 60))} minutes`;
                          }
                          return 'N/A';
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[#464B4B]/70 font-medium">Candidates</span>
                      <span className="font-bold text-[#0072CE]">{candidates.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Features Info */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-blue-100">
                <h3 className="text-xl font-bold text-[#464B4B] mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                  Report Features
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#464B4B]">PDF Reports Include:</h4>
                    <ul className="space-y-1 text-sm text-[#464B4B]/70">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Professional branded headers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Executive summary with key metrics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Detailed candidate rankings
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Resolution voting breakdown
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Certification & signature blocks
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Automatic page numbering
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#464B4B]">Excel Reports Include:</h4>
                    <ul className="space-y-1 text-sm text-[#464B4B]/70">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Multi-sheet workbook format
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Sortable and filterable data
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Percentage calculations
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Audit trail included
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Easy data analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Compatible with Excel/Google Sheets
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Tamper-Evident Integrity Check */}
              <div className={`rounded-2xl shadow-xl p-6 ${
                verifyLogIntegrity() ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {verifyLogIntegrity() ? '✓ Log Integrity Verified' : '✗ Log Tampering Detected'}
                    </h3>
                    <p className="text-slate-600">
                      {verifyLogIntegrity() 
                        ? 'All audit logs are tamper-evident and verified with cryptographic hashes'
                        : 'Warning: Log chain has been compromised - manual review required'}
                    </p>
                  </div>
                  <div className="text-5xl">
                    {verifyLogIntegrity() ? '🔒' : '⚠️'}
                  </div>
                </div>
              </div>

              {/* Live Quorum Tracker */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-slate-900">📊 Live Quorum Status</h3>
                  <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                    quorumMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {quorumMet ? '✓ QUORUM MET' : '✗ QUORUM NOT MET'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Total Eligible</p>
                    <p className="text-3xl font-bold text-blue-900">{totalEligible}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-600 font-semibold mb-1">Present</p>
                    <p className="text-3xl font-bold text-green-900">{liveAttendanceCount}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Attendance</p>
                    <p className="text-3xl font-bold text-blue-900">{((liveAttendanceCount / totalEligible) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-sm text-orange-600 font-semibold mb-1">Threshold</p>
                    <p className="text-3xl font-bold text-orange-900">{quorumThreshold}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 flex items-center justify-center text-white text-xs font-bold ${
                      quorumMet ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                    style={{ width: `${Math.min((liveAttendanceCount / totalEligible) * 100, 100)}%` }}
                  >
                    {((liveAttendanceCount / totalEligible) * 100) >= 10 && `${((liveAttendanceCount / totalEligible) * 100).toFixed(1)}%`}
                  </div>
                </div>
              </div>

              {/* Excel Export Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportAuditLogsToExcel}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Download className="h-5 w-5" />
                  <span>Export Audit Logs (Excel)</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportLiveAttendanceToExcel}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Download className="h-5 w-5" />
                  <span>Export Attendance (Excel)</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportFullAuditReport}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Download className="h-5 w-5" />
                  <span>Full Admin Report (Excel)</span>
                </motion.button>
              </div>

              {/* Audit Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">ID</th>
                      <th className="px-6 py-4 text-left">User</th>
                      <th className="px-6 py-4 text-left">Action</th>
                      <th className="px-6 py-4 text-left">Description</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-left">IP Address</th>
                      <th className="px-6 py-4 text-left">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterData(auditLogs, ['userName', 'action', 'description']).map((log, index) => (
                      <tr key={log.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 font-semibold text-[#464B4B]">{log.id}</td>
                        <td className="px-6 py-4 text-[#464B4B]">{log.userName || 'System'}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#464B4B] text-sm">{log.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.status)}
                            <span className={`text-xs font-semibold ${
                              log.status === 'success' ? 'text-green-700' :
                              log.status === 'failed' ? 'text-red-700' :
                              'text-yellow-700'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#464B4B] text-xs">{log.ipAddress || '-'}</td>
                        <td className="px-6 py-4 text-[#464B4B] text-sm">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* Vote Assignment Modal */}
        <AnimatePresence>
          {showVoteModal && selectedUserForVotes && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowVoteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-[#464B4B]">Assign Votes</h2>
                    <p className="text-[#464B4B]/70 mt-1">Set voting power for {selectedUserForVotes.name}</p>
                  </div>
                  <button
                    onClick={() => setShowVoteModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-8 w-8" />
                  </button>
                </div>

                {/* User Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{selectedUserForVotes.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#464B4B]">{selectedUserForVotes.name}</h3>
                      <p className="text-[#464B4B]/70">{selectedUserForVotes.email}</p>
                      <p className="text-sm text-[#464B4B]/60">Employee ID: {selectedUserForVotes.employeeId}</p>
                    </div>
                  </div>
                </div>

                {/* Vote Limits Info */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">Super Admin Set Boundaries</p>
                      <p>You can assign between <strong>{voteLimits.min}</strong> and <strong>{voteLimits.max}</strong> votes per user.</p>
                      <p className="text-xs text-blue-600 mt-1">Recommended default: {voteLimits.default} votes</p>
                    </div>
                  </div>
                </div>

                {/* Vote Input */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-[#464B4B] mb-3 uppercase tracking-wide">
                    Number of Votes
                  </label>
                  <input
                    type="number"
                    value={voteAmount}
                    onChange={(e) => setVoteAmount(parseInt(e.target.value) || voteLimits.min)}
                    min={voteLimits.min}
                    max={voteLimits.max}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-[#0072CE] text-3xl font-bold text-center"
                  />
                  
                  {/* Visual Range Slider */}
                  <div className="mt-4">
                    <input
                      type="range"
                      value={voteAmount}
                      onChange={(e) => setVoteAmount(parseInt(e.target.value))}
                      min={voteLimits.min}
                      max={voteLimits.max}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0072CE]"
                    />
                    <div className="flex justify-between mt-2 text-xs text-[#464B4B]/60">
                      <span>Min: {voteLimits.min}</span>
                      <span>Default: {voteLimits.default}</span>
                      <span>Max: {voteLimits.max}</span>
                    </div>
                  </div>

                  {/* Validation Message */}
                  {(voteAmount < voteLimits.min || voteAmount > voteLimits.max) && (
                    <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-sm">
                      ⚠️ Vote count must be between {voteLimits.min} and {voteLimits.max}
                    </div>
                  )}
                  {voteAmount === voteLimits.default && (
                    <div className="mt-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl text-green-800 text-sm">
                      ✓ Using recommended default value
                    </div>
                  )}
                </div>

                {/* Quick Select Buttons */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-[#464B4B] mb-3">Quick Select:</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setVoteAmount(voteLimits.min)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-[#464B4B] transition-colors"
                    >
                      Min ({voteLimits.min})
                    </button>
                    <button
                      onClick={() => setVoteAmount(voteLimits.default)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-xl font-semibold text-blue-800 transition-colors"
                    >
                      Default ({voteLimits.default})
                    </button>
                    <button
                      onClick={() => setVoteAmount(voteLimits.max)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-xl font-semibold text-blue-800 transition-colors"
                    >
                      Max ({voteLimits.max})
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowVoteModal(false)}
                    className="flex-1 px-6 py-4 bg-gray-200 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (voteAmount >= voteLimits.min && voteAmount <= voteLimits.max) {
                        try {
                          // Call backend API to assign votes
                          const response = await api.assignVotes(selectedUserForVotes.id, voteAmount, 1); // Session ID 1
                          
                          if (response.success) {
                            // Update local state
                            setUsers(prev =>
                              prev.map(u =>
                                u.id === selectedUserForVotes.id
                                  ? { ...u, assignedVotes: voteAmount }
                                  : u
                              )
                            );
                            
                            // Broadcast event for VotingStatusBar to refresh
                            window.dispatchEvent(new CustomEvent('votesAssigned', {
                              detail: {
                                userId: selectedUserForVotes.id,
                                allocatedVotes: voteAmount,
                                sessionId: 1
                              }
                            }));
                            
                            setShowVoteModal(false);
                            alert(`✅ Successfully assigned ${voteAmount} vote${voteAmount !== 1 ? 's' : ''} to ${selectedUserForVotes.name}!`);
                          } else {
                            alert(`❌ Failed to assign votes: ${response.message || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('Error assigning votes:', error);
                          alert('❌ Failed to assign votes. Please try again.');
                        }
                      } else {
                        alert(`⚠️ Vote count must be between ${voteLimits.min} and ${voteLimits.max}`);
                      }
                    }}
                    disabled={voteAmount < voteLimits.min || voteAmount > voteLimits.max}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Vote className="h-5 w-5" />
                    <span>Assign Votes</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Set Timer Modal */}
        <SetTimerModal
          isOpen={showSetTimerModal}
          onClose={() => setShowSetTimerModal(false)}
        />

        {/* Proxy Instructions Modal */}
        <AnimatePresence>
          {showInstructionsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowInstructionsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">Voting Instructions</h2>
                  <p className="text-white/90">Instructions for {selectedMemberName}</p>
                </div>

                {/* Modal Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {selectedInstructions.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No instructions found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedInstructions.map((instruction: any, index: number) => (
                        <motion.div
                          key={instruction.InstructionID || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-blue-50 to-blue-50 border-2 border-blue-200 rounded-xl p-4"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              {instruction.CandidateID && (
                                <>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                      CANDIDATE VOTE
                                    </span>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                      {instruction.VotesToAllocate} vote{instruction.VotesToAllocate !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <p className="text-[#464B4B] font-semibold text-lg">
                                    Allocate {instruction.VotesToAllocate} vote{instruction.VotesToAllocate !== 1 ? 's' : ''} to:
                                  </p>
                                  <p className="text-blue-700 font-bold text-xl mt-1">
                                    {instruction.CandidateName || `Candidate ID ${instruction.CandidateID}`}
                                  </p>
                                  {instruction.CandidatePosition && (
                                    <p className="text-[#464B4B]/70 text-sm mt-1">
                                      Position: {instruction.CandidatePosition}
                                    </p>
                                  )}
                                </>
                              )}
                              {instruction.ResolutionID && (
                                <>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                      RESOLUTION VOTE
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      instruction.InstructionType === 'vote_yes' ? 'bg-green-100 text-green-700' :
                                      instruction.InstructionType === 'vote_no' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {instruction.InstructionType === 'vote_yes' ? 'VOTE YES' :
                                       instruction.InstructionType === 'vote_no' ? 'VOTE NO' : 'ABSTAIN'}
                                    </span>
                                  </div>
                                  <p className="text-[#464B4B] font-semibold text-lg">
                                    Vote {instruction.InstructionType === 'vote_yes' ? 'YES' :
                                         instruction.InstructionType === 'vote_no' ? 'NO' : 'ABSTAIN'} on:
                                  </p>
                                  <p className="text-blue-700 font-bold text-xl mt-1">
                                    {instruction.ResolutionTitle || `Resolution ID ${instruction.ResolutionID}`}
                                  </p>
                                  {instruction.ResolutionDescription && (
                                    <p className="text-[#464B4B]/70 text-sm mt-2">
                                      {instruction.ResolutionDescription}
                                    </p>
                                  )}
                                </>
                              )}
                              {instruction.Notes && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-xs font-semibold text-amber-800 mb-1">Additional Notes:</p>
                                  <p className="text-sm text-amber-900">{instruction.Notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t p-6 bg-gray-50">
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* USER CRUD MODAL */}
        <AnimatePresence>
          {showUserModal && (
            <UserCRUDModal
              user={editingUser}
              onClose={() => {
                setShowUserModal(false);
                setEditingUser(null);
              }}
              onSave={(userData) => {
                if (editingUser) {
                  handleUpdateUser(editingUser.id, userData);
                } else {
                  handleAddUser(userData);
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* CANDIDATE CRUD MODAL */}
        <AnimatePresence>
          {showCandidateModal && (
            <CandidateCRUDModal
              candidate={editingCandidate}
              employees={employees}
              sessions={sessions}
              onClose={() => {
                setShowCandidateModal(false);
                setEditingCandidate(null);
              }}
              onSave={(candidateData) => {
                if (editingCandidate) {
                  handleUpdateCandidate(editingCandidate.id, candidateData);
                } else {
                  handleAddCandidate(candidateData);
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* RESOLUTION CRUD MODAL */}
        <AnimatePresence>
          {showResolutionModal && (
            <ResolutionCRUDModal
              resolution={editingResolution}
              sessions={sessions}
              onClose={() => {
                setShowResolutionModal(false);
                setEditingResolution(null);
              }}
              onSave={(resolutionData) => {
                if (editingResolution) {
                  handleUpdateResolution(editingResolution.id, resolutionData);
                } else {
                  handleAddResolution(resolutionData);
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ==================== USER CRUD MODAL COMPONENT ====================
function UserCRUDModal({ user, onClose, onSave }: { user: User | null; onClose: () => void; onSave: (data: Partial<User>) => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    employeeId: user?.employeeId || '',
    assignedVotes: user?.assignedVotes || 3,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          {user ? '✏️ Edit User' : '➕ Add New User'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="john@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                placeholder="EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned Votes</label>
              <input
                type="number"
                value={formData.assignedVotes}
                onChange={(e) => setFormData({ ...formData, assignedVotes: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!formData.name || !formData.email) {
                alert('Please fill in all required fields');
                return;
              }
              onSave(formData);
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            {user ? 'Update User' : 'Create User'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==================== CANDIDATE CRUD MODAL COMPONENT ====================
function CandidateCRUDModal({ candidate, onClose, onSave, employees, sessions }: { 
  candidate: Candidate | null; 
  onClose: () => void; 
  onSave: (data: any) => void;
  employees: any[];
  sessions: any[];
}) {
  const [formData, setFormData] = useState({
    sessionId: sessions.length > 0 ? sessions[0]?.SessionID : 1,
    employeeId: '',
    firstName: candidate?.name?.split(' ')[0] || '',
    lastName: candidate?.name?.split(' ').slice(1).join(' ') || '',
    email: '',
    phoneNumber: '',
    department: candidate?.department || '',
    position: '',
    bio: candidate?.achievements || '',
    profilePictureURL: '',
    displayOrder: 0,
  });

  // When employee is selected, populate fields
  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.EmployeeID === employeeId || e.UserID?.toString() === employeeId);
    if (employee) {
      setFormData({
        ...formData,
        employeeId: employee.EmployeeID || employee.UserID?.toString(),
        firstName: employee.FirstName,
        lastName: employee.LastName,
        email: employee.Email || '',
        phoneNumber: employee.PhoneNumber || '',
        department: employee.DepartmentName || employee.Department || formData.department,
        position: employee.Position || employee.JobTitle || '',
      });
    } else {
      setFormData({ ...formData, employeeId });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          {candidate ? '✏️ Edit Candidate' : '➕ Add New Candidate'}
        </h2>

        <div className="space-y-4">
          {/* AGM Session */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">AGM Session *</label>
            <select
              value={formData.sessionId}
              onChange={(e) => setFormData({ ...formData, sessionId: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
            >
              {sessions.map(session => (
                <option key={session.SessionID} value={session.SessionID}>
                  {session.Title} ({new Date(session.StartDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Employee *</label>
            <select
              value={formData.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.EmployeeID || emp.UserID} value={emp.EmployeeID || emp.UserID}>
                  {emp.FirstName} {emp.LastName} ({emp.EmployeeID}) - {emp.DepartmentName || emp.Department}
                </option>
              ))}
            </select>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Alice"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Johnson"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="alice@forvismazars.com"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Engineering"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Position</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Senior Developer"
            />
          </div>

          {/* Bio/Achievements */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Bio / Achievements *</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Led 3 major projects, mentored 5 junior developers..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!formData.firstName || !formData.lastName || !formData.bio || !formData.sessionId) {
                alert('Please fill in all required fields (Session, First Name, Last Name, Bio)');
                return;
              }
              onSave(formData);
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            {candidate ? 'Update Candidate' : 'Create Candidate'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==================== RESOLUTION CRUD MODAL COMPONENT ====================
function ResolutionCRUDModal({ resolution, onClose, onSave, sessions }: { 
  resolution: Resolution | null; 
  onClose: () => void; 
  onSave: (data: any) => void;
  sessions: any[];
}) {
  const [formData, setFormData] = useState({
    sessionId: sessions.length > 0 ? sessions[0]?.SessionID : 1,
    title: resolution?.title || '',
    description: resolution?.description || '',
    requiredMajority: 50,
    allowAbstain: true,
    displayOrder: 0,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          {resolution ? '✏️ Edit Resolution' : '➕ Add New Resolution'}
        </h2>

        <div className="space-y-4">
          {/* AGM Session */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">AGM Session *</label>
            <select
              value={formData.sessionId}
              onChange={(e) => setFormData({ ...formData, sessionId: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
            >
              {sessions.map(session => (
                <option key={session.SessionID} value={session.SessionID}>
                  {session.Title} ({new Date(session.StartDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Remote Work Policy Extension"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Extend remote work to 3 days per week for all employees..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Required Majority (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.requiredMajority}
              onChange={(e) => setFormData({ ...formData, requiredMajority: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="50"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowAbstain"
              checked={formData.allowAbstain}
              onChange={(e) => setFormData({ ...formData, allowAbstain: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-slate-300 text-[#0072CE] focus:ring-2 focus:ring-[#0072CE]"
            />
            <label htmlFor="allowAbstain" className="text-sm font-semibold text-slate-700">
              Allow Abstain Votes
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!formData.title || !formData.description || !formData.sessionId) {
                alert('Please fill in all required fields (Session, Title, Description)');
                return;
              }
              onSave(formData);
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            {resolution ? 'Update Resolution' : 'Create Resolution'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AdminDashboard;
