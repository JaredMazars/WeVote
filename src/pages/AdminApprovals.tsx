import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowLeft,
  Search,
  Filter,
  Shield,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import Header from '../components/Header';

interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role_name?: string;
  active?: string | boolean;
  employee_number?: string;
  department_name?: string;
  registration_status?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  goodStandingIdNumber?: string;
  proxy_file_name?: string;
  proxy_file_path?: string;
}

interface ProxyForm {
  id?: string;
  appointment: {
    id: string;
    member_title: string;
    member_full_name: string;
    member_surname: string;
    member_membership_number: string;
    member_id_number: string;
    appointment_type: string;
    location_signed: string;
    signed_date: string;
    approval_status: string;
    reviewed_at?: string;
    rejection_reason?: string;
    created_at: string;
    trustee_remuneration?: string;
    remuneration_policy?: string;
    auditors_appointment?: string;
    agm_motions?: string;
    candidate1?: string;
    candidate2?: string;
    candidate3?: string;
  };
  proxy_group?: {
    id: string;
    group_name: string;
    principal_name: string;
    principal_member_number: string;
    is_active: boolean;
  };
  proxy_group_members?: Array<{
    id: string;
    initials: string;
    full_name: string;
    surname: string;
    membership_number: string;
  }>;
}

type TabType = 'users' | 'proxies';

