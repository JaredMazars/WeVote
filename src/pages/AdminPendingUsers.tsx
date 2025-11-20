// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import {
//   Users,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Eye,
//   ArrowLeft,
//   Search,
//   Filter
// } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';

// interface EmployeeRegistration {
//   // Personal Info
//   id: string;
//   title: string;
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone: string;
//   id_number: string;
//   date_of_birth: string;
//   street_address: string;
//   city: string;
//   province: string;
//   postal_code: string;
//   country: string;

//   // Employment Info
//   employee_number: string;
//   department: string;
//   department_id: number;
//   position: string;
//   start_date: string;
//   hire_date: string;
//   manager: string;
//   manager_id?: number;
//   bio?: string;

//   // Emergency Contact
//   emergency_contact_name: string;
//   emergency_contact_phone: string;
//   emergency_contact_relation: string;

//   // Skills & Achievements
//   skills?: {
//     skill_name: string;
//     proficiency_level?: string;
//     years_experience?: number;
//     certified?: boolean;
//   }[];
//   achievements?: {
//     title: string;
//     description?: string;
//     achievement_date: string;
//     category?: string;
//     points?: number;
//   }[];

//   // Registration & Review Status
//   registration_status: string;
//   reviewed_by?: string;
//   reviewed_at?: string;
//   rejection_reason?: string;

//   // System Metadata
//   created_at: string;
//   updated_at?: string;
//   created_by?: string;
//   updated_by?: string;

//   // Login Metadata
//   login_method?: string;
//   is_active?: boolean;
//   account_locked?: boolean;
//   failed_attempts?: number;
//   last_login?: string;
// }


