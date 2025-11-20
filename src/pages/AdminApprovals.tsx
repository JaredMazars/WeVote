import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import {
  Users,
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

interface User {
  // Identity
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  title?: string;

  // Contact Info
  email: string;
  phone?: string;
  avatar_url?: string;

  // Role & Access
  role_name?: string;
  role?: string; // derived from role_name
  active?: string | boolean;
  login_method?: string;
  account_locked?: boolean;
  failed_attempts?: number;

  // Employment Info
  employee_number?: string;
  department_name?: string;
  department_id?: number;
  position?: string;
  manager?: string;
  manager_id?: number;
  hire_date?: string;
  start_date?: string;
  bio?: string;

  // Registration Status
  registration_status?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;

  // System Metadata
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  last_login?: string;

  goodStandingIdNumber?: string;
}




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


const DUMMY_PROXY_FORMS: ProxyForm[] = [
  {
    id: '1',
    auth_user_id: 'user1',
    title: 'Mr',
    initials: 'J.A.',
    surname: 'Smith',
    full_names: 'John Andrews',
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
  }
];

type TabType = 'users' | 'proxies';

const AdminApprovals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [registrations, setRegistrations] = useState<User[]>();
  const [proxyForms, setProxyForms] = useState<ProxyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedForm, setSelectedForm] = useState<ProxyForm | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<ProxyForm[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    // Add this state near your other useState declarations
const [bulkApprovalFile, setBulkApprovalFile] = useState<File | null>(null);
const [bulkApprovalPreview, setBulkApprovalPreview] = useState<{ email: string; status: string }[]>([]);
const [bulkApprovalLoading, setBulkApprovalLoading] = useState(false);

// Add this function to handle bulk approval file upload
const handleBulkApprovalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setBulkApprovalFile(file);
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Extract emails from the Excel file
      const emails = jsonData.map((row: any) => ({
        email: row['Email'] || row['email'] || row['EMAIL'] || '',
        status: 'pending'
      })).filter(item => item.email.trim() !== '');

      setBulkApprovalPreview(emails);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Error parsing Excel file. Please check the format.');
    }
  };

  reader.readAsBinaryString(file);
};

// Add this function to process bulk approval
const handleConfirmBulkApproval = async () => {
  if (bulkApprovalPreview.length === 0) {
    alert('No emails to process');
    return;
  }

  if (!window.confirm(`Are you sure you want to approve ${bulkApprovalPreview.length} users for active status and good standing?`)) {
    return;
  }

  setBulkApprovalLoading(true);

  try {
    const emails = bulkApprovalPreview.map(item => item.email);

    const response = await fetch('http://localhost:3001/api/approval/users/bulk-approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ emails })
    });

    const result = await response.json();

    if (result.success) {
      alert(`Successfully approved ${result.approvedCount} out of ${emails.length} users!`);
      
      // Update local state
      setRegistrations(prev =>
        prev.map(user => {
          if (emails.includes(user.email)) {
            return {
              ...user,
              active: true,
              goodStandingIdNumber: user.id || user.goodStandingIdNumber,
              registration_status: 'approved'
            };
          }
          return user;
        })
      );

      // Close modal and reset
      setUploadModalOpen(false);
      setBulkApprovalFile(null);
      setBulkApprovalPreview([]);
    } else {
      alert('Failed to bulk approve users: ' + result.message);
    }
  } catch (error) {
    console.error('Error bulk approving users:', error);
    alert('Something went wrong during bulk approval.');
  } finally {
    setBulkApprovalLoading(false);
  }
};

