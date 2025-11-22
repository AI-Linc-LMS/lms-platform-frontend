import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StreakCongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  currentStreak: number;
  completionDate?: string | null;
}

const StreakCongratulationsModal: React.FC<StreakCongratulationsModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  currentStreak,
  completionDate,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[9998]"
            onClick={onClose}
          />

          {/* Modal Container - Positioned at top */}
          <div className="fixed top-0 left-0 right-0 z-[9999] p-4 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-auto border border-[var(--neutral-200)] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Content */}
              <div className="p-6">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-[var(--neutral-400)] hover:text-[var(--neutral-600)] p-1 rounded transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-[var(--neutral-700)] mb-3 pr-8">
                  Congratulations!
                </h2>

                {/* Subtitle */}
                <p className="text-[var(--neutral-500)] text-base mb-6">
                  You've kept your learning streak alive for today.
                </p>

                {/* Streak count display */}
                <div className="bg-[var(--neutral-50)] rounded-lg p-6 border border-[var(--neutral-200)] mb-6">
                  <p className="text-sm font-semibold text-[var(--neutral-500)] mb-2 uppercase tracking-wide">
                    Current Streak
                  </p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-[var(--primary-500)]">
                      {currentStreak}
                    </span>
                    <span className="text-lg text-[var(--neutral-500)] font-medium">
                      {currentStreak === 1 ? "day" : "days"} in a row
                    </span>
                  </div>
                  {completionDate && (
                    <p className="text-xs text-[var(--neutral-400)] mt-3">
                      Marked on {new Date(completionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Motivational message */}
                <p className="text-[var(--neutral-600)] text-base leading-relaxed mb-6">
                  You're building an amazing habit—keep pushing and come back tomorrow to go even further!
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onContinue ?? onClose}
                    className="flex-1 px-6 py-3 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-[var(--font-light)] font-semibold rounded-lg transition-colors duration-200"
                  >
                    Continue learning
                  </button>
                  
                  <div className="px-6 py-3 bg-[var(--neutral-100)] text-[var(--neutral-600)] text-sm font-medium rounded-lg text-center">
                    Next milestone: {Math.max(1, currentStreak + 1)}-day streak
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StreakCongratulationsModal;
