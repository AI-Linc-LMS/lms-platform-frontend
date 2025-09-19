import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// 3D SVG Icons (same as before)
const VideoIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="videoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <filter id="shadowVideo" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="3"
          floodColor="rgba(0,0,0,0.3)"
        />
      </filter>
    </defs>
    <rect
      x="15"
      y="25"
      width="70"
      height="50"
      rx="8"
      fill="url(#videoGrad)"
      filter="url(#shadowVideo)"
    />
    <polygon points="40,40 40,60 65,50" fill="white" />
    <ellipse cx="50" cy="30" rx="20" ry="5" fill="rgba(255,255,255,0.2)" />
  </svg>
);

const DocumentIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <filter id="shadowDoc" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="3"
          floodColor="rgba(0,0,0,0.3)"
        />
      </filter>
    </defs>
    <path
      d="M20 15 C20 10, 25 10, 25 10 L65 10 L80 25 L80 85 C80 90, 75 90, 75 90 L25 90 C20 90, 20 85, 20 85 Z"
      fill="url(#docGrad)"
      filter="url(#shadowDoc)"
    />
    <path d="M65 10 L65 25 L80 25" fill="rgba(255,255,255,0.3)" />
    <line
      x1="30"
      y1="35"
      x2="60"
      y2="35"
      stroke="white"
      strokeWidth="2"
      opacity="0.7"
    />
    <line
      x1="30"
      y1="45"
      x2="65"
      y2="45"
      stroke="white"
      strokeWidth="1.5"
      opacity="0.5"
    />
    <line
      x1="30"
      y1="55"
      x2="55"
      y2="55"
      stroke="white"
      strokeWidth="1.5"
      opacity="0.5"
    />
  </svg>
);

const CodeIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      <filter id="shadowCode" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="3"
          floodColor="rgba(0,0,0,0.3)"
        />
      </filter>
    </defs>
    <rect
      x="15"
      y="20"
      width="70"
      height="60"
      rx="8"
      fill="url(#codeGrad)"
      filter="url(#shadowCode)"
    />
    <path
      d="M30 40 L25 50 L30 60"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M70 40 L75 50 L70 60"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M55 35 L45 65"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const QuizIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="quizGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <filter id="shadowQuiz" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="3"
          floodColor="rgba(0,0,0,0.3)"
        />
      </filter>
    </defs>
    <circle
      cx="50"
      cy="50"
      r="35"
      fill="url(#quizGrad)"
      filter="url(#shadowQuiz)"
    />
    <path
      d="M50 30 C45 30, 40 35, 40 40 C40 45, 45 50, 50 50 L50 55"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle cx="50" cy="65" r="3" fill="white" />
  </svg>
);

// Types for the component
export interface ContentItem {
  type: "video" | "article" | "problem" | "quiz";
  title: string;
  count: number;
}

export interface CourseModule {
  id: string;
  title: string;
  isLocked?: boolean;
  completed?: number;
  started?: boolean;
  content: ContentItem[];
  instructors?: Instructor[];
}

export interface Instructor {
  id: string;
  name: string;
  bio?: string;
  linkedin_profile?: string;
  profile_pic_url?: string;
}

export interface CourseWeek {
  id: string;
  weekNo: number;
  title: string;
  completed?: number;
  modules: CourseModule[];
}

interface CollapsibleCourseModuleProps {
  week: CourseWeek;
  defaultOpen?: boolean;
}

