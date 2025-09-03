import React from "react";
import { Course } from "../../../types/course.types";
import { useNavigate } from "react-router-dom";
import { DocumentIcon } from "../../../../../commonComponents/icons/learnIcons/CourseIcons";
import {
  generateTrustedByCompanies,
  generateDynamicStreak,
  generateDynamicBadges,
  generateRecentActivity,
  generateNextLesson,
  calculateProgress,
  getTimeAgo,
} from "./utils/courseDataUtils";

// Extended interface for additional backend properties
interface ExtendedCourse extends Omit<Course, "stats"> {
  difficulty_level?: string;
  duration_in_hours?: number;
  stats?: {
    video?: {
      total: number;
      completed?: number;
    };
    quiz?: {
      total: number;
      completed?: number;
    };
  };
}

// Enrolled Banner Component
const EnrolledBanner: React.FC<{ isEnrolled: boolean }> = ({ isEnrolled }) => {
  if (!isEnrolled) return null;

  return (
    <div className="absolute top-0 left-0 z-10">
      <div className="bg-green-600 text-center w-[100px] text-white text-xs font-semibold px-3 py-1 rounded-tl-2xl md:rounded-tl-3xl rounded-br-lg shadow-md">
        Enrolled
      </div>
    </div>
  );
};

interface EnrolledExpandedCardProps {
  course: Course;
  className?: string;
  onCollapse: () => void;
}

