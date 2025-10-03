import React from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import { generateTrustedByCompanies } from "./utils/courseDataUtils";
import {
  EnrolledBannerSection,
  ContinueLearningButton,
  NextUpSection,
  CertifiedBySection,
  QuickOverviewSection,
} from "./components";
import { ChevronDown } from "lucide-react";

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

  return (
    <div
      className={`course-card w-full max-w-lg bg-white rounded-2xl border border-blue-100 shadow-xl transition-all duration-300 ease-in-out relative overflow-visible ${className}`}
    >
      {/* Enrolled Banner - Positioned within card boundaries */}
      <EnrolledBannerSection variant="expanded" />

      {/* MOBILE OPTIMIZED: Card Header */}
      <div className="p-6 pb-3 border-b border-[#f3f4f6]">
        {/* Header Main */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700 leading-tight pr-4 flex-1">
            {course.title}
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1">
              <span className="bg-[var(--course-cta)] text-[var(--font-light)] px-2 py-1 rounded-xl text-[11px] font-semibold uppercase tracking-[0.5px]">
                Active
              </span>
            </div>
            <button
              onClick={onExpand}
              className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-full w-9 h-9 flex items-center justify-center cursor-pointer transition-all duration-300 text-[var(--font-secondary)] hover:bg-[#e5e7eb] hover:scale-105"
              aria-label="Collapse course card"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        <CertifiedBySection
          trustedCompanies={generateTrustedByCompanies(course)}
        />
      </div>

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
      </div>
    </div>
  );
};

export default EnrolledCollapsedCard;
