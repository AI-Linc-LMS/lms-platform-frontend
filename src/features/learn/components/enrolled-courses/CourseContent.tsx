import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Course,
  Instructor,
  Module,
  Submodule,
} from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";
import CollapsibleCourseModule from "./CollapsibleCourseModule";
import {
  FaLinkedin,
  FaChevronDown,
  FaPlay,
  FaBookOpen,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

interface CourseContentProps {
  course: Course;
  isLoading: boolean;
  error: Error | null;
}

// Custom 3D SVG Icons (keeping same icons as before)
const StudentsIcon3D: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="studentsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <filter id="shadow3d" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="3"
          floodColor="rgba(0,0,0,0.3)"
        />
      </filter>
    </defs>
    {/* Main figure */}
    <circle
      cx="35"
      cy="25"
      r="8"
      fill="url(#studentsGrad)"
      filter="url(#shadow3d)"
    />
    <path
      d="M20 45 C20 35, 50 35, 50 45 L50 55 C50 60, 20 60, 20 55 Z"
      fill="url(#studentsGrad)"
      filter="url(#shadow3d)"
    />
    {/* Second figure */}
    <circle
      cx="65"
      cy="35"
      r="9"
      fill="url(#studentsGrad)"
      filter="url(#shadow3d)"
      opacity="0.9"
    />
    <path
      d="M48 55 C48 45, 82 45, 82 55 L82 68 C82 73, 48 73, 48 68 Z"
      fill="url(#studentsGrad)"
      filter="url(#shadow3d)"
      opacity="0.9"
    />
    {/* Highlight */}
    <ellipse cx="35" cy="20" rx="3" ry="2" fill="rgba(255,255,255,0.4)" />
    <ellipse cx="65" cy="30" rx="3" ry="2" fill="rgba(255,255,255,0.4)" />
  </svg>
);

const TrophyIcon3D: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <filter id="shadowTrophy" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="3"
          floodColor="rgba(0,0,0,0.3)"
        />
      </filter>
    </defs>
    {/* Trophy cup */}
    <path
      d="M25 25 C25 20, 75 20, 75 25 L75 45 C75 55, 25 55, 25 45 Z"
      fill="url(#trophyGrad)"
      filter="url(#shadowTrophy)"
    />
    {/* Trophy handles */}
    <path
      d="M20 30 C15 30, 15 40, 20 40"
      stroke="url(#trophyGrad)"
      strokeWidth="4"
      fill="none"
      filter="url(#shadowTrophy)"
    />
    <path
      d="M80 30 C85 30, 85 40, 80 40"
      stroke="url(#trophyGrad)"
      strokeWidth="4"
      fill="none"
      filter="url(#shadowTrophy)"
    />
    {/* Base */}
    <rect
      x="35"
      y="55"
      width="30"
      height="8"
      rx="4"
      fill="url(#trophyGrad)"
      filter="url(#shadowTrophy)"
    />
    <rect
      x="30"
      y="63"
      width="40"
      height="12"
      rx="6"
      fill="url(#trophyGrad)"
      filter="url(#shadowTrophy)"
    />
    {/* Highlight */}
    <ellipse cx="50" cy="25" rx="15" ry="8" fill="rgba(255,255,255,0.3)" />
    {/* Star */}
    <path
      d="M50 35 L52 40 L57 40 L53 44 L55 49 L50 46 L45 49 L47 44 L43 40 L48 40 Z"
      fill="rgba(255,255,255,0.6)"
    />
  </svg>
);

const VideoIcon3D: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
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

const BookIcon3D: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <filter id="shadowBook" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="3"
          floodColor="rgba(0,0,0,0.3)"
        />
      </filter>
    </defs>
    <path
      d="M20 20 C20 15, 25 15, 25 15 L75 15 C80 15, 80 20, 80 20 L80 80 C80 85, 75 85, 75 85 L25 85 C20 85, 20 80, 20 80 Z"
      fill="url(#bookGrad)"
      filter="url(#shadowBook)"
    />
    <path d="M25 20 L25 80" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
    <line
      x1="35"
      y1="30"
      x2="65"
      y2="30"
      stroke="white"
      strokeWidth="2"
      opacity="0.7"
    />
    <line
      x1="35"
      y1="40"
      x2="70"
      y2="40"
      stroke="white"
      strokeWidth="1.5"
      opacity="0.5"
    />
    <line
      x1="35"
      y1="50"
      x2="60"
      y2="50"
      stroke="white"
      strokeWidth="1.5"
      opacity="0.5"
    />
  </svg>
);

