import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Employee } from '../utils/types';
import { ArrowLeft, Award, Calendar, Building2, Star, CheckCircle, Users, UserCheck, X, AlertTriangle, Vote, UsersRound } from 'lucide-react';

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

type ProxyVoteMode = 'split' | 'regular';

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
  const [allProxyMembers, setAllProxyMembers] = useState<ProxyGroupMember[]>([]);
  const [proxyVoteMode, setProxyVoteMode] = useState<ProxyVoteMode>('split');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedComment, setEditedComment] = useState('');
  const [editedVoteChoice, setEditedVoteChoice] = useState('');
  const [currentVoteComment, setCurrentVoteComment] = useState('');
  const [showEditSplitModal, setShowEditSplitModal] = useState(false);
  const [editingSplitMembers, setEditingSplitMembers] = useState<string[]>([]);
  const [splitEditComment, setSplitEditComment] = useState('');
  const [proxyVotedMembers, setProxyVotedMembers] = useState<string[]>([]);

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

  const checkProxyVoteStatus = async () => {
    if (!employee || !id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!user?.id) return;

    try {
      const delegatorIds = allProxyMembers.map(m => m.delegator_id).join(',');
      if (!delegatorIds) return;

      const response = await fetch(
        `http://localhost:3001/api/employees/split-vote/status?proxy_id=${user.id}&delegator_ids=${delegatorIds}&vote_type=employee&employee_id=${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        const votedIds = result.votedStatus
          .filter((status: any) => status.hasVoted)
          .map((status: any) => status.delegator_id);
        setProxyVotedMembers(votedIds);
      }
    } catch (error) {
      console.error('Error checking proxy vote status:', error);
    }
  };

  const handleEditSplitProxyVotes = async () => {
    if (!employee || editingSplitMembers.length === 0) {
      showWarning('No members selected to edit.');
      return;
    }

    setIsProxyVoting(true);
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    try {
      const response = await fetch('http://localhost:3001/api/employees/split-vote/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proxy_id: user.id,
          delegator_ids: editingSplitMembers,
          vote_type: 'employee',
          employee_id: employee.id,
          comment: splitEditComment
        }),
      });

      const result = await response.json();
      if (result.success) {
        showSuccess(`Updated ${result.successCount} vote(s)!`);
        setShowEditSplitModal(false);
        setEditingSplitMembers([]);
        setSplitEditComment('');
        checkProxyVoteStatus();
      } else {
        showWarning(result.message || 'Failed to update votes');
      }
    } catch (error: any) {
      showWarning(error.message || 'Failed to update votes');
    } finally {
      setIsProxyVoting(false);
    }
  };

  const handleRemoveSplitProxyVotes = async (memberIds: string[], memberNames: string[]) => {
  if (!employee || memberIds.length === 0) return;
  if (!window.confirm(`Remove votes for: ${memberNames.join(', ')}?`)) return;

  setIsProxyVoting(true);
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!token || !user?.id) {
    showWarning('Missing authentication. Please log in again.');
    setIsProxyVoting(false);
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/api/employees/split-vote', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        proxy_id: user.id,
        delegator_ids: memberIds,
        vote_type: 'employee',
        employee_id: employee.id,
      }),
    });

    const result = await response.json();
    if (result.success) {
      setProxyVotedMembers(prev => prev.filter(id => !memberIds.includes(id)));
      setEmployee(prev => prev ? { ...prev, votes: Math.max(0, prev.votes - result.removedCount) } : null);
      showSuccess(`Removed ${result.removedCount} vote(s)!`);
      checkProxyVoteStatus();
    } else {
      showWarning(result.message || 'Failed to remove votes');
    }
  } catch (error: any) {
    showWarning(error.message || 'Failed to remove votes');
  } finally {
    setIsProxyVoting(false);
  }
  };


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

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

        if (response.ok) {
          setEmployee(result.data);
          setHasVoted(result.data.hasVoted);
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
      if (!user?.id) return;

      try {
        const response = await fetch(`http://localhost:3001/api/proxy/proxy-form/${user.id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const result = await response.json();

        if (response.ok) {
          setProxyGroups(result.data);

          const members = result.data.flatMap((entry: any) =>
            entry.proxy_group_members.map((member: any) => ({
              id: member.id || member.member_id,
              delegator_id: member.member_id,
              delegator_name: member.full_name || member.user_name,
              delegator_email: member.membership_number || member.id_number || ''
            }))
          );

          setAllProxyMembers(members);
        }
      } catch (error) {
        console.error('Error fetching proxy groups:', error);
      }
    };

    const fetchVoteStatus = async () => {
      if (!id) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`http://localhost:3001/api/employees/${id}/vote-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();
        if (result.success && result.hasVoted) {
          setCurrentVoteComment(result.comment || '');
          setEditedComment(result.comment || '');
        }
      } catch (error) {
        console.error('Error fetching vote status:', error);
      }
    };

    if (id) {
      fetchEmployee();
      fetchProxyGroups();
      fetchVoteStatus();
    }
  }, [id]);

  useEffect(() => {
    if (allProxyMembers.length > 0) {
      checkProxyVoteStatus();
    }
  }, [allProxyMembers.length]);

  const isVotingOpenNow = (timer: any): boolean => {
    if (!timer?.active || !timer.start || !timer.end) {
      return false;
    }

    const now = new Date();
    const [startH, startM] = timer.start.split(':').map(Number);
    const [endH, endM] = timer.end.split(':').map(Number);

    const votingStart = new Date(now);
    const votingEnd = new Date(now);

    votingStart.setHours(startH, startM, 0, 0);
    votingEnd.setHours(endH, endM, 0, 0);

    return now >= votingStart && now <= votingEnd;
  };

  const handleVote = async () => {
  // Check voting session status
  let timer;
  try {
    const response = await fetch('http://localhost:3001/api/admin/agm-timer/status');
    const result = await response.json();
    timer = result.agmTimer;
  } catch (error) {
    console.error('Error fetching timer:', error);
    showWarning('Unable to check voting session. Please try again later.');
    return;
  }

  if (!timer?.active) {
    showWarning('Voting session is not active. Please wait for the voting to begin.');
    return;
  }

  if (!isVotingOpenNow(timer)) {
    showWarning('Voting period is not active.');
    return;
  }

  if (!employee) {
    showWarning('No employee selected.');
    return;
  }

  setIsVoting(true);
  const token = localStorage.getItem('token');

  if (!token) {
    showWarning('You must be logged in to vote');
    setIsVoting(false);
    return;
  }

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user?.id) {
    showWarning('Invalid authentication token');
    setIsVoting(false);
    return;
  }

  try {
    // Use the override endpoint to handle both proxy removal and direct voting
    const response = await fetch(`http://localhost:3001/api/employees/${employee.id}/vote/override`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        comment: editedComment || null
      })
    });

    const result = await response.json();

    if (result.success) {
      setHasVoted(true);
      
      // If proxy vote was removed, decrease vote count by 1, then add 1 for new vote (net: 0)
      // If no proxy vote existed, just increase by 1
      if (result.proxyVoteRemoved) {
        // Vote count stays same (removed proxy, added direct)
        setEmployee(prev => prev ? { ...prev } : null);
        showSuccess('Your proxy vote was replaced with your direct vote!');
      } else {
        // Increase vote count
        setEmployee(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
        showSuccess('Your vote has been successfully submitted!');
      }
    } else {
      showWarning(result.message || 'Failed to submit vote');
    }
  } catch (error: any) {
    console.error('Error voting:', error);
    showWarning(error.message || 'Failed to submit vote');
  } finally {
    setIsVoting(false);
  }
};


  const handleEditVote = async () => {
    if (!employee) return;

    setIsVoting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:3001/api/employees/${employee.id}/vote/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment: editedComment,
        })
      });

      const result = await response.json();

      if (result.success) {
        setCurrentVoteComment(editedComment);
        showSuccess('Your vote has been successfully updated!');
        setIsEditMode(false);
      } else {
        showWarning(result.message || 'Failed to update vote');
      }
    } catch (error: any) {
      showWarning(error.message || 'Failed to update vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!employee) return;

    if (!window.confirm('Are you sure you want to remove your vote?')) {
      return;
    }

    setIsVoting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        `http://localhost:3001/api/employees/${employee.id}/vote`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setHasVoted(false);
        setCurrentVoteComment('');
        setEditedComment('');
        setEmployee(prev => prev ? {
          ...prev,
          votes: Math.max(0, prev.votes - (result.removedCount || 1))
        } : null);
        showSuccess(`Your vote has been successfully removed!`);
      } else {
        showWarning(result.message || 'Failed to remove vote');
      }
    } catch (error: any) {
      showWarning(error.message || 'Failed to remove vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleSplitProxyVote = async () => {
  if (!employee || selectedProxyMembers.length === 0) {
    showWarning('Please select at least one member to vote on behalf of.');
    return;
  }

  setIsProxyVoting(true);
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  try {
    const selectedMemberIds = selectedProxyMembers.filter(Boolean);

    const response = await fetch('http://localhost:3001/api/employees/split-vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        proxy_id: user.id,
        delegator_ids: selectedMemberIds,
        vote_type: 'employee',
        employee_id: employee.id,
        vote_value: 'vote'
      }),
    });

    const result = await response.json();

    if (response.ok) {
      const successCount = result.successCount || selectedMemberIds.length;

      setEmployee(prev => prev ? {
        ...prev,
        votes: prev.votes + successCount
      } : null);

      showSuccess(`Successfully cast ${successCount} split proxy vote(s)!`);

      // Update voted members list
      setProxyVotedMembers(prev => [...prev, ...selectedMemberIds]);
      
      // Clear selected members
      setSelectedProxyMembers([]);
      
      // DON'T close modal - keep it open to show Edit/Remove buttons
      // setShowProxyModal(false); // REMOVED THIS LINE
      
      // Refresh status
      setTimeout(() => checkProxyVoteStatus(), 500);
    } else {
      showWarning(result.message || 'Failed to cast proxy votes');
    }

  } catch (error: any) {
    showWarning(error.message || 'Failed to cast proxy votes');
  } finally {
    setIsProxyVoting(false);
  }
};