// Template download function for bulk approval
const downloadBulkApprovalTemplate = () => {
  const templateData = [
    { Email: 'john.doe@example.com' },
    { Email: 'jane.smith@example.com' },
    { Email: 'bob.wilson@example.com' }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'User Emails');
  
  ws['!cols'] = [{ wch: 30 }];

  XLSX.writeFile(wb, 'bulk_approval_template.xlsx');
};



    useEffect(() => {
        // loadRegistrations();
    
        async function loadRegistrationData() {
        const res = await fetch('http://localhost:3001/api/admin/users');
        const { data } = await res.json();
        console.log('Fetched registration data:', data);
        setRegistrations(data);
      }

      async function loadProxyForms() {
        const res = await fetch('http://localhost:3001/api/proxy/proxy-form');
        const { data } = await res.json();
        console.log('Fetched proxy forms:', data);
        setProxyForms(data);
      }

      loadProxyForms();
      loadRegistrationData();
    }, []);

  

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    loadData();
  }, [filter, activeTab, user, navigate]);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // const handleApproveUser = async (registration: User) => {
  //   if (!window.confirm(`Approve registration for ${registration.first_name} ${registration.last_name}?`)) {
  //     return;
  //   }

  //   setActionLoading(true);
  //   setTimeout(() => {
  //     setRegistrations(prev =>
  //       prev.map(reg =>
  //         reg.id === registration.id
  //           ? { ...reg, registration_status: 'approved', reviewed_at: new Date().toISOString() }
  //           : reg
  //       )
  //     );
  //     alert('Registration approved successfully!');
  //     setSelectedUser(null);
  //     setActionLoading(false);
  //   }, 800);
  // };

  const handleApproveUser = async (registration: User) => {
  if (!window.confirm(`Approve registration for ${registration.first_name} ${registration.last_name}?`)) {
    return;
  }

  setActionLoading(true);

  try {
    
    const response = await fetch(`http://localhost:3001/api/approval/users/${registration.id}/approve`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registration.id
            ? {
                ...reg,
                registration_status: 'approved',
                reviewed_at: new Date().toISOString(),
                active: true
              }
            : reg
        )
      );
      alert('Registration approved successfully!');
    } else {
      alert('Failed to approve user: ' + result.message);
    }
  } catch (error) {
    console.error(' Error approving user:', error);
    alert('Something went wrong while approving the user.');
  } finally {
    setSelectedUser(null);
    setActionLoading(false);
  }
  };

  const handleApproveGoodStandingUser = async (registration: User) => {
  if (!window.confirm(`Approve registration for ${registration.first_name} ${registration.last_name}?`)) {
    return;
  }

  try {

    const response = await fetch(`http://localhost:3001/api/approval/users/${registration.id}/approve-good-standing`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registration.id
            ? {
                ...reg,
                registration_status: 'approved',
                reviewed_at: new Date().toISOString(),
                active: true
              }
            : reg
        )
      );
      alert('User Good Standing approved successfully!');
    } else {
      alert('Failed to approve user: ' + result.message);
    }
  } catch (error) {
    console.error(' Error approving user:', error);
    alert('Something went wrong while approving the user.');
  } finally {
    setSelectedUser(null);
    setActionLoading(false);
  }

  setActionLoading(true);

  };

  

  const handleRejectUser = async (registration: User) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    setTimeout(() => {
      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registration.id
            ? {
                ...reg,
                registration_status: 'rejected',
                rejection_reason: rejectionReason,
                reviewed_at: new Date().toISOString()
              }
            : reg
        )
      );
      alert('Registration rejected');
      setSelectedUser(null);
      setRejectionReason('');
      setActionLoading(false);
    }, 800);
  };

  const handleApproveProxy = async (form: ProxyForm) => {
  const confirmText = `Approve proxy assignment for ${form.appointment.member_full_name} ${form.appointment.member_surname} to assign ${form.proxy_group?.principal_name} as their proxy group?`;
  if (!window.confirm(confirmText)) return;

  console.log('Approving proxy assignment for form:', form);

  try {
    setActionLoading(true);

    // Activate the proxy group in the backend
    const res = await fetch(`http://localhost:3001/api/proxy/proxy-group/${form.proxy_group.id}/activate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error('Failed to activate proxy group');

    // Update local state
    setProxyForms(prev =>
      prev.map(f =>
        f.appointment.id === form.appointment.id
          ? {
              ...f,
              appointment: {
                ...f.appointment,
                approval_status: 'approved',
                reviewed_at: new Date().toISOString()
              },
              proxy_group: {
                ...f.proxy_group,
                is_active: true
              }
            }
          : f
      )
    );

    alert('Proxy assignment approved successfully!');
    setSelectedForm(null);
  } catch (error) {
    console.error('Error approving proxy assignment:', error);
    alert('Something went wrong while approving the proxy assignment.');
  } finally {
    setActionLoading(false);
  }
  };

  const handleRejectProxy = async (form: ProxyForm) => {
  const confirmText = `Reject proxy assignment for ${form.appointment.member_full_name} ${form.appointment.member_surname} to assign ${form.proxy_group?.principal_name} as their proxy group?`;
  if (!window.confirm(confirmText)) return;

  console.log('Rejecting proxy assignment for form:', form);

  try {
    setActionLoading(true);

    // Deactivate the proxy group in the backend
    const res = await fetch(`http://localhost:3001/api/proxy/proxy-group/${form.proxy_group.id}/deactivate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error('Failed to deactivate proxy group');

    // Update local state
    setProxyForms(prev =>
      prev.map(f =>
        f.appointment.id === form.appointment.id
          ? {
              ...f,
              appointment: {
                ...f.appointment,
                approval_status: 'rejected',
                reviewed_at: new Date().toISOString()
              },
              proxy_group: {
                ...f.proxy_group,
                is_active: false
              }
            }
          : f
      )
    );

    alert('Proxy assignment rejected successfully!');
    setSelectedForm(null);
  } catch (error) {
    console.error('Error approving proxy assignment:', error);
    alert('Something went wrong while approving the proxy assignment.');
  } finally {
    setActionLoading(false);
  }
  };



 

  // const filteredRegistrations = registrations
  //   .filter(reg => filter === 'all' || reg.registration_status === filter)
  //   .filter(reg =>
  //     `${reg.first_name} ${reg.last_name} ${reg.email} ${reg.employee_number}`
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase())
  //   );

  // 1. Transform raw users into table-ready format
