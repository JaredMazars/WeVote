import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Award, Sparkles, ChevronRight } from 'lucide-react';

const VotingCategories: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'employees',
      title: 'Candidates',
      description: 'Vote for outstanding colleagues who inspire, innovate, and make a difference in our workplace.',
      icon: Users,
      stats: { candidates: 6, totalVotes: 716 },
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      route: '/voting/employees',
      features: ['Team Leadership', 'Innovation', 'Collaboration', 'Excellence']
    },
    {
      id: 'events',
      title: 'Upcoming Resolutions',
      description: 'Help decide which company events and initiatives should be prioritized for the upcoming quarter.',
      icon: Calendar,
      stats: { candidates: 6, totalVotes: 1109 },
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      route: '/voting/events',
      features: ['Team Building', 'Learning', 'Networking', 'Wellness']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mb-6">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#464B4B] mb-4">
            What would you like to vote for?
          </h1>
          <p className="text-xl text-[#464B4B]/70 max-w-3xl mx-auto leading-relaxed">
            Choose a category to participate in our democratic decision-making process. 
            
          </p>
        </motion.div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="h-6 w-6 text-[#0072CE]" />
            <h3 className="text-lg font-semibold text-[#464B4B]">Voting Guidelines</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-[#464B4B]/70">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#0072CE] rounded-full"></div>
              <span>One vote per category</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#0072CE] rounded-full"></div>
              <span>Anonymous and secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#0072CE] rounded-full"></div>
              <span>Results updated in real-time</span>
            </div>
          </div>
        </motion.div>

        {/* Categories */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(category.route)}
              className="cursor-pointer group"
            >
              <div className={`bg-gradient-to-br ${category.bgColor} rounded-3xl p-8 shadow-lg border-2 border-transparent hover:border-white hover:shadow-2xl transition-all duration-300`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="text-[#464B4B]/40 group-hover:text-[#0072CE]"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.div>
                </div>

                <h2 className="text-2xl font-bold text-[#464B4B] mb-3 group-hover:text-[#0072CE] transition-colors">
                  {category.title}
                </h2>
                
                <p className="text-[#464B4B]/70 leading-relaxed mb-6">
                  {category.description}
                </p>

                {/* Stats */}
                <div className="flex items-center space-x-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#464B4B]">{category.stats.candidates}</div>
                    <div className="text-sm text-[#464B4B]/60">Options</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#464B4B]">{category.stats.totalVotes}</div>
                    <div className="text-sm text-[#464B4B]/60">Total Votes</div>
                  </div>
                </div>

                {/* Features */}
                {/* <div className="flex flex-wrap gap-2 mb-6">
                  {category.features.map((feature, featureIndex) => (
                    <span
                      key={featureIndex}
                      className="px-3 py-1 bg-white/60 rounded-full text-sm text-[#464B4B]/80 font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div> */}

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>View Options</span>
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        
      </div>
    </div>
  );
};

export default VotingCategories;