import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  User,
  Users,
  Vote,
  AlertCircle,
  CheckCircle,
  Send,
  Eye,
  EyeOff,
  Download,
  Share2,
  Plus,
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

  // Global default is removed - each proxy member has their own type


  // Trustee Election
  trusteeCandidates: {
    candidateId: string;
    voteChoice: 'yes' | 'no' | 'abstain';
  }[];

  // Signature & Declaration
  signedAt: string;
  signatureDate: string;

  // Proxy Group Members (each has their own appointment type)
  proxyGroupMembers: {
    initials: string;
    fullNames: string;
    surname: string;
    membershipNumber: string;
    idPassportNumber: string;
    appointmentType: 'discretional' | 'instructional' | 'mixed'; // Each member has their own type
    allowedCandidates?: string[]; // IDs of employees this proxy can vote for (only for instructional/mixed)
    votesAllocated: number; // Total number of votes delegated to this proxy member
    discretionalVotes?: number; // For mixed type: votes that can be used at discretion
    instructionalVotes?: number; // For mixed type: votes that must follow instructions
  }[];

  // Vote Allocation Summary
  totalAvailableVotes: number;
  totalAllocatedVotes: number;

  // AGM Voting Instructions (applies to ALL instructional proxies)
  trusteeRemuneration: 'yes' | 'no' | 'abstain' | '';
  remunerationPolicy: 'yes' | 'no' | 'abstain' | '';
  auditorsAppointment: 'yes' | 'no' | 'abstain' | '';
  agmMotions: 'yes' | 'no' | 'abstain' | '';
}

interface ProxyFormProps {
  formId?: string;
  isPreview?: boolean;
}