// const transformedUsers = registrations?.map(user => ({
//   id: user.id.toString(),
//   title: user.title || '', // optional if available
//   first_name: user.first_name || user.name?.split(' ')[0] || '',
//   last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
//   name: user.name,
//   email: user.email,
//   employee_number: user.employee_number || '', // assuming this field exists
//   department: user.department_name || '', // assuming joined from departments
//   registration_status: user.registration_status || 'pending', // default fallback
//   avatar: user.avatar_url,
//   isActive: Boolean(user.is_active),
//   lastLogin: user.last_login,
//   created_at: user.created_at,
//   updated_at: user.updated_at,
//   active: user.active // used for status filtering
// }));

// 2. Apply filters
// const filteredRegistrations = transformedUsers
//   .filter(user => filter === 'all' || user.registration_status === filter)
//   .filter(user =>
//     `${user.first_name} ${user.last_name} ${user.email} ${user.employee_number}`
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase())
//   );


  const filteredProxyForms = proxyForms
    .filter(form => filter === 'all' || form.approval_status === filter)
    .filter(form =>
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadFile(file);
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform Excel data to ProxyForm format
      const mappedData: ProxyForm[] = jsonData.map((row: any, index: number) => ({
        id: `upload-${Date.now()}-${index}`,
        auth_user_id: `user-${Date.now()}-${index}`,
        title: row['Title'] || row['title'] || '',
        initials: row['Initials'] || row['initials'] || '',
        surname: row['Surname'] || row['surname'] || '',
        full_names: row['Full Names'] || row['full_names'] || '',
        membership_number: row['Membership Number'] || row['membership_number'] || '',
        id_passport_number: row['ID/Passport Number'] || row['id_passport_number'] || '',
        appointment_type: (row['Appointment Type'] || row['appointment_type'] || 'discretionary').toLowerCase(),
        proxy_full_names: row['Proxy Full Names'] || row['proxy_full_names'] || '',
        proxy_surname: row['Proxy Surname'] || row['proxy_surname'] || '',
        proxy_membership_number: row['Proxy Membership Number'] || row['proxy_membership_number'] || '',
        signed_at: row['Signed At'] || row['signed_at'] || '',
        signature_date: row['Signature Date'] || row['signature_date'] || '',
        trustee_remuneration: row['Trustee Remuneration'] || row['trustee_remuneration'] || undefined,
        remuneration_policy: row['Remuneration Policy'] || row['remuneration_policy'] || undefined,
        auditors_appointment: row['Auditors Appointment'] || row['auditors_appointment'] || undefined,
        agm_motions: row['AGM Motions'] || row['agm_motions'] || undefined,
        candidate1: row['Candidate 1'] || row['candidate1'] || undefined,
        candidate2: row['Candidate 2'] || row['candidate2'] || undefined,
        candidate3: row['Candidate 3'] || row['candidate3'] || undefined,
        approval_status: 'pending',
        created_at: new Date().toISOString()
      }));

      setUploadPreview(mappedData);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Error parsing Excel file. Please check the format.');
    }
  };

  reader.readAsBinaryString(file);
};

