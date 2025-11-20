import React, { useState, useEffect } from 'react';
import { FolderPlus, LogOut, Shield, Vote, Crown, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VotingTimerBar from './VotingTimerBar';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hasProxyGroups, setHasProxyGroups] = useState(false);
  const [checkingProxy, setCheckingProxy] = useState(true);

  console.log('Header render - user:', user);

  useEffect(() => {
    const checkProxyStatus = async () => {
      if (!user?.id) {
        setCheckingProxy(false);
        return;
      }

      try {
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
  }, [user?.id]); 

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

      {/* Right Section */}
      {user && (
        <div className="flex items-center space-x-6">
          {(user.role === 'admin' || parseInt(user.role_id) === 0 || parseInt(user.role_id) === 1) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/super-admin')}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
            >
              <Crown className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:block">Super Admin</span>
            </motion.button>
          )}
          {user.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:block">Admin</span>
            </motion.button>
          )}
          {!checkingProxy && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(hasProxyGroups ? '/view-my-proxy' : `/proxy-choice/${user.id}`)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
            >
              {hasProxyGroups ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:block">View My Proxy</span>
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:block">Complete Proxy</span>
                </>
              )}
            </motion.button>
          )}
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
      )}
    </div>
  </div>
      </motion.header>

    </>
  );
};

export default Header;