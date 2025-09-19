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
    <CourseCardContainer className={className}>
      {/* Enrolled Banner - Top Right */}
      <EnrolledBannerSection variant="expanded" />

      {/* Card Header */}
      <CardHeader course={course} onCollapse={onCollapse} />

      {/* Trusted By (backend or fallback) */}
      <div className="px-6 pb-3">
        <CertifiedBySection
          trustedCompanies={generateTrustedByCompanies(course)}
        />
      </div>

      {/* Minified Content */}
      <div className="p-6 pt-4">
        {/* Quick Overview */}
        <QuickOverviewSection course={course} />

        {/* Next Up Section */}
        <NextUpSection nextLesson={course?.next_lesson} />

        {/* Continue Learning Button */}
        <ContinueLearningButton onClick={handlePrimaryClick} className="mb-4" />

        {/* Course Description */}
        <div className="mt-10 mb-6">
          <p className="text-sm leading-[1.5] text-[#374151] m-0">
            {course.description ||
              "Learn how to build intelligent, goal-driven digital products using Agentic AI systems. This course covers advanced techniques for creating autonomous AI agents that can make decisions and take actions in complex environments."}
          </p>
        </div>

        {/* Content Metrics */}
        <ContentMetricsSection course={course} />

        {/* Learning Progress */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-semibold text-[#374151]">
              Your Progress
            </span>
            <span className="text-[13px] font-bold text-[#10b981]">
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
            <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
              <PlayCircle className="w-[10px] h-[10px] text-[#10b981]" />
              <span>
                {course.stats?.video?.completed}/{course.stats?.video?.total}{" "}
                videos watched
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-[10px] h-[10px] text-[#10b981]"
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
              <span>
                {course.stats?.quiz?.completed}/{course.stats?.quiz?.total}{" "}
                quizzes completed
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-semibold text-[#92400e]">
              Recent Activity
            </span>
            <span className="text-[11px] text-[#a16207]">2 hours ago</span>
          </div>
          <div className="space-y-1">
            {course.recent_activity && course.recent_activity.length > 0 ? (
              course.recent_activity.slice(0, 2).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-[11px] text-[#92400e]"
                >
                  {index === 0 ? (
                    <Play className="w-[10px] h-[10px] text-[#a16207]" />
                  ) : (
                    <Trophy className="w-[10px] h-[10px] text-[#a16207]" />
                  )}
                  <span>{activity}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center gap-2 text-[11px] text-[#92400e]">
                  <Play className="w-[10px] h-[10px] text-[#a16207]" />
                  <span>Completed: "Introduction to Data Visualization"</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#92400e]">
                  <Trophy className="w-[10px] h-[10px] text-[#a16207]" />
                  <span>Earned: "Data Analysis Basics" badge</span>
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
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-[#f59e0b] rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
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
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#92400e] leading-none">
                {course.streak ?? 0}
              </span>
              <span className="text-[10px] text-[#a16207] font-medium uppercase tracking-[0.3px]">
                Day Streak
              </span>
            </div>
          </div>
          <div className="flex gap-1 justify-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={index}
                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold ${
                  index < (course?.streak ?? 0)
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
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold text-[#374151]">
              Instructors:
            </span>
            <div className="flex items-center">
              {course.instructors.slice(0, 3).map((instructor, index) => (
                <div
                  key={index}
                  className="relative w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden cursor-pointer transition-all duration-200 hover:z-10"
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
          </div>
        )}
      </div>

      {/* Icon Actions - Always Visible */}
      <IconActionsSection onContinueLearning={handlePrimaryClick} />
    </CourseCardContainer>
  );
};

export default EnrolledExpandedCard;

export const InstructorSection = ({ course }: { course: Course }) => {
  return (
    <div>
      {" "}
      {course.instructors && course.instructors.length > 0 && (
        <div className="mb-3">
          <h3 className="text-[#495057] font-semibold text-xs mb-2">
            Instructors:
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {course.instructors.slice(0, 3).map((instructor, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden"
                >
                  <img
                    src={instructor.profile_pic_url}
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs">
              <p className="font-medium text-[#495057]">
                {course.instructors[0]?.name || "Expert Instructor"}
              </p>
              <p className="text-[#6C757D] text-xs">Lead instructor</p>
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
        <div className="bg-green-50 border border-green-200 rounded-md p-2.5 my-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-800 font-semibold text-xs">
              Next Lesson
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
            <div>
              <p className="text-[#495057] font-medium text-xs">
                {course.next_lesson.title}
              </p>
              <p className="text-green-600 text-xs">
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
                className="w-3 h-3 text-[#FF6B35]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-xs text-[#495057]">
                What's Included:
              </span>
            </div>
            <div className="space-y-1 text-xs">
              {course.whats_included.map((item, index) => (
                <div className="flex items-center gap-1.5" key={index}>
                  <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="text-[#495057]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
