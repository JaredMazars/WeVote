import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowLeft, Sparkles, TrendingUp, MapPin, Clock, CheckCircle, User, Tag, AlertTriangle } from 'lucide-react';
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
  votes: number;
  details: string;
}

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [totalVoteCount, setTotalVoteCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(false);
  const [agmStatus, setAgmStatus] = useState<{
    isActive: boolean;
    canVote: boolean;
    message: string;
  } | null>(null);
  const [userVoteDetails, setUserVoteDetails] = useState<{
    vote_id: string;
    vote_choice: string;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedNewChoice, setSelectedNewChoice] = useState('');

  const showWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const checkAGMStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/agm/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAgmStatus({
          isActive: result.data.isActive,
          canVote: result.data.canVote,
          message: result.data.message
        });
      }
    } catch (error) {
      console.error('Error checking AGM status:', error);
    }
  };

  // Function to check if current user has voted for this resolution
  const checkUserVoteStatus = async (resolutionId: string): Promise<boolean> => {
    try {
      setCheckingVoteStatus(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, user not logged in');
        return false;
      }

      console.log('Checking vote status for resolution:', resolutionId);

      const response = await fetch(`http://localhost:3001/api/votes/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vote_type: 'resolution',
          resolution_id: resolutionId
        }),
      });

      const result = await response.json();
      console.log('Raw vote check response:', response.status, result);
      
      if (response.ok) {
        // Handle different possible response structures
        if (result.success !== undefined) {
          // If the API returns a success field, check the data
          const hasVotedValue = result.success && (result.data?.hasVoted === true || result.hasVoted === true);
          
          // Store vote details if user has voted
          if (hasVotedValue && result.data?.voteDetails) {
            setUserVoteDetails({
              vote_id: result.data.voteDetails.vote_id,
              vote_choice: result.data.voteDetails.vote_choice
            });
          }
          
          console.log('Vote status from success response:', hasVotedValue);
          return hasVotedValue;
        } else {
          // Direct hasVoted property
          const hasVotedValue = result.hasVoted === true;
          
          if (hasVotedValue && result.voteDetails) {
            setUserVoteDetails({
              vote_id: result.voteDetails.vote_id,
              vote_choice: result.voteDetails.vote_choice
            });
          }
          
          console.log('Vote status from direct response:', hasVotedValue);
          return hasVotedValue;
        }
      } else {
        console.error('Error checking vote status:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    } finally {
      setCheckingVoteStatus(false);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        
        // Check AGM status first
        await checkAGMStatus();
        
        const response = await fetch(`http://localhost:3001/api/resolutions/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        console.log("Fetched event:", result);

        if (response.ok) {
          // Fetch vote count for this resolution
          try {
            const votesResult = await apiService.getVoteStatusByResolutionId(id!);
            console.log("Vote result for resolution:", votesResult);
            
            let resolutionVotes = 0;
            if (votesResult && votesResult.success && votesResult.data) {
              // Handle nested data structure
              const voteData = votesResult.data.data || votesResult.data;
              console.log("Vote data:", voteData);
              
              if (voteData.totalVoteCount !== undefined) {
                resolutionVotes = voteData.totalVoteCount;
                setTotalVoteCount(voteData.totalVoteCount);
              } else if (voteData.totalVotes !== undefined) {
                resolutionVotes = voteData.totalVotes;
                setTotalVoteCount(voteData.totalVotes);
              } else if (Array.isArray(voteData)) {
                resolutionVotes = voteData.length;
                setTotalVoteCount(voteData.length);
              }
            }

            setEvent({
              ...result.data,
              votes: resolutionVotes,
            });
          } catch (voteError) {
            console.error('Error fetching votes:', voteError);
            setTotalVoteCount(result.data.total_votes || 0);
          }
          
          // Check if current user has voted for this resolution
          const userHasVoted = await checkUserVoteStatus(id!);
          console.log("Initial vote status check result:", userHasVoted);
          setHasVoted(userHasVoted);
          console.log("Initial hasVoted state set to:", userHasVoted);
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

  const handleVote = async (choice: string) => {
    console.log('Attempting to vote - Current hasVoted state:', hasVoted);
    console.log('Event ID:', event?.id);
    console.log('User selected choice:', choice);

    // Check AGM status
    if (!agmStatus?.canVote) {
      showWarning(agmStatus?.message || 'Voting is currently not available.');
      return;
    }

    if (!event || !event.id) {
      showWarning('Invalid event. Cannot vote.');
      return;
    }
    
    setIsVoting(true);
    console.log("Submitting vote for resolution ID:", event.id, "with choice:", choice);
    
    try {
      // Double-check vote status right before submitting
      const currentVoteStatus = await checkUserVoteStatus(event.id);
      console.log("Pre-vote check - hasVoted:", currentVoteStatus);
      
      if (currentVoteStatus) {
        setHasVoted(true);
        showWarning('You have already voted for this resolution.');
        return;
      }

      // Pass the vote_choice to the API
      const response = await apiService.voteForResolution(event.id, choice);
      console.log("Vote response:", response);
      
      if (response.success) {
        setHasVoted(true);
        setUserVoteDetails({
          vote_id: response.data?.vote_id || '',
          vote_choice: choice
        });
        // Update vote count locally
        setEvent(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
        setTotalVoteCount(prev => prev + 1);
        showSuccess(`Your vote (${choice}) has been successfully submitted!`);
        console.log("Vote submitted successfully, hasVoted set to true");
      } else {
        if (response.message && response.message.includes('already voted')) {
          setHasVoted(true);
          showWarning('You have already voted for this resolution.');
        } else {
          showWarning(response.message || 'Failed to submit vote');
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      
      if (error.message && error.message.includes('already voted')) {
        setHasVoted(true);
        showWarning('You have already voted for this resolution.');
      } else {
        showWarning(error.message || 'Failed to submit vote');
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleEditVote = async () => {
    if (!selectedNewChoice || !userVoteDetails?.vote_id) {
      showWarning('Please select a new vote choice.');
      return;
    }

    if (selectedNewChoice === userVoteDetails.vote_choice) {
      showWarning('You selected the same choice. No changes made.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/votes/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vote_id: userVoteDetails.vote_id,
          new_vote_choice: selectedNewChoice
        })
      });

      const result = await response.json();

      if (result.success) {
        setUserVoteDetails(prev => prev ? { ...prev, vote_choice: selectedNewChoice } : null);
        showSuccess(`Vote updated to ${selectedNewChoice}!`);
        setShowEditModal(false);
        setSelectedNewChoice('');
      } else {
        showWarning(result.message || 'Failed to update vote');
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      showWarning('Failed to update vote');
    }
  };

  const handleRemoveVote = async () => {
    if (!userVoteDetails?.vote_id) {
      showWarning('No vote to remove.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/votes/${userVoteDetails.vote_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setUserVoteDetails(null);
        setHasVoted(false);
        showSuccess('Vote removed successfully!');
        setShowRemoveModal(false);
      } else {
        showWarning(result.message || 'Failed to remove vote');
      }
    } catch (error) {
      console.error('Error removing vote:', error);
      showWarning('Failed to remove vote');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Event Details</h1>
        {event ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">{event.title}</h2>
            <p className="text-gray-700">{event.description}</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading event details...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
