import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Vote,
  Calendar,
  Activity,
  Plus,
  Eye,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  RefreshCw,
  Database,
  Shield,
  Settings,
  FileText,
  History,
  UserPlus,
  UserMinus,
  GitBranch,
  Users2,
  Target,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  XCircle,
  Mail,
  Lock,
  User
} from 'lucide-react';
import apiService from '../services/api';
// import AuditService from '../services/auditService';
// import ProxyService from '../services/proxyService';
import { AuditLog, ProxyGroup, ProxyVote } from '../types/audit';

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
  isActive: boolean;
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
  
  const [activeTab, setActiveTab] = useState< 'users' | 'employees' | 'resolutions' | 'votes' | 'audit' | 'proxy' | 'register'>('users');
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

//   const auditService = AuditService.getInstance();

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchEmployees();
    fetchResolutions();
    fetchProxyGroups();
    fetchProxyVotes();
    fetchVoteLogs();

      // Mock comprehensive audit logs
//       setAuditLogs([
//   {
//     id: '1',
//     table_name: 'users',
//     action: 'INSERT',
//     record_id: '3',
//     old_values: null,
//     new_values: { name: 'Mike Wilson', email: 'mike@company.com', role: 'voter' },
//     user_name: 'John Admin',
//     user_id: 'admin_1',
//     created_at: '2025-01-15T09:30:00Z',
//     ip_address: '192.168.1.50',
//     user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//     description: 'New user account created'
//   },
//   {
//     id: '2',
//     table_name: 'votes',
//     action: 'INSERT',
//     record_id: '1',
//     old_values: null,
//     new_values: { voter_id: '2', vote_type: 'employee', employee_id: '1' },
//     user_name: 'Jane Voter',
//     user_id: 'voter_2',
//     created_at: '2025-01-15T09:30:00Z',
//     ip_address: '192.168.1.100',
//     user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//     description: 'Vote cast for employee Bilal Cassim'
//   },
//   {
//     id: '3',
//     table_name: 'users',
//     action: 'UPDATE',
//     record_id: '2',
//     old_values: { last_login: '2025-01-14T08:45:00Z' },
//     new_values: { last_login: '2025-01-15T08:45:00Z' },
//     user_name: 'System',
//     user_id: 'system',
//     created_at: '2025-01-15T08:45:00Z',
//     ip_address: '127.0.0.1',
//     user_agent: 'System/1.0',
//     description: 'User login timestamp updated'
//   },
//   {
//     id: '4',
//     table_name: 'employees',
//     action: 'UPDATE',
//     record_id: '1',
//     old_values: { total_votes: 44 },
//     new_values: { total_votes: 45 },
//     user_name: 'System',
//     user_id: 'system',
//     created_at: '2025-01-15T09:30:00Z',
//     ip_address: '127.0.0.1',
//     user_agent: 'System/1.0',
//     description: 'Employee vote count incremented'
//   }
// ]);


  }, []);



  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Content-Type': 'application/json'
        }
      }); 
      

      const result = await response.json(); 
      console.log("Fetched users", result);
      if (response.ok) {
        setUsers(result.data);
      } else {
        setError(result.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
  

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/admin/employees', {
        headers: {
          'Content-Type': 'application/json'
        }
      }); 

      const result = await response.json(); 
      console.log("Fetched employee users", result);
      if (response.ok) {
        setEmployees(result.data);
      } else {
        setError(result.message || 'Failed to fetch employees');
      }
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResolutions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/resolutions');
      const result = await response.json();
      if (result.success) {
        setResolutions(result.data);
      }
    } catch (error) {
      console.error('Error fetching resolutions:', error);
      setError('Failed to fetch resolutions');
    }
  };

  const fetchProxyGroups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/proxy/admin/all-groups');
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
      const response = await fetch('http://localhost:3001/api/proxy/votes');
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
      const response = await fetch('http://localhost:3001/api/admin/votes/logs');
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API calls with enhanced dummy data
      await new Promise(resolve => setTimeout(resolve, 1000));

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData = {
      name: newUser.name,
      email: newUser.email, 
      password: newUser.password,
      role_id: newUser.role_id
    };
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        await fetchUsers();
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', role_id: 2 });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error: ' + error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const oldUser = users.find(u => u.id === editingUser.id);
      
      const response = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingUser.name,
          avatar: editingUser.avatar,
          isActive: editingUser.isActive,
          role: editingUser.role
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchUsers();
        
        // await auditService.logAction(
        //   'users',
        //   'UPDATE',
        //   editingUser.id,
        //   oldUser,
        //   editingUser,
        //   `User account updated: ${editingUser.name}`
        // );
        
        setShowEditUserModal(false);
        setEditingUser(null);
      } else {
        setError(result.message || 'Failed to update user');
      }
    } catch (error: any) {
      setError('Error updating user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const userToDelete = users.find(u => u.id === userId);
      
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchUsers();
        
        // await auditService.logAction(
        //   'users',
        //   'DELETE',
        //   userId,
        //   userToDelete,
        //   null,
        //   `User account deleted: ${userToDelete?.name}`
        // );
        
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      } else {
        setError(result.message || 'Failed to delete user');
      }
    } catch (error: any) {
      setError('Error deleting user: ' + error.message);
    }
  };

  const handleSetVoteLimits = async (user: User) => {
    setSelectedUserForLimits(user);
    
    // Fetch user's current vote limits and super admin boundaries
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${user.id}/vote-limits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setVoteLimitsForm({
            vote_weight: result.data.user.vote_weight || 1.0,
            max_votes_allowed: result.data.user.max_votes_allowed || 1,
            min_votes_required: result.data.user.min_votes_required || 1
          });
          setSuperAdminBoundaries(result.data.super_admin_boundaries);
        }
      }
    } catch (error) {
      console.error('Error fetching vote limits:', error);
    }
    
    setShowVoteLimitsModal(true);
  };

  const handleSaveVoteLimits = async () => {
    if (!selectedUserForLimits) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${selectedUserForLimits.id}/vote-limits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(voteLimitsForm)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchUsers();
        setShowVoteLimitsModal(false);
        setSelectedUserForLimits(null);
        alert('Vote limits updated successfully!');
      } else {
        setError(result.message || 'Failed to update vote limits');
      }
    } catch (error: any) {
      setError('Error updating vote limits: ' + error.message);
    }
  };


  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const employeeData = {
      name: newEmployee.name,
      department: newEmployee.department, 
      position: newEmployee.position, 
      bio: newEmployee.bio, 
      yearsOfService: newEmployee.yearsOfService 
    };
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        await fetchEmployees();
        setShowAddEmployeeModal(false);
        setNewEmployee({ name: '', department: '', position: '', bio: '', yearsOfService: '' });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error: ' + error);
    }
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setShowEditEmployeeModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const oldEmployee = employees.find(e => e.id === editingEmployee.id);
      
      const response = await fetch(`http://localhost:3001/api/admin/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingEmployee.name,
          position: editingEmployee.position,
          department: editingEmployee.department,
          bio: editingEmployee.bio,
          yearsOfService: editingEmployee.yearsOfService || editingEmployee.years_of_service
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchEmployees();
        
        // await auditService.logAction(
        //   'employees',
        //   'UPDATE',
        //   editingEmployee.id,
        //   oldEmployee,
        //   editingEmployee,
        //   `Employee updated: ${editingEmployee.name}`
        // );
        
        setShowEditEmployeeModal(false);
        setEditingEmployee(null);
      } else {
        setError(result.message || 'Failed to update employee');
      }
    } catch (error: any) {
      setError('Error updating employee: ' + error.message);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;

    try {
      const employeeToDelete = employees.find(e => e.id === employeeId);
      
      const response = await fetch(`http://localhost:3001/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchEmployees();
        
        // await auditService.logAction(
        //   'employees',
        //   'DELETE',
        //   employeeId,
        //   employeeToDelete,
        //   null,
        //   `Employee deleted: ${employeeToDelete?.name}`
        // );
        
        setStats(prev => ({ ...prev, totalEmployees: prev.totalEmployees - 1 }));
      } else {
        setError(result.message || 'Failed to delete employee');
      }
    } catch (error: any) {
      setError('Error deleting employee: ' + error.message);
    }
  };

  const handleCreateResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResolution.title || !newResolution.description || !newResolution.department || 
        !newResolution.voting_start_date || !newResolution.voting_end_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/resolutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newResolution.title,
          description: newResolution.description,
          department: newResolution.department,
          voting_start_date: newResolution.voting_start_date,
          voting_end_date: newResolution.voting_end_date
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchResolutions();
        
        // await auditService.logAction(
        //   'resolutions',
        //   'CREATE',
        //   result.data.id,
        //   null,
        //   newResolution,
        //   `Resolution created: ${newResolution.title}`
        // );
        
        setShowCreateResolutionModal(false);
        setNewResolution({
          title: '',
          description: '',
          department: '',
          voting_start_date: '',
          voting_end_date: ''
        });
        setStats(prev => ({ ...prev, totalResolutions: prev.totalResolutions + 1 }));
      } else {
        setError(result.message || 'Failed to create resolution');
      }
    } catch (error: any) {
      setError('Error creating resolution: ' + error.message);
    }
  };

  const handleUpdateResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResolution) return;

    try {
      const oldResolution = resolutions.find(r => r.id === editingResolution.id);
      
      const response = await fetch(`http://localhost:3001/api/admin/resolutions/${editingResolution.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingResolution.title,
          description: editingResolution.description,
          department: editingResolution.department,
          voting_start_date: editingResolution.voting_start_date,
          voting_end_date: editingResolution.voting_end_date,
          status: editingResolution.status
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchResolutions();
        
        // await auditService.logAction(
        //   'resolutions',
        //   'UPDATE',
        //   editingResolution.id,
        //   oldResolution,
        //   editingResolution,
        //   `Resolution updated: ${editingResolution.title}`
        // );
        
        setShowEditResolutionModal(false);
        setEditingResolution(null);
      } else {
        setError(result.message || 'Failed to update resolution');
      }
    } catch (error: any) {
      setError('Error updating resolution: ' + error.message);
    }
  };

  const handleDeleteResolution = async (resolutionId: string) => {
    if (!confirm('Are you sure you want to delete this resolution? This action cannot be undone.')) return;

    try {
      const resolutionToDelete = resolutions.find(r => r.id === resolutionId);
      
      const response = await fetch(`http://localhost:3001/api/admin/resolutions/${resolutionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchResolutions();
        
        // await auditService.logAction(
        //   'resolutions',
        //   'DELETE',
        //   resolutionId,
        //   resolutionToDelete,
        //   null,
        //   `Resolution deleted: ${resolutionToDelete?.title}`
        // );
        
        setStats(prev => ({ ...prev, totalResolutions: prev.totalResolutions - 1 }));
      } else {
        setError(result.message || 'Failed to delete resolution');
      }
    } catch (error: any) {
      setError('Error deleting resolution: ' + error.message);
    }
  };

  const handleCreateProxyGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    if (!newProxyGroup.proxy_id || !newProxyGroup.reason || !newProxyGroup.valid_from || 
        !newProxyGroup.valid_until || newProxyGroup.member_ids.length === 0) {
      setError('Please fill in all required fields and select at least one member');
      return;
    }

    // Validate dates
    const validFrom = new Date(newProxyGroup.valid_from);
    const validUntil = new Date(newProxyGroup.valid_until);
    
    if (validFrom >= validUntil) {
      setError('Valid until date must be after valid from date');
      return;
    }

    try {
      console.log('Sending proxy group data:', newProxyGroup);
      
      const response = await fetch('http://localhost:3001/api/proxy/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proxy_id: parseInt(newProxyGroup.proxy_id),
          vote_type: newProxyGroup.vote_type,
          employee_id: newProxyGroup.employee_id ? parseInt(newProxyGroup.employee_id) : null,
          resolution_id: newProxyGroup.resolution_id ? parseInt(newProxyGroup.resolution_id) : null,
          reason: newProxyGroup.reason.trim(),
          valid_from: newProxyGroup.valid_from,
          valid_until: newProxyGroup.valid_until,
          member_ids: newProxyGroup.member_ids.map(id => parseInt(id))
        })
      });

      const result = await response.json();
      console.log('Server response:', result);
      
      if (response.ok && result.success) {      
      
      const [showAgmTimerModal, setShowAgmTimerModal] = useState(false);
      const [agmStartTime, setAgmStartTime] = useState('15:00');
      const [agmEndTime, setAgmEndTime] = useState('17:00');
      const [agmModalError, setAgmModalError] = useState('');
      
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
            window.dispatchEvent(new Event('agmTimerUpdated'));
          } else {
            setAgmModalError(result.message || 'Failed to set AGM timer.');
          }
        } catch (err) {
          setAgmModalError('Failed to set AGM timer.');
        }
      };
      
      {/* Add this button to open the modal, near your Start AGM button */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        onClick={() => setShowAgmTimerModal(true)}
      >
        <Clock className="h-4 w-4" />
        Set AGM Timer
      </button>
      
      {/* AGM Timer Modal */}
      <AnimatePresence>
        {showAgmTimerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Set AGM Voting Timer</h3>
                <button
                  onClick={() => setShowAgmTimerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSetAgmTimer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={agmStartTime}
                    onChange={e => setAgmStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={agmEndTime}
                    onChange={e => setAgmEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                {agmModalError && (
                  <div className="text-red-600 text-sm mb-2">{agmModalError}</div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAgmTimerModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    Set Timer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        await fetchProxyGroups();
        await fetchProxyVotes();
        
        // await auditService.logAction(
        //   'proxy_groups',
        //   'CREATE',
        //   result.data.id,
        //   null,
        //   newProxyGroup,
        //   `Proxy group created with ${newProxyGroup.member_ids.length} members`
        // );
        
        setShowProxyModal(false);
        setNewProxyGroup({
          proxy_id: '',
          vote_type: 'employee',
          employee_id: '',
          resolution_id: '',
          reason: '',
          valid_from: '',
          valid_until: '',
          member_ids: [],
        });
        setStats(prev => ({ ...prev, totalProxyGroups: prev.totalProxyGroups + 1 }));
      } else {
        setError(result.message || 'Failed to create proxy group');
      }
    } catch (error: any) {
      console.error('Error creating proxy group:', error);
      setError(`Error creating proxy group: ${error.message}`);
    }
  };

  const handleDeleteProxyGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this proxy group? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/proxy/admin/group/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Delete proxy group response:', result);
      
      if (response.ok && result.success) {
        alert('Proxy group deleted successfully');
        await fetchProxyGroups();
        await fetchProxyVotes();
      } else {
        alert(result.message || 'Failed to delete proxy group');
      }
    } catch (error: any) {
      console.error('Error deleting proxy group:', error);
      alert('Error deleting proxy group: ' + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'active': return <Activity className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
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
                <RefreshCw className="h-4 w-4" />
                Admin Approvals
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={async () => {
                await fetch('http://localhost:3001/api/admin/agm-timer/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ start: '00:30', end: '11:00' })
                });
                window.dispatchEvent(new Event('agmTimerUpdated'));
              }}
            >
              <Download className="h-4 w-4" />
              Start AGM
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={async () => {
                await fetch('http://localhost:3001/api/admin/agm-timer/end', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                window.dispatchEvent(new Event('agmTimerUpdated'));
              }}
            >
              <Download className="h-4 w-4" />
              End AGM
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
          {/* <TabButton id="analytics" label="Analytics" icon={BarChart3} isActive={activeTab === 'analytics'} onClick={setActiveTab} /> */}
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
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add User
                    </button>
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
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Vote Limits</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Modified</th>
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
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">Weight: {user.vote_weight || 1.0}x</div>
                                  <div className="text-gray-500">Range: {user.min_votes_required || 1} - {user.max_votes_allowed || 1}</div>
                                  {user.vote_limit_set_by && (
                                    <div className="text-xs text-gray-400 mt-1">Set by: {user.vote_limit_set_by}</div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className="text-sm">{user.isActive ? 'Active' : 'Inactive'}</span>
                                  {user.email_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => handleSetVoteLimits(user)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Set Vote Limits"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </button>
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

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Years of Service</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Votes</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Modified</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees
                          .filter(emp => 
                            (departmentFilter === 'all' || emp.department === departmentFilter) &&
                            (emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                             emp.position.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
                          )
                          .map((emp) => (
                            <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-semibold text-sm">
                                      {emp.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{emp.name}</p>
                                    <p className="text-sm text-gray-500">ID: {emp.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-600">{emp.position}</td>
                              <td className="py-4 px-4 text-gray-600">{emp.department}</td>
                              <td className="py-4 px-4 text-gray-600">{emp.years_of_service || emp.yearsOfService || 0} years</td>
                              <td className="py-4 px-4">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                                  {emp.total_votes || emp.votes || 0}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {emp.updated_at || emp.updatedAt ? new Date(emp.updated_at || emp.updatedAt!).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2 justify-end">
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
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Resolutions Tab */}
            {activeTab === 'resolutions' && (
              <div className="space-y-6">
                {/* Header with Create Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Resolution Management</h3>
                  <button
                    onClick={() => setShowCreateResolutionModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Resolution
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search resolutions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                  </div>

                  {/* Resolutions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Voting Period</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Votes</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resolutions
                          .filter(resolution => 
                            (resolution.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             resolution.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                            (!departmentFilter || resolution.department === departmentFilter)
                          )
                          .map((resolution) => (
                            <tr key={resolution.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium text-gray-900">{resolution.title}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{resolution.description}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {resolution.department}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(resolution.status)}
                                  <span className="capitalize text-sm font-medium">{resolution.status}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                <div>{new Date(resolution.created_at).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">to {new Date(resolution.updated_at || resolution.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex gap-2">
                                  <span className="text-green-600">For: {resolution.total_votes || 0}</span>
                                  <span className="text-red-600">Against: 0</span>
                                  <span className="text-gray-600">Abstain: 0</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingResolution(resolution);
                                      setShowEditResolutionModal(true);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResolution(resolution.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
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

                  {resolutions.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No resolutions found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {searchTerm || departmentFilter ? 'Try adjusting your search or filter' : 'Create your first resolution to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proxy Management Tab */}
            {activeTab === 'proxy' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Proxy Management</h3>
                      <p className="text-sm text-gray-500">Manage voting delegation and proxy groups</p>
                    </div>
                    <button
                      onClick={() => navigate('/proxy-choice/admin')}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create Proxy Form
                    </button>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Total Groups</p>
                          <p className="text-2xl font-bold text-purple-900">{proxyGroups.length}</p>
                        </div>
                        <GitBranch className="h-8 w-8 text-purple-400" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Members</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {proxyGroups.reduce((sum, g) => sum + (g.members?.length || 0), 0)}
                          </p>
                        </div>
                        <Users2 className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Votes Allocated</p>
                          <p className="text-2xl font-bold text-green-900">
                            {proxyGroups.reduce((sum, g) => sum + (g.total_votes_allocated || 0), 0)}
                          </p>
                        </div>
                        <Vote className="h-8 w-8 text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Proxy Groups List */}
                  <div className="mb-8">
                    <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      All Proxy Groups
                    </h4>
                    <div className="space-y-4">
                      {proxyGroups.map((group: any) => (
                        <div key={group.id} className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <GitBranch className="h-6 w-6 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold text-gray-900">{group.group_name || 'Unnamed Group'}</h5>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    group.is_active 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {group.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    group.appointment_type === 'INSTRUCTIONAL' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : group.appointment_type === 'DISCRETIONAL'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {group.appointment_type || 'MIXED'}
                                  </span>
                                  {group.has_votes_cast === 1 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                                      <Lock className="h-3 w-3" />
                                      Votes Cast
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Principal: <span className="font-medium">{group.principal_name || 'Unknown'}</span>
                                  {group.principal_email && ` (${group.principal_email})`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {new Date(group.created_at).toLocaleString()} • 
                                  ID: {group.id}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/view-my-proxy?groupId=${group.id}`)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (group.has_votes_cast === 1) {
                                    alert('Cannot delete group - votes have been cast');
                                    return;
                                  }
                                  if (confirm(`Delete proxy group "${group.group_name}"?`)) {
                                    handleDeleteProxyGroup(parseInt(group.id));
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Group"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Members Section */}
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Users2 className="h-4 w-4" />
                                Proxy Members ({group.members?.length || 0})
                              </h6>
                              {group.total_votes_allocated > 0 && (
                                <span className="text-xs text-gray-500">
                                  Total Votes Allocated: <span className="font-semibold">{group.total_votes_allocated}</span>
                                </span>
                              )}
                            </div>
                            {group.members && group.members.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {group.members.map((member: any) => (
                                  <div key={member.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">{member.member_name || member.full_name}</p>
                                        <p className="text-xs text-gray-500">
                                          {member.member_email} • Member #{member.member_number || 'N/A'}
                                        </p>
                                      </div>
                                      {member.has_voted === 1 && (
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        member.appointment_type === 'INSTRUCTIONAL' 
                                          ? 'bg-blue-100 text-blue-700' 
                                          : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {member.appointment_type}
                                      </span>
                                      {member.votes_allocated > 0 && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                          {member.votes_allocated} votes
                                        </span>
                                      )}
                                    </div>
                                    {member.appointment_type === 'INSTRUCTIONAL' && member.allowed_candidates && member.allowed_candidates.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Allowed Candidates:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {member.allowed_candidates.map((candidate: any, idx: number) => (
                                            <span key={idx} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded">
                                              {candidate.candidate_name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">No members in this group</p>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {proxyGroups.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <GitBranch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h5 className="text-lg font-medium text-gray-900 mb-2">No Proxy Groups Found</h5>
                          <p className="text-sm text-gray-500 mb-4">Get started by creating your first proxy delegation</p>
                          <button
                            onClick={() => navigate('/proxy-choice/admin')}
                            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Create First Proxy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vote Logs Tab */}
            {activeTab === 'votes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Vote Activity Logs</h3>

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by voter email or comment..."
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
                    <option value="all">All Vote Types</option>
                    <option value="employee">Employee Votes</option>
                    <option value="resolution">Resolution Votes</option>
                  </select>
                </div>

                {voteLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No vote logs found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Target ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Choice</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Weight</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">IP</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Anonymous</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Comment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voteLogs
                          .filter(
                            (log) =>
                              (filterType === 'all' || log.vote_type === filterType) &&
                              (log.voter_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              log.comment?.toLowerCase().includes(searchTerm.toLowerCase()))
                          )
                          .map((log) => (
                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4 text-sm">
                                <div className="font-medium text-gray-900">
                                  {log.is_anonymous ? '(Anonymous)' : log.voter_email || `User ${log.voter_id}`}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  log.vote_type === 'employee' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {log.vote_type}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-900">
                                {log.vote_type === 'employee' 
                                  ? log.employee_id ?? '-' 
                                  : log.resolution_id ?? '-'}
                              </td>
                              <td className="py-4 px-4 text-sm">
                                {log.vote_choice ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    log.vote_choice === 'YES' 
                                      ? 'bg-green-100 text-green-800'
                                      : log.vote_choice === 'NO'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {log.vote_choice}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                {log.vote_weight ?? 1}x
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {new Date(log.created_at).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-4 px-4 text-sm font-mono text-gray-500">
                                {log.ip_address || 'N/A'}
                              </td>
                              <td className="py-4 px-4">
                                {log.is_anonymous ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 text-red-500" />
                                )}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500 max-w-xs">
                                <div className="truncate" title={log.comment || ''}>
                                  {log.comment || '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {voteLogs.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    Showing {voteLogs.length} vote{voteLogs.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}


            {/* Comprehensive Audit Trail Tab */}
                        {activeTab === 'audit' && (
                          <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                              <div className="flex items-center justify-between mb-6">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">System Audit Trail</h3>
                                  <p className="text-sm text-gray-500">Complete record of all system changes and activities</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <select
                                    value={auditFilter}
                                    onChange={(e) => setAuditFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="all">All Tables</option>
                                    <option value="users">Users</option>
                                    <option value="votes">Votes</option>
                                    <option value="employees">Employees</option>
                                    <option value="resolutions">Resolutions</option>
                                    <option value="proxy_groups">Proxy Groups</option>
                                    <option value="proxy_votes">Proxy Votes</option>
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
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Table</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Operation</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Record ID</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Changed By</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {auditLogs
                                      .filter(log => auditFilter === 'all' || log.table_name === auditFilter)
                                      .map((log) => (
                                        <React.Fragment key={log.id}>
                                          <tr className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono">
                                                {log.table_name}
                                              </span>
                                            </td>
                                            <td className="py-4 px-4">
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                log.operation === 'INSERT' ? 'bg-green-100 text-green-700' :
                                                log.operation === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                              }`}>
                                                {log.operation}
                                              </span>
                                            </td>
                                            <td className="py-4 px-4 font-mono text-sm">{log.record_id}</td>
                                            {/* <td className="py-4 px-4">
                                              <div className="font-medium">{log.changed_by}</div>
                                              <div className="text-sm text-gray-500">ID: {log.changed_by_id}</div>
                                            </td> */}
                                            {/* <td className="py-4 px-4 text-sm text-gray-500">
                                              {new Date(log.changed_at).toLocaleString()}
                                            </td> */}
                                            <td className="py-4 px-4 text-sm text-gray-500 font-mono">
                                              {log.ip_address || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                                              {log.description}
                                            </td>
                                            <td className="py-4 px-4">
                                              <button
                                                onClick={() => setExpandedAuditLog(expandedAuditLog === log.id ? null : log.id)}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                              >
                                                {expandedAuditLog === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                {expandedAuditLog === log.id ? 'Hide' : 'Show'}
                                              </button>
                                            </td>
                                          </tr>
                                          {expandedAuditLog === log.id && (
                                            <tr>
                                              <td colSpan={8} className="py-4 px-4 bg-gray-50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  {log.old_values && (
                                                    <div>
                                                      <h5 className="font-medium text-gray-700 mb-2">Old Values:</h5>
                                                      <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-x-auto">
                                                        {JSON.stringify(log.old_values, null, 2)}
                                                      </pre>
                                                    </div>
                                                  )}
                                                  {log.new_values && (
                                                    <div>
                                                      <h5 className="font-medium text-gray-700 mb-2">New Values:</h5>
                                                      <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-x-auto">
                                                        {JSON.stringify(log.new_values, null, 2)}
                                                      </pre>
                                                    </div>
                                                  )}
                                                </div>
                                                {log.user_agent && (
                                                  <div className="mt-3">
                                                    <h5 className="font-medium text-gray-700 mb-1">User Agent:</h5>
                                                    <p className="text-xs text-gray-600 font-mono">{log.user_agent}</p>
                                                  </div>
                                                )}
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
            
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
  value={newUser.role_id}
  onChange={(e) => {
    const selectedRoleId = parseInt(e.target.value);
    console.log("Selected Role ID:", selectedRoleId); // Logs the value
    setNewUser({ ...newUser, role_id: selectedRoleId });
  }}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value={2}>Voter</option>
  <option value={1}>Admin</option>
                  </select>

                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Add User
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditUserModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="voter">Voter</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingUser.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Update User
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set Vote Limits Modal */}
      <AnimatePresence>
        {showVoteLimitsModal && selectedUserForLimits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Set Vote Limits</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedUserForLimits.name}</p>
                </div>
                <button
                  onClick={() => setShowVoteLimitsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Super Admin Boundaries Display */}
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Super Admin Boundaries</h4>
                </div>
                <p className="text-sm text-purple-700">
                  Individual votes must be between <strong>{superAdminBoundaries.min_individual_votes}</strong> and <strong>{superAdminBoundaries.max_individual_votes}</strong>
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vote Weight (0.1 - 10.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={voteLimitsForm.vote_weight}
                    onChange={(e) => setVoteLimitsForm({ ...voteLimitsForm, vote_weight: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Multiplier for vote calculations (e.g., 1.5x vote weight)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Votes Allowed
                  </label>
                  <input
                    type="number"
                    min={superAdminBoundaries.min_individual_votes}
                    max={superAdminBoundaries.max_individual_votes}
                    value={voteLimitsForm.max_votes_allowed}
                    onChange={(e) => setVoteLimitsForm({ ...voteLimitsForm, max_votes_allowed: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be within super admin boundaries ({superAdminBoundaries.min_individual_votes} - {superAdminBoundaries.max_individual_votes})
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Votes Required
                  </label>
                  <input
                    type="number"
                    min={superAdminBoundaries.min_individual_votes}
                    max={voteLimitsForm.max_votes_allowed}
                    value={voteLimitsForm.min_votes_required}
                    onChange={(e) => setVoteLimitsForm({ ...voteLimitsForm, min_votes_required: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be ≥ {superAdminBoundaries.min_individual_votes} and ≤ max votes allowed
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowVoteLimitsModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVoteLimits}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Limits
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddEmployeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Employee</h3>
                <button
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter position"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Service</label>
                  <input
                    type="number"
                    value={newEmployee.yearsOfService}
                    onChange={(e) => setNewEmployee({ ...newEmployee, yearsOfService: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter years of service"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={newEmployee.bio}
                    onChange={(e) => setNewEmployee({ ...newEmployee, bio: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter employee bio"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Add Employee
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Employee Modal */}
      <AnimatePresence>
        {showEditEmployeeModal && editingEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Employee</h3>
                <button
                  onClick={() => setShowEditEmployeeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <input
                    type="text"
                    value={editingEmployee.position}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Service</label>
                  <input
                    type="number"
                    value={editingEmployee.yearsOfService || editingEmployee.years_of_service || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, yearsOfService: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div> */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={editingEmployee.bio || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, bio: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter employee bio"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditEmployeeModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Update Employee
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Resolution Modal */}
      <AnimatePresence>
        {showCreateResolutionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Resolution</h3>
              <form onSubmit={handleCreateResolution} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newResolution.title}
                    onChange={(e) => setNewResolution({...newResolution, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter resolution title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={newResolution.description}
                    onChange={(e) => setNewResolution({...newResolution, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32"
                    placeholder="Enter detailed description of the resolution"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={newResolution.department}
                    onChange={(e) => setNewResolution({...newResolution, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voting Start Date *</label>
                    <input
                      type="datetime-local"
                      value={newResolution.voting_start_date}
                      onChange={(e) => setNewResolution({...newResolution, voting_start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voting End Date *</label>
                    <input
                      type="datetime-local"
                      value={newResolution.voting_end_date}
                      onChange={(e) => setNewResolution({...newResolution, voting_end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Resolution
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateResolutionModal(false);
                      setNewResolution({
                        title: '',
                        description: '',
                        department: '',
                        voting_start_date: '',
                        voting_end_date: ''
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Resolution Modal */}
      <AnimatePresence>
        {showEditResolutionModal && editingResolution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Resolution</h3>
              <form onSubmit={handleUpdateResolution} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingResolution.title}
                    onChange={(e) => setEditingResolution({...editingResolution, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={editingResolution.description}
                    onChange={(e) => setEditingResolution({...editingResolution, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={editingResolution.department || editingResolution.department}
                    onChange={(e) => setEditingResolution({...editingResolution, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingResolution.status}
                    onChange={(e) => setEditingResolution({...editingResolution, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voting Start Date *</label>
                    <input
                      type="datetime-local"
                      value={editingResolution.voting_start_date?.slice(0, 16)}
                      onChange={(e) => setEditingResolution({...editingResolution, voting_start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voting End Date *</label>
                    <input
                      type="datetime-local"
                      value={editingResolution.voting_end_date?.slice(0, 16)}
                      onChange={(e) => setEditingResolution({...editingResolution, voting_end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Update Resolution
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditResolutionModal(false);
                      setEditingResolution(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Proxy Group Modal */}
      <AnimatePresence>
        {showProxyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Create Proxy Group</h3>
                  <p className="text-sm text-gray-500">Assign one person to vote on behalf of multiple users</p>
                </div>
                <button
                  onClick={() => setShowProxyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateProxyGroup} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proxy User</label>
                    <select
                      value={newProxyGroup.proxy_id}
                      onChange={(e) => setNewProxyGroup({ ...newProxyGroup, proxy_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select proxy user</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vote Type</label>
                    <select
                      value={newProxyGroup.vote_type}
                      onChange={(e) => setNewProxyGroup({ ...newProxyGroup, vote_type: e.target.value as 'employee' | 'resolution' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="employee">Employee Voting</option>
                      <option value="resolution">Resolution Voting</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                    <input
                      type="date"
                      value={newProxyGroup.valid_from}
                      onChange={(e) => setNewProxyGroup({ ...newProxyGroup, valid_from: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                    <input
                      type="date"
                      value={newProxyGroup.valid_until}
                      onChange={(e) => setNewProxyGroup({ ...newProxyGroup, valid_until: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Delegation</label>
                  <textarea
                    value={newProxyGroup.reason}
                    onChange={(e) => setNewProxyGroup({ ...newProxyGroup, reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Explain why this proxy delegation is needed..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delegating Members</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {users.filter(u => u.id !== newProxyGroup.proxy_id).map(user => (
                      <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={newProxyGroup.member_ids.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProxyGroup({
                                ...newProxyGroup,
                                member_ids: [...newProxyGroup.member_ids, user.id]
                              });
                            } else {
                              setNewProxyGroup({
                                ...newProxyGroup,
                                member_ids: newProxyGroup.member_ids.filter(id => id !== user.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {newProxyGroup.member_ids.length} members
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProxyModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <GitBranch className="h-4 w-4" />
                    Create Proxy Group
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard_2;