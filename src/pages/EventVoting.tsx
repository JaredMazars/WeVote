import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Event } from '../utils/types';
import VotingCard from '../components/VotingCard';
import { Calendar, ArrowLeft, Sparkles, TrendingUp, MapPin } from 'lucide-react';

const EventVoting: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/resolutions', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
        const result = await response.json();
        console.log("Fetched events:", result);
        // console.log("Fetched events:", response);
        if (response.ok) {
          setEvents(result.data); // Assuming result.data contains the events array
        } else {
          setError(result.message || 'Failed to fetch events');
        }
      } catch (err) {
        setError('Failed to fetch events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // const totalVotes = events.reduce((sum, event) => sum + event.votes, 0);
  // const mostPopular = events.reduce((prev, current) => 
  //   (prev.votes > current.votes) ? prev : current
  // );

  const categories = [...new Set(events.map(event => event.category))];

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
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#464B4B]">
                    Upcoming Resolutions
                  </h1>
                  <p className="text-[#464B4B]/70">Help decide our next company Resolution</p>
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
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#464B4B]">{events.length}</p>
                <p className="text-sm text-[#464B4B]/60">Event Options</p>
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
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                {/* <p className="text-lg font-bold text-[#464B4B] truncate">{mostPopular.title}</p>
                <p className="text-sm text-[#464B4B]/60">Most popular with {mostPopular.votes} votes</p> */}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-[#464B4B] mr-2">Categories:</span>
            {categories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#0072CE]/10 text-[#0072CE] rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Event Cards Grid */}
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
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <VotingCard
                  id={event.id}
                  title={event.title}
                  subtitle={new Date(event.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  description={event.description}
                  image={event.image}
                  // votes={event.votes}
                  type="event"
                  additionalInfo={event.location}
                  onClick={() => navigate(`/resolutions/${event.id}`)}
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
            <Calendar className="h-6 w-6 text-[#0072CE]" />
            <h3 className="text-lg font-semibold text-[#464B4B]">Event Planning Guidelines</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#464B4B]/70">
            <div>
              <p className="font-medium text-[#464B4B] mb-2">Consider when voting:</p>
              <ul className="space-y-1">
                <li>• Relevance to team goals</li>
                <li>• Learning and development value</li>
                <li>• Team building potential</li>
                <li>• Work-life balance benefits</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#464B4B] mb-2">Event details:</p>
              <ul className="space-y-1">
                <li>• All resolution scheduled for 2024</li>
                <li>• Budget and logistics pre-approved</li>
                <li>• Top 3 resolution will be organized</li>
                <li>• Results announced end of month</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EventVoting;