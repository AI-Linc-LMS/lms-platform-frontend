import React from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import {
  generateTrustedByCompanies,
  generateDynamicStreak,
  generateDynamicBadges,
  calculateProgress,
} from "./utils/courseDataUtils";

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
  const dayStreak = generateDynamicStreak(course.id);
  const badgesEarned = generateDynamicBadges(course);
  const progressPercentage = calculateProgress(course);

  return (
    <div
      className={`w-full border border-[#80C9E0] p-4 rounded-2xl md:rounded-3xl bg-white flex flex-col overflow-visible relative self-start ${className}`}
      style={{ height: "fit-content" }}
    >
      {/* Header with course title, enrolled badge, and expand button */}
      <div className="flex justify-between items-start mb-4">
        <h1 className="font-bold font-sans text-2xl text-[#343A40] mb-2 pr-12">
          {course.title}
        </h1>
        <div className="flex flex-col items-end gap-2">
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
          <div className="flex flex-col items-end">
            <div className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-md flex items-center gap-2 mb-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Enrolled
              <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>
            <p className="text-[#6C757D] text-xs">Enrolled 3 days ago</p>
          </div>
        </div>
      </div>

      {/* Created and Certified By */}
      {trustedCompanies && trustedCompanies.length > 0 && (
        <div className="mb-4">
          <p className="text-[#6C757D] text-xs font-medium mb-2 uppercase tracking-wide">
            CREATED AND CERTIFIED BY
          </p>
          <div className="flex flex-wrap gap-2">
            {trustedCompanies
              .slice(0, 3)
              .map((company: { name: string } | string, index: number) => (
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
              ))}
          </div>
        </div>
      )}

      {/* Progress and Stats Section */}
      <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Course Progress */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-2">
              <svg
                className="w-16 h-16 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E9ECEF"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#28A745"
                  strokeWidth="3"
                  strokeDasharray={`${progressPercentage}, ${
                    100 - progressPercentage
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-[#495057]">
                  {progressPercentage}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium text-[#495057] text-sm">
                Course Progress
              </p>
              <p className="text-xs text-[#6C757D]">
                {Math.floor(progressPercentage / 20) || 1}/
                {course.stats?.video?.total || 0} videos
              </p>
            </div>
          </div>

          {/* Day Streak */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#495057] mb-1">
              {dayStreak}
            </p>
            <p className="text-xs text-[#6C757D]">Day Streak</p>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#495057] mb-1">
              {badgesEarned}
            </p>
            <p className="text-xs text-[#6C757D]">Badges</p>
          </div>

          {/* Videos */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#495057] mb-1">
              {Math.floor(progressPercentage / 20) || 1}
            </p>
            <p className="text-xs text-[#6C757D]">Videos</p>
          </div>
        </div>
      </div>

      {/* Next Up Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <p className="text-green-700 font-medium text-sm">Next Up</p>
            <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
              12 min
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
          <p className="text-[#495057] font-medium">
            Advanced Dashboard Creation
          </p>
        </div>
      </div>

      {/* Continue Learning Button */}
      <button
        onClick={handlePrimaryClick}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
      >
        Continue Learning
      </button>
    </div>
  );
};

export default EnrolledCollapsedCard;
