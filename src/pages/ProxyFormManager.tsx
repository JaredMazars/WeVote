import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Share2, 
  Eye, 
  Download, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProxyForm {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'draft';
  submissionCount: number;
  maxSubmissions?: number;
  shareableLink: string;
  createdBy: string;
}

const ProxyFormManager: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<ProxyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFormData, setNewFormData] = useState({
    title: '',
    description: '',
    expiresAt: '',
    maxSubmissions: ''
  });

  // Mock data for demonstration
  const mockForms: ProxyForm[] = [
    {
      id: 'form-1',
      title: 'AGM 2025 Proxy Appointment Form',
      description: 'Official proxy appointment form for the Annual General Meeting 2025',
      createdAt: new Date('2025-01-15'),
      expiresAt: new Date('2025-06-19'),
      status: 'active',
      submissionCount: 47,
      maxSubmissions: 500,
      shareableLink: `${window.location.origin}/proxy-form/form-1`,
      createdBy: 'Admin User'
    },
    {
      id: 'form-2',
      title: 'Special Resolution Proxy Form',
      description: 'Proxy form for special resolution voting',
      createdAt: new Date('2025-01-10'),
      expiresAt: new Date('2025-03-15'),
      status: 'active',
      submissionCount: 23,
      maxSubmissions: 200,
      shareableLink: `${window.location.origin}/proxy-form/form-2`,
      createdBy: 'Admin User'
    },
    {
      id: 'form-3',
      title: 'Board Election Proxy Form',
      description: 'Proxy appointment for board member elections',
      createdAt: new Date('2024-12-20'),
      expiresAt: new Date('2025-01-20'),
      status: 'expired',
      submissionCount: 156,
      maxSubmissions: 300,
      shareableLink: `${window.location.origin}/proxy-form/form-3`,
      createdBy: 'Admin User'
    }
  ];

  useEffect(() => {
    // Simulate loading forms
    const timer = setTimeout(() => {
      setForms(mockForms);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const createNewForm = async () => {
    if (!newFormData.title || !newFormData.expiresAt) {
      alert('Please fill in required fields');
      return;
    }

    const newForm: ProxyForm = {
      id: `form-${Date.now()}`,
      title: newFormData.title,
      description: newFormData.description,
      createdAt: new Date(),
      expiresAt: new Date(newFormData.expiresAt),
      status: 'active',
      submissionCount: 0,
      maxSubmissions: newFormData.maxSubmissions ? parseInt(newFormData.maxSubmissions) : undefined,
      shareableLink: `${window.location.origin}/proxy-form/form-${Date.now()}`,
      createdBy: 'Current User'
    };

    setForms(prev => [newForm, ...prev]);
    setShowCreateModal(false);
    setNewFormData({ title: '', description: '', expiresAt: '', maxSubmissions: '' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proxy forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Proxy Form Manager</h1>
              <p className="text-gray-600">Create and manage proxy appointment forms for AGM voting</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Form</span>
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Forms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.reduce((sum, form) => sum + form.submissionCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expired Forms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.status === 'expired').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Forms List */}
        <div className="space-y-6">
          {forms.map((form) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{form.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(form.status)}`}>
                      {getStatusIcon(form.status)}
                      <span className="capitalize">{form.status}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{form.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">{formatDate(form.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expires</p>
                      <p className="font-medium text-gray-900">{formatDate(form.expiresAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submissions</p>
                      <p className="font-medium text-gray-900">
                        {form.submissionCount}
                        {form.maxSubmissions && ` / ${form.maxSubmissions}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium text-gray-900">{form.createdBy}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {form.maxSubmissions && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Submission Progress</span>
                        <span>{Math.round((form.submissionCount / form.maxSubmissions) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((form.submissionCount / form.maxSubmissions) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Shareable Link */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 mb-1">Shareable Link:</p>
                        <p className="text-sm font-mono text-gray-800 truncate">{form.shareableLink}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(form.shareableLink)}
                        className="ml-3 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Copy Link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-6">
                  <button
                    onClick={() => navigate(`/proxy-form/${form.id}`)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                  
                  <button
                    onClick={() => window.open(form.shareableLink, '_blank')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open</span>
                  </button>
                  
                  <button
                    onClick={() => copyToClipboard(form.shareableLink)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {forms.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proxy forms found</h3>
            <p className="text-gray-500 mb-6">Create your first proxy appointment form to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Form</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Proxy Form</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Form Title *</label>
                  <input
                    type="text"
                    value={newFormData.title}
                    onChange={(e) => setNewFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., AGM 2025 Proxy Form"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newFormData.description}
                    onChange={(e) => setNewFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the form purpose"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date *</label>
                  <input
                    type="date"
                    value={newFormData.expiresAt}
                    onChange={(e) => setNewFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Submissions (Optional)</label>
                  <input
                    type="number"
                    value={newFormData.maxSubmissions}
                    onChange={(e) => setNewFormData(prev => ({ ...prev, maxSubmissions: e.target.value }))}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewForm}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Form
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProxyFormManager; 