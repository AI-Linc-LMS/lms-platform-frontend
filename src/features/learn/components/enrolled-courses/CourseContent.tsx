import React, { useState } from "react";
import {
  Course,
  Instructor,
  Module,
  Submodule,
} from "../../types/course.types";
import CourseStatistics from "./CourseStatisticsRedesigned";
import CourseActions from "./CourseActionsRedesigned";
import CollapsibleCourseModule from "./CollapsibleCourseModuleRedesigned";
import {
  FaLinkedin,
  FaGlobe,
  FaGraduationCap,
  FaClock,
  FaUsers,
  FaCertificate,
  FaStar,
  FaBookOpen,
} from "react-icons/fa";

interface CourseContentProps {
  course: Course;
  isLoading: boolean;
  error: Error | null;
}

// Modern Course Hero Section Component
const CourseHeroSection: React.FC<{ course: Course }> = ({ course }) => {
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 ">
        <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4 ">
          <FaGraduationCap className="text-2xl sm:text-3xl text-blue-200" />
          <span className="bg-blue-500/30 px-3 py-1.5 rounded-full text-sm font-medium">
            Premium Course
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
          {course.course_title}
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed max-w-4xl">
          {course.course_description}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
            <FaUsers className="text-xl md:text-2xl mb-2 mx-auto text-blue-200" />
            <div className="text-xl md:text-2xl font-bold">
              {course.enrolled_students || 0}
            </div>
            <div className="text-xs sm:text-sm text-blue-200">Students</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
            <FaStar className="text-xl md:text-2xl mb-2 mx-auto text-yellow-300" />
            <div className="text-xl md:text-2xl font-bold">4.9</div>
            <div className="text-xs sm:text-sm text-blue-200">Rating</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
            <FaClock className="text-xl md:text-2xl mb-2 mx-auto text-green-300" />
            <div className="text-xl md:text-2xl font-bold">
              {course.modules?.length || 0}
            </div>
            <div className="text-xs sm:text-sm text-blue-200">Modules</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
            <FaCertificate className="text-xl md:text-2xl mb-2 mx-auto text-purple-300" />
            <div className="text-xl md:text-2xl font-bold">
              {course.is_certified ? "✓" : "✕"}
            </div>
            <div className="text-xs sm:text-sm text-blue-200">Certificate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Sticky Sidebar Component
const CourseSidebar: React.FC<{ course: Course }> = ({ course }) => {
  return (
    <div className="space-y-6">
      {/* Course Progress Card */}
      {/* <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaCertificate className="text-blue-600" />
          Your Progress
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">
                Overall Completion
              </span>
              <span className="font-bold text-blue-600">
                {course.completion_percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-inner"
                style={{ width: `${course.completion_percentage || 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blue-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {course.modules?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Total Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(
                  ((course.completion_percentage || 0) / 100) *
                    (course.modules?.length || 0)
                )}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Quick Stats Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Students
              </span>
            </div>
            <span className="font-bold text-gray-900">
              {course.enrolled_students || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaStar className="text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Rating</span>
            </div>
            <span className="font-bold text-gray-900">4.9/5.0</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaClock className="text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Duration
              </span>
            </div>
            <span className="font-bold text-gray-900">
              {course.modules?.length || 0} weeks
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaCertificate className="text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Certificate
              </span>
            </div>
            <span
              className={`font-bold ${
                course.is_certified ? "text-green-600" : "text-gray-400"
              }`}
            >
              {course.is_certified ? "Available" : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Featured Instructors Mini Card */}
      {course?.instructors && course?.instructors.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaUsers className="text-purple-600" />
            Instructors
          </h3>
          <div className="space-y-3">
            {course?.instructors?.slice(0, 3).map((instructor) => (
              <div
                key={instructor.id}
                className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3 hover:bg-white/70 transition-colors duration-200"
              >
                <img
                  src={instructor.profile_pic_url}
                  alt={instructor.name}
                  className="w-12 h-12 rounded-lg object-cover ring-2 ring-purple-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {instructor.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {instructor.bio?.split(".")[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Resources Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Study Resources
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 flex items-center justify-between group">
            <span className="text-sm font-medium text-gray-700">
              Course Materials
            </span>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 flex items-center justify-between group">
            <span className="text-sm font-medium text-gray-700">
              Discussion Forum
            </span>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 flex items-center justify-between group">
            <span className="text-sm font-medium text-gray-700">
              Assignments
            </span>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 flex items-center justify-between group">
            <span className="text-sm font-medium text-gray-700">
              Download Certificate
            </span>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Instructors Section
const InstructorsSection: React.FC<{ course: Course }> = ({ course }) => {
  const [isExpanded] = useState(false);
  const displayedInstructors = isExpanded
    ? course.instructors || []
    : course.instructors && course.instructors.length > 2
    ? course.instructors.slice(0, 2)
    : [];

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-none sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 border-0 sm:border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FaUsers className="text-blue-600 text-xl sm:text-2xl" />
            Meet Your Instructors
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Learn from industry experts and thought leaders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {displayedInstructors.map((instructor, index) => (
          <div
            key={instructor.id}
            className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
          >
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={instructor.profile_pic_url || "/default-avatar.png"}
                  alt={instructor.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-blue-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {instructor.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                  {instructor.bio}
                </p>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {instructor.linkedin_profile && (
                    <a
                      href={instructor.linkedin_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0A66C2] hover:bg-[#005582] text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <FaLinkedin /> LinkedIn
                    </a>
                  )}
                  {instructor.website && (
                    <a
                      href={instructor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <FaGlobe /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modern Loading Skeleton
const ModernLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-none sm:rounded-3xl h-64 sm:h-80 md:h-96 p-6 sm:p-8">
        <div className="space-y-4">
          <div className="h-6 sm:h-8 bg-gray-400 rounded-lg w-1/3"></div>
          <div className="h-10 sm:h-12 bg-gray-400 rounded-lg w-3/4"></div>
          <div className="h-5 sm:h-6 bg-gray-400 rounded-lg w-1/2"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-400 rounded-xl sm:rounded-2xl h-20 sm:h-24"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content Skeleton */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="h-10 sm:h-12 bg-gray-200 rounded-full w-28 sm:w-32"></div>
              <div className="h-10 sm:h-12 bg-gray-200 rounded-full w-20 sm:w-24"></div>
              <div className="h-10 sm:h-12 bg-gray-200 rounded-full w-24 sm:w-28"></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-none sm:rounded-3xl p-6 sm:p-8">
            <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-1/3 mb-6 sm:mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-xl sm:rounded-2xl flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-5 sm:h-6 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="hidden xl:block space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6 h-64"></div>
          <div className="bg-gray-50 rounded-2xl p-6 h-48"></div>
        </div>
      </div>
    </div>
  );
};

// Modern Error State
const ModernErrorState: React.FC<{ error: Error }> = () => {
  return (
    <div className="w-full bg-white rounded-none sm:rounded-3xl p-8 sm:p-12 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
          We encountered an error while loading the course content. Don&apos;t
          worry, this is temporary.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

// Modern Empty State
const ModernEmptyState: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-none sm:rounded-3xl p-8 sm:p-12 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <FaBookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Course Not Found
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
          The course you&apos;re looking for doesn&apos;t exist or has been
          moved. Please check the URL or browse our course catalog.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

// Main Course Content Layout Component
const CourseContent: React.FC<CourseContentProps> = ({
  course,
  isLoading,
  error,
}) => {
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    index: number;
    x: number;
    y: number;
  }>({
    visible: false,
    index: 0,
    x: 0,
    y: 0,
  });

  const clientId = import.meta.env.VITE_CLIENT_ID;

  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({
      visible: true,
      index,
      x: rect.left,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltipInfo((prev) => ({ ...prev, visible: false }));
  };

  if (isLoading) {
    return <ModernLoadingSkeleton />;
  }

  if (error) {
    return <ModernErrorState error={error} />;
  }

  if (!course) {
    return <ModernEmptyState />;
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Hero Section - Full Width */}
      <CourseHeroSection course={course} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content - Left Column (2/3 width) */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          {/* Course Actions Section */}
          <div className="bg-white rounded-none sm:rounded-2xl p-5 sm:p-6 shadow-sm border-0 sm:border border-gray-100">
            <CourseActions
              courseId={course.course_id ?? 3}
              clientId={clientId}
              likeCount={course.liked_count ?? 100}
              isLiked={course.is_liked_by_current_user ?? false}
            />
          </div>

          {/* Interactive Instructor Avatars with Tooltip */}
          {course?.instructors && course.instructors.length > 0 && (
            <div className="bg-white rounded-none sm:rounded-2xl p-5 sm:p-6 shadow-sm border-0 sm:border border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaUsers className="text-blue-600" />
                Course Instructors
              </h3>
              <div className="flex -space-x-2 sm:-space-x-3 overflow-x-auto pb-2">
                {course.instructors.map(
                  (instructor: Instructor, index: number) => (
                    <div
                      key={instructor.id}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-300 border-2 sm:border-4 border-white overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10 flex-shrink-0 shadow-lg"
                      onMouseEnter={(e) => handleMouseEnter(index, e)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <img
                        src={instructor.profile_pic_url}
                        alt={instructor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                )}
              </div>

              {/* Enhanced Tooltip - Hidden on mobile */}
              {tooltipInfo.visible &&
                course?.instructors?.[tooltipInfo.index] && (
                  <div
                    className="fixed z-50 pointer-events-none transform -translate-x-1/2 hidden sm:block"
                    style={{
                      left: `${tooltipInfo.x}px`,
                      top: `${tooltipInfo.y - 140}px`,
                    }}
                  >
                    <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl min-w-[280px] border border-gray-700">
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            course.instructors[tooltipInfo.index]
                              .profile_pic_url
                          }
                          alt={course.instructors[tooltipInfo.index].name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-semibold text-lg leading-tight">
                            {course.instructors[tooltipInfo.index].name}
                          </p>
                          <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                            {course.instructors[tooltipInfo.index].bio}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Enhanced Course Statistics */}
          <div className="bg-white rounded-none sm:rounded-2xl p-5 sm:p-6 shadow-sm border-0 sm:border border-gray-100">
            <CourseStatistics course={course} />
          </div>

          {/* Enhanced Instructors Section */}
          {course.instructors && course.instructors.length > 0 && (
            <InstructorsSection course={course} />
          )}

          {/* Course Modules Section */}
          <div className="bg-white rounded-none sm:rounded-2xl p-5 sm:p-6 shadow-sm border-0 sm:border border-gray-100">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                <FaBookOpen className="text-blue-600 text-xl sm:text-2xl" />
                Course Curriculum
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Complete these modules to master the course content and earn
                your certificate
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {course?.modules?.map((module: Module) => (
                <CollapsibleCourseModule
                  key={module.id}
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
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Sidebar - Right Column (1/3 width, Hidden on mobile/tablet) */}
        <div className="hidden xl:block">
          <div className="sticky top-6 space-y-6">
            <CourseSidebar course={course} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
