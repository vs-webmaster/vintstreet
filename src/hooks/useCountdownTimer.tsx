import { useState, useEffect, useMemo, useRef } from 'react';

const formatTimeRemaining = (distance: number): string => {
  if (distance < 0) return 'Ended';

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

export const useCountdownTimer = (endTime: string | null | undefined): string => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const prevValueRef = useRef<string>('');

  // Memoize endTime timestamp to prevent unnecessary effect reruns
  const endTimestamp = useMemo(() => {
    if (!endTime) return null;
    return new Date(endTime).getTime();
  }, [endTime]);

  useEffect(() => {
    if (endTimestamp === null) return;

    const updateTimeRemaining = () => {
      const distance = endTimestamp - Date.now();
      const formatted = formatTimeRemaining(distance);

      // Only update state if value changed
      if (prevValueRef.current !== formatted) {
        prevValueRef.current = formatted;
        setTimeRemaining(formatted);
      }

      // Stop updating if ended
      if (distance < 0) return;

      // Use setTimeout for more precise timing (avoids drift)
      timeoutId = setTimeout(updateTimeRemaining, 1000);
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    updateTimeRemaining();

    return () => clearTimeout(timeoutId);
  }, [endTimestamp]);

  return timeRemaining;
};
