import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaVideo,
  FaFileAlt,
  FaCode,
  FaQuestionCircle,
  FaChevronDown,
  FaPlay,
  FaCheckCircle,
  FaClock,
  FaLock,
  FaStar,
  FaFire,
} from "react-icons/fa";

// Enhanced 3D Icons with better responsiveness
const VideoIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <div className={`${className} relative`}>
    <FaVideo className="w-full h-full text-red-500" />
  </div>
);

const DocumentIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <div className={`${className} relative`}>
    <FaFileAlt className="w-full h-full text-blue-500" />
  </div>
);

const CodeIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <div className={`${className} relative`}>
    <FaCode className="w-full h-full text-green-500" />
  </div>
);

const QuizIcon3D: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <div className={`${className} relative`}>
    <FaQuestionCircle className="w-full h-full text-purple-500" />
  </div>
);

// Enhanced Types
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

export interface Week {
  id: string;
  weekNo: number;
  title: string;
  completed: number;
  modules: CourseModule[];
}

interface CollapsibleCourseModuleProps {
  week: Week;
  defaultOpen?: boolean;
}

const CollapsibleCourseModule: React.FC<CollapsibleCourseModuleProps> = ({
  week,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return VideoIcon3D;
      case "article":
        return DocumentIcon3D;
      case "problem":
        return CodeIcon3D;
      case "quiz":
        return QuizIcon3D;
      default:
        return VideoIcon3D;
    }
  };

  const getContentColor = (type: string) => {
    switch (type) {
      case "video":
        return "text-red-600 bg-red-50";
      case "article":
        return "text-blue-600 bg-blue-50";
      case "problem":
        return "text-green-600 bg-green-50";
      case "quiz":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const totalContent = week.modules.reduce(
    (total, module) =>
      total + module.content.reduce((sum, item) => sum + item.count, 0),
    0
  );

  const isCompleted = week.completed === 100;
  const isStarted = week.completed > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Module Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 lg:p-6 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Week Number Badge */}
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isStarted
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isCompleted ? (
                <FaCheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <span className="font-bold text-sm sm:text-base">
                  {week.weekNo}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Title and Status */}
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg truncate">
                  {week.title}
                </h3>
                {isStarted && !isCompleted && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    <FaFire className="w-3 h-3" />
                    <span>In Progress</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    <FaStar className="w-3 h-3" />
                    <span>Completed</span>
                  </div>
                )}
              </div>

              {/* Progress and Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[80px] sm:min-w-[120px]">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isCompleted ? "bg-green-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${week.completed}%` }}
                    />
                  </div>
                  <span className="font-medium text-xs">{week.completed}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaClock className="w-3 h-3" />
                  <span>{totalContent} items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-2 sm:ml-4 flex-shrink-0"
          >
            <FaChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 bg-gray-50">
              <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                {week.modules.map((module, moduleIndex) => (
                  <div
                    key={module.id}
                    className="bg-white rounded-lg lg:rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-blue-200 transition-colors"
                  >
                    {/* Module Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base flex-1 min-w-0 pr-2">
                        {module.title}
                      </h4>
                      <button
                        onClick={() =>
                          navigate(`/course/${week.id}/module/${module.id}`)
                        }
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0"
                      >
                        <FaPlay className="w-3 h-3" />
                        <span className="hidden sm:inline">Start</span>
                      </button>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      {module.content.map((item, itemIndex) => {
                        const Icon = getContentIcon(item.type);
                        const colorClasses = getContentColor(item.type);

                        return (
                          <div
                            key={itemIndex}
                            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${colorClasses} transition-all hover:scale-105`}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base sm:text-lg">
                                {item.count}
                              </div>
                              <div className="text-xs font-medium truncate">
                                {item.title}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CollapsibleCourseModule;
