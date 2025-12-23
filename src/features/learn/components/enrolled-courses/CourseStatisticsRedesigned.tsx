import React from "react";
import { Course } from "../../types/course.types";
import {
  FaClock,
  FaUsers,
  FaCertificate,
  FaCalendarAlt,
  FaChartLine,
  FaAward,
  FaGlobe,
} from "react-icons/fa";

interface CourseStatisticsProps {
  course: Course;
}

const CourseStatistics: React.FC<CourseStatisticsProps> = ({ course }) => {
  const stats = [
    {
      icon: <FaCalendarAlt className="text-2xl text-blue-600" />,
      label: "Last Updated",
      value: course.updated_at
        ? new Date(course.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Recently",
      description: "Course content freshness",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: <FaUsers className="text-2xl text-green-600" />,
      label: "Students Enrolled",
      value: (course.enrolled_students || 0).toLocaleString(),
      description: "Active learners",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      icon: <FaCertificate className="text-2xl text-purple-600" />,
      label: "Certification",
      value: course.is_certified ? "Available" : "Not Available",
      description: course.is_certified
        ? "Earn your certificate"
        : "Knowledge building",
      bgColor: course.is_certified ? "bg-purple-50" : "bg-gray-50",
      borderColor: course.is_certified
        ? "border-purple-200"
        : "border-gray-200",
    },
    {
      icon: <FaChartLine className="text-2xl text-orange-600" />,
      label: "Difficulty",
      value: "Intermediate",
      description: "Skill level required",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FaAward className="text-yellow-500" />
          Course Statistics
        </h3>
        <p className="text-sm sm:text-base text-gray-600">
          Key metrics and information about this course
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-white ${stat.borderColor} border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group cursor-pointer`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 p-3 bg-white rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                {stat.icon}
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-[var(--font-secondary)] uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--font-primary)]">
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--font-tertiary)]">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Course Metrics */}
      <div className="mt-6 sm:mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm mb-2 sm:mb-3">
              <FaGlobe className="text-2xl sm:text-3xl text-blue-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
              Global Access
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Available worldwide with subtitles
            </p>
          </div>

          <div className="text-center">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm mb-2 sm:mb-3">
              <FaClock className="text-2xl sm:text-3xl text-green-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
              Flexible Learning
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Learn at your own pace
            </p>
          </div>

          <div className="text-center">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm mb-2 sm:mb-3">
              <FaAward className="text-2xl sm:text-3xl text-yellow-500 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
              Expert Content
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Created by industry professionals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStatistics;
