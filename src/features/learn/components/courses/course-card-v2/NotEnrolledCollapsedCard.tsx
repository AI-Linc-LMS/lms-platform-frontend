import React from "react";
import { Course } from "../../../types/final-course.types";
// import { useNavigate } from "react-router-dom";
import { formatPrice } from "./utils/courseDataUtils";
import { CompanyLogosSection } from "./components";

// Enhanced 3D Star Rating Component
const StarRating = ({
  rating,
  maxStars = 5,
  size = "text-sm",
}: {
  rating: number | undefined;
  maxStars?: number;
  size?: string;
}) => {
  const stars = [];
  const fullStars = (rating && Math.floor(rating)) ?? 0;
  const hasHalfStar = (rating && rating % 1 >= 0.5) ?? 0;

  for (let i = 1; i <= maxStars; i++) {
    if (i <= fullStars) {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-full`}
        >
          ⭐
        </span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-half`}
        >
          ⭐
        </span>
      );
    } else {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-empty`}
        >
          ☆
        </span>
      );
    }
  }

  return <div className="flex items-center gap-0">{stars}</div>;
};

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
  // const navigate = useNavigate();

  // const handlePrimaryClick = () => {
  //   navigate(`/courses/${course.id}`);
  // };
  const formattedPrice = formatPrice(course?.price || "0");
  const isFree = course?.is_free === true || formattedPrice === "0";
  const courseRating = course?.rating || 4.8;
  const courseLevel = course?.difficulty_level;
  const courseDuration = course?.duration_in_hours;

  return (
    <div
      className={`course-card w-full max-w-lg bg-white lg:h-[350px] rounded-2xl border border-blue-100 shadow-xl transition-all duration-300 ease-in-out relative overflow-visible ${className}`}
    >
      {/* Card Header */}
      <div className="p-4 sm:p-6 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700 leading-tight pr-4 flex-1">
            {course.title}
          </h1>
          <button
            onClick={onExpand}
            className="bg-gray-100 border border-gray-200 rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center cursor-pointer transition-all duration-300 text-gray-500 hover:bg-gray-200 hover:scale-105"
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

        {/* Company Logos */}
        <CompanyLogosSection />
      </div>

      {/* Content Section - Matching EnrolledCollapsedCard structure */}
      <div className="p-3 sm:p-4 md:p-6">
        {/* Course Info Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap">
            <svg
              className="w-3 h-3 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {courseLevel}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap">
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {courseDuration}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-800 whitespace-nowrap">
            {isFree ? "Free" : `₹${formattedPrice}`}
          </span>
          {/* Rating */}
          <div className="flex items-center gap-2 ml-auto">
            <StarRating rating={courseRating} size="text-xs" />
            <span className="text-xs font-semibold text-gray-700">
              {courseRating}/5
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            onClick={onExpand}
            className={`px-5 py-3 mt-7.5 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 text-center bg-[#10b981] text-[var(--font-light)] hover:bg-[#059669] hover:-translate-y-0.5 ${"w-full"} ${className}`}
          >
            View More
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotEnrolledCollapsedCard;
