import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Employee } from '../utils/types';
import { ArrowLeft, Mail, Award, Calendar, Building2, Star, CheckCircle, Users } from 'lucide-react';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await apiService.getEmployee(id);
        if (response.success) {
          setEmployee(response.data);
          setHasVoted(response.data.hasVoted || false);
        } else {
          setError('Employee not found');
        }
      } catch (err) {
        setError('Failed to fetch employee details');
        console.error('Error fetching employee:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleVote = async () => {
    if (!employee || hasVoted) return;
    
    setIsVoting(true);
    try {
      const response = await apiService.voteForEmployee(employee.id);
      if (response.success) {
        setHasVoted(true);
        // Update vote count locally
        setEmployee(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0072CE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#464B4B] mb-4">{error || 'Employee not found'}</h2>
          <button
            onClick={() => navigate('/voting/employees')}
            className="text-[#0072CE] hover:text-[#171C8F]"
          >
            Back to Employee Voting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
      {/* Header */}
      <div className="sticky top-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate('/voting/employees')}
            className="flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Employee Voting</span>
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8"
        >
          <div className="relative h-64 bg-gradient-to-r from-[#0072CE] to-[#171C8F]">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="flex items-end space-x-6">
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  src={employee.avatar}
                  alt={employee.name}
                  className="w-24 h-24 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
                <div className="text-white pb-2">
                  <h1 className="text-3xl font-bold mb-1">{employee.name}</h1>
                  <p className="text-blue-100 text-lg">{employee.position}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">{employee.department}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{employee.yearsOfService} years</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right text-white pb-2">
                <div className="text-2xl font-bold">{employee.votes}</div>
                <div className="text-blue-100 text-sm">votes</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-[#464B4B] mb-4">About {employee.name}</h2>
              <p className="text-[#464B4B]/80 leading-relaxed text-lg">{employee.bio}</p>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Award className="h-6 w-6 text-[#0072CE]" />
                <h2 className="text-2xl font-bold text-[#464B4B]">Key Achievements</h2>
              </div>
              <div className="space-y-4">
                {employee.achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start space-x-3 p-4 bg-[#F4F4F4] rounded-xl"
                  >
                    <Star className="h-5 w-5 text-[#0072CE] mt-0.5 flex-shrink-0" />
                    <p className="text-[#464B4B] leading-relaxed">{achievement}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-[#464B4B] mb-4">Core Skills</h2>
              <div className="flex flex-wrap gap-3">
                {employee.skills.map((skill, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="px-4 py-2 bg-gradient-to-r from-[#0072CE]/10 to-[#171C8F]/10 text-[#0072CE] rounded-xl font-medium border border-[#0072CE]/20"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vote Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-32"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#464B4B] mb-2">
                  Vote for {employee.name}
                </h3>
                <p className="text-[#464B4B]/70 text-sm">
                  Show your support for outstanding work and leadership
                </p>
              </div>

              {hasVoted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-4"
                >
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-600 font-semibold mb-2">Vote Submitted!</p>
                  <p className="text-sm text-[#464B4B]/70">Thank you for participating</p>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVote}
                  disabled={isVoting}
                  className="w-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                >
                  {isVoting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Vote...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span>Vote for {employee.name}</span>
                    </div>
                  )}
                </motion.button>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#464B4B]/60">Current votes</span>
                  <span className="font-semibold text-[#464B4B]">{employee.votes}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((employee.votes / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;