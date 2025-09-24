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
    <div
      className={`course-card w-full max-w-lg h-[320px]  bg-white rounded-2xl border border-blue-100 shadow-xl transition-all duration-300 ease-in-out relative overflow-visible ${className}`}
    >
      {/* Enrolled Banner - Top Right */}
      <EnrolledBannerSection variant="collapsed" />

      {/* MOBILE OPTIMIZED: Card Header */}
      <div className="p-7 sm:p-4 md:p-6 pb-2 sm:pb-3 border-b border-[#f3f4f6]">
        {/* Header Main - Responsive layout */}
        <div className="flex items-start sm:items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700 leading-tight pr-4 flex-1">
            {course.title}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex flex-col items-end gap-1">
              <span className="bg-[#10b981] text-[var(--font-light)] px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.5px]">
                Active
              </span>
            </div>
            <button
              onClick={onExpand}
              className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center cursor-pointer transition-all duration-300 text-[var(--font-secondary)] hover:bg-[#e5e7eb] hover:scale-105"
              aria-label="Expand course card"
            >
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300"
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

      {/* MOBILE OPTIMIZED: Minified Content */}
      <div className="p-3 sm:p-4 md:p-6">
        {/* Quick Overview - Mobile responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-5 mb-3 sm:mb-4 p-3 sm:p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
          {/* Progress Summary */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-[40px] h-[40px] sm:w-[45px] sm:h-[45px] md:w-[50px] md:h-[50px] rounded-full bg-[#e2e8f0] flex items-center justify-center flex-shrink-0">
              <div
                className="absolute top-0 left-0 w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#10b981 0deg, #10b981 ${
                    (progressPercentage ?? 0) * 3.6
                  }deg, #e2e8f0 ${(progressPercentage ?? 0) * 3.6}deg)`,
                }}
              >
                <div className="absolute w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] md:w-[35px] md:h-[35px] bg-white rounded-full"></div>
                <span className="relative z-10 text-[10px] sm:text-xs font-bold text-[#374151]">
                  {progressPercentage ?? 0}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-[#374151]">
                Course Progress
              </span>
              <span className="text-[10px] sm:text-[11px] text-[var(--font-secondary)]">
                {course.stats?.video?.completed ?? 0}/
                {course.stats?.video?.total ?? 0} videos
              </span>
            </div>
          </div>

          {/* MOBILE OPTIMIZED: Quick Stats - Keep all 3 but make them smaller */}
          <div className="flex gap-2 sm:gap-3 md:gap-4 flex-1 justify-center sm:justify-end">
            {/* Day Streak */}
            <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[50px] sm:min-w-[55px] md:min-w-[60px]">
              <i className="fas fa-fire text-sm sm:text-base text-[#10b981]"></i>
              <span className="text-sm sm:text-base font-bold text-[#374151] leading-none">
                {course.streak ?? 0}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[var(--font-secondary)] font-medium text-center">
                Day Streak
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[50px] sm:min-w-[55px] md:min-w-[60px]">
              <i className="fas fa-trophy text-sm sm:text-base text-[#10b981]"></i>
              <span className="text-sm sm:text-base font-bold text-[#374151] leading-none">
                {course.badges ?? 0}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[var(--font-secondary)] font-medium text-center">
                Badges
              </span>
            </div>

            {/* Videos - Always visible, just smaller on mobile */}
            <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[50px] sm:min-w-[55px] md:min-w-[60px]">
              <i className="fas fa-play text-sm sm:text-base text-[#10b981]"></i>
              <span className="text-sm sm:text-base font-bold text-[#374151] leading-none">
                {course.stats?.video?.completed ?? 0}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[var(--font-secondary)] font-medium text-center">
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
    </div>
  );
};

export default EnrolledCollapsedCard;
