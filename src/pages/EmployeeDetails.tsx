import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Employee } from '../utils/types';
import { ArrowLeft, Award, Calendar, Building2, Star, CheckCircle, Users, UserCheck, X, AlertTriangle } from 'lucide-react';
// import AuditService from '../services/auditService';

interface ProxyGroupMember {
  id: string;
  delegator_id: string;
  delegator_name: string;
  delegator_email: string;
  hasVoted?: boolean;
}

interface ProxyGroup {
  id: string;
  proxy_id: string;
  proxy_name: string;
  vote_type: 'employee' | 'resolution';
  employee_id?: string;
  resolution_id?: string;
  reason: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
  members: ProxyGroupMember[];
}

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [selectedProxyMembers, setSelectedProxyMembers] = useState<string[]>([]);
  const [isProxyVoting, setIsProxyVoting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // const auditService = AuditService.getInstance();

  // Dummy proxy data for testing
  const dummyProxyGroups: ProxyGroup[] = [
    {
      id: '1',
      proxy_id: 'current-user-id',
      proxy_name: 'John Doe',
      vote_type: 'employee',
      employee_id: id,
      reason: 'Vacation delegation',
      valid_from: '2025-01-01',
      valid_until: '2025-12-31',
      created_at: '2025-01-15',
      members: [
        {
          id: '1',
          delegator_id: 'bilal-123',
          delegator_name: 'Bilal Ahmed',
          delegator_email: 'bilal@company.com'
        },
        {
          id: '2',
          delegator_id: 'willem-456',
          delegator_name: 'Willem van der Berg',
          delegator_email: 'willem@company.com'
        },
        {
          id: '3',
          delegator_id: 'shane-789',
          delegator_name: 'Shane Johnson',
          delegator_email: 'shane@company.com'
        }
      ]
    }
  ];

  function decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  const showWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    console.log("login user:", user.id);



    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: any = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:3001/api/employees/${id}`, {
          headers,
        });

        const result = await response.json();
        console.log("Fetched employee:", result);
        console.log("Fetch User ID",id)


        if (response.ok) {
          setEmployee(result.data);
          setHasVoted(result.data.hasVoted);
          console.log("Has voted:", result.data.hasVoted);
        } else {
          setError(result.message || 'Failed to fetch employee');
        }
      } catch (err) {
        setError('Failed to fetch employee');
        console.error('Error fetching employee:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProxyGroups = async () => {
      try {
        // Use dummy data for now
        setProxyGroups(dummyProxyGroups);
      } catch (error) {
        console.error('Error fetching proxy groups:', error);
      }
    };

    if (id) {
      fetchEmployee();
      fetchProxyGroups();
    }
  }, [id]);

  const checkVoteStatus = async (voterId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:3001/api/votes/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voter_id: voterId,
          vote_type: 'employee',
          employee_id: id
        }),
      });

      const result = await response.json();
      return result.hasVoted || false;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  };

  const handleVote = async () => {
    if (!employee || hasVoted) {
      showWarning('You have already voted for this employee.');
      return;
    }
    
    setIsVoting(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      showWarning('You must be logged in to vote');
      setIsVoting(false);
      return;
    }

    // const decodedToken = decodeJWT(token);
    // const myId = decodedToken?.id;

    const storedUserToken = localStorage.getItem('token');

    console.log("login user:", storedUserToken);


    if (!storedUserToken) {
      showWarning('Invalid authentication token');
      setIsVoting(false);
      return;
    }

    // Double-check vote status
    const alreadyVoted = await checkVoteStatus(storedUserToken);
    if (alreadyVoted) {
      setHasVoted(true);
      showWarning('You have already voted for this employee.');
      setIsVoting(false);
      return;
    }

    try {
      const response = await apiService.voteForEmployee(employee.id);
      if (response.success) {
        setHasVoted(true);
        setEmployee(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
        showSuccess('Your vote has been successfully submitted!');
        
        // Log the vote action
        // await auditService.logAction(
        //   'votes',
        //   'INSERT',
        //   response.voteId || 'unknown',
        //   null,
        //   {
        //     voter_id: myId,
        //     vote_type: 'employee',
        //     employee_id: employee.id,
        //     vote_weight: 1
        //   },
        //   `User ${decodedToken?.name} voted for employee ${employee.name}`
        // );
      } else {
        showWarning(response.message || 'Failed to submit vote');
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      showWarning(error.message || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleProxyVote = async () => {
    if (!employee || selectedProxyMembers.length === 0) {
      showWarning('Please select at least one member to vote on behalf of.');
      return;
    }
    
    setIsProxyVoting(true);
    const token = localStorage.getItem('token');
    if (!token) {
      showWarning('You must be logged in to cast proxy votes');
      setIsProxyVoting(false);
      return;
    }

    const decodedToken = decodeJWT(token);
    const myId = decodedToken?.id;

    if (!myId) {
      showWarning('Invalid authentication token');
      setIsProxyVoting(false);
      return;
    }

    try {
      let successCount = 0;
      let failedVotes: string[] = [];

      // Check each member's vote status first
      for (const memberId of selectedProxyMembers) {
        const alreadyVoted = await checkVoteStatus(memberId);
        if (alreadyVoted) {
          const memberInfo = allProxyMembers.find(m => m.delegator_id === memberId);
          failedVotes.push(memberInfo?.delegator_name || 'Unknown member');
        }
      }

      if (failedVotes.length > 0) {
        showWarning(`The following members have already voted: ${failedVotes.join(', ')}`);
        setIsProxyVoting(false);
        return;
      }

      // Cast votes on behalf of selected proxy members
      for (const memberId of selectedProxyMembers) {
        try {
          const response = await fetch('http://localhost:3001/api/proxy/vote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              delegator_id: memberId,
              vote_type: 'employee',
              employee_id: employee.id,
              vote_value: 'vote'
            }),
          });

          const result = await response.json();
          if (response.ok) {
            successCount++;
            
            // Log each proxy vote
            const memberInfo = allProxyMembers.find(member => member.delegator_id === memberId);
            // await auditService.logAction(
            //   'votes',
            //   'INSERT',
            //   result.voteId || 'unknown',
            //   null,
            //   {
            //     voter_id: memberId,
            //     proxy_id: myId,
            //     vote_type: 'employee',
            //     employee_id: employee.id,
            //     vote_weight: 1
            //   },
            //   `${decodedToken?.name} cast proxy vote for ${memberInfo?.delegator_name} on employee ${employee.name}`
            // );
          } else {
            const memberInfo = allProxyMembers.find(m => m.delegator_id === memberId);
            failedVotes.push(memberInfo?.delegator_name || 'Unknown member');
          }
        } catch (error) {
          const memberInfo = allProxyMembers.find(m => m.delegator_id === memberId);
          failedVotes.push(memberInfo?.delegator_name || 'Unknown member');
        }
      }

      // Update local state with successful votes
      if (successCount > 0) {
        setEmployee(prev => prev ? { 
          ...prev, 
          votes: prev.votes + successCount 
        } : null);
        
        showSuccess(`Successfully cast ${successCount} proxy vote${successCount !== 1 ? 's' : ''}!`);
      }

      if (failedVotes.length > 0) {
        showWarning(`Failed to cast votes for: ${failedVotes.join(', ')}`);
      }
      
      setShowProxyModal(false);
      setSelectedProxyMembers([]);
      
    } catch (error: any) {
      console.error('Error casting proxy votes:', error);
      showWarning(error.message || 'Failed to cast proxy votes');
    } finally {
      setIsProxyVoting(false);
    }
  };

  const toggleProxyMember = (memberId: string) => {
    setSelectedProxyMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const allProxyMembers = proxyGroups.flatMap(group => group.members);
  const hasProxyGroups = proxyGroups.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0072CE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#464B4B] mb-4">{error || 'Employee not found'}</h2>
          <button
            onClick={() => navigate('/voting/employees')}
            className="text-[#0072CE] hover:text-[#171C8F]"
          >
            Back to Employee Voting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate('/voting/employees')}
            className="flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Employee Voting</span>
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8"
        >
          <div className="relative h-64 bg-gradient-to-r from-[#0072CE] to-[#171C8F]">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="flex items-end space-x-6">
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  src={employee.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
                  alt={employee.name}
                  className="w-24 h-24 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
                <div className="text-white pb-2">
                  <h1 className="text-3xl font-bold mb-1">{employee.name}</h1>
                  <p className="text-blue-100 text-lg">{employee.position}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">{employee.department}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{employee.yearsOfService} years</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right text-white pb-2">
                <div className="text-2xl font-bold">{employee.votes}</div>
                <div className="text-blue-100 text-sm">votes</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-[#464B4B] mb-4">About {employee.name}</h2>
              <p className="text-[#464B4B]/80 leading-relaxed text-lg">{employee.bio}</p>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Award className="h-6 w-6 text-[#0072CE]" />
                <h2 className="text-2xl font-bold text-[#464B4B]">Key Achievements</h2>
              </div>
              <div className="space-y-4">
                {employee.achievements && employee.achievements.length > 0 ? (
                  employee.achievements.map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start space-x-3 p-4 bg-[#F4F4F4] rounded-xl"
                    >
                      <Star className="h-5 w-5 text-[#0072CE] mt-0.5 flex-shrink-0" />
                      <p className="text-[#464B4B] leading-relaxed">{achievement}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No achievements recorded yet</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-[#464B4B] mb-4">Core Skills</h2>
              <div className="flex flex-wrap gap-3">
                {employee.skills && employee.skills.length > 0 ? (
                  employee.skills.map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="px-4 py-2 bg-gradient-to-r from-[#0072CE]/10 to-[#171C8F]/10 text-[#0072CE] rounded-xl font-medium border border-[#0072CE]/20"
                    >
                      {skill}
                    </motion.span>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 w-full">
                    <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No skills recorded yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vote Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-32"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#464B4B] mb-2">
                  Vote for {employee.name}
                </h3>
                <p className="text-[#464B4B]/70 text-sm">
                  Show your support for outstanding work and leadership
                </p>
              </div>

              {hasVoted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-4"
                >
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-600 font-semibold mb-2">Vote Submitted!</p>
                  <p className="text-sm text-[#464B4B]/70">Thank you for participating</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {/* Regular Vote Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVote}
                    disabled={isVoting}
                    className="w-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                  >
                    {isVoting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Vote...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Award className="h-5 w-5" />
                        <span>Vote for {employee.name}</span>
                      </div>
                    )}
                  </motion.button>

                  {/* Proxy Vote Button */}
                  {hasProxyGroups && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowProxyModal(true)}
                      className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <UserCheck className="h-5 w-5" />
                        <span>Proxy Vote ({allProxyMembers.length} delegated)</span>
                      </div>
                    </motion.button>
                  )}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#464B4B]/60">Current votes</span>
                  <span className="font-semibold text-[#464B4B]">{employee.votes}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((employee.votes / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-[#464B4B] mb-2">Warning</h3>
                <p className="text-[#464B4B]/70 mb-6">{warningMessage}</p>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proxy Vote Modal */}
      <AnimatePresence>
        {showProxyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[#464B4B]">Proxy Vote</h3>
                    <p className="text-[#464B4B]/70 mt-1">
                      Vote for {employee.name} on behalf of delegated members
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProxyModal(false);
                      setSelectedProxyMembers([]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="mb-4">
                  <h4 className="font-semibold text-[#464B4B] mb-3">
                    Select members to vote on behalf of:
                  </h4>
                  <p className="text-sm text-[#464B4B]/60 mb-4">
                    You have been delegated voting authority for the following members:
                  </p>
                </div>

                <div className="space-y-3">
                  {allProxyMembers.map((member) => (
                    <motion.div
                      key={member.delegator_id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedProxyMembers.includes(member.delegator_id)
                          ? 'border-[#0072CE] bg-[#0072CE]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleProxyMember(member.delegator_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedProxyMembers.includes(member.delegator_id)
                              ? 'border-[#0072CE] bg-[#0072CE]'
                              : 'border-gray-300'
                          }`}>
                            {selectedProxyMembers.includes(member.delegator_id) && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#464B4B]">{member.delegator_name}</p>
                            <p className="text-sm text-[#464B4B]/60">{member.delegator_email}</p>
                          </div>
                        </div>
                        <UserCheck className={`h-5 w-5 ${
                          selectedProxyMembers.includes(member.delegator_id)
                            ? 'text-[#0072CE]'
                            : 'text-gray-400'
                        }`} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {allProxyMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No proxy delegations found for this employee</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#464B4B]/70">
                    {selectedProxyMembers.length} of {allProxyMembers.length} members selected
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowProxyModal(false);
                        setSelectedProxyMembers([]);
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProxyVote}
                      disabled={selectedProxyMembers.length === 0 || isProxyVoting}
                      className="px-6 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProxyVoting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Casting Votes...</span>
                        </div>
                      ) : (
                        `Cast ${selectedProxyMembers.length} Proxy Vote${selectedProxyMembers.length !== 1 ? 's' : ''}`
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeDetails;