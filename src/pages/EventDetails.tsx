import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, Sparkles, TrendingUp, MapPin, Clock, CheckCircle, User, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';



 interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  organizer: string;
  category: string;
  // votes: number;
  details: string;
}

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/resolutions/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        console.log("Fetched event:", result);

        if (response.ok) {
          setEvent(result.data);
          setHasVoted(result.data.hasVoted);
          console.log("Is Voted:", result.data.hasVoted);


        } else {
          setError(result.message || 'Failed to fetch event');
        }
      } catch (err) {
        setError('Failed to fetch event');
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);


  const handleVote = async () => {
      if (!event || hasVoted) return;
      
      setIsVoting(true);
      console.log("Voting for event:", event.id);
      try {
        const response = await apiService.voteForResolution(event.id);
        if (response.success) {
          setHasVoted(true);
          // Update vote count locally
          // setEvent(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
        }
      } catch (error) {
        console.error('Error voting:', error);
      } finally {
        setIsVoting(false);
      }
    };

    if (error || !event) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#464B4B] mb-4">{error || 'Event not found'}</h2>
          <button
            onClick={() => navigate('/voting/resolutions')}
            className="text-[#0072CE] hover:text-[#171C8F]"
          >
            Back to Event Voting
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!event) return <p>No event found.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sticky top-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <motion.button
              whileHover={{ x: -4 }}
              onClick={() => navigate('/voting/resolutions')}
              className="flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] font-medium"
              >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Event Voting</span>
            </motion.button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8"
                />
                <div className="relative h-80">
                    <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-end justify-between">
                        <div className="text-white max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-4"
                        />
                            
                        </div>
                        <h1 className="text-4xl font-bold mb-3">{event.title}</h1>
                        <p className="text-blue-100 text-lg leading-relaxed">{event.description}</p>
                        </div>
                        {/* <div className="text-right text-white">
                        <div className="text-3xl font-bold">{event.votes}</div>
                        <div className="text-blue-100">votes</div>
                        </div> */}
                    </div>
                    </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Event Info Cards */}
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid md:grid-cols-3 gap-4"
                    >
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-[#464B4B]/60">Date</p>
                            <p className="font-semibold text-[#464B4B]">{formattedDate}</p>
                        </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-[#464B4B]/60">Location</p>
                            <p className="font-semibold text-[#464B4B]">{event.location}</p>
                        </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-[#464B4B]/60">Organizer</p>
                            <p className="font-semibold text-[#464B4B]">{event.organizer}</p>
                        </div>
                        </div>
                    </div>
                    </motion.div>

                    {/* Event Details */}
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                    <div className="flex items-center space-x-3 mb-6">
                        <Sparkles className="h-6 w-6 text-[#0072CE]" />
                        <h2 className="text-2xl font-bold text-[#464B4B]">Event Details</h2>
                    </div>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-[#464B4B]/80 leading-relaxed text-lg">{event.details}</p>
                    </div>
                    </motion.div>

                    {/* Why Vote Section */}
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-[#0072CE]/5 to-[#171C8F]/5 rounded-2xl p-6 border border-[#0072CE]/10"
                    >
                    <div className="flex items-center space-x-3 mb-4">
                        <Tag className="h-6 w-6 text-[#0072CE]" />
                        <h3 className="text-xl font-bold text-[#464B4B]">Why Vote for This Event?</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                        <h4 className="font-semibold text-[#464B4B] mb-2">Benefits:</h4>
                        <ul className="text-sm text-[#464B4B]/70 space-y-1">
                            <li>• Professional development opportunity</li>
                            <li>• Team building and networking</li>
                            <li>• Knowledge sharing and learning</li>
                            <li>• Work-life balance enhancement</li>
                        </ul>
                        </div>
                        <div>
                        <h4 className="font-semibold text-[#464B4B] mb-2">Expected Outcomes:</h4>
                        <ul className="text-sm text-[#464B4B]/70 space-y-1">
                            <li>• Improved team collaboration</li>
                            <li>• Enhanced skill development</li>
                            <li>• Stronger company culture</li>
                            <li>• Increased employee satisfaction</li>
                        </ul>
                        </div>
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
                        <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-[#464B4B] mb-2">
                        Vote for This Event
                        </h3>
                        <p className="text-[#464B4B]/70 text-sm">
                        Help prioritize which events should happen next
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
                            <Sparkles className="h-5 w-5" />
                            <span>Vote for Event</span>
                            </div>
                        )}
                        </motion.button>
                    )}

                    {/* <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-[#464B4B]/60">Current votes</span>
                        <span className="font-semibold text-[#464B4B]">{event.votes}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((event.votes / 300) * 100, 100)}%` }}
                        />
                        </div>
                    </div> */}
                    </motion.div>

                    {/* Quick Info */}
                    <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#F4F4F4] rounded-2xl p-6"
                    >
                    <div className="flex items-center space-x-3 mb-4">
                        <Clock className="h-5 w-5 text-[#0072CE]" />
                        <h4 className="font-semibold text-[#464B4B]">Quick Info</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                        <span className="text-[#464B4B]/60">Category:</span>
                        <span className="font-medium text-[#464B4B]">{event.category}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="text-[#464B4B]/60">Organizer:</span>
                        <span className="font-medium text-[#464B4B]">{event.organizer}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="text-[#464B4B]/60">Status:</span>
                        <span className="font-medium text-green-600">Open for Voting</span>
                        </div>
                    </div>
                    </motion.div>
                </div>
            </div>
    </div>
    );
};

export default EventDetails;
