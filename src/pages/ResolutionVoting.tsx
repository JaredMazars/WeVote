import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Info,
  Shield,
  Eye,
  X
} from 'lucide-react';
import Header from '../components/Header';
import VotingStatusBar from '../components/VotingStatusBar';
import VotingLockedModal from '../components/VotingLockedModal';
import AGMClosedModal from '../components/AGMClosedModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Resolution {
  id: string;
  resolution_number: string;
  title: string;
  description: string;
  proposed_by: string;
  voting_requirement: 'ordinary' | 'special';
  category: string;
  details?: string;
  financial_impact?: string;
  effective_date?: string;
  status: 'active' | 'closed' | 'upcoming';
  vote_start_date: string;
  vote_end_date: string;
  created_at: string;
}

interface VoteStats {
  total_votes: number;
  for_votes: number;
  against_votes: number;
  abstain_votes: number;
  for_percentage: number;
  against_percentage: number;
  abstain_percentage: number;
  required_majority: number;
  is_passing: boolean;
}

interface ProxyGroup {
  id: string;
  group_name: string;
  member_count: number;
  members: Array<{
    id: string;
    name: string;
    membership_number: string;
  }>;
}

type VoteChoice = 'for' | 'against' | 'abstain' | null;

const ResolutionVoting: React.FC = () => {
  const { user } = useAuth();
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [voteStats, _setVoteStats] = useState<Record<string, VoteStats>>({});
  const [userVotes, setUserVotes] = useState<Record<string, VoteChoice>>({});
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'upcoming'>('active');
  const [votingAs, setVotingAs] = useState<'self' | 'proxy'>('self');
  const [isAdmin, setIsAdmin] = useState(false); // Check if user is admin
  const [blockchainReceipt, setBlockchainReceipt] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastVotedChoice, setLastVotedChoice] = useState<VoteChoice | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  
  // AGM Timer enforcement
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<string>('');
  const [showClosedModal, setShowClosedModal] = useState(false);
  
  // Check if voting is allowed — prefer server session status, fall back to localStorage timer
  const isVotingAllowed = () => {
    if (activeSessionId) return true;
    const timerStart = localStorage.getItem('agmTimerStart');
    const timerEnd = localStorage.getItem('agmTimerEnd');
    return !!(timerStart && !timerEnd);
  };

  useEffect(() => {
    loadData();
    checkUserRole();
    checkAGMStatus();
    
    // Check timer status on mount
    const checkTimerStatus = () => {
      const savedStartDateTime = localStorage.getItem('agmStartDateTime');
      const savedEndTime = localStorage.getItem('agmTimerEndTime');
      
      if (savedStartDateTime) {
        setStartDateTime(new Date(savedStartDateTime));
      }
      if (savedEndTime) {
        setEndTime(savedEndTime);
      }
      
      if (!isVotingAllowed()) {
        setShowLockedModal(true);
      }
    };
    
    checkTimerStatus();
    
    // Listen for timer updates
    const handleTimerUpdate = () => {
      checkTimerStatus();
    };
    
    window.addEventListener('agmTimerUpdated', handleTimerUpdate);
    window.addEventListener('storage', handleTimerUpdate);
    
    return () => {
      window.removeEventListener('agmTimerUpdated', handleTimerUpdate);
      window.removeEventListener('storage', handleTimerUpdate);
    };
  }, []);

  const checkUserRole = async () => {
    try {
      // Check if user has admin role
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsAdmin(user.role_name === 'Admin' || user.role_name === 'admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
    }
  };

  const checkAGMStatus = async () => {
    try {
      const response = await api.get('/sessions?status=in_progress');
      const sessions = (response.data as any)?.sessions || [];
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        if (sessions.length === 0 && currentUser.role_name !== 'auditor') {
          setShowClosedModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking AGM status:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get active session
      const sessionRes = await api.getActiveSession();
      const sessions = (sessionRes.data as any)?.sessions || (Array.isArray(sessionRes.data) ? sessionRes.data : []);
      const session = sessions[0];
      const sessionId = session?.SessionID || session?.sessionId || null;
      setActiveSessionId(sessionId);

      // Load resolutions from API
      try {
        const resResponse = await api.getResolutions();
        if (resResponse.success && resResponse.data) {
          const mappedResolutions = (Array.isArray(resResponse.data) ? resResponse.data : []).map((res: any) => ({
            id: res.ResolutionID?.toString() || res.id,
            resolution_number: res.ResolutionNumber || `2025/${res.ResolutionID}`,
            title: res.ResolutionTitle || res.Title,
            description: res.Description || '',
            proposed_by: res.ProposedByName || res.proposed_by || 'Board of Directors',
            voting_requirement: (res.RequiredMajority >= 66 ? 'special' : 'ordinary') as 'ordinary' | 'special',
            category: res.Category || 'General',
            status: (res.Status === 'active' ? 'active' : res.Status === 'closed' ? 'closed' : 'upcoming') as 'active' | 'closed' | 'upcoming',
            vote_start_date: res.CreatedAt || res.created_at || new Date().toISOString(),
            vote_end_date: res.UpdatedAt || res.updated_at || new Date().toISOString(),
            created_at: res.CreatedAt || res.created_at || new Date().toISOString(),
            details: res.Description || '',
            financial_impact: '',
            effective_date: ''
          }));
          setResolutions(mappedResolutions);
        } else {
          setResolutions([]);
        }
      } catch (error) {
        console.error('Error loading resolutions:', error);
        setResolutions([]);
      }

      setProxyGroups([]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (resolutionId: string, choice: VoteChoice) => {
    if (!isVotingAllowed()) { setShowLockedModal(true); return; }
    if (!user) return;
    if (!activeSessionId) {
      setVoteError('No active AGM session. Please contact the administrator.');
      return;
    }

    setVoteError(null);

    try {
      const voteChoiceMap: Record<string, 'yes' | 'no' | 'abstain'> = { for: 'yes', against: 'no', abstain: 'abstain' };
      const voteChoice = voteChoiceMap[choice as string] ?? 'abstain';

      // Cast vote via real API
      const voteRes = await api.castResolutionVote({
        sessionId: activeSessionId,
        resolutionId: parseInt(resolutionId),
        voteChoice,
      });

      if (!voteRes.success && voteRes.message) {
        setVoteError(voteRes.message);
        return;
      }

      setUserVotes(prev => ({ ...prev, [resolutionId]: choice }));
      setLastVotedChoice(choice);

      // Record on real backend blockchain
      try {
        await api.recordBlockchainVote({
          voteId: (voteRes.data as any)?.result?.VoteID?.toString() || `VOTE-${Date.now()}`,
          userId: user.id,
          sessionId: activeSessionId,
          resolutionId: parseInt(resolutionId),
          voteChoice,
          timestamp: new Date().toISOString(),
        });
        setBlockchainReceipt({ recorded: true });
      } catch { /* non-critical */ }

      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 4000);
    } catch (error: any) {
      console.error('Error voting:', error);
      setVoteError(error?.message || 'Failed to record vote. Please try again.');
    }
  };

  const filteredResolutions = resolutions.filter(
    r => filter === 'all' || r.status === filter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Active</span>
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
            Closed
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            Upcoming
          </span>
        );
      default:
        return null;
    }
  };

  const getRequirementBadge = (requirement: string) => {
    return requirement === 'special' ? (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
        Special (75%)
      </span>
    ) : (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
        Ordinary (50%)
      </span>
    );
  };

  return (
    <>
      {showClosedModal && <AGMClosedModal onClose={() => setShowClosedModal(false)} />}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #0072CE, #171C8F);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #005a9c, #0f1366);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-[#464B4B] mb-2">AGM Resolutions</h1>
            <p className="text-[#464B4B]/70">Vote on important company resolutions and governance matters</p>
          </motion.div>

          {/* Voting As Selector */}
          {proxyGroups.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-2xl p-4 mb-6 border-2 border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-[#464B4B]">Voting As:</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={votingAs === 'self'}
                          onChange={() => setVotingAs('self')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-[#464B4B]">Myself</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={votingAs === 'proxy'}
                          onChange={() => setVotingAs('proxy')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-[#464B4B]">
                          Proxy Group ({proxyGroups[0].member_count} members)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProxyModal(true)}
                  className="text-[#0072CE] hover:text-[#171C8F] font-medium text-sm flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-6">
            {['all', 'active', 'closed', 'upcoming'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                    : 'bg-white text-[#464B4B] hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Vote error notification */}
          {voteError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{voteError}</span>
              <button onClick={() => setVoteError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Resolutions List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072CE] mx-auto mb-4"></div>
              <p className="text-[#464B4B]/70">Loading resolutions...</p>
            </div>
          ) : filteredResolutions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-[#464B4B]/70">No resolutions found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResolutions.map((resolution, index) => {
                const stats = voteStats[resolution.id];
                const userVote = userVotes[resolution.id];

                return (
                  <motion.div
                    key={resolution.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] p-6 text-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl font-bold">{resolution.resolution_number}</span>
                            {getStatusBadge(resolution.status)}
                            {getRequirementBadge(resolution.voting_requirement)}
                          </div>
                          <h3 className="text-2xl font-bold mb-2">{resolution.title}</h3>
                          <p className="text-white/90 text-sm">Proposed by: {resolution.proposed_by}</p>
                        </div>
                        <button
                          onClick={() => setSelectedResolution(resolution)}
                          className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-[#464B4B] mb-6">{resolution.description}</p>

                      {/* Vote Stats - Only visible to admins */}
                      {isAdmin && stats && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-[#464B4B] flex items-center space-x-2">
                              <TrendingUp className="h-5 w-5 text-[#0072CE]" />
                              <span>Current Results (Admin View)</span>
                            </h4>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-[#464B4B]/60" />
                              <span className="text-sm text-[#464B4B]/60">
                                {stats.total_votes} votes cast
                              </span>
                            </div>
                          </div>

                          {/* Vote Bars */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-green-700">For</span>
                                <span className="font-bold text-green-700">
                                  {stats.for_percentage.toFixed(1)}% ({stats.for_votes})
                                </span>
                              </div>
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                  style={{ width: `${stats.for_percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-red-700">Against</span>
                                <span className="font-bold text-red-700">
                                  {stats.against_percentage.toFixed(1)}% ({stats.against_votes})
                                </span>
                              </div>
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-500 to-blue-500"
                                  style={{ width: `${stats.against_percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">Abstain</span>
                                <span className="font-bold text-gray-700">
                                  {stats.abstain_percentage.toFixed(1)}% ({stats.abstain_votes})
                                </span>
                              </div>
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-gray-400 to-gray-500"
                                  style={{ width: `${stats.abstain_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* Passing Status */}
                          <div className={`mt-4 p-3 rounded-xl flex items-center space-x-2 ${
                            stats.is_passing
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {stats.is_passing ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <AlertCircle className="h-5 w-5" />
                            )}
                            <span className="font-semibold text-sm">
                              {stats.is_passing
                                ? `Currently passing (>${stats.required_majority}% required)`
                                : `Not passing yet (${stats.required_majority}% required)`}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Info message for non-admin users */}
                      {!isAdmin && resolution.status === 'active' && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
                          <div className="flex items-start space-x-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Voting results will be available after the voting period closes on{' '}
                                {new Date(resolution.vote_end_date).toLocaleDateString()}.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Voting Buttons */}
                      {resolution.status === 'active' && (
                        <div className="flex gap-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleVote(resolution.id, 'for')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold transition-all ${
                              userVote === 'for'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            <ThumbsUp className="h-5 w-5" />
                            <span>Vote For</span>
                            {userVote === 'for' && <CheckCircle className="h-5 w-5" />}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleVote(resolution.id, 'against')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold transition-all ${
                              userVote === 'against'
                                ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-xl'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            <ThumbsDown className="h-5 w-5" />
                            <span>Vote Against</span>
                            {userVote === 'against' && <CheckCircle className="h-5 w-5" />}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleVote(resolution.id, 'abstain')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold transition-all ${
                              userVote === 'abstain'
                                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-xl'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            <Minus className="h-5 w-5" />
                            <span>Abstain</span>
                            {userVote === 'abstain' && <CheckCircle className="h-5 w-5" />}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolution Details Modal */}
        <AnimatePresence>
          {selectedResolution && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedResolution(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl font-bold text-[#0072CE]">
                        {selectedResolution.resolution_number}
                      </span>
                      {getStatusBadge(selectedResolution.status)}
                      {getRequirementBadge(selectedResolution.voting_requirement)}
                    </div>
                    <h2 className="text-3xl font-bold text-[#464B4B]">
                      {selectedResolution.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedResolution(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-8 w-8" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-[#464B4B]/70 mb-1">Proposed by:</p>
                    <p className="font-semibold text-[#464B4B]">{selectedResolution.proposed_by}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#464B4B] mb-2">Description</h3>
                    <p className="text-[#464B4B]">{selectedResolution.description}</p>
                  </div>

                  {selectedResolution.details && (
                    <div>
                      <h3 className="font-semibold text-[#464B4B] mb-2">Details</h3>
                      <p className="text-[#464B4B]">{selectedResolution.details}</p>
                    </div>
                  )}

                  {selectedResolution.financial_impact && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                      <h3 className="font-semibold text-[#464B4B] mb-2 flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span>Financial Impact</span>
                      </h3>
                      <p className="text-[#464B4B]">{selectedResolution.financial_impact}</p>
                    </div>
                  )}

                  {selectedResolution.effective_date && (
                    <div>
                      <h3 className="font-semibold text-[#464B4B] mb-2">Effective Date</h3>
                      <p className="text-[#464B4B]">
                        {new Date(selectedResolution.effective_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#464B4B]/70 mb-1">Voting Starts</p>
                      <p className="font-semibold text-[#464B4B]">
                        {new Date(selectedResolution.vote_start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#464B4B]/70 mb-1">Voting Ends</p>
                      <p className="font-semibold text-[#464B4B]">
                        {new Date(selectedResolution.vote_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proxy Modal */}
        <AnimatePresence>
          {showProxyModal && proxyGroups.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowProxyModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-[#464B4B]">Proxy Group Details</h2>
                  <button
                    onClick={() => setShowProxyModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-8 w-8" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-[#464B4B] mb-2">
                    {proxyGroups[0].group_name}
                  </h3>
                  <p className="text-[#464B4B]/70">
                    You are authorized to vote on behalf of {proxyGroups[0].member_count} members
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#464B4B] mb-4">Members in this group:</h4>
                  <div className="space-y-2">
                    {proxyGroups[0].members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold text-[#464B4B]">{member.name}</p>
                          <p className="text-sm text-[#464B4B]/60">#{member.membership_number}</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Success Modal with Blockchain Verification */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#464B4B] mb-3">Vote Recorded!</h2>
                <p className="text-[#464B4B]/70 mb-2">
                  Your vote of <strong className="text-xl">{lastVotedChoice?.toUpperCase()}</strong> has been successfully recorded.
                </p>
                
                {/* Blockchain Verification */}
                {blockchainReceipt && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">⛓️</span>
                      <h3 className="font-bold text-blue-900">Blockchain Verified</h3>
                    </div>
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Transaction ID:</span>
                        <span className="font-mono text-xs text-blue-900">{blockchainReceipt.blockchainReceipt.transactionId.substring(0, 20)}...</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Block Number:</span>
                        <span className="font-bold text-blue-900">#{blockchainReceipt.blockchainReceipt.blockNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Status:</span>
                        <span className="font-bold text-green-600">✓ {blockchainReceipt.blockchainReceipt.status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(blockchainReceipt.verificationUrl, '_blank')}
                      className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      🔍 Verify on Blockchain
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voting Status Bar */}
      <VotingStatusBar />
      
      {/* Voting Locked Modal */}
      <VotingLockedModal
        isOpen={showLockedModal}
        onClose={() => setShowLockedModal(false)}
        startDateTime={startDateTime}
        endTime={endTime}
      />
    </>
  );
};

export default ResolutionVoting;
