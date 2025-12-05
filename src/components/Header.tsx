import React, { useState, useEffect } from 'react';
import { FolderPlus, LogOut, Shield, Vote, Crown, Eye, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VotingTimerBar from './VotingTimerBar';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hasProxyGroups, setHasProxyGroups] = useState(false);
  const [checkingProxy, setCheckingProxy] = useState(true);
  const [proxyChoice, setProxyChoice] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  console.log('Header render - user:', user);
  console.log('Header - user.role_id:', user?.role_id, 'Type:', typeof user?.role_id);

  useEffect(() => {
    const checkProxyStatus = async () => {
      if (!user?.id) {
        setCheckingProxy(false);
        return;
      }

      try {
        // Get proxy choice from user object (database)
        const choice = user.proxy_vote_form;
        console.log('🔍 Header - proxy_vote_form from user:', choice);
        console.log('🔍 Header - full user object:', user);
        setProxyChoice(choice || null);

        // Check if user has uploaded a file
        if (user.proxy_file_name) {
          setHasUploadedFile(true);
          setUploadedFileName(user.proxy_file_name);
          console.log('📄 User has uploaded file:', user.proxy_file_name);
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/proxy/proxy-status/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          setHasProxyGroups(result.hasProxyGroups);
        }
      } catch (error) {
        console.error('Error checking proxy status:', error);
      } finally {
        setCheckingProxy(false);
      }
    };

    checkProxyStatus();
  }, [user?.id, user?.proxy_vote_form, user?.proxy_file_name]);

  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    setUploadLoading(true);

    const formData = new FormData();
    formData.append('proxyForm', uploadFile);
    formData.append('userId', user?.id?.toString() || '');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/proxy/upload-manual-form', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(hasUploadedFile ? 'Proxy form replaced successfully!' : 'Proxy form uploaded successfully!');
        
        // Update local state immediately
        setHasUploadedFile(true);
        setUploadedFileName(result.data.fileName || uploadFile.name);
        
        // Update user state in localStorage to reflect the new file
        if (user) {
          const updatedUser = {
            ...user,
            proxy_file_name: result.data.fileName || uploadFile.name,
            proxy_file_path: result.data.filePath || '',
            proxy_uploaded_at: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setShowUploadModal(false);
        setUploadFile(null);
      } else {
        alert('Failed to upload proxy form: ' + result.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const renderProxyButton = () => {
    if (checkingProxy) return null;

    console.log('🔘 renderProxyButton called with:', { 
      hasProxyGroups, 
      proxyChoice,
      user_proxy_vote_form: user?.proxy_vote_form 
    });

    // If user has proxy groups, show "View My Proxy"
    if (hasProxyGroups) {
      console.log('✅ Showing View My Proxy button');
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/view-my-proxy')}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
        >
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:block">View My Proxy</span>
        </motion.button>
      );
    }

    // Check proxy choice
    if (proxyChoice === 'manual') {
      console.log('✅ Manual proxy choice detected');
      console.log('📋 Has uploaded file:', hasUploadedFile, 'File name:', uploadedFileName);
      
      // If user has uploaded a file, show "View Proxy Form" button
      if (hasUploadedFile && uploadedFileName) {
        console.log('✅ Showing View Proxy Form button (file uploaded)');
        return (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600/80 hover:bg-green-600 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:block">View Proxy Form</span>
          </motion.button>
        );
      }
      
      // If no file uploaded yet, show "Upload Proxy Form" button
      console.log('✅ Showing Upload Proxy Form button (no file uploaded)');
      // Show "Upload Proxy Form" button
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUploadModal(true)}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:block">Upload Proxy Form</span>
        </motion.button>
      );
    } else if (proxyChoice === 'digital') {
      console.log('✅ Showing Complete Proxy button (digital)');
      // Show "Complete Proxy" button (digital form)
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => user?.id && navigate(`/proxy-choice/${user.id}`)}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
        >
          <FolderPlus className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:block">Complete Proxy</span>
        </motion.button>
      );
    }

    // Default: Show "Complete Proxy"
    console.log('⚠️ Showing default Complete Proxy button');
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => user?.id && navigate(`/proxy-choice/${user.id}`)}
        className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
      >
        <FolderPlus className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:block">Complete Proxy</span>
      </motion.button>
    );
  };

  return (
    <>
      <VotingTimerBar />
      <motion.header 
  initial={{ y: -100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg sticky top-0 z-50"
>
  <div className="w-full px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-20">
      {/* Left Section */}
      <motion.div 
        className="flex items-center space-x-3 flex-shrink-0"
        whileHover={{ scale: 1.05 }} 
        onClick={() => navigate('/home')}
      >
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <Vote className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">WeVote</h1>
          <p className="text-xs text-blue-100">Professional Voting Platform</p>
        </div>
      </motion.div>

      {user && (
      <>
      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Super Admin Login Button - Only for role_id 0 */}
        {user.role_id === 0 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/super-admin-login')}
          className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
        >
          <Crown className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:block">Super Admin</span>
        </motion.button>
        )}

        {/* Admin Login Button - Only for role_id 0 or 1 */}
        {(user.role_id === 0 || user.role_id === 1) && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin-login')}
          className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
        >
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:block">Admin</span>
        </motion.button>
        )}

        {/* Dashboard Buttons */}
        {(user.role_id === 0 || user.role_id === 1) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/super-admin')}
            className="bg-yellow-400/80 hover:bg-yellow-400 text-gray-900 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
          >
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:block">Dashboard</span>
          </motion.button>
        )}
        {(user.role_id === 0 || user.role_id === 1) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin')}
            className="bg-blue-400/80 hover:bg-blue-400 text-gray-900 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:block">Dashboard</span>
          </motion.button>
        )}
        {!checkingProxy && renderProxyButton()}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-blue-100 capitalize">{user.role}</p>
          </div>
          {user.avatar && (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="h-10 w-10 rounded-full border-2 border-white/30 object-cover"
            />
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
        >
          <LogOut className="h-5 w-5" />
        </motion.button>
      </div>
      </>
      )}
    </div>
  </div>
</motion.header>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {hasUploadedFile ? 'View/Replace Proxy Form' : 'Upload Proxy Form'}
            </h2>
            
            {/* Show existing file if uploaded */}
            {hasUploadedFile && uploadedFileName && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">Current File:</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-700">{uploadedFileName}</p>
                  <a
                    href={`http://localhost:3001/api/proxy/download-proxy-form/${user?.id}/${user?.proxy_file_path || uploadedFileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </a>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Upload a new file below to replace this one
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              {hasUploadedFile 
                ? 'Select a new file to replace your current proxy form'
                : 'Please upload your completed manual proxy form (PDF format recommended)'}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {uploadFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {uploadFile.name}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                disabled={uploadLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploadLoading || !uploadFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {hasUploadedFile ? 'Replacing...' : 'Uploading...'}
                  </>
                ) : (
                  hasUploadedFile ? 'Replace File' : 'Upload'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Header;