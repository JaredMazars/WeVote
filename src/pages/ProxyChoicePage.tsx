import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProxyFormProps {
  formId?: string;
  isPreview?: boolean;
}

const ProxyChoicePage: React.FC<ProxyFormProps> = ({ formId, isPreview }) => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentFormId = formId || id;


  const handleProxy = (choice: 'principal' | 'proxy') => {
    const userId = user?.id; // Replace with actual user ID logic
    if(choice === 'principal') {
      console.log('User chose to be the principal member');
      navigate(`/proxy-form/${userId}`, { state: { proxyChoice: choice } });
    }
    else if(choice === 'proxy') {
      console.log('User chose to give their proxy');
      navigate(`/proxy-form/assignee/${userId}`, { state: { proxyChoice: choice } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate('/home')}
            className="flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] mb-6 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </motion.button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#464B4B]">
                Proxy Voting Setup
              </h1>
              <p className="text-[#464B4B]/70">Choose how you will participate in the vote</p>
            </div>
          </div>
        </motion.div>

        {/* Choice Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Principal Member Card */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleProxy('principal')}
            className="cursor-pointer bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#464B4B]">I am the principal member</h3>
            </div>
            <p className="text-sm text-[#464B4B]/70">
              I will be voting directly on all matters and resolutions.
            </p>
          </motion.div>

          {/* Proxy Giver Card */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleProxy('proxy')}
            className="cursor-pointer bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#464B4B]">I am giving my proxy</h3>
            </div>
            <p className="text-sm text-[#464B4B]/70">
              I authorize someone else to vote on my behalf for this session.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProxyChoicePage;