const AdminApprovals: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [proxyForms, setProxyForms] = useState<ProxyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedForm, setSelectedForm] = useState<ProxyForm | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        alert('Authentication required. Please log in again.');
        navigate('/admin/login');
        setLoading(false);
        return;
      }

      console.log('Loading data for tab:', activeTab);
      console.log('Token exists:', !!token);

      if (activeTab === 'users') {
        console.log('Fetching pending registrations...');
        const res = await fetch('http://localhost:3001/api/users/pending/registrations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API error response:', errorText);
          throw new Error(`API error: ${res.status} - ${errorText}`);
        }
        
        const result = await res.json();
        console.log('API Response:', result);

        
        // Transform backend data to frontend format
        const transformedUsers = (result.data || []).map((user: any) => ({
          id: user.id?.toString() || user.UserID?.toString(),
          name: user.name || `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
          first_name: user.FirstName || user.first_name,
          last_name: user.LastName || user.last_name,
          email: user.Email || user.email,
          phone: user.PhoneNumber || user.phone,
          role_name: user.Role || user.role_name,
          active: user.IsActive === 1 || user.active,
          registration_status: user.registration_status || ((user.IsActive === 1 || user.active) ? 'approved' : 'pending'),
          created_at: user.CreatedAt || user.created_at,
          updated_at: user.UpdatedAt || user.updated_at
        }));
        
        console.log('Transformed Users:', transformedUsers);
        setUsers(transformedUsers);
      } else {
        console.log('Fetching pending proxy assignments...');
        const res = await fetch('http://localhost:3001/api/proxy/pending/assignments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API error response:', errorText);
          throw new Error(`API error: ${res.status} - ${errorText}`);
        }
        
        const result = await res.json();
        console.log('API Response:', result);
        
        // Transform backend data to frontend format
        const transformedProxies = (result.data || []).map((proxy: any) => ({
          id: proxy.id?.toString(),
          appointment: {
            id: proxy.appointment?.id || proxy.id?.toString(),
            member_title: '',
            member_full_name: proxy.appointment?.member_full_name || '',
            member_surname: '',
            member_membership_number: '',
            member_id_number: '',
            appointment_type: proxy.appointment?.appointment_type || 'discretionary',
            location_signed: '',
            signed_date: proxy.appointment?.created_at || new Date().toISOString(),
            approval_status: proxy.appointment?.approval_status || 'pending',
            reviewed_at: proxy.appointment?.reviewed_at,
            rejection_reason: proxy.appointment?.rejection_reason,
            created_at: proxy.appointment?.created_at || new Date().toISOString()
          },
          proxy_group: {
            id: proxy.proxy_assignment?.proxy_user_id?.toString() || '',
            group_name: proxy.appointment?.proxy_holder_name || '',
            principal_name: proxy.appointment?.proxy_holder_name || '',
            principal_member_number: '',
            is_active: proxy.appointment?.approval_status === 'approved'
          },
          proxy_group_members: []
        }));
        
        console.log('Transformed Proxies:', transformedProxies);
        setProxyForms(transformedProxies);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (user: User) => {
    if (!window.confirm(`Approve registration for ${user.name}?`)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/users/${user.id}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        // Update user status to approved
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, active: true, registration_status: 'approved' }
            : u
        ));
        alert('User approved successfully!');
        setSelectedUser(null);
      } else {
        alert('Failed to approve user: ' + result.message);
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Something went wrong while approving the user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveGoodStanding = async (user: User) => {
    if (!window.confirm(`Approve good standing status for ${user.name}?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/approval/users/${user.id}/approve-good-standing`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.success) {
        setUsers(prev =>
          prev.map(u =>
            u.id === user.id
              ? { ...u, goodStandingIdNumber: user.id, active: true }
              : u
          )
        );
        alert('Good standing approved successfully!');
        setSelectedUser(null);
      } else {
        alert('Failed to approve good standing: ' + result.message);
      }
    } catch (error) {
      console.error('Error approving good standing:', error);
      alert('Something went wrong.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async (user: User) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/users/${user.id}/reject`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      const result = await response.json();
      if (result.success) {
        // Update user status to rejected
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, registration_status: 'rejected', rejection_reason: rejectionReason }
            : u
        ));
        alert('User registration rejected');
        setSelectedUser(null);
        setRejectionReason('');
      } else {
        alert('Failed to reject user: ' + result.message);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Something went wrong while rejecting the user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveProxy = async (form: ProxyForm) => {
    if (!window.confirm(`Approve proxy assignment?`)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const proxyId = form.id;
      const res = await fetch(`http://localhost:3001/api/proxy/${proxyId}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (result.success) {
        // Update proxy status to approved
        setProxyForms(prev => prev.map(f => 
          f.id === form.id 
            ? { ...f, appointment: { ...f.appointment, approval_status: 'approved' } }
            : f
        ));
        alert('Proxy assignment approved successfully!');
        setSelectedForm(null);
      } else {
        alert('Failed to approve proxy: ' + result.message);
      }
    } catch (error) {
      console.error('Error approving proxy:', error);
      alert('Something went wrong while approving the proxy.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProxy = async (form: ProxyForm) => {
    if (!window.confirm(`Reject proxy assignment?`)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const proxyId = form.id;
      const res = await fetch(`http://localhost:3001/api/proxy/${proxyId}/reject`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (result.success) {
        // Update proxy status to rejected
        setProxyForms(prev => prev.map(f => 
          f.id === form.id 
            ? { ...f, appointment: { ...f.appointment, approval_status: 'rejected' } }
            : f
        ));
        alert('Proxy assignment rejected');
        setSelectedForm(null);
      } else {
        alert('Failed to reject proxy: ' + result.message);
      }
    } catch (error) {
      console.error('Error rejecting proxy:', error);
      alert('Something went wrong while rejecting the proxy.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users
    .filter(u => filter === 'all' || u.registration_status === filter)
    .filter(u =>
      `${u.name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    );


  const filteredProxyForms = proxyForms
    .filter(f => filter === 'all' || f.appointment.approval_status === filter)
    .filter(f =>
      `${f.appointment.member_full_name} ${f.appointment.member_surname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  const stats = {
    totalUsers: users.length,
    pendingUsers: users.filter(u => u.registration_status === 'pending').length,
    approvedUsers: users.filter(u => u.registration_status === 'approved').length,
    totalProxies: proxyForms.length,
    pendingProxies: proxyForms.filter(f => f.appointment.approval_status === 'pending').length,
    approvedProxies: proxyForms.filter(f => f.appointment.approval_status === 'approved').length
  };

  console.log('Rendered AdminApprovals with',  users);

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9333ea, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7e22ce, #db2777);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
        <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => navigate('/admin')}
          className="inline-flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] font-medium mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Admin Dashboard</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#464B4B] mb-2">Approvals Dashboard</h1>
          <p className="text-[#464B4B]/70">Review and approve user registrations and proxy assignments</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-[#464B4B]">{stats.totalUsers}</span>
            </div>
            <p className="text-sm text-[#464B4B]/70">Total Users</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl shadow-lg p-4 border-2 border-yellow-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-[#464B4B]">{stats.pendingUsers}</span>
            </div>
            <p className="text-sm text-[#464B4B]/70">Pending Users</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-100"
          >
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-[#464B4B]">{stats.approvedUsers}</span>
            </div>
            <p className="text-sm text-[#464B4B]/70">Approved Users</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-[#464B4B]">{stats.totalProxies}</span>
            </div>
            <p className="text-sm text-[#464B4B]/70">Total Proxies</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-4 border-2 border-yellow-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-[#464B4B]">{stats.pendingProxies}</span>
            </div>
            <p className="text-sm text-[#464B4B]/70">Pending Proxies</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-100"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-[#464B4B]">{stats.approvedProxies}</span>
            </div>
            <p className="text-sm text-[#464B4B]/70">Approved Proxies</p>
          </motion.div>
        </div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="border-b-2 border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-8 py-4 font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white'
                    : 'text-[#464B4B] hover:bg-gray-50'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>User Registrations</span>
                {stats.pendingUsers > 0 && (
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                    {stats.pendingUsers}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('proxies')}
                className={`flex items-center space-x-2 px-8 py-4 font-semibold transition-all ${
                  activeTab === 'proxies'
                    ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white'
                    : 'text-[#464B4B] hover:bg-gray-50'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span>Proxy Assignments</span>
                {stats.pendingProxies > 0 && (
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                    {stats.pendingProxies}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={activeTab === 'users' ? 'Search by name or email...' : 'Search by member name...'}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-[#464B4B]" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072CE] mx-auto mb-4"></div>
                <p className="text-[#464B4B]/70">Loading...</p>
              </div>
            ) : activeTab === 'users' ? (
              filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-[#464B4B]/70">No user registrations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Active</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Good Standing</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Submitted</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="h-10 w-10 rounded-full" />
                              ) : (
                                <div className="h-10 w-10 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold">{user.name?.charAt(0)}</span>
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-[#464B4B]">{user.name}</div>
                                {user.employee_number && (
                                  <div className="text-xs text-[#464B4B]/60">#{user.employee_number}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#464B4B]">{user.email}</td>
                          <td className="px-6 py-4">{getStatusBadge(user.registration_status || 'pending')}</td>
                          <td className="px-6 py-4">
                            {user.active ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {user.goodStandingIdNumber ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-[#464B4B]/70 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="flex items-center space-x-1 text-[#0072CE] hover:text-[#171C8F] font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">View</span>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              filteredProxyForms.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-[#464B4B]/70">No proxy assignments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Member</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Membership #</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Proxy Group</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Active</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Submitted</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProxyForms.map((form, index) => (
                        <motion.tr
                          key={form.appointment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[#464B4B]">
                              {form.appointment.member_title} {form.appointment.member_full_name} {form.appointment.member_surname}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#464B4B]">{form.appointment.member_membership_number}</td>
                          <td className="px-6 py-4 text-[#464B4B]">{form.proxy_group?.group_name || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-[#464B4B]">{form.appointment.appointment_type}</span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(form.appointment.approval_status)}</td>
                          <td className="px-6 py-4">
                            {form.proxy_group?.is_active ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-[#464B4B]/70 text-sm">
                            {new Date(form.appointment.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedForm(form)}
                              className="flex items-center space-x-1 text-[#0072CE] hover:text-[#171C8F] font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">View</span>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !actionLoading && setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-[#464B4B]">User Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  disabled={actionLoading}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-8 w-8" />
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center space-x-4">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.name} className="h-20 w-20 rounded-full" />
                  ) : (
                    <div className="h-20 w-20 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">{selectedUser.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-[#464B4B]">{selectedUser.name}</h3>
                    <p className="text-[#464B4B]/70">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-[#464B4B] mb-3">Account Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#464B4B]/70">Registration:</span>
                      {getStatusBadge(selectedUser.registration_status || 'pending')}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#464B4B]/70">Active:</span>
                      <span>{selectedUser.active ? '✓ Yes' : '✗ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#464B4B]/70">Good Standing:</span>
                      <span>{selectedUser.goodStandingIdNumber ? '✓ Yes' : '✗ No'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-[#464B4B] mb-3">Activity</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Registered:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
                    {selectedUser.last_login && (
                      <p><strong>Last Login:</strong> {new Date(selectedUser.last_login).toLocaleString()}</p>
                    )}
                    {selectedUser.reviewed_at && (
                      <p><strong>Reviewed:</strong> {new Date(selectedUser.reviewed_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.registration_status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#464B4B] mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                      placeholder="Enter reason for rejection..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApproveUser(selectedUser)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Approve Registration'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApproveGoodStanding(selectedUser)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      <Shield className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Approve Good Standing'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRejectUser(selectedUser)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {selectedUser.registration_status === 'rejected' && selectedUser.rejection_reason && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
                      <p className="text-sm text-red-700">{selectedUser.rejection_reason}</p>
                      <p className="text-xs text-red-600 mt-2">
                        Rejected on {new Date(selectedUser.reviewed_at!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proxy Form Details Modal */}
      <AnimatePresence>
        {selectedForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !actionLoading && setSelectedForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-[#464B4B]">Proxy Assignment Details</h2>
                <button
                  onClick={() => setSelectedForm(null)}
                  disabled={actionLoading}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-8 w-8" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
                  <h4 className="font-semibold text-[#464B4B] mb-4 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Member (Assignor)</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedForm.appointment.member_title} {selectedForm.appointment.member_full_name} {selectedForm.appointment.member_surname}</p>
                    <p><strong>Membership #:</strong> {selectedForm.appointment.member_membership_number}</p>
                    <p><strong>ID/Passport:</strong> {selectedForm.appointment.member_id_number}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl p-6">
                  <h4 className="font-semibold text-[#464B4B] mb-4 flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Proxy Group</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Group:</strong> {selectedForm.proxy_group?.group_name || 'N/A'}</p>
                    <p><strong>Principal:</strong> {selectedForm.proxy_group?.principal_name || 'N/A'}</p>
                    <p><strong>Active:</strong> {selectedForm.proxy_group?.is_active ? '✓ Yes' : '✗ No'}</p>
                  </div>
                  {selectedForm.proxy_group_members && selectedForm.proxy_group_members.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-[#464B4B]">Group Members</p>
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                          {selectedForm.proxy_group_members.length}
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {selectedForm.proxy_group_members.map((member, idx) => (
                          <div key={member.id} className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-xs">{member.initials}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#464B4B]">
                                    {member.full_name} {member.surname}
                                  </p>
                                  <p className="text-xs text-[#464B4B]/60">#{member.membership_number}</p>
                                </div>
                              </div>
                              <span className="text-xs text-[#464B4B]/40 font-mono">#{idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedForm.proxy_group_members.length > 5 && (
                        <p className="text-xs text-[#464B4B]/50 text-center mt-2 italic">
                          Scroll to view all {selectedForm.proxy_group_members.length} members
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-[#464B4B] mb-4">Assignment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Type:</strong> <span className="capitalize">{selectedForm.appointment.appointment_type}</span></p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedForm.appointment.approval_status)}</p>
                  <p><strong>Location:</strong> {selectedForm.appointment.location_signed}</p>
                  <p><strong>Date Signed:</strong> {new Date(selectedForm.appointment.signed_date).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedForm.appointment.approval_status === 'pending' && (
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApproveProxy(selectedForm)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>{actionLoading ? 'Processing...' : 'Approve Assignment'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRejectProxy(selectedForm)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>{actionLoading ? 'Processing...' : 'Reject Assignment'}</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default AdminApprovals;
