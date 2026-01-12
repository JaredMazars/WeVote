import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle, Vote, UserCheck, ArrowRight } from 'lucide-react';

interface CandidateSelection {
  candidateId: string;
  candidateName: string;
}

const ProxyAppointmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [appointmentType, setAppointmentType] = useState<'instructional' | 'discretionary' | ''>('');
  const [formData, setFormData] = useState({
    proxyEmail: '',
    instructionalVotes: 0,
    discretionaryVotes: 0,
    instructionalCandidates: [] as CandidateSelection[],
    startDate: '',
    endDate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Vote availability state - synced with VotingStatusBar
  const [totalAvailableVotes, setTotalAvailableVotes] = useState(20); // Match VotingStatusBar
  const [votesAlreadyAssigned] = useState(0);
  const [votesRemaining, setVotesRemaining] = useState(20);
  const [totalAllocatedVotes, setTotalAllocatedVotes] = useState(0);
  
  // Dummy candidates list
  const [availableCandidates] = useState([
    { id: '1', name: 'Sarah Johnson - Senior Auditor' },
    { id: '2', name: 'Michael Chen - Tax Consultant' },
    { id: '3', name: 'Emily Rodriguez - Financial Analyst' },
    { id: '4', name: 'David Miller - IT Manager' },
    { id: '5', name: 'Sophie Taylor - HR Director' }
  ]);

  // Sync with VotingStatusBar on mount
  useEffect(() => {
    const handleVotingStatusUpdate = (event: CustomEvent) => {
      if (event.detail?.totalVotesRemaining !== undefined) {
        const available = event.detail.totalVotesRemaining;
        setTotalAvailableVotes(available);
        setVotesRemaining(available - totalAllocatedVotes);
      }
    };

    window.addEventListener('votingStatusLoaded', handleVotingStatusUpdate as EventListener);
    window.dispatchEvent(new CustomEvent('requestVotingStatus'));

    return () => {
      window.removeEventListener('votingStatusLoaded', handleVotingStatusUpdate as EventListener);
    };
  }, [totalAllocatedVotes]);

  // Calculate votes remaining and update status bar
  useEffect(() => {
    const assignedInProxy = formData.instructionalVotes + formData.discretionaryVotes;
    const remaining = totalAvailableVotes - votesAlreadyAssigned - assignedInProxy;
    setVotesRemaining(remaining);
    setTotalAllocatedVotes(assignedInProxy);

    // Update VotingStatusBar in real-time
    window.dispatchEvent(new CustomEvent('proxyVoteAllocation', {
      detail: {
        allocated: assignedInProxy,
        remaining: remaining
      }
    }));
  }, [formData.instructionalVotes, formData.discretionaryVotes, totalAvailableVotes, votesAlreadyAssigned]);

  const handleAddInstructionalCandidate = () => {
    if (formData.instructionalCandidates.length < formData.instructionalVotes) {
      setFormData(prev => ({
        ...prev,
        instructionalCandidates: [
          ...prev.instructionalCandidates,
          { candidateId: '', candidateName: '' }
        ]
      }));
    }
  };

  const handleRemoveInstructionalCandidate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructionalCandidates: prev.instructionalCandidates.filter((_, i) => i !== index)
    }));
  };

  const handleCandidateChange = (index: number, candidateId: string) => {
    const candidate = availableCandidates.find(c => c.id === candidateId);
    if (candidate) {
      const newCandidates = [...formData.instructionalCandidates];
      newCandidates[index] = { candidateId: candidate.id, candidateName: candidate.name };
      setFormData(prev => ({ ...prev, instructionalCandidates: newCandidates }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.proxyEmail) {
      setError('Please enter a proxy email address');
      return;
    }

    if (formData.instructionalVotes === 0 && formData.discretionaryVotes === 0) {
      setError('Please assign at least one vote (instructional or discretionary)');
      return;
    }

    if (formData.instructionalVotes > 0 && formData.instructionalCandidates.length !== formData.instructionalVotes) {
      setError(`Please select exactly ${formData.instructionalVotes} candidate(s) for instructional votes`);
      return;
    }

    if (!formData.startDate) {
      setError('Please select a start date');
      return;
    }

    try {
      // API call would go here
      console.log('📊 Proxy appointment data:', formData);
      console.log(`✅ Assigned ${formData.instructionalVotes} instructional votes for specific candidates`);
      console.log(`✅ Assigned ${formData.discretionaryVotes} discretionary votes (proxy's choice)`);
      console.log(`📋 Total votes assigned: ${formData.instructionalVotes + formData.discretionaryVotes}`);
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      setError('Failed to appoint proxy. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Vote Availability Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl shadow-xl p-6 mb-6 text-white ${
            appointmentType === 'instructional' 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
              : appointmentType === 'discretionary'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-gray-500 to-slate-600'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Vote className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{votesRemaining} Votes Remaining</h3>
                <p className={appointmentType ? 'text-white/80' : 'text-white/60'}>
                  Total Available: {totalAvailableVotes} | Already Assigned: {votesAlreadyAssigned}
                </p>
              </div>
            </div>
            
            {appointmentType && (
              <div className="text-center bg-white/20 rounded-xl px-6 py-3">
                <p className="text-4xl font-bold">
                  {appointmentType === 'instructional' ? formData.instructionalVotes : formData.discretionaryVotes}
                </p>
                <p className="text-sm text-white/90 mt-1">
                  {appointmentType === 'instructional' ? '📋 Instructional Votes' : '🎯 Discretionary Votes'}
                </p>
              </div>
            )}
          </div>
          
          {!appointmentType && (
            <div className="mt-4 text-center text-white/70 text-sm">
              ⬇️ Select an appointment type below to begin
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#464B4B] mb-2">
              Appoint a Proxy
            </h2>
            <p className="text-[#464B4B]/60">
              Designate someone to vote on your behalf
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center space-x-3"
            >
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm">Proxy appointed successfully!</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appointment Type Selection */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#464B4B] mb-4 flex items-center">
                <Vote className="h-5 w-5 mr-2 text-blue-600" />
                Select Proxy Appointment Type
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentType('instructional');
                    setFormData(prev => ({ ...prev, discretionaryVotes: 0 }));
                  }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    appointmentType === 'instructional'
                      ? 'bg-blue-100 border-blue-500 shadow-lg scale-105'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-blue-900">📋 Instructional</h4>
                    {appointmentType === 'instructional' && (
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-[#464B4B]/70">
                    You choose specific candidates for the proxy to vote for
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAppointmentType('discretionary');
                    setFormData(prev => ({ ...prev, instructionalVotes: 0, instructionalCandidates: [] }));
                  }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    appointmentType === 'discretionary'
                      ? 'bg-green-100 border-green-500 shadow-lg scale-105'
                      : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-green-900">🎯 Discretionary</h4>
                    {appointmentType === 'discretionary' && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-[#464B4B]/70">
                    Proxy decides which candidates to vote for
                  </p>
                </button>
              </div>
            </div>

            {appointmentType && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#464B4B] mb-2">
                    <UserCheck className="inline h-4 w-4 mr-2" />
                    Proxy Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.proxyEmail}
                    onChange={(e) => setFormData({ ...formData, proxyEmail: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                    placeholder="Enter proxy's email"
                  />
                </div>
              </>
            )}

            {/* Instructional Votes Section - Only show if instructional selected */}
            {appointmentType === 'instructional' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  📋 Instructional Votes
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Assign votes for specific candidates. You choose who the proxy votes for.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#464B4B] mb-2">
                    Number of Instructional Votes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={votesRemaining + formData.instructionalVotes}
                    value={formData.instructionalVotes}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        instructionalVotes: value,
                        instructionalCandidates: prev.instructionalCandidates.slice(0, value)
                      }));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining votes available: {votesRemaining + formData.instructionalVotes}
                  </p>
                </div>

                {formData.instructionalVotes > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#464B4B]">
                        Select Candidates ({formData.instructionalCandidates.length}/{formData.instructionalVotes})
                      </label>
                      {formData.instructionalCandidates.length < formData.instructionalVotes && (
                        <button
                          type="button"
                          onClick={handleAddInstructionalCandidate}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Candidate
                        </button>
                      )}
                    </div>

                    {formData.instructionalCandidates.length === formData.instructionalVotes && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-700">
                          All {formData.instructionalVotes} candidates selected!
                        </p>
                      </div>
                    )}

                    {formData.instructionalCandidates.map((candidate, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1 relative">
                          <select
                            value={candidate.candidateId}
                            onChange={(e) => handleCandidateChange(index, e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors appearance-none"
                            required
                          >
                            <option value="">Select candidate #{index + 1}</option>
                            {availableCandidates
                              .filter(c => 
                                !formData.instructionalCandidates.some(
                                  (selected, i) => i !== index && selected.candidateId === c.id
                                )
                              )
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))
                            }
                          </select>
                          {candidate.candidateId && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveInstructionalCandidate(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove candidate"
                        >
                          <AlertCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Discretionary Votes Section - Only show if discretionary selected */}
            {appointmentType === 'discretionary' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-900 mb-4">
                🎯 Discretionary Votes
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Give your proxy the freedom to vote for candidates of their choice.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-[#464B4B] mb-2">
                  Number of Discretionary Votes
                </label>
                <input
                  type="number"
                  min="0"
                  max={votesRemaining + formData.discretionaryVotes}
                  value={formData.discretionaryVotes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData(prev => ({ ...prev, discretionaryVotes: value }));
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Remaining votes available: {votesRemaining + formData.discretionaryVotes}
                </p>
                
                {formData.discretionaryVotes > 0 && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700">
                      Proxy will have {formData.discretionaryVotes} vote{formData.discretionaryVotes !== 1 ? 's' : ''} to allocate at their discretion
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}

            {appointmentType && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#464B4B] mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#464B4B] mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/home')}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={votesRemaining < 0 || !appointmentType}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center space-x-2"
                  >
                    <span>Appoint Proxy</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProxyAppointmentForm;
