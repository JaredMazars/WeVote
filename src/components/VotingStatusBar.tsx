import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Vote, 
  ChevronUp, 
  X, 
  CheckCircle, 
  Clock, 
  User,
  Users,
  UserCheck,
  Calendar,
  Award,
  Building2,
  Eye,
  AlertCircle
} from 'lucide-react';

interface VoteRecord {
  id: string;
  type: 'employee' | 'resolution';
  targetId: string;
  targetName: string;
  targetPosition?: string;
  targetDepartment?: string;
  voteValue: 'VOTE' | 'ABSTAIN';
  votedAt: Date;
  isProxy: boolean;
  proxyFor?: {
    id: string;
    name: string;
    email: string;
  };
  weight: number;
}

interface AllowedCandidate {
  id: string;
  name: string;
  position?: string;
  department?: string;
}

interface ProxyMember {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
  appointmentType: 'DISCRETIONARY' | 'INSTRUCTIONAL';
  allowedCandidates: AllowedCandidate[];
}

interface ProxyDelegation {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegatorEmail: string;
  voteType: 'employee' | 'resolution' | 'both';
  remainingVotes: number;
  totalVotes: number;
  validUntil: Date;
  proxyMembers: ProxyMember[];
}

interface MyProxyGroup {
  id: string;
  groupName: string;
  appointmentType: string;
  isActive: boolean;
  createdAt: Date;
  proxyMembers: ProxyMember[];
}

interface VotingStatus {
  personalVotesRemaining: number;
  personalVotesTotal: number;
  proxyVotesRemaining: number;
  proxyVotesTotal: number;
  totalVotesRemaining: number;
  totalVotesUsed: number;
  voteHistory: VoteRecord[];
  proxyDelegations: ProxyDelegation[];
  myProxyGroups: MyProxyGroup[];
}

const VotingStatusBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'proxy' | 'mygroups'>('overview');
  const { getCurrentUserId } = useAuth();

  useEffect(() => {
    const fetchVotingStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          console.error('No user ID available');
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching voting status for user:', userId); // Debug log

        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Making API request...'); // Debug log

        const response = await fetch(`http://localhost:3001/api/voting-status/status/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error(`Failed to fetch voting status: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response:', result); // Debug log
        
        // Check if the API returned success and has data
        if (!result.success || !result.data) {
          throw new Error('Invalid API response structure');
        }

        const data = result.data; // Extract data from the response
        
        // Transform the API response to match our interface
        const transformedData: VotingStatus = {
          personalVotesRemaining: data.personalVotesRemaining,
          personalVotesTotal: data.personalVotesTotal,
          proxyVotesRemaining: data.proxyVotesRemaining,
          proxyVotesTotal: data.proxyVotesTotal,
          totalVotesRemaining: data.totalVotesRemaining,
          totalVotesUsed: data.totalVotesUsed,
          voteHistory: data.voteHistory.map((vote: any) => ({
            id: vote.id.toString(),
            type: vote.type,
            targetId: vote.targetId.toString(),
            targetName: vote.targetName,
            targetPosition: vote.targetPosition,
            targetDepartment: vote.targetDepartment,
            voteValue: vote.voteValue,
            votedAt: new Date(vote.votedAt),
            isProxy: vote.isProxy,
            proxyFor: vote.proxyFor,
            weight: vote.weight
          })),
          proxyDelegations: data.proxyDelegations.map((delegation: any) => ({
            id: delegation.id.toString(),
            delegatorId: delegation.delegatorId.toString(),
            delegatorName: delegation.delegatorName,
            delegatorEmail: delegation.delegatorEmail,
            voteType: delegation.voteType,
            remainingVotes: delegation.remainingVotes,
            totalVotes: delegation.totalVotes,
            validUntil: new Date(delegation.validUntil),
            proxyMembers: delegation.proxyMembers?.map((member: any) => ({
              id: member.id.toString(),
              name: member.name,
              email: member.email,
              memberNumber: member.memberNumber,
              appointmentType: member.appointmentType,
              allowedCandidates: member.allowedCandidates?.map((candidate: any) => ({
                id: candidate.id.toString(),
                name: candidate.name,
                position: candidate.position,
                department: candidate.department
              })) || []
            })) || []
          })),
          myProxyGroups: data.myProxyGroups?.map((group: any) => ({
            id: group.id.toString(),
            groupName: group.groupName,
            appointmentType: group.appointmentType,
            isActive: group.isActive,
            createdAt: new Date(group.createdAt),
            proxyMembers: group.proxyMembers?.map((member: any) => ({
              id: member.id.toString(),
              name: member.name,
              email: member.email,
              memberNumber: member.memberNumber,
              appointmentType: member.appointmentType,
              allowedCandidates: member.allowedCandidates?.map((candidate: any) => ({
                id: candidate.id.toString(),
                name: candidate.name,
                position: candidate.position,
                department: candidate.department
              })) || []
            })) || []
          })) || []
        };

        console.log('Transformed Data:', transformedData); // Debug log
        setVotingStatus(transformedData);
      } catch (error) {
        console.error('Error fetching voting status:', error);
        setError(error instanceof Error ? error.message : 'Failed to load voting status');
      } finally {
        setLoading(false);
      }
    };

    fetchVotingStatus();

    // Set up event listener for proxy updates
    const handleProxyUpdate = () => {
      console.log('Proxy data updated, refreshing voting status...');
      fetchVotingStatus();
    };

    window.addEventListener('proxyDataUpdated', handleProxyUpdate);

    return () => {
      window.removeEventListener('proxyDataUpdated', handleProxyUpdate);
    };
  }, [getCurrentUserId]);

  const getVoteTypeIcon = (type: string) => {
    return type === 'employee' ? <User className="h-4 w-4" /> : <Vote className="h-4 w-4" />;
  };

  const getVoteValueColor = (value: string) => {
    return value === 'VOTE' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !votingStatus) {
    return (
      <div className="fixed bottom-6 left-6 z-40">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            {error ? (
              <>
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <span className="text-sm font-medium text-red-700">Error loading status</span>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading voting status...</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-6 z-40"
      >
        <motion.div
          animate={{ height: isExpanded ? 'auto' : '64px' }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-w-80"
        >
          {/* Collapsed View */}
          <motion.div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Vote className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {votingStatus.totalVotesRemaining} votes left
                    </span>
                    {votingStatus.proxyVotesRemaining > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {votingStatus.proxyVotesRemaining} proxy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {votingStatus.totalVotesUsed} votes cast
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Expanded View */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-100"
              >
                <div className="p-4 space-y-3">
                  {/* Personal Votes */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Personal votes</span>
                    </div>
                    <span className="text-sm font-medium">
                      {votingStatus.personalVotesRemaining}/{votingStatus.personalVotesTotal}
                    </span>
                  </div>

                  {/* Proxy Votes */}
                  {votingStatus.proxyVotesTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-700">Proxy votes</span>
                      </div>
                      <span className="text-sm font-medium">
                        {votingStatus.proxyVotesRemaining}/{votingStatus.proxyVotesTotal}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>
                        {Math.round((votingStatus.totalVotesUsed / (votingStatus.totalVotesUsed + votingStatus.totalVotesRemaining)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(votingStatus.totalVotesUsed / (votingStatus.totalVotesUsed + votingStatus.totalVotesRemaining)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Detailed Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Voting Status</h2>
                    <p className="text-gray-600 mt-1">
                      {votingStatus.totalVotesRemaining} votes remaining out of {votingStatus.totalVotesRemaining + votingStatus.totalVotesUsed} total
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mt-6 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'overview'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'history'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Vote History ({votingStatus.voteHistory.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('proxy')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'proxy'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Proxy Delegations ({votingStatus.proxyDelegations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('mygroups')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'mygroups'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    My Proxy Members ({votingStatus.myProxyGroups.length})
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Personal</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {votingStatus.personalVotesRemaining}
                        </div>
                        <div className="text-xs text-blue-700">
                          of {votingStatus.personalVotesTotal} remaining
                        </div>
                      </div>

                      <div className="bg-indigo-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <UserCheck className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-900">Proxy</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-900">
                          {votingStatus.proxyVotesRemaining}
                        </div>
                        <div className="text-xs text-indigo-700">
                          of {votingStatus.proxyVotesTotal} remaining
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Used</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {votingStatus.totalVotesUsed}
                        </div>
                        <div className="text-xs text-green-700">votes cast</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Total</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {votingStatus.totalVotesRemaining + votingStatus.totalVotesUsed}
                        </div>
                        <div className="text-xs text-gray-700">available votes</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Votes</h3>
                      <div className="space-y-3">
                        {votingStatus.voteHistory.slice(0, 3).map((vote) => (
                          <div key={vote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-white rounded-lg">
                                {getVoteTypeIcon(vote.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{vote.targetName}</p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>{formatDate(vote.votedAt)}</span>
                                  {vote.isProxy && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600">Proxy for {vote.proxyFor?.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVoteValueColor(vote.voteValue)}`}>
                              {vote.voteValue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {votingStatus.voteHistory.map((vote) => (
                      <div key={vote.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getVoteTypeIcon(vote.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{vote.targetName}</h4>
                              {vote.targetPosition && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                  <Award className="h-4 w-4" />
                                  <span>{vote.targetPosition}</span>
                                  {vote.targetDepartment && (
                                    <>
                                      <Building2 className="h-4 w-4" />
                                      <span>{vote.targetDepartment}</span>
                                    </>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(vote.votedAt)}</span>
                                <span>•</span>
                                <span className="capitalize">{vote.type} vote</span>
                              </div>
                              {vote.isProxy && vote.proxyFor && (
                                <div className="flex items-center space-x-2 text-xs text-blue-600 mt-1">
                                  <UserCheck className="h-3 w-3" />
                                  <span>Voted on behalf of {vote.proxyFor.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getVoteValueColor(vote.voteValue)}`}>
                              {vote.voteValue}
                            </span>
                            <span className="text-xs text-gray-500">Weight: {vote.weight}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proxy Tab */}
                {activeTab === 'proxy' && (
                  <div className="space-y-4">
                    {votingStatus.proxyDelegations.map((delegation) => (
                      <div key={delegation.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <UserCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{delegation.delegatorName}</h4>
                              <p className="text-sm text-gray-600">{delegation.delegatorEmail}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Vote className="h-3 w-3" />
                                  <span className="capitalize">{delegation.voteType} votes</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Valid until {delegation.validUntil.toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {delegation.remainingVotes}/{delegation.totalVotes}
                            </div>
                            <div className="text-xs text-gray-500">votes remaining</div>
                            <div className="w-20 h-2 bg-gray-200 rounded-full mt-2">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${(delegation.remainingVotes / delegation.totalVotes) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Proxy Members Section */}
                        {delegation.proxyMembers && delegation.proxyMembers.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">Proxy Members</h5>
                            <div className="space-y-3">
                              {delegation.proxyMembers.map((member) => (
                                <div key={member.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-2">
                                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            member.appointmentType === 'INSTRUCTIONAL' 
                                              ? 'bg-orange-100 text-orange-800' 
                                              : 'bg-green-100 text-green-800'
                                          }`}>
                                            {member.appointmentType}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600">{member.email}</p>
                                        <p className="text-xs text-gray-500">Member #: {member.memberNumber}</p>
                                        
                                        {/* Allowed Candidates for INSTRUCTIONAL proxies */}
                                        {member.appointmentType === 'INSTRUCTIONAL' && member.allowedCandidates.length > 0 && (
                                          <div className="mt-2 pl-2 border-l-2 border-orange-300">
                                            <p className="text-xs font-medium text-orange-800 mb-1">Allowed Candidates:</p>
                                            <div className="space-y-1">
                                              {member.allowedCandidates.map((candidate) => (
                                                <div key={candidate.id} className="text-xs text-gray-700 flex items-center space-x-1">
                                                  <Award className="h-3 w-3 text-orange-500" />
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
                                                      <Building2 className="h-3 w-3" />
                                                      <span>{candidate.department}</span>
                                                    </>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {votingStatus.proxyDelegations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No proxy delegations found</p>
                        <p className="text-sm">You haven't been delegated any proxy votes</p>
                      </div>
                    )}
                  </div>
                )}

                {/* My Proxy Members Tab */}
                {activeTab === 'mygroups' && (
                  <div className="space-y-4">
                    {votingStatus.myProxyGroups.map((group) => (
                      <div key={group.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <Users className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{group.groupName}</h4>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                <div className="flex items-center space-x-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    group.appointmentType === 'INSTRUCTIONAL' 
                                      ? 'bg-orange-100 text-orange-800'
                                      : group.appointmentType === 'DISCRETIONAL'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {group.appointmentType || 'MIXED'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    group.isActive 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {group.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Created {group.createdAt.toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {group.proxyMembers.length}
                            </div>
                            <div className="text-xs text-gray-500">proxy members</div>
                          </div>
                        </div>

                        {/* Proxy Members Section */}
                        {group.proxyMembers && group.proxyMembers.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">
                              People Who Can Vote on Your Behalf
                            </h5>
                            <div className="space-y-3">
                              {group.proxyMembers.map((member) => (
                                <div key={member.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-2">
                                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            member.appointmentType === 'INSTRUCTIONAL' 
                                              ? 'bg-orange-100 text-orange-800' 
                                              : 'bg-green-100 text-green-800'
                                          }`}>
                                            {member.appointmentType}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600">{member.email}</p>
                                        <p className="text-xs text-gray-500">Member #: {member.memberNumber}</p>
                                        
                                        {/* Explanation of appointment type */}
                                        <div className="mt-2 text-xs text-gray-600">
                                          {member.appointmentType === 'INSTRUCTIONAL' ? (
                                            <p className="italic">
                                              ⚠️ Can only vote for the specific candidates listed below
                                            </p>
                                          ) : (
                                            <p className="italic">
                                              ✓ Can vote for any candidate on your behalf
                                            </p>
                                          )}
                                        </div>
                                        
                                        {/* Allowed Candidates for INSTRUCTIONAL proxies */}
                                        {member.appointmentType === 'INSTRUCTIONAL' && member.allowedCandidates.length > 0 && (
                                          <div className="mt-3 pl-2 border-l-2 border-orange-300">
                                            <p className="text-xs font-medium text-orange-800 mb-2">
                                              Allowed to Vote For:
                                            </p>
                                            <div className="space-y-1">
                                              {member.allowedCandidates.map((candidate) => (
                                                <div key={candidate.id} className="text-xs text-gray-700 flex items-center space-x-1 bg-white p-2 rounded">
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

                                        {member.appointmentType === 'INSTRUCTIONAL' && member.allowedCandidates.length === 0 && (
                                          <div className="mt-2 text-xs text-orange-600 italic">
                                            ⚠️ No specific candidates assigned yet
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {group.proxyMembers.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No proxy members assigned to this group yet
                          </div>
                        )}
                      </div>
                    ))}

                    {votingStatus.myProxyGroups.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No proxy groups found</p>
                        <p className="text-sm">You haven't created any proxy groups yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VotingStatusBar;