// const DUMMY_REGISTRATIONS: EmployeeRegistration[] = [
//   {
//     id: '1',
//     title: 'Mr',
//     first_name: 'John',
//     last_name: 'Doe',
//     email: 'john.doe@example.com',
//     phone: '+27 82 123 4567',
//     id_number: '8501015800080',
//     date_of_birth: '1985-01-01',
//     street_address: '123 Main Street',
//     city: 'Johannesburg',
//     province: 'Gauteng',
//     postal_code: '2000',
//     country: 'South Africa',
//     employee_number: 'EMP001',
//     department: 'Finance',
//     position: 'Financial Analyst',
//     start_date: '2023-01-15',
//     manager: 'Jane Smith',
//     emergency_contact_name: 'Mary Doe',
//     emergency_contact_phone: '+27 82 987 6543',
//     emergency_contact_relation: 'Spouse',
//     bio: 'Experienced financial analyst with 5 years in the industry',
//     skills: 'Excel, Financial Modeling, SAP',
//     registration_status: 'pending',
//     created_at: '2025-01-15T09:30:00Z'
//   },
//   {
//     id: '2',
//     title: 'Ms',
//     first_name: 'Sarah',
//     last_name: 'Johnson',
//     email: 'sarah.johnson@example.com',
//     phone: '+27 83 234 5678',
//     id_number: '9003125900081',
//     date_of_birth: '1990-03-12',
//     street_address: '456 Oak Avenue',
//     city: 'Cape Town',
//     province: 'Western Cape',
//     postal_code: '8001',
//     country: 'South Africa',
//     employee_number: 'EMP002',
//     department: 'Human Resources',
//     position: 'HR Manager',
//     start_date: '2022-06-01',
//     manager: 'Michael Brown',
//     emergency_contact_name: 'Robert Johnson',
//     emergency_contact_phone: '+27 83 876 5432',
//     emergency_contact_relation: 'Parent',
//     bio: 'Passionate about people development and organizational culture',
//     skills: 'Recruitment, Employee Relations, Training',
//     registration_status: 'approved',
//     reviewed_at: '2025-01-16T14:00:00Z',
//     created_at: '2025-01-14T09:15:00Z'
//   },
//   {
//     id: '3',
//     title: 'Dr',
//     first_name: 'David',
//     last_name: 'Williams',
//     email: 'david.williams@example.com',
//     phone: '+27 84 345 6789',
//     id_number: '8807201800082',
//     date_of_birth: '1988-07-20',
//     street_address: '789 Pine Road',
//     city: 'Durban',
//     province: 'KwaZulu-Natal',
//     postal_code: '4001',
//     country: 'South Africa',
//     employee_number: 'EMP003',
//     department: 'IT',
//     position: 'Senior Developer',
//     start_date: '2021-03-10',
//     manager: 'Lisa Anderson',
//     emergency_contact_name: 'Emily Williams',
//     emergency_contact_phone: '+27 84 765 4321',
//     emergency_contact_relation: 'Sibling',
//     bio: 'Full-stack developer with expertise in React and Node.js',
//     skills: 'React, Node.js, TypeScript, AWS',
//     registration_status: 'pending',
//     created_at: '2025-01-16T11:45:00Z'
//   },
//   {
//     id: '4',
//     title: 'Mrs',
//     first_name: 'Linda',
//     last_name: 'Martinez',
//     email: 'linda.martinez@example.com',
//     phone: '+27 85 456 7890',
//     id_number: '9205301800083',
//     date_of_birth: '1992-05-30',
//     street_address: '321 Elm Street',
//     city: 'Pretoria',
//     province: 'Gauteng',
//     postal_code: '0001',
//     country: 'South Africa',
//     employee_number: 'EMP004',
//     department: 'Marketing',
//     position: 'Marketing Coordinator',
//     start_date: '2023-09-01',
//     manager: 'Paul Wilson',
//     emergency_contact_name: 'Carlos Martinez',
//     emergency_contact_phone: '+27 85 654 3210',
//     emergency_contact_relation: 'Spouse',
//     skills: 'Digital Marketing, Social Media, Content Creation',
//     registration_status: 'rejected',
//     rejection_reason: 'Incomplete employment verification documents',
//     reviewed_at: '2025-01-17T09:30:00Z',
//     created_at: '2025-01-15T16:00:00Z'
//   },
//   {
//     id: '5',
//     title: 'Mr',
//     first_name: 'Ahmed',
//     last_name: 'Hassan',
//     email: 'ahmed.hassan@example.com',
//     phone: '+27 86 567 8901',
//     id_number: '9509151800084',
//     date_of_birth: '1995-09-15',
//     street_address: '654 Maple Drive',
//     city: 'Port Elizabeth',
//     province: 'Eastern Cape',
//     postal_code: '6001',
//     country: 'South Africa',
//     employee_number: 'EMP005',
//     department: 'Operations',
//     position: 'Operations Specialist',
//     start_date: '2024-02-01',
//     manager: 'Susan Taylor',
//     emergency_contact_name: 'Fatima Hassan',
//     emergency_contact_phone: '+27 86 098 7654',
//     emergency_contact_relation: 'Parent',
//     bio: 'Detail-oriented operations specialist focused on process improvement',
//     skills: 'Process Optimization, Project Management, Six Sigma',
//     registration_status: 'pending',
//     created_at: '2025-01-17T08:00:00Z'
//   }
// ];

// const AdminPendingUsers: React.FC = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
// // const [registrations, setRegistrations] = useState<EmployeeRegistration[]>([]);

//   const [registrations, setRegistrations] = useState<EmployeeRegistration[]>(DUMMY_REGISTRATIONS);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedUser, setSelectedUser] = useState<EmployeeRegistration | null>(null);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [rejectionReason, setRejectionReason] = useState('');

//   useEffect(() => {
//     loadRegistrations();

//     async function loadRegistrationData() {
//     const res = await fetch('http://localhost:3001/api/employees/registration-data');
//     const { data } = await res.json();
//     setRegistrations(data);
//   }

//   loadRegistrationData();
//   }, [filter]);

//   const loadRegistrations = async () => {
//     setLoading(true);
//     await new Promise(resolve => setTimeout(resolve, 500));
//     setLoading(false);
//   };
  

//   const handleApprove = async (registration: EmployeeRegistration) => {
//     if (!window.confirm(`Approve registration for ${registration.first_name} ${registration.last_name}?`)) {
//       return;
//     }

