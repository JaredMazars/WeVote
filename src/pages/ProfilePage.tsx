import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  Upload,
  FileText,
  Award,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Camera,
  Lock,
  Bell,
  Globe
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  joinDate?: string;
  bio?: string;
  skills?: string[];
  achievements?: string[];
  proxyHolder?: string;
  isCandidate?: boolean;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '1',
    name: user?.name || 'Demo User',
    email: user?.email || 'demo@wevote.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    employeeId: 'EMP001',
    joinDate: '2024-01-15',
    bio: 'Passionate about building secure and scalable voting systems. 5+ years of experience in web development.',
    skills: ['React', 'TypeScript', 'Node.js', 'Cloud Architecture'],
    achievements: ['Led 3 major projects', 'Employee of the Quarter Q3 2024', 'Innovation Award Winner'],
    proxyHolder: 'John Smith',
    isCandidate: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'proxy' | 'candidate' | 'settings'>('profile');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // TODO: API call to save profile
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmitProxyForm = () => {
    // TODO: API call to submit proxy form
    alert('Proxy form submitted successfully!');
    setUploadedFile(null);
    setShowUploadModal(false);
  };

  const handleBecomeCandidate = () => {
    setProfile({ ...profile, isCandidate: true });
    setShowCandidateForm(false);
    alert('Your candidacy application has been submitted for approval!');
    // TODO: API call to submit candidacy
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8"
        >
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-[#0072CE] to-[#171C8F] relative">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="relative px-8 pb-8">
            {/* Avatar */}
            <div className="absolute -top-16 left-8">
              <div className="relative">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-gradient-to-r from-[#0072CE] to-[#171C8F] flex items-center justify-center shadow-xl">
                  <span className="text-5xl font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all">
                  <Camera className="h-5 w-5 text-[#0072CE]" />
                </button>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-4">
              {!isEditing ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditing(true);
                    setEditedProfile(profile);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Edit className="h-5 w-5" />
                  <span>Edit Profile</span>
                </motion.button>
              ) : (
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    <X className="h-5 w-5" />
                    <span>Cancel</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                  >
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Name and Position */}
            <div className="mt-6 ml-40">
              <h1 className="text-4xl font-bold text-[#464B4B]">{profile.name}</h1>
              <p className="text-xl text-[#464B4B]/70 mt-1">{profile.position}</p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2 text-[#464B4B]/70">
                  <Building className="h-5 w-5" />
                  <span>{profile.department}</span>
                </div>
                <div className="flex items-center space-x-2 text-[#464B4B]/70">
                  <Calendar className="h-5 w-5" />
                  <span>Joined {new Date(profile.joinDate || '').toLocaleDateString()}</span>
                </div>
                {profile.proxyHolder && (
                  <div className="flex items-center space-x-2 text-[#464B4B]/70">
                    <Shield className="h-5 w-5" />
                    <span>Proxy: {profile.proxyHolder}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-[#464B4B] hover:bg-gray-100'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Profile Details</span>
            </button>
            <button
              onClick={() => setActiveTab('proxy')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'proxy'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-[#464B4B] hover:bg-gray-100'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Proxy Management</span>
            </button>
            <button
              onClick={() => setActiveTab('candidate')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'candidate'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-[#464B4B] hover:bg-gray-100'
              }`}
            >
              <Award className="h-5 w-5" />
              <span>Candidacy</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                  : 'text-[#464B4B] hover:bg-gray-100'
              }`}
            >
              <Lock className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Profile Details Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-[#464B4B] mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-[#464B4B]/70 mb-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                    />
                  ) : (
                    <p className="text-[#464B4B] font-medium">{profile.email}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-[#464B4B]/70 mb-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                    />
                  ) : (
                    <p className="text-[#464B4B] font-medium">{profile.phone}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Middle Column - Bio & Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Bio */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-[#464B4B] mb-4">About Me</h2>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none"
                  />
                ) : (
                  <p className="text-[#464B4B]/80">{profile.bio}</p>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-[#464B4B] mb-4">Skills</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-xl font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                  {isEditing && (
                    <button className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#0072CE] hover:text-[#0072CE] transition-all">
                      + Add Skill
                    </button>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-[#464B4B] mb-4">Achievements</h2>
                <div className="space-y-3">
                  {profile.achievements?.map((achievement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                      <p className="text-[#464B4B]">{achievement}</p>
                    </div>
                  ))}
                  {isEditing && (
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-[#0072CE] transition-all">
                      <Award className="h-5 w-5" />
                      <span>+ Add Achievement</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Proxy Management Tab */}
        {activeTab === 'proxy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assign Proxy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#464B4B]">Assign Your Proxy</h2>
                  <p className="text-[#464B4B]/70">Delegate your voting rights</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/proxy-assignment')}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl font-semibold hover:shadow-xl transition-all"
              >
                Go to Proxy Assignment Form
              </button>

              {profile.proxyHolder && (
                <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-green-700 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Active Proxy</span>
                  </div>
                  <p className="text-green-800">Your proxy is assigned to: <strong>{profile.proxyHolder}</strong></p>
                </div>
              )}
            </motion.div>

            {/* Upload Proxy Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#464B4B]">Upload Proxy Form</h2>
                  <p className="text-[#464B4B]/70">Submit physical proxy document</p>
                </div>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
              >
                Upload Physical Proxy Form
              </button>

              <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Accepted formats:</p>
                    <p>PDF, JPG, PNG (max 5MB)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Candidacy Tab */}
        {activeTab === 'candidate' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-full mb-4">
                <Award className="h-12 w-12 text-yellow-600" />
              </div>
              <h2 className="text-3xl font-bold text-[#464B4B] mb-2">Become a Candidate</h2>
              <p className="text-[#464B4B]/70">Stand for election in the next voting cycle</p>
            </div>

            {!profile.isCandidate ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-blue-900 mb-3">Requirements to become a candidate:</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Minimum 6 months employment with the organization</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>No active disciplinary actions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Complete profile with bio and achievements</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Admin approval required</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowCandidateForm(true)}
                  className="w-full px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <UserPlus className="h-6 w-6" />
                    <span>Submit Candidacy Application</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-900 mb-2">You are a Candidate!</h3>
                <p className="text-green-800 mb-6">
                  Your candidacy is active. You will appear in the next voting cycle.
                </p>
                <button
                  onClick={() => navigate('/voting')}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  View Voting Page
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Bell className="h-6 w-6 text-[#0072CE]" />
                <h2 className="text-2xl font-bold text-[#464B4B]">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#464B4B]">Email Notifications</p>
                    <p className="text-sm text-[#464B4B]/70">Receive voting reminders and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0072CE]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#464B4B]">SMS Notifications</p>
                    <p className="text-sm text-[#464B4B]/70">Receive text message alerts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0072CE]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#464B4B]">WhatsApp Notifications</p>
                    <p className="text-sm text-[#464B4B]/70">Receive WhatsApp messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0072CE]"></div>
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Privacy Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="h-6 w-6 text-[#0072CE]" />
                <h2 className="text-2xl font-bold text-[#464B4B]">Privacy & Security</h2>
              </div>

              <div className="space-y-4">
                <button className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-[#0072CE] transition-all">
                  <p className="font-semibold text-[#464B4B]">Change Password</p>
                  <p className="text-sm text-[#464B4B]/70">Update your login password</p>
                </button>

                <button className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-[#0072CE] transition-all">
                  <p className="font-semibold text-[#464B4B]">Two-Factor Authentication</p>
                  <p className="text-sm text-[#464B4B]/70">Enable 2FA for extra security</p>
                </button>

                <button className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-[#0072CE] transition-all">
                  <p className="font-semibold text-[#464B4B]">Privacy Settings</p>
                  <p className="text-sm text-[#464B4B]/70">Control who can see your information</p>
                </button>

                <button className="w-full text-left px-4 py-3 border-2 border-red-200 rounded-xl hover:border-red-600 transition-all text-red-600">
                  <p className="font-semibold">Delete Account</p>
                  <p className="text-sm">Permanently remove your account</p>
                </button>
              </div>
            </motion.div>

            {/* Language & Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Globe className="h-6 w-6 text-[#0072CE]" />
                <h2 className="text-2xl font-bold text-[#464B4B]">Preferences</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-[#464B4B] mb-2">Language</label>
                  <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#464B4B] mb-2">Time Zone</label>
                  <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0072CE] focus:outline-none">
                    <option>UTC-05:00 (Eastern Time)</option>
                    <option>UTC-06:00 (Central Time)</option>
                    <option>UTC-07:00 (Mountain Time)</option>
                    <option>UTC-08:00 (Pacific Time)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Upload Proxy Form Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#464B4B] mb-2">Upload Proxy Form</h2>
                  <p className="text-[#464B4B]/70">Submit your physical proxy document</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6">
                  <input
                    type="file"
                    id="fileUpload"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label
                    htmlFor="fileUpload"
                    className="cursor-pointer block"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    {uploadedFile ? (
                      <div>
                        <p className="font-semibold text-[#464B4B] mb-1">{uploadedFile.name}</p>
                        <p className="text-sm text-[#464B4B]/70">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-[#464B4B] mb-1">Click to upload</p>
                        <p className="text-sm text-[#464B4B]/70">PDF, JPG, PNG (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadedFile(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitProxyForm}
                    disabled={!uploadedFile}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Candidate Application Modal */}
        <AnimatePresence>
          {showCandidateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowCandidateForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="inline-block bg-yellow-100 p-4 rounded-full mb-4">
                    <Award className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#464B4B] mb-2">Confirm Candidacy</h2>
                  <p className="text-[#464B4B]/70">
                    Your application will be submitted for admin approval
                  </p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    By submitting this application, you agree to participate in the upcoming election cycle and accept the terms of candidacy.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCandidateForm(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-[#464B4B] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBecomeCandidate}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                  >
                    Submit Application
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