const handleProxyVoteSubmit = () => {
  if (proxyVoteMode === 'regular') {
    // For regular mode, vote for the proxy user themselves first
    handleVote();
  } else {
    handleSplitProxyVote();
  }
};


  // const handleProxyVoteSubmit = () => {
  //   if (proxyVoteMode === 'regular') {
  //     handleVote();
  //   } else {
  //     handleSplitProxyVote();
  //   }
  // };

  const handleProxyModalOpen = () => {
    setShowProxyModal(true);
    setProxyVoteMode('split');
    setSelectedProxyMembers([]);
  };

  const handleProxyModalClose = () => {
    setShowProxyModal(false);
    setSelectedProxyMembers([]);
    setProxyVoteMode('split');
  };

  const toggleProxyMember = (memberId: string) => {
    setSelectedProxyMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

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
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className="sticky top-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/voting/employees')}
            className="flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] font-medium transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Employee Voting</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 transition-all duration-300">
          <div className="relative h-64 bg-gradient-to-r from-[#0072CE] to-[#171C8F]">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="flex items-end space-x-6">
                <img
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
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-[#464B4B] mb-4">About {employee.name}</h2>
              <p className="text-[#464B4B]/80 leading-relaxed text-lg">{employee.bio}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Award className="h-6 w-6 text-[#0072CE]" />
                <h2 className="text-2xl font-bold text-[#464B4B]">Key Achievements</h2>
              </div>
              <div className="space-y-4">
                {employee.achievements && employee.achievements.length > 0 ? (
                  employee.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-[#F4F4F4] rounded-xl"
                    >
                      <Star className="h-5 w-5 text-[#0072CE] mt-0.5 flex-shrink-0" />
                      <p className="text-[#464B4B] leading-relaxed">{achievement}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No achievements recorded yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-[#464B4B] mb-4">Core Skills</h2>
              <div className="flex flex-wrap gap-3">
                {employee.skills && employee.skills.length > 0 ? (
                  employee.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-[#0072CE]/10 to-[#171C8F]/10 text-[#0072CE] rounded-xl font-medium border border-[#0072CE]/20"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 w-full">
                    <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No skills recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-32">
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
                isEditMode ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedComment}
                      onChange={(e) => setEditedComment(e.target.value)}
                      placeholder="Edit your comment..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setIsEditMode(false);
                          setEditedComment(currentVoteComment);
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditVote}
                        disabled={isVoting}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isVoting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">✓ You have already voted</p>
                      {currentVoteComment && (
                        <p className="text-green-700 text-xs mt-1">Comment: {currentVoteComment}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditMode(true)}
                        disabled={isVoting}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                      >
                        Edit Vote
                      </button>
                      <button
                        onClick={handleRemoveVote}
                        disabled={isVoting}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <button
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
                  </button>

                  {hasProxyGroups && (
                    <button
                      onClick={handleProxyModalOpen}
                      className="w-full bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <UserCheck className="h-5 w-5 text-gray-700" />
                        <span className="text-base">Proxy Vote ({allProxyMembers.length} delegated)</span>
                      </div>
                    </button>
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
            </div>
          </div>
        </div>
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
          </div>
        </div>
      )}

      {showProxyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#464B4B]">Proxy Vote</h3>
                  <p className="text-[#464B4B]/70 mt-1">
                    Vote for {employee.name} on behalf of delegated members
                  </p>
                </div>
                <button
                  onClick={handleProxyModalClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="mt-6 flex space-x-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setProxyVoteMode('split')}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${proxyVoteMode === 'split'
                      ? 'bg-white text-[#0072CE] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Vote className="h-4 w-4" />
                  <span>Split Vote</span>
                </button>
                <button
                  onClick={() => setProxyVoteMode('regular')}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${proxyVoteMode === 'regular'
                      ? 'bg-white text-[#0072CE] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <UsersRound className="h-4 w-4" />
                  <span>Vote All</span>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {proxyVoteMode === 'split' ? (
                <>
                  <div className="mb-4">
                    <h4 className="font-semibold text-[#464B4B] mb-2">Split Vote Mode</h4>
                    <p className="text-sm text-[#464B4B]/60 mb-4">
                      Select specific members to vote on behalf of. Edit or remove existing votes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {allProxyMembers.map((member) => {
                      const hasVoted = proxyVotedMembers.includes(member.delegator_id);

                      return (
                        <div
                          key={member.delegator_id}
                          className={`p-4 border-2 rounded-xl transition-all duration-200 ${hasVoted
                              ? 'border-green-500 bg-green-50'
                              : selectedProxyMembers.includes(member.delegator_id)
                                ? 'border-[#0072CE] bg-[#0072CE]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {!hasVoted && (
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${selectedProxyMembers.includes(member.delegator_id)
                                      ? 'border-[#0072CE] bg-[#0072CE]'
                                      : 'border-gray-300'
                                    }`}
                                  onClick={() => toggleProxyMember(member.delegator_id)}
                                >
                                  {selectedProxyMembers.includes(member.delegator_id) && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                              )}

                              <div className="flex-1">
                                <p className="font-medium text-[#464B4B]">{member.delegator_name}</p>
                                <p className="text-sm text-[#464B4B]/60">{member.delegator_email}</p>
                                {hasVoted && (
                                  <p className="text-xs text-green-600 font-medium mt-1">✓ Already voted</p>
                                )}
                              </div>
                            </div>

                            {hasVoted ? (
                              <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingSplitMembers([member.delegator_id]);
                                    setSplitEditComment('');
                                    setShowEditSplitModal(true);
                                  }}
                                  disabled={isProxyVoting}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleRemoveSplitProxyVotes([member.delegator_id], [member.delegator_name])}
                                  disabled={isProxyVoting}
                                  className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <UserCheck className={`h-5 w-5 ml-3 flex-shrink-0 ${selectedProxyMembers.includes(member.delegator_id)
                                  ? 'text-[#0072CE]'
                                  : 'text-gray-400'
                                }`} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {proxyVotedMembers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        Bulk Actions for {proxyVotedMembers.length} voted member(s):
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingSplitMembers(proxyVotedMembers);
                            setSplitEditComment('');
                            setShowEditSplitModal(true);
                          }}
                          disabled={isProxyVoting}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Edit All Votes
                        </button>
                        <button
                          onClick={() => {
                            const votedMemberNames = allProxyMembers
                              .filter(m => proxyVotedMembers.includes(m.delegator_id))
                              .map(m => m.delegator_name);
                            handleRemoveSplitProxyVotes(proxyVotedMembers, votedMemberNames);
                          }}
                          disabled={isProxyVoting}
                          className="flex-1 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          Remove All Votes
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h4 className="font-semibold text-[#464B4B] mb-2">Vote All Mode</h4>
                    <p className="text-sm text-[#464B4B]/60 mb-4">
                      Cast votes on behalf of all delegated members.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {allProxyMembers.map((member) => (
                      <div
                        key={member.delegator_id}
                        className="p-4 border-2 border-[#0072CE] bg-[#0072CE]/5 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 rounded border-2 border-[#0072CE] bg-[#0072CE] flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-[#464B4B]">{member.delegator_name}</p>
                              <p className="text-sm text-[#464B4B]/60">{member.delegator_email}</p>
                            </div>
                          </div>
                          <UserCheck className="h-5 w-5 text-[#0072CE]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {allProxyMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No proxy delegations found</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#464B4B]/70">
                  {proxyVoteMode === 'split' ? (
                    <>
                      {selectedProxyMembers.filter(id => !proxyVotedMembers.includes(id)).length} of {allProxyMembers.length - proxyVotedMembers.length} available
                    </>
                  ) : (
                    <>
                      {allProxyMembers.length - proxyVotedMembers.length} members will vote
                    </>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleProxyModalClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProxyVoteSubmit}
                    disabled={
                      (proxyVoteMode === 'split' && selectedProxyMembers.filter(id => !proxyVotedMembers.includes(id)).length === 0) ||
                      (proxyVoteMode === 'regular' && allProxyMembers.length - proxyVotedMembers.length === 0) ||
                      isProxyVoting
                    }
                    className="px-6 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProxyVoting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Casting Votes...</span>
                      </div>
                    ) : (
                      <>
                        {proxyVoteMode === 'split'
                          ? `Cast ${selectedProxyMembers.filter(id => !proxyVotedMembers.includes(id)).length} Vote(s)`
                          : `Cast ${allProxyMembers.length - proxyVotedMembers.length} Vote(s)`
                        }
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditSplitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Edit Split Proxy Votes</h3>
                  <p className="text-gray-600 mt-1">Update comment for {editingSplitMembers.length} member(s)</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditSplitModal(false);
                    setEditingSplitMembers([]);
                    setSplitEditComment('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={splitEditComment}
                onChange={(e) => setSplitEditComment(e.target.value)}
                placeholder="Enter updated comment..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditSplitModal(false);
                    setEditingSplitMembers([]);
                    setSplitEditComment('');
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSplitProxyVotes}
                  disabled={isProxyVoting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProxyVoting ? 'Updating...' : `Update ${editingSplitMembers.length} Vote(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetails;
