// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'router-dom';
// import {
//   Users,
//   Calendar,
//   Settings,
//   Shield,
//   Plus,
//   Edit2,
//   Trash2,
//   CheckCircle,
//   Building2,
//   UserCog,
//   Play,
//   Square,
//   Eye,
//   BarChart3,
//   Search,
//   Filter,
//   AlertCircle,
//   LogOut,
//   Crown
// } from 'lucide-react';
// import Header from '../components/Header';

// interface Organization {
//   id: number;
//   name: string;
//   domain: string;
//   subscriptionTier: string;
//   maxVoters: number;
//   maxMeetingsPerYear: number;
//   activeAdmins: number;
//   activeSessions: number;
//   isActive: boolean;
//   createdAt: string;
// }

// interface AGMSession {
//   id: number;
//   organizationId: number;
//   organizationName: string;
//   title: string;
//   description: string;
//   scheduledStartTime: string;
//   scheduledEndTime: string;
//   actualStartTime?: string;
//   actualEndTime?: string;
//   status: 'scheduled' | 'active' | 'ended' | 'cancelled';
//   quorumRequired: number;
//   totalVoters: number;
//   totalVotesCast: number;
//   assignedAdmins: string[];
//   createdBy: string;
//   createdAt: string;
// }

// interface Admin {
//   id: number;
//   email: string;
//   firstName: string;
//   lastName: string;
//   organizationId: number;
//   organizationName: string;
//   role: 'admin' | 'auditor';
//   assignedSessions: number;
//   lastLogin?: string;
//   isActive: boolean;
// }

// interface VoteLimit {
//   id: number;
//   sessionId: number;
//   sessionTitle: string;
//   userId: number;
//   userName: string;
//   allocatedVotes: number;
//   reason: string;
//   setBy: string;
//   setAt: string;
// }

// export default function SuperAdminPanel() {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState<'sessions' | 'admins' | 'limits' | 'organizations' | 'settings'>('sessions');
//   const [organizations, setOrganizations] = useState<Organization[]>([]);
//   const [sessions, setSessions] = useState<AGMSession[]>([]);
//   const [admins, setAdmins] = useState<Admin[]>([]);
//   const [voteLimits, setVoteLimits] = useState<VoteLimit[]>([]);
  
//   const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
//   const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
//   const [showSetVoteLimitModal, setShowSetVoteLimitModal] = useState(false);
//   const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  
//   const [selectedSession, setSelectedSession] = useState<AGMSession | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState<string>('all');

//   // Load data
//   useEffect(() => {
//     loadOrganizations();
//     loadSessions();
//     loadAdmins();
//     loadVoteLimits();
//   }, []);

//   const loadOrganizations = () => {
//     const stored = localStorage.getItem('organizations');
//     if (stored) {
//       setOrganizations(JSON.parse(stored));
//     } else {
//       const defaultOrg: Organization = {
//         id: 1,
//         name: 'Forvis Mazars',
//         domain: 'forvismzansi.com',
//         subscriptionTier: 'enterprise',
//         maxVoters: 1000,
//         maxMeetingsPerYear: 999,
//         activeAdmins: 2,
//         activeSessions: 1,
//         isActive: true,
//         createdAt: new Date().toISOString()
//       };
//       setOrganizations([defaultOrg]);
//       localStorage.setItem('organizations', JSON.stringify([defaultOrg]));
//     }
//   };

//   const loadSessions = () => {
//     const stored = localStorage.getItem('agmSessions');
//     if (stored) {
//       setSessions(JSON.parse(stored));
//     }
//   };

//   const loadAdmins = () => {
//     const users = JSON.parse(localStorage.getItem('users') || '[]');
//     const adminUsers = users
//       .filter((u: any) => u.role === 'admin' || u.role === 'auditor')
//       .map((u: any) => ({
//         id: u.id,
//         email: u.email,
//         firstName: u.firstName,
//         lastName: u.lastName,
//         organizationId: 1,
//         organizationName: 'Forvis Mazars',
//         role: u.role,
//         assignedSessions: 0,
//         lastLogin: u.lastLogin,
//         isActive: true
//       }));
//     setAdmins(adminUsers);
//   };