const ProxyAppointmentForm: React.FC<ProxyFormProps> = ({ formId, isPreview = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentUserId } = useAuth();
  
  const [formData, setFormData] = useState<ProxyFormData>({
    // Principal Member Details
    title: '',
    initials: '',
    surname: '',
    fullNames: '',
    membershipNumber: '',
    idPassportNumber: '',

    // AGM Voting Instructions (for ALL instructional proxies)
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
      idPassportNumber: '',
      appointmentType: 'discretional',
      allowedCandidates: [],
      votesAllocated: 0,
      discretionalVotes: 0,
      instructionalVotes: 0
    }],

    // Vote Allocation
    totalAvailableVotes: 0,
    totalAllocatedVotes: 0
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [availableEmployees, setAvailableEmployees] = useState<{ id: string; name: string }[]>([]);
  const [fetchingVotes, setFetchingVotes] = useState(false);

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

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/employees`);
        const result = await response.json();
        if (result.success) {
          setAvailableEmployees(result.data.map((emp: any) => ({
            id: emp.id.toString(),
            name: emp.name
          })));
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        setAvailableEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  // Auto-populate ONLY Section 4 (First Proxy Member) with logged-in user's data
  // Section 1 (Principal Member) should be entered manually by the user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (!res.ok) return;
        
        const json = await res.json();
        
        // Extract userData from response
        const userData = json.user || json.data || json;
        console.log("this is the user data:", userData);
        
        if (userData) {
          // Extract initials from name (e.g., "John Doe" -> "J.D.")
          const nameParts = (userData.name || '').split(' ');
          const initials = nameParts.map((part: string) => part[0]).join('.') + '.';
          
          // Use surname from userData if available, otherwise extract from name
          const surname = userData.surname || (nameParts.length > 0 ? nameParts[nameParts.length - 1] : '');
          
          // Update ONLY the first proxy member (Section 4) with user data
          setFormData(prev => ({
            ...prev,
            proxyGroupMembers: [{
              initials: initials,
              fullNames: userData.name || '',
              surname: surname,
              membershipNumber: userData.member_number || userData.membership_number || '',
              idPassportNumber: userData.id_number || '',
              appointmentType: 'discretional',
              allowedCandidates: [],
              votesAllocated: 0,
              discretionalVotes: 0,
              instructionalVotes: 0
            }]
          }));
        }
      } catch (err) {
        console.error('Failed to fetch current user for proxy member', err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch logged-in user's available votes (same as VotingStatusBar - uses totalVotesRemaining)
  useEffect(() => {
    const fetchUserVotes = async () => {
      try {
        // Get the logged-in user's ID using getCurrentUserId() (same as VotingStatusBar)
        const userId = getCurrentUserId();
        if (!userId) {
          console.error('❌ No user ID available');
          setFormData(prev => ({
            ...prev,
            totalAvailableVotes: 0
          }));
          setFetchingVotes(false);
          return;
        }

        setFetchingVotes(true);
        const token = localStorage.getItem('token');
        console.log('🔍 Fetching votes for user ID:', userId);
        
        // Use the SAME endpoint as VotingStatusBar
        const response = await fetch(`${API_BASE_URL}/api/voting-status/status/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 API Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📊 API Result:', result);
          
          if (result.success && result.data) {
            // Use totalVotesRemaining just like VotingStatusBar does (this is "votes left")
            const votesLeft = result.data.totalVotesRemaining || 0;
            
            console.log('✅ Setting totalAvailableVotes to:', votesLeft, '(same as VotingStatusBar "votes left")');
            console.log('📦 Full data object:', result.data);
            
            setFormData(prev => ({
              ...prev,
              totalAvailableVotes: votesLeft
            }));
          } else {
            console.warn('⚠️ API returned success=false or no data');
            setFormData(prev => ({
              ...prev,
              totalAvailableVotes: 0
            }));
          }
        } else {
          console.error('❌ API call failed with status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          setFormData(prev => ({
            ...prev,
            totalAvailableVotes: 0
          }));
        }
      } catch (error) {
        console.error('💥 Error fetching user votes:', error);
        setFormData(prev => ({
          ...prev,
          totalAvailableVotes: 0
        }));
      } finally {
        setFetchingVotes(false);
      }
    };

    // Fetch once on component mount
    fetchUserVotes();
  }, [getCurrentUserId]); // Add getCurrentUserId to dependencies

  // Recalculate total allocated votes when proxy members change
  useEffect(() => {
    let totalAllocated = 0;
    
    formData.proxyGroupMembers.forEach(member => {
      if (member.appointmentType === 'mixed') {
        // For mixed, use the manually entered votesAllocated
        totalAllocated += member.votesAllocated || 0;
      } else {
        // For discretional and instructional, auto-allocate ALL available votes
        totalAllocated += formData.totalAvailableVotes;
      }
    });
    
    setFormData(prev => ({
      ...prev,
      totalAllocatedVotes: totalAllocated
    }));
  }, [formData.proxyGroupMembers, formData.totalAvailableVotes]);

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

    // Validate at least one proxy member
    if (formData.proxyGroupMembers.length === 0) {
      newErrors.proxyMembers = 'At least one proxy member is required';
    } else {
      formData.proxyGroupMembers.forEach((member, index) => {
        if (!member.fullNames) newErrors[`proxyMember${index}FullNames`] = 'Full names are required';
        if (!member.surname) newErrors[`proxyMember${index}Surname`] = 'Surname is required';

        // For MIXED type, validate votes allocated
        if (member.appointmentType === 'mixed') {
          if (!member.votesAllocated || member.votesAllocated <= 0) {
            newErrors[`proxyMember${index}Votes`] = 'Must allocate at least 1 vote for mixed type';
          }
        }
        // For DISCRETIONAL and INSTRUCTIONAL, votes are auto-allocated (no validation needed for votesAllocated)

        // Validate allowed candidates for instructional proxy
        if (member.appointmentType === 'instructional' || member.appointmentType === 'mixed') {
          const instructionalLimit = member.instructionalVotes || formData.totalAvailableVotes;
          const selectedCount = (member.allowedCandidates || []).length;
          
          if (selectedCount === 0) {
            newErrors[`proxyMember${index}Candidates`] = 'Select at least one employee this proxy can vote for';
          } else if (selectedCount > instructionalLimit) {
            newErrors[`proxyMember${index}Candidates`] = `You can only select up to ${instructionalLimit} employee(s) based on ${instructionalLimit} instructional vote(s)`;
          }
        }

        // Validate vote split for mixed appointment type
        if (member.appointmentType === 'mixed') {
          const discVotes = member.discretionalVotes || 0;
          const instVotes = member.instructionalVotes || 0;
          
          if (discVotes + instVotes !== member.votesAllocated) {
            newErrors[`proxyMember${index}VoteSplit`] = `Discretional (${discVotes}) + Instructional (${instVotes}) must equal Total Votes (${member.votesAllocated})`;
          }
          
          if (instVotes <= 0) {
            newErrors[`proxyMember${index}InstructionalVotes`] = 'Mixed type must have at least 1 instructional vote';
          }
        }
      });
    }

    // Validate total allocated votes doesn't exceed available (only for mixed types)
    const mixedAllocations = formData.proxyGroupMembers
      .filter(m => m.appointmentType === 'mixed')
      .reduce((sum, member) => sum + (member.votesAllocated || 0), 0);
    
    // For discretional/instructional, they auto-allocate all votes (handled by system)
    const hasNonMixed = formData.proxyGroupMembers.some(m => 
      m.appointmentType === 'discretional' || m.appointmentType === 'instructional'
    );

    if (hasNonMixed && formData.proxyGroupMembers.length > 1) {
      newErrors.voteAllocation = 'You can only have ONE proxy member when using Discretional or Instructional type (all votes auto-allocated). Use Mixed type to split votes among multiple proxies.';
    }

    if (mixedAllocations > formData.totalAvailableVotes) {
      newErrors.voteAllocation = `Mixed type allocations (${mixedAllocations}) cannot exceed available votes (${formData.totalAvailableVotes})`;
    }

    if (formData.proxyGroupMembers.length === 1 && formData.proxyGroupMembers[0].appointmentType === 'mixed') {
      if (formData.totalAllocatedVotes < formData.totalAvailableVotes) {
        newErrors.voteAllocation = `You still have ${formData.totalAvailableVotes - formData.totalAllocatedVotes} unallocated vote(s). Allocate all your votes.`;
      }
    }

    // Instructional proxy validation - check if ANY proxy member is instructional or mixed
    const hasInstructionalProxy = formData.proxyGroupMembers.some(m => 
      m.appointmentType === 'instructional' || m.appointmentType === 'mixed'
    );
    if (hasInstructionalProxy) {
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

      // Proxy Group Members - Array of proxy holders with their own appointment types
      proxy_group_members: formData.proxyGroupMembers.map(member => ({
        initials: member.initials,
        full_name: member.fullNames,
        surname: member.surname,
        membership_number: member.membershipNumber,
        id_number: member.idPassportNumber,
        appointment_type: member.appointmentType.toUpperCase(),
        votes_allocated: member.votesAllocated, // Total number of votes delegated
        discretional_votes: member.appointmentType === 'mixed' ? (member.discretionalVotes || 0) : 
                           (member.appointmentType === 'discretional' ? member.votesAllocated : 0),
        instructional_votes: member.appointmentType === 'mixed' ? (member.instructionalVotes || 0) : 
                            (member.appointmentType === 'instructional' ? member.votesAllocated : 0),
        allowed_candidates: (member.appointmentType === 'instructional' || member.appointmentType === 'mixed')
          ? member.allowedCandidates || []
          : null // null for pure DISCRETIONAL
      })),

      // Vote allocation summary
      total_available_votes: formData.totalAvailableVotes,
      total_allocated_votes: formData.totalAllocatedVotes
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
          alert(result.message);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(`Failed to submit form: ${(error as Error).message}`);
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

  const handleProxyMemberChange = (index: number, field: keyof ProxyFormData['proxyGroupMembers'][0], value: any) => {
    const updatedMembers = [...formData.proxyGroupMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));

    // Clear error for this field
    const errorKey = `proxyMember${index}${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleCandidateSelection = (memberIndex: number, candidateId: string) => {
    const updatedMembers = [...formData.proxyGroupMembers];
    const currentAllowed = updatedMembers[memberIndex].allowedCandidates || [];
    const member = updatedMembers[memberIndex];
    
    // Get the instructional votes limit
    const instructionalVotesLimit = member.instructionalVotes || 0;

    if (currentAllowed.includes(candidateId)) {
      // Remove candidate
      updatedMembers[memberIndex].allowedCandidates = currentAllowed.filter(id => id !== candidateId);
    } else {
      // Check if we've reached the limit
      if (currentAllowed.length >= instructionalVotesLimit) {
        alert(`You can only select ${instructionalVotesLimit} employee(s) based on your ${instructionalVotesLimit} instructional vote(s).`);
        return;
      }
      // Add candidate
      updatedMembers[memberIndex].allowedCandidates = [...currentAllowed, candidateId];
    }

    setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));

    // Clear error for this field
    const errorKey = `proxyMember${memberIndex}Candidates`;
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
          idPassportNumber: '',
          appointmentType: 'discretional',
          allowedCandidates: [],
          votesAllocated: 0,
          discretionalVotes: 0,
          instructionalVotes: 0
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

  console.log(formData);

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
                  <span>Share Form</span>
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Deadline Notice */}
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Important Deadlines</p>
                <p className="text-sm text-red-700 mt-1">
                  This form must be submitted no later than <strong>19 June 2025 at 09h00</strong><br />
                  AGM Date: <strong>26 June 2025 at 09h00</strong>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 4: Proxy Group Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Section 4: Proxy Members</h2>
              </div>
              <button
                type="button"
                onClick={addProxyMember}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Proxy Member</span>
              </button>
            </div>

            {/* Auto-population notice */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">First Proxy Member Auto-Populated</p>
                  <p className="text-sm text-green-700 mt-1">
                    The first proxy member has been automatically filled with your account details. You can edit these fields or add more proxy members below.
                  </p>
                </div>
              </div>
            </div>

            {errors.proxyMembers && <p className="text-red-500 text-sm mb-4">{errors.proxyMembers}</p>}

            <div className="space-y-6">
              {formData.proxyGroupMembers.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">Proxy Member {index + 1}</h3>
                      {index === 0 && (
                        <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          You (Auto-populated)
                        </span>
                      )}
                    </div>
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

                  {/* Appointment Type Selection Per Proxy Member */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Proxy Appointment Type</label>
                    
                    {/* Info notice for Discretional and Instructional */}
                    {(member.appointmentType === 'discretional' || member.appointmentType === 'instructional') && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-800">
                          <strong>ℹ️ Auto-Allocation:</strong> All your available votes will be automatically allocated to this proxy member in the background. No manual entry needed.
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          id={`discretional-${index}`}
                          name={`appointmentType-${index}`}
                          value="discretional"
                          checked={member.appointmentType === 'discretional'}
                          onChange={() => {
                            const updatedMembers = [...formData.proxyGroupMembers];
                            updatedMembers[index] = {
                              ...updatedMembers[index],
                              appointmentType: 'discretional',
                              votesAllocated: formData.totalAvailableVotes, // Auto-allocate ALL votes
                              discretionalVotes: formData.totalAvailableVotes,
                              instructionalVotes: 0
                            };
                            setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-1"
                        />
                        <label htmlFor={`discretional-${index}`} className="text-gray-700 flex-1 cursor-pointer">
                          <strong>Discretional</strong>
                          <p className="text-xs text-gray-500 mt-1">
                            This proxy can vote at their discretion for any employee. All your votes will be automatically allocated.
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          id={`instructional-${index}`}
                          name={`appointmentType-${index}`}
                          value="instructional"
                          checked={member.appointmentType === 'instructional'}
                          onChange={() => {
                            const updatedMembers = [...formData.proxyGroupMembers];
                            updatedMembers[index] = {
                              ...updatedMembers[index],
                              appointmentType: 'instructional',
                              votesAllocated: formData.totalAvailableVotes, // Auto-allocate ALL votes
                              discretionalVotes: 0,
                              instructionalVotes: formData.totalAvailableVotes
                            };
                            setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-1"
                        />
                        <label htmlFor={`instructional-${index}`} className="text-gray-700 flex-1 cursor-pointer">
                          <strong>Instructional</strong>
                          <p className="text-xs text-gray-500 mt-1">
                            This proxy must vote according to your instructions and only for selected employees. All your votes will be automatically allocated.
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          id={`mixed-${index}`}
                          name={`appointmentType-${index}`}
                          value="mixed"
                          checked={member.appointmentType === 'mixed'}
                          onChange={() => {
                            const updatedMembers = [...formData.proxyGroupMembers];
                            const totalVotes = updatedMembers[index].votesAllocated;
                            const half = Math.floor(totalVotes / 2);
                            updatedMembers[index] = {
                              ...updatedMembers[index],
                              appointmentType: 'mixed',
                              discretionalVotes: half,
                              instructionalVotes: totalVotes - half
                            };
                            setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-1"
                        />
                        <label htmlFor={`mixed-${index}`} className="text-gray-700 flex-1 cursor-pointer">
                          <strong>Mixed (Discretional + Instructional)</strong>
                          <p className="text-xs text-gray-500 mt-1">
                            Split votes between discretional (any employee) and instructional (selected employees only)
                          </p>
                        </label>
                      </div>
                    </div>
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

                    {/* Vote Allocation - Only show inputs for MIXED type */}
                    {member.appointmentType === 'mixed' && (
                      <>
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                              <Vote className="h-4 w-4 text-blue-600" />
                              <span>Total Votes to Allocate</span>
                            </div>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={formData.totalAvailableVotes}
                            value={member.votesAllocated}
                            onChange={(e) => {
                              const totalVotes = parseInt(e.target.value) || 0;
                              const updatedMembers = [...formData.proxyGroupMembers];
                              
                              // Keep proportions if possible
                              const currentTotal = (member.discretionalVotes || 0) + (member.instructionalVotes || 0);
                              if (currentTotal > 0) {
                                const ratio = (member.discretionalVotes || 0) / currentTotal;
                                const newDisc = Math.round(totalVotes * ratio);
                                updatedMembers[index] = {
                                  ...updatedMembers[index],
                                  votesAllocated: totalVotes,
                                  discretionalVotes: newDisc,
                                  instructionalVotes: totalVotes - newDisc
                                };
                              } else {
                                // Split evenly
                                const half = Math.floor(totalVotes / 2);
                                updatedMembers[index] = {
                                  ...updatedMembers[index],
                                  votesAllocated: totalVotes,
                                  discretionalVotes: half,
                                  instructionalVotes: totalVotes - half
                                };
                              }
                              
                              setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
                            }}
                            placeholder="Enter total number of votes"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`proxyMember${index}Votes`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This proxy will receive {member.votesAllocated || 0} votes total. Split them below.
                          </p>
                          {errors[`proxyMember${index}Votes`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`proxyMember${index}Votes`]}</p>
                          )}
                        </div>

                        {/* Vote Split for Mixed Appointment Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                              <Vote className="h-4 w-4 text-green-600" />
                              <span>Discretional Votes</span>
                            </div>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={member.votesAllocated}
                            value={member.discretionalVotes || 0}
                            onChange={(e) => {
                              const discVotes = parseInt(e.target.value) || 0;
                              const updatedMembers = [...formData.proxyGroupMembers];
                              updatedMembers[index] = {
                                ...updatedMembers[index],
                                discretionalVotes: discVotes,
                                instructionalVotes: member.votesAllocated - discVotes
                              };
                              setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
                            }}
                            placeholder="Discretional votes"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Can vote for anyone (no restrictions)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center space-x-2">
                              <Vote className="h-4 w-4 text-orange-600" />
                              <span>Instructional Votes</span>
                            </div>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={member.votesAllocated}
                            value={member.instructionalVotes || 0}
                            onChange={(e) => {
                              const instVotes = parseInt(e.target.value) || 0;
                              const updatedMembers = [...formData.proxyGroupMembers];
                              
                              // If reducing instructional votes, trim the allowed candidates list
                              const currentCandidates = updatedMembers[index].allowedCandidates || [];
                              const trimmedCandidates = instVotes < currentCandidates.length 
                                ? currentCandidates.slice(0, instVotes)
                                : currentCandidates;
                              
                              updatedMembers[index] = {
                                ...updatedMembers[index],
                                instructionalVotes: instVotes,
                                discretionalVotes: member.votesAllocated - instVotes,
                                allowedCandidates: trimmedCandidates
                              };
                              setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
                            }}
                            placeholder="Instructional votes"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`proxyMember${index}InstructionalVotes`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Must vote for selected employees only. You can select up to {member.instructionalVotes || 0} employees.
                          </p>
                          {errors[`proxyMember${index}InstructionalVotes`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`proxyMember${index}InstructionalVotes`]}</p>
                          )}
                        </div>

                        {errors[`proxyMember${index}VoteSplit`] && (
                          <div className="md:col-span-3">
                            <p className="text-red-500 text-sm flex items-center space-x-1">
                              <AlertCircle className="h-4 w-4" />
                              <span>{errors[`proxyMember${index}VoteSplit`]}</span>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Candidate Selection - Only for instructional or mixed proxy */}
                  {(member.appointmentType === 'instructional' || member.appointmentType === 'mixed') && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <Vote className="h-5 w-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          Allowed to Vote For (Select Employees)
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Select which employees <strong>{member.fullNames || 'this proxy member'}</strong> is authorized to vote for.
                        {member.appointmentType === 'mixed' && (
                          <span className="block mt-1 text-orange-600 font-semibold">
                            ⚠️ Limit: You can select up to {member.instructionalVotes || 0} employee(s) based on your instructional votes.
                          </span>
                        )}
                        {member.appointmentType === 'instructional' && (
                          <span className="block mt-1 text-orange-600 font-semibold">
                            ⚠️ Limit: You can select up to {member.instructionalVotes || formData.totalAvailableVotes} employee(s) based on your total votes.
                          </span>
                        )}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {availableEmployees.length === 0 ? (
                          <p className="text-sm text-gray-500 col-span-full text-center py-4">
                            No employees available. Please add employees first.
                          </p>
                        ) : (
                          availableEmployees.map((employee) => {
                            const isSelected = (member.allowedCandidates || []).includes(employee.id);
                            const instructionalLimit = member.instructionalVotes || formData.totalAvailableVotes;
                            const isLimitReached = (member.allowedCandidates || []).length >= instructionalLimit;
                            const isDisabled = !isSelected && isLimitReached;
                            
                            return (
                              <label
                                key={employee.id}
                                className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg transition-colors ${
                                  isDisabled 
                                    ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                                    : 'hover:bg-white cursor-pointer bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  onChange={() => handleCandidateSelection(index, employee.id)}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded disabled:cursor-not-allowed"
                                />
                                <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {employee.name}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          Selected: <strong>{(member.allowedCandidates || []).length}</strong> / <strong>{member.instructionalVotes || formData.totalAvailableVotes}</strong> employee(s)
                        </p>
                        {(member.allowedCandidates || []).length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedMembers = [...formData.proxyGroupMembers];
                              updatedMembers[index].allowedCandidates = [];
                              setFormData(prev => ({ ...prev, proxyGroupMembers: updatedMembers }));
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {errors[`proxyMember${index}Candidates`] && (
                        <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors[`proxyMember${index}Candidates`]}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
          
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

            {/* Info box about your votes */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Your Available Votes</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your available votes ({formData.totalAvailableVotes}) have been automatically loaded from your account. This matches the "votes left" shown in your voting status bar. You can allocate these votes to proxy members below.
                  </p>
                </div>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <span>Membership Number</span>
                    {fetchingVotes && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Fetching votes...</span>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.membershipNumber}
                  onChange={(e) => handleInputChange('membershipNumber', e.target.value)}
                  placeholder="Enter membership number to fetch votes"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.membershipNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formData.membershipNumber && formData.totalAvailableVotes > 0 && !fetchingVotes && (
                  <p className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>✓ Found {formData.totalAvailableVotes} available vote(s)</span>
                  </p>
                )}
                {formData.membershipNumber && formData.totalAvailableVotes === 0 && !fetchingVotes && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ No votes found for this member number
                  </p>
                )}
                {errors.membershipNumber && <p className="text-red-500 text-sm mt-1">{errors.membershipNumber}</p>}
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

            {/* Vote Allocation Summary */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Vote Allocation</h3>
                <Vote className="h-5 w-5 text-blue-600" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{formData.totalAvailableVotes}</p>
                  <p className="text-xs text-blue-700">Available Votes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">{formData.totalAllocatedVotes}</p>
                  <p className="text-xs text-green-700">Allocated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formData.totalAvailableVotes - formData.totalAllocatedVotes}</p>
                  <p className="text-xs text-gray-700">Remaining</p>
                </div>
              </div>
              {errors.voteAllocation && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700">{errors.voteAllocation}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Section 2: AGM Voting Instructions (show if ANY proxy member is instructional or mixed) */}
          {formData.proxyGroupMembers.some(m => m.appointmentType === 'instructional' || m.appointmentType === 'mixed') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Vote className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Section 2: AGM Voting Instructions</h2>
                <div className="ml-auto">
                  <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Applies to all instructional proxies
                  </span>
                </div>
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

          {/* Section 3: Signature & Declaration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Section 3: Signature & Declaration</h2>
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

export default ProxyAppointmentForm;
