import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = () => {
  const calculateTimeLeft = (): TimeLeft => {
    const targetDate = new Date('2025-12-01T00:00:00');
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 text-white">
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold md:text-6xl">{timeLeft.days}</div>
        <div className="text-sm uppercase md:text-base">Days</div>
      </div>
      <div className="text-4xl font-bold md:text-6xl">:</div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold md:text-6xl">{String(timeLeft.hours).padStart(2, '0')}</div>
        <div className="text-sm uppercase md:text-base">Hours</div>
      </div>
      <div className="text-4xl font-bold md:text-6xl">:</div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold md:text-6xl">{String(timeLeft.minutes).padStart(2, '0')}</div>
        <div className="text-sm uppercase md:text-base">Minutes</div>
      </div>
      <div className="text-4xl font-bold md:text-6xl">:</div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold md:text-6xl">{String(timeLeft.seconds).padStart(2, '0')}</div>
        <div className="text-sm uppercase md:text-base">Seconds</div>
      </div>
    </div>
  );
};