//     setActionLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       setRegistrations(prev =>
//         prev.map(reg =>
//           reg.id === registration.id
//             ? { ...reg, registration_status: 'approved', reviewed_at: new Date().toISOString() }
//             : reg
//         )
//       );

//       alert('Registration approved successfully!');
//       setSelectedUser(null);
//     } catch (error) {
//       console.error('Error approving registration:', error);
//       alert('Failed to approve registration');
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleReject = async (registration: EmployeeRegistration) => {
//     if (!rejectionReason.trim()) {
//       alert('Please provide a reason for rejection');
//       return;
//     }

//     setActionLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       setRegistrations(prev =>
//         prev.map(reg =>
//           reg.id === registration.id
//             ? {
//                 ...reg,
//                 registration_status: 'rejected',
//                 rejection_reason: rejectionReason,
//                 reviewed_at: new Date().toISOString()
//               }
//             : reg
//         )
//       );

//       alert('Registration rejected');
//       setSelectedUser(null);
//       setRejectionReason('');
//     } catch (error) {
//       console.error('Error rejecting registration:', error);
//       alert('Failed to reject registration');
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const filteredRegistrations = registrations
//     .filter(reg => filter === 'all' || reg.registration_status === filter)
//     .filter(reg =>
//       `${reg.first_name} ${reg.last_name} ${reg.email} ${reg.employee_number}`
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase())
//     );

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'pending':
//         return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center space-x-1">
//           <Clock className="h-3 w-3" />
//           <span>Pending</span>
//         </span>;
//       case 'approved':
//         return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center space-x-1">
//           <CheckCircle className="h-3 w-3" />
//           <span>Approved</span>
//         </span>;
//       case 'rejected':
//         return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center space-x-1">
//           <XCircle className="h-3 w-3" />
//           <span>Rejected</span>
//         </span>;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <motion.button
//           whileHover={{ x: -4 }}
//           onClick={() => navigate('/admin')}
//           className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
//         >
//           <ArrowLeft className="h-5 w-5" />
//           <span>Back to Admin Dashboard</span>
//         </motion.button>

//         <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center space-x-3">
//               <Users className="h-8 w-8 text-blue-600" />
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-900">Pending User Registrations</h1>
//                 <p className="text-gray-600">Review and approve employee registrations</p>
//               </div>
//             </div>
//           </div>

//           <div className="flex flex-col md:flex-row gap-4 mb-6">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Search by name, email, or employee number..."
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5 text-gray-600" />
//               <select
//                 value={filter}
//                 onChange={(e) => setFilter(e.target.value as any)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="all">All</option>
//                 <option value="pending">Pending</option>
//                 <option value="approved">Approved</option>
//                 <option value="rejected">Rejected</option>
//               </select>
//             </div>
//           </div>