const handleConfirmUpload = () => {
  if (uploadPreview.length === 0) {
    alert('No data to upload');
    return;
  }

  setUploadLoading(true);
  
  // Simulate API call
  setTimeout(() => {
    setProxyForms(prev => [...uploadPreview, ...prev]);
    alert(`Successfully uploaded ${uploadPreview.length} proxy assignments!`);
    setUploadModalOpen(false);
    setUploadFile(null);
    setUploadPreview([]);
    setUploadLoading(false);
  }, 1000);
};

// Transform raw users into table-ready format
const transformedUserss = registrations?.map(user => ({
  id: user.id,
  title: user.title || '',
  first_name: user.name?.split(' ')[0] || '',
  last_name: user.name?.split(' ').slice(1).join(' ') || '',
  name: user.name,
  email: user.email,
  employee_number: '', // Not in your API response
  department: '', // Not in your API response
  registration_status: 'pending', // Not in your API response, defaulting to pending
  phone: '',
  id_number: '',
  date_of_birth: '',
  street_address: '',
  city: '',
  province: '',
  postal_code: '',
  country: '',
  position: '',
  start_date: '',
  manager: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  bio: '',
  skills: [],
  created_at: user.created_at,
  avatar_url: user.avatar_url,
  active: user.active, 
  last_login: user.last_login, 
  goodStandingIdNumber: user.goodStandingIdNumber
})) || [];

// Apply filters
// const filteredRegistrationss = transformedUserss
//   .filter(user => filter === 'all' || user.registration_status === filter)
//   .filter(user =>
//     `${user.first_name} ${user.last_name} ${user.email} ${user.employee_number}`
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase())
//   );

// console.log('Transformed Users:', transformedUserss);

