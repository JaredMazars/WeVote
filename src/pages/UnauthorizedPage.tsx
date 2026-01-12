import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block p-6 bg-red-100 rounded-full mb-6"
          >
            <ShieldAlert className="w-20 h-20 text-red-600" />
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-xl text-gray-600 mb-8">
            You don't have permission to access this page.
          </p>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <p className="text-red-800 font-medium">
              This area is restricted to authorized personnel only. If you believe you should have access, 
              please contact your administrator.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white rounded-xl hover:shadow-xl transition-all font-semibold"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