const CollapsibleCourseModule: React.FC<CollapsibleCourseModuleProps> = ({
  week,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  const navigateToTopicDetail = (courseId: string, submoduleId: string) => {
    navigate(`/learn/course/${courseId}/${submoduleId}`);
  };

  const renderContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <VideoIcon3D className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "article":
        return <DocumentIcon3D className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "problem":
        return <CodeIcon3D className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "quiz":
        return <QuizIcon3D className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <DocumentIcon3D className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "from-red-50 to-red-100 border-red-200";
      case "article":
        return "from-blue-50 to-blue-100 border-blue-200";
      case "problem":
        return "from-pink-50 to-pink-100 border-pink-200";
      case "quiz":
        return "from-purple-50 to-purple-100 border-purple-200";
      default:
        return "from-gray-50 to-gray-100 border-gray-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-6 relative"
    >
      {/* Week Badge */}
      <div className="mb-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>Week {week.weekNo}</span>
        </motion.div>
      </div>

      {/* Main Card */}
      <div className="border-2 border-gray-100 rounded-3xl shadow-lg bg-gradient-to-br from-white to-gray-50/50 overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Progress bar at top */}
        {week.completed !== undefined && (
          <div className="h-1 bg-gray-200 relative overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${week.completed}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
        )}

        {/* Header */}
        <div
          className="p-4 sm:p-6 flex justify-between items-center cursor-pointer group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
              {week.title}
            </h2>

            {week.completed !== undefined && (
              <div className="flex items-center space-x-3">
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600 font-medium">
                      Progress
                    </span>
                    <span className="text-xs text-gray-800 font-bold">
                      {week.completed}%
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${week.completed}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="ml-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-600"
              >
                <path
                  d="M15 1L8 7L1 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </motion.button>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                {week.modules.map((module, moduleIndex) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: moduleIndex * 0.1 }}
                    className={`rounded-2xl p-4 sm:p-5 border-2 relative overflow-hidden ${
                      module.isLocked
                        ? "bg-gray-50 border-gray-200"
                        : "bg-gradient-to-br from-white to-blue-50/30 border-blue-100 hover:border-blue-200"
                    } transition-all duration-300`}
                  >
                    {/* Background decoration */}
                    {!module.isLocked && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl pointer-events-none" />
                    )}

                    <div className="relative z-10">
                      {/* Module Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                            {module.title}
                            {module.isLocked && (
                              <div className="ml-2 w-5 h-5 text-gray-400">
                                <svg viewBox="0 0 18 18" fill="currentColor">
                                  <path d="M4.5 16.5C4.0875 16.5 3.73438 16.3531 3.44063 16.0594C3.14688 15.7656 3 15.4125 3 15V7.5C3 7.0875 3.14688 6.73438 3.44063 6.44063C3.73438 6.14687 4.0875 6 4.5 6H5.25V4.5C5.25 3.4625 5.61563 2.57812 6.34688 1.84687C7.07812 1.11562 7.9625 0.75 9 0.75C10.0375 0.75 10.9219 1.11562 11.6531 1.84687C12.3844 2.57812 12.75 3.4625 12.75 4.5V6H13.5C13.9125 6 14.2656 6.14687 14.5594 6.44063C14.8531 6.73438 15 7.0875 15 7.5V15C15 15.4125 14.8531 15.7656 14.5594 16.0594C14.2656 16.3531 13.9125 16.5 13.5 16.5H4.5Z" />
                                </svg>
                              </div>
                            )}
                          </h3>
                          {module.completed && (
                            <div className="mt-1">
                              <div className="text-xs text-gray-600 mb-1">
                                {module.completed}% Complete
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-blue-500 h-1 rounded-full"
                                  style={{ width: `${module.completed}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {!module.isLocked && !module.started && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
                              onClick={() =>
                                navigateToTopicDetail(week.id, module.id)
                              }
                            >
                              Start Now
                            </motion.button>
                          )}

                          {!module.isLocked && module.started && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
                              onClick={() =>
                                navigateToTopicDetail(week.id, module.id)
                              }
                            >
                              Continue Learning
                            </motion.button>
                          )}

                          {module.isLocked && (
                            <div className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 18 18"
                                fill="currentColor"
                              >
                                <path d="M4.5 16.5C4.0875 16.5 3.73438 16.3531 3.44063 16.0594C3.14688 15.7656 3 15.4125 3 15V7.5C3 7.0875 3.14688 6.73438 3.44063 6.44063C3.73438 6.14687 4.0875 6 4.5 6H5.25V4.5C5.25 3.4625 5.61563 2.57812 6.34688 1.84687C7.07812 1.11562 7.9625 0.75 9 0.75C10.0375 0.75 10.9219 1.11562 11.6531 1.84687C12.3844 2.57812 12.75 3.4625 12.75 4.5V6H13.5C13.9125 6 14.2656 6.14687 14.5594 6.44063C14.8531 6.73438 15 7.0875 15 7.5V15C15 15.4125 14.8531 15.7656 14.5594 16.0594C14.2656 16.3531 13.9125 16.5 13.5 16.5H4.5Z" />
                              </svg>
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {module.content
                          .filter((item) => item.count > 0)
                          .map((item, idx) => (
                            <motion.div
                              key={`${module.id}-${item.type}-${idx}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: moduleIndex * 0.1 + idx * 0.05,
                              }}
                              whileHover={{ scale: 1.02 }}
                              className={`flex items-center space-x-3 p-3 rounded-xl border-2 bg-gradient-to-br ${getContentTypeColor(
                                item.type
                              )} transition-all duration-200 hover:shadow-md`}
                            >
                              <div className="flex-shrink-0">
                                {renderContentTypeIcon(item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm sm:text-base font-semibold text-gray-800">
                                  {item.count}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {item.title}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CollapsibleCourseModule;
