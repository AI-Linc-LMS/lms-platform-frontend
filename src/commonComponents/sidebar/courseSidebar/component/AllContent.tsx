import { useEffect, useRef } from "react";
import articleIcon from "../../../../assets/course_sidebar_assets/article/articleIcon.png";
import videosIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import problemIcon from "../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import quizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

export type ContentType =
  | "Article"
  | "VideoTutorial"
  | "CodingProblem"
  | "Quiz"
  | "Assignment"
  | "Development";

export interface ContentItem {
  id: number;
  title: string;
  content_type: ContentType;
  order: number;
  duration_in_minutes: number;
  status?: string;
  progress_percentage?: number;
}

interface AllContentProps {
  contents: ContentItem[];
  onContentClick: (contentId: number, contentType: ContentType) => void;
  selectedContentId?: number;
  activeLabel: string;
}

// CircularProgress component for video content
const CircularProgress = ({
  progress,
  isComplete,
}: {
  progress: number;
  isComplete: boolean;
}) => {
  const size = 26;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (isComplete) {
    return (
      <div
        className="w-[18px] h-[18px] rounded-full bg-[var(--success-500)] flex items-center justify-center"
        style={{ aspectRatio: "1 / 1", minWidth: "18px", minHeight: "18px" }}
      >
        <svg
          viewBox="0 0 24 24"
          width="10"
          height="10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12l5 5L20 7"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e6e6e6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#deeede"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[18px] h-[18px] bg-white border border-gray-200 rounded-full flex items-center justify-center">
          <div className="text-[9px] font-medium text-gray-500">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
};

const AllContent = ({
  contents,
  onContentClick,
  selectedContentId,
  activeLabel,
}: AllContentProps) => {
  const sortedContents = [...contents].sort((a, b) => a.order - b.order);
  const isFirstRender = useRef(true);

  // Select first content only when All tab is first opened
  useEffect(() => {
    if (
      sortedContents.length > 0 &&
      activeLabel === "All" &&
      isFirstRender.current
    ) {
      // Only auto-select if no content is currently selected
      if (!selectedContentId) {
        const firstContent = sortedContents[0];
        onContentClick(firstContent.id, firstContent.content_type);
      }
      isFirstRender.current = false;
    }
  }, [sortedContents, activeLabel, onContentClick, selectedContentId]);

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
        A comprehensive detailed studies curated by our top mentors only for
        you.
      </p>

      <div className="flex flex-col gap-2">
        {sortedContents.map((item) => (
          <div
            key={item.id}
            onClick={() => onContentClick(item.id, item.content_type)}
            className={`border border-gray-300 rounded-lg p-2 flex justify-between items-center hover:shadow transition cursor-pointer ${
              selectedContentId === item.id
                ? "border-[var(--primary-500)] bg-blue-50"
                : ""
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

            <div className="flex items-center justify-center w-5 h-5">
              {item.content_type === "VideoTutorial" ? (
                <CircularProgress
                  progress={
                    item.status === "complete"
                      ? 100
                      : item.progress_percentage || 0
                  }
                  isComplete={item.status === "complete"}
                />
              ) : (
                <img
                  src={item.status === "complete" ? completeTickIcon : tickIcon}
                  alt={item.status === "complete" ? "Completed" : "Pending"}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllContent;