const ClockIcon3D: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="clockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <filter id="shadowClock" x="-50%" y="-50%" width="200%" height="200%">
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
      fill="url(#clockGrad)"
      filter="url(#shadowClock)"
    />
    <circle cx="50" cy="50" r="30" fill="white" />
    <circle cx="50" cy="50" r="3" fill="url(#clockGrad)" />
    <line
      x1="50"
      y1="50"
      x2="50"
      y2="30"
      stroke="url(#clockGrad)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line
      x1="50"
      y1="50"
      x2="65"
      y2="50"
      stroke="url(#clockGrad)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {[...Array(12)].map((_, i) => {
      const angle = ((i * 30 - 90) * Math.PI) / 180;
      const x1 = 50 + 25 * Math.cos(angle);
      const y1 = 50 + 25 * Math.sin(angle);
      const x2 = 50 + 22 * Math.cos(angle);
      const y2 = 50 + 22 * Math.sin(angle);
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="url(#clockGrad)"
          strokeWidth="2"
        />
      );
    })}
  </svg>
);

const CheckIcon3D: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <defs>
      <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="shadowCheck" x="-50%" y="-50%" width="200%" height="200%">
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
      fill="url(#checkGrad)"
      filter="url(#shadowCheck)"
    />
    <path
      d="M30 50 L45 65 L70 35"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <ellipse cx="50" cy="35" rx="20" ry="8" fill="rgba(255,255,255,0.2)" />
  </svg>
);

// Mobile-first course status with 3D icons
const CourseStatus: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-4 sm:p-6 border border-blue-100 mb-4 sm:mb-6"
    >
      {/* Mobile: Stacked layout, Desktop: Side by side */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Students enrolled */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden">
            <StudentsIcon3D className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-2xl" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              108 students
            </div>
            <div className="text-sm text-blue-600 font-medium flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Currently enrolled
            </div>
          </div>
        </div>

        {/* Certification */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden">
            <TrophyIcon3D className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-2xl" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              Certification
            </div>
            <div className="text-sm text-purple-600 font-medium">
              Available upon completion
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Mobile-optimized course stats with 3D icons
const CourseInsights: React.FC<{ course: Course }> = ({ course }) => {
  const stats = [
    {
      label: "Videos",
      value:
        course?.modules?.reduce(
          (acc, module) =>
            acc +
            (module.submodules?.reduce(
              (subAcc, sub) => subAcc + (sub.video_count || 0),
              0
            ) || 0),
          0
        ) || 0,
      icon: VideoIcon3D,
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
    },
    {
      label: "Articles",
      value:
        course?.modules?.reduce(
          (acc, module) =>
            acc +
            (module.submodules?.reduce(
              (subAcc, sub) => subAcc + (sub.article_count || 0),
              0
            ) || 0),
          0
        ) || 0,
      icon: BookIcon3D,
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    },
    {
      label: "Modules",
      value: course?.modules?.length || 0,
      icon: CheckIcon3D,
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
    },
    {
      label: "Est. Time",
      value: `${Math.ceil((course?.modules?.length || 0) * 2.5)}h`,
      icon: ClockIcon3D,
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-4 sm:mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.95 }}
            className={`${stat.bgColor} rounded-2xl p-3 sm:p-4 shadow-sm border border-white/50 text-center touch-manipulation relative overflow-hidden`}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 relative">
              <IconComponent className="w-full h-full" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 rounded-2xl pointer-events-none" />
          </motion.div>
        );
      })}
    </div>
  );
};