//           {loading ? (
//             <div className="text-center py-12">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//               <p className="text-gray-600">Loading registrations...</p>
//             </div>
//           ) : filteredRegistrations.length === 0 ? (
//             <div className="text-center py-12">
//               <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//               <p className="text-gray-600">No registrations found</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee #</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Department</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Submitted</th>
//                     <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredRegistrations.map((reg) => (
//                     <tr key={reg.id} className="hover:bg-gray-50">
//                       <td className="px-4 py-3">
//                         <div className="font-medium text-gray-900">
//                           {reg.title} {reg.first_name} {reg.last_name}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-gray-700">{reg.email}</td>
//                       <td className="px-4 py-3 text-gray-700">{reg.employee_number}</td>
//                       <td className="px-4 py-3 text-gray-700">{reg.department}</td>
//                       <td className="px-4 py-3">{getStatusBadge(reg.registration_status)}</td>
//                       <td className="px-4 py-3 text-gray-600 text-sm">
//                         {new Date(reg.created_at).toLocaleDateString()}
//                       </td>
//                       <td className="px-4 py-3">
//                         <button
//                           onClick={() => setSelectedUser(reg)}
//                           className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
//                         >
//                           <Eye className="h-4 w-4" />
//                           <span className="text-sm">View</span>
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {selectedUser && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
//             onClick={() => !actionLoading && setSelectedUser(null)}
//           >
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
//                 <button
//                   onClick={() => setSelectedUser(null)}
//                   disabled={actionLoading}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   <XCircle className="h-6 w-6" />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                 <div>
//                   <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
//                   <div className="space-y-2 text-sm">
//                     <p><strong>Name:</strong> {selectedUser.title} {selectedUser.first_name} {selectedUser.last_name}</p>
//                     <p><strong>Email:</strong> {selectedUser.email}</p>
//                     <p><strong>Phone:</strong> {selectedUser.phone}</p>
//                     <p><strong>Date of Birth:</strong> {selectedUser.date_of_birth}</p>
//                     <p><strong>ID Number:</strong> {selectedUser.id_number}</p>
//                   </div>
//                 </div>

//                 <div>
//                   <h3 className="font-semibold text-gray-900 mb-4">Address</h3>
//                   <div className="space-y-2 text-sm">
//                     <p><strong>Street:</strong> {selectedUser.street_address}</p>
//                     <p><strong>City:</strong> {selectedUser.city}</p>
//                     <p><strong>Province:</strong> {selectedUser.province}</p>
//                     <p><strong>Postal Code:</strong> {selectedUser.postal_code}</p>
//                     <p><strong>Country:</strong> {selectedUser.country}</p>
//                   </div>
//                 </div>

//                 <div>
//                   <h3 className="font-semibold text-gray-900 mb-4">Employment</h3>
//                   <div className="space-y-2 text-sm">
//                     <p><strong>Employee #:</strong> {selectedUser.employee_number}</p>
//                     <p><strong>Department:</strong> {selectedUser.department}</p>
//                     <p><strong>Position:</strong> {selectedUser.position}</p>
//                     <p><strong>Start Date:</strong> {selectedUser.start_date}</p>
//                     <p><strong>Manager:</strong> {selectedUser.manager}</p>
//                   </div>
//                 </div>

//                 <div>
//                   <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
//                   <div className="space-y-2 text-sm">
//                     <p><strong>Name:</strong> {selectedUser.emergency_contact_name}</p>
//                     <p><strong>Phone:</strong> {selectedUser.emergency_contact_phone}</p>
//                     <p><strong>Relation:</strong> {selectedUser.emergency_contact_relation}</p>
//                   </div>
//                 </div>
//               </div>

//               {selectedUser.bio && (
//                 <div className="mb-6">
//                   <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
//                   <p className="text-sm text-gray-700">{selectedUser.bio}</p>
//                 </div>
//               )}

//               {selectedUser.skills && (
//                 <div className="mb-6">
//                   <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
//                   <p className="text-sm text-gray-700">{selectedUser.skills.join(', ')}</p>
//                 </div>
//               )}

//               {selectedUser.registration_status === 'pending' && (
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Rejection Reason (if rejecting)
//                     </label>
//                     <textarea
//                       value={rejectionReason}
//                       onChange={(e) => setRejectionReason(e.target.value)}
//                       rows={3}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="Enter reason for rejection..."
//                     />
//                   </div>

//                   <div className="flex space-x-4">
//                     <motion.button
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => handleApprove(selectedUser)}
//                       disabled={actionLoading}
//                       className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
//                     >
//                       <CheckCircle className="h-5 w-5" />
//                       <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
//                     </motion.button>

//                     <motion.button
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => handleReject(selectedUser)}
//                       disabled={actionLoading}
//                       className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
//                     >
//                       <XCircle className="h-5 w-5" />
//                       <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
//                     </motion.button>
//                   </div>
//                 </div>
//               )}

//               {selectedUser.registration_status === 'rejected' && selectedUser.rejection_reason && (
//                 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                   <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
//                   <p className="text-sm text-red-700">{selectedUser.rejection_reason}</p>
//                   <p className="text-xs text-red-600 mt-2">
//                     Rejected on {new Date(selectedUser.reviewed_at!).toLocaleString()}
//                   </p>
//                 </div>
//               )}
//             </motion.div>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminPendingUsers;