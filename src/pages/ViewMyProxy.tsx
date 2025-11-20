import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  User,
  Award,
  Building2,
  Plus,
  Trash2,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AllowedCandidate {
  employee_id: string;
  name: string;
  position: string;
  department: string;
}

interface ProxyMember {
  id: string;
  member_id: string;
  name: string;
  email: string;
  initials: string;
  surname: string;
  full_name: string;
  membership_number: string;
  id_number: string;
  appointment_type: 'DISCRETIONAL' | 'INSTRUCTIONAL';
  has_voted: number;
  allowed_candidates: AllowedCandidate[];
}

interface ProxyGroup {
  id: string;
  group_name: string;
  principal_id: string;
  appointment_type: string;
  trustee_remuneration: string | null;
  remuneration_policy: string | null;
  auditors_appointment: string | null;
  agm_motions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  has_votes_cast: number;
  canEdit: boolean;
  proxy_group_members: ProxyMember[];
}

const ViewMyProxy: React.FC = () => {
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean, memberId: string | null}>({show: false, memberId: null});
  
  const { getCurrentUserId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProxyGroups();
  }, []);

  const fetchProxyGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/proxy/proxy-groups/${userId}/edit`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proxy groups');
      }

      const result = await response.json();
      setProxyGroups(result.data || []);
      
      // Trigger voting status bar refresh
      window.dispatchEvent(new Event('proxyDataUpdated'));
    } catch (err) {
      console.error('Error fetching proxy groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proxy groups');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const userId = getCurrentUserId();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/proxy/proxy-member/${memberId}?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove proxy member');
      }

      // Refresh data
      await fetchProxyGroups();
      setShowDeleteConfirm({show: false, memberId: null});
      
      // Show success message
      alert('Proxy member removed successfully');
    } catch (err) {
      console.error('Error removing member:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove proxy member');
    }
  };

  const getAppointmentTypeBadge = (type: string) => {
    const colors = {
      'INSTRUCTIONAL': 'bg-orange-100 text-orange-800',
      'DISCRETIONAL': 'bg-green-100 text-green-800',
      'MIXED': 'bg-blue-100 text-blue-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your proxy groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/home')}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <span>My Proxy Groups</span>
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage who can vote on your behalf
              </p>
            </div>
            
            <button
              onClick={() => navigate(`/proxy-choice/${getCurrentUserId()}`)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Group</span>
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </motion.div>
        )}

        {/* Proxy Groups List */}
        {proxyGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Proxy Groups Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't created any proxy groups. Create one to delegate your voting rights.
            </p>
            <button
              onClick={() => navigate(`/proxy-choice/${getCurrentUserId()}`)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Proxy Group</span>
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {proxyGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                {/* Group Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-bold">{group.group_name}</h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAppointmentTypeBadge(group.appointment_type)}`}>
                          {group.appointment_type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          group.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {group.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-blue-100 text-sm">
                        <span>Created: {new Date(group.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{group.proxy_group_members.length} Members</span>
                      </div>
                    </div>

                    {!group.canEdit && (
                      <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                        <Lock className="h-5 w-5" />
                        <span className="text-sm font-medium">Locked - Votes Cast</span>
                      </div>
                    )}
                  </div>

                  {/* AGM Voting Instructions */}
                  {(group.trustee_remuneration || group.remuneration_policy || group.auditors_appointment || group.agm_motions) && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <h3 className="text-sm font-semibold mb-2">AGM Voting Instructions:</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {group.trustee_remuneration && (
                          <div>Trustee Remuneration: <span className="font-semibold">{group.trustee_remuneration}</span></div>
                        )}
                        {group.remuneration_policy && (
                          <div>Remuneration Policy: <span className="font-semibold">{group.remuneration_policy}</span></div>
                        )}
                        {group.auditors_appointment && (
                          <div>Auditors Appointment: <span className="font-semibold">{group.auditors_appointment}</span></div>
                        )}
                        {group.agm_motions && (
                          <div>AGM Motions: <span className="font-semibold">{group.agm_motions}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Group Members */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span>Proxy Members</span>
                  </h3>

                  {group.proxy_group_members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No proxy members assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {group.proxy_group_members.map((member) => (
                        <div
                          key={member.id}
                          className={`border rounded-xl p-4 transition-all ${
                            member.has_voted 
                              ? 'border-orange-200 bg-orange-50' 
                              : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {member.initials}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{member.full_name}</h4>
                                  <p className="text-sm text-gray-600">{member.email}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  member.appointment_type === 'INSTRUCTIONAL' 
                                    ? 'bg-orange-100 text-orange-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {member.appointment_type}
                                </span>
                                {member.has_voted === 1 && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center space-x-1">
                                    <Lock className="h-3 w-3" />
                                    <span>Has Voted</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-600 ml-13">
                                <span>Member #: {member.membership_number}</span>
                                <span>•</span>
                                <span>ID: {member.id_number}</span>
                              </div>

                              {/* Appointment Type Explanation */}
                              <div className="mt-2 ml-13 text-sm">
                                {member.appointment_type === 'INSTRUCTIONAL' ? (
                                  <p className="text-orange-700 italic flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Can only vote for specific candidates listed below</span>
                                  </p>
                                ) : (
                                  <p className="text-green-700 italic flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Can vote for any candidate on your behalf</span>
                                  </p>
                                )}
                              </div>

                              {/* Allowed Candidates for INSTRUCTIONAL */}
                              {member.appointment_type === 'INSTRUCTIONAL' && member.allowed_candidates.length > 0 && (
                                <div className="mt-3 ml-13 pl-4 border-l-2 border-orange-300">
                                  <p className="text-xs font-semibold text-orange-800 mb-2">
                                    Allowed to Vote For:
                                  </p>
                                  <div className="space-y-1">
                                    {member.allowed_candidates.map((candidate) => (
                                      <div key={candidate.employee_id} className="text-xs text-gray-700 flex items-center space-x-2 bg-white p-2 rounded">
                                        <Award className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                        <span className="font-medium">{candidate.name}</span>
                                        {candidate.position && (
                                          <>
                                            <span className="text-gray-400">•</span>
                                            <span>{candidate.position}</span>
                                          </>
                                        )}
                                        {candidate.department && (
                                          <>
                                            <span className="text-gray-400">•</span>
                                            <Building2 className="h-3 w-3 flex-shrink-0" />
                                            <span>{candidate.department}</span>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {member.appointment_type === 'INSTRUCTIONAL' && member.allowed_candidates.length === 0 && (
                                <div className="mt-2 ml-13 text-xs text-orange-600 italic flex items-center space-x-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>No specific candidates assigned yet</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {group.canEdit && member.has_voted === 0 && (
                              <button
                                onClick={() => setShowDeleteConfirm({show: true, memberId: member.id})}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Member Button */}
                  {group.canEdit && (
                    <button
                      onClick={() => navigate(`/proxy-choice/${getCurrentUserId()}?editGroup=${group.id}`)}
                      className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Proxy Member</span>
                    </button>
                  )}
                </div>

                {/* Info Banner */}
                {!group.canEdit && (
                  <div className="bg-orange-50 border-t border-orange-200 p-4 flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-1">This proxy group is locked for editing</p>
                      <p>One or more proxy members have already cast votes on your behalf. To maintain voting integrity, this group cannot be modified.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm.show && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Remove Proxy Member?</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to remove this proxy member? They will no longer be able to vote on your behalf.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm({show: false, memberId: null})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (showDeleteConfirm.memberId) {
                        handleRemoveMember(showDeleteConfirm.memberId);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove Member
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ViewMyProxy;
