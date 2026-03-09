import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Users, Calendar, Shield, BarChart3, Settings,
  RefreshCw, CheckCircle, LogOut, Eye
} from 'lucide-react';
import Header from '../components/Header';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface SystemStats {
  totalEmployees: number;
  activeSessions: number;
  totalVotesCast: number;
  activeAdmins: number;
}

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalEmployees: 0,
    activeSessions: 0,
    totalVotesCast: 0,
    activeAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const [empRes, sessRes] = await Promise.all([
        api.getEmployees(),
        api.getSessions(),
      ]);
      const employees: any[] = empRes.success && Array.isArray(empRes.data) ? empRes.data : [];
      const sessions: any[] = sessRes.success && Array.isArray(sessRes.data) ? sessRes.data : [];
      const active = sessions.filter((s: any) => s.status === 'active' || s.Status === 'active');
      const admins = employees.filter((e: any) =>
        e.role === 'admin' || e.role === 'super_admin' || e.Role === 'admin' || e.Role === 'super_admin'
      );
      setStats({
        totalEmployees: employees.length,
        activeSessions: active.length,
        totalVotesCast: active.reduce((sum: number, s: any) => sum + (s.totalVotesCast || s.TotalVotesCast || 0), 0),
        activeAdmins: admins.length,
      });
    } catch (err) {
      console.error('Failed to load system stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleRefresh = () => { setRefreshing(true); loadStats(); };

  const statCards = [
    { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50' },
    { label: 'Active Sessions', value: stats.activeSessions, icon: Calendar, color: 'from-green-500 to-green-700', bg: 'bg-green-50' },
    { label: 'Votes Cast (Active)', value: stats.totalVotesCast, icon: BarChart3, color: 'from-purple-500 to-purple-700', bg: 'bg-purple-50' },
    { label: 'Active Admins', value: stats.activeAdmins, icon: Shield, color: 'from-orange-500 to-orange-700', bg: 'bg-orange-50' },
  ];

  const quickActions = [
    { label: 'Super Admin Dashboard', icon: Crown, path: '/superadmin', color: 'text-yellow-600', bg: 'bg-yellow-50 hover:bg-yellow-100' },
    { label: 'Manage Employees', icon: Users, path: '/admin-manage', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
    { label: 'Admin Dashboard', icon: Settings, path: '/admin', color: 'text-gray-600', bg: 'bg-gray-50 hover:bg-gray-100' },
    { label: 'Voting Results', icon: BarChart3, path: '/voting/results', color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
    { label: 'Auditor Portal', icon: Eye, path: '/auditor', color: 'text-teal-600', bg: 'bg-teal-50 hover:bg-teal-100' },
    { label: 'Admin Approvals', icon: CheckCircle, path: '/admin/approvals', color: 'text-green-600', bg: 'bg-green-50 hover:bg-green-100' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
              <p className="text-gray-500 mt-1">System overview and administration</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/superadmin')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-xl text-white shadow-sm transition-all"
            >
              <Crown className="w-4 h-4" />
              <span>Full Dashboard</span>
            </motion.button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <card.icon className={`w-5 h-5 bg-gradient-to-r ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-[#0072CE]" />
            <span>Quick Actions</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.path)}
                className={`flex items-center space-x-3 p-4 rounded-xl ${action.bg} border border-transparent transition-all text-left`}
              >
                <action.icon className={`w-5 h-5 ${action.color} flex-shrink-0`} />
                <span className={`text-sm font-semibold ${action.color}`}>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-[#0072CE]" />
            <span>System Status</span>
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Authentication Service', status: 'Operational' },
              { label: 'Voting Engine', status: 'Operational' },
              { label: 'Blockchain Ledger', status: 'Operational' },
              { label: 'Email Service', status: 'Operational' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">{item.label}</span>
                <span className="flex items-center space-x-2 text-green-600 font-semibold text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{item.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="mt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
