import React, { useEffect, useRef } from "react";
import articleIcon from "../../../../assets/course_sidebar_assets/article/articleIcon.png";
import videosIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import problemIcon from "../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import quizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

export type ContentType = "Article" | "VideoTutorial" | "CodingProblem" | "Quiz" | "Assignment" | "Development";

export interface ContentItem {
  id: number;
  title: string;
  content_type: ContentType;
  order: number;
  duration_in_minutes: number;
  status?: string;
}

interface AllContentProps {
  contents: ContentItem[];
  onContentClick: (contentId: number, contentType: ContentType) => void;
  selectedContentId?: number;
  activeLabel: string;
}

const AllContent = ({ contents, onContentClick, selectedContentId, activeLabel }: AllContentProps) => {
  const sortedContents = [...contents].sort((a, b) => a.order - b.order);
  const isFirstRender = useRef(true);

  // Select first content only when All tab is first opened
  useEffect(() => {
    if (sortedContents.length > 0 && activeLabel === "All" && isFirstRender.current) {
      const firstContent = sortedContents[0];
      onContentClick(firstContent.id, firstContent.content_type);
      isFirstRender.current = false;
    }
  }, [sortedContents, activeLabel, onContentClick]);

  const getIconByType = (type: ContentType) => {
    switch (type) {
      case "Article":
        return articleIcon;
      case "VideoTutorial":
        return videosIcon;
      case "CodingProblem":
        return problemIcon;
      case "Quiz":
        return quizIcon;
      case "Assignment":
        return articleIcon; 
      default:
        return articleIcon;
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        All ({contents.length})
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        A comprehensive detailed studies curated by our top mentors only for you.
      </p>

      <div className="flex flex-col gap-2">
        {sortedContents.map((item) => (
          <div
            key={item.id}
            onClick={() => onContentClick(item.id, item.content_type)}
            className={`border border-gray-300 rounded-lg p-2 flex justify-between items-center hover:shadow transition cursor-pointer ${
              selectedContentId === item.id ? 'border-[#255C79] bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <img
                src={getIconByType(item.content_type)}
                alt={item.content_type}
                className="w-6 h-6 mt-1"
              />
              <div>
                <h3 className="text-sm font-medium text-gray-800 mb-1">
                  {item.title}
                </h3>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2 items-center">
                  <span>⏱ {item.duration_in_minutes} min</span>
                  <span>|</span>
                  <span>{item.content_type}</span>
                </div>
              </div>
            </div>

            <div className="w-5 h-5">
              <img
                src={item.status === "complete" ? completeTickIcon : tickIcon}
                alt={item.status === "complete" ? "Completed" : "Pending"}
                className="w-full h-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllContent;
