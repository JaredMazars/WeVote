import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';

interface User {
  id: string;
  email: string;
  name: string;
  employeeId?: string;
  department?: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  assignedVotes: number;
}

interface Candidate {
  id: string;
  name: string;
  department: string;
  position: string;
  achievements: string;
  skills: string[];
  voteCount: number;
  isActive: boolean;
  createdAt: string;
}

interface Resolution {
  id: string;
  title: string;
  description: string;
  category: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  status: 'active' | 'closed' | 'pending';
  createdAt: string;
  deadline?: string;
}

type TabType = 'users' | 'candidates' | 'resolutions' | 'stats';

export default function AdminManagementDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  
  // Edit states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editingResolution, setEditingResolution] = useState<Resolution | null>(null);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load from localStorage or use defaults
    const storedUsers = localStorage.getItem('adminUsers');
    const storedCandidates = localStorage.getItem('adminCandidates');
    const storedResolutions = localStorage.getItem('adminResolutions');

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const defaultUsers: User[] = [
        { id: '1', email: 'demo@wevote.com', name: 'Demo User', employeeId: 'EMP001', department: 'Engineering', role: 'user', createdAt: '2024-01-15', lastLogin: '2024-12-05', isActive: true, assignedVotes: 5 },
        { id: '2', email: 'admin@wevote.com', name: 'Admin User', employeeId: 'EMP002', department: 'Management', role: 'admin', createdAt: '2024-01-10', lastLogin: '2024-12-07', isActive: true, assignedVotes: 10 },
        { id: '3', email: 'jane.smith@company.com', name: 'Jane Smith', employeeId: 'EMP003', department: 'Sales', role: 'user', createdAt: '2024-02-20', lastLogin: '2024-12-03', isActive: true, assignedVotes: 3 },
        { id: '4', email: 'bob.williams@company.com', name: 'Bob Williams', employeeId: 'EMP004', department: 'Marketing', role: 'user', createdAt: '2024-03-10', isActive: false, assignedVotes: 0 },
      ];
      setUsers(defaultUsers);
      localStorage.setItem('adminUsers', JSON.stringify(defaultUsers));
    }

    if (storedCandidates) {
      setCandidates(JSON.parse(storedCandidates));
    } else {
      const defaultCandidates: Candidate[] = [
        { id: '1', name: 'Alice Johnson', department: 'Engineering', position: 'Senior Developer', achievements: 'Led 3 major projects, mentored 5 junior developers', skills: ['Leadership', 'Innovation', 'Teamwork'], voteCount: 45, isActive: true, createdAt: '2024-11-01' },
        { id: '2', name: 'Bob Smith', department: 'Marketing', position: 'Marketing Director', achievements: 'Increased revenue 40%, launched 2 successful campaigns', skills: ['Strategy', 'Communication', 'Analytics'], voteCount: 38, isActive: true, createdAt: '2024-11-05' },
        { id: '3', name: 'Carol White', department: 'HR', position: 'HR Manager', achievements: 'Improved retention rate by 25%, implemented new benefits', skills: ['Empathy', 'Organization', 'Problem Solving'], voteCount: 52, isActive: true, createdAt: '2024-11-10' },
      ];
      setCandidates(defaultCandidates);
      localStorage.setItem('adminCandidates', JSON.stringify(defaultCandidates));
    }

    if (storedResolutions) {
      setResolutions(JSON.parse(storedResolutions));
    } else {
      const defaultResolutions: Resolution[] = [
        { id: '1', title: 'Remote Work Policy', description: 'Extend remote work to 3 days per week for all employees', category: 'Policy', yesVotes: 85, noVotes: 12, abstainVotes: 8, status: 'active', createdAt: '2024-11-01', deadline: '2024-12-31' },
        { id: '2', title: 'Office Renovation Budget', description: 'Approve $500,000 budget for office upgrades and modernization', category: 'Financial', yesVotes: 67, noVotes: 28, abstainVotes: 10, status: 'active', createdAt: '2024-11-15', deadline: '2024-12-15' },
        { id: '3', title: 'Annual Bonus Structure', description: 'Implement new performance-based bonus system with quarterly reviews', category: 'Compensation', yesVotes: 92, noVotes: 5, abstainVotes: 8, status: 'closed', createdAt: '2024-10-01' },
      ];
      setResolutions(defaultResolutions);
      localStorage.setItem('adminResolutions', JSON.stringify(defaultResolutions));
    }
  };

  // USER CRUD OPERATIONS
  const handleAddUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email || '',
      name: userData.name || '',
      employeeId: userData.employeeId,
      department: userData.department,
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      isActive: true,
      assignedVotes: userData.assignedVotes || 3,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('adminUsers', JSON.stringify(updated));
    setShowUserModal(false);
  };

  const handleUpdateUser = (userId: string, userData: Partial<User>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...userData } : u);
    setUsers(updated);
    localStorage.setItem('adminUsers', JSON.stringify(updated));
    setEditingUser(null);
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      localStorage.setItem('adminUsers', JSON.stringify(updated));
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u);
    setUsers(updated);
    localStorage.setItem('adminUsers', JSON.stringify(updated));
  };

  // CANDIDATE CRUD OPERATIONS
  const handleAddCandidate = (candidateData: Partial<Candidate>) => {
    const newCandidate: Candidate = {
      id: `candidate-${Date.now()}`,
      name: candidateData.name || '',
      department: candidateData.department || '',
      position: candidateData.position || '',
      achievements: candidateData.achievements || '',
      skills: candidateData.skills || [],
      voteCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [...candidates, newCandidate];
    setCandidates(updated);
    localStorage.setItem('adminCandidates', JSON.stringify(updated));
    setShowCandidateModal(false);
  };

  const handleUpdateCandidate = (candidateId: string, candidateData: Partial<Candidate>) => {
    const updated = candidates.map(c => c.id === candidateId ? { ...c, ...candidateData } : c);
    setCandidates(updated);
    localStorage.setItem('adminCandidates', JSON.stringify(updated));
    setEditingCandidate(null);
    setShowCandidateModal(false);
  };

  const handleDeleteCandidate = (candidateId: string) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      const updated = candidates.filter(c => c.id !== candidateId);
      setCandidates(updated);
      localStorage.setItem('adminCandidates', JSON.stringify(updated));
    }
  };

  const handleToggleCandidateStatus = (candidateId: string) => {
    const updated = candidates.map(c => c.id === candidateId ? { ...c, isActive: !c.isActive } : c);
    setCandidates(updated);
    localStorage.setItem('adminCandidates', JSON.stringify(updated));
  };

  // RESOLUTION CRUD OPERATIONS
  const handleAddResolution = (resolutionData: Partial<Resolution>) => {
    const newResolution: Resolution = {
      id: `resolution-${Date.now()}`,
      title: resolutionData.title || '',
      description: resolutionData.description || '',
      category: resolutionData.category || 'General',
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deadline: resolutionData.deadline,
    };
    const updated = [...resolutions, newResolution];
    setResolutions(updated);
    localStorage.setItem('adminResolutions', JSON.stringify(updated));
    setShowResolutionModal(false);
  };

  const handleUpdateResolution = (resolutionId: string, resolutionData: Partial<Resolution>) => {
    const updated = resolutions.map(r => r.id === resolutionId ? { ...r, ...resolutionData } : r);
    setResolutions(updated);
    localStorage.setItem('adminResolutions', JSON.stringify(updated));
    setEditingResolution(null);
    setShowResolutionModal(false);
  };

  const handleDeleteResolution = (resolutionId: string) => {
    if (confirm('Are you sure you want to delete this resolution?')) {
      const updated = resolutions.filter(r => r.id !== resolutionId);
      setResolutions(updated);
      localStorage.setItem('adminResolutions', JSON.stringify(updated));
    }
  };

  const handleChangeResolutionStatus = (resolutionId: string, status: 'active' | 'closed' | 'pending') => {
    const updated = resolutions.map(r => r.id === resolutionId ? { ...r, status } : r);
    setResolutions(updated);
    localStorage.setItem('adminResolutions', JSON.stringify(updated));
  };

  // Filtered data
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredResolutions = resolutions.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    totalCandidates: candidates.length,
    activeCandidates: candidates.filter(c => c.isActive).length,
    totalResolutions: resolutions.length,
    activeResolutions: resolutions.filter(r => r.status === 'active').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0072CE] to-[#171C8F] bg-clip-text text-transparent mb-2">
            Admin Management Dashboard
          </h1>
          <p className="text-slate-600">Manage users, candidates, and resolutions</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              👥 Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'candidates'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🏆 Candidates ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab('resolutions')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'resolutions'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📋 Resolutions ({resolutions.length})
            </button>
          </div>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Users</p>
                  <p className="text-4xl font-bold text-[#0072CE]">{stats.totalUsers}</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                  👥
                </div>
              </div>
              <p className="text-sm text-green-600">✓ {stats.activeUsers} active users</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Candidates</p>
                  <p className="text-4xl font-bold text-[#0072CE]">{stats.totalCandidates}</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                  🏆
                </div>
              </div>
              <p className="text-sm text-green-600">✓ {stats.activeCandidates} active candidates</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Resolutions</p>
                  <p className="text-4xl font-bold text-[#0072CE]">{stats.totalResolutions}</p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                  📋
                </div>
              </div>
              <p className="text-sm text-green-600">✓ {stats.activeResolutions} active resolutions</p>
            </motion.div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none w-64"
              />
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <span>➕</span>
                Add New User
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Employee ID</th>
                    <th className="px-6 py-4 text-left">Department</th>
                    <th className="px-6 py-4 text-left">Role</th>
                    <th className="px-6 py-4 text-center">Votes</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4 text-slate-600">{user.employeeId || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600">{user.department || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'superadmin' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[#0072CE]">{user.assignedVotes}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.isActive ? '✓ Active' : '✗ Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserModal(true);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-lg">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none w-64"
              />
              <button
                onClick={() => {
                  setEditingCandidate(null);
                  setShowCandidateModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <span>➕</span>
                Add New Candidate
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredCandidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-slate-900">{candidate.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          candidate.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {candidate.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </div>
                      <p className="text-lg text-[#0072CE] font-semibold mb-1">{candidate.position}</p>
                      <p className="text-slate-600 mb-3">{candidate.department}</p>
                      <p className="text-slate-700 mb-3">{candidate.achievements}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {candidate.skills.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-500">Added: {new Date(candidate.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#0072CE] to-[#171C8F] rounded-full flex items-center justify-center mb-2">
                        <span className="text-3xl font-bold text-white">{candidate.voteCount}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">Votes</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleToggleCandidateStatus(candidate.id)}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                        candidate.isActive
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {candidate.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCandidate(candidate);
                        setShowCandidateModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCandidate(candidate.id)}
                      className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </motion.div>
              ))}

              {filteredCandidates.length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-slate-500 text-lg">No candidates found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resolutions Tab */}
        {activeTab === 'resolutions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <input
                type="text"
                placeholder="Search resolutions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none w-64"
              />
              <button
                onClick={() => {
                  setEditingResolution(null);
                  setShowResolutionModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <span>➕</span>
                Add New Resolution
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredResolutions.map((resolution, index) => (
                <motion.div
                  key={resolution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-slate-900">{resolution.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          resolution.status === 'active' ? 'bg-green-100 text-green-700' :
                          resolution.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {resolution.status}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-3">{resolution.description}</p>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                          📂 {resolution.category}
                        </span>
                        <span className="text-sm text-slate-500">
                          Created: {new Date(resolution.createdAt).toLocaleDateString()}
                        </span>
                        {resolution.deadline && (
                          <span className="text-sm text-orange-600 font-medium">
                            ⏰ Deadline: {new Date(resolution.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-700">{resolution.yesVotes}</p>
                      <p className="text-sm text-green-600 font-medium">👍 Yes</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-red-700">{resolution.noVotes}</p>
                      <p className="text-sm text-red-600 font-medium">👎 No</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-slate-700">{resolution.abstainVotes}</p>
                      <p className="text-sm text-slate-600 font-medium">🤷 Abstain</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleChangeResolutionStatus(resolution.id, 'pending')}
                      className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-semibold text-sm"
                      disabled={resolution.status === 'pending'}
                    >
                      ⏳ Pending
                    </button>
                    <button
                      onClick={() => handleChangeResolutionStatus(resolution.id, 'active')}
                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold text-sm"
                      disabled={resolution.status === 'active'}
                    >
                      ▶️ Active
                    </button>
                    <button
                      onClick={() => handleChangeResolutionStatus(resolution.id, 'closed')}
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm"
                      disabled={resolution.status === 'closed'}
                    >
                      🔒 Close
                    </button>
                    <button
                      onClick={() => {
                        setEditingResolution(resolution);
                        setShowResolutionModal(true);
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteResolution(resolution.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}

              {filteredResolutions.length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-slate-500 text-lg">No resolutions found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Modal */}
        <AnimatePresence>
          {showUserModal && (
            <UserModal
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

        {/* Candidate Modal */}
        <AnimatePresence>
          {showCandidateModal && (
            <CandidateModal
              candidate={editingCandidate}
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

        {/* Resolution Modal */}
        <AnimatePresence>
          {showResolutionModal && (
            <ResolutionModal
              resolution={editingResolution}
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
}

// USER MODAL COMPONENT
function UserModal({ user, onClose, onSave }: { user: User | null; onClose: () => void; onSave: (data: Partial<User>) => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    employeeId: user?.employeeId || '',
    department: user?.department || '',
    role: user?.role || 'user',
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                placeholder="Engineering"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
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

// CANDIDATE MODAL COMPONENT
function CandidateModal({ candidate, onClose, onSave }: { candidate: Candidate | null; onClose: () => void; onSave: (data: Partial<Candidate>) => void }) {
  const [formData, setFormData] = useState({
    name: candidate?.name || '',
    department: candidate?.department || '',
    position: candidate?.position || '',
    achievements: candidate?.achievements || '',
    skills: candidate?.skills || [],
  });
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          {candidate ? '✏️ Edit Candidate' : '➕ Add New Candidate'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Alice Johnson"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                placeholder="Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Position *</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                placeholder="Senior Developer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Achievements *</label>
            <textarea
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Led 3 major projects, mentored 5 junior developers..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                placeholder="Add a skill and press Enter"
              />
              <button
                onClick={addSkill}
                className="px-6 py-3 bg-[#0072CE] text-white rounded-xl hover:bg-[#005ba3] transition-colors font-semibold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-blue-900 hover:text-blue-700">✕</button>
                </span>
              ))}
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
              if (!formData.name || !formData.department || !formData.position || !formData.achievements) {
                alert('Please fill in all required fields');
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

// RESOLUTION MODAL COMPONENT
function ResolutionModal({ resolution, onClose, onSave }: { resolution: Resolution | null; onClose: () => void; onSave: (data: Partial<Resolution>) => void }) {
  const [formData, setFormData] = useState({
    title: resolution?.title || '',
    description: resolution?.description || '',
    category: resolution?.category || 'General',
    deadline: resolution?.deadline || '',
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
          {resolution ? '✏️ Edit Resolution' : '➕ Add New Resolution'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              placeholder="Remote Work Policy"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
              >
                <option value="General">General</option>
                <option value="Policy">Policy</option>
                <option value="Financial">Financial</option>
                <option value="Compensation">Compensation</option>
                <option value="Operations">Operations</option>
                <option value="Strategy">Strategy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline (Optional)</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
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
              if (!formData.title || !formData.description || !formData.category) {
                alert('Please fill in all required fields');
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
