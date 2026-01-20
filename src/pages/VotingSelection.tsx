
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Vote, Users, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';
import VotingStatusBar from '../components/VotingStatusBar';
import AGMClosedModal from '../components/AGMClosedModal';
import api from '../services/api';

const VotingSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);

  useEffect(() => {
    checkAGMStatus();
  }, []);

  const checkAGMStatus = async () => {
    try {
      const response = await api.get('/sessions?status=in_progress');
      const sessions = (response.data as any)?.sessions || [];
      if (sessions.length === 0) {
        setShowClosedModal(true);
      }
    } catch (error) {
      console.error('Error checking AGM status:', error);
    }
  };

  const votingTypes = [
    {
      id: 'candidate',
      title: 'Nominee Voting',
      description: 'Vote for nominees or cast proxy votes',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      path: '/voting/candidates'
    },
    {
      id: 'resolution',
      title: 'Resolution Voting',
      description: 'Cast your vote on resolutions',
      icon: FileText,
      gradient: 'from-blue-500 to-blue-500',
      path: '/voting/resolutions'
    },
    // {
    //   id: 'proxy',
    //   title: 'Assign Proxy',
    //   description: 'Delegate your voting rights to a trusted proxy holder',
    //   icon: Shield,
    //   gradient: 'from-green-500 to-emerald-500',
    //   path: '/proxy-assignment'
    // }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      <Header />
      {showClosedModal && <AGMClosedModal onClose={() => setShowClosedModal(false)} />}

      {/* Main content container (relative so the Back button can be placed in its top-left) */}
      <div className="relative max-w-6xl mx-auto px-4 py-20">

        {/* Back Button at Top-Left */}
        <button
          onClick={() => navigate('/home')}
          className="absolute top-6 left-6 text-[#0072CE] hover:text-[#171C8F] font-medium transition-colors"
        >
          ← Back to Home
        </button>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mb-6">
            <Vote className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-[#464B4B] mb-4">
            Choose Your Voting Category
          </h1>
          <p className="text-xl text-[#464B4B]/70 max-w-2xl mx-auto">
            Select the type of voting you'd like to participate in
          </p>
        </motion.div>

        {/* Cards grid: 1 column on mobile, 2 columns from md and up. Narrowed to prevent awkward stretching */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {votingTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSelectedType(type.id)}
              className={`relative bg-white rounded-3xl p-8 shadow-xl cursor-pointer transition-all duration-300 border-4 ${
                selectedType === type.id ? 'border-[#0072CE]' : 'border-transparent hover:border-gray-200'
              } flex flex-col`}
            >
              {selectedType === type.id && (
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#0072CE] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              )}

              <div className={`w-16 h-16 bg-gradient-to-r ${type.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                <type.icon className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-[#464B4B] mb-3">{type.title}</h3>
              <p className="text-[#464B4B]/70 mb-6 leading-relaxed">{type.description}</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(type.path);
                }}
                className={`mt-auto w-full bg-gradient-to-r ${type.gradient} text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-200`}
              >
                <span>Continue</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Voting Status Bar */}
      <VotingStatusBar />
    </div>
  );
};

export default VotingSelection;
