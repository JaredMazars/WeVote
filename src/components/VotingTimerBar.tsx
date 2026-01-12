import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface AGMSession {
  SessionID: number;
  Title: string;
  Status: 'scheduled' | 'in_progress' | 'completed';
  ScheduledStartTime: string;
  ScheduledEndTime: string;
  ActualStartTime?: string;
  ActualEndTime?: string;
}

const VotingTimerBar: React.FC = () => {
  const { user } = useAuth();
  const [agmSession, setAgmSession] = useState<AGMSession | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Fetch active AGM session from backend
  const fetchActiveSession = async () => {
    try {
      console.log('[VotingTimerBar] Fetching active session...');
      const response = await api.get('/sessions?status=in_progress');
      const sessions = (response.data as any)?.sessions || [];
      
      console.log('[VotingTimerBar] In-progress sessions:', sessions);
      
      if (sessions.length > 0) {
        console.log('[VotingTimerBar] Found active session:', sessions[0]);
        setAgmSession(sessions[0]); // Get first active session
      } else {
        // Check for scheduled sessions
        const scheduledResponse = await api.get('/sessions?status=scheduled');
        const scheduledSessions = (scheduledResponse.data as any)?.sessions || [];
        console.log('[VotingTimerBar] Scheduled sessions:', scheduledSessions);
        
        if (scheduledSessions.length > 0) {
          setAgmSession(scheduledSessions[0]);
        } else {
          // Check for completed sessions
          const completedResponse = await api.get('/sessions?status=completed');
          const completedSessions = (completedResponse.data as any)?.sessions || [];
          if (completedSessions.length > 0) {
            // Show completed status for last 5 minutes
            const lastSession = completedSessions[0];
            const completedTime = new Date(lastSession.ActualEndTime || lastSession.ScheduledEndTime);
            const timeSinceCompletion = Date.now() - completedTime.getTime();
            if (timeSinceCompletion < 5 * 60 * 1000) { // 5 minutes
              setAgmSession(lastSession);
            } else {
              setAgmSession(null);
            }
          } else {
            console.log('[VotingTimerBar] No sessions found');
            setAgmSession(null);
          }
        }
      }
    } catch (error) {
      console.error('[VotingTimerBar] Error fetching AGM session:', error);
      setAgmSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[VotingTimerBar] Component mounted, fetching session...');
    fetchActiveSession();
    
    // Poll for updates every 10 seconds (reduced from 30)
    const pollInterval = setInterval(fetchActiveSession, 10000);
    
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Calculate time status and remaining/upcoming time
  const getTimerStatus = () => {
    if (!agmSession) return null;

    const now = currentTime;
    const startDateTime = new Date(agmSession.ScheduledStartTime);
    const endDateTime = new Date(agmSession.ScheduledEndTime);

    // If session is completed
    if (agmSession.Status === 'completed') {
      return { status: 'completed' };
    }

    // Check if AGM hasn't started yet
    if (now < startDateTime && agmSession.Status === 'scheduled') {
      const untilStartMs = startDateTime.getTime() - now.getTime();
      const hours = Math.floor(untilStartMs / (1000 * 60 * 60));
      const minutes = Math.floor((untilStartMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((untilStartMs % (1000 * 60)) / 1000);
      
      return { 
        status: 'upcoming', 
        hours, 
        minutes, 
        seconds,
        startTime: startDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        title: agmSession.Title
      };
    }

    // Check if AGM is currently active
    if (agmSession.Status === 'in_progress') {
      const remainingMs = endDateTime.getTime() - now.getTime();
      
      if (remainingMs > 0) {
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        
        return { status: 'active', hours, minutes, seconds, title: agmSession.Title };
      } else {
        return { status: 'expired', title: agmSession.Title };
      }
    }

    return null;
  };

  if (loading) return null;

  const timerStatus = getTimerStatus();
  if (!timerStatus) return null;

  // Completed state
  if (timerStatus.status === 'completed') {
    return (
      <div className="w-full bg-red-700 text-white py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-bold text-lg">
            {user?.role === 'auditor' ? 'AGM SESSION CLOSED - AUDIT DATA AVAILABLE' : 'AGM SESSION CLOSED - VOTING ENDED'}
          </span>
        </div>
      </div>
    );
  }

  // Expired state (timer was running but time is up)
  if (timerStatus.status === 'expired') {
    return (
      <div className="w-full bg-orange-600 text-white py-3 shadow-lg animate-pulse">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 animate-bounce" />
          <span className="font-bold text-lg">AGM TIME EXPIRED - VOTING MAY BE CLOSED</span>
        </div>
      </div>
    );
  }

  // Upcoming state (AGM scheduled but not started yet)
  if (timerStatus.status === 'upcoming') {
    return (
      <div className="w-full bg-blue-600 text-white py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-4">
          <Clock className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{timerStatus.title} STARTS IN</span>
            <span className="font-mono text-xl font-bold">
              {(timerStatus.hours && timerStatus.hours > 0) ? `${timerStatus.hours}:` : ''}
              {String(timerStatus.minutes || 0).padStart(2, '0')}:
              {String(timerStatus.seconds || 0).padStart(2, '0')}
            </span>
            <span className="text-white/90 font-medium">• Starts at {timerStatus.startTime}</span>
          </div>
        </div>
      </div>
    );
  }

  // Active state with countdown
  if (timerStatus.status === 'active') {
    return (
      <div className="w-full bg-green-600 text-white py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-4">
          <Clock className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{timerStatus.title} - VOTING ACTIVE</span>
            <span className="text-white/80">•</span>
            <span className="font-mono text-xl font-bold">
              {(timerStatus.hours && timerStatus.hours > 0) ? `${timerStatus.hours}:` : ''}
              {String(timerStatus.minutes || 0).padStart(2, '0')}:
              {String(timerStatus.seconds || 0).padStart(2, '0')}
            </span>
            <span className="text-white/90 font-medium">remaining</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VotingTimerBar;
