import React, { useState } from "react";
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
  content: ContentItem[];
}

export interface CourseWeek {
  id: string;
  title: string;
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
    <><div>
      <h2 className="text-xl font-semibold text-[#257195] p-4">{week.title}</h2>
    </div><div className="mb-6 border border-gray-100 rounded-[22px] shadow-sm">
        {/* Week Header */}
        <div
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-xl font-semibold text-gray-800">

            {week.modules.length > 0 ? week.modules[0].id : ""}
          </h2>
          {isOpen && (
            week.modules.map((module) =>
              module.completed !== undefined && (
                <div key={module.id} className="mt-2 w-full max-w-xs">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-[#5FA564] h-2.5 rounded-full"
                      style={{ width: `${module.completed}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 mt-1">
                    {module.completed}% Completed
                  </span>
                </div>
              )
            )
          )}
          <button className="text-gray-600">
            {isOpen ? (
              <span className="text-xl"> <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 7L8 1L1 7" stroke="#343A40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              </span> // Up arrow
            ) : (
              <span className="text-xl"> <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 1L8 7L1 1" stroke="#343A40" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              </span> // Down arrow
            )}
          </button>
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="px-4 pb-4">
            {week.modules.map((module) => (
              <div key={module.id} className="mb-4 border-b border-[#DEE2E6] pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-gray-700">
                      {module.title}
                      {module.isLocked && (
                        <span className="inline-block ml-2 text-gray-400">🔒</span>
                      )}
                    </h3>


                  </div>

                  {!module.isLocked && (
                    <button className="px-4 py-2 bg-[#D7EFF6]  rounded-xl border border-[#80C9E0] text-[#264D64]">
                      Start Now
                    </button>
                  )}

                  {module.isLocked && (
                    <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md">
                      Locked
                    </div>
                  )}
                </div>

                {/* Content items */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {module.content.map((item, idx) => (
                    <div
                      key={`${module.id}-${item.type}-${idx}`}
                      className="flex border rounded-xl m-auto p-2 border-[#DEE2E6] items-center space-x-2 text-sm text-gray-600"
                    >
                      {renderContentTypeIcon(item.type)}
                      <span>{item.count} {item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div></>
  );
};

export default CollapsibleCourseModule; 