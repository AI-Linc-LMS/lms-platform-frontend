import React, { useState, useEffect, useRef } from "react";

interface CongratsModalProps {
  open: boolean;
  onClose: () => void;
}

const CongratsModal: React.FC<CongratsModalProps> = ({ open, onClose }) => {
  const [, setCountdown] = useState(3);
  const [isVisible, setIsVisible] = useState(false);
  const [, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsVisible(false);
      setShowConfetti(false);
      return;
    }

    // Trigger entrance animation
    setIsVisible(true);
    setShowConfetti(true);
    setCountdown(3);

    const startCountdown = () => {
      timerRef.current = setTimeout(() => {
        setCountdown((prevCount) => {
          const newCount = prevCount - 1;

          if (newCount <= 0) {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            handleClose();
            return 0;
          }

          startCountdown();
          return newCount;
        });
      }, 1000);
    };

    startCountdown();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for exit animation
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-start justify-center pt-16 transition-all duration-300 ${
        isVisible ? "bg-black/50" : "bg-black/0"
      }`}
    >
      {/* Animated Background Blur */}
      <div className="absolute inset-0 backdrop-blur-md transition-all duration-500" />

      {/* Confetti Animation */}
      {/* {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)],
                                }}
                            />
                        </div>
                    ))}
                </div>
            )} */}

      {/* Modal Container */}
      <div
        className={`relative bg-gradient-to-br from-white via-blue-50 to-white rounded-3xl shadow-2xl border border-blue-200/50 p-8 max-w-lg w-full mx-4 text-center transform transition-all duration-500 ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* Decorative Elements
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse" />
                <div className="absolute -top-2 -right-6 w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-pulse delay-300" />
                <div className="absolute -bottom-3 -left-2 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse delay-700" /> */}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100/80 transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Success Icon with Animation */}
        <div className="relative mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-bounce">
            <svg
              className="w-8 h-8 text-[var(--font-light)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-ping opacity-20" />
        </div>

        {/* Title with Gradient */}
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4 animate-pulse">
          Assessment Submitted!
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          <span className="font-semibold text-blue-600">Congratulations!</span>{" "}
          You did it! Now it's time to see where you shine.
          <br />
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Download your Certificate & Check your Placement Report
          </span>
        </p>

        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
          <a
            href="https://ailinc.com/flagship-course"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-[var(--font-light)] font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Apply for Scholarship
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>

          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-300"
          >
            Continue to Results
          </button>
        </div>

        {/* Countdown Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-center space-x-3 mb-3">
            {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-[var(--font-light)] animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                            </svg>
                        </div> */}
            {/* <span className="text-sm text-gray-500 font-medium">Auto-closing in</span> */}
            {/* <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-[var(--font-light)] px-3 py-1 rounded-full font-bold text-lg min-w-[2rem] h-8 flex items-center justify-center">
                            {Math.max(0, countdown)}
                        </div>
                        <span className="text-sm text-gray-500 font-medium">second{countdown !== 1 ? 's' : ''}</span> */}
          </div>

          {/* Progress Bar */}
          {/* <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-out rounded-full"
                            style={{
                                width: `${Math.max(0, ((3 - countdown) / 3) * 100)}%`
                            }}
                        />
                    </div> */}
        </div>

        {/* Floating particles */}
        {/* <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping"
                            style={{
                                left: `${20 + Math.random() * 60}%`,
                                top: `${20 + Math.random() * 60}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: '2s',
                            }}
                        />
                    ))}
                </div> */}
      </div>
    </div>
  );
};

export default CongratsModal;
