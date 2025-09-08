import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Vote, Users, Calendar, BarChart3, Shield, Zap, Award, ChevronRight } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Employee Recognition",
      description: "Vote for outstanding team members who make a difference",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Calendar,
      title: "Event Selection",
      description: "Choose which company resolution you'd like to see happen",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Real-time Results",
      description: "See voting progress and results update in real-time",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Secure & Anonymous",
      description: "Your votes are private and protected with enterprise security",
      color: "from-orange-500 to-red-500"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Choose Category",
      description: "Select between Employee Recognition or Event Voting",
      icon: Vote
    },
    {
      number: "02",
      title: "Browse Options",
      description: "View detailed profiles and information about each option",
      icon: Users
    },
    {
      number: "03",
      title: "Cast Your Vote",
      description: "Make your selection and submit your secure vote",
      icon: Award
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0072CE]/5 to-[#171C8F]/5" />

        
          
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 2 }}
            className="absolute top-0 left-0 w-full h-full"
          >
            <motion.div
              className="absolute w-72 h-72 bg-[#0072CE] rounded-full mix-blend-multiply filter blur-3xl opacity-70"
              animate={{ x: [0, 100, -100, 0], y: [0, 50, -50, 0] }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            />
            <motion.div
              className="w-96 h-96 bg-[#171C8F] rounded-full mix-blend-multiply filter blur-3xl opacity-70 absolute top-0 right-0"
              animate={{ x: [0, -120, 120, 0], y: [0, -60, 60, 0] }}
              transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            />
          </motion.div>

        



        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mb-6">
                <Vote className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-[#464B4B] mb-6">
                Welcome to
                <span className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] bg-clip-text text-transparent"> WeVote</span>
              </h1>
              <p className="text-xl text-[#464B4B]/70 max-w-3xl mx-auto leading-relaxed">
                Your voice matters. Participate in shaping our company culture through secure, 
                transparent voting on employee recognition and upcoming events.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/voting')}
                className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Start Voting</span>
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#464B4B] mb-4">
              How It Works
            </h2>
            <p className="text-xl text-[#464B4B]/70 max-w-2xl mx-auto">
              Simple, secure, and intuitive voting in just three steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="relative z-10 bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mb-6">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{step.number}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#464B4B] mb-4">{step.title}</h3>
                  <p className="text-[#464B4B]/70 leading-relaxed">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-0">
                    <ChevronRight className="h-8 w-8 text-[#0072CE]/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#464B4B] mb-4">
              Why Choose WeVote?
            </h2>
            <p className="text-xl text-[#464B4B]/70 max-w-2xl mx-auto">
              Experience the most advanced voting platform designed for modern workplaces
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#464B4B] mb-2">{feature.title}</h3>
                <p className="text-[#464B4B]/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0072CE] to-[#171C8F]">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center justify-center space-x-2 mb-6">
        <Zap className="h-8 w-8 text-white" />
        <h2 className="text-4xl font-bold text-white">Ready to Vote?</h2>
      </div>
      <p className="text-xl text-blue-100 mb-8 leading-relaxed">
        Join your colleagues in shaping our company's future. Every vote counts, every voice matters.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/voting')}
        className="bg-white text-[#0072CE] px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
      >
        <Vote className="h-5 w-5" />
        <span>Start Voting Now</span>
      </motion.button>
    </motion.div>

    {/* Footer Section */}
    <div className="mt-16 border-t border-blue-200 pt-6 text-sm text-blue-100">
      <p>
        This platform is proudly developed for <strong>Forvis Mazars</strong> to empower employee engagement and transparent decision-making.
      </p>
      <p className="mt-2">
        &copy; {new Date().getFullYear()} Forvis Mazars. All rights reserved. | Designed with care and innovation By Jared Moodley and Bilal Cassim.
      </p>
    </div>
  </div>
      </section>

    </div>
  );
};

export default Home;