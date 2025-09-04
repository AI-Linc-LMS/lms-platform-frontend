import React from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import {
  VideoIcon,
  DocumentIcon,
} from "../../../../../commonComponents/icons/learnIcons/CourseIcons";

interface NotEnrolledExpandedCardProps {
  course: Course;
  className?: string;
  onCollapse: () => void;
}

const NotEnrolledExpandedCard: React.FC<NotEnrolledExpandedCardProps> = ({
  course,
  className = "",
  onCollapse,
}) => {
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const isFree = course?.is_free === true || course?.price === 0;

  return (
    <div
      className={`w-full border border-[#80C9E0] p-4 pt-5 rounded-2xl md:rounded-3xl bg-white flex flex-col self-start relative overflow-visible min-h-[700px] max-h-[800px] ${className}`}
    >
      {/* Header with title and collapse button */}
      <div className="flex justify-between items-start mb-4">
        <h1 className="font-bold font-sans text-xl text-[#343A40]">
          {course.title}
        </h1>
        <button
          onClick={onCollapse}
          className="w-8 h-8 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-full flex items-center justify-center transition-colors duration-200"
          aria-label="Collapse course card"
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
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>

      {/* Created and Certified By Section */}
      {course.trusted_by && course.trusted_by.length > 0 && (
        <div className="mb-4">
          <p className="text-[#6C757D] text-xs font-medium mb-2 uppercase tracking-wide">
            CREATED AND CERTIFIED BY
          </p>
          <div className="flex flex-wrap gap-2">
            {course.trusted_by!.map(
              (company: { name: string } | string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg px-3 py-1"
                >
                  <div
                    className={`w-4 h-4 rounded ${
                      index % 3 === 0
                        ? "bg-blue-500"
                        : index % 3 === 1
                        ? "bg-blue-700"
                        : "bg-blue-600"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-[#495057]">
                    {typeof company === "string" ? company : company.name}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Course Info Row */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2 bg-[#F8F9FA] rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-[#FFC107]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium text-[#495057]">
            {course.difficulty_level || "Medium"}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#F8F9FA] rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-[#6C757D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <span className="text-sm font-medium text-[#495057]">
            {course.duration_in_hours != null && course.duration_in_hours > 0
              ? `${course.duration_in_hours} hours`
              : "Self-paced"}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#FFF3CD] border border-[#FFEAA7] rounded-lg px-3 py-2">
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
          <span className="text-sm font-medium text-[#856404]">
            {isFree ? "Free" : `$${course.price}`}
          </span>
        </div>

        {/* Rating - only show if rating exists */}
        {course.rating != null && course.rating > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
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
            <span className="text-sm font-medium text-[#495057] ml-1">
              {course.rating.toFixed(1)}/5
            </span>
          </div>
        )}
      </div>

      {/* Course Description */}
      <div className="mb-4">
        <p
          className="text-[#495057] text-sm leading-relaxed h-[4.5rem] overflow-hidden"
          style={
            {
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              textOverflow: "ellipsis",
            } as React.CSSProperties
          }
        >
          {course.description ||
            "Comprehensive course designed to enhance your skills."}
        </p>
      </div>

      {/* Key Features */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-[#495057]">
              Used by 90% of Fortune 500 companies
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-[#495057]">
              Boost your analytics career with real-world skills
            </span>
          </div>
        </div>
      </div>

      {/* Course Tags */}
      {course.tags && course.tags!.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {course.tags!.map(
            (tag: { name: string; color?: string }, index: number) => (
              <span
                key={index}
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  index % 3 === 0
                    ? "bg-[#E3F2FD] text-[#1976D2]"
                    : index % 3 === 1
                    ? "bg-[#E8F5E8] text-[#2E7D32]"
                    : "bg-[#FFF3E0] text-[#F57C00]"
                }`}
              >
                {tag.name}
              </span>
            )
          )}
        </div>
      )}

      {course.certificate_available && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-[#FFF3E0] text-[#F57C00] text-xs font-medium px-3 py-1 rounded-full">
            <svg
              className="w-3 h-3 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Industry Certificate
          </span>
        </div>
      )}

      {/* Rating and Learners */}
      <div className="mb-4 min-h-[5rem]">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    course.rating && i < Math.floor(course.rating)
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
            <span className="font-medium text-[#495057]">
              {course.rating
                ? `${course.rating.toFixed(1)}/5`
                : "No rating yet"}{" "}
              rating from {course.enrolled_students?.total || 0}+ learners
            </span>
          </div>
        </div>

        <div className="mt-2">
          <p className="text-sm text-[#6C757D]">
            Join {course.enrolled_students?.total || 0}+ learners who achieved
            success with these skills
          </p>
          {course.enrolled_students?.students_profile_pic &&
            course.enrolled_students!.students_profile_pic!.length > 0 && (
              <div className="flex -space-x-2 mt-2">
                {course
                  .enrolled_students!.students_profile_pic!.slice(0, 4)
                  .map((pic: string, index: number) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden"
                    >
                      <img
                        src={pic}
                        alt={`Student ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            )}
          {course.instructors &&
            course.instructors.length > 0 &&
            !course.enrolled_students?.students_profile_pic && (
              <div className="flex -space-x-2 mt-2">
                {course.instructors.slice(0, 4).map((instructor, index) => (
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
            )}
        </div>
      </div>

      {/* What's Included Section */}
      <div className="mb-6">
        <div className="bg-[#F8F9FA] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-[#FF6B35]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-[#495057]">
              What's Included:
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <DocumentIcon />
              <span className="text-[#495057]">
                Real datasets & project templates
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DocumentIcon />
              <span className="text-[#495057]">
                Free resume template for Data Analyst roles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Icons */}
      <div className="flex justify-center gap-6 mb-4">
        <button className="w-10 h-10 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-lg flex items-center justify-center transition-colors duration-200">
          <DocumentIcon />
        </button>
        <button className="w-10 h-10 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-lg flex items-center justify-center transition-colors duration-200">
          <VideoIcon />
        </button>
        <button className="w-10 h-10 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-lg flex items-center justify-center transition-colors duration-200">
          <svg
            className="w-5 h-5 text-[#6C757D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
        <button className="w-10 h-10 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-lg flex items-center justify-center transition-colors duration-200">
          <svg
            className="w-5 h-5 text-[#6C757D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button className="w-10 h-10 bg-[#F8F9FA] hover:bg-[#E9ECEF] rounded-lg flex items-center justify-center transition-colors duration-200">
          <svg
            className="w-5 h-5 text-[#6C757D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Enroll Button */}
      <div className="mt-auto">
        <button
          onClick={handlePrimaryClick}
          className="w-full px-8 py-3 text-lg font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
        >
          {`Enroll Now - ${isFree ? "Free" : `$${course.price}`}`}
        </button>
      </div>
    </div>
  );
};

export default NotEnrolledExpandedCard;
