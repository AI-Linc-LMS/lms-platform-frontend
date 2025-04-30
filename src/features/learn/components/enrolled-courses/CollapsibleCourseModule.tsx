import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  VideoIcon,
  DocumentIcon,
  CodeIcon,
  FAQIcon,
} from "../../../../commonComponents/icons/learnIcons/CourseIcons";
import { Module, Submodule } from "../../types/course.types";

interface CollapsibleCourseModuleProps {
  week: Module;
  defaultOpen?: boolean;
}

const CollapsibleCourseModule: React.FC<CollapsibleCourseModuleProps> = ({
  week,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  // Helper function to navigate to submodule detail page
  const navigateToSubmoduleDetail = (submoduleId: number) => {
    navigate(`/learn/course/${week.id}/${submoduleId}`);
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
    <div className="mb-6 border border-gray-100 rounded-[22px] shadow-sm">
      {/* Week Header */}
      <div
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold text-gray-800">{week.title}</h2>
        <button className="text-gray-600 cursor-pointer">
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
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span> // Up arrow
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
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span> // Down arrow
          )}
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-4 pb-4">
          {week.submodules.map((submodule: Submodule) => (
            <div
              key={submodule.id}
              className="mb-4 border-b border-[#DEE2E6] pb-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium text-gray-700">
                    {submodule.title}
                  </h3>
                  {/* <p className="text-sm text-gray-500">{submodule.description}</p> */}
                </div>

                <button
                  className="px-4 py-2 bg-[#255C79] text-white rounded-xl cursor-pointer"
                  onClick={() => navigateToSubmoduleDetail(submodule.id)}
                >
                  Start Now
                </button>
              </div>

              {/* Content items */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div
                  className="flex border rounded-xl m-auto p-2 border-[#DEE2E6] items-center space-x-2 text-sm text-gray-600"
                >
                  {renderContentTypeIcon("video")}
                  <span>Video</span>
                </div>
                <div
                  className="flex border rounded-xl m-auto p-2 border-[#DEE2E6] items-center space-x-2 text-sm text-gray-600"
                >
                  {renderContentTypeIcon("quiz")}
                  <span>Quiz</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollapsibleCourseModule;