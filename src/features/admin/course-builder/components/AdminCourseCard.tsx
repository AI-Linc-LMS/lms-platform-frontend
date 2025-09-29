import React from "react";
import { Course } from "../../../learn/types/final-course.types";
import {
    generateTrustedByCompanies,
    formatPrice
} from "../../../learn/components/courses/course-card-v2/utils/courseDataUtils";
import { CertifiedBySection } from "../../../learn/components/courses/course-card-v2/components/shared/CertifiedBySection";
import { ContentMetricsSection } from "../../../learn/components/courses/course-card-v2/components/ContentMetricsSection";
import { FileText } from "lucide-react";

// Star Rating Component
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

// What's Included Section Component
const WhatsIncludedSection = ({ course }: { course: Course }) => {
  if (!course?.whats_included || course.whats_included.length === 0) return null;

  return (
    <div className="mb-3 overflow-hidden">
      <div className="bg-[var(--neutral-50)] rounded-md p-2">
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
          <span className="font-semibold text-xs text-[var(--neutral-400)]">
            What's Included:
          </span>
        </div>
        <div className="space-y-1 text-xs">
          {course.whats_included.map((item, index) => (
            <div className="flex items-center gap-1.5" key={index}>
              <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <span className="text-[var(--neutral-400)] truncate">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


interface AdminCourseCardProps {
  course: Course;
  onEditClick: () => void;
}

const AdminCourseCard: React.FC<AdminCourseCardProps> = ({ course, onEditClick }) => {
  const trustedCompanies = generateTrustedByCompanies(course);
  const formattedPrice = formatPrice(course?.price || "0");
  const isFree = course?.is_free === true || formattedPrice === "0";
  const courseRating = course?.rating || 4.8;
  const courseLevel = course?.difficulty_level;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-xl transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 overflow-hidden max-w-[500px] flex flex-col h-full">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold flex-1 pr-4">{course.title}</h3>
          <span
            className={`${
              course.published
                ? "bg-green-50 text-green-800"
                : "bg-blue-50 text-blue-800"
            } text-sm px-3 py-1 rounded-full whitespace-nowrap`}
          >
            {course.published ? "Published" : "Draft"}
          </span>
        </div>

        {/* Certified By Section */}
        <div className="mb-4">
            <CertifiedBySection
                trustedCompanies={trustedCompanies}
                maxVisible={3}
            />
        </div>

        {/* Course Info Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
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

        <p className="text-gray-600 mb-4">
          {course.description || "No description available"}
        </p>

        {/* What you'll learn */}
        {course.learning_objectives && (
            <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                What you'll learn:
            </h3>
            <ul className="space-y-2">
                {course.learning_objectives.split(',').slice(0, 4).map((outcome, index) => (
                <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-600"
                >
                    <span className="text-green-600 font-bold text-xs mt-0.5 flex-shrink-0">
                    ✓
                    </span>
                    <span className="leading-relaxed">{outcome}</span>
                </li>
                ))}
            </ul>
            </div>
        )}

        {/* Feature Badges/Tags */}
        {course.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
            {course.tags.slice(0, 3).map(
                (badge, index) => (
                <div
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-[var(--font-light)] rounded-full text-xs font-semibold whitespace-nowrap"
                >
                    {badge}
                </div>
                )
            )}
            </div>
        )}

        {/* What's Included */}
        <WhatsIncludedSection course={course} />

        {/* Content Metrics */}
        <ContentMetricsSection course={course} />


        <div className="mt-auto pt-4">
          <button
            className="w-full bg-[#10b981] text-white py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-[#059669] hover:-translate-y-0.5 flex items-center justify-center"
            onClick={onEditClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseCard;