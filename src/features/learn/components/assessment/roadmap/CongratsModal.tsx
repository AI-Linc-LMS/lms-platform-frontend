import React, { useState, useEffect, useRef } from "react";

interface CongratsModalProps {
  open: boolean;
  onClose: () => void;
}

const CongratsModal: React.FC<CongratsModalProps> = ({ open, onClose }) => {
  const [countdown, setCountdown] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      // Clear any existing timers when modal is closed
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Reset countdown
    setCountdown(3);

    // Force close after exactly 3 seconds (backup mechanism)
    timeoutRef.current = setTimeout(() => {
      console.log("Force closing modal after 3 seconds");
      onClose();
    }, 3000);

    // Update countdown every second
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        console.log(`Countdown: ${prev} -> ${newValue}`);
        
        if (newValue <= 0) {
          console.log("Countdown reached 0, triggering close");
          // Don't clear here, let the timeout handle it
          return 0;
        }
        
        return newValue;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8 max-w-md w-full mx-4 text-center relative">
        {/* Close Button */}
        <button
          onClick={() => {
            console.log("Manual close clicked");
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <h2 className="text-3xl font-bold text-blue-700 mb-4">🎉 Congratulations!</h2>
        <p className="text-gray-600 mb-6">
          You've unlocked an exclusive opportunity. Explore our flagship course for accelerated growth!
        </p>

        {/* Link */}
        <a
          href="https://ailinc.com/flagship-course"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
        >
          Apply for scholarship
        </a>

        {/* Progress Bar */}
        <div className="w-full bg-blue-100 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${Math.max(0, ((3 - countdown) / 3) * 100)}%`,
              transform: `translateX(0)` // Force hardware acceleration
            }}
          />
        </div>
        
        {/* Countdown Display */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Auto-closing in </span>
          <span className="font-bold text-blue-600 text-lg">
            {Math.max(0, countdown)}
          </span>
          <span className="font-medium"> second{countdown !== 1 ? 's' : ''}</span>
        </div>

        {/* Debug Info (remove in production) */}
        <div className="text-xs text-gray-400 mt-2 font-mono">
          Debug: countdown={countdown}, progress={((3 - countdown) / 3) * 100}%
        </div>
      </div>
    </div>
  );
};

export default CongratsModal;
