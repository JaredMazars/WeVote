import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProxyForm {
  id?: string;
  auth_user_id: string;
  title: string;
  initials: string;
  surname: string;
  full_names: string;
  membership_number: string;
  id_passport_number: string;
  appointment_type: string;
  proxy_full_names: string;
  proxy_surname: string;
  trustee_remuneration?: string;
  remuneration_policy?: string;
  auditors_appointment?: string;
  agm_motions?: string;
  candidate1?: string;
  candidate2?: string;
  candidate3?: string;
  signed_at: string;
  signature_date: string;
  proxy_membership_number?: string;
  approval_status?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at?: string;
}

const DUMMY_PROXY_FORMS: ProxyForm[] = [
  {
    id: '1',
    auth_user_id: 'user1',
    title: 'Mr',
    initials: 'J.A.',
    surname: 'Smith',
    full_names: 'John Andrew',
    membership_number: 'MEM001',
    id_passport_number: '8501015800089',
    appointment_type: 'discretionary',
    proxy_full_names: 'Sarah Jane',
    proxy_surname: 'Johnson',
    proxy_membership_number: 'MEM045',
    signed_at: 'Cape Town',
    signature_date: '2025-01-10',
    approval_status: 'pending',
    created_at: '2025-01-10T09:30:00Z'
  },
  {
    id: '2',
    auth_user_id: 'user2',
    title: 'Mrs',
    initials: 'M.L.',
    surname: 'Williams',
    full_names: 'Mary Louise',
    membership_number: 'MEM002',
    id_passport_number: '9203128900067',
    appointment_type: 'instructional',
    proxy_full_names: 'David Peter',
    proxy_surname: 'Brown',
    proxy_membership_number: 'MEM067',
    trustee_remuneration: 'for',
    remuneration_policy: 'for',
    auditors_appointment: 'for',
    agm_motions: 'against',
    candidate1: 'Jane Wilson',
    candidate2: 'Robert Taylor',
    candidate3: 'Linda Anderson',
    signed_at: 'Johannesburg',
    signature_date: '2025-01-12',
    approval_status: 'pending',
    created_at: '2025-01-12T14:00:00Z'
  },
  {
    id: '3',
    auth_user_id: 'user3',
    title: 'Dr',
    initials: 'T.K.',
    surname: 'Mthembu',
    full_names: 'Thabo Kenneth',
    membership_number: 'MEM003',
    id_passport_number: '8706215600078',
    appointment_type: 'discretionary',
    proxy_full_names: 'Nomsa Grace',
    proxy_surname: 'Ndlovu',
    signed_at: 'Durban',
    signature_date: '2025-01-08',
    approval_status: 'approved',
    reviewed_at: '2025-01-09T10:15:00Z',
    created_at: '2025-01-08T11:00:00Z'
  },
  {
    id: '4',
    auth_user_id: 'user4',
    title: 'Ms',
    initials: 'L.P.',
    surname: 'Van Der Merwe',
    full_names: 'Louise Patricia',
    membership_number: 'MEM004',
    id_passport_number: '9408197800054',
    appointment_type: 'instructional',
    proxy_full_names: 'Pieter Johannes',
    proxy_surname: 'Botha',
    proxy_membership_number: 'MEM089',
    trustee_remuneration: 'against',
    remuneration_policy: 'abstain',
    auditors_appointment: 'for',
    agm_motions: 'for',
    candidate1: 'Michael Green',
    candidate2: 'Susan White',
    signed_at: 'Pretoria',
    signature_date: '2025-01-05',
    approval_status: 'rejected',
    rejection_reason: 'Incomplete voting instructions provided',
    reviewed_at: '2025-01-06T16:30:00Z',
    created_at: '2025-01-05T13:45:00Z'
  },
  {
    id: '5',
    auth_user_id: 'user5',
    title: 'Mr',
    initials: 'R.S.',
    surname: 'Patel',
    full_names: 'Ravi Shankar',
    membership_number: 'MEM005',
    id_passport_number: '8912104500012',
    appointment_type: 'discretionary',
    proxy_full_names: 'Anjali',
    proxy_surname: 'Sharma',
    proxy_membership_number: 'MEM112',
    signed_at: 'Port Elizabeth',
    signature_date: '2025-01-14',
    approval_status: 'pending',
    created_at: '2025-01-14T16:00:00Z'
  }
];

