import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import api from '../services/api';
import { pdfService } from '../services/pdfExport';
import * as XLSX from 'xlsx';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  dataHash: string;
  previousHash: string;
}

interface AttendanceRecord {
  userId: string;
  userName: string;
  checkedInAt: string;
  ipAddress: string;
  status: 'present' | 'proxy' | 'absent';
}

export default function AuditorPortal() {
  const [activeTab, setActiveTab] = useState<'logs' | 'attendance' | 'reports'>('logs');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'warning'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange] = useState({ start: '', end: '' });
  const [_isLoading, setIsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Quorum tracking
  const [quorumThreshold, setQuorumThreshold] = useState(50);
  const [totalEligible, setTotalEligible] = useState(0);
  const [liveAttendanceCount, setLiveAttendanceCount] = useState(0);
  const [quorumMet, setQuorumMet] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const attendancePercentage = totalEligible > 0 ? (liveAttendanceCount / totalEligible) * 100 : 0;
    setQuorumMet(attendancePercentage >= quorumThreshold);
  }, [liveAttendanceCount, totalEligible, quorumThreshold]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get active session first
      const sessionRes = await api.getActiveSession();
      const sessions = (sessionRes.data as any)?.sessions || (Array.isArray(sessionRes.data) ? sessionRes.data : []);
      const session = sessions[0];
      const sessionId = session?.SessionID || session?.sessionId || null;
      setActiveSessionId(sessionId);

      await Promise.all([
        loadAuditLogs(),
        loadAttendance(sessionId),
        sessionId ? loadQuorum(sessionId) : Promise.resolve(),
      ]);
    } catch (err) {
      console.error('Error loading auditor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs({ limit: 200 });
      if (res.success && res.data) {
        const raw = Array.isArray(res.data) ? res.data : (res.data as any).logs || [];
        const mapped: AuditLog[] = raw.map((log: any) => ({
          id: (log.LogID || log.id)?.toString(),
          timestamp: log.CreatedAt || log.timestamp,
          userId: (log.UserID || log.userId)?.toString(),
          userName: log.UserName || log.userName || `User ${log.UserID}`,
          action: log.Action || log.action,
          description: log.Details || log.description || '',
          ipAddress: log.IPAddress || log.ipAddress || '',
          userAgent: log.UserAgent || log.userAgent || '',
          status: (log.Status || 'success') as AuditLog['status'],
          dataHash: log.DataHash || '',
          previousHash: log.PreviousHash || '',
        }));
        setAuditLogs(mapped);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const loadAttendance = async (sessionId: number | null) => {
    if (!sessionId) return;
    try {
      const res = await api.getAttendance(sessionId);
      if (res.success && res.data) {
        const raw = Array.isArray(res.data) ? res.data : (res.data as any).records || [];
        const mapped: AttendanceRecord[] = raw.map((r: any) => ({
          userId: (r.UserID || r.userId)?.toString(),
          userName: r.UserName || r.userName || `User ${r.UserID}`,
          checkedInAt: r.CheckedInAt || r.checkedInAt || new Date().toISOString(),
          ipAddress: r.IPAddress || r.ipAddress || '',
          status: (r.Status || 'present') as AttendanceRecord['status'],
        }));
        setAttendance(mapped);
        setLiveAttendanceCount(mapped.filter(r => r.status === 'present' || r.status === 'proxy').length);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  const loadQuorum = async (sessionId: number) => {
    try {
      const res = await api.getQuorum(sessionId);
      if (res.success && res.data) {
        const d = res.data as any;
        setTotalEligible(d.totalEligible ?? d.total_eligible ?? 0);
        setQuorumThreshold(d.quorumThreshold ?? d.quorum_threshold ?? 50);
        setLiveAttendanceCount(d.presentCount ?? d.present_count ?? 0);
      }
    } catch (err) {
      console.error('Failed to load quorum:', err);
    }
  };

  // Refresh attendance every 30 seconds
  useEffect(() => {
    if (!activeSessionId) return;
    const interval = setInterval(() => {
      loadAttendance(activeSessionId);
      loadQuorum(activeSessionId);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  const verifyLogIntegrity = (): boolean => {
    // Verify tamper-evident chain
    for (let i = 1; i < auditLogs.length; i++) {
      const expectedPrevHash = auditLogs[i - 1].dataHash;
      if (auditLogs[i].previousHash !== expectedPrevHash) {
        return false;
      }
    }
    return true;
  };

  const exportAuditLogsToExcel = () => {
    const data = filteredLogs.map(log => ({
      'Log ID': log.id,
      'Timestamp': new Date(log.timestamp).toLocaleString(),
      'User ID': log.userId,
      'User Name': log.userName,
      'Action': log.action,
      'Description': log.description,
      'IP Address': log.ipAddress,
      'Status': log.status,
      'Data Hash': log.dataHash,
      'Previous Hash': log.previousHash,
      'Integrity': verifyLogIntegrity() ? 'VERIFIED' : 'TAMPERED'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    
    // Auto-size columns
    const maxWidth = data.reduce((w, r) => Math.max(w, String(r['Description']).length), 10);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: maxWidth },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 }
    ];

    XLSX.writeFile(wb, `AuditLogs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportAttendanceToExcel = () => {
    const data = attendance.map(record => ({
      'User ID': record.userId,
      'User Name': record.userName,
      'Check-in Time': new Date(record.checkedInAt).toLocaleString(),
      'IP Address': record.ipAddress,
      'Status': record.status.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    // Add summary row
    XLSX.utils.sheet_add_json(ws, [
      {},
      { 'User ID': 'SUMMARY' },
      { 'User ID': 'Total Eligible', 'User Name': totalEligible },
      { 'User ID': 'Present', 'User Name': liveAttendanceCount },
      { 'User ID': 'Attendance %', 'User Name': `${((liveAttendanceCount / totalEligible) * 100).toFixed(1)}%` },
      { 'User ID': 'Quorum Threshold', 'User Name': `${quorumThreshold}%` },
      { 'User ID': 'Quorum Status', 'User Name': quorumMet ? 'MET ✓' : 'NOT MET ✗' }
    ], { origin: -1, skipHeader: true });

    XLSX.writeFile(wb, `Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportAGMResultsPDF = async () => {
    try {
      const sid = activeSessionId;
      const [ candRes, resRes ] = await Promise.all([
        sid ? api.getCandidateResults(sid) : Promise.resolve({ data: null }),
        sid ? api.getResolutionResults(sid) : Promise.resolve({ data: null }),
      ]);

      const rawCandidates: any[] = (candRes.data as any)?.results || (candRes.data as any)?.candidates || [];
      const rawResolutions: any[] = (resRes.data as any)?.results || (resRes.data as any)?.resolutions || [];

      const totalCandVotes = rawCandidates.reduce((s: number, c: any) => s + (c.VoteCount ?? c.votes ?? 0), 0);

      pdfService.generateAGMReport({
        sessionTitle: (candRes.data as any)?.sessionTitle || 'Annual General Meeting',
        generatedAt: new Date(),
        candidates: rawCandidates.map((c: any) => ({
          name: c.FullName ?? c.name ?? 'Unknown',
          position: c.Position ?? c.position ?? '',
          votes: c.VoteCount ?? c.votes ?? 0,
          percentage: totalCandVotes > 0 ? (((c.VoteCount ?? c.votes ?? 0) / totalCandVotes) * 100) : 0,
        })),
        resolutions: rawResolutions.map((r: any) => ({
          number: r.ResolutionNumber ?? r.number ?? '',
          title: r.ResolutionTitle ?? r.title ?? 'Resolution',
          yes: r.YesVotes ?? r.yes ?? 0,
          no: r.NoVotes ?? r.no ?? 0,
          abstain: r.AbstainVotes ?? r.abstain ?? 0,
          totalVotes: (r.YesVotes ?? r.yes ?? 0) + (r.NoVotes ?? r.no ?? 0) + (r.AbstainVotes ?? r.abstain ?? 0),
          passed: (r.YesVotes ?? r.yes ?? 0) > (r.NoVotes ?? r.no ?? 0),
        })),
      });
    } catch (err) {
      console.error('Failed to generate AGM PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const exportFullAuditReport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Audit Logs
    const logsData = auditLogs.map(log => ({
      'Log ID': log.id,
      'Timestamp': new Date(log.timestamp).toLocaleString(),
      'User': log.userName,
      'Action': log.action,
      'Description': log.description,
      'Status': log.status,
      'Data Hash': log.dataHash
    }));
    const logsWs = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, logsWs, 'Audit Logs');

    // Sheet 2: Attendance
    const attendanceData = attendance.map(record => ({
      'User': record.userName,
      'Check-in Time': new Date(record.checkedInAt).toLocaleString(),
      'Status': record.status.toUpperCase()
    }));
    const attendanceWs = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(wb, attendanceWs, 'Attendance');

    // Sheet 3: Summary
    const summary = [
      { 'Metric': 'Total Audit Logs', 'Value': auditLogs.length },
      { 'Metric': 'Successful Actions', 'Value': auditLogs.filter(l => l.status === 'success').length },
      { 'Metric': 'Failed Actions', 'Value': auditLogs.filter(l => l.status === 'failed').length },
      { 'Metric': 'Warning Actions', 'Value': auditLogs.filter(l => l.status === 'warning').length },
      {},
      { 'Metric': 'Total Eligible Voters', 'Value': totalEligible },
      { 'Metric': 'Present Voters', 'Value': liveAttendanceCount },
      { 'Metric': 'Attendance Percentage', 'Value': `${((liveAttendanceCount / totalEligible) * 100).toFixed(1)}%` },
      { 'Metric': 'Quorum Threshold', 'Value': `${quorumThreshold}%` },
      { 'Metric': 'Quorum Status', 'Value': quorumMet ? 'MET ✓' : 'NOT MET ✗' },
      {},
      { 'Metric': 'Log Integrity Check', 'Value': verifyLogIntegrity() ? 'VERIFIED ✓' : 'TAMPERED ✗' },
      { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() },
      { 'Metric': 'Generated By', 'Value': 'Auditor Portal' }
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    XLSX.writeFile(wb, `FullAuditReport_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const logDate = new Date(log.timestamp);
      matchesDate = logDate >= new Date(dateRange.start) && logDate <= new Date(dateRange.end);
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  const quorumPercentage = (liveAttendanceCount / totalEligible) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0072CE] to-[#171C8F] bg-clip-text text-transparent mb-2">
            🔍 Auditor Portal
          </h1>
          <p className="text-slate-600">Read-only access • Tamper-evident logs • Live monitoring</p>
        </div>

        {/* Live Quorum Tracker */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">📊 Live Quorum Tracker</h2>
            <div className={`px-4 py-2 rounded-full font-bold text-lg ${
              quorumMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {quorumMet ? '✓ QUORUM MET' : '✗ QUORUM NOT MET'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-semibold mb-1">Total Eligible</p>
              <p className="text-3xl font-bold text-blue-900">{totalEligible}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 font-semibold mb-1">Present</p>
              <p className="text-3xl font-bold text-green-900">{liveAttendanceCount}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-semibold mb-1">Attendance</p>
              <p className="text-3xl font-bold text-blue-900">{quorumPercentage.toFixed(1)}%</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-orange-600 font-semibold mb-1">Threshold</p>
              <p className="text-3xl font-bold text-orange-900">{quorumThreshold}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Attendance Progress</span>
              <span>{liveAttendanceCount} / {totalEligible}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 flex items-center justify-center text-white text-xs font-bold ${
                  quorumMet ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}
                style={{ width: `${Math.min(quorumPercentage, 100)}%` }}
              >
                {quorumPercentage >= 10 && `${quorumPercentage.toFixed(1)}%`}
              </div>
            </div>
          </div>

          {/* Threshold Marker */}
          <div className="relative h-2 mb-2">
            <div 
              className="absolute top-0 w-1 h-4 bg-orange-500"
              style={{ left: `${quorumThreshold}%` }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-orange-600 whitespace-nowrap">
                Quorum: {quorumThreshold}%
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📝 Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              👥 Live Attendance
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📊 Export Reports
            </button>
          </div>
        </div>

        {/* Audit Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Integrity Check */}
            <div className={`rounded-2xl shadow-xl p-6 ${
              verifyLogIntegrity() ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {verifyLogIntegrity() ? '✓ Log Integrity Verified' : '✗ Log Tampering Detected'}
                  </h3>
                  <p className="text-slate-600">
                    {verifyLogIntegrity() 
                      ? 'All audit logs are tamper-evident and verified'
                      : 'Warning: Log chain has been compromised'}
                  </p>
                </div>
                <div className="text-5xl">
                  {verifyLogIntegrity() ? '🔒' : '⚠️'}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Actions</label>
                  <button
                    onClick={exportAuditLogsToExcel}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    📥 Export to Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Timestamp</th>
                    <th className="px-6 py-4 text-left">User</th>
                    <th className="px-6 py-4 text-left">Action</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 font-semibold">{log.userName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{log.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{log.dataHash.substring(0, 16)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Live Attendance Tracking</h3>
                <button
                  onClick={exportAttendanceToExcel}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  📥 Export to Excel
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border-2 border-slate-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">User Name</th>
                      <th className="px-6 py-4 text-left">Check-in Time</th>
                      <th className="px-6 py-4 text-left">IP Address</th>
                      <th className="px-6 py-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, index) => (
                      <tr key={record.userId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 font-semibold">{record.userName}</td>
                        <td className="px-6 py-4">{new Date(record.checkedInAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-mono">{record.ipAddress}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'proxy' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">📊 Export Audit Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 cursor-pointer border-2 border-purple-200"
                  onClick={exportAGMResultsPDF}
                >
                  <div className="text-5xl mb-4">📄</div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">AGM Results PDF</h4>
                  <p className="text-slate-600 mb-4">Official AGM report with candidates & resolutions — print or save as PDF</p>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Generate PDF
                  </button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 cursor-pointer border-2 border-blue-200"
                  onClick={exportAuditLogsToExcel}
                >
                  <div className="text-5xl mb-4">📝</div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Audit Logs</h4>
                  <p className="text-slate-600 mb-4">Complete audit trail with tamper-evident hashing</p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Download Excel
                  </button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 cursor-pointer border-2 border-green-200"
                  onClick={exportAttendanceToExcel}
                >
                  <div className="text-5xl mb-4">👥</div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Attendance Report</h4>
                  <p className="text-slate-600 mb-4">Live attendance with quorum tracking</p>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    Download Excel
                  </button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 cursor-pointer border-2 border-blue-200"
                  onClick={exportFullAuditReport}
                >
                  <div className="text-5xl mb-4">📊</div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Full Audit Report</h4>
                  <p className="text-slate-600 mb-4">Comprehensive report with all data</p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Download Excel
                  </button>
                </motion.div>
              </div>

              <div className="mt-8 p-6 bg-slate-50 rounded-xl">
                <h4 className="font-bold text-slate-900 mb-3">📋 Report Contents:</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Audit Logs:</strong> All system actions with timestamps, users, and tamper-evident hashes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Attendance:</strong> Real-time check-ins with IP addresses and quorum status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Summary:</strong> Key metrics, integrity checks, and compliance data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Format:</strong> Microsoft Excel (.xlsx) with multiple worksheets</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
