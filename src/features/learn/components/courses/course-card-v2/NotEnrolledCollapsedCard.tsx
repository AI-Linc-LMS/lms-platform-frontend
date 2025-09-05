import React from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import {
  formatPrice,
  generateTrustedByCompanies,
} from "./utils/courseDataUtils";

interface NotEnrolledCollapsedCardProps {
  course: Course;
  className?: string;
  onExpand: () => void;
}

const NotEnrolledCollapsedCard: React.FC<NotEnrolledCollapsedCardProps> = ({
  course,
  className = "",
  onExpand,
}) => {
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const formattedPrice = formatPrice(course?.price || "0");
  const isFree = course?.is_free === true || formattedPrice === "0";

  // Generate trusted companies for display
  const trustedCompanies = generateTrustedByCompanies(course);

  return (
    <div
      className={`w-full border border-[#80C9E0] p-4 rounded-2xl md:rounded-3xl bg-white flex flex-col overflow-visible relative ${className}`}
    >
      {/* Expand Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onExpand}
          className="w-8 h-8 bg-[#F8F9FA] hover:bg-[#E9ECEF] border border-[#DEE2E6] rounded-full flex items-center justify-center transition-colors duration-200 shadow-sm"
          aria-label="Expand course card"
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Course Title */}
      <div className="mb-6 pr-12">
        <h1 className="font-bold font-sans text-xl text-[#343A40]">
          {course.title}
        </h1>
      </div>

      {/* Created and Certified By Section */}
      {trustedCompanies && trustedCompanies.length > 0 && (
        <div className="mb-6">
          <p className="text-[#6C757D] text-xs font-medium mb-3 uppercase tracking-wide">
            CREATED AND CERTIFIED BY
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {trustedCompanies
              .slice(0, 3)
              .map((company: { name: string } | string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded ${
                      index % 3 === 0
                        ? "bg-blue-500"
                        : index % 3 === 1
                        ? "bg-blue-700"
                        : "bg-blue-600"
                    }`}
                  ></div>
                  <span className="text-lg font-medium text-[#495057]">
                    {typeof company === "string" ? company : company.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Course Details Pills */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Difficulty */}
        <div className="flex items-center gap-2 bg-[#F8F9FA] rounded-lg px-4 py-2">
          <svg
            className="w-4 h-4 text-[#6C757D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="font-medium text-[#495057]">
            {course.difficulty_level || "Medium"}
          </span>
        </div>

        {/* Duration - only show if duration exists and is greater than 0 */}
        {course.duration_in_hours != null && course.duration_in_hours > 0 && (
          <div className="flex items-center gap-2 bg-[#F8F9FA] rounded-lg px-4 py-2">
            <svg
              className="w-4 h-4 text-[#6C757D]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <span className="font-medium text-[#495057]">
              {course.duration_in_hours} hours
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 bg-[#FFF3CD] border border-[#FFEAA7] rounded-lg px-4 py-2">
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
          <span className="font-medium text-[#856404]">
            {isFree ? "Free" : `${formattedPrice}`}
          </span>
        </div>
      </div>

      {/* Rating - only show if rating exists */}
      {course.rating != null && course.rating > 0 && (
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(course.rating!)
                    ? "text-[#FFC107]"
                    : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-lg font-medium text-[#495057]">
              {course.rating.toFixed(1)}/5
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-auto">
        <button
          onClick={handlePrimaryClick}
          className="w-full px-8 py-2 text-lg font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
        >
          Enroll Now
        </button>
      </div>
    </div>
  );
};

export default NotEnrolledCollapsedCard;
