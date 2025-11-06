import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

interface StreakCongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
}

const StreakCongratulationsModal: React.FC<StreakCongratulationsModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                duration: 0.5,
                bounce: 0.4,
              }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>

              {/* Confetti Animation */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl"
                      initial={{
                        top: "-10%",
                        left: `${Math.random() * 100}%`,
                        rotate: 0,
                      }}
                      animate={{
                        top: "110%",
                        rotate: 360,
                        transition: {
                          duration: 2 + Math.random() * 2,
                          delay: Math.random() * 0.5,
                          ease: "easeOut",
                        },
                      }}
                    >
                      {["🎉", "✨", "🔥", "⭐", "💪"][Math.floor(Math.random() * 5)]}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Fire emoji with animation */}
                <motion.div
                  className="text-8xl mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                >
                  🔥
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Streak Updated!
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  className="text-gray-600 text-lg mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  You've completed today's activity!
                </motion.p>

                {/* Streak count display */}
                <motion.div
                  className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-300 shadow-lg mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  <p className="text-sm text-gray-600 mb-2">Current Streak</p>
                  <div className="flex items-center justify-center gap-2">
                    <motion.span
                      className="text-5xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      {currentStreak}
                    </motion.span>
                    <motion.span
                      className="text-4xl"
                      animate={{
                        rotate: [0, 12, -12, 0],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    >
                      🔥
                    </motion.span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 font-semibold">
                    {currentStreak === 1 ? "day" : "days"} in a row!
                  </p>
                </motion.div>

                {/* Motivational message */}
                <motion.p
                  className="text-gray-700 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Keep it up! Come back tomorrow to maintain your streak! 💪
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StreakCongratulationsModal;