const AdminProxyForms: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proxyForms, setProxyForms] = useState<ProxyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<ProxyForm | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    loadProxyForms();
  }, [filter, user, navigate]);

  const loadProxyForms = () => {
    setLoading(true);

    setTimeout(() => {
      let filteredData = [...DUMMY_PROXY_FORMS];

      if (filter !== 'all') {
        filteredData = filteredData.filter(form => form.approval_status === filter);
      }

      setProxyForms(filteredData);
      setLoading(false);
    }, 500);
  };

  const handleApprove = (form: ProxyForm) => {
    if (!window.confirm(`Approve proxy form for ${form.full_names} ${form.surname}?`)) {
      return;
    }

    setActionLoading(true);

    setTimeout(() => {
      const updatedForms = proxyForms.map(f =>
        f.id === form.id
          ? { ...f, approval_status: 'approved', reviewed_at: new Date().toISOString() }
          : f
      );
      setProxyForms(updatedForms);

      const formIndex = DUMMY_PROXY_FORMS.findIndex(f => f.id === form.id);
      if (formIndex !== -1) {
        DUMMY_PROXY_FORMS[formIndex].approval_status = 'approved';
        DUMMY_PROXY_FORMS[formIndex].reviewed_at = new Date().toISOString();
      }

      alert('Proxy form approved successfully!');
      setSelectedForm(null);
      setActionLoading(false);
      loadProxyForms();
    }, 800);
  };

  const handleReject = (form: ProxyForm) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);

    setTimeout(() => {
      const updatedForms = proxyForms.map(f =>
        f.id === form.id
          ? {
              ...f,
              approval_status: 'rejected',
              reviewed_at: new Date().toISOString(),
              rejection_reason: rejectionReason
            }
          : f
      );
      setProxyForms(updatedForms);

      const formIndex = DUMMY_PROXY_FORMS.findIndex(f => f.id === form.id);
      if (formIndex !== -1) {
        DUMMY_PROXY_FORMS[formIndex].approval_status = 'rejected';
        DUMMY_PROXY_FORMS[formIndex].reviewed_at = new Date().toISOString();
        DUMMY_PROXY_FORMS[formIndex].rejection_reason = rejectionReason;
      }

      alert('Proxy form rejected');
      setSelectedForm(null);
      setRejectionReason('');
      setActionLoading(false);
      loadProxyForms();
    }, 800);
  };

  const filteredForms = proxyForms.filter(form =>
    `${form.full_names} ${form.surname} ${form.membership_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Approved</span>
        </span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Rejected</span>
        </span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate('/admin')}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Admin Dashboard</span>
        </motion.button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Proxy Form Approvals</h1>
                <p className="text-gray-600">Review and approve proxy appointment forms</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or membership number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading proxy forms...</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No proxy forms found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Membership #</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Proxy Holder</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Submitted</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredForms.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {form.title} {form.full_names} {form.surname}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{form.membership_number}</td>
                      <td className="px-4 py-3 text-gray-700">{form.proxy_full_names} {form.proxy_surname}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-gray-700">{form.appointment_type}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(form.approval_status!)}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {new Date(form.created_at!).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedForm(form)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !actionLoading && setSelectedForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Proxy Form Details</h2>
                <button
                  onClick={() => setSelectedForm(null)}
                  disabled={actionLoading}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Principal Member</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedForm.title} {selectedForm.initials} {selectedForm.surname}</p>
                    <p><strong>Full Names:</strong> {selectedForm.full_names}</p>
                    <p><strong>Membership #:</strong> {selectedForm.membership_number}</p>
                    <p><strong>ID/Passport:</strong> {selectedForm.id_passport_number}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Proxy Holder</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Full Names:</strong> {selectedForm.proxy_full_names}</p>
                    <p><strong>Surname:</strong> {selectedForm.proxy_surname}</p>
                    {selectedForm.proxy_membership_number && (
                      <p><strong>Membership #:</strong> {selectedForm.proxy_membership_number}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> <span className="capitalize">{selectedForm.appointment_type}</span></p>
                    <p><strong>Signed at:</strong> {selectedForm.signed_at}</p>
                    <p><strong>Signature Date:</strong> {selectedForm.signature_date}</p>
                  </div>
                </div>

                {selectedForm.appointment_type === 'instructional' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Voting Instructions</h3>
                    <div className="space-y-2 text-sm">
                      {selectedForm.trustee_remuneration && (
                        <p><strong>Trustee Remuneration:</strong> <span className="capitalize">{selectedForm.trustee_remuneration}</span></p>
                      )}
                      {selectedForm.remuneration_policy && (
                        <p><strong>Remuneration Policy:</strong> <span className="capitalize">{selectedForm.remuneration_policy}</span></p>
                      )}
                      {selectedForm.auditors_appointment && (
                        <p><strong>Auditors Appointment:</strong> <span className="capitalize">{selectedForm.auditors_appointment}</span></p>
                      )}
                      {selectedForm.agm_motions && (
                        <p><strong>AGM Motions:</strong> <span className="capitalize">{selectedForm.agm_motions}</span></p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(selectedForm.candidate1 || selectedForm.candidate2 || selectedForm.candidate3) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Trustee Candidates</h3>
                  <div className="space-y-1 text-sm">
                    {selectedForm.candidate1 && <p>1. {selectedForm.candidate1}</p>}
                    {selectedForm.candidate2 && <p>2. {selectedForm.candidate2}</p>}
                    {selectedForm.candidate3 && <p>3. {selectedForm.candidate3}</p>}
                  </div>
                </div>
              )}

              {selectedForm.approval_status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reason for rejection..."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApprove(selectedForm)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleReject(selectedForm)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {selectedForm.approval_status === 'rejected' && selectedForm.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-700">{selectedForm.rejection_reason}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Rejected on {new Date(selectedForm.reviewed_at!).toLocaleString()}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminProxyForms;