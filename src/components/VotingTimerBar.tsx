import React, { useEffect, useState } from 'react';

const VotingTimerBar: React.FC = () => {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    async function fetchTimer() {
      try {
        const response = await fetch('http://localhost:3001/api/admin/agm-timer/status');
        const result = await response.json();
        const timer = result.agmTimer;
        setActive(timer.active);
        if (timer.active) {
          const now = new Date();
          const [startH, startM] = timer.start.split(':').map(Number);
          const [endH, endM] = timer.end.split(':').map(Number);
          const start = new Date(now); start.setHours(startH, startM, 0, 0);
          const end = new Date(now); end.setHours(endH, endM, 0, 0);
          if (now < start) {
            setTimeLeft(`Voting opens at ${timer.start}`);
          } else if (now > end) {
            setTimeLeft('Voting closed');
          } else {
            const diffMs = end.getTime() - now.getTime();
            const mins = Math.max(0, Math.floor(diffMs / 60000));
            setTimeLeft(`Voting closes in ${mins} min`);
          }
        } else {
          setTimeLeft('');
        }
      } catch {
        setActive(false);
        setTimeLeft('');
      }
    }
    fetchTimer();
    window.addEventListener('agmTimerUpdated', fetchTimer);
    const interval = setInterval(fetchTimer, 30 * 1000);
    return () => {
      window.removeEventListener('agmTimerUpdated', fetchTimer);
      clearInterval(interval);
    };
  }, []);

  if (!active || !timeLeft) return null;
  return (
    <div className="w-full bg-blue-600 text-white text-center py-2 font-bold">
      {timeLeft}
    </div>
  );
};

export default VotingTimerBar;