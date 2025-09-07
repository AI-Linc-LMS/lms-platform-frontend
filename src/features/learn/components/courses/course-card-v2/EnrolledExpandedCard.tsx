import React from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import { DocumentIcon } from "../../../../../commonComponents/icons/learnIcons/CourseIcons";
import {
  formatPrice,
  generateTrustedByCompanies,
} from "./utils/courseDataUtils";
import { CertifiedBySection, ProgressCard } from "./EnrolledCollapsedCard";
import { AchievementSection } from "./utils/AchivementSection";
import { FeaturesSection } from "./NotEnrolledExpandedCard";

// Enrolled Banner Component
const EnrolledBanner: React.FC<{ isEnrolled: boolean }> = ({ isEnrolled }) => {
  if (!isEnrolled) return null;

  return (
    <div className="absolute top-5 left-0 z-10">
      <div className="bg-green-600 text-center w-[100px] text-white text-xs font-semibold px-3 py-1 rounded-tl-2xl rounded-br-lg shadow-md">
        Enrolled
      </div>
    </div>
  ); 
};

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

  const formattedPrice = formatPrice(course?.price || "0");
  const isFree = course?.is_free === true || formattedPrice === "0";

  const trustedCompanies = generateTrustedByCompanies(course);

  return (
    <div
      className={`w-full border border-[#80C9E0] p-3 pt-4 rounded-xl md:rounded-2xl bg-white flex flex-col self-start ${className}`}
    >
      {/* Enrolled Banner - Top Left */}
      <EnrolledBanner isEnrolled={true} />

      {/* Header with title and collapse button */}
      <div className="flex justify-between items-start mb-3">
        <h1 className="font-bold font-sans text-lg text-[#343A40]">
          {course.title}
        </h1>
        <button
          onClick={onCollapse}
          className="w-6 h-6 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-full flex items-center justify-center transition-colors duration-200"
          aria-label="Collapse course card"
        >
          <svg
            className="w-3 h-3 text-[#495057]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>

      {/* Created and Certified By Section */}
      <CertifiedBySection trustedCompanies={trustedCompanies} />

      {/* Course Info Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center gap-1 bg-[#F8F9FA] rounded-md px-2 py-1">
          <svg
            className="w-3 h-3 text-[#FFC107]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-medium text-[#495057]">
            {course.difficulty_level || "Medium"}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#F8F9FA] rounded-md px-2 py-1">
          <svg
            className="w-3 h-3 text-[#6C757D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span className="text-xs font-medium text-[#495057]">
            {course.duration_in_hours != null && course.duration_in_hours > 0
              ? `${course.duration_in_hours} hours`
              : "Self-paced"}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#FFF3CD] border border-[#FFEAA7] rounded-md px-2 py-1">
          <svg
            className="w-3 h-3 text-[#856404]"
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
          <span className="text-xs font-medium text-[#856404]">
            {isFree ? "Free" : `${formattedPrice}`}
          </span>
        </div>

        {/* Rating - only show if rating exists */}
        {course.rating != null && course.rating > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${
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
            </div>
            <span className="text-xs font-medium text-[#495057] ml-1">
              {course.rating.toFixed(1)}/5
            </span>
          </div>
        )}
      </div>

      <ProgressCard
        progressPercentage={course.progress_percentage}
        course={course}
      />

      {/* Continue Learning Button */}
      <div className="mt-auto">
        <button
          onClick={handlePrimaryClick}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
        >
          Continue Learning
        </button>
      </div>

      {/* Course Description */}
      <div className="my-3">
        <p className="text-[#495057] text-sm leading-relaxed">
          {course.description.slice(0, 150)} ...
        </p>
      </div>

      {/* Recent Activity Section */}
      {course.recent_activity && course.recent_activity.length > 0 && (
        <div className="bg-orange-50 rounded-md p-2.5 my-2.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-orange-800 font-semibold text-xs">
              Recent Activity
            </h3>
          </div>
          {(course?.recent_activity || []).map((activity, index) => (
            <div key={index} className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-[#495057]">{activity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Section */}
      <div className="my-3">
        <h3 className="text-[#495057] font-semibold text-sm my-3 uppercase tracking-wide">
          CONTENT
        </h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="flex flex-col items-center p-2 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-4 h-4 text-[#6C757D] mb-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-bold text-[#495057]">
              {course.stats?.video?.completed || 0} /
              {course.stats?.video?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-4 h-4 text-[#6C757D] mb-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm font-bold text-[#495057]">
              {course.stats?.article?.completed || 0} /
              {course.stats?.article?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-4 h-4 text-[#6C757D] mb-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-sm font-bold text-[#495057]">
              {course.stats?.quiz?.completed || 0} /
              {course.stats?.quiz?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-4 h-4 text-[#6C757D] mb-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span className="text-sm font-bold text-[#495057]">
              {course.stats?.coding_problem?.completed || 0} /
              {course.stats?.coding_problem?.total || 0}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-[#F8F9FA] rounded-lg">
            <svg
              className="w-4 h-4 text-[#6C757D] mb-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-sm font-bold text-[#495057]">
              {course.stats?.assignment?.completed || 0} /
              {course.stats?.assignment?.total || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      {course.achievements && course.achievements.length > 0 && (
        <AchievementSection course={course} />
      )}

      {/* Next Lesson Section */}
      <NextLessionSection course={course} />

      {/* Instructors Section */}
      <InstructorSection course={course} />

      {/* Key Features */}
      <FeaturesSection course={course} />

      {/* What's Included Section */}
      <WhatsIncludedSection course={course} />
    </div>
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
                  <DocumentIcon />
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
