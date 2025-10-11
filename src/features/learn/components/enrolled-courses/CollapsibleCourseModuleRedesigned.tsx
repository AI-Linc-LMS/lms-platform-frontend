import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaBookOpen,
  FaCode,
  FaQuestionCircle,
  FaChevronDown,
  FaCheckCircle,
  FaLock,
  FaUnlock,
  FaGraduationCap,
} from "react-icons/fa";

// Types for the component
export interface ContentItem {
  type: "video" | "article" | "problem" | "quiz";
  title: string;
  count: number;
}

export interface CourseModule {
  id: string;
  title: string;
  isLocked?: boolean;
  completed?: number; // Percentage completed
  started?: boolean;
  content: ContentItem[];
  instructors?: Instructor[];
}

export interface Instructor {
  id: string;
  name: string;
  bio?: string;
  linkedin_profile?: string;
  profile_pic_url?: string;
}

export interface CourseWeek {
  id: string;
  weekNo: number;
  title: string;
  completed?: number; // Percentage completed
  modules: CourseModule[];
}

interface CollapsibleCourseModuleProps {
  week: CourseWeek;
  defaultOpen?: boolean;
}

const CollapsibleCourseModule: React.FC<CollapsibleCourseModuleProps> = ({
  week,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <FaPlay className="text-red-500" />;
      case "article":
        return <FaBookOpen className="text-blue-500" />;
      case "problem":
        return <FaCode className="text-green-500" />;
      case "quiz":
        return <FaQuestionCircle className="text-purple-500" />;
      default:
        return <FaBookOpen className="text-gray-500" />;
    }
  };

  const getContentColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-50 border-red-200 text-red-700";
      case "article":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "problem":
        return "bg-green-50 border-green-200 text-green-700";
      case "quiz":
        return "bg-purple-50 border-purple-200 text-purple-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const navigateToTopicDetail = (courseId: string, submoduleId: string) => {
    navigate(`/learn/course/${courseId}/${submoduleId}`);
  };

  const weekCompletion = week.completed || 0;
  const isWeekCompleted = weekCompletion >= 100;
  const isWeekStarted = weekCompletion > 0;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Week Header */}
      <div
        className={`p-4 sm:p-6 cursor-pointer select-none ${
          isWeekCompleted
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200"
            : isWeekStarted
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200"
            : "bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Week Number Badge */}
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0 ${
                isWeekCompleted
                  ? "bg-green-600 text-white"
                  : isWeekStarted
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {isWeekCompleted ? <FaCheckCircle /> : week.weekNo}
            </div>

            {/* Week Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  Week {week.weekNo}: {week.title}
                </h3>
                {isWeekCompleted && (
                  <FaGraduationCap className="text-green-600 text-base sm:text-lg flex-shrink-0" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                      isWeekCompleted
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`}
                    style={{ width: `${weekCompletion}%` }}
                  ></div>
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium flex-shrink-0 ${
                    isWeekCompleted ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {weekCompletion}%
                </span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div
            className={`transition-transform duration-300 ml-2 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <FaChevronDown className="text-gray-400 text-lg sm:text-xl" />
          </div>
        </div>
      </div>

      {/* Week Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {week.modules.map((module) => {
            const moduleCompletion = module.completed || 0;
            const isModuleCompleted = moduleCompletion >= 100;
            const isModuleStarted = moduleCompletion > 0;
            const isModuleLocked = module.isLocked || false;

            return (
              <div
                key={module.id}
                className="bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden"
              >
                {/* Module Header */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Module Status Icon */}
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isModuleLocked
                            ? "bg-gray-300 text-gray-500"
                            : isModuleCompleted
                            ? "bg-green-100 text-green-600"
                            : isModuleStarted
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isModuleLocked ? (
                          <FaLock className="text-xs sm:text-sm" />
                        ) : isModuleCompleted ? (
                          <FaCheckCircle className="text-xs sm:text-sm" />
                        ) : (
                          <FaUnlock className="text-xs sm:text-sm" />
                        )}
                      </div>

                      {/* Module Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">
                          {module.title}
                        </h4>

                        {/* Module Progress */}
                        <div className="flex items-center gap-2">
                          <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                isModuleCompleted
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${moduleCompletion}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {moduleCompletion}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-2">
                      {!isModuleLocked && !isModuleStarted && (
                        <button
                          onClick={() =>
                            navigateToTopicDetail(week.id, module.id)
                          }
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Start
                        </button>
                      )}

                      {!isModuleLocked &&
                        isModuleStarted &&
                        !isModuleCompleted && (
                          <button
                            onClick={() =>
                              navigateToTopicDetail(week.id, module.id)
                            }
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Continue
                          </button>
                        )}

                      {isModuleLocked && (
                        <div className="px-3 py-1.5 bg-gray-200 text-gray-500 text-xs font-medium rounded-lg flex items-center gap-1">
                          <FaLock className="text-xs" />
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Module Content Preview */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {module.content.map((content, contentIndex) => (
                      <div
                        key={contentIndex}
                        className={`${getContentColor(
                          content.type
                        )} border rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {getContentIcon(content.type)}
                        </div>
                        <div className="text-xs font-medium mb-1 truncate">
                          {content.title}
                        </div>
                        <div className="text-xs opacity-75">
                          {content.count}{" "}
                          {content.count === 1 ? "item" : "items"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Week Summary */}
          <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200 mt-4 sm:mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <FaGraduationCap className="text-blue-600 text-base sm:text-lg flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-semibold text-blue-900 text-sm sm:text-base">
                    Week {week.weekNo} Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-blue-700 truncate">
                    {week.modules.length} modules •{" "}
                    {week.modules.reduce(
                      (acc, module) =>
                        acc +
                        module.content.reduce(
                          (total, content) => total + content.count,
                          0
                        ),
                      0
                    )}{" "}
                    total items
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-lg font-bold text-blue-600">
                  {weekCompletion}%
                </div>
                <div className="text-xs text-blue-500">Complete</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleCourseModule;
