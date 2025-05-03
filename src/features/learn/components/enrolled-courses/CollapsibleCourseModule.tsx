import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  VideoIcon,
  DocumentIcon,
  CodeIcon,
  FAQIcon,
} from "../../../../commonComponents/icons/learnIcons/CourseIcons";

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

  // Helper function to navigate to topic detail page
  const navigateToTopicDetail = (courseId: string, submoduleId: string) => {
    navigate(`/learn/course/${courseId}/${submoduleId}`);
  };

  // Helper function to render the right icon for content type
  const renderContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <VideoIcon />;
      case "article":
        return <DocumentIcon />;
      case "problem":
        return <CodeIcon />;
      case "quiz":
        return <FAQIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-[#257195] p-4">Week {week.weekNo}</h2>

      </div>
      <div className="mb-4 md:mb-6 border border-gray-100 rounded-[22px] shadow-sm">
        {/* Week Header */}
        <div
          className="p-3 md:p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-col md:flex-row md:justify-between w-full md:items-center gap-2">
            <h2 className="text-base md:text-xl font-semibold text-gray-800">
              {week.title}
            </h2>
            {week.completed !== undefined && (
              <div className="mt-1 md:mt-2 w-full max-w-xs">
                <div className="bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-[#5FA564] h-2.5 rounded-full"
                    style={{ width: `${week.completed}%` }}
                  ></div>
                </div>
                <span className="text-xs md:text-sm text-gray-500 mt-1">
                  {week.completed}% Completed
                </span>
              </div>
            )}
          </div>
          <button className="text-gray-600 cursor-pointer ml-2 md:ml-4 flex-shrink-0">
            {isOpen ? (
              <span className="text-xl">
                <svg
                  width="16"
                  height="8"
                  viewBox="0 0 16 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 7L8 1L1 7"
                    stroke="#343A40"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span className="text-xl">
                <svg
                  width="16"
                  height="8"
                  viewBox="0 0 16 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 1L8 7L1 1"
                    stroke="#343A40"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Content */}
        <div 
          className={`transition-all duration-500 ease-in-out transform origin-top overflow-hidden ${
            isOpen ? 'max-h-[2000px] opacity-100 scale-100' : 'max-h-0 opacity-0 scale-98'
          }`}
        >
          <div className="px-3 md:px-4 pb-3 md:pb-4">
            {week.modules.map((module) => (
              <div
                key={module.id}
                className="mb-3 md:mb-4 border-b border-[#DEE2E6] pb-3"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                  <div className="flex flex-col">
                    <h3 className="text-base md:text-lg font-medium text-gray-700">
                      {module.title}
                      {module.isLocked && (
                        <span className="inline-block ml-2 text-gray-400">
                          🔒
                        </span>
                      )}
                    </h3>
                  </div>

                  {!module.isLocked && !module.started && (
                    <button
                      className="px-4 py-2 bg-[#D7EFF6] rounded-xl border border-[#80C9E0] text-[#264D64] cursor-pointer"
                      onClick={() => navigateToTopicDetail(week.id, module.id)}

                    >
                      Start Now
                    </button>
                  )}

                  {!module.isLocked && module.started && (
                    <button
                      className="px-4 py-2 bg-[#255C79] text-white rounded-xl cursor-pointer"
                      onClick={() => navigateToTopicDetail(week.id, module.id)}
                    >
                      Continue learning
                    </button>
                  )}

                  {module.isLocked && (
                    <div className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 text-gray-500 rounded-xl flex flex-row gap-2 items-center justify-center sm:justify-start cursor-pointer w-full sm:w-auto text-sm md:text-base">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <mask
                          id="mask0_644_1539"
                          style={{ maskType: "alpha" }}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="18"
                          height="18"
                        >
                          <rect width="18" height="18" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#mask0_644_1539)">
                          <path
                            d="M4.5 16.5C4.0875 16.5 3.73438 16.3531 3.44063 16.0594C3.14688 15.7656 3 15.4125 3 15V7.5C3 7.0875 3.14688 6.73438 3.44063 6.44063C3.73438 6.14687 4.0875 6 4.5 6H5.25V4.5C5.25 3.4625 5.61563 2.57812 6.34688 1.84687C7.07812 1.11562 7.9625 0.75 9 0.75C10.0375 0.75 10.9219 1.11562 11.6531 1.84687C12.3844 2.57812 12.75 3.4625 12.75 4.5V6H13.5C13.9125 6 14.2656 6.14687 14.5594 6.44063C14.8531 6.73438 15 7.0875 15 7.5V15C15 15.4125 14.8531 15.7656 14.5594 16.0594C14.2656 16.3531 13.9125 16.5 13.5 16.5H4.5ZM9 12.75C9.4125 12.75 9.76563 12.6031 10.0594 12.3094C10.3531 12.0156 10.5 11.6625 10.5 11.25C10.5 10.8375 10.3531 10.4844 10.0594 10.1906C9.76563 9.89688 9.4125 9.75 9 9.75C8.5875 9.75 8.23438 9.89688 7.94063 10.1906C7.64687 10.4844 7.5 10.8375 7.5 11.25C7.5 11.6625 7.64687 12.0156 7.94063 12.3094C8.23438 12.6031 8.5875 12.75 9 12.75ZM6.75 6H11.25V4.5C11.25 3.875 11.0312 3.34375 10.5938 2.90625C10.1562 2.46875 9.625 2.25 9 2.25C8.375 2.25 7.84375 2.46875 7.40625 2.90625C6.96875 3.34375 6.75 3.875 6.75 4.5V6Z"
                            fill="#6C757D"
                          />
                        </g>
                      </svg>
                      Locked
                    </div>
                  )}
                </div>

                {/* Content items */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {module.content
                    .filter(item => item.count > 0)
                    .map((item, idx) => (
                      <div
                        key={`${module.id}-${item.type}-${idx}`}
                        className="flex border rounded-xl m-auto p-2 border-[#DEE2E6] items-center space-x-2 text-xs md:text-sm text-gray-600 w-full"
                      >
                        {renderContentTypeIcon(item.type)}
                        <span>
                          {item.count} {item.title}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CollapsibleCourseModule;

function navigateToTopicDetail(id: any, id1: any): void {
  throw new Error("Function not implemented.");
}
