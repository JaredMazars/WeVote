import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Users,
  ToggleLeft,
  ToggleRight,
  Save,
  Plus,
  Minus,
  UserCheck,
  Crown,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Eye
} from 'lucide-react';

interface VoteSplittingSettings {
  setting_name: string;
  is_enabled: boolean;
  min_proxy_voters: number;
  max_proxy_voters: number;
  min_individual_votes: number;
  max_individual_votes: number;
}

interface ProxyGroup {
  id: string;
  proxy_name: string;
  vote_type: string;
  vote_splitting_enabled?: boolean;
  min_votes_per_user?: number;
  max_votes_per_user?: number;
  total_members?: number;
}

interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  role_name: string;
}

interface ProxyVoterLimit {
  id: string;
  user_id: string;
  name: string;
  email: string;
  max_votes_allowed: number;
  votes_used: number;
  remaining_votes: number;
}

const SuperUsersManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'groups' | 'admins'>('settings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vote splitting settings state
  const [settings, setSettings] = useState<VoteSplittingSettings>({
    setting_name: 'proxy_vote_splitting',
    is_enabled: false,
    min_proxy_voters: 2,
    max_proxy_voters: 20,
    min_individual_votes: 1,
    max_individual_votes: 3
  });

  // Proxy groups state
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProxyGroup | null>(null);
  const [voterLimits, setVoterLimits] = useState<ProxyVoterLimit[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showVoterLimitsModal, setShowVoterLimitsModal] = useState(false);

  // Super admins state
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchProxyGroups();
    fetchSuperAdmins();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/superadmin/vote-splitting-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load vote splitting settings');
    }
  };

  const fetchProxyGroups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/proxy/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setProxyGroups(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching proxy groups:', error);
      setError('Failed to load proxy groups');
    }
  };

  const fetchSuperAdmins = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/superadmin/super-admins', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setSuperAdmins(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching super admins:', error);
      setError('Failed to load super admins');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        // Filter out existing super admins
        const superAdminIds = superAdmins.map(admin => admin.id);
        const available = result.data.filter((user: any) => 
          !superAdminIds.includes(user.id.toString()) && user.role !== 'super admin'
        );
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const updateSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:3001/api/superadmin/vote-splitting-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Vote splitting settings updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupLimits = async (groupId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/proxy-groups/${groupId}/limits`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.error('Error fetching group limits:', error);
    }
    return null;
  };

  const updateGroupLimits = async (groupId: string, limits: any) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/proxy-groups/${groupId}/limits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(limits)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Proxy group limits updated successfully');
        fetchProxyGroups();
        return true;
      } else {
        setError(result.message || 'Failed to update group limits');
        return false;
      }
    } catch (error) {
      console.error('Error updating group limits:', error);
      setError('Failed to update group limits');
      return false;
    }
  };

  const fetchVoterLimits = async (groupId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/proxy-groups/${groupId}/voter-limits`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setVoterLimits(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching voter limits:', error);
      setError('Failed to load voter limits');
    }
  };

  const promoteToSuperAdmin = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/users/${userId}/promote-super-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('User promoted to Super Admin successfully');
        fetchSuperAdmins();
        setShowPromoteModal(false);
        return true;
      } else {
        setError(result.message || 'Failed to promote user');
        return false;
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      setError('Failed to promote user');
      return false;
    }
  };

  const demoteSuperAdmin = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/superadmin/users/${userId}/demote-super-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Super Admin demoted successfully');
        fetchSuperAdmins();
        return true;
      } else {
        setError(result.message || 'Failed to demote Super Admin');
        return false;
      }
    } catch (error) {
      console.error('Error demoting Super Admin:', error);
      setError('Failed to demote Super Admin');
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-pink-500 rounded-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Super Users Management</h2>
            <p className="text-gray-500">Ultimate system administration and vote splitting controls</p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2"
          >
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSubTab === 'settings'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Vote Splitting Settings</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSubTab === 'groups'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Proxy Group Management</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('admins')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeSubTab === 'admins'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Super Admin Management</span>
          </div>
        </button>
      </div>

      {/* Content Areas */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        {/* Vote Splitting Settings Tab */}
        {activeSubTab === 'settings' && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Global Vote Splitting Settings</h3>
                  <p className="text-sm text-gray-500">Configure system-wide vote splitting capabilities</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })}
                  className="flex items-center space-x-2"
                >
                  {settings.is_enabled ? (
                    <ToggleRight className="h-8 w-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                  <span className={`font-medium ${settings.is_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {settings.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>

              {settings.is_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Proxy Voter Limits</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Proxy Voters per Group
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={settings.min_proxy_voters}
                          onChange={(e) => setSettings({ ...settings, min_proxy_voters: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Proxy Voters per Group
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={settings.max_proxy_voters}
                          onChange={(e) => setSettings({ ...settings, max_proxy_voters: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Individual Vote Limits</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Votes per Individual
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.min_individual_votes}
                          onChange={(e) => setSettings({ ...settings, min_individual_votes: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Votes per Individual
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.max_individual_votes}
                          onChange={(e) => setSettings({ ...settings, max_individual_votes: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={updateSettings}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proxy Group Management Tab */}
        {activeSubTab === 'groups' && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Proxy Group Vote Splitting</h3>
                  <p className="text-sm text-gray-500">Configure vote splitting for each proxy group</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Group</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Members</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Vote Splitting</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proxyGroups.map((group) => (
                      <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{group.proxy_name}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            group.vote_type === 'employee' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {group.vote_type}
                          </span>
                        </td>
                        <td className="py-4 px-4">{group.total_members || 0} members</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            group.vote_splitting_enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {group.vote_splitting_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={async () => {
                                const limits = await fetchGroupLimits(group.id);
                                setSelectedGroup({ ...group, ...limits });
                                setShowGroupModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                setSelectedGroup(group);
                                await fetchVoterLimits(group.id);
                                setShowVoterLimitsModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {proxyGroups.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No proxy groups found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Management Tab */}
        {activeSubTab === 'admins' && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Super Administrator Management</h3>
                  <p className="text-sm text-gray-500">Manage users with ultimate system privileges</p>
                </div>
                <button
                  onClick={() => {
                    fetchAvailableUsers();
                    setShowPromoteModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Promote User</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {superAdmins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Crown className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{admin.name}</p>
                              <p className="text-sm text-gray-500">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            admin.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => demoteSuperAdmin(admin.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Demote to regular admin"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {superAdmins.length === 0 && (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No super administrators found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group Settings Modal */}
      <AnimatePresence>
        {showGroupModal && selectedGroup && (
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Configure Vote Splitting for {selectedGroup.proxy_name}
                </h3>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Enable Vote Splitting
                  </label>
                  <button
                    onClick={() => setSelectedGroup({
                      ...selectedGroup,
                      vote_splitting_enabled: !selectedGroup.vote_splitting_enabled
                    })}
                    className="flex items-center space-x-2"
                  >
                    {selectedGroup.vote_splitting_enabled ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                {selectedGroup.vote_splitting_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Votes per User
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={selectedGroup.min_votes_per_user || 1}
                        onChange={(e) => setSelectedGroup({
                          ...selectedGroup,
                          min_votes_per_user: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Votes per User
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={selectedGroup.max_votes_per_user || 1}
                        onChange={(e) => setSelectedGroup({
                          ...selectedGroup,
                          max_votes_per_user: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const success = await updateGroupLimits(selectedGroup.id, {
                      vote_splitting_enabled: selectedGroup.vote_splitting_enabled,
                      min_votes_per_user: selectedGroup.min_votes_per_user || 1,
                      max_votes_per_user: selectedGroup.max_votes_per_user || 1
                    });
                    if (success) {
                      setShowGroupModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voter Limits Modal */}
      <AnimatePresence>
        {showVoterLimitsModal && selectedGroup && (
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Individual Vote Limits for {selectedGroup.proxy_name}
                </h3>
                <button
                  onClick={() => setShowVoterLimitsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {voterLimits.map((limit) => (
                  <div key={limit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{limit.name}</p>
                        <p className="text-sm text-gray-500">{limit.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {limit.votes_used} / {limit.max_votes_allowed} votes used
                      </p>
                      <p className="text-sm text-gray-500">
                        {limit.remaining_votes} remaining
                      </p>
                    </div>
                  </div>
                ))}

                {voterLimits.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No voter limits configured for this group</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowVoterLimitsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promote User Modal */}
      <AnimatePresence>
        {showPromoteModal && (
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
                <h3 className="text-lg font-semibold text-gray-900">Promote to Super Admin</h3>
                <button
                  onClick={() => setShowPromoteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => promoteToSuperAdmin(user.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Promote
                    </button>
                  </div>
                ))}

                {availableUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No eligible users found</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperUsersManagement;