const downloadTemplate = () => {
  // Create template data
  const templateData = [
    {
      'Title': 'Mr',
      'Initials': 'J.A.',
      'Surname': 'Smith',
      'Full Names': 'John Andrew',
      'Membership Number': 'MEM001',
      'ID/Passport Number': '8501015800089',
      'Appointment Type': 'discretionary',
      'Proxy Full Names': 'Sarah Jane',
      'Proxy Surname': 'Johnson',
      'Proxy Membership Number': 'MEM045',
      'Signed At': 'Cape Town',
      'Signature Date': '2025-01-10',
      'Trustee Remuneration': '',
      'Remuneration Policy': '',
      'Auditors Appointment': '',
      'AGM Motions': '',
      'Candidate 1': '',
      'Candidate 2': '',
      'Candidate 3': ''
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Proxy Assignments');
  
  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 18 },
    { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
    { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];

  XLSX.writeFile(wb, 'proxy_assignment_template.xlsx');
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Approvals Dashboard</h1>
            <p className="text-gray-600">Review and approve user registrations and proxy assignments</p>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>User Registrations</span>
            </button>
            <button
              onClick={() => setActiveTab('proxies')}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'proxies'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Proxy Assignments</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder={activeTab === 'users' ? 'Search by name, email, or employee number...' : 'Search by member name or membership number...'}
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

  {activeTab === 'proxies' && (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setUploadModalOpen(true)}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Upload className="h-5 w-5" />
      <span>Bulk Upload</span>
    </motion.button>
  )}
  {activeTab === 'users' && (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setUploadModalOpen(true)}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Upload className="h-5 w-5" />
      <span>Bulk Approval</span>
    </motion.button>
  )}
</div>

{uploadModalOpen && activeTab === 'users' && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    onClick={() => !bulkApprovalLoading && setUploadModalOpen(false)}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bulk User Approval</h2>
        <button
          onClick={() => setUploadModalOpen(false)}
          disabled={bulkApprovalLoading}
          className="text-gray-500 hover:text-gray-700"
        >
          <XCircle className="h-6 w-6" />
        </button>
      </div>

      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Download the Excel template using the button below</li>
            <li>Fill in the email addresses of users to approve (one column: "Email")</li>
            <li>Upload the completed file</li>
            <li>Review the preview and confirm</li>
            <li>All users will be set to Active and Good Standing status</li>
          </ol>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadBulkApprovalTemplate}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mb-4"
        >
          Download Excel Template
        </motion.button>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleBulkApprovalFileUpload}
            className="hidden"
            id="bulk-approval-upload"
          />
          <label
            htmlFor="bulk-approval-upload"
            className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
          >
            Click to upload Excel file
          </label>
          <p className="text-sm text-gray-500 mt-2">Excel file with email column</p>
          {bulkApprovalFile && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {bulkApprovalFile.name}
            </p>
          )}
        </div>
      </div>

      {bulkApprovalPreview.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Preview ({bulkApprovalPreview.length} users)
          </h3>
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bulkApprovalPreview.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{item.email}</td>
                    <td className="px-3 py-2">
                      <span className="text-green-600 text-xs">
                        ✓ Approve Active & Good Standing
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bulkApprovalPreview.length > 0 && (
        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirmBulkApproval}
            disabled={bulkApprovalLoading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {bulkApprovalLoading ? 'Processing...' : `Approve ${bulkApprovalPreview.length} Users`}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setBulkApprovalFile(null);
              setBulkApprovalPreview([]);
            }}
            disabled={bulkApprovalLoading}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Clear
          </motion.button>
        </div>
      )}
    </motion.div>
  </motion.div>
)}






          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : activeTab === 'users' ? (
            transformedUserss.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No registrations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                      {/* <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee #</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Department</th> */}
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Submitted</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Is Active</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Good Standing ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transformedUserss.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {reg.name || `${reg.first_name ?? ''} ${reg.last_name ?? ''}`.trim()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{reg.email ?? '-'}</td>
                        {/* <td className="px-4 py-3 text-gray-700">{reg.employee_number ?? '-'}</td> */}
                        {/* <td className="px-4 py-3 text-gray-700">{reg.department ?? '-'}</td> */}
                        <td className="px-4 py-3">{getStatusBadge(reg.registration_status ?? 'unknown')}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedUser(reg)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">View</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{reg.active ? 'True' : 'False'}</td>
                        <td className="px-4 py-3 text-gray-700">{reg.goodStandingIdNumber ? 'True' : 'False'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            )
          ) : (
            proxyForms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No proxy assignment submissions found</p>
              </div>
            ) : (
             <div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Member Name</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Membership #</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assigned Proxy</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assignment Type</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Submitted Date</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Active</th> {/* New column */}
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {proxyForms.map((form) => (
        <tr key={form.appointment.id} className="hover:bg-gray-50">
          <td className="px-4 py-3">
            <div className="font-medium text-gray-900">
              {form.appointment.member_title} {form.appointment.member_full_name} {form.appointment.member_surname}
            </div>
          </td>
          <td className="px-4 py-3 text-gray-700">{form.appointment.member_membership_number}</td>
          <td className="px-4 py-3 text-gray-700">
            {form.proxy_group_members.length > 0
              ? `${form.proxy_group_members.length} assigned`
              : 'No proxies'}
          </td>
          <td className="px-4 py-3">
            <span className="capitalize text-gray-700">{form.appointment.appointment_type}</span>
          </td>
          <td className="px-4 py-3">{getStatusBadge(form.appointment.approval_status)}</td>
          <td className="px-4 py-3 text-gray-600 text-sm">
            {new Date(form.appointment.created_at).toLocaleDateString()}
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">
            {form.proxy_group?.is_active ? 'True' : 'False'}
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
            )
          )}
        </div>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !actionLoading && setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  disabled={actionLoading}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedUser.title} {selectedUser.first_name} {selectedUser.last_name}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone}</p>
                    <p><strong>Date of Birth:</strong> {selectedUser.date_of_birth}</p>
                    <p><strong>ID Number:</strong> {selectedUser.id_number}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Address</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Street:</strong> {selectedUser.street_address}</p>
                    <p><strong>City:</strong> {selectedUser.city}</p>
                    <p><strong>Province:</strong> {selectedUser.province}</p>
                    <p><strong>Postal Code:</strong> {selectedUser.postal_code}</p>
                    <p><strong>Country:</strong> {selectedUser.country}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Employment</h3>
                  {/* <div className="space-y-2 text-sm">
                    <p><strong>Employee #:</strong> {selectedUser.employee_number}</p>
                    <p><strong>Department:</strong> {selectedUser.department}</p>
                    <p><strong>Position:</strong> {selectedUser.position}</p>
                    <p><strong>Start Date:</strong> {selectedUser.start_date}</p>
                    <p><strong>Manager:</strong> {selectedUser.manager}</p>
                  </div> */}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedUser.emergency_contact_name}</p>
                    <p><strong>Phone:</strong> {selectedUser.emergency_contact_phone}</p>
                    <p><strong>Relation:</strong> {selectedUser.emergency_contact_relation}</p>
                  </div>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                  <p className="text-sm text-gray-700">{selectedUser.bio}</p>
                </div>
              )}

              {selectedUser.skills && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                  <p className="text-sm text-gray-700">{selectedUser.skills.join(', ')}</p>
                </div>
              )}

              {selectedUser.registration_status === 'pending' && (
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
                      onClick={() => handleApproveUser(selectedUser)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Approve Registration'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApproveGoodStandingUser(selectedUser)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Approve Good Standing'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRejectUser(selectedUser)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" />
                      <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {selectedUser.registration_status === 'rejected' && selectedUser.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-700">{selectedUser.rejection_reason}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Rejected on {new Date(selectedUser.reviewed_at!).toLocaleString()}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

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
              <h2 className="text-2xl font-bold text-gray-900">Proxy Assignment Submission Details</h2>
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
                <h3 className="font-semibold text-gray-900 mb-4">Member (Assignor)</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedForm.appointment.member_title} {selectedForm.appointment.member_full_name} {selectedForm.appointment.member_surname}</p>
                  <p><strong>Membership #:</strong> {selectedForm.appointment.member_membership_number}</p>
                  <p><strong>ID/Passport:</strong> {selectedForm.appointment.member_id_number}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Assigned Proxy Group</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Group Name:</strong> {selectedForm.proxy_group?.group_name}</p>
                  <p><strong>Principal:</strong> {selectedForm.proxy_group?.principal_name}</p>
                  <p><strong>Principal Membership #:</strong> {selectedForm.proxy_group?.principal_member_number}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Assignment Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Type:</strong> <span className="capitalize">{selectedForm.appointment.appointment_type}</span></p>
                  <p><strong>Signed at:</strong> {selectedForm.appointment.location_signed}</p>
                  <p><strong>Signature Date:</strong> {new Date(selectedForm.appointment.signed_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {selectedForm.proxy_group_members?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Assigned Proxy Members</h3>
                <ul className="space-y-2 text-sm">
                  {selectedForm.proxy_group_members.map((member) => (
                    <li key={member.id}>
                      {member.initials} {member.full_name} {member.surname} — #{member.membership_number}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApproveProxy(selectedForm)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRejectProxy(selectedForm)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
                  </motion.button>
                </div>


            {/* Voting Instructions */}
            {selectedForm.appointment.appointment_type === 'instructional' && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Voting Instructions</h3>
                <div className="space-y-2 text-sm">
                  {selectedForm.appointment.trustee_remuneration && (
                    <p><strong>Trustee Remuneration:</strong> <span className="capitalize">{selectedForm.appointment.trustee_remuneration}</span></p>
                  )}
                  {selectedForm.appointment.remuneration_policy && (
                    <p><strong>Remuneration Policy:</strong> <span className="capitalize">{selectedForm.appointment.remuneration_policy}</span></p>
                  )}
                  {selectedForm.appointment.auditors_appointment && (
                    <p><strong>Auditors Appointment:</strong> <span className="capitalize">{selectedForm.appointment.auditors_appointment}</span></p>
                  )}
                  {selectedForm.appointment.agm_motions && (
                    <p><strong>AGM Motions:</strong> <span className="capitalize">{selectedForm.appointment.agm_motions}</span></p>
                  )}
                </div>
              </div>
            )}

            {/* Trustee Candidates */}
            {(selectedForm.appointment.candidate1 || selectedForm.appointment.candidate2 || selectedForm.appointment.candidate3) && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Trustee Candidates</h3>
                <div className="space-y-1 text-sm">
                  {selectedForm.appointment.candidate1 && <p>1. {selectedForm.appointment.candidate1}</p>}
                  {selectedForm.appointment.candidate2 && <p>2. {selectedForm.appointment.candidate2}</p>}
                  {selectedForm.appointment.candidate3 && <p>3. {selectedForm.appointment.candidate3}</p>}
                </div>
              </div>
            )}

            {/* Approval Actions */}
            {selectedForm.appointment.approval_status === 'pending' && (
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
                    onClick={() => handleApproveProxy(selectedForm)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRejectProxy(selectedForm)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Rejection Reason Display */}
            {selectedForm.appointment.approval_status === 'rejected' && selectedForm.appointment.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
                <p className="text-sm text-red-700">{selectedForm.appointment.rejection_reason}</p>
                <p className="text-xs text-red-600 mt-2">
                  Rejected on {new Date(selectedForm.appointment.reviewed_at).toLocaleString()}
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

export default AdminApprovals;