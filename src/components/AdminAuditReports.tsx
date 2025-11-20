import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Search, 
  Eye, 
  BarChart3,
  Users,
  MessageSquare,
  Vote,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface AuditReport {
  id: string;
  title: string;
  type: 'voting' | 'chat' | 'user_activity' | 'system' | 'comprehensive';
  dateRange: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  fileSize: string;
  recordCount: number;
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    criticalIssues: number;
    averageResponseTime?: number;
  };
}

interface ReportFilter {
  type: string;
  dateRange: string;
  status: string;
  searchTerm: string;
}

const AdminAuditReports: React.FC = () => {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>({
    type: 'all',
    dateRange: 'last_30_days',
    status: 'all',
    searchTerm: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('comprehensive');

  // Mock data for demonstration
  const mockReports: AuditReport[] = [
    {
      id: 'report-1',
      title: 'Comprehensive AGM Audit Report - January 2025',
      type: 'comprehensive',
      dateRange: {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31')
      },
      generatedAt: new Date('2025-01-31T23:59:59'),
      generatedBy: 'System Administrator',
      status: 'completed',
      fileSize: '2.4 MB',
      recordCount: 15420,
      summary: {
        totalEvents: 15420,
        uniqueUsers: 1247,
        criticalIssues: 3,
        averageResponseTime: 1.2
      }
    },
    {
      id: 'report-2',
      title: 'Voting Activity Report - Employee Elections',
      type: 'voting',
      dateRange: {
        start: new Date('2025-01-15'),
        end: new Date('2025-01-25')
      },
      generatedAt: new Date('2025-01-25T18:30:00'),
      generatedBy: 'Election Committee',
      status: 'completed',
      fileSize: '890 KB',
      recordCount: 3456,
      summary: {
        totalEvents: 3456,
        uniqueUsers: 892,
        criticalIssues: 0
      }
    },
    {
      id: 'report-3',
      title: 'Chat Support Analysis - Q1 2025',
      type: 'chat',
      dateRange: {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-20')
      },
      generatedAt: new Date('2025-01-20T14:15:00'),
      generatedBy: 'Support Manager',
      status: 'completed',
      fileSize: '1.1 MB',
      recordCount: 2890,
      summary: {
        totalEvents: 2890,
        uniqueUsers: 456,
        criticalIssues: 1,
        averageResponseTime: 3.4
      }
    },
    {
      id: 'report-4',
      title: 'User Activity Report - Current Week',
      type: 'user_activity',
      dateRange: {
        start: new Date('2025-01-13'),
        end: new Date('2025-01-19')
      },
      generatedAt: new Date('2025-01-19T09:00:00'),
      generatedBy: 'Data Analyst',
      status: 'generating',
      fileSize: 'Calculating...',
      recordCount: 0,
      summary: {
        totalEvents: 0,
        uniqueUsers: 0,
        criticalIssues: 0
      }
    }
  ];

  useEffect(() => {
    // Simulate loading reports
    const timer = setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const generateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const newReport: AuditReport = {
        id: `report-${Date.now()}`,
        title: `${getReportTypeLabel(selectedReportType)} - ${new Date().toLocaleDateString()}`,
        type: selectedReportType as any,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        },
        generatedAt: new Date(),
        generatedBy: 'Current User',
        status: 'completed',
        fileSize: '1.8 MB',
        recordCount: Math.floor(Math.random() * 10000) + 1000,
        summary: {
          totalEvents: Math.floor(Math.random() * 10000) + 1000,
          uniqueUsers: Math.floor(Math.random() * 1000) + 100,
          criticalIssues: Math.floor(Math.random() * 5),
          averageResponseTime: Math.random() * 5 + 0.5
        }
      };

      setReports(prev => [newReport, ...prev]);
      setIsGenerating(false);
    }, 3000);
  };

  const getReportTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      comprehensive: 'Comprehensive Audit Report',
      voting: 'Voting Activity Report',
      chat: 'Chat Support Report',
      user_activity: 'User Activity Report',
      system: 'System Performance Report'
    };
    return labels[type] || 'Custom Report';
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'voting': return <Vote className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'user_activity': return <Users className="h-4 w-4" />;
      case 'system': return <Activity className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const downloadReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    // Simulate download
    console.log(`Downloading report ${reportId} in ${format} format`);
    
    // In real implementation, this would trigger a download
    const link = document.createElement('a');
    link.href = `/api/reports/${reportId}/download?format=${format}`;
    link.download = `audit-report-${reportId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(report => {
    const matchesType = filter.type === 'all' || report.type === filter.type;
    const matchesStatus = filter.status === 'all' || report.status === filter.status;
    const matchesSearch = report.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
                         report.generatedBy.toLowerCase().includes(filter.searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Reports</h1>
              <p className="text-gray-600">Generate and manage comprehensive audit reports for AGM activities</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="comprehensive">Comprehensive Report</option>
                <option value="voting">Voting Activity</option>
                <option value="chat">Chat Support</option>
                <option value="user_activity">User Activity</option>
                <option value="system">System Performance</option>
              </select>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateReport}
                disabled={isGenerating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Generate Report</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="comprehensive">Comprehensive</option>
                <option value="voting">Voting</option>
                <option value="chat">Chat</option>
                <option value="user_activity">User Activity</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filter.dateRange}
                onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="generating">Generating</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filter.searchTerm}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search reports..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Generated by {report.generatedBy}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{report.generatedAt.toLocaleDateString()}</span>
                        </div>
                        <span>•</span>
                        <span>{report.fileSize}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Total Events</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {report.summary.totalEvents.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Unique Users</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {report.summary.uniqueUsers.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-700">Critical Issues</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {report.summary.criticalIssues}
                      </p>
                    </div>
                    
                    {report.summary.averageResponseTime && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Avg Response</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {report.summary.averageResponseTime.toFixed(1)}s
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                  
                  {report.status === 'completed' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => console.log('View report', report.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <div className="relative group">
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Download className="h-4 w-4" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => downloadReport(report.id, 'pdf')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          >
                            Download PDF
                          </button>
                          <button
                            onClick={() => downloadReport(report.id, 'excel')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Download Excel
                          </button>
                          <button
                            onClick={() => downloadReport(report.id, 'csv')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                          >
                            Download CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {report.status === 'generating' && (
                    <div className="flex items-center space-x-2 text-sm text-yellow-600">
                      <div className="w-4 h-4 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                      <span>Generating...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">Try adjusting your filters or generate a new report.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditReports;