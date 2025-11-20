import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// import apiService from '../services/api';
import { Employee } from '../utils/types';
import VotingCard from '../components/VotingCard';
import { Users, ArrowLeft, Award, TrendingUp } from 'lucide-react';

interface VotingCardProps {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  type?: 'employee' | 'resolution';
  additionalInfo?: string;
  onClick?: () => void;
}

function isVotingOpenNow(timer?: { active: boolean; start: string; end: string }) {
  if (!timer || !timer.active) return false;
  const now = new Date();
  const [startH, startM] = timer.start.split(':').map(Number);
  const [endH, endM] = timer.end.split(':').map(Number);
  const start = new Date(now); start.setHours(startH, startM, 0, 0);
  const end = new Date(now); end.setHours(endH, endM, 0, 0);
  return now >= start && now <= end;
}

const EmployeeVoting: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/employees', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log("Fetched employees:", result);

      if (response.ok) {
        setEmployees(result.data); 
      } else {
        setError(result.message || 'Failed to fetch employees');
      }
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchEmployees();
}, []);


  // const totalVotes = employees.reduce((sum, employee) => sum + employee.votes, 0);
  // const topPerformer = employees.reduce((prev, current) => 
  //   (prev.votes > current.votes) ? prev : current
  // );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate('/voting')}
            className="flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] mb-6 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Categories</span>
          </motion.button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#464B4B]">
                    Candidate Voting
                  </h1>
                  <p className="text-[#464B4B]/70">Vote for outstanding team members</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#464B4B]">{employees.length}</p>
                <p className="text-sm text-[#464B4B]/60">Nominees</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                {/* <p className="text-2xl font-bold text-[#464B4B]">{totalVotes}</p> */}
                <p className="text-sm text-[#464B4B]/60">Total Votes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                {/* <p className="text-lg font-bold text-[#464B4B] truncate">{topPerformer.name}</p>
                <p className="text-sm text-[#464B4B]/60">Leading with {topPerformer.votes} votes</p> */}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Employee Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-[#0072CE] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#0072CE] text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <VotingCard
                  id={employee.id}
                  title={employee.name}
                  subtitle={employee.department}
                  description={employee.bio}
                  image={employee.avatar}
                  type="employee"
                  additionalInfo={employee.position}
                  onClick={() => navigate(`/employees/${employee.id}`)}
                />
              </motion.div>
            ))}
          </div>

        )}

        {/* Voting Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-[#0072CE]/5 to-[#171C8F]/5 rounded-2xl p-6 border border-[#0072CE]/10"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Award className="h-6 w-6 text-[#0072CE]" />
            <h3 className="text-lg font-semibold text-[#464B4B]">Recognition Criteria</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#464B4B]/70">
            <div>
              <p className="font-medium text-[#464B4B] mb-2">Vote based on:</p>
              <ul className="space-y-1">
                <li>• Leadership and mentorship</li>
                <li>• Innovation and problem-solving</li>
                <li>• Collaboration and teamwork</li>
                <li>• Professional excellence</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#464B4B] mb-2">Remember:</p>
              <ul className="space-y-1">
                <li>• You can vote for one employee</li>
                <li>• Voting is anonymous and secure</li>
                <li>• Results are updated in real-time</li>
                <li>• Recognition ceremony next month</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeVoting;