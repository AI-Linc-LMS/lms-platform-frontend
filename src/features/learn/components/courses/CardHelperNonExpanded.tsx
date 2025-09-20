import Course from "../../types/final-course.types";
import { CompanyLogosSection } from "./course-card-v2/components";

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

  return <div className="flex items-center gap-1">{stars}</div>;
};

export default function CardHelper({
  course,
  isExpanded,
  toggleExpanded,
  showSuccessToast,
  courseLevel,
  courseDuration,
  coursePrice,
  courseRating,
  isEnrolling,
  handlePrimaryClick,
}: {
  course: Course;
  isExpanded: boolean;
  toggleExpanded: () => void;
  showSuccessToast: boolean;
  courseLevel: string | undefined;
  courseDuration: number | undefined;
  coursePrice: string | undefined;
  courseRating: number | undefined;
  totalCounts: { videos: number; articles: number; quizzes: number };
  isEnrolling: boolean;
  handlePrimaryClick: () => void;
  handleIconAction: (action: string) => void;
}) {
  return (
    <>
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Successfully enrolled!</span>
          </div>
        </div>
      )}

      {/* CLEAN MINIMAL CARD - Based on your image */}
      <div className="course-card w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm relative p-4">
        {/* Expand Button - Top Right */}
        <button
          onClick={toggleExpanded}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300 text-gray-500"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Course Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4 pr-12">
          {course.title}
        </h1>

        {/* Company Logos */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Created and certified by
          </p>
          <div className="flex items-center gap-3">
            <CompanyLogosSection />
          </div>
        </div>

        {/* Course Info Pills */}
        <div className="flex items-center gap-3 mb-4">
          {/* Level */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <svg
              className="w-4 h-4"
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
            {courseLevel}
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {courseDuration} hours
          </div>

          {/* Price */}
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded text-sm font-medium text-yellow-800">
            <svg
              className="w-4 h-4"
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
            ${coursePrice}
          </div>
        </div>

        {/* Rating - Right Aligned */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-2">
            <StarRating rating={courseRating} size="text-sm" />
            <span className="text-sm font-medium text-gray-700">
              {courseRating}/5
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePrimaryClick}
          disabled={isEnrolling}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-all duration-200"
        >
          {isEnrolling ? "Processing…" : "View More"}
        </button>
      </div>
    </>
  );
}
