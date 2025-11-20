import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Users2, 
  Shield, 
  Save, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VoteSplittingSettings {
  id: number;
  enabled: boolean;
  min_proxy_voters: number;
  max_proxy_voters: number;
  min_individual_votes: number;
  max_individual_votes: number;
  updated_at: string;
}

interface ProxyGroup {
  id: number;
  group_name: string;
  member_count: number;
  min_votes?: number;
  max_votes?: number;
}

interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id: number;
  created_at: string;
  last_login?: string;
}

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'vote-splitting' | 'proxy-groups' | 'super-admins'>('vote-splitting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Vote Splitting State
  const [voteSplittingSettings, setVoteSplittingSettings] = useState<VoteSplittingSettings>({
    id: 1,
    enabled: false,
    min_proxy_voters: 1,
    max_proxy_voters: 10,
    min_individual_votes: 1,
    max_individual_votes: 5,
    updated_at: new Date().toISOString()
  });

  // Proxy Groups State
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  // Super Admin Users State
  const [superAdminUsers, setSuperAdminUsers] = useState<SuperAdminUser[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchVoteSplittingSettings(),
        fetchProxyGroups(),
        fetchSuperAdminUsers()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteSplittingSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/superadmin/vote-splitting-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setVoteSplittingSettings(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching vote splitting settings:', err);
    }
  };

  const fetchProxyGroups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/proxy/groups');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setProxyGroups(data.data.map((group: any) => ({
            id: group.id,
            group_name: `Group ${group.id} - ${group.proxy_name}`,
            member_count: group.members?.length || 0,
            min_votes: group.min_votes,
            max_votes: group.max_votes
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching proxy groups:', err);
    }
  };

  const fetchSuperAdminUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/superadmin/check-roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuperAdminUsers(data.data.filter((u: any) => u.role_id === 0 || u.role_id === 1));
        }
      }
    } catch (err) {
      console.error('Error fetching super admin users:', err);
    }
  };

  const handleSaveVoteSplitting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/superadmin/vote-splitting-settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(voteSplittingSettings)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessMessage('Vote splitting settings saved successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || 'Failed to save settings');
      }
    } catch (err: any) {
      setError('Error saving settings: ' + err.message);
    }
  };

  const handleUpdateProxyGroupLimits = async (groupId: number, minVotes: number, maxVotes: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/superadmin/proxy-groups/${groupId}/limits`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ min_votes: minVotes, max_votes: maxVotes })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessMessage('Proxy group limits updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchProxyGroups();
      } else {
        setError(result.message || 'Failed to update limits');
      }
    } catch (err: any) {
      setError('Error updating limits: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
                <p className="text-blue-100">Advanced system configuration and management</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/home')}
              className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              Back to Home
            </motion.button>
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
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
            >
              {successMessage}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <TabButton
            icon={Settings}
            label="Vote Splitting"
            isActive={activeTab === 'vote-splitting'}
            onClick={() => setActiveTab('vote-splitting')}
          />
          {/* <TabButton
            icon={Users2}
            label="Proxy Group Limits"
            isActive={activeTab === 'proxy-groups'}
            onClick={() => setActiveTab('proxy-groups')}
            badge={proxyGroups.length}
          />
          <TabButton
            icon={Shield}
            label="Super Admin Management"
            isActive={activeTab === 'super-admins'}
            onClick={() => setActiveTab('super-admins')}
            badge={superAdminUsers.length}
          /> */}
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
            {/* Vote Splitting Tab */}
            {activeTab === 'vote-splitting' && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Vote Splitting Configuration</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setVoteSplittingSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                      voteSplittingSettings.enabled
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Proxy Voters
                    </label>
                    <input
                      type="number"
                      value={voteSplittingSettings.min_proxy_voters}
                      onChange={(e) => setVoteSplittingSettings(prev => ({
                        ...prev,
                        min_proxy_voters: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Proxy Voters
                    </label>
                    <input
                      type="number"
                      value={voteSplittingSettings.max_proxy_voters}
                      onChange={(e) => setVoteSplittingSettings(prev => ({
                        ...prev,
                        max_proxy_voters: parseInt(e.target.value) || 10
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Individual Votes
                    </label>
                    <input
                      type="number"
                      value={voteSplittingSettings.min_individual_votes}
                      onChange={(e) => setVoteSplittingSettings(prev => ({
                        ...prev,
                        min_individual_votes: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Individual Votes
                    </label>
                    <input
                      type="number"
                      value={voteSplittingSettings.max_individual_votes}
                      onChange={(e) => setVoteSplittingSettings(prev => ({
                        ...prev,
                        max_individual_votes: parseInt(e.target.value) || 5
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveVoteSplitting}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-5 w-5" />
                    Save Settings
                  </motion.button>
                </div>
              </div>
            )}

            {/* Proxy Groups Tab */}
            {activeTab === 'proxy-groups' && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Proxy Group Limits</h2>
                
                {proxyGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No proxy groups found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proxyGroups.map((group) => (
                      <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Users2 className="h-5 w-5 text-blue-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{group.group_name}</h3>
                              <p className="text-sm text-gray-500">{group.member_count} members</p>
                            </div>
                          </div>
                          {expandedGroup === group.id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>

                        <AnimatePresence>
                          {expandedGroup === group.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-200"
                            >
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Min Votes
                                    </label>
                                    <input
                                      type="number"
                                      defaultValue={group.min_votes || 1}
                                      onChange={(e) => {
                                        const minVotes = parseInt(e.target.value) || 1;
                                        handleUpdateProxyGroupLimits(group.id, minVotes, group.max_votes || 5);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Max Votes
                                    </label>
                                    <input
                                      type="number"
                                      defaultValue={group.max_votes || 5}
                                      onChange={(e) => {
                                        const maxVotes = parseInt(e.target.value) || 5;
                                        handleUpdateProxyGroupLimits(group.id, group.min_votes || 1, maxVotes);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      min="1"
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Super Admin Management Tab */}
            {activeTab === 'super-admins' && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Super Admin Users</h2>
                </div>

                <div className="space-y-4">
                  {superAdminUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No admin users found</p>
                    </div>
                  ) : (
                    superAdminUsers.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            admin.role_id === 0 ? 'bg-blue-100' : 'bg-blue-100'
                          }`}>
                            {admin.role_id === 0 ? (
                              <Crown className="h-6 w-6 text-blue-600" />
                            ) : (
                              <Shield className="h-6 w-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                            <p className="text-xs text-gray-400">
                              {admin.role_id === 0 ? 'Super Admin' : 'Admin'} • Last login: {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            admin.role_id === 0 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            Role ID: {admin.role_id}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const TabButton = ({ icon: Icon, label, isActive, onClick, badge }: any) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
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

export default SuperAdminDashboard;
