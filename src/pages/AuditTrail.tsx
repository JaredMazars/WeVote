import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Download,
  Eye,
  User,
  Vote,
  Users,
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  action_type: string;
  action_category: string;
  description: string;
  entity_type: string;
  entity_id: string;
  metadata: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure' | 'warning';
  created_at: string;
}

interface Filters {
  search: string;
  category: string;
  action_type: string;
  status: string;
  start_date: string;
  end_date: string;
}

const categoryColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  AUTH: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-700',
    icon: <Shield className="h-4 w-4" />
  },
  VOTE: { 
    bg: 'bg-green-100', 
    text: 'text-green-700',
    icon: <Vote className="h-4 w-4" />
  },
  PROXY: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-700',
    icon: <Users className="h-4 w-4" />
  },
  ADMIN: { 
    bg: 'bg-red-100', 
    text: 'text-red-700',
    icon: <Settings className="h-4 w-4" />
  },
  TIMER: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-700',
    icon: <Clock className="h-4 w-4" />
  },
  SYSTEM: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700',
    icon: <Settings className="h-4 w-4" />
  }
};

const statusIcons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  failure: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />
};

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    action_type: '',
    status: '',
    start_date: '',
    end_date: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const categories = [
    { value: 'AUTH', label: 'Authentication' },
    { value: 'VOTE', label: 'Voting' },
    { value: 'PROXY', label: 'Proxy Management' },
    { value: 'ADMIN', label: 'Administration' },
    { value: 'TIMER', label: 'AGM Timer' },
    { value: 'SYSTEM', label: 'System' }
  ];

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { action_category: filters.category }),
        ...(filters.action_type && { action_type: filters.action_type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date })
      });

      const response = await fetch(`http://localhost:3001/api/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          pages: result.pagination.pages
        }));
      } else {
        setError(result.message || 'Failed to fetch audit logs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { action_category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        limit: '10000' // Export all matching records
      });

      const response = await fetch(`http://localhost:3001/api/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        // Convert to CSV
        const csv = convertToCSV(result.data);
        downloadCSV(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert('Failed to export logs');
    }
  };

  const convertToCSV = (data: AuditLog[]) => {
    const headers = ['Date/Time', 'User', 'Email', 'Category', 'Action', 'Description', 'Status', 'IP Address'];
    const rows = data.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_name || 'System',
      log.user_email || 'N/A',
      log.action_category,
      log.action_type,
      log.description,
      log.status,
      log.ip_address || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#464B4B] mb-2 flex items-center space-x-3">
                <Shield className="h-10 w-10 text-[#0072CE]" />
                <span>Audit Trail</span>
              </h1>
              <p className="text-[#464B4B]/70">
                Comprehensive system activity logging and monitoring
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-[#0072CE] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#171C8F] transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Export Logs</span>
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="warning">Warning</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0072CE] focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#0072CE] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-red-600">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Shield className="h-16 w-16 mb-4 text-gray-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F4F4F4] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">
                        Date & Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#464B4B]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => {
                      const categoryStyle = categoryColors[log.action_category] || categoryColors.SYSTEM;
                      
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#464B4B]">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-[#464B4B]">
                                  {log.user_name || 'System'}
                                </div>
                                <div className="text-xs text-gray-500">{log.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
                              {categoryStyle.icon}
                              <span>{log.action_category}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#464B4B]">
                            {log.action_type.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#464B4B] max-w-md truncate">
                            {log.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {statusIcons[log.status]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => viewDetails(log)}
                              className="flex items-center space-x-1 text-[#0072CE] hover:text-[#171C8F] text-sm font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-[#F4F4F4] px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-[#464B4B]">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-[#464B4B]">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Audit Log Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Date & Time</label>
                  <p className="text-[#464B4B] mt-1">{formatDate(selectedLog.created_at)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">User</label>
                    <p className="text-[#464B4B] mt-1">{selectedLog.user_name || 'System'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-[#464B4B] mt-1">{selectedLog.user_email || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Category</label>
                    <p className="text-[#464B4B] mt-1">{selectedLog.action_category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Action Type</label>
                    <p className="text-[#464B4B] mt-1">{selectedLog.action_type}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Description</label>
                  <p className="text-[#464B4B] mt-1">{selectedLog.description}</p>
                </div>

                {selectedLog.entity_type && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Entity Type</label>
                      <p className="text-[#464B4B] mt-1">{selectedLog.entity_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Entity ID</label>
                      <p className="text-[#464B4B] mt-1">{selectedLog.entity_id}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">IP Address</label>
                    <p className="text-[#464B4B] mt-1">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Status</label>
                    <div className="mt-1 flex items-center space-x-2">
                      {statusIcons[selectedLog.status]}
                      <span className="text-[#464B4B] capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                </div>

                {selectedLog.metadata && selectedLog.metadata !== '{}' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Additional Data</label>
                    <div className="mt-1 bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs text-[#464B4B] whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog.user_agent && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">User Agent</label>
                    <p className="text-xs text-[#464B4B] mt-1 break-all">{selectedLog.user_agent}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
