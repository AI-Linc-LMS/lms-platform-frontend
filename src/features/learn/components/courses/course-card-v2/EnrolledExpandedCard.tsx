import React from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import { FileText, PlayCircle, Play, Trophy } from "lucide-react";
import { calculateProgress } from "./utils/courseDataUtils";
import {
  AchievementSection,
  ContentMetricsSection,
  QuickOverviewSection,
  IconActionsSection,
  CardHeader,
  EnrolledBannerSection,
  ContinueLearningButton,
  NextUpSection,
  NextLessonSection,
} from "./components";

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

  return (
    <div
      className={`course-card w-full max-w-lg bg-white rounded-2xl border border-blue-100 shadow-xl transition-all duration-300 ease-in-out relative overflow-visible ${className}`}
    >
      {/* Enrolled Banner - Top Right */}
      <EnrolledBannerSection variant="expanded" />

      {/* Card Header */}
      <CardHeader course={course} onCollapse={onCollapse} />

      {/* MOBILE OPTIMIZED: Minified Content */}
      <div className="p-3 sm:p-4 md:p-6 pt-2 sm:pt-3 md:pt-4">
        {/* Quick Overview */}
        <QuickOverviewSection course={course} />

        {/* Next Up Section */}
        <NextUpSection nextLesson={course?.next_lesson} />

        {/* Continue Learning Button */}
        <ContinueLearningButton
          onClick={handlePrimaryClick}
          className="mb-3 sm:mb-4"
        />

        {/* MOBILE OPTIMIZED: Course Description */}
        <div className="mt-4 sm:mt-6 md:mt-10 mb-3 sm:mb-4 md:mb-6">
          <p className="text-xs sm:text-sm leading-[1.5] text-[#374151] m-0">
            {course.description ||
              "Learn how to build intelligent, goal-driven digital products using Agentic AI systems. This course covers advanced techniques for creating autonomous AI agents that can make decisions and take actions in complex environments."}
          </p>
        </div>

        {/* Content Metrics */}
        <ContentMetricsSection course={course} />

        {/* MOBILE OPTIMIZED: Learning Progress */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-[13px] font-semibold text-[#374151]">
              Your Progress
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-[#10b981]">
              {course.progress_percentage ? calculateProgress(course) : 0}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full transition-all duration-300"
              style={{
                width: `${
                  course.progress_percentage ? calculateProgress(course) : 0
                }%`,
              }}
            ></div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[var(--font-secondary)]">
              <PlayCircle className="w-2 h-2 sm:w-[10px] sm:h-[10px] text-[#10b981] flex-shrink-0" />
              <span className="truncate">
                {course.stats?.video?.completed || 0}/
                {course.stats?.video?.total || 0} videos watched
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[var(--font-secondary)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-2 h-2 sm:w-[10px] sm:h-[10px] text-[#10b981] flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="truncate">
                {course.stats?.quiz?.completed || 0}/
                {course.stats?.quiz?.total || 0} quizzes completed
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE OPTIMIZED: Recent Activity */}
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-[13px] font-semibold text-[#92400e]">
              Recent Activity
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#a16207]">
              2 hours ago
            </span>
          </div>
          <div className="space-y-1">
            {course.recent_activity && course.recent_activity.length > 0 ? (
              course.recent_activity.slice(0, 2).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#92400e]"
                >
                  {index === 0 ? (
                    <Play className="w-2 h-2 sm:w-[10px] sm:h-[10px] text-[#a16207] flex-shrink-0" />
                  ) : (
                    <Trophy className="w-2 h-2 sm:w-[10px] sm:h-[10px] text-[#a16207] flex-shrink-0" />
                  )}
                  <span className="truncate">{activity}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#92400e]">
                  <Play className="w-2 h-2 sm:w-[10px] sm:h-[10px] text-[#a16207] flex-shrink-0" />
                  <span className="truncate">
                    Completed: "Introduction to Data Visualization"
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#92400e]">
                  <Trophy className="w-2 h-2 sm:w-[10px] sm:h-[10px] text-[#a16207] flex-shrink-0" />
                  <span className="truncate">
                    Earned: "Data Analysis Basics" badge
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <AchievementSection />

        {/* Next Lesson */}
        <NextLessonSection
          nextLesson={course?.next_lesson}
          variant="detailed"
        />

        {/* MOBILE OPTIMIZED: Study Streak */}
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#f59e0b] rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 sm:w-5 sm:h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3c.132 2.5-1.5 4.5-3 6.5C7 11 6 13 6 15a6 6 0 0012 0c0-2-1-4-3-5.5C13.5 7.5 12 5.5 12 3z"
                />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-bold text-[#92400e] leading-none">
                {course.streak ?? 0}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#a16207] font-medium uppercase tracking-[0.3px]">
                Day Streak
              </span>
            </div>
          </div>
          {/* MOBILE OPTIMIZED: Week display */}
          <div className="flex gap-1 justify-center overflow-hidden">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={index}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center text-[9px] sm:text-[10px] font-semibold flex-shrink-0 ${
                  index < (course?.streak ?? 0)
                    ? "bg-[#10b981] text-white"
                    : "bg-[#f3f4f6] text-[var(--font-secondary)]"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE OPTIMIZED: Instructors Section */}
        {course.instructors && course.instructors.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 overflow-hidden">
            <span className="text-xs sm:text-sm font-semibold text-[#374151] flex-shrink-0">
              Instructors:
            </span>
            <div className="flex items-center min-w-0">
              {course.instructors.slice(0, 3).map((instructor, index) => (
                <div
                  key={index}
                  className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white -ml-1 first:ml-0 overflow-hidden cursor-pointer transition-all duration-200 hover:z-10 flex-shrink-0"
                  title={instructor.name}
                >
                  <img
                    src={
                      instructor.profile_pic_url ||
                      `https://images.unsplash.com/photo-${
                        index === 0
                          ? "1472099645785-5658abf4ff4e"
                          : index === 1
                          ? "1507003211169-0a1dd7228f2d"
                          : "1494790108755-2616b612b786"
                      }?w=40&h=40&fit=crop&crop=face`
                    }
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              <span className="ml-2 text-xs text-[var(--font-secondary)] truncate">
                {course.instructors[0]?.name || "Expert Instructor"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Icon Actions - Always Visible */}
      <IconActionsSection onContinueLearning={handlePrimaryClick} />
    </div>
  );
};

export default EnrolledExpandedCard;

// MOBILE OPTIMIZED: InstructorSection
export const InstructorSection = ({ course }: { course: Course }) => {
  return (
    <div>
      {course.instructors && course.instructors.length > 0 && (
        <div className="mb-3 overflow-hidden">
          <h3 className="text-[var(--netural-400)] font-semibold text-xs mb-2">
            Instructors:
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1 sm:-space-x-2">
              {course.instructors.slice(0, 3).map((instructor, index) => (
                <div
                  key={index}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden flex-shrink-0"
                >
                  <img
                    src={instructor.profile_pic_url}
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs min-w-0">
              <p className="font-medium text-[var(--netural-400)] truncate">
                {course.instructors[0]?.name || "Expert Instructor"}
              </p>
              <p className="text-[var(--netural-300)] text-xs">
                Lead instructor
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// MOBILE OPTIMIZED: NextLessionSection
export const NextLessionSection = ({ course }: { course: Course }) => {
  return (
    <div>
      {course?.next_lesson && (
        <div className="bg-green-50 border border-green-200 rounded-md p-2 sm:p-2.5 my-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-800 font-semibold text-xs">
              Next Lesson
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="text-[var(--netural-400)] font-medium text-xs truncate">
                {course.next_lesson.title}
              </p>
              <p className="text-green-600 text-xs truncate">
                {course.next_lesson.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// MOBILE OPTIMIZED: WhatsIncludedSection
export const WhatsIncludedSection = ({ course }: { course: Course }) => {
  return (
    <div>
      {course?.whats_included && course.whats_included.length > 0 && (
        <div className="mb-3 overflow-hidden">
          <div className="bg-[var(--netural-50)] rounded-md p-2">
            <div className="flex items-center gap-1.5 mb-2">
              <svg
                className="w-3 h-3 text-[#FF6B35] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-xs text-[var(--netural-400)]">
                What's Included:
              </span>
            </div>
            <div className="space-y-1 text-xs">
              {course.whats_included.map((item, index) => (
                <div className="flex items-center gap-1.5" key={index}>
                  <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="text-[var(--netural-400)] truncate">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
