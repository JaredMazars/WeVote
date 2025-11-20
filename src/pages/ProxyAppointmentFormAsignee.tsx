import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
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
  Trash2
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

  // Proxy Group Members (replaces single proxy holder)
  proxyGroupMembers: {
    initials: string;
    fullNames: string;
    surname: string;
    membershipNumber: string;
    idPassportNumber: string;
  }[];
}

interface ProxyFormProps {
  formId?: string;
  isPreview?: boolean;
}

const ProxyAppointmentFormAsignee: React.FC<ProxyFormProps> = ({ formId, isPreview = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProxyFormData>({
    // Principal Member Details
    title: '',
    initials: '',
    surname: '',
    fullNames: '',
    membershipNumber: '',
    idPassportNumber: '',

    // Proxy Appointment Type
    appointmentType: 'discretional',

    // AGM Voting Instructions
    trusteeRemuneration: '',
    remunerationPolicy: '',
    auditorsAppointment: '',
    agmMotions: '',

    // Trustee Election (dynamic list)
    trusteeCandidates: [],

    // Signature & Declaration
    signedAt: '',
    signatureDate: new Date().toISOString().split('T')[0],

    // Proxy Group Members
    proxyGroupMembers: [{
      initials: '',
      fullNames: '',
      surname: '',
      membershipNumber: '',
      idPassportNumber: ''
    }]
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [formLink, setFormLink] = useState('');

  // New state: sensitive toggle, employees list, and assignee (current logged-in user)
  const [availableEmployees, setAvailableEmployees] = React.useState<Array<{ id: string; name: string }>>([]);
  const [assignee, setAssignee] = React.useState<{ id: string; name: string; email: string; memberNumber: string; appointmentType: 'discretional' | 'instructional'; allowedCandidates: string[]; votesAllocated: number }>(
    { id: '', name: '', email: '', memberNumber: '', appointmentType: 'discretional', allowedCandidates: [], votesAllocated: 0 }
  );
  const [principalMember, setPrincipalMember] = React.useState<{ name: string; memberNumber: string; availableVotes: number; totalVotes: number } | null>(null);

  //   const { user, logout } = useAuth();
  
  const currentFormId = formId || id;

  useEffect(() => {
    if (currentFormId && !isPreview) {
      // Load existing form data if editing
      // loadFormData(currentFormId);
    }
    
    // Generate shareable link
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/proxy-form/${currentFormId || 'new'}`;
    setFormLink(link);
  }, [currentFormId, isPreview]);

  // Fetch employees for the allowed candidates list
  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/employees`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAvailableEmployees(json.data.map((e: any) => ({ id: e.id?.toString() || '', name: e.name })));
        }
      } catch (err) {
        console.error('Failed to load employees for assignee form', err);
        setAvailableEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  // Try to prepopulate assignee from auth/verify
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        // Best-effort: different backends return user in different shapes
        const user = json.user || json.data || json;
        console.log("this is the user:", user);
        if (user) {
          setAssignee(prev => ({
            ...prev,
            id: user.id?.toString() || prev.id,
            name: user.name || prev.name,
            email: user.email || prev.email,
            memberNumber: user.member_number || user.memberNumber || prev.memberNumber
          }));
        }
      } catch (err) {
        console.error('Failed to fetch current user for assignee form', err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch principal member details when membership number is entered
  React.useEffect(() => {
    const fetchPrincipalMemberDetails = async () => {
      if (!formData.membershipNumber || formData.membershipNumber.length < 3) {
        setPrincipalMember(null);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users?search=${formData.membershipNumber}`);
        const json = await res.json();
        
        if (json.success && json.data && json.data.length > 0) {
          // Find user by exact membership number match
          const user = json.data.find((u: any) => 
            u.member_number === formData.membershipNumber || 
            u.membership_number === formData.membershipNumber
          );
          
          if (user) {
            // Get user's vote weight and calculate available votes
            const voteWeight = user.vote_weight || user.max_votes_allowed || 1;
            
            setPrincipalMember({
              name: user.name,
              memberNumber: user.member_number || user.membership_number || formData.membershipNumber,
              availableVotes: voteWeight,
              totalVotes: voteWeight
            });

            // Auto-populate name fields if empty
            if (!formData.fullNames && user.name) {
              handleInputChange('fullNames', user.name);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch principal member details', err);
      }
    };

    fetchPrincipalMemberDetails();
  }, [formData.membershipNumber]);

  const toggleAssigneeCandidate = (employeeId: string) => {
    setAssignee(prev => {
      const allowed = new Set(prev.allowedCandidates);
      if (allowed.has(employeeId)) allowed.delete(employeeId); else allowed.add(employeeId);
      return { ...prev, allowedCandidates: Array.from(allowed) };
    });
  };

  const setAssigneeAppointmentType = (type: 'discretional' | 'instructional') => {
    setAssignee(prev => ({ ...prev, appointmentType: type }));
  };

  const handleVoteAllocation = (votes: number) => {
    if (!principalMember) return;
    
    // Ensure votes don't exceed available votes
    const allocatedVotes = Math.min(Math.max(0, votes), principalMember.availableVotes);
    
    setAssignee(prev => ({ ...prev, votesAllocated: allocatedVotes }));
    
    // Update available votes for principal member
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

    // Required fields validation
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.initials) newErrors.initials = 'Initials are required';
    if (!formData.surname) newErrors.surname = 'Surname is required';
    if (!formData.fullNames) newErrors.fullNames = 'Full names are required';
    if (!formData.membershipNumber) newErrors.membershipNumber = 'Membership number is required';
    if (!formData.idPassportNumber) newErrors.idPassportNumber = 'ID/Passport number is required';
    
    if (!formData.signedAt) newErrors.signedAt = 'Signing location is required';
    
    // Validate assignee is populated
    if (!assignee.name) newErrors.assigneeName = 'Assignee details not loaded. Please refresh the page.';
    if (!assignee.memberNumber) newErrors.assigneeMemberNumber = 'Assignee membership number missing.';
    
    // Validate vote allocation
    if (principalMember && principalMember.totalVotes > 0) {
      if (assignee.votesAllocated <= 0) {
        newErrors.votesAllocated = 'Please allocate at least 1 vote to the proxy member.';
      }
      if (assignee.votesAllocated > principalMember.totalVotes) {
        newErrors.votesAllocated = `Cannot allocate more than ${principalMember.totalVotes} votes.`;
      }
    }
    
    // Validate allowed candidates for instructional assignee
    if (assignee.appointmentType === 'instructional' && assignee.allowedCandidates.length === 0) {
      newErrors.assigneeAllowedCandidates = 'Please select at least one employee for instructional proxy';
    }
    
    // Validate at least one proxy member
    if (formData.proxyGroupMembers.length === 0) {
      newErrors.proxyMembers = 'At least one proxy member is required';
    } else {
      formData.proxyGroupMembers.forEach((member, index) => {
        if (!member.fullNames) newErrors[`proxyMember${index}FullNames`] = 'Full names are required';
        if (!member.surname) newErrors[`proxyMember${index}Surname`] = 'Surname is required';
      });
    }
    
    // Instructional proxy validation
    if (formData.appointmentType === 'instructional') {
      if (!formData.trusteeRemuneration) newErrors.trusteeRemuneration = 'Please select voting preference';
      if (!formData.remunerationPolicy) newErrors.remunerationPolicy = 'Please select voting preference';
      if (!formData.auditorsAppointment) newErrors.auditorsAppointment = 'Please select voting preference';
      if (!formData.agmMotions) newErrors.agmMotions = 'Please select voting preference';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Create the principal name for proxy_groups
    const principalName = `${formData.title} ${formData.initials} ${formData.surname}`.trim();

    const payload = {
      // Principal Member Details
      member_title: formData.title,
      member_initials: formData.initials,
      member_surname: formData.surname,
      member_full_name: formData.fullNames,
      member_membership_number: formData.membershipNumber,
      member_id_number: formData.idPassportNumber,

      // Proxy Appointment Type
      appointment_type: formData.appointmentType.toUpperCase(),
      
      // Signature & Declaration
      location_signed: formData.signedAt,
      signed_date: formData.signatureDate,

      // AGM Voting Instructions
      trustee_remuneration: formData.trusteeRemuneration || null,
      remuneration_policy: formData.remunerationPolicy || null,
      auditors_appointment: formData.auditorsAppointment || null,
      agm_motions: formData.agmMotions || null,

      // Trustee Candidates
      trustee_candidates: formData.trusteeCandidates.map(c => ({
        candidate_id: c.candidateId,
        vote_choice: c.voteChoice
      })),

      // Proxy Groups - Contains principal name
      proxy_groups: {
        group_name: principalName,
        principal_member_name: principalName,
        principal_member_id: formData.membershipNumber
      },

      // Proxy Group Members - Array of proxy holders (including assignee)
      proxy_group_members: [
        // Add the assignee as the first member
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
        // Then add any additional proxy members from the form
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

      // Assignee object for server-side processing
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

      // Principal member vote details
      principal_member_votes: {
        total_votes: principalMember?.totalVotes || 1,
        allocated_votes: assignee.votesAllocated || 0,
        remaining_votes: principalMember?.availableVotes || 0
      }
    };

    console.log('Submitting payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${API_BASE_URL}/api/proxy/proxy-form`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit form');
        }

        const result = await response.json();
        
        if (result.success) {
          setSubmitted(true);
          // Dispatch event so VotingStatusBar refreshes
          window.dispatchEvent(new Event('proxyDataUpdated'));
          alert('Proxy form submitted successfully!');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(`Failed to submit form: ${(error as Error).message}`);
    } finally {
        setLoading(false);
    }

    // try {
    //   const userId = user?.id || 1;

    //   const response = await fetch(`${API_BASE_URL}/api/employees/registration-data-forms`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'x-user-id': userId.toString()
    //     },
    //     body: JSON.stringify({
    //       formId: currentFormId || `PROXY-${Date.now()}`,
    //       formData: payload,
    //       submittedAt: new Date().toISOString(),
    //       userId: userId
    //     })
    //   });

    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     throw new Error(errorData.message || 'Failed to submit form');
    //   }

    //   const result = await response.json();

    //   if (result.success) {
    //     setSubmitted(true);
    //     alert(result.message);
    //   }
    // } catch (error) {
    //   const errorMessage = (error as Error).message;
    //   console.error('Error submitting form:', errorMessage);
    //   alert(`Failed to submit form: ${errorMessage}`);
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleInputChange = (field: keyof ProxyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProxyMemberChange = (index: number, field: keyof ProxyFormData['proxyGroupMembers'][0], value: string) => {
    const updatedMembers = [...formData.proxyGroupMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
    
    // Clear error for this field
    const errorKey = `proxyMember${index}${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const addProxyMember = () => {
    setFormData(prev => ({
      ...prev,
      proxyGroupMembers: [
        ...prev.proxyGroupMembers,
        {
          initials: '',
          fullNames: '',
          surname: '',
          membershipNumber: '',
          idPassportNumber: ''
        }
      ]
    }));
  };

  const removeProxyMember = (index: number) => {
    if (formData.proxyGroupMembers.length > 1) {
      setFormData(prev => ({
        ...prev,
        proxyGroupMembers: prev.proxyGroupMembers.filter((_, i) => i !== index)
      }));
    }
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(formLink);
    alert('Form link copied to clipboard!');
  };

  const downloadPDF = () => {
    window.print();
  };

  const censorText = (text: string, show: boolean = false): string => {
    if (show || !text) return text;
    return '*'.repeat(Math.min(text.length, 8));
  };

  if (submitted && !isPreview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your proxy appointment form has been submitted and will be processed before the AGM.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Submission Deadline:</strong> 19 June 2025 at 09h00<br />
              <strong>AGM Date:</strong> 26 June 2025 at 09h00
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Proxy Appointment Form</h1>
                <p className="text-gray-600">Principal Member Details</p>
              </div>
            </div>

            {!isPreview && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  title={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                >
                  {showSensitiveData ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <button
                  onClick={copyFormLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Section 5: Proxy Member (Assignee) - Prepopulated with logged-in user */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Section 5: Proxy Member (You)</h2>
            <span className="text-xs ml-auto text-gray-500">Prepopulated</span>
          </div>

          {errors.assigneeName && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.assigneeName}</p>
            </div>
          )}

          {errors.assigneeMemberNumber && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.assigneeMemberNumber}</p>
            </div>
          )}

          {errors.votesAllocated && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.votesAllocated}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-700">Name</label>
              <div className="mt-1 text-gray-900">{assignee.name || 'Loading...'}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Email</label>
              <div className="mt-1 text-gray-900">{assignee.email || 'Loading...'}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Member #</label>
              <div className="mt-1 text-gray-900">{assignee.memberNumber || '—'}</div>
            </div>
          </div>

          {/* Vote Allocation Section */}
          {principalMember && principalMember.totalVotes > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Vote className="h-5 w-5 text-blue-600" />
                  <label className="block text-sm font-semibold text-gray-800">Allocate Votes to Proxy Member</label>
                </div>
                <div className="text-sm text-gray-600">
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
                  <span className="text-sm text-gray-700">votes allocated to <strong>{assignee.name || 'this proxy member'}</strong></span>
                </div>

                {/* Quick allocation buttons */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Quick select:</span>
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
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <p className="text-xs text-gray-600 italic">
                  The proxy member will be able to cast up to <strong>{assignee.votesAllocated}</strong> vote{assignee.votesAllocated !== 1 ? 's' : ''} on your behalf.
                </p>
              </div>
            </div>
          )}

          {!principalMember && formData.membershipNumber && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Please enter a valid membership number in Section 1 to enable vote allocation.
              </p>
            </div>
          )}

          <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-100">
            <label className="block text-sm font-medium text-gray-800 mb-2">Proxy Appointment Type</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input type="radio" name="assigneeAppointment" value="discretional" checked={assignee.appointmentType === 'discretional'} onChange={() => setAssigneeAppointmentType('discretional')} className="w-4 h-4" />
                <span className="text-sm text-gray-700">Discretional</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="assigneeAppointment" value="instructional" checked={assignee.appointmentType === 'instructional'} onChange={() => setAssigneeAppointmentType('instructional')} className="w-4 h-4" />
                <span className="text-sm text-gray-700">Instructional</span>
              </label>
            </div>
          </div>

          {/* Allowed candidates UI - shows when appointmentType is instructional */}
          {assignee.appointmentType === 'instructional' && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Vote className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-900">Allowed to Vote For (Select Employees)</h4>
              </div>

              <p className="text-xs text-gray-500 mb-3">Select which employees <strong>{assignee.name || 'this proxy member'}</strong> is authorized to vote for.</p>

              {errors.assigneeAllowedCandidates && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-700 text-sm">{errors.assigneeAllowedCandidates}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                {availableEmployees.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-full text-center py-8">No employees available</p>
                ) : (
                  availableEmployees.map(emp => (
                    <label key={emp.id} className={`flex items-center space-x-3 p-2 border rounded ${assignee.allowedCandidates.includes(emp.id) ? 'bg-blue-50' : 'bg-white'}`}>
                      <input type="checkbox" checked={assignee.allowedCandidates.includes(emp.id)} onChange={() => toggleAssigneeCandidate(emp.id)} className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{emp.name}</span>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-3 text-xs text-gray-600">Selected: <strong>{assignee.allowedCandidates.length}</strong> employee(s)</div>
            </div>
          )}
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Principal Member Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Section 1: Principal Member Details (Proxy Giver)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <select
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Initials</label>
                <input
                  type="text"
                  value={formData.initials}
                  onChange={(e) => handleInputChange('initials', e.target.value)}
                  placeholder="e.g., J.D."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.initials ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.initials && <p className="text-red-500 text-sm mt-1">{errors.initials}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Surname</label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  placeholder="Enter surname"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.surname ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name(s)</label>
                <input
                  type="text"
                  value={formData.fullNames}
                  onChange={(e) => handleInputChange('fullNames', e.target.value)}
                  placeholder="Enter full names"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fullNames ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullNames && <p className="text-red-500 text-sm mt-1">{errors.fullNames}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Membership Number</label>
                <input
                  type="text"
                  value={formData.membershipNumber}
                  onChange={(e) => handleInputChange('membershipNumber', e.target.value)}
                  placeholder="Enter membership number"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.membershipNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.membershipNumber && <p className="text-red-500 text-sm mt-1">{errors.membershipNumber}</p>}
                
                {/* Show principal member details if found */}
                {principalMember && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Member Found: {principalMember.name}</p>
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>Total Votes Available: <strong>{principalMember.totalVotes}</strong></p>
                      <p>Remaining Votes: <strong>{principalMember.availableVotes}</strong></p>
                      <p>Allocated to Proxy: <strong>{assignee.votesAllocated}</strong></p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID/Passport Number {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                </label>
                <input
                  type="text"
                  value={censorText(formData.idPassportNumber, showSensitiveData)}
                  onChange={(e) => handleInputChange('idPassportNumber', e.target.value)}
                  placeholder="Enter ID or passport number"
                  disabled={!showSensitiveData}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.idPassportNumber ? 'border-red-500' : 'border-gray-300'
                  } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                />
                {errors.idPassportNumber && <p className="text-red-500 text-sm mt-1">{errors.idPassportNumber}</p>}
              </div>
            </div>
          </motion.div>

          {/* Section 2: Proxy Appointment Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Vote className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Section 2: Proxy Appointment Type</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="discretional"
                  name="appointmentType"
                  value="discretional"
                  checked={formData.appointmentType === 'discretional'}
                  onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="discretional" className="text-gray-700">
                  <strong>Discretional Proxy Appointment</strong>
                  <p className="text-sm text-gray-500 mt-1">
                    The proxy holder may vote at their discretion on all matters
                  </p>
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="instructional"
                  name="appointmentType"
                  value="instructional"
                  checked={formData.appointmentType === 'instructional'}
                  onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="instructional" className="text-gray-700">
                  <strong>Instructional Proxy Appointment</strong>
                  <p className="text-sm text-gray-500 mt-1">
                    The proxy holder must vote according to your specific instructions below
                  </p>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Section 3: AGM Voting Instructions (only show if instructional) */}
          {formData.appointmentType === 'instructional' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Vote className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Section 3: AGM Voting Instructions</h2>
              </div>
              
              <div className="space-y-6">
                {/* Trustee Remuneration */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900 mb-3">1. 2025 Trustee Remuneration – I Vote:</h3>
                  <div className="flex space-x-6">
                    {['yes', 'no', 'abstain'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="trusteeRemuneration"
                          value={option}
                          checked={formData.trusteeRemuneration === option}
                          onChange={(e) => handleInputChange('trusteeRemuneration', e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.trusteeRemuneration && <p className="text-red-500 text-sm mt-1">{errors.trusteeRemuneration}</p>}
                </div>

                {/* Remuneration Policy */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900 mb-3">2. Non-binding Advisory vote on the Trustee Remuneration Policy – I Vote:</h3>
                  <div className="flex space-x-6">
                    {['yes', 'no', 'abstain'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="remunerationPolicy"
                          value={option}
                          checked={formData.remunerationPolicy === option}
                          onChange={(e) => handleInputChange('remunerationPolicy', e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.remunerationPolicy && <p className="text-red-500 text-sm mt-1">{errors.remunerationPolicy}</p>}
                </div>

                {/* Auditors Appointment */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900 mb-3">3. Appointment of Auditors for 2025 – I Vote:</h3>
                  <div className="flex space-x-6">
                    {['yes', 'no', 'abstain'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="auditorsAppointment"
                          value={option}
                          checked={formData.auditorsAppointment === option}
                          onChange={(e) => handleInputChange('auditorsAppointment', e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.auditorsAppointment && <p className="text-red-500 text-sm mt-1">{errors.auditorsAppointment}</p>}
                </div>

                {/* AGM Motions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">4. Motions presented at the AGM – I Vote:</h3>
                  <div className="flex space-x-6">
                    {['yes', 'no', 'abstain'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="agmMotions"
                          value={option}
                          checked={formData.agmMotions === option}
                          onChange={(e) => handleInputChange('agmMotions', e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Note: Proxy will vote on your behalf for motions presented at the AGM
                  </p>
                  {errors.agmMotions && <p className="text-red-500 text-sm mt-1">{errors.agmMotions}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Section 4: Signature & Declaration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Section 4: Signature & Declaration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signed at</label>
                <input
                  type="text"
                  value={formData.signedAt}
                  onChange={(e) => handleInputChange('signedAt', e.target.value)}
                  placeholder="Enter location (e.g., Cape Town)"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.signedAt ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.signedAt && <p className="text-red-500 text-sm mt-1">{errors.signedAt}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.signatureDate}
                  onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Declaration:</strong> I hereby appoint the above-named person(s) as my proxy to attend and vote 
                on my behalf at the Annual General Meeting. I understand that this appointment is valid only for the 
                specified AGM and will expire thereafter.
              </p>
            </div>
          </motion.div>

          {/* Section 5: Proxy Group Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Section 5: Proxy Members</h2>
              </div>
              {/* <button
                type="button"
                onClick={addProxyMember}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Proxy Member</span>
              </button> */}
            </div>

            {errors.proxyMembers && <p className="text-red-500 text-sm mb-4">{errors.proxyMembers}</p>}
            
            <div className="space-y-6">
              {formData.proxyGroupMembers.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Proxy Member {index + 1}</h3>
                    {formData.proxyGroupMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProxyMember(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove proxy member"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Initials</label>
                      <input
                        type="text"
                        value={member.initials}
                        onChange={(e) => handleProxyMemberChange(index, 'initials', e.target.value)}
                        placeholder="e.g., A.B."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name(s) {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                      </label>
                      <input
                        type="text"
                        value={censorText(member.fullNames, showSensitiveData)}
                        onChange={(e) => handleProxyMemberChange(index, 'fullNames', e.target.value)}
                        placeholder="Enter full names"
                        disabled={!showSensitiveData}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`proxyMember${index}FullNames`] ? 'border-red-500' : 'border-gray-300'
                        } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                      />
                      {errors[`proxyMember${index}FullNames`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`proxyMember${index}FullNames`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Surname {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                      </label>
                      <input
                        type="text"
                        value={censorText(member.surname, showSensitiveData)}
                        onChange={(e) => handleProxyMemberChange(index, 'surname', e.target.value)}
                        placeholder="Enter surname"
                        disabled={!showSensitiveData}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`proxyMember${index}Surname`] ? 'border-red-500' : 'border-gray-300'
                        } ${!showSensitiveData ? 'bg-gray-100' : ''}`}
                      />
                      {errors[`proxyMember${index}Surname`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`proxyMember${index}Surname`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Membership Number</label>
                      <input
                        type="text"
                        value={member.membershipNumber}
                        onChange={(e) => handleProxyMemberChange(index, 'membershipNumber', e.target.value)}
                        placeholder="Enter membership number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID/Passport Number {!showSensitiveData && <span className="text-red-500">(CENSORED)</span>}
                      </label>
                      <input
                        type="text"
                        value={censorText(member.idPassportNumber, showSensitiveData)}
                        onChange={(e) => handleProxyMemberChange(index, 'idPassportNumber', e.target.value)}
                        placeholder="Enter ID or passport number"
                        disabled={!showSensitiveData}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !showSensitiveData ? 'bg-gray-100' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Submit Button */}
          {!isPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Submit?</h3>
                  <p className="text-gray-600">Please review all information before submitting your proxy appointment form.</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                </motion.button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProxyAppointmentFormAsignee;
