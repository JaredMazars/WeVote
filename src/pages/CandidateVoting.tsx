import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import VotingStatusBar from '../components/VotingStatusBar';
import VotingLockedModal from '../components/VotingLockedModal';
import AGMClosedModal from '../components/AGMClosedModal';
import api from '../services/api';
import { 
  Users, 
  Vote, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  User,
  Shield,
  TrendingUp,
  X
} from 'lucide-react';
import { calculateVoteWeight, checkVoteEligibility, getMockUser, castVote } from '../utils/proxyVoting';
import { blockchainService } from '../services/blockchain';

interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  bio: string;
  image?: string;
  skills?: string[];
  achievements?: string[];
}

// Mock candidates data
const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    bio: 'Sarah has been with the company for 5 years, leading multiple successful projects and mentoring junior developers. Her expertise in cloud architecture and agile methodologies has been instrumental in our digital transformation.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces',
    skills: ['Cloud Architecture', 'React', 'Leadership', 'Agile'],
    achievements: ['Employee of the Year 2024', 'Led 3 major projects', 'Mentored 10+ developers']
  },
  {
    id: '2',
    name: 'Michael Chen',
    position: 'Marketing Director',
    department: 'Marketing',
    bio: 'Michael brings 8 years of marketing experience, specializing in digital campaigns and brand strategy. He has consistently delivered results exceeding targets and built strong relationships with key stakeholders.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
    skills: ['Digital Marketing', 'Brand Strategy', 'Analytics', 'Team Management'],
    achievements: ['150% ROI on campaigns', 'Grew social media by 300%', 'Award-winning campaigns']
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    position: 'HR Manager',
    department: 'Human Resources',
    bio: 'Emily has transformed our HR practices with innovative employee engagement programs and diversity initiatives. Her commitment to creating an inclusive workplace has made a significant impact on company culture.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces',
    skills: ['Employee Relations', 'Talent Acquisition', 'DEI', 'Policy Development'],
    achievements: ['95% employee satisfaction', 'Reduced turnover by 40%', 'DEI Excellence Award']
  },
  {
    id: '4',
    name: 'David Okonkwo',
    position: 'Sales Team Lead',
    department: 'Sales',
    bio: 'David is a top performer with exceptional relationship-building skills and a track record of exceeding sales targets. His leadership has helped grow our client base significantly over the past three years.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces',
    skills: ['B2B Sales', 'Client Relations', 'Negotiation', 'Team Leadership'],
    achievements: ['200% of sales quota', 'Closed 50+ major deals', 'Built enterprise client base']
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    position: 'Finance Controller',
    department: 'Finance',
    bio: 'Lisa ensures financial integrity and strategic planning with her keen analytical skills. She has streamlined our financial processes and provided insights that have improved our bottom line.',
    image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=faces',
    skills: ['Financial Analysis', 'Budgeting', 'Compliance', 'Strategic Planning'],
    achievements: ['Cost savings of $500K', 'Clean audit record', 'Financial process optimization']
  },
  {
    id: '6',
    name: 'James Park',
    position: 'Product Manager',
    department: 'Product',
    bio: 'James has a vision for product innovation and customer-centric design. His products have received excellent market reception and generated significant revenue for the company.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
    skills: ['Product Strategy', 'UX Design', 'Market Research', 'Roadmap Planning'],
    achievements: ['3 successful product launches', 'Net Promoter Score of 85', 'Revenue growth of 180%']
  }
];