const EnrolledExpandedCard: React.FC<EnrolledExpandedCardProps> = ({
  course,
  className = "",
  onCollapse,
}) => {
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const isFree = course?.is_free === true || course?.price === 0;

  // Generate dynamic data
  const trustedCompanies = generateTrustedByCompanies(course);
  const dayStreak = generateDynamicStreak(course.id);
  const badgesEarned = generateDynamicBadges(course);
  const recentActivity = generateRecentActivity(course);
  const nextLesson = generateNextLesson(course);
  const progressPercentage = calculateProgress(course);
  const lastActivityTime = getTimeAgo(course.id);

  return (
    <div
      className={`w-full border border-[#80C9E0] p-4 pt-5 rounded-2xl md:rounded-3xl bg-white flex flex-col self-start relative overflow-visible ${className}`}
      style={{ height: "fit-content" }}
    >
      {/* Enrolled Banner - Top Left */}
      <EnrolledBanner isEnrolled={true} />

      {/* Header with title and collapse button */}
      <div className="flex justify-between items-start mb-4">
        <h1 className="font-bold font-sans text-xl text-[#343A40]">
          {course.title}
        </h1>
        <button
          onClick={onCollapse}
          className="w-8 h-8 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-full flex items-center justify-center transition-colors duration-200"
          aria-label="Collapse course card"
        >
          <svg
            className="w-4 h-4 text-[#495057]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>

      {/* Created and Certified By Section */}
      {trustedCompanies && trustedCompanies.length > 0 && (
        <div className="mb-4">
          <p className="text-[#6C757D] text-xs font-medium mb-2 uppercase tracking-wide">
            CREATED AND CERTIFIED BY
          </p>
          <div className="flex flex-wrap gap-2">
            {trustedCompanies.map((company, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg px-3 py-1"
              >
                <div
                  className={`w-4 h-4 rounded ${
                    index % 3 === 0
                      ? "bg-blue-500"
                      : index % 3 === 1
                      ? "bg-blue-700"
                      : "bg-blue-600"
                  }`}
                ></div>
                <span className="text-sm font-medium text-[#495057]">
                  {typeof company === "string" ? company : company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Info Row */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2 bg-[#F8F9FA] rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-[#FFC107]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium text-[#495057]">
            {(course as ExtendedCourse).difficulty_level || "Medium"}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#F8F9FA] rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-[#6C757D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span className="text-sm font-medium text-[#495057]">
            {(course as ExtendedCourse).duration_in_hours &&
            (course as ExtendedCourse).duration_in_hours! > 0
              ? `${(course as ExtendedCourse).duration_in_hours} hours`
              : "Self-paced"}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#FFF3CD] border border-[#FFEAA7] rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-[#856404]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <span className="text-sm font-medium text-[#856404]">
            {isFree ? "Free" : `$${course.price}`}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 text-[#FFC107]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium text-[#495057] ml-1">4.8/5</span>
        </div>
      </div>

      {/* Course Description */}
      <div className="mb-4">
        <p className="text-[#495057] text-sm leading-relaxed">
          {course.description ||
            "Learn comprehensive skills in this professionally designed course."}
        </p>
      </div>

      {/* Content Section */}
      <div className="mb-4">
        <h3 className="text-[#495057] font-semibold text-sm mb-3 uppercase tracking-wide">
          CONTENT
        </h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="flex flex-col items-center p-3 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-6 h-6 text-[#6C757D] mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg font-bold text-[#495057]">
              {course.stats?.video?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-6 h-6 text-[#6C757D] mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-lg font-bold text-[#495057]">
              {course.stats?.article?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-6 h-6 text-[#6C757D] mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-lg font-bold text-[#495057]">
              {course.stats?.quiz?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-6 h-6 text-[#6C757D] mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span className="text-lg font-bold text-[#495057]">
              {course.stats?.coding_problem?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-6 h-6 text-[#6C757D] mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-lg font-bold text-[#495057]">
              {course.stats?.assignment?.total || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Your Progress Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#495057] font-semibold text-sm">
            Your Progress
          </h3>
          <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
            {progressPercentage}%
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[#495057]">
              {Math.floor(progressPercentage / 20) || 1}/
              {course.stats?.video?.total || 0} videos watched
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[#495057]">
              {Math.floor(badgesEarned / 2) || 1}/
              {course.stats?.quiz?.total || 0} quizzes completed
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-orange-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-orange-800 font-semibold text-sm">
            Recent Activity
          </h3>
          <span className="text-orange-600 text-xs">{lastActivityTime}</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-[#495057]">{recentActivity}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-[#495057]">
              Earned: "{course.title.split(" ")[0]} Progress" badge
            </span>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#495057] font-semibold text-sm">Achievements</h3>
          <span className="text-blue-600 text-xs">{badgesEarned}/6</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600 mb-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs text-blue-600 font-medium">
              FIRST STEPS
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600 mb-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-blue-600 font-medium">
              QUIZ MASTER
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600 mb-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-xs text-blue-600 font-medium">
              5 WEEK MASTER
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-100 rounded-lg opacity-60">
            <svg
              className="w-6 h-6 text-gray-400 mb-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs text-gray-400 font-medium">EXPERT</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-100 rounded-lg opacity-60">
            <svg
              className="w-6 h-6 text-gray-400 mb-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-gray-400 font-medium">CERTIFIED</span>
          </div>
        </div>
      </div>

      {/* Next Lesson Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-green-800 font-semibold text-sm">Next Lesson</h3>
          <span className="text-green-600 text-xs">
            {nextLesson.duration} min
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <div>
            <p className="text-[#495057] font-medium text-sm">
              {nextLesson.title}
            </p>
            <p className="text-green-600 text-xs">{nextLesson.description}</p>
          </div>
        </div>
      </div>

      {/* Day Streak Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
          </svg>
          <div>
            <p className="text-yellow-800 font-bold text-lg">{dayStreak}</p>
            <p className="text-yellow-600 text-xs">DAY STREAK</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(dayStreak)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 bg-green-500 rounded flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Instructors Section */}
      {course.instructors && course.instructors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[#495057] font-semibold text-sm mb-3">
            Instructors:
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {course.instructors.slice(0, 3).map((instructor, index) => (
                <div
                  key={index}
                  className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white overflow-hidden"
                >
                  <img
                    src={instructor.profile_pic_url}
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <p className="font-medium text-[#495057]">
                {course.instructors[0]?.name || "Expert Instructor"}
              </p>
              <p className="text-[#6C757D] text-xs">Lead instructor</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Features */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-[#495057]">
              Used by 90% of Fortune 500 companies
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-[#495057]">
              Boost your analytics career with real-world skills
            </span>
          </div>
        </div>
      </div>

      {/* What's Included Section */}
      <div className="mb-6">
        <div className="bg-[#F8F9FA] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-[#FF6B35]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-[#495057]">
              What's Included:
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <DocumentIcon />
              <span className="text-[#495057]">
                Real datasets & project templates
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DocumentIcon />
              <span className="text-[#495057]">
                Free resume template for Data Analyst roles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning Button */}
      <div className="mt-auto">
        <button
          onClick={handlePrimaryClick}
          className="w-full px-8 py-3 text-lg font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
};

export default EnrolledExpandedCard;
