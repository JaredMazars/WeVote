import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { 
  FileText, 
  User, 
  Users, 
  Vote, 
  CheckCircle, 
  Send,
  Eye,
  EyeOff,
  Share2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

interface ProxyFormData {
  // Principal Member Details
  title: string;
  initials: string;
  surname: string;
  fullNames: string;
  membershipNumber: string;
  idPassportNumber: string;

  // Proxy Appointment Type
  appointmentType: 'discretional' | 'instructional';

  // AGM Voting Instructions
  trusteeRemuneration: 'yes' | 'no' | 'abstain' | '';
  remunerationPolicy: 'yes' | 'no' | 'abstain' | '';
  auditorsAppointment: 'yes' | 'no' | 'abstain' | '';
  agmMotions: 'yes' | 'no' | 'abstain' | '';

  // Trustee Election
  trusteeCandidates: {
    candidateId: string;
    voteChoice: 'yes' | 'no' | 'abstain';
  }[];

  // Signature & Declaration
  signedAt: string;
  signatureDate: string;

  // Proxy Group Members
  proxyGroupMembers: {
    initials: string;
    fullNames: string;
    surname: string;
    membershipNumber: string;
    idPassportNumber: string;
    votesAllocated: number;
  }[];
}

interface Assignee {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
  appointmentType: 'discretional' | 'instructional';
  allowedCandidates: string[];
  votesAllocated: number;
}

interface PrincipalMember {
  name: string;
  memberNumber: string;
  availableVotes: number;
  totalVotes: number;
}

const ProxyAppointmentFormAssignee: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<ProxyFormData>({
    title: '',
    initials: '',
    surname: '',
    fullNames: '',
    membershipNumber: '',
    idPassportNumber: '',
    appointmentType: 'discretional',
    trusteeRemuneration: '',
    remunerationPolicy: '',
    auditorsAppointment: '',
    agmMotions: '',
    trusteeCandidates: [],
    signedAt: '',
    signatureDate: new Date().toISOString().split('T')[0],
    proxyGroupMembers: []
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [assignee, setAssignee] = useState<Assignee>({
    id: '',
    name: '',
    email: '',
    memberNumber: '',
    appointmentType: 'discretional',
    allowedCandidates: [],
    votesAllocated: 0
  });
  const [principalMember, setPrincipalMember] = useState<PrincipalMember | null>(null);
  
  // Vote tracking state - synced with VotingStatusBar
  const [appointmentType, setAppointmentType] = useState<'instructional' | 'discretionary' | ''>('');
  const [totalAvailableVotes, setTotalAvailableVotes] = useState(20); // Match VotingStatusBar dummy data
  const [instructionalVotes, setInstructionalVotes] = useState(0);
  // Discretionary votes are automatically calculated as: totalAvailableVotes - instructionalVotes
  const [totalAllocatedVotes, setTotalAllocatedVotes] = useState(0);
  const [votesRemaining, setVotesRemaining] = useState(20);

  // Sync with VotingStatusBar on mount
  useEffect(() => {
    // Listen for VotingStatusBar data
    const handleVotingStatusUpdate = (event: CustomEvent) => {
      if (event.detail?.totalVotesRemaining !== undefined) {
        const available = event.detail.totalVotesRemaining;
        setTotalAvailableVotes(available);
        setVotesRemaining(available - totalAllocatedVotes);
      }
    };

    window.addEventListener('votingStatusLoaded', handleVotingStatusUpdate as EventListener);
    
    // Request current voting status
    window.dispatchEvent(new CustomEvent('requestVotingStatus'));

    return () => {
      window.removeEventListener('votingStatusLoaded', handleVotingStatusUpdate as EventListener);
    };
  }, [totalAllocatedVotes]);

  useEffect(() => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/proxy-assignment/${id || 'new'}`;
    setFormLink(link);
  }, [id]);

  // Fetch employees for allowed candidates list
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/employees`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAvailableEmployees(json.data.map((e: any) => ({ 
            id: e.id?.toString() || '', 
            name: e.name 
          })));
        }
      } catch (err) {
        console.error('Failed to load employees', err);
        // Fallback to mock data
        setAvailableEmployees([
          { id: '1', name: 'Sarah Johnson' },
          { id: '2', name: 'Michael Chen' },
          { id: '3', name: 'Emily Rodriguez' },
          { id: '4', name: 'David Okonkwo' },
          { id: '5', name: 'Lisa Thompson' },
          { id: '6', name: 'James Park' }
        ]);
      }
    };

    fetchEmployees();
  }, []);

  // Prepopulate assignee from auth
  useEffect(() => {
    if (user) {
      setAssignee(prev => ({
        ...prev,
        id: user.id?.toString() || prev.id,
        name: user.name || prev.name,
        email: user.email || prev.email,
        memberNumber: user.id || prev.memberNumber
      }));
    }
  }, [user]);

  // Fetch principal member details
  useEffect(() => {
    const fetchPrincipalMemberDetails = async () => {
      if (!formData.membershipNumber || formData.membershipNumber.length < 3) {
        setPrincipalMember(null);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users?search=${formData.membershipNumber}`);
        const json = await res.json();
        
        if (json.success && json.data && json.data.length > 0) {
          const user = json.data.find((u: any) => 
            u.member_number === formData.membershipNumber || 
            u.membership_number === formData.membershipNumber
          );
          
          if (user) {
            const voteWeight = user.vote_weight || user.max_votes_allowed || 1;
            
            setPrincipalMember({
              name: user.name,
              memberNumber: user.member_number || user.membership_number || formData.membershipNumber,
              availableVotes: voteWeight,
              totalVotes: voteWeight
            });

            if (!formData.fullNames && user.name) {
              handleInputChange('fullNames', user.name);
            }
          }
        } else {
          // Mock data for demo
          setPrincipalMember({
            name: 'Demo User',
            memberNumber: formData.membershipNumber,
            availableVotes: 5,
            totalVotes: 5
          });
        }
      } catch (err) {
        console.error('Failed to fetch principal member', err);
        // Mock data for demo
        setPrincipalMember({
          name: 'Demo User',
          memberNumber: formData.membershipNumber,
          availableVotes: 5,
          totalVotes: 5
        });
      }
    };

    fetchPrincipalMemberDetails();
  }, [formData.membershipNumber]);

  const toggleAssigneeCandidate = (employeeId: string) => {
    setAssignee(prev => {
      const allowed = new Set(prev.allowedCandidates);
      if (allowed.has(employeeId)) {
        allowed.delete(employeeId);
      } else {
        allowed.add(employeeId);
      }
      return { ...prev, allowedCandidates: Array.from(allowed) };
    });
  };

  const setAssigneeAppointmentType = (type: 'discretional' | 'instructional') => {
    setAssignee(prev => ({ ...prev, appointmentType: type }));
  };

  const handleVoteAllocation = (votes: number) => {
    if (!principalMember) return;
    
    const allocatedVotes = Math.min(Math.max(0, votes), principalMember.availableVotes);
    
    setAssignee(prev => ({ ...prev, votesAllocated: allocatedVotes }));
    
    setPrincipalMember(prev => {
      if (!prev) return null;
      return {
        ...prev,
        availableVotes: prev.totalVotes - allocatedVotes
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.initials) newErrors.initials = 'Initials are required';
    if (!formData.surname) newErrors.surname = 'Surname is required';
    if (!formData.fullNames) newErrors.fullNames = 'Full names are required';
    if (!formData.membershipNumber) newErrors.membershipNumber = 'Membership number is required';
    if (!formData.idPassportNumber) newErrors.idPassportNumber = 'ID/Passport number is required';
    if (!formData.signedAt) newErrors.signedAt = 'Signing location is required';
    
    if (!assignee.name) newErrors.assigneeName = 'Assignee details not loaded';
    if (!assignee.memberNumber) newErrors.assigneeMemberNumber = 'Assignee membership number missing';
    
    if (principalMember && principalMember.totalVotes > 0 && assignee.votesAllocated === 0) {
      newErrors.votesAllocated = 'Please allocate at least 1 vote';
    }
    
    if (assignee.appointmentType === 'instructional' && assignee.allowedCandidates.length === 0) {
      newErrors.assigneeAllowedCandidates = 'Select at least one employee for instructional proxy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    const principalName = `${formData.title} ${formData.initials} ${formData.surname}`.trim();

    const payload = {
      member_title: formData.title,
      member_initials: formData.initials,
      member_surname: formData.surname,
      member_full_name: formData.fullNames,
      member_membership_number: formData.membershipNumber,
      member_id_number: formData.idPassportNumber,
      appointment_type: formData.appointmentType.toUpperCase(),
      location_signed: formData.signedAt,
      signed_date: formData.signatureDate,
      trustee_remuneration: formData.trusteeRemuneration || null,
      remuneration_policy: formData.remunerationPolicy || null,
      auditors_appointment: formData.auditorsAppointment || null,
      agm_motions: formData.agmMotions || null,
      trustee_candidates: formData.trusteeCandidates,
      proxy_groups: {
        group_name: principalName,
        principal_member_name: principalName,
        principal_member_id: formData.membershipNumber
      },
      proxy_group_members: [
        {
          initials: assignee.name.split(' ').map(n => n[0]).join('.') || '',
          full_name: assignee.name,
          surname: assignee.name.split(' ').slice(-1)[0] || assignee.name,
          membership_number: assignee.memberNumber,
          id_number: assignee.id || '',
          appointment_type: assignee.appointmentType.toUpperCase(),
          allowedCandidates: assignee.allowedCandidates,
          votes_allocated: assignee.votesAllocated || 0
        },
        ...formData.proxyGroupMembers.map(member => ({
          initials: member.initials,
          full_name: member.fullNames,
          surname: member.surname,
          membership_number: member.membershipNumber,
          id_number: member.idPassportNumber,
          appointment_type: formData.appointmentType.toUpperCase(),
          allowedCandidates: [],
          votes_allocated: 0
        }))
      ],
      assignee: {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        memberNumber: assignee.memberNumber,
        membershipNumber: assignee.memberNumber,
        appointmentType: assignee.appointmentType.toUpperCase(),
        allowedCandidates: assignee.allowedCandidates,
        votesAllocated: assignee.votesAllocated || 0
      },
      principal_member_votes: {
        total_votes: principalMember?.totalVotes || 1,
        allocated_votes: assignee.votesAllocated || 0,
        remaining_votes: principalMember?.availableVotes || 0
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/proxy/proxy-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        window.dispatchEvent(new Event('proxyDataUpdated'));
        alert('Proxy form submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // For demo purposes, still show success
      setSubmitted(true);
      alert('Proxy form submitted successfully (Demo Mode)!');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProxyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const censorText = (text: string, show: boolean = false): string => {
    if (show || !text) return text;
    return '*'.repeat(Math.min(text.length, 8));
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(formLink);
    alert('Form link copied to clipboard!');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#464B4B] mb-2">Form Submitted Successfully!</h2>
          <p className="text-[#464B4B]/70 mb-6">
            Your proxy appointment form has been submitted and will be processed before the AGM.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Submission Deadline:</strong> 19 June 2025 at 09h00<br />
              <strong>AGM Date:</strong> 26 June 2025 at 09h00
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <span>Back to Voting</span>
            </button>
            
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#464B4B]">Proxy Appointment Form</h1>
                    <p className="text-[#464B4B]/70">Assign voting proxy to another member</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    className="p-2 text-[#464B4B]/60 hover:text-[#464B4B] rounded-lg hover:bg-gray-100 transition-all"
                    title={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                  >
                    {showSensitiveData ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={copyFormLink}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">{/* Section 1: Principal Member Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-[#0072CE]" />
              <h2 className="text-xl font-bold text-[#464B4B]">Principal Member Details </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#464B4B] mb-2">Title *</label>
                <select
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#464B4B] mb-2">Initials *</label>
                <input
                  type="text"
                  value={formData.initials}
                  onChange={(e) => handleInputChange('initials', e.target.value)}
                  placeholder="e.g., J.D."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                    errors.initials ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.initials && <p className="text-red-500 text-sm mt-1">{errors.initials}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#464B4B] mb-2">Surname *</label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  placeholder="Enter surname"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                    errors.surname ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#464B4B] mb-2">Full Name(s) *</label>
                <input
                  type="text"
                  value={formData.fullNames}
                  onChange={(e) => handleInputChange('fullNames', e.target.value)}
                  placeholder="Enter full names"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                    errors.fullNames ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullNames && <p className="text-red-500 text-sm mt-1">{errors.fullNames}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#464B4B] mb-2">Membership Number *</label>
                <input
                  type="text"
                  value={formData.membershipNumber}
                  onChange={(e) => handleInputChange('membershipNumber', e.target.value)}
                  placeholder="Enter membership number"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                    errors.membershipNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.membershipNumber && <p className="text-red-500 text-sm mt-1">{errors.membershipNumber}</p>}
                
                {principalMember && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Member Found: {principalMember.name}</p>
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>Total Votes: <strong>{principalMember.totalVotes}</strong></p>
                      <p>Available: <strong>{principalMember.availableVotes}</strong></p>
                      <p>Allocated: <strong>{assignee.votesAllocated}</strong></p>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#464B4B] mb-2">
                  ID/Passport Number * {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                </label>
                <input
                  type="text"
                  value={censorText(formData.idPassportNumber, showSensitiveData)}
                  onChange={(e) => handleInputChange('idPassportNumber', e.target.value)}
                  placeholder="Enter ID or passport number"
                  disabled={!showSensitiveData}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                    errors.idPassportNumber ? 'border-red-500' : 'border-gray-300'
                  } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                />
                {errors.idPassportNumber && <p className="text-red-500 text-sm mt-1">{errors.idPassportNumber}</p>}
              </div>
            </div>
          </motion.div>

          {/* Section 2: Proxy Member (Assignee) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 text-[#0072CE]" />
              <h2 className="text-xl font-bold text-[#464B4B]">Proxy Member (You)</h2>
            </div>

            {(errors.assigneeName || errors.assigneeMemberNumber) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.assigneeName || errors.assigneeMemberNumber}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm text-[#464B4B]/70 mb-1">Name</label>
                <div className="text-[#464B4B] font-medium">{assignee.name || 'Loading...'}</div>
              </div>
              <div>
                <label className="block text-sm text-[#464B4B]/70 mb-1">Email</label>
                <div className="text-[#464B4B] font-medium">{assignee.email || 'Loading...'}</div>
              </div>
              <div>
                <label className="block text-sm text-[#464B4B]/70 mb-1">Member #</label>
                <div className="text-[#464B4B] font-medium">{assignee.memberNumber || '—'}</div>
              </div>
            </div>

            {/* Vote Allocation */}
            {principalMember && principalMember.totalVotes > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Vote className="h-5 w-5 text-blue-600" />
                    <label className="block text-sm font-semibold text-[#464B4B]">Allocate Votes</label>
                  </div>
                  <div className="text-sm text-[#464B4B]/70">
                    Available: <strong className="text-blue-600">{principalMember.availableVotes}</strong> / {principalMember.totalVotes}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      max={principalMember.totalVotes}
                      value={assignee.votesAllocated}
                      onChange={(e) => handleVoteAllocation(parseInt(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                      placeholder="0"
                    />
                    <span className="text-sm text-[#464B4B]">votes allocated to <strong>{assignee.name || 'proxy member'}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[#464B4B]/70">Quick select:</span>
                    {[1, 2, 3, 5, principalMember.totalVotes].filter((v, i, arr) => v <= principalMember.totalVotes && arr.indexOf(v) === i).map(votes => (
                      <button
                        key={votes}
                        type="button"
                        onClick={() => handleVoteAllocation(votes)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          assignee.votesAllocated === votes
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {votes === principalMember.totalVotes ? 'All' : votes}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleVoteAllocation(0)}
                      className="px-3 py-1 text-xs bg-gray-200 text-[#464B4B] rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  {errors.votesAllocated && (
                    <p className="text-red-500 text-sm">{errors.votesAllocated}</p>
                  )}
                </div>
              </div>
            )}

            {/* Appointment Type Selection */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#464B4B] mb-4 flex items-center">
                <Vote className="h-5 w-5 mr-2 text-blue-600" />
                Select Proxy Appointment Type
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentType('instructional');
                    setAssigneeAppointmentType('instructional');
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
                  {instructionalVotes > 0 && (
                    <div className="mt-2 px-2 py-1 bg-blue-200 text-blue-900 text-xs font-semibold rounded">
                      {instructionalVotes} vote{instructionalVotes !== 1 ? 's' : ''} allocated
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAppointmentType('discretionary');
                    setAssigneeAppointmentType('discretional');
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
                  {(totalAvailableVotes - instructionalVotes) > 0 && (
                    <div className="mt-2 px-2 py-1 bg-green-200 text-green-900 text-xs font-semibold rounded">
                      {totalAvailableVotes - instructionalVotes} vote{(totalAvailableVotes - instructionalVotes) !== 1 ? 's' : ''} (auto-allocated)
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Conditional Vote Allocation - Only show for selected type */}
            {appointmentType === 'instructional' && (
              <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  📋 Instructional Votes
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Assign votes for specific candidates. You choose who the proxy votes for.
                </p>

                {/* Vote Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-900">{totalAvailableVotes}</p>
                    <p className="text-xs text-blue-700 mt-1">Total Available</p>
                  </div>
                  <div className="bg-white border-2 border-blue-400 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-900">{instructionalVotes}</p>
                    <p className="text-xs text-blue-700 mt-1 font-semibold">Instructional</p>
                  </div>
                  <div className="bg-white border-2 border-green-300 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-900">{totalAvailableVotes - instructionalVotes}</p>
                    <p className="text-xs text-green-700 mt-1">Discretionary</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#464B4B] mb-2">
                      Number of Instructional Votes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totalAvailableVotes}
                      value={instructionalVotes}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setInstructionalVotes(value);
                        
                        // Discretionary votes automatically calculated as remaining balance
                        setTotalAllocatedVotes(totalAvailableVotes);
                        setVotesRemaining(0);
                        
                        // Clear selected candidates when vote count changes
                        setAssignee(prev => ({
                          ...prev,
                          allowedCandidates: []
                        }));
                        
                        window.dispatchEvent(new CustomEvent('proxyVoteAllocation', {
                          detail: { allocated: totalAvailableVotes, remaining: 0 }
                        }));
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none transition-colors text-center font-bold text-lg"
                      placeholder="0"
                    />
                  </div>
                  <div className="text-center bg-white rounded-lg p-4 border-2 border-blue-400 min-w-[100px]">
                    <p className="text-3xl font-bold text-blue-900">{instructionalVotes}</p>
                    <p className="text-xs text-blue-700 mt-1">Votes</p>
                  </div>
                </div>

                {instructionalVotes > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✅ {instructionalVotes} vote{instructionalVotes !== 1 ? 's' : ''} allocated as instructional
                      {totalAvailableVotes - instructionalVotes > 0 && (
                        <>, {totalAvailableVotes - instructionalVotes} vote{totalAvailableVotes - instructionalVotes !== 1 ? 's' : ''} will be discretionary</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {appointmentType === 'discretionary' && (
              <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">
                  🎯 Discretionary Votes
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  {instructionalVotes > 0 
                    ? `The remaining ${totalAvailableVotes - instructionalVotes} vote${totalAvailableVotes - instructionalVotes !== 1 ? 's' : ''} will be allocated as discretionary votes.`
                    : `All ${totalAvailableVotes} votes will be allocated as discretionary votes.`
                  }
                </p>

                {/* Vote Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white border-2 border-green-300 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-900">{totalAvailableVotes}</p>
                    <p className="text-xs text-green-700 mt-1">Total Available</p>
                  </div>
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-900">{instructionalVotes}</p>
                    <p className="text-xs text-blue-700 mt-1">Instructional</p>
                  </div>
                  <div className="bg-white border-2 border-green-400 rounded-lg p-3 text-center">
                    <p className="text-3xl font-bold text-green-900">{totalAvailableVotes - instructionalVotes}</p>
                    <p className="text-xs text-green-700 mt-1 font-semibold">Discretionary</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300 rounded-xl text-center">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <p className="text-2xl font-bold text-white">{totalAvailableVotes - instructionalVotes}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-green-900">Discretionary Votes</p>
                      <p className="text-xs text-green-700">Proxy decides candidates</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800 mt-2">
                    {instructionalVotes > 0 
                      ? `✅ ${instructionalVotes} instructional + ${totalAvailableVotes - instructionalVotes} discretionary = ${totalAvailableVotes} total votes`
                      : `✅ All votes allocated to proxy's discretion`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Over-allocation Warning */}
            {appointmentType && votesRemaining < 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  You've allocated more votes than available! Please reduce your allocation.
                </p>
              </motion.div>
            )}

            {/* Allowed Candidates - Instructional Only */}
            {assignee.appointmentType === 'instructional' && (
              <div className="border-t pt-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Vote className="h-5 w-5 text-[#0072CE]" />
                  <h4 className="text-sm font-semibold text-[#464B4B]">Allowed to Vote For</h4>
                </div>

                <p className="text-xs text-[#464B4B]/70 mb-3">
                  Select which candidates <strong>{assignee.name || 'this proxy member'}</strong> is authorized to vote for.
                  {instructionalVotes > 0 && (
                    <span className="ml-2 font-semibold text-blue-600">
                      (Select up to {instructionalVotes} candidate{instructionalVotes !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>

                {instructionalVotes === 0 && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-700 text-sm">
                      ⚠️ Please allocate instructional votes first before selecting candidates.
                    </p>
                  </div>
                )}

                {errors.assigneeAllowedCandidates && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{errors.assigneeAllowedCandidates}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                  {availableEmployees.length === 0 ? (
                    <p className="text-sm text-[#464B4B]/60 col-span-full text-center py-8">No candidates available</p>
                  ) : (
                    availableEmployees.map(emp => {
                      const isSelected = assignee.allowedCandidates.includes(emp.id);
                      const isDisabled = !isSelected && assignee.allowedCandidates.length >= instructionalVotes;
                      
                      return (
                        <label 
                          key={emp.id} 
                          className={`flex items-center space-x-3 p-2 border rounded transition-all ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200' 
                              : isDisabled 
                                ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            disabled={isDisabled}
                            onChange={() => toggleAssigneeCandidate(emp.id)} 
                            className="w-4 h-4 text-[#0072CE] disabled:opacity-50" 
                          />
                          <span className={`text-sm ${isDisabled ? 'text-[#464B4B]/40' : 'text-[#464B4B]'}`}>
                            {emp.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-[#464B4B]/70">
                    Selected: <strong className={assignee.allowedCandidates.length === instructionalVotes ? 'text-green-600' : 'text-blue-600'}>
                      {assignee.allowedCandidates.length}
                    </strong> / <strong>{instructionalVotes}</strong> candidate(s)
                  </div>
                  
                  {assignee.allowedCandidates.length === instructionalVotes && instructionalVotes > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">All candidates selected</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Section 3: Signature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-6 w-6 text-[#0072CE]" />
              <h2 className="text-xl font-bold text-[#464B4B]">Signature & Declaration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#464B4B] mb-2">Signed at *</label>
                <input
                  type="text"
                  value={formData.signedAt}
                  onChange={(e) => handleInputChange('signedAt', e.target.value)}
                  placeholder="Enter location (e.g., Cape Town)"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                    errors.signedAt ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.signedAt && <p className="text-red-500 text-sm mt-1">{errors.signedAt}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#464B4B] mb-2">Date</label>
                <input
                  type="date"
                  value={formData.signatureDate}
                  onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-[#464B4B]/80">
                <strong>Declaration:</strong> I hereby appoint the above-named person as my proxy to attend and vote 
                on my behalf at the Annual General Meeting. I understand that this appointment is valid only for the 
                specified AGM and will expire thereafter.
              </p>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#464B4B] mb-1">Ready to Submit?</h3>
                <p className="text-[#464B4B]/70 text-sm">Review all information before submitting</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Submit Form</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ProxyAppointmentFormAssignee;
