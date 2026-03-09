import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
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
  voteValue: 'VOTE' | 'NO' | 'ABSTAIN';
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

// Helper function for fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Demo data fallback for when API is unavailable
const getDemoVotingStatus = (): VotingStatus => ({
  personalVotesRemaining: 2,
  personalVotesTotal: 2,
  proxyVotesRemaining: 2,
  proxyVotesTotal: 2,
  totalVotesRemaining: 17,
  totalVotesUsed: 0,
  voteHistory: [],
  proxyDelegations: [
    {
      id: '1',
      delegatorId: '13',
      delegatorName: 'Admin User',
      delegatorEmail: 'admin@forvismazars.com',
      voteType: 'both',
      remainingVotes: 1,
      totalVotes: 1,
      validUntil: new Date('2026-12-31'),
      proxyMembers: [{
        id: '13',
        name: 'Admin User',
        email: 'admin@forvismazars.com',
        memberNumber: 'EMP-13',
        appointmentType: 'DISCRETIONARY',
        allowedCandidates: []
      }]
    },
    {
      id: '2',
      delegatorId: '14',
      delegatorName: 'John Administrator',
      delegatorEmail: 'john.admin@forvismazars.com',
      voteType: 'both',
      remainingVotes: 1,
      totalVotes: 1,
      validUntil: new Date('2026-12-31'),
      proxyMembers: [{
        id: '14',
        name: 'John Administrator',
        email: 'john.admin@forvismazars.com',
        memberNumber: 'EMP-14',
        appointmentType: 'DISCRETIONARY',
        allowedCandidates: []
      }]
    }
  ],
  myProxyGroups: []
});

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
      console.log('🔄 VotingStatusBar: Starting to fetch voting status...');
      setLoading(true);
      setError(null);
      try {
        const userId = getCurrentUserId();
        console.log('👤 VotingStatusBar: User ID:', userId);
        
        if (!userId) {
          // Use demo data for John Voter
          console.log('⚠️ VotingStatusBar: No user ID, using demo data');
          setVotingStatus(getDemoVotingStatus());
          setLoading(false);
          return;
        }

        // Get active session from real API
        let sessionId: number = 1;
        try {
          const sessionRes = await api.getActiveSession();
          const sessions = (sessionRes.data as any)?.sessions || (Array.isArray(sessionRes.data) ? sessionRes.data : []);
          const session = sessions[0];
          if (session) {
            sessionId = session.SessionID || session.sessionId || 1;
          } else {
            console.log('⚠️ VotingStatusBar: No active session, using default');
          }
        } catch (err) {
          console.warn('⚠️ VotingStatusBar: Could not fetch active session, defaulting to 1:', err);
        }
        console.log('📊 VotingStatusBar: Fetching data for session:', sessionId);
        
        // Fetch vote allocation with timeout and error handling
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        let allocatedVotes = 2; // default minimum — updated from API
        let proxies: any[] = [];
        let votes: any[] = [];

        // Fetch global vote limits (min set by Super Admin) so fallback is correct
        try {
          const limitsResponse = await fetchWithTimeout(
            `http://localhost:3001/api/vote-splitting/limits`,
            { headers },
            5000
          );
          if (limitsResponse.ok) {
            const limitsData = await limitsResponse.json();
            allocatedVotes = limitsData.minVotes ?? 2;
          }
        } catch (err) {
          console.warn('⚠️ VotingStatusBar: Could not fetch vote limits, defaulting to 2:', err);
        }

        // Try to fetch allocation data (user-specific, may override the default)
        try {
          console.log('📡 VotingStatusBar: Fetching allocations...');
          const allocationResponse = await fetchWithTimeout(
            `http://localhost:3001/api/allocations/user/${userId}/${sessionId}`,
            { headers },
            5000
          );
          
          console.log('📡 VotingStatusBar: Allocation response status:', allocationResponse.status);
          if (allocationResponse.ok) {
            const allocationData = await allocationResponse.json();
            console.log('✅ VotingStatusBar: Allocation data:', allocationData);
            allocatedVotes = allocationData.allocation?.AllocatedVotes ?? allocatedVotes;
          }
        } catch (err) {
          console.warn('⚠️ VotingStatusBar: Failed to fetch allocations, using default:', err);
        }
        
        // Try to fetch proxy assignments
        try {
          console.log('📡 VotingStatusBar: Fetching proxies...');
          const proxyResponse = await fetchWithTimeout(
            `http://localhost:3001/api/proxy/holder/${userId}`,
            { headers },
            5000
          );
          
          console.log('📡 VotingStatusBar: Proxy response status:', proxyResponse.status);
          if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            console.log('✅ VotingStatusBar: Proxy data:', proxyData);
            proxies = proxyData.proxies || [];
          }
        } catch (err) {
          console.warn('⚠️ VotingStatusBar: Failed to fetch proxies, using default:', err);
        }
        
        // Try to fetch vote history
        try {
          console.log('📡 VotingStatusBar: Fetching vote history...');
          const votesResponse = await fetchWithTimeout(
            `http://localhost:3001/api/votes/user/${userId}?sessionId=${sessionId}`,
            { headers },
            5000
          );
          
          console.log('📡 VotingStatusBar: Votes response status:', votesResponse.status);
          if (votesResponse.ok) {
            const votesData = await votesResponse.json();
            console.log('✅ VotingStatusBar: Votes data:', votesData);
            votes = votesData.votes || [];
          }
        } catch (err) {
          console.warn('⚠️ VotingStatusBar: Failed to fetch votes, using default:', err);
        }
        
        // Calculate proxy votes
        const proxyVotesTotal = proxies.length;
        
        // Calculate used votes
        const personalVotesUsed = votes.filter((v: any) => !v.IsProxyVote).length;
        const proxyVotesUsed = votes.filter((v: any) => v.IsProxyVote).length;
        
        const personalVotesRemaining = allocatedVotes - personalVotesUsed;
        const proxyVotesRemaining = proxyVotesTotal - proxyVotesUsed;
        
        // Transform vote history
        const voteHistory: VoteRecord[] = votes.map((v: any) => ({
          id: v.VoteID?.toString() || '',
          type: v.VoteType === 'candidate' ? 'employee' : 'resolution',
          targetId: v.EntityID?.toString() || '',
          targetName: v.EntityName || 'Unknown',
          targetPosition: v.Category,
          targetDepartment: undefined,
          voteValue: v.VoteType === 'candidate'
            ? 'VOTE'
            : (v.Category === 'yes' ? 'VOTE' : v.Category === 'no' ? 'NO' : 'ABSTAIN'),
          votedAt: new Date(v.VotedAt),
          isProxy: v.IsProxyVote ? true : false,
          proxyFor: v.ProxyForName ? {
            id: v.ProxyForID?.toString() || '',
            name: v.ProxyForName,
            email: v.ProxyForEmail || ''
          } : undefined,
          weight: v.VotesAllocated || 1
        }));
        
        // Transform proxy delegations
        const proxyDelegations: ProxyDelegation[] = proxies.map((p: any) => ({
          id: p.ProxyID?.toString() || '',
          delegatorId: p.PrincipalUserID?.toString() || '',
          delegatorName: p.PrincipalName || 'Unknown',
          delegatorEmail: p.PrincipalEmail || '',
          voteType: 'both',
          remainingVotes: 1,
          totalVotes: 1,
          validUntil: p.EndDate ? new Date(p.EndDate) : new Date('2026-12-31'),
          proxyMembers: [{
            id: p.PrincipalUserID?.toString() || '',
            name: p.PrincipalName || 'Unknown',
            email: p.PrincipalEmail || '',
            memberNumber: `EMP-${p.PrincipalUserID}`,
            appointmentType: p.ProxyType?.toLowerCase() === 'instructional' ? 'INSTRUCTIONAL' : 'DISCRETIONARY',
            allowedCandidates: []
          }]
        }));

        const votingStatusData: VotingStatus = {
          personalVotesRemaining,
          personalVotesTotal: allocatedVotes,
          proxyVotesRemaining,
          proxyVotesTotal,
          totalVotesRemaining: personalVotesRemaining + proxyVotesRemaining,
          totalVotesUsed: personalVotesUsed + proxyVotesUsed,
          voteHistory,
          proxyDelegations,
          myProxyGroups: []
        };

        console.log('✅ VotingStatusBar: Final voting status:', votingStatusData);
        setVotingStatus(votingStatusData);
        
        // Broadcast initial voting status for other components
        window.dispatchEvent(new CustomEvent('votingStatusLoaded', {
          detail: {
            totalVotesRemaining: votingStatusData.totalVotesRemaining,
            personalVotesRemaining: votingStatusData.personalVotesRemaining,
            totalVotesUsed: votingStatusData.totalVotesUsed
          }
        }));
        console.log('📢 VotingStatusBar: Broadcasted votingStatusLoaded event');
      } catch (error) {
        console.error('❌ VotingStatusBar: Error loading voting status:', error);
        // Fallback to demo data on error
        const demoData = getDemoVotingStatus();
        console.log('⚠️ VotingStatusBar: Using demo data fallback:', demoData);
        setVotingStatus(demoData);
      } finally {
        console.log('✅ VotingStatusBar: Setting loading to false');
        setLoading(false);
      }
    };

    fetchVotingStatus();

    // Set up event listener for proxy updates
    const handleProxyUpdate = () => {
      fetchVotingStatus();
    };

    // Set up event listener for voting status updates (when votes are cast/removed)
    const handleVotingStatusUpdate = () => {
      fetchVotingStatus();
    };

    // Set up event listener for proxy vote allocation
    const handleProxyVoteAllocation = (event: CustomEvent) => {
      if (votingStatus) {
        const { allocated } = event.detail;
        setVotingStatus(prev => {
          if (!prev) return prev;
          const newRemaining = Math.max(0, prev.totalVotesRemaining - allocated);
          return {
            ...prev,
            personalVotesRemaining: newRemaining,
            totalVotesRemaining: newRemaining,
            totalVotesUsed: prev.totalVotesUsed
          };
        });
      }
    };

    // Set up event listener for requesting current voting status
    const handleRequestVotingStatus = () => {
      if (votingStatus) {
        window.dispatchEvent(new CustomEvent('votingStatusLoaded', {
          detail: {
            totalVotesRemaining: votingStatus.totalVotesRemaining,
            personalVotesRemaining: votingStatus.personalVotesRemaining,
            totalVotesUsed: votingStatus.totalVotesUsed
          }
        }));
      }
    };

    // Set up event listener for vote assignment by admin
    const handleVotesAssigned = () => {
      fetchVotingStatus();
    };

    window.addEventListener('proxyDataUpdated', handleProxyUpdate);
    window.addEventListener('votingStatusUpdated', handleVotingStatusUpdate);
    window.addEventListener('proxyVoteAllocation', handleProxyVoteAllocation as EventListener);
    window.addEventListener('requestVotingStatus', handleRequestVotingStatus as EventListener);
    window.addEventListener('votesAssigned', handleVotesAssigned);

    return () => {
      window.removeEventListener('proxyDataUpdated', handleProxyUpdate);
      window.removeEventListener('votingStatusUpdated', handleVotingStatusUpdate);
      window.removeEventListener('proxyVoteAllocation', handleProxyVoteAllocation as EventListener);
      window.removeEventListener('requestVotingStatus', handleRequestVotingStatus as EventListener);
      window.removeEventListener('votesAssigned', handleVotesAssigned);
    };
  }, [getCurrentUserId]);

  const getVoteTypeIcon = (type: string) => {
    return type === 'employee' ? <User className="h-4 w-4" /> : <Vote className="h-4 w-4" />;
  };

  const getVoteValueColor = (value: string) => {
    if (value === 'VOTE') return 'text-green-600 bg-green-100';
    if (value === 'NO') return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
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