// Mobile-first instructor avatars
const InstructorAvatars: React.FC<{ instructors?: Instructor[] }> = ({
  instructors,
}) => {
  const [hoveredInstructor, setHoveredInstructor] = useState<number | null>(
    null
  );

  if (!instructors || instructors.length === 0) return null;

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center space-x-3 mb-3 sm:mb-4">
        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Your Instructors
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
      </div>

      {/* Mobile: Horizontal scroll, Desktop: Flexbox */}
      <div className="flex -space-x-2 sm:-space-x-3 overflow-x-auto pb-2 relative">
        {instructors.slice(0, 4).map((instructor, index) => (
          <motion.div
            key={instructor.id}
            whileTap={{ scale: 0.95 }}
            onTouchStart={() => setHoveredInstructor(index)}
            onTouchEnd={() => setHoveredInstructor(null)}
            className="relative cursor-pointer flex-shrink-0 touch-manipulation"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-1 shadow-lg relative overflow-hidden">
              <img
                src={instructor.profile_pic_url}
                alt={instructor.name}
                className="w-full h-full object-cover rounded-full border-2 border-white"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-full pointer-events-none" />
            </div>

            {/* Mobile-friendly tooltip */}
            <AnimatePresence>
              {hoveredInstructor === index && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
                >
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap max-w-32 text-center shadow-xl">
                    {instructor.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {instructors.length > 4 && (
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-gray-600 shadow-lg flex-shrink-0 relative overflow-hidden">
            +{instructors.length - 4}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-full pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
};

// Mobile-optimized instructor section
const InstructorsSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mockInstructors: Instructor[] = [
    {
      id: "1",
      name: "Yamini Bandi",
      bio: "AI Product Development Specialist with expertise in Agentic AI systems and innovative digital product design.",
      linkedin_profile: "https://www.linkedin.com/in/yaminibandi",
      profile_pic_url:
        "https://media.licdn.com/dms/image/v2/D5603AQGnJXGVLD3l6A/profile-displayphoto-shrink_800_800/B56ZUU9NlaGsBs-/0/1739813346507?e=1758153600&v=beta&t=CZixxbB8N4P00hjhzaC0EZqF1MZp7KJqSYNK76lkXQs",
    },
    {
      id: "2",
      name: "Shubham Lal",
      bio: "Senior AI Engineer with extensive experience in building autonomous agents and intelligent product ecosystems.",
      linkedin_profile: "https://www.linkedin.com/in/shubhamlal/",
      profile_pic_url:
        "https://media.licdn.com/dms/image/v2/D5603AQFkca3e8sWiJg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1704275354618?e=1758153600&v=beta&t=KMRMCixWPfNmy9TXMKV81hAS6DBTGo120y38mU1FDjM",
    },
    {
      id: "3",
      name: "Divyansh Dubey",
      bio: "Machine Learning Research Lead specializing in advanced AI algorithms and autonomous system design.",
      linkedin_profile: "https://www.linkedin.com/in/divyansh-dubey/",
      profile_pic_url:
        "https://media.licdn.com/dms/image/v2/C4D03AQFTKsUzbzTaow/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1661867320805?e=1758153600&v=beta&t=WYy1yfOd1S6UjcyKj2Vnl2U9Zsipw7QjmsfwdhipcrY",
    },
    {
      id: "4",
      name: "Abirami Sukumaran",
      bio: "AI Product Manager with expertise in developing intelligent software solutions and AI strategy.",
      linkedin_profile: "https://www.linkedin.com/in/abiramisukumaran/",
      profile_pic_url:
        "https://media.licdn.com/dms/image/v2/C5603AQFGooYQlpfsiA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1600277251078?e=1758153600&v=beta&t=TateWcCJTZWeS3FHwfTJ209ajFfUFEKofgNqFM3c5DQ",
    },
  ];

  if (!isExpanded) {
    return (
      <motion.button
        onClick={() => setIsExpanded(true)}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200 transition-all duration-200 mt-6 sm:mt-8 group touch-manipulation shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex -space-x-1 sm:-space-x-2">
              {mockInstructors.slice(0, 3).map((instructor) => (
                <div
                  key={instructor.id}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-0.5 relative overflow-hidden"
                >
                  <img
                    src={instructor.profile_pic_url}
                    alt={instructor.name}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-full pointer-events-none" />
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800 text-sm sm:text-base">
                Meet Your Instructors
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                Industry experts with 15+ years experience
              </div>
            </div>
          </div>
          <FaChevronDown className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-6 sm:mt-8 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-sm"
    >
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
          Course Instructors
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-800 transition-colors p-2 -m-2 touch-manipulation"
        >
          Hide Details
        </button>
      </div>

      {/* Mobile: Single column, Desktop: Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {mockInstructors.map((instructor, index) => (
          <motion.div
            key={instructor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 active:from-gray-200 active:to-gray-300 transition-all duration-200 relative overflow-hidden"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-1 flex-shrink-0 relative overflow-hidden">
              <img
                src={instructor.profile_pic_url}
                alt={instructor.name}
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-full pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                {instructor.name}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                {instructor.bio}
              </p>
              <a
                href={instructor.linkedin_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-800 active:text-blue-900 transition-colors p-1 -m-1 touch-manipulation font-medium"
              >
                <FaLinkedin className="mr-1 sm:mr-2" />
                LinkedIn Profile
              </a>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 rounded-xl pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const CourseContent: React.FC<CourseContentProps> = ({
  course,
  isLoading,
  error,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  if (isLoading) {
    return (
      <div className="w-full min-w-0">
        {" "}
        {/* FIX 1: Full width container */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm animate-pulse">
          <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl w-3/4 mb-3 sm:mb-4" />
          <div className="h-3 sm:h-4 bg-gray-200 rounded-lg w-1/2 mb-6 sm:mb-8" />

          <div className="h-16 sm:h-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-2xl mb-4 sm:mb-6" />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-4 sm:mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm"
              >
                <div className="h-10 sm:h-12 bg-gray-200 rounded-xl w-10 sm:w-12 mx-auto mb-2 sm:mb-3" />
                <div className="h-4 sm:h-6 bg-gray-200 rounded w-12 sm:w-16 mx-auto mb-1 sm:mb-2" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-8 sm:w-12 mx-auto" />
              </div>
            ))}
          </div>

          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="w-full min-w-0">
        {" "}
        {/* FIX 1: Full width container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
            >
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-full pointer-events-none" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Error loading course
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            We couldn't load the course content. Please try again.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 shadow-lg touch-manipulation">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-w-0" // FIX 1: Full width container
    >
      {/* Main Course Information Box */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-white/50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Course Header - Mobile optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 relative z-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight mb-3 sm:mb-4">
            {course.course_title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            {course.course_description}
          </p>
        </motion.div>

        {/* Instructor Avatars */}
        <InstructorAvatars instructors={course?.instructors} />

        {/* Course Status */}
        <CourseStatus />

        {/* Course Insights */}
        <CourseInsights course={course} />

        {/* Course Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CourseStatistics course={course} />
        </motion.div>

        {/* Course Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CourseActions
            courseId={course.course_id ?? 3}
            clientId={clientId}
            likeCount={course.liked_count ?? 100}
            isLiked={course.is_liked_by_current_user ?? false}
          />
        </motion.div>

        {/* Instructors Section */}
        <InstructorsSection />
      </div>

      {/* FIX 2: Report an Issue button outside the main box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="py-4 px-2 sm:px-6 text-right"
      >
        <button className="inline-flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg">
          <FaExclamationTriangle className="w-4 h-4" />
          <span>Report an Issue</span>
        </button>
      </motion.div>

      {/* FIX 3: Separate Course Content section with border and margin */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 pt-8 border-t-2 border-gray-100" // Separated with border and margin
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaBookOpen className="text-white text-lg" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Course Content
              </h2>
            </div>
            <p className="text-sm text-gray-600 ml-13">
              {course?.modules?.length || 0} modules • Self-paced learning
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm font-semibold text-green-600 flex items-center sm:justify-end">
              <FaCheckCircle className="mr-1" />
              Enrolled
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {course?.modules?.map((module: Module, index: number) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <CollapsibleCourseModule
                week={{
                  id: `${course.course_id}`,
                  weekNo: module.weekno,
                  title: module.title,
                  completed: module.completion_percentage,
                  modules: module.submodules.map((submodule: Submodule) => ({
                    id: `${submodule.id}`,
                    title: submodule.title,
                    content: [
                      {
                        type: "video",
                        title: "Videos",
                        count: submodule.video_count,
                      },
                      {
                        type: "article",
                        title: "Articles",
                        count: submodule.article_count,
                      },
                      {
                        type: "problem",
                        title: "Problems",
                        count: submodule.coding_problem_count,
                      },
                      {
                        type: "quiz",
                        title: "Quizzes",
                        count: submodule.quiz_count,
                      },
                    ],
                  })),
                }}
                defaultOpen={module.weekno === 1}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CourseContent;
