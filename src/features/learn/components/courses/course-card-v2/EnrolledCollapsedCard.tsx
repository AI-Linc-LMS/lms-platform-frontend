import React from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import {
  generateTrustedByCompanies,
  calculateProgress,
} from "./utils/courseDataUtils";
import {
  EnrolledBannerSection,
  ContinueLearningButton,
  NextUpSection,
  CertifiedBySection,
  CourseCardContainer,
} from "./components";

interface EnrolledCollapsedCardProps {
  course: Course;
  className?: string;
  onExpand: () => void;
}

const EnrolledCollapsedCard: React.FC<EnrolledCollapsedCardProps> = ({
  course,
  className = "",
  onExpand,
}) => {
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    navigate(`/courses/${course.id}`);
  };

  // Generate dynamic data
  const trustedCompanies = generateTrustedByCompanies(course);
  const progressPercentage = calculateProgress(course);

  return (
    <CourseCardContainer className={className}>
      {/* Enrolled Banner - Top Right */}
      <EnrolledBannerSection variant="collapsed" />

      {/* Card Header */}
      <div className="p-4 md:p-6 pb-2 md:pb-3 border-b border-[#f3f4f6]">
        {/* Header Main */}
        <div className="flex items-start md:items-center justify-between mb-2 gap-3">
          <h1 className="text-lg md:text-[32px] font-bold text-[#374151] m-0 leading-[1.2] flex-1 pr-2">
            {course.title}
          </h1>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 relative z-10">
            <div className="flex flex-col items-end gap-1">
              <span className="bg-[#10b981] text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg md:rounded-xl text-[9px] md:text-[11px] font-semibold uppercase tracking-[0.5px]">
                Active
              </span>
            </div>
            <button
              onClick={onExpand}
              className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-full w-7 h-7 md:w-9 md:h-9 flex items-center justify-center cursor-pointer transition-all duration-300 text-[#6b7280] hover:bg-[#e5e7eb] hover:scale-105 relative z-20 shadow-sm mt-4.5 md:mt-0 mx-2.5"
              aria-label="Expand course card"
            >
              <svg
                className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Course By */}
        <CertifiedBySection
          trustedCompanies={trustedCompanies}
          maxVisible={3}
        />
      </div>

      {/* Minified Content */}
      <div className="p-4 md:p-6">
        {/* Quick Overview */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5 mb-4 p-3 md:p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
          {/* Progress Summary */}
          <div className="flex items-center gap-3 md:flex-shrink-0">
            <div className="relative w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-full bg-[#e2e8f0] flex items-center justify-center">
              <div
                className="absolute top-0 left-0 w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#10b981 0deg, #10b981 ${
                    (progressPercentage || 0) * 3.6
                  }deg, #e2e8f0 ${(progressPercentage || 0) * 3.6}deg)`,
                }}
              >
                <div className="absolute w-[28px] h-[28px] md:w-[35px] md:h-[35px] bg-white rounded-full"></div>
                <span className="relative z-10 text-[10px] md:text-xs font-bold text-[#374151]">
                  {progressPercentage || 0}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] md:text-xs font-semibold text-[#374151]">
                Course Progress
              </span>
              <span className="text-[10px] md:text-[11px] text-[#6b7280]">
                {course.stats?.video?.completed || 0}/
                {course.stats?.video?.total || 0} videos
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-2 md:gap-4 flex-1 justify-center">
            <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[50px] md:min-w-[60px] flex-1">
              <i className="fas fa-fire text-sm md:text-base text-[#10b981]"></i>
              <span className="text-sm md:text-base font-bold text-[#374151] leading-none">
                {course.streak || 0}
              </span>
              <span className="text-[9px] md:text-[10px] text-[#6b7280] font-medium text-center">
                Day Streak
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[50px] md:min-w-[60px] flex-1">
              <i className="fas fa-trophy text-sm md:text-base text-[#10b981]"></i>
              <span className="text-sm md:text-base font-bold text-[#374151] leading-none">
                {course.badges || 0}
              </span>
              <span className="text-[9px] md:text-[10px] text-[#6b7280] font-medium text-center">
                Badges
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[50px] md:min-w-[60px] flex-1">
              <i className="fas fa-play text-sm md:text-base text-[#10b981]"></i>
              <span className="text-sm md:text-base font-bold text-[#374151] leading-none">
                {course.stats?.video?.completed || 0}
              </span>
              <span className="text-[9px] md:text-[10px] text-[#6b7280] font-medium text-center">
                Videos
              </span>
            </div>
          </div>
        </div>

        {/* Next Up Section */}
        <NextUpSection nextLesson={course?.next_lesson} variant="collapsed" />

        {/* Continue Learning Button */}
        <ContinueLearningButton onClick={handlePrimaryClick} />
      </div>
    </CourseCardContainer>
  );
};

export default EnrolledCollapsedCard;
