import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Vote,
  Activity,
  Plus,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Settings,
  FileText,
  History,
  UserPlus,
  GitBranch,
  Users2,
  ChevronDown,
  ChevronUp,
  Mail,
  User
} from 'lucide-react';
import { AuditLog, ProxyGroup, ProxyGroupMember } from '../types/audit';

interface ProxyVote {
  id: string;
  proxy_group_id: string;
  voter_id: string;
  vote_type: 'employee' | 'resolution';
  employee_id?: string;
  resolution_id?: string;
  created_at: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  name: string;
  position: string;
  department: string;
  department_id?: string;
  hire_date?: string;
  years_of_service?: number;
  yearsOfService?: number;
  bio?: string;
  avatar?: string;
  is_eligible_for_voting?: boolean;
  total_votes?: number;
  votes?: number;
  created_at?: string;
  updated_at?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  updated_at?: string;
  email_verified?: boolean;
  vote_weight?: number;
  max_votes_allowed?: number;
  min_votes_required?: number;
  vote_limit_set_by?: string;
  vote_limit_updated_at?: string;
}

interface Resolution {
  id: string;
  title: string;
  description: string;
  status: string;
  total_votes: number;
  created_at: string;
  updated_at?: string;
  organizer_name?: string;
  department: string; 
}

interface VoteLog {
  id: string;
  voter_id: string;
  voter_name?: string;
  voter_email?: string;
  vote_type: string;
  employee_id?: string;
  resolution_id?: string;
  vote_weight: number;
  vote_choice?: string;
  comment?: string;
  is_anonymous: boolean;
  ip_address?: string;
  created_at: string;
  target_name: string; 
  target_id: string; 
}

interface DashboardStats {
  totalUsers: number;
  totalVotes: number;
  totalResolutions: number;
  totalEmployees: number;
  activeUsers: number;
  recentActivity: number;
  votingParticipation: number;
  topVotedEmployee?: string;
  topResolution?: string;
  totalProxyGroups: number;
  totalProxyVotes: number;
  totalAuditLogs: number;
}

