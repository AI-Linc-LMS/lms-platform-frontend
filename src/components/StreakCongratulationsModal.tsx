import React, { useEffect, useState } from "react";
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
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      setShowConfetti(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop with enhanced blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
            onClick={onClose}
          />

          {/* Modal Container - Fixed to viewport center */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 100, rotateX: -15 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                rotateX: 0,
              }}
              exit={{ 
                scale: 0.8, 
                opacity: 0, 
                y: 50,
                rotateX: 15,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
              }}
              className="bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto relative border border-orange-100/50 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 100px rgba(251, 146, 60, 0.15)",
              }}
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.3) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)",
                    "radial-gradient(circle at 50% 20%, rgba(251, 146, 60, 0.3) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.3) 0%, transparent 50%)",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Enhanced Confetti Animation */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                  {[...Array(50)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl sm:text-3xl"
                      initial={{
                        top: `${Math.random() * 20 - 10}%`,
                        left: `${Math.random() * 100}%`,
                        rotate: 0,
                        scale: 0,
                      }}
                      animate={{
                        top: "110%",
                        rotate: [0, 180, 360],
                        scale: [0, 1.2, 1],
                        x: (Math.random() - 0.5) * 200,
                      }}
                      transition={{
                        duration: 2.5 + Math.random() * 2,
                        delay: Math.random() * 0.8,
                        ease: "easeOut",
                        repeat: 0,
                      }}
                    >
                      {["🎉", "✨", "🔥", "⭐", "💪", "🎊", "🏆", "🌟"][Math.floor(Math.random() * 8)]}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="relative p-8 sm:p-10 text-center z-20">
                {/* Fire emoji with enhanced animation */}
                <motion.div
                  className="text-8xl sm:text-9xl mb-4 relative"
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0],
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 0.3,
                    ease: "easeInOut",
                  }}
                  style={{
                    filter: "drop-shadow(0 0 20px rgba(251, 146, 60, 0.5))",
                  }}
                >
                  🔥
                </motion.div>

                {/* Title with enhanced gradient */}
                <motion.h2
                  className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-orange-500 via-red-500 via-pink-500 to-orange-500 bg-clip-text text-transparent mb-3 bg-[length:200%_auto]"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                    backgroundPosition: ["0% center", "200% center"],
                  }}
                  transition={{ 
                    delay: 0.2,
                    backgroundPosition: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  style={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 2px 10px rgba(251, 146, 60, 0.2)",
                  }}
                >
                  Congratulations, well done!
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  className="text-gray-700 text-base sm:text-lg mb-6 font-medium"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  You've kept your learning streak alive for today.
                </motion.p>

                {/* Enhanced Streak count display */}
                <motion.div
                  className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-3xl p-6 sm:p-8 border-2 border-orange-300/60 shadow-xl mb-6 relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.7, rotateY: -90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                  style={{
                    boxShadow: "0 10px 30px rgba(251, 146, 60, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut",
                    }}
                  />
                  
                  <p className="text-sm font-semibold text-gray-600 mb-3 tracking-wide uppercase">Current Streak</p>
                  <div className="flex items-center justify-center gap-3">
                    <motion.span
                      className="text-6xl sm:text-7xl font-black bg-gradient-to-b from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent relative"
                      animate={{
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        repeatDelay: 0.8,
                        ease: "easeInOut",
                      }}
                      style={{
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 2px 8px rgba(251, 146, 60, 0.4))",
                      }}
                    >
                      {currentStreak}
                    </motion.span>
                    <motion.span
                      className="text-5xl sm:text-6xl relative"
                      animate={{
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.3, 1],
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        ease: "easeInOut",
                      }}
                      style={{
                        filter: "drop-shadow(0 0 15px rgba(251, 146, 60, 0.6))",
                      }}
                    >
                      🔥
                    </motion.span>
                  </div>
                  <motion.p 
                    className="text-sm text-gray-700 mt-3 font-bold tracking-wide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {currentStreak === 1 ? "day" : "days"} in a row!
                  </motion.p>
                  {completionDate && (
                    <motion.p 
                      className="text-xs text-gray-500 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      Marked on {new Date(completionDate).toLocaleDateString()}
                    </motion.p>
                  )}
                </motion.div>

                {/* Motivational message */}
                <motion.p
                  className="text-gray-700 font-semibold text-base sm:text-lg leading-relaxed mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  You're building an amazing habit—keep pushing and come back
                  tomorrow to go even further! 💪
                </motion.p>

                {/* Enhanced button */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.button
                    onClick={onContinue ?? onClose}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span className="relative z-10">Continue learning</span>
                  </motion.button>
                  
                  <motion.div 
                    className="px-6 py-3.5 rounded-full bg-white/90 backdrop-blur-sm border-2 border-orange-200/60 text-sm text-orange-700 font-bold shadow-md"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.75 }}
                    style={{
                      boxShadow: "0 4px 15px rgba(251, 146, 60, 0.15)",
                    }}
                  >
                    Next milestone: {Math.max(1, currentStreak + 1)}-day streak
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StreakCongratulationsModal;
