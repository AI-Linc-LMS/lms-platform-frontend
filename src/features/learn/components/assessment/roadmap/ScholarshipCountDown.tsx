import React, { useState, useEffect } from "react";
import { differenceInDays, addDays } from 'date-fns';

interface ScholarshipCountdownProps {
  assessmentDate?: string;
  expiryDays?: number;
  className?: string;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ScholarshipCountdown: React.FC<ScholarshipCountdownProps> = ({
  assessmentDate,
  expiryDays = 7,
  className = ""
}) => {
  const [scholarshipExpiryDate, setScholarshipExpiryDate] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [countdown, setCountdown] = useState<CountdownState>({
    days: expiryDays,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Set scholarship expiry date
  useEffect(() => {
    const expiryDate = assessmentDate
      ? addDays(new Date(assessmentDate), expiryDays)
      : addDays(new Date(), expiryDays);

    setScholarshipExpiryDate(expiryDate);
  }, [assessmentDate, expiryDays]);

  // Calculate time remaining (detailed format)
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (scholarshipExpiryDate) {
        const now = new Date();
        const daysLeft = differenceInDays(scholarshipExpiryDate, now);

        if (daysLeft >= 0) {
          const hoursLeft = Math.floor(
            (scholarshipExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          ) % 24;

          const minutesLeft = Math.floor(
            (scholarshipExpiryDate.getTime() - now.getTime()) / (1000 * 60)
          ) % 60;

          let timeRemainingStr = '';
          if (daysLeft > 0) {
            timeRemainingStr += `${daysLeft} day${daysLeft !== 1 ? 's' : ''} `;
          }
          timeRemainingStr += `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} `;
          timeRemainingStr += `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;

          setTimeRemaining(timeRemainingStr.trim());
        } else {
          setTimeRemaining('Scholarship Expired');
        }
      } else {
        setTimeRemaining(`${expiryDays} days`);
      }
    };

    updateTimeRemaining();
    const intervalId = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(intervalId);
  }, [scholarshipExpiryDate, expiryDays]);

  // Countdown timer (seconds precision)
  useEffect(() => {
    const expiryDate = scholarshipExpiryDate || addDays(new Date(), expiryDays);

    const countdownInterval = setInterval(() => {
      const now = new Date();
      const difference = expiryDate.getTime() - now.getTime();

      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days: d, hours: h, minutes: m, seconds: s });
      } else {
        clearInterval(countdownInterval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [scholarshipExpiryDate, expiryDays]);

  const isExpired = timeRemaining === 'Scholarship Expired';

  return (
    <div className={`w-full bg-yellow-50  p-4 rounded-r-lg shadow-md ${className}`}>
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">
              Scholarship Offer
            </h3>
            {!isExpired ? (
              <>
                <div className="flex items-center space-x-1 mt-1">
                  {/* Compact Countdown Boxes */}
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                      {countdown.days}
                    </span>
                    <span className="text-[10px] text-yellow-600 mt-0.5">D</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-700">:</div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                      {countdown.hours}
                    </span>
                    <span className="text-[10px] text-yellow-600 mt-0.5">H</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-700">:</div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                      {countdown.minutes}
                    </span>
                    <span className="text-[10px] text-yellow-600 mt-0.5">M</span>
                  </div>
                  <div className="text-sm font-bold text-yellow-700">:</div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                      {countdown.seconds}
                    </span>
                    <span className="text-[10px] text-yellow-600 mt-0.5">S</span>
                  </div>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Hurry! Claim your scholarship
                </p>
              </>
            ) : (
              <div className="mt-1 text-red-600 font-medium text-xs">
                Scholarship offer has expired
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipCountdown;