const CandidateVoting: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [candidates] = useState<Candidate[]>(mockCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // AGM Timer enforcement
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<string>('');
  
  // Check if voting is allowed
  const isVotingAllowed = () => {
    const timerStart = localStorage.getItem('agmTimerStart');
    const timerEnd = localStorage.getItem('agmTimerEnd');
    
    // If timer hasn't started or has ended, voting is not allowed
    return !!(timerStart && !timerEnd);
  };
  
  useEffect(() => {
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
  const [voteType, setVoteType] = useState<'regular' | 'proxy' | 'split' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedCandidates, setVotedCandidates] = useState<Set<string>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [voteWeight, setVoteWeight] = useState({ ownVote: 1, proxyCount: 0, totalWeight: 1, proxyAssignees: [] as any[] });
  const [eligibility, setEligibility] = useState({ canVote: true, reason: null as string | null });
  const [selectedProxyIds, setSelectedProxyIds] = useState<number[]>([]);
  const [splitVoteWeight, setSplitVoteWeight] = useState(0);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [blockchainReceipt, setBlockchainReceipt] = useState<any>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);

  useEffect(() => {
    // Calculate vote weight for current user
    if (user) {
      const userId = parseInt(user.id) || 1;
      const weight = calculateVoteWeight(userId);
      setVoteWeight(weight);
      
      // Check eligibility (using motion ID 1 as default for candidate voting)
      const eligible = checkVoteEligibility(userId, 1);
      setEligibility(eligible);
      
      // Check AGM status
      checkAGMStatus();
    }
  }, [user]);

  const checkAGMStatus = async () => {
    try {
      const response = await api.get('/sessions?status=in_progress');
      const sessions = (response.data as any)?.sessions || [];
      if (sessions.length === 0 && user?.role !== 'auditor') {
        setShowClosedModal(true);
      }
    } catch (error) {
      console.error('Error checking AGM status:', error);
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    // Check if voting is allowed (AGM timer check)
    if (!isVotingAllowed()) {
      setShowLockedModal(true);
      return;
    }
    
    setSelectedCandidate(candidate);
    setVoteType(null);
  };

  const handleVoteTypeSelect = (type: 'regular' | 'proxy' | 'split') => {
    setVoteType(type);
    if (type === 'split') {
      // Initialize with no proxies selected
      setSelectedProxyIds([]);
      setSplitVoteWeight(voteWeight.ownVote);
    }
  };

  const toggleProxySelection = (proxyId: number) => {
    setSelectedProxyIds(prev => {
      const newSelection = prev.includes(proxyId)
        ? prev.filter(id => id !== proxyId)
        : [...prev, proxyId];
      
      // Calculate new weight based on selection
      const selectedProxies = voteWeight.proxyAssignees.filter(
        (assignee: any) => newSelection.includes(assignee.id)
      );
      const newWeight = voteWeight.ownVote + selectedProxies.reduce(
        (sum: number, assignee: any) => sum + (assignee.voteWeight || 1), 
        0
      );
      setSplitVoteWeight(newWeight);
      
      return newSelection;
    });
  };

  const handleSubmitVote = async () => {
    if (!selectedCandidate || !voteType || !user) return;
    
    // Check if voting is allowed (AGM timer check)
    if (!isVotingAllowed()) {
      setShowLockedModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    // Cast vote with split voting support
    const userId = parseInt(user.id);
    const candidateId = selectedCandidate.id;
    const voteValue = 'Yes'; // For candidate voting, it's always 'Yes'
    
    if (voteType === 'split') {
      // Cast split vote with selected proxies only
      castVote(userId, 1, voteValue, candidateId, selectedProxyIds);
    } else if (voteType === 'proxy') {
      // Cast full proxy vote
      castVote(userId, 1, voteValue, candidateId);
    } else {
      // Cast regular vote (own vote only)
      castVote(userId, 1, voteValue, candidateId, []);
    }
    
    // 🔐 BLOCKCHAIN: Record vote on blockchain
    const finalWeight = voteType === 'split' ? splitVoteWeight : 
                       voteType === 'proxy' ? voteWeight.totalWeight : 
                       voteWeight.ownVote;
    
    const voteData = {
      voteId: `VOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.email,
      userName: user.name,
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      voteChoice: `Yes (Weight: ${finalWeight})`,
      timestamp: new Date().toISOString(),
      sessionId: `session-${Date.now()}`
    };
    
    const receipt = await blockchainService.recordVoteOnChain(voteData);
    setBlockchainReceipt(receipt);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add to voted candidates
    setVotedCandidates(prev => new Set(prev).add(selectedCandidate.id));
    
    setIsSubmitting(false);
    setShowSuccessModal(true);
    
    // Close modal after 3 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      setSelectedCandidate(null);
      setVoteType(null);
      setSelectedProxyIds([]);
      setSplitVoteWeight(0);
    }, 3000);
  };

  const hasVotedFor = (candidateId: string) => votedCandidates.has(candidateId);

  // Filter candidates based on proxy restrictions
  const getFilteredCandidates = () => {
    const mockUser = getMockUser(parseInt(user?.id || '1'));
    
    // If user is instructional proxy, only show allowed candidates
    if (mockUser?.appointment_type === 'instructional' && mockUser.allowed_candidates) {
      return candidates.filter(c => mockUser.allowed_candidates!.includes(c.id));
    }
    
    return candidates;
  };

  const filteredCandidates = getFilteredCandidates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      {showClosedModal && <AGMClosedModal onClose={() => setShowClosedModal(false)} />}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
          <button
            onClick={() => navigate('/voting')}
            className="flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Voting Selection</span>
          </button>
          
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#464B4B]">Candidate Voting</h1>
                  <p className="text-[#464B4B]/70">Vote for your preferred candidates</p>
                </div>
              </div>
              
              {/* Vote Weight Display */}
              {!eligibility.canVote ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800 font-medium">Cannot Vote</p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">{eligibility.reason}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Vote className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">
                      Your Vote Weight: {voteWeight.totalWeight}
                    </p>
                  </div>
                  {voteWeight.proxyCount > 0 && (
                    <div className="text-xs text-blue-700">
                      <p>Your vote: {voteWeight.ownVote}</p>
                      <p>Proxy votes: {voteWeight.proxyCount}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Proxy Info Banner */}
        {voteWeight.proxyCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">
                    You are voting as a Proxy Holder
                  </h3>
                  <p className="text-green-800 text-sm">
                    Representing {voteWeight.proxyCount} member{voteWeight.proxyCount > 1 ? 's' : ''} with {voteWeight.totalWeight} total votes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProxyModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>View Details</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Proxy Override Warning */}
        {(eligibility as any).willOverride && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-2">
                  Override Proxy Vote
                </h3>
                <p className="text-orange-800">
                  {(eligibility as any).overrideMessage}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Proxy Assignment Info */}
        {(eligibility as any).hasProxy && !(eligibility as any).willOverride && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  You Have a Proxy Assigned
                </h3>
                <p className="text-blue-800">
                  {(eligibility as any).proxyMessage}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => !hasVotedFor(candidate.id) && eligibility.canVote && handleCandidateClick(candidate)}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:scale-105 ${
                hasVotedFor(candidate.id) ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {/* Candidate Image */}
              <div className="h-48 bg-gradient-to-br from-[#0072CE] to-[#171C8F] relative overflow-hidden">
                <img 
                  src={candidate.image} 
                  alt={candidate.name}
                  className="w-full h-full object-cover opacity-90"
                />
                {hasVotedFor(candidate.id) && (
                  <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-white mx-auto mb-2" />
                      <p className="text-white font-bold text-lg">Voted</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Candidate Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#464B4B] mb-1">{candidate.name}</h3>
                <p className="text-[#0072CE] font-semibold mb-1">{candidate.position}</p>
                <p className="text-[#464B4B]/60 text-sm mb-4">{candidate.department}</p>
                
                <p className="text-[#464B4B]/80 text-sm mb-4 line-clamp-3">{candidate.bio}</p>
                
                {/* Skills */}
                {candidate.skills && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {candidate.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                
                <button
                  disabled={hasVotedFor(candidate.id) || !eligibility.canVote}
                  className="w-full py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasVotedFor(candidate.id) ? 'Already Voted' : 'View & Vote'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Candidate Detail Modal */}
        <AnimatePresence>
          {selectedCandidate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => !isSubmitting && setSelectedCandidate(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="relative h-64 bg-gradient-to-br from-[#0072CE] to-[#171C8F]">
                  <img 
                    src={selectedCandidate.image} 
                    alt={selectedCandidate.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <button
                    onClick={() => !isSubmitting && setSelectedCandidate(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-[#464B4B] mb-2">{selectedCandidate.name}</h2>
                  <p className="text-[#0072CE] font-semibold text-lg mb-1">{selectedCandidate.position}</p>
                  <p className="text-[#464B4B]/60 mb-6">{selectedCandidate.department}</p>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#464B4B] mb-3">About</h3>
                    <p className="text-[#464B4B]/80 leading-relaxed">{selectedCandidate.bio}</p>
                  </div>
                  
                  {/* Skills */}
                  {selectedCandidate.skills && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-[#464B4B] mb-3">Skills & Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill, idx) => (
                          <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Achievements */}
                  {selectedCandidate.achievements && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-[#464B4B] mb-3">Key Achievements</h3>
                      <ul className="space-y-2">
                        {selectedCandidate.achievements.map((achievement, idx) => (
                          <li key={idx} className="flex items-start space-x-3">
                            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-[#464B4B]/80">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Vote Type Selection */}
                  {!voteType && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-[#464B4B] mb-4">How would you like to vote?</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <button
                          onClick={() => handleVoteTypeSelect('regular')}
                          className="p-6 border-2 border-[#0072CE] rounded-xl hover:bg-blue-50 transition-all group"
                        >
                          <User className="h-8 w-8 text-[#0072CE] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                          <p className="font-bold text-[#464B4B] mb-1">Regular Vote</p>
                          <p className="text-sm text-[#464B4B]/60">Vote with your own voting power</p>
                          <div className="mt-3 text-[#0072CE] font-semibold">
                            {voteWeight.ownVote} vote{voteWeight.ownVote > 1 ? 's' : ''}
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleVoteTypeSelect('proxy')}
                          className="p-6 border-2 border-green-500 rounded-xl hover:bg-green-50 transition-all group"
                          disabled={voteWeight.proxyCount === 0}
                        >
                          <Shield className="h-8 w-8 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                          <p className="font-bold text-[#464B4B] mb-1">Proxy Vote</p>
                          <p className="text-sm text-[#464B4B]/60">Vote including all proxy votes</p>
                          <div className="mt-3 text-green-600 font-semibold">
                            {voteWeight.totalWeight} total vote{voteWeight.totalWeight > 1 ? 's' : ''}
                          </div>
                        </button>

                        {voteWeight.proxyCount > 1 && (
                          <button
                            onClick={() => handleVoteTypeSelect('split')}
                            className="p-6 border-2 border-blue-500 rounded-xl hover:bg-blue-50 transition-all group"
                          >
                            <Users className="h-8 w-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-bold text-[#464B4B] mb-1">Split Vote</p>
                            <p className="text-sm text-[#464B4B]/60">Select specific proxies to vote for this candidate</p>
                            <div className="mt-3 text-blue-600 font-semibold">
                              Choose from {voteWeight.proxyCount} proxies
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Split Vote Proxy Selection */}
                  {voteType === 'split' && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-[#464B4B] mb-4">Select Proxies to Vote With</h3>
                      <p className="text-sm text-[#464B4B]/60 mb-4">
                        Choose which proxy members you want to include in this vote for {selectedCandidate.name}
                      </p>
                      
                      <div className="space-y-3 mb-6">
                        {voteWeight.proxyAssignees.map((assignee: any) => (
                          <label
                            key={assignee.id}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedProxyIds.includes(assignee.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedProxyIds.includes(assignee.id)}
                                onChange={() => toggleProxySelection(assignee.id)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div>
                                <p className="font-semibold text-[#464B4B]">{assignee.name}</p>
                                <p className="text-xs text-[#464B4B]/60">{assignee.position}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-600">
                                {assignee.voteWeight || 1} vote{(assignee.voteWeight || 1) > 1 ? 's' : ''}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-[#464B4B]/70">Total Vote Weight:</span>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{splitVoteWeight}</p>
                            <p className="text-xs text-[#464B4B]/60">
                              Your vote (1) + {selectedProxyIds.length} selected {selectedProxyIds.length === 1 ? 'proxy' : 'proxies'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <button
                          onClick={() => {
                            setVoteType(null);
                            setSelectedProxyIds([]);
                            setSplitVoteWeight(0);
                          }}
                          disabled={isSubmitting}
                          className="flex-1 py-3 border-2 border-gray-300 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmitVote}
                          disabled={isSubmitting || selectedProxyIds.length === 0}
                          className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Casting Vote...</span>
                            </>
                          ) : (
                            <>
                              <Vote className="h-5 w-5" />
                              <span>Cast Split Vote</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Confirm Vote (Regular & Proxy) */}
                  {voteType && voteType !== 'split' && (
                    <div className="border-t pt-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center space-x-3 mb-3">
                          {voteType === 'regular' ? (
                            <User className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Shield className="h-6 w-6 text-green-600" />
                          )}
                          <h4 className="font-bold text-lg text-[#464B4B]">
                            {voteType === 'regular' ? 'Regular Vote' : 'Proxy Vote'}
                          </h4>
                        </div>
                        
                        <p className="text-[#464B4B]/80 mb-4">
                          You are voting for <strong>{selectedCandidate.name}</strong> as a{' '}
                          <strong>{voteType === 'regular' ? 'regular voter' : 'proxy holder'}</strong>.
                        </p>
                        
                        <div className="bg-white/60 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[#464B4B]/70">Vote Weight:</span>
                            <span className="text-2xl font-bold text-[#0072CE]">
                              {voteType === 'regular' ? voteWeight.ownVote : voteWeight.totalWeight}
                            </span>
                          </div>
                          
                          {voteType === 'proxy' && voteWeight.proxyCount > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-[#464B4B]/70 mb-2">Includes proxy votes from:</p>
                              <ul className="space-y-1">
                                {voteWeight.proxyAssignees.map((assignee: any) => (
                                  <li key={assignee.id} className="text-xs text-[#464B4B]/80 flex items-center">
                                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                                    {assignee.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setVoteType(null)}
                          disabled={isSubmitting}
                          className="flex-1 py-3 border-2 border-gray-300 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmitVote}
                          disabled={isSubmitting}
                          className="flex-1 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Vote className="h-5 w-5" />
                              <span>Confirm Vote</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
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
                  Your vote for <strong>{selectedCandidate?.name}</strong> has been successfully recorded.
                </p>
                <div className="bg-blue-50 rounded-xl p-4 mt-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Vote Weight: <strong className="text-xl">{voteType === 'regular' ? voteWeight.ownVote : voteType === 'split' ? splitVoteWeight : voteWeight.totalWeight}</strong>
                  </p>
                </div>
                
                {/* Blockchain Verification */}
                {blockchainReceipt && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
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

        {/* Proxy Details Modal */}
        <AnimatePresence>
          {showProxyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowProxyModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Proxy Voting Details</h2>
                  </div>
                  <button
                    onClick={() => setShowProxyModal(false)}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-green-700 mb-1">Your Vote</p>
                        <p className="text-2xl font-bold text-green-900">{voteWeight.ownVote}</p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700 mb-1">Proxy Members</p>
                        <p className="text-2xl font-bold text-green-900">{voteWeight.proxyCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700 mb-1">Total Votes</p>
                        <p className="text-2xl font-bold text-green-900">{voteWeight.totalWeight}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-[#464B4B] mb-3 flex items-center">
                      <Users className="h-5 w-5 text-green-600 mr-2" />
                      Voting on behalf of ({voteWeight.proxyCount} members):
                    </h3>
                  </div>

                  {/* Proxy Members List */}
                  <div className="space-y-3">
                    {voteWeight.proxyAssignees.map((assignee: any, index: number) => (
                      <motion.div
                        key={assignee.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {assignee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#464B4B]">{assignee.name}</p>
                              <p className="text-xs text-[#464B4B]/60">Member ID: {assignee.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-100 px-3 py-1 rounded-lg">
                              <p className="text-sm font-bold text-green-700">
                                {assignee.voteWeight} vote{assignee.voteWeight > 1 ? 's' : ''}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Proxy Voting Options:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li><strong>Regular Vote:</strong> Use only your own vote ({voteWeight.ownVote})</li>
                          <li><strong>Proxy Vote:</strong> Use all {voteWeight.proxyCount} proxies ({voteWeight.totalWeight} total)</li>
                          {voteWeight.proxyCount > 1 && (
                            <li><strong>Split Vote:</strong> Select specific proxies for this candidate</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <button
                    onClick={() => setShowProxyModal(false)}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
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
    </div>
  );
};

export default CandidateVoting;
