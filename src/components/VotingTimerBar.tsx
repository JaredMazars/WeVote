import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const VotingTimerBar: React.FC = () => {
  const [agmTimerStatus, setAgmTimerStatus] = useState<'idle' | 'running' | 'ended'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [agmStartDateTime, setAgmStartDateTime] = useState<Date | null>(null);
  const [agmEndTime, setAgmEndTime] = useState('17:00');

  // Calculate time status and remaining/upcoming time
  const getTimerStatus = () => {
    if (agmTimerStatus !== 'running' || !agmStartDateTime || !agmEndTime) {
      return null;
    }

    const now = currentTime;
    const startDateTime = agmStartDateTime;
    
    // Parse end time and create end datetime
    const endTimeParts = agmEndTime.split(':');
    if (endTimeParts.length !== 2) {
      console.error('Invalid end time format:', agmEndTime);
      return null;
    }
    
    const [endHour, endMinute] = endTimeParts.map(Number);
    if (isNaN(endHour) || isNaN(endMinute)) {
      console.error('Invalid hour/minute values:', endHour, endMinute);
      return null;
    }
    
    // Create end datetime based on start datetime
    const endDateTime = new Date(startDateTime.getTime());
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    // If end time is before start time, assume it's the next day
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    // Check if AGM hasn't started yet
    if (now < startDateTime) {
      const untilStartMs = startDateTime.getTime() - now.getTime();
      const hours = Math.floor(untilStartMs / (1000 * 60 * 60));
      const minutes = Math.floor((untilStartMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((untilStartMs % (1000 * 60)) / 1000);
      
      return { 
        status: 'upcoming', 
        hours, 
        minutes, 
        seconds,
        startTime: startDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    }

    // Check if AGM is currently active
    if (now >= startDateTime && now < endDateTime) {
      const remainingMs = endDateTime.getTime() - now.getTime();
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      return { status: 'active', hours, minutes, seconds };
    }

    // AGM time has expired
    return { status: 'expired', hours: 0, minutes: 0, seconds: 0 };
  };

  useEffect(() => {
    // Fetch AGM timer status from backend API
    const fetchAgmStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/admin/agm-timer/status');
        if (response.ok) {
          const data = await response.json();
          
          if (data.agmTimer && data.agmTimer.active) {
            // Timer is active on backend
            setAgmTimerStatus('running');
            setAgmStartDateTime(new Date(data.agmTimer.startedAt));
            setAgmEndTime(data.agmTimer.end);
            
            // Update localStorage to sync across tabs
            localStorage.setItem('agmTimerStart', data.agmTimer.startedAt);
            localStorage.setItem('agmTimerEndTime', data.agmTimer.end);
            localStorage.removeItem('agmTimerEnd');
          } else {
            // Timer is not active
            const agmEnd = localStorage.getItem('agmTimerEnd');
            if (agmEnd) {
              setAgmTimerStatus('ended');
            } else {
              setAgmTimerStatus('idle');
            }
            setAgmStartDateTime(null);
          }
        }
      } catch (error) {
        console.error('Error fetching AGM timer status:', error);
        // Fallback to localStorage if API fails
        checkLocalStorageStatus();
      }
    };

    // Fallback: Check localStorage for AGM timer state
    const checkLocalStorageStatus = () => {
      const agmStart = localStorage.getItem('agmTimerStart');
      const agmEnd = localStorage.getItem('agmTimerEnd');
      const savedEndTime = localStorage.getItem('agmTimerEndTime');
      
      if (savedEndTime) setAgmEndTime(savedEndTime);
      
      if (agmEnd) {
        setAgmTimerStatus('ended');
        setAgmStartDateTime(null);
      } else if (agmStart) {
        setAgmTimerStatus('running');
        setAgmStartDateTime(new Date(agmStart));
      } else {
        setAgmTimerStatus('idle');
        setAgmStartDateTime(null);
      }
    };

    // Initial fetch from backend
    fetchAgmStatus();

    // Poll backend every 10 seconds to sync timer state
    const pollInterval = setInterval(() => {
      fetchAgmStatus();
    }, 10000);

    // Listen for AGM timer updates (when admin changes timer state)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agmTimerStart' || e.key === 'agmTimerEnd' || e.key === 'agmTimerEndTime') {
        fetchAgmStatus();
      }
    };

    // Listen for custom events (when admin changes timer on same page)
    const handleAgmTimerUpdate = () => {
      fetchAgmStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agmTimerUpdated', handleAgmTimerUpdate);

    // Update current time every second when timer is running
    let timeInterval: NodeJS.Timeout;
    if (agmTimerStatus === 'running') {
      timeInterval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agmTimerUpdated', handleAgmTimerUpdate);
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [agmTimerStatus]);

  // Don't show anything if timer is idle
  if (agmTimerStatus === 'idle') return null;

  const timerStatus = getTimerStatus();

  // Ended state
  if (agmTimerStatus === 'ended') {
    return (
      <div className="w-full bg-red-600 text-white py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-bold text-lg">AGM SESSION ENDED</span>
        </div>
      </div>
    );
  }

  // Expired state (timer was running but time is up)
  if (timerStatus?.status === 'expired') {
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
  if (timerStatus?.status === 'upcoming') {
    return (
      <div className="w-full bg-blue-600 text-white py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-4">
          <Clock className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">AGM STARTS IN</span>
            <span className="font-mono text-xl font-bold">
              {timerStatus.hours > 0 ? `${timerStatus.hours}:` : ''}
              {String(timerStatus.minutes).padStart(2, '0')}:
              {String(timerStatus.seconds).padStart(2, '0')}
            </span>
            <span className="text-white/90 font-medium">• Starts at {timerStatus.startTime}</span>
          </div>
        </div>
      </div>
    );
  }

  // Active state with countdown
  if (timerStatus?.status === 'active') {
    return (
      <div className="w-full bg-green-600 text-white py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-4">
          <Clock className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">AGM IN PROGRESS - VOTING ACTIVE</span>
            <span className="text-white/80">•</span>
            <span className="font-mono text-xl font-bold">
              {timerStatus.hours > 0 ? `${timerStatus.hours}:` : ''}
              {String(timerStatus.minutes).padStart(2, '0')}:
              {String(timerStatus.seconds).padStart(2, '0')}
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