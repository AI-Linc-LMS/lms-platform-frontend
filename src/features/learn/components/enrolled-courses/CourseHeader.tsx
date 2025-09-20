import React from "react";
import { motion } from "framer-motion";
import { Course } from "../../types/course.types";
import {
  FaGraduationCap,
  FaClock,
  FaUsers,
  FaStar,
  FaAward,
  FaCheckCircle,
  FaBookOpen,
} from "react-icons/fa";

interface CourseHeaderProps {
  course: Course;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ course }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg border border-blue-100"
    >
      {/* Course Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
        {/* Course Icon & Status */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-xl mb-4">
            <FaGraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>

          {/* Status Badges */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
            <div className="flex items-center justify-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-xl font-medium text-sm">
              <FaCheckCircle className="w-4 h-4" />
              <span>Enrolled</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-xl font-medium text-sm">
              <FaBookOpen className="w-4 h-4" />
              <span>Active</span>
            </div>
          </div>
        </div>

        {/* Course Information */}
        <div className="flex-1 min-w-0">
          {/* Course Title */}
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight"
          >
            {course.title || course.course_title}
          </motion.h1>

          {/* Course Description */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6"
          >
            {course.description || course.course_description}
          </motion.p>

          {/* Course Meta Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          >
            {/* Students Count */}
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
              <FaUsers className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-sm font-bold text-gray-900">194</div>
                <div className="text-xs text-gray-500">Students</div>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
              <FaStar className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="text-sm font-bold text-gray-900">4.8</div>
                <div className="text-xs text-gray-500">Rating</div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
              <FaClock className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-sm font-bold text-gray-900">12h</div>
                <div className="text-xs text-gray-500">Duration</div>
              </div>
            </div>

            {/* Certificate */}
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
              <FaAward className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-sm font-bold text-gray-900">Yes</div>
                <div className="text-xs text-gray-500">Certificate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 pt-6 border-t border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Your Progress
            </h3>
            <p className="text-sm text-gray-600">
              Keep up the great work! You're doing amazing.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right sm:text-left">
              <div className="text-2xl font-bold text-blue-600">0%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "0%" }}
                transition={{ delay: 0.7, duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CourseHeader;
