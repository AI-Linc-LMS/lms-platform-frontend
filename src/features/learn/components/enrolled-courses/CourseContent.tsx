import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likeOrUnlikeCourse } from "../../../../services/enrolled-courses-content/coursesApis";
import {
  Course,
  Instructor,
  Module,
  Submodule,
} from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CollapsibleCourseModule from "./CollapsibleCourseModule";
import ReportIssueModal from "./ReportIssueModal";
import {
  FaLinkedin,
  FaPlay,
  FaBookOpen,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaUsers,
  FaAward,
  FaGraduationCap,
  FaVideo,
  FaFileAlt,
  FaShare,
  FaFlag,
  FaPlayCircle,
  FaBookmark,
  FaTrophy,
  FaLightbulb,
  FaHeart,
  FaRegHeart,
  FaRegBookmark,
  FaThumbsUp,
  FaRegThumbsUp,
} from "react-icons/fa";

interface CourseContentProps {
  course: Course;
  isLoading: boolean;
  error: Error | null;
}

// Enhanced Loading Component - All Screens
const StudentFriendlyLoading: React.FC = () => (
  <div className="w-full min-w-0">
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-blue-100">
      {/* Header Loading */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-xl lg:rounded-2xl animate-pulse flex items-center justify-center">
          <FaGraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-6 sm:h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse" />
          <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Loading */}
      <div className="space-y-3 sm:space-y-4 mb-6">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      </div>

      {/* Stats Grid Loading */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 animate-pulse"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg mb-2 sm:mb-3" />
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-12 mb-1 sm:mb-2" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      <div className="text-center text-blue-600 font-medium text-sm sm:text-base">
        Loading your learning journey...
      </div>
    </div>
  </div>
);

// Enhanced Error Component - All Screens
const StudentFriendlyError: React.FC<{ onRetry?: () => void }> = ({
  onRetry,
}) => (
  <div className="w-full min-w-0">
    <div className="bg-white rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-sm border border-red-100 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <FaExclamationTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
        Oops! Something went wrong
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
        We couldn't load your course content right now. Don't worry, your
        progress is safe!
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
        >
          <FaPlayCircle className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Enhanced Course Header with Integrated Actions
const StudentCourseHeader: React.FC<{
  course: Course;
  clientId: string;
}> = ({ course, clientId }) => {
  const queryClient = useQueryClient();
  const [currentLikeCount, setCurrentLikeCount] = useState(
    course.liked_count ?? 100
  );
  const [currentIsLiked, setCurrentIsLiked] = useState(
    course.is_liked_by_current_user ?? false
  );
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => likeOrUnlikeCourse(clientId, course.course_id ?? 3),
    onMutate: async () => {
      const newIsLiked = !currentIsLiked;
      const newLikeCount = newIsLiked
        ? currentLikeCount + 1
        : Math.max(0, currentLikeCount - 1);

      setCurrentIsLiked(newIsLiked);
      setCurrentLikeCount(newLikeCount);

      return {
        previousIsLiked: currentIsLiked,
        previousLikeCount: currentLikeCount,
      };
    },
    onError: (error, variables, context) => {
      if (context) {
        setCurrentIsLiked(context.previousIsLiked);
        setCurrentLikeCount(context.previousLikeCount);
      }
      console.error("Error liking/unliking course:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", course.course_id?.toString()],
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this course!",
          text: "I found this amazing course that you might be interested in.",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-blue-100 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
          {/* Course Icon & Status */}
          <div className="flex items-start sm:items-center gap-4 lg:flex-col lg:items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <FaGraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium text-xs sm:text-sm">
                <FaCheckCircle className="w-3 h-3" />
                <span>Enrolled</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium text-xs sm:text-sm">
                <FaTrophy className="w-3 h-3" />
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
              {course.course_title}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
              {course.course_description}
            </p>

            {/* Course Meta - Responsive Grid */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm mb-6">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                <span className="font-medium">108 students</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <FaAward className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="font-medium">Certificate</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                <span className="font-medium">Self-paced</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <FaStar className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="font-medium">4.8 (234)</span>
              </div>
            </div>

            {/* Integrated Course Actions */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Course Actions
              </h3>

              {/* Quick Action Buttons - Mobile First */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {/* Like Button */}
                <motion.button
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    currentIsLiked
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
                  } ${
                    likeMutation.isPending
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {currentIsLiked ? (
                    <FaHeart className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FaRegHeart className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold">
                      {currentLikeCount}
                    </div>
                    <div className="text-xs font-medium">
                      {currentIsLiked ? "Liked" : "Like"}
                    </div>
                  </div>
                </motion.button>

                {/* Bookmark Button */}
                <motion.button
                  onClick={handleBookmark}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    isBookmarked
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
                  }`}
                >
                  {isBookmarked ? (
                    <FaBookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FaRegBookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <div className="text-xs font-medium">
                    {isBookmarked ? "Saved" : "Save"}
                  </div>
                </motion.button>

                {/* Share Button */}
                <motion.button
                  onClick={handleShare}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 bg-white border-gray-200 text-gray-600 hover:border-green-200 hover:text-green-600 transition-all"
                >
                  <FaShare className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-xs font-medium">Share</div>
                </motion.button>

                {/* Report Button */}
                <motion.button
                  onClick={() => setIsReportModalOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 transition-all"
                >
                  <FaFlag className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-xs font-medium">Report</div>
                </motion.button>
              </div>

              {/* Course Feedback Section */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  How are you finding this course?
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm">
                    <FaThumbsUp className="w-4 h-4" />
                    Great Course!
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-200 text-sm">
                    <FaRegThumbsUp className="w-4 h-4" />
                    Could be better
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        courseId={course.course_id ?? 3}
        clientId={parseInt(clientId)}
      />
    </>
  );
};

// Enhanced Stats Grid - All Screens (unchanged)
const LearningStatsGrid: React.FC<{ course: Course }> = ({ course }) => {
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
      icon: FaVideo,
      color: "bg-red-50 text-red-600 border-red-100",
      description: "Watch & Learn",
      gradient: "from-red-400 to-red-500",
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
      icon: FaFileAlt,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      description: "Read & Understand",
      gradient: "from-blue-400 to-blue-500",
    },
    {
      label: "Modules",
      value: course?.modules?.length || 0,
      icon: FaBookOpen,
      color: "bg-green-50 text-green-600 border-green-100",
      description: "Complete Learning",
      gradient: "from-green-400 to-green-500",
    },
    {
      label: "Duration",
      value: `${Math.ceil((course?.modules?.length || 0) * 2.5)}h`,
      icon: FaClock,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      description: "At Your Pace",
      gradient: "from-purple-400 to-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`${stat.color} rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border hover:shadow-md transition-all duration-200 group cursor-pointer relative overflow-hidden`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              <div className="w-2 h-2 bg-current opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm font-medium opacity-80 mb-1">
              {stat.label}
            </div>
            <div className="text-xs opacity-60">{stat.description}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Enhanced Instructor Section - All Screens (unchanged)
const StudentInstructorSection: React.FC<{ instructors?: Instructor[] }> = ({
  instructors,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!instructors || instructors.length === 0) return null;

  const displayedInstructors = showAll ? instructors : instructors.slice(0, 2);

  return (
    <div className="bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-sm border border-gray-100 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
            <FaLightbulb className="w-5 h-5 text-yellow-500" />
            Meet Your Instructors
          </h2>
          <p className="text-sm text-gray-500">
            Learn from industry experts who care about your success
          </p>
        </div>
        {instructors.length > 2 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
          >
            {showAll ? "Show Less" : `View All ${instructors.length}`}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:gap-5">
        {displayedInstructors.map((instructor, index) => (
          <motion.div
            key={instructor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl lg:rounded-2xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group"
          >
            <img
              src={instructor.profile_pic_url}
              alt={instructor.name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl lg:rounded-2xl object-cover flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                {instructor.name}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                {instructor.bio}
              </p>
              <a
                href={instructor.linkedin_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium hover:underline"
              >
                <FaLinkedin className="w-3 h-3 sm:w-4 sm:h-4" />
                Connect on LinkedIn
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main Component
const CourseContent: React.FC<CourseContentProps> = ({
  course,
  isLoading,
  error,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  if (isLoading) {
    return <StudentFriendlyLoading />;
  }

  if (error || !course) {
    return <StudentFriendlyError />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-w-0 space-y-4 sm:space-y-6 max-w-6xl mx-auto px-2 sm:px-0"
    >
      {/* Course Header with Integrated Actions */}
      <StudentCourseHeader course={course} clientId={clientId} />

      {/* Stats Grid */}
      <LearningStatsGrid course={course} />

      {/* Instructor Section */}
      <StudentInstructorSection instructors={course?.instructors} />

      {/* Course Statistics */}
      <div className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <CourseStatistics course={course} />
      </div>

      {/* Course Content */}
      <div className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 sm:p-6 lg:p-7 border-b border-gray-100">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
              <FaBookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
              Course Content
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {course?.modules?.length || 0} modules •{" "}
              {course?.modules?.reduce(
                (acc, module) => acc + (module.submodules?.length || 0),
                0
              ) || 0}{" "}
              lessons • Start your learning journey
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm sm:text-base font-medium text-gray-900">
                Ready to Start
              </div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
              <FaPlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-7 space-y-3 sm:space-y-4">
          {course?.modules?.map((module: Module, index: number) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
      </div>
    </motion.div>
  );
};

export default CourseContent;
