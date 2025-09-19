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
  CourseCardContainer,
} from "./components";
import { CertifiedBySection } from "./components/shared";
import { generateTrustedByCompanies } from "./utils/courseDataUtils";

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
    <CourseCardContainer className={`${className} w-full max-w-none sm:max-w-sm md:max-w-md lg:max-w-lg`}>
      {/* Enrolled Banner - Top Right */}
      <EnrolledBannerSection variant="expanded" />

      {/* Card Header */}
      <CardHeader course={course} onCollapse={onCollapse} />

      {/* Trusted By (backend or fallback) */}
      <div className="px-2 sm:px-3 md:px-6 pb-1 sm:pb-2 md:pb-3">
        <CertifiedBySection trustedCompanies={generateTrustedByCompanies(course)} />
      </div>

      {/* Minified Content */}
      <div className="p-2 sm:p-3 md:p-6 pt-1 sm:pt-2 md:pt-4 space-y-2 sm:space-y-3 md:space-y-4">
        {/* Quick Overview */}
        <QuickOverviewSection course={course} />

        {/* Next Up Section */}
        <NextUpSection nextLesson={course?.next_lesson} />

        {/* Continue Learning Button */}
        <ContinueLearningButton onClick={handlePrimaryClick} className="w-full text-xs sm:text-sm" />

        {/* Course Description */}
        <div className="mt-3 sm:mt-4 md:mt-6 mb-2 sm:mb-3 md:mb-4">
          <p className="text-xs sm:text-sm leading-relaxed text-[#374151] m-0 line-clamp-3 sm:line-clamp-none">
            {course.description ||
              "Learn how to build intelligent, goal-driven digital products using Agentic AI systems. This course covers advanced techniques for creating autonomous AI agents that can make decisions and take actions in complex environments."}
          </p>
        </div>

        {/* Content Metrics */}
        <ContentMetricsSection course={course} />

        {/* Learning Progress */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-2 sm:p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-semibold text-[#374151]">
              Your Progress
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#10b981]">
              {(course.progress_percentage ?? calculateProgress(course))}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#e5e7eb] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full transition-all duration-300"
              style={{ width: `${course.progress_percentage ?? calculateProgress(course)}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
            <div className="flex items-center gap-2 text-xs text-[#6b7280]">
              <PlayCircle className="w-3 h-3 text-[#10b981] flex-shrink-0" />
              <span className="truncate">
                {course.stats?.video?.completed ?? 0}/{course.stats?.video?.total ?? 0} videos
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6b7280]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 text-[#10b981] flex-shrink-0"
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
                {course.stats?.quiz?.completed ?? 0}/{course.stats?.quiz?.total ?? 0} quizzes
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-2 sm:p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-semibold text-[#92400e]">
              Recent Activity
            </span>
            <span className="text-xs text-[#a16207]">2h ago</span>
          </div>
          <div className="space-y-1">
            {course.recent_activity && course.recent_activity.length > 0 ? (
              course.recent_activity.slice(0, 2).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-xs text-[#92400e]"
                >
                  {index === 0 ? (
                    <Play className="w-3 h-3 text-[#a16207] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Trophy className="w-3 h-3 text-[#a16207] flex-shrink-0 mt-0.5" />
                  )}
                  <span className="line-clamp-1 sm:line-clamp-2 leading-relaxed">{activity}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-2 text-xs text-[#92400e]">
                  <Play className="w-3 h-3 text-[#a16207] flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1 sm:line-clamp-2">Completed: "Introduction to Data Visualization"</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-[#92400e]">
                  <Trophy className="w-3 h-3 text-[#a16207] flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1 sm:line-clamp-2">Earned: "Data Analysis Basics" badge</span>
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

        {/* Study Streak */}
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#f59e0b] rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
              <span className="text-lg sm:text-xl font-bold text-[#92400e] leading-none">
                {course.streak || 7}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-[#a16207]">
                Day Streak
              </span>
            </div>
          </div>
          <div className="flex gap-1 justify-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={index}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-xs font-semibold ${
                  index < (course.streak || 7)
                    ? "bg-[#10b981] text-white"
                    : "bg-[#f3f4f6] text-[#6b7280]"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Instructors Section */}
        {course.instructors && course.instructors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#374151]">
              Instructors:
            </span>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {course.instructors.slice(0, 3).map((instructor, index) => (
                  <div
                    key={index}
                    className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white overflow-hidden cursor-pointer transition-all duration-200 hover:z-10 hover:scale-110"
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
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#374151] truncate">
                  {course.instructors[0]?.name || "Expert Instructor"}
                </p>
                <p className="text-xs text-[#6b7280]">Lead instructor</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Icon Actions - Always Visible */}
      <div className="p-2 sm:p-3 md:p-4 border-t border-gray-100">
        <IconActionsSection onContinueLearning={handlePrimaryClick} />
      </div>
    </CourseCardContainer>
  );
};

export default EnrolledExpandedCard;

export const InstructorSection = ({ course }: { course: Course }) => {
  return (
    <div>
      {course.instructors && course.instructors.length > 0 && (
        <div className="mb-3">
          <h3 className="text-[#495057] font-semibold text-[10px] md:text-xs mb-2">
            Instructors:
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5 md:-space-x-2">
              {course.instructors.slice(0, 3).map((instructor, index) => (
                <div
                  key={index}
                  className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden"
                >
                  <img
                    src={instructor.profile_pic_url}
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-[10px] md:text-xs">
              <p className="font-medium text-[#495057]">
                {course.instructors[0]?.name || "Expert Instructor"}
              </p>
              <p className="text-[#6C757D] text-[9px] md:text-xs">Lead instructor</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const NextLessionSection = ({ course }: { course: Course }) => {
  return (
    <div>
      {course?.next_lesson && (
        <div className="bg-green-50 border border-green-200 rounded-md p-2 md:p-2.5 my-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-800 font-semibold text-[10px] md:text-xs">
              Next Lesson
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              <p className="text-[#495057] font-medium text-[10px] md:text-xs truncate">
                {course.next_lesson.title}
              </p>
              <p className="text-green-600 text-[9px] md:text-xs line-clamp-2">
                {course.next_lesson.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const WhatsIncludedSection = ({ course }: { course: Course }) => {
  return (
    <div>
      {course?.whats_included && course.whats_included.length > 0 && (
        <div className="mb-3">
          <div className="bg-[#F8F9FA] rounded-md p-2">
            <div className="flex items-center gap-1.5 mb-2">
              <svg
                className="w-2.5 md:w-3 h-2.5 md:h-3 text-[#FF6B35] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-[10px] md:text-xs text-[#495057]">
                What's Included:
              </span>
            </div>
            <div className="space-y-1 text-[10px] md:text-xs">
              {course.whats_included.map((item, index) => (
                <div className="flex items-start gap-1.5" key={index}>
                  <FileText className="w-2.5 md:w-3 h-2.5 md:h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[#495057] leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