const AdminDashboard_2: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'users' | 'employees' | 'resolutions' | 'votes' | 'audit' | 'proxy' | 'register'>('users');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVotes: 0,
    totalResolutions: 0,
    totalEmployees: 0,
    activeUsers: 0,
    recentActivity: 0,
    votingParticipation: 0,
    totalProxyGroups: 0,
    totalProxyVotes: 0,
    totalAuditLogs: 0,
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [voteLogs, setVoteLogs] = useState<VoteLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [proxyVotes, setProxyVotes] = useState<ProxyVote[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [expandedAuditLog, setExpandedAuditLog] = useState<string | null>(null);
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showCreateResolutionModal, setShowCreateResolutionModal] = useState(false);
  const [showEditResolutionModal, setShowEditResolutionModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showVoteLimitsModal, setShowVoteLimitsModal] = useState(false);
  const [showBulkVoteLimitsModal, setShowBulkVoteLimitsModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingResolution, setEditingResolution] = useState<any>(null);
  const [selectedUserForLimits, setSelectedUserForLimits] = useState<User | null>(null);
  const [superAdminBoundaries, setSuperAdminBoundaries] = useState({ min_individual_votes: 1, max_individual_votes: 5 });
  const [voteLimitsForm, setVoteLimitsForm] = useState({
    vote_weight: 1.0,
    max_votes_allowed: 1,
    min_votes_required: 1
  });
  const [bulkVoteLimitsForm, setBulkVoteLimitsForm] = useState({
    vote_weight: 1.0,
    max_votes_allowed: 1,
    min_votes_required: 1
  });
  
  // Registration states
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    role_id: 2, // Default to voter
  });

  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 2,
  });

  const [newEmployee, setNewEmployee] = useState({
    name: '', 
    position: '', 
    department: '', 
    yearsOfService: '', 
    bio: '', 
  });

  const [newResolution, setNewResolution] = useState({
    title: '',
    description: '',
    department: '',
    voting_start_date: '',
    voting_end_date: ''
  });

  const [newProxyGroup, setNewProxyGroup] = useState({
    proxy_id: '',
    vote_type: 'employee' as 'employee' | 'resolution',
    employee_id: '',
    resolution_id: '',
    reason: '',
    valid_from: '',
    valid_until: '',
    member_ids: [] as string[],
  });

  const [showAgmTimerModal, setShowAgmTimerModal] = useState(false);
  const [agmStartTime, setAgmStartTime] = useState('15:00');
  const [agmEndTime, setAgmEndTime] = useState('17:00');
  const [agmModalError, setAgmModalError] = useState('');

  // AGM Timer Handler
  const handleSetAgmTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgmModalError('');
    
    if (!agmStartTime || !agmEndTime) {
      setAgmModalError('Please enter both start and end times.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/agm-timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: agmStartTime, end: agmEndTime })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowAgmTimerModal(false);
        setAgmModalError('');
        alert(`AGM Timer set successfully: ${agmStartTime} - ${agmEndTime}`);
        window.dispatchEvent(new Event('agmTimerUpdated'));
      } else {
        setAgmModalError(result.message || 'Failed to set AGM timer.');
      }
    } catch (err) {
      setAgmModalError('Failed to set AGM timer. Please try again.');
      console.error('Error setting AGM timer:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchEmployees();
    fetchResolutions();
    fetchProxyGroups();
    fetchProxyVotes();
    fetchVoteLogs();
    fetchAuditLogs();
  }, []);

  // Fetch audit logs when switching to audit tab
  useEffect(() => {
    if (activeTab === 'audit') {
      console.log('🎯 Audit tab selected, fetching audit logs...');
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 AdminDashboard: Fetching users...');

      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }); 

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json(); 
      console.log("✅ AdminDashboard: Fetched users", result);
      
      if (result && result.data) {
        setUsers(result.data);
        setStats(prev => ({ ...prev, totalUsers: result.data.length }));
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ AdminDashboard: Error fetching users:', err);
      const errorMessage = err.message || 'Failed to fetch users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 AdminDashboard: Fetching employees...');

      const response = await fetch('http://localhost:3001/api/admin/employees', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }); 

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json(); 
      console.log("✅ AdminDashboard: Fetched employees", result);
      
      if (result && result.data) {
        setEmployees(result.data);
        setStats(prev => ({ ...prev, totalEmployees: result.data.length }));
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ AdminDashboard: Error fetching employees:', err);
      const errorMessage = err.message || 'Failed to fetch employees';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchResolutions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/resolutions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setResolutions(result.data);
        setStats(prev => ({ ...prev, totalResolutions: result.data.length }));
      }
    } catch (error) {
      console.error('Error fetching resolutions:', error);
      setError('Failed to fetch resolutions');
    }
  };

  const fetchProxyGroups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/proxy/admin/all-groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      console.log("Fetched proxy groups", result);

      if (result.success && result.data) {
        setProxyGroups(result.data);
        setStats(prev => ({ ...prev, totalProxyGroups: result.data.length }));
      }
    } catch (error) {
      console.error('Error fetching proxy groups:', error);
      setError('Failed to fetch proxy groups');
    }
  };

  const fetchProxyVotes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/proxy/votes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      console.log("Fetched proxy votes", result);

      if (result.success) {
        setProxyVotes(result.data);
        setStats(prev => ({ ...prev, totalProxyVotes: result.data.length }));
      }
    } catch (error) {
      console.error('Error fetching proxy votes:', error);
      setError('Failed to fetch proxy votes');
    }
  };

  const fetchVoteLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/votes/logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      console.log("Fetched vote logs", result);

      if (result.success && result.logs) {
        setVoteLogs(result.logs);
        setStats(prev => ({ ...prev, totalVotes: result.logs.length }));
      }
    } catch (error) {
      console.error('Error fetching vote logs:', error);
      setError('Failed to fetch vote logs');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token from localStorage:', token ? 'Token exists' : 'No token found');
      
      const response = await fetch('http://localhost:3001/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers.get('content-type'));
      
      const result = await response.json();
      console.log("📊 Fetched audit logs response:", result);

      if (result.success && result.data) {
        console.log(`✅ Successfully loaded ${result.data.length} audit logs`);
        setAuditLogs(result.data);
        setStats(prev => ({ ...prev, totalAuditLogs: result.data.length }));
      } else {
        console.error('❌ Audit logs fetch failed:', result);
        setAuditLogs([]);
      }
    } catch (error) {
      console.error('💥 Error fetching audit logs:', error);
      setError('Failed to fetch audit logs');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
    } catch (err: any) {
      setError('Error fetching dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegistrationError('');
    setRegistrationSuccess('');

    // Validation
    if (!registrationData.name || !registrationData.email) {
      setRegistrationError('Name and email are required');
      setIsRegistering(false);
      return;
    }

    if (registrationData.name.length < 2) {
      setRegistrationError('Name must be at least 2 characters');
      setIsRegistering(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationData.email)) {
      setRegistrationError('Please enter a valid email address');
      setIsRegistering(false);
      return;
    }

    try {
      const userData = {
        name: registrationData.name,
        email: registrationData.email,
        role_id: registrationData.role_id,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(registrationData.name)}&background=0072CE&color=fff`
      };

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRegistrationSuccess('Account created successfully! A password has been sent to the user\'s email address.');
        setRegistrationData({
          name: '',
          email: '',
          role_id: 2
        });
        // Refresh users list
        await fetchUsers();
      } else {
        setRegistrationError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setRegistrationError('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'active': return <Activity className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <X className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+{trend}% this month</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const TabButton = ({ id, label, icon: Icon, isActive, onClick, badge }: any) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 relative ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {badge && (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
          isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
        }`}>
          {badge}
        </span>
      )}
    </motion.button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Comprehensive voting platform management</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => navigate('/admin/approvals')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Admin Approvals
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={() => setShowAgmTimerModal(true)}
              >
                <Clock className="h-4 w-4" />
                Set AGM Timer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Users" 
            value={users.length} 
            icon={Users} 
            color="bg-gradient-to-r from-blue-500 to-blue-600" 
            trend={12}
            subtitle={`${stats.activeUsers} active`}
          />
          <StatCard 
            title="Total Votes" 
            value={voteLogs.length} 
            icon={Vote} 
            color="bg-gradient-to-r from-green-500 to-green-600" 
            trend={8}
            subtitle={`${stats.votingParticipation}% participation`}
          />
          <StatCard 
            title="Proxy Groups" 
            value={stats.totalProxyGroups} 
            icon={Users2} 
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            subtitle={`${stats.totalProxyVotes} proxy votes`}
          />
          <StatCard 
            title="Audit Logs" 
            value={auditLogs.length} 
            icon={History} 
            color="bg-gradient-to-r from-orange-500 to-orange-600"
            subtitle="System changes tracked"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton id="register" label="User Registration" icon={UserPlus} isActive={activeTab === 'register'} onClick={setActiveTab} />
          <TabButton id="users" label="Users" icon={Users} isActive={activeTab === 'users'} onClick={setActiveTab} />
          <TabButton id="employees" label="Employees" icon={UserCheck} isActive={activeTab === 'employees'} onClick={setActiveTab} />
          <TabButton id="resolutions" label="Resolutions" icon={FileText} isActive={activeTab === 'resolutions'} onClick={setActiveTab} />
          <TabButton id="votes" label="Vote Logs" icon={Vote} isActive={activeTab === 'votes'} onClick={setActiveTab}/>
          <TabButton id="proxy" label="Proxy Management" icon={GitBranch} isActive={activeTab === 'proxy'} onClick={setActiveTab}  />
          <TabButton id="audit" label="Audit Trail" icon={History} isActive={activeTab === 'audit'} onClick={setActiveTab} />
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
            {/* Registration Tab */}
            {activeTab === 'register' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4">
                      <UserPlus className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">User Registration</h3>
                    <p className="text-gray-500">Create new user accounts with role assignment</p>
                  </div>

                  {registrationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{registrationError}</p>
                    </motion.div>
                  )}

                  {registrationSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center space-x-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <p className="text-green-700 text-sm">{registrationSuccess}</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleRegistration} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={registrationData.name}
                          onChange={(e) => {
                            setRegistrationData({ ...registrationData, name: e.target.value });
                            if (registrationError) setRegistrationError('');
                          }}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={registrationData.email}
                          onChange={(e) => {
                            setRegistrationData({ ...registrationData, email: e.target.value });
                            if (registrationError) setRegistrationError('');
                          }}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Role
                      </label>
                      <select
                        value={registrationData.role_id}
                        onChange={(e) => setRegistrationData({ ...registrationData, role_id: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value={1}>Admin - Full administrative access</option>
                        <option value={2}>Voter - Standard user access</option>
                      </select>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <p className="text-blue-700 text-sm font-medium">
                          Password will be automatically generated and emailed
                        </p>
                      </div>
                      <p className="text-blue-600 text-xs mt-1 ml-7">
                        The user will receive login credentials via email after registration.
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isRegistering}
                      className="w-full relative bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                    >
                      {isRegistering ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <UserPlus className="h-5 w-5" />
                          <span>Create User Account</span>
                        </div>
                      )}
                    </motion.button>
                  </form>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowAddUserModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add User
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="voter">Voter</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(user => 
                            (filterType === 'all' || user.role === filterType) &&
                            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                          )
                          .map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {user.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Employee Management</h3>
                    <button
                      onClick={() => setShowAddEmployeeModal(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Employee
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Departments</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {employees
                      .filter(emp => 
                        (departmentFilter === 'all' || emp.department === departmentFilter) &&
                        (emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         emp.position.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
                      )
                      .map((emp) => (
                        <div key={emp.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">
                                  {emp.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg">{emp.name}</h4>
                                <p className="text-gray-600">{emp.position}</p>
                                <p className="text-sm text-gray-500">{emp.department}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditEmployee(emp)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Years of Service:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {emp.yearsOfService || emp.years_of_service || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Total Votes:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {emp.total_votes || emp.votes || 0}
                              </span>
                            </div>
                            {emp.bio && (
                              <div>
                                <span className="text-sm text-gray-500">Bio:</span>
                                <p className="text-sm text-gray-700 mt-1 line-clamp-3">{emp.bio}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {employees
                    .filter(emp => 
                      (departmentFilter === 'all' || emp.department === departmentFilter) &&
                      (emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                       emp.position.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
                    ).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                      <p className="text-gray-500">
                        Try adjusting your search criteria or add a new employee.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audit Trail Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">System Audit Trail</h3>
                      <p className="text-sm text-gray-500">Complete record of all system changes and activities</p>
                      <p className="text-xs text-blue-600 mt-1">Debug: Found {auditLogs.length} audit logs</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          console.log('🔍 Manual audit logs fetch...');
                          fetchAuditLogs();
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Refresh Data
                      </button>
                      <select
                        value={auditFilter}
                        onChange={(e) => setAuditFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="AUTH">Authentication</option>
                        <option value="VOTE">Voting</option>
                        <option value="ADMIN">Administration</option>
                        <option value="PROXY">Proxy</option>
                        <option value="TIMER">Timer</option>
                        <option value="SYSTEM">System</option>
                      </select>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">User ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-gray-500">
                              No audit logs found. Activity will appear here once users start interacting with the system.
                            </td>
                          </tr>
                        ) : (
                          auditLogs
                            .filter(log => auditFilter === 'all' || log.action_category === auditFilter)
                            .map((log) => (
                              <React.Fragment key={log.id}>
                                <tr className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-4 px-4">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                                      log.action_category === 'AUTH' ? 'bg-blue-100 text-blue-700' :
                                      log.action_category === 'VOTE' ? 'bg-green-100 text-green-700' :
                                      log.action_category === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                      log.action_category === 'PROXY' ? 'bg-orange-100 text-orange-700' :
                                      log.action_category === 'TIMER' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {log.action_category}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="text-sm font-mono text-gray-700">
                                      {log.action_type}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 font-mono text-sm">{log.user_id || 'N/A'}</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      log.status === 'success' ? 'bg-green-100 text-green-700' :
                                      log.status === 'failure' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-sm text-gray-500">
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-gray-500 font-mono">
                                    {log.ip_address || 'N/A'}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                                    {log.description}
                                  </td>
                                  <td className="py-4 px-4">
                                    {log.metadata && (
                                      <button
                                        onClick={() => setExpandedAuditLog(expandedAuditLog === log.id ? null : log.id)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                      >
                                        {expandedAuditLog === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        {expandedAuditLog === log.id ? 'Hide' : 'Show'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                                {expandedAuditLog === log.id && log.metadata && (
                                  <tr className="bg-gray-50">
                                    <td colSpan={8} className="py-4 px-4">
                                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h4>
                                        <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs (placeholder) */}
            {(activeTab === 'resolutions' || activeTab === 'votes' || activeTab === 'proxy') && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                    </h3>
                    <p className="text-gray-500">
                      This section is under development. Please check back soon.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Placeholder functions (need to be implemented)
const handleEditUser = (user: User) => {
  console.log('Edit user:', user);
};

const handleDeleteUser = (userId: string) => {
  console.log('Delete user:', userId);
};

const handleEditEmployee = (emp: Employee) => {
  console.log('Edit employee:', emp);
};

const handleDeleteEmployee = (empId: string) => {
  console.log('Delete employee:', empId);
};

export default AdminDashboard_2;
