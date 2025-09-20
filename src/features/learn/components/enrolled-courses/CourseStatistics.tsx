import React from "react";
import { motion } from "framer-motion";
import RefreshIcon from "../../../../commonComponents/icons/enrolled-courses/RefreshIcon";
import UserGroupIcon from "../../../../commonComponents/icons/enrolled-courses/UserGroupIcon";
import CertificationIcon from "../../../../commonComponents/icons/enrolled-courses/CertificationIcon";
import { Course } from "../../types/course.types";
import {
  FaClock,
  FaUsers,
  FaAward,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";

interface CourseStatisticsProps {
  course: Course;
}

const CourseStatistics: React.FC<CourseStatisticsProps> = ({ course }) => {
  const stats = [
    {
      icon: FaCalendarAlt,
      label: "Last Updated",
      value: course.updated_at
        ? new Date(course.updated_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A",
      color: "text-blue-600",
      background: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      icon: FaUsers,
      label: "Students Enrolled",
      value: course.enrolled_students?.toLocaleString() || "0",
      color: "text-green-600",
      background: "bg-green-50",
      border: "border-green-200",
    },
    {
      icon: FaAward,
      label: "Certification",
      value: course.is_certified ? "Available" : "Not Available",
      color: course.is_certified ? "text-yellow-600" : "text-gray-600",
      background: course.is_certified ? "bg-yellow-50" : "bg-gray-50",
      border: course.is_certified ? "border-yellow-200" : "border-gray-200",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-7">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
        <FaCheckCircle className="w-5 h-5 text-green-500" />
        Course Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.background} ${stat.border} border-2 rounded-xl lg:rounded-2xl p-4 sm:p-5 text-center hover:shadow-md transition-all`}
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 ${stat.background} rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm`}
            >
              <stat.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${stat.color}`} />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              {stat.value}
            </div>
            <div className={`text-sm font-medium ${stat.color}`}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Course Insights */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-base sm:text-lg font-bold text-gray-900">
            {course?.modules?.length || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Modules
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-base sm:text-lg font-bold text-gray-900">
            {course?.modules?.reduce(
              (acc, module) => acc + (module.submodules?.length || 0),
              0
            ) || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Lessons
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-base sm:text-lg font-bold text-gray-900">
            4.8
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Rating
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-base sm:text-lg font-bold text-gray-900">∞</div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStatistics;
