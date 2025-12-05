import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Event } from '../utils/types';
import VotingCard from '../components/VotingCard';
import { Calendar, ArrowLeft, Sparkles, TrendingUp, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiCall, isOnline, NetworkError } from '../utils/apiHelpers';

const EventVoting: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isRetrying, setIsRetrying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchEvents = async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      console.log('🔄 Fetching resolutions...');

      const result = await apiCall<{ success: boolean; data: Event[]; message?: string }>(
        '/api/resolutions',
        {
          method: 'GET',
          signal: abortControllerRef.current.signal,
          retries: 2,
          timeout: 30000
        }
      );

      console.log('✅ Resolutions fetched successfully:', result);

      if (result.success && result.data) {
        setEvents(result.data);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch resolutions');
      }
    } catch (err: any) {
      console.error('❌ Error fetching resolutions:', err);
      
      // Don't set error if request was cancelled
      if (err.name === 'AbortError') {
        console.log('ℹ️ Request cancelled');
        return;
      }

      if (err instanceof NetworkError) {
        if (err.status === 401) {
          setError('Session expired. Please login again.');
        } else if (err.status === 0) {
          setError('No internet connection. Please check your network.');
        } else {
          setError(err.message || 'Failed to load resolutions. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    fetchEvents();

    // Cleanup: cancel pending request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRetry = () => {
    if (!isOffline) {
      fetchEvents(true);
    }
  };

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
          <div className="flex flex-col justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-[#0072CE] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading resolutions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="mb-6">
              {isOffline ? (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <WifiOff className="h-8 w-8 text-orange-600" />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isOffline ? 'No Internet Connection' : 'Failed to Load Resolutions'}
            </h3>
            
            <p className="text-red-600 mb-6 max-w-md mx-auto">
              {error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleRetry}
                disabled={isRetrying || isOffline}
                className="flex items-center justify-center gap-2 bg-[#0072CE] text-white px-6 py-3 rounded-lg hover:bg-[#005FA3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/voting')}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Resolutions Available
            </h3>
            <p className="text-gray-600">
              There are currently no resolutions to vote for.
            </p>
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