//   const loadVoteLimits = () => {
//     const stored = localStorage.getItem('voteLimits');
//     if (stored) {
//       setVoteLimits(JSON.parse(stored));
//     }
//   };

//   const saveData = (key: string, data: any) => {
//     localStorage.setItem(key, JSON.stringify(data));
//   };

//   // Statistics
//   const stats = {
//     totalOrganizations: organizations.length,
//     activeOrganizations: organizations.filter(o => o.isActive).length,
//     totalSessions: sessions.length,
//     activeSessions: sessions.filter(s => s.status === 'active').length,
//     scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
//     totalAdmins: admins.length,
//     totalVoters: organizations.reduce((sum, org) => sum + org.maxVoters, 0)
//   };

//   // Filtered sessions
//   const filteredSessions = sessions.filter(session => {
//     const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          session.organizationName.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const tabs = [
//     { id: 'sessions', label: 'AGM Sessions', icon: Calendar, count: sessions.length },
//     { id: 'admins', label: 'Admin Management', icon: UserCog, count: admins.length },
//     { id: 'limits', label: 'Vote Limits', icon: Shield, count: voteLimits.length },
//     { id: 'organizations', label: 'Organizations', icon: Building2, count: organizations.length },
//     { id: 'settings', label: 'System Settings', icon: Settings, count: 0 }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
//       <Header />

//       {/* Super Admin Header */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl"
//       >
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
//                 <Crown className="w-10 h-10 text-yellow-300" />
//               </div>
//               <div>
//                 <h1 className="text-4xl font-bold text-white">
//                   Super Admin Control Panel
//                 </h1>
//                 <p className="text-blue-100 mt-2">Complete platform management and configuration</p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-3">
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={() => setShowCreateSessionModal(true)}
//                 className="bg-white text-blue-600 px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow font-medium"
//               >
//                 <Plus className="w-5 h-5" />
//                 <span>Create AGM Session</span>
//               </motion.button>
//               <button
//                 onClick={() => navigate('/')}
//                 className="p-3 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all text-white"
//               >
//                 <LogOut className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           {/* Statistics Cards */}
//           <div className="grid grid-cols-4 gap-4 mt-8">
//             <StatCard
//               icon={Building2}
//               label="Organizations"
//               value={stats.activeOrganizations}
//               total={stats.totalOrganizations}
//               bgColor="bg-white bg-opacity-20 backdrop-blur-sm"
//               textColor="text-white"
//             />
//             <StatCard
//               icon={Calendar}
//               label="Active Sessions"
//               value={stats.activeSessions}
//               total={stats.totalSessions}
//               bgColor="bg-white bg-opacity-20 backdrop-blur-sm"
//               textColor="text-white"
//             />
//             <StatCard
//               icon={UserCog}
//               label="Total Admins"
//               value={stats.totalAdmins}
//               total={stats.totalAdmins}
//               bgColor="bg-white bg-opacity-20 backdrop-blur-sm"
//               textColor="text-white"
//             />
//             <StatCard
//               icon={Users}
//               label="Platform Voters"
//               value={stats.totalVoters}
//               total={stats.totalVoters}
//               bgColor="bg-white bg-opacity-20 backdrop-blur-sm"
//               textColor="text-white"
//             />
//           </div>
//         </div>
//       </motion.div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
//           {/* Tabs */}
//           <div className="flex border-b border-gray-200">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id as any)}
//                 className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all ${
//                   activeTab === tab.id
//                     ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
//                     : 'text-gray-600 hover:bg-gray-50'
//                 }`}
//               >
//                 <tab.icon className="w-5 h-5" />
//                 <span>{tab.label}</span>
//                 {tab.count > 0 && (
//                   <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//                     activeTab === tab.id
//                       ? 'bg-blue-200 text-blue-700'
//                       : 'bg-gray-200 text-gray-600'
//                   }`}>
//                     {tab.count}
//                   </span>
//                 )}
//               </button>
//             ))}
//           </div>

//           {/* Tab Content */}
//           <div className="p-8">
//             {activeTab === 'sessions' && (
//               <SessionsManagement
//                 sessions={filteredSessions}
//                 searchTerm={searchTerm}
//                 setSearchTerm={setSearchTerm}
//                 filterStatus={filterStatus}
//                 setFilterStatus={setFilterStatus}
//                 onCreate={() => setShowCreateSessionModal(true)}
//                 onEdit={(session) => {
//                   setSelectedSession(session);
//                   setShowCreateSessionModal(true);
//                 }}
//                 onDelete={(sessionId) => {
//                   if (confirm('Are you sure you want to delete this AGM session?')) {
//                     const updated = sessions.filter(s => s.id !== sessionId);
//                     setSessions(updated);
//                     saveData('agmSessions', updated);
//                   }
//                 }}
//                 onStart={(sessionId) => {
//                   const updated = sessions.map(s =>
//                     s.id === sessionId
//                       ? { ...s, status: 'active' as const, actualStartTime: new Date().toISOString() }
//                       : s
//                   );
//                   setSessions(updated);
//                   saveData('agmSessions', updated);
//                 }}
//                 onEnd={(sessionId) => {
//                   const updated = sessions.map(s =>
//                     s.id === sessionId
//                       ? { ...s, status: 'ended' as const, actualEndTime: new Date().toISOString() }
//                       : s
//                   );
//                   setSessions(updated);
//                   saveData('agmSessions', updated);
//                 }}
//                 onAssignAdmin={(session) => {
//                   setSelectedSession(session);
//                   setShowAssignAdminModal(true);
//                 }}
//               />
//             )}

//             {activeTab === 'admins' && (
//               <AdminManagement
//                 admins={admins}
//                 sessions={sessions}
//               />
//             )}

//             {activeTab === 'limits' && (
//               <VoteLimitsManagement
//                 voteLimits={voteLimits}
//                 sessions={sessions}
//                 onCreate={() => setShowSetVoteLimitModal(true)}
//                 onDelete={(limitId) => {
//                   const updated = voteLimits.filter(l => l.id !== limitId);
//                   setVoteLimits(updated);
//                   saveData('voteLimits', updated);
//                 }}
//               />
//             )}

//             {activeTab === 'organizations' && (
//               <OrganizationsManagement
//                 organizations={organizations}
//                 onCreate={() => setShowCreateOrgModal(true)}
//                 onEdit={(org) => console.log('Edit org:', org)}
//               />
//             )}

//             {activeTab === 'settings' && (
//               <SystemSettings />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Modals - to be implemented inline below */}
//     </div>
//   );
// }

// // Component: Stat Card
// function StatCard({ icon: Icon, label, value, total, bgColor, textColor }: any) {
//   return (
//     <motion.div
//       whileHover={{ scale: 1.02 }}
//       className={`${bgColor} rounded-xl p-5`}
//     >
//       <div className="flex items-center justify-between">
//         <div>
//           <p className={`text-sm ${textColor} opacity-90`}>{label}</p>
//           <p className={`text-3xl font-bold ${textColor} mt-2`}>
//             {value}
//             {total !== value && <span className="text-lg opacity-75 ml-1">/ {total}</span>}
//           </p>
//         </div>
//         <Icon className={`w-8 h-8 ${textColor} opacity-80`} />
//       </div>
//     </motion.div>
//   );
// }

// // Component: Sessions Management
// function SessionsManagement({
//   sessions,
//   searchTerm,
//   setSearchTerm,
//   filterStatus,
//   setFilterStatus,
//   onCreate,
//   onEdit,
//   onDelete,
//   onStart,
//   onEnd,
//   onAssignAdmin
// }: any) {
//   const statusColors = {
//     scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
//     active: 'bg-green-100 text-green-700 border-green-300',
//     ended: 'bg-gray-100 text-gray-700 border-gray-300',
//     cancelled: 'bg-red-100 text-red-700 border-red-300'
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-900">AGM Sessions Management</h2>
//           <p className="text-gray-600 mt-1">Create and manage voting sessions across all organizations</p>
//         </div>
//       </div>

//       {/* Search and Filter */}
//       <div className="flex items-center space-x-4">
//         <div className="flex-1 relative">
//           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="Search sessions by title or organization..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//           />
//         </div>
//         <select
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//           className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
//         >
//           <option value="all">All Status</option>
//           <option value="scheduled">Scheduled</option>
//           <option value="active">Active</option>
//           <option value="ended">Ended</option>
//           <option value="cancelled">Cancelled</option>
//         </select>
//       </div>

//       {/* Info Card */}
//       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
//         <div className="flex items-start space-x-3">
//           <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="font-semibold text-blue-900 text-lg">Multi-Session Management</p>
//             <p className="text-blue-700 mt-1">
//               As a Super Admin, you can create multiple AGM sessions for different purposes, 
//               assign specific admins to manage them, and set custom vote limits for participants. 
//               Each session operates independently with its own timeline and voter allocation.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Sessions List */}
//       <div className="grid gap-6">
//         {sessions.map((session: AGMSession) => (
//           <motion.div
//             key={session.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all"
//           >
//             <div className="flex items-start justify-between mb-4">
//               <div className="flex-1">
//                 <div className="flex items-center space-x-3 mb-3">
//                   <h3 className="text-2xl font-bold text-gray-900">{session.title}</h3>
//                   <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${statusColors[session.status]}`}>
//                     {session.status.toUpperCase()}
//                   </span>
//                 </div>
//                 <p className="text-gray-600 mb-4">{session.description}</p>
                
//                 <div className="grid grid-cols-5 gap-4 mb-4">
//                   <div className="bg-white p-3 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Organization</p>
//                     <p className="text-sm font-bold text-gray-900 mt-1">{session.organizationName}</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Start Date</p>
//                     <p className="text-sm font-bold text-gray-900 mt-1">
//                       {new Date(session.scheduledStartTime).toLocaleDateString()}
//                     </p>
//                   </div>
//                   <div className="bg-white p-3 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Quorum Required</p>
//                     <p className="text-sm font-bold text-gray-900 mt-1">{session.quorumRequired}%</p>
//                   </div>
//                   <div className="bg-white p-3 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Voters / Votes</p>
//                     <p className="text-sm font-bold text-gray-900 mt-1">
//                       {session.totalVoters} / {session.totalVotesCast}
//                     </p>
//                   </div>
//                   <div className="bg-white p-3 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Assigned Admins</p>
//                     <p className="text-sm font-bold text-gray-900 mt-1">
//                       {session.assignedAdmins?.length || 0} admins
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center space-x-2 flex-wrap gap-2">
//                   {session.status === 'scheduled' && (
//                     <button
//                       onClick={() => onStart(session.id)}
//                       className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
//                     >
//                       <Play className="w-4 h-4" />
//                       <span>Start Session</span>
//                     </button>
//                   )}
//                   {session.status === 'active' && (
//                     <button
//                       onClick={() => onEnd(session.id)}
//                       className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
//                     >
//                       <Square className="w-4 h-4" />
//                       <span>End Session</span>
//                     </button>
//                   )}
//                   <button
//                     onClick={() => onAssignAdmin(session)}
//                     className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
//                   >
//                     <UserCog className="w-4 h-4" />
//                     <span>Assign Admins</span>
//                   </button>
//                   <button
//                     onClick={() => onEdit(session)}
//                     className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all font-medium"
//                   >
//                     <Edit2 className="w-4 h-4" />
//                     <span>Edit</span>
//                   </button>
//                   <button
//                     onClick={() => onDelete(session.id)}
//                     className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-medium"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                     <span>Delete</span>
//                   </button>
//                   <button
//                     className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
//                   >
//                     <Eye className="w-4 h-4" />
//                     <span>View Details</span>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         ))}
        
//         {sessions.length === 0 && (
//           <div className="text-center py-20">
//             <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
//             <p className="text-gray-500 text-2xl font-medium mb-6">No AGM sessions found</p>
//             <button
//               onClick={onCreate}
//               className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl transition-all font-medium text-lg"
//             >
//               Create Your First AGM Session
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // Component: Admin Management
// function AdminManagement({ admins, sessions }: any) {
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-900">Admin Management</h2>
//           <p className="text-gray-600 mt-1">Manage platform administrators and their session assignments</p>
//         </div>
//         <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-lg transition-all">
//           <Plus className="w-5 h-5" />
//           <span>Add New Admin</span>
//         </button>
//       </div>

//       <div className="grid gap-4">
//         {admins.map((admin: Admin) => (
//           <div key={admin.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-all">
//             <div className="flex items-center space-x-4">
//               <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
//                 {admin.firstName[0]}{admin.lastName[0]}
//               </div>
//               <div>
//                 <h3 className="text-xl font-bold text-gray-900">{admin.firstName} {admin.lastName}</h3>
//                 <p className="text-gray-600">{admin.email}</p>
//                 <div className="flex items-center space-x-2 mt-1">
//                   <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
//                     {admin.role.toUpperCase()}
//                   </span>
//                   <span className="text-xs text-gray-500">{admin.organizationName}</span>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center space-x-6">
//               <div className="text-center">
//                 <p className="text-gray-600 text-sm">Assigned Sessions</p>
//                 <p className="text-3xl font-bold text-gray-900">{admin.assignedSessions}</p>
//               </div>
//               <button className="bg-blue-100 text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-200 transition-all font-medium">
//                 Assign Sessions
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // Component: Vote Limits Management
// function VoteLimitsManagement({ voteLimits, sessions, onCreate, onDelete }: any) {
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-900">Vote Allocation Limits</h2>
//           <p className="text-gray-600 mt-1">Set custom vote weights for users based on shareholding or membership</p>
//         </div>
//         <button
//           onClick={onCreate}
//           className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-lg transition-all"
//         >
//           <Plus className="w-5 h-5" />
//           <span>Set Vote Limit</span>
//         </button>
//       </div>

//       <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
//         <div className="flex items-start space-x-3">
//           <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
//           <div>
//             <p className="font-bold text-blue-900 text-lg">About Vote Limits</p>
//             <p className="text-blue-700 mt-2">
//               Super admins can allocate different vote weights to users based on shareholding, 
//               membership level, or other organizational criteria. These limits apply per AGM session 
//               and override the default single vote per user.
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="grid gap-4">
//         {voteLimits.map((limit: VoteLimit) => (
//           <div key={limit.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-all">
//             <div>
//               <h3 className="text-xl font-bold text-gray-900">{limit.userName}</h3>
//               <p className="text-gray-600 mt-1">{limit.sessionTitle}</p>
//               <p className="text-sm text-gray-500 mt-2">
//                 <span className="font-medium">Reason:</span> {limit.reason}
//               </p>
//               <p className="text-xs text-gray-400 mt-1">
//                 Set by {limit.setBy} on {new Date(limit.setAt).toLocaleDateString()}
//               </p>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="text-right">
//                 <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                   {limit.allocatedVotes}
//                 </p>
//                 <p className="text-sm text-gray-500 font-medium">votes allocated</p>
//               </div>
//               <button
//                 onClick={() => onDelete(limit.id)}
//                 className="p-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all"
//               >
//                 <Trash2 className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         ))}
        
//         {voteLimits.length === 0 && (
//           <div className="text-center py-20">
//             <Shield className="w-24 h-24 text-gray-300 mx-auto mb-6" />
//             <p className="text-gray-500 text-2xl font-medium mb-6">No vote limits configured</p>
//             <button
//               onClick={onCreate}
//               className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl transition-all font-medium text-lg"
//             >
//               Set Your First Vote Limit
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // Component: Organizations Management
// function OrganizationsManagement({ organizations, onCreate, onEdit }: any) {
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-900">Organizations</h2>
//           <p className="text-gray-600 mt-1">Manage all organizations on the platform</p>
//         </div>
//         <button
//           onClick={onCreate}
//           className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:shadow-lg transition-all"
//         >
//           <Plus className="w-5 h-5" />
//           <span>Add Organization</span>
//         </button>
//       </div>

//       <div className="grid gap-6">
//         {organizations.map((org: Organization) => (
//           <div key={org.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all">
//             <div className="flex items-start justify-between">
//               <div className="flex-1">
//                 <div className="flex items-center space-x-3 mb-3">
//                   <h3 className="text-2xl font-bold text-gray-900">{org.name}</h3>
//                   <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
//                     org.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
//                   }`}>
//                     {org.isActive ? 'ACTIVE' : 'INACTIVE'}
//                   </span>
//                   <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
//                     {org.subscriptionTier.toUpperCase()}
//                   </span>
//                 </div>
//                 <p className="text-gray-600 mb-4">{org.domain}</p>
                
//                 <div className="grid grid-cols-4 gap-4">
//                   <div className="bg-white p-4 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Max Voters</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">{org.maxVoters}</p>
//                   </div>
//                   <div className="bg-white p-4 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Max Meetings/Year</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">{org.maxMeetingsPerYear}</p>
//                   </div>
//                   <div className="bg-white p-4 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Active Admins</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">{org.activeAdmins}</p>
//                   </div>
//                   <div className="bg-white p-4 rounded-xl border border-gray-200">
//                     <p className="text-xs text-gray-500 font-medium">Active Sessions</p>
//                     <p className="text-2xl font-bold text-gray-900 mt-1">{org.activeSessions}</p>
//                   </div>
//                 </div>
//               </div>
//               <button
//                 onClick={() => onEdit(org)}
//                 className="ml-4 p-3 hover:bg-gray-100 rounded-xl transition-all"
//               >
//                 <Edit2 className="w-6 h-6 text-gray-600" />
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // Component: System Settings
// function SystemSettings() {
//   return (
//     <div className="space-y-6">
//       <h2 className="text-3xl font-bold text-gray-900">System Configuration</h2>
      
//       <div className="grid gap-4">
//         <SettingCard
//           title="Email Service (SMTP)"
//           description="Configure email notifications for meetings and votes"
//           icon={Settings}
//           status="Configured"
//         />
//         <SettingCard
//           title="SMS Service (Twilio)"
//           description="Enable SMS notifications for urgent updates"
//           icon={Settings}
//           status="Not Configured"
//         />
//         <SettingCard
//           title="Two-Factor Authentication"
//           description="Require 2FA for all admin and super admin accounts"
//           icon={Shield}
//           status="Enabled"
//         />
//         <SettingCard
//           title="Audit Logging"
//           description="Track all system actions and changes"
//           icon={BarChart3}
//           status="Enabled"
//         />
//         <SettingCard
//           title="Automatic Backups"
//           description="Daily backups of all platform data"
//           icon={Settings}
//           status="Enabled"
//         />
//       </div>
//     </div>
//   );
// }

// function SettingCard({ title, description, icon: Icon, status }: any) {
//   const isConfigured = status === 'Configured' || status === 'Enabled';
  
//   return (
//     <div className="bg-white border-2 border-gray-200 rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-all">
//       <div className="flex items-center space-x-4">
//         <div className={`p-4 rounded-xl ${isConfigured ? 'bg-green-100' : 'bg-gray-100'}`}>
//           <Icon className={`w-7 h-7 ${isConfigured ? 'text-green-600' : 'text-gray-600'}`} />
//         </div>
//         <div>
//           <h3 className="text-lg font-bold text-gray-900">{title}</h3>
//           <p className="text-gray-600">{description}</p>
//         </div>
//       </div>
//       <span className={`px-6 py-3 rounded-xl text-sm font-bold ${
//         isConfigured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
//       }`}>
//         {status}
//       </span>
//     </div>
//   );
// }
