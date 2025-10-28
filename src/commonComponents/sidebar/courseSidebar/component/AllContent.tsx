import { useEffect, useRef, useState, useMemo } from "react";
import articleIcon from "../../../../assets/course_sidebar_assets/article/articleIcon.png";
import videosIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import problemIcon from "../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import quizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

// Constants for localStorage - same as VideoPlayer
const STORAGE_PREFIX = "video_progress_";
const STORAGE_VERSION = "v1";

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
  marks: number;
  status?: string;
  progress_percentage?: number;
  obtainedMarks?: number;
  submissions?: number;
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
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center">
          <div className="text-[8px] font-semibold text-gray-700">
            {Math.round(progress)}
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
  const sortedContents = useMemo(
    () => [...contents].sort((a, b) => a.order - b.order),
    [contents]
  );

  // Debug: Log quiz items to check data
  useEffect(() => {
    const quizItems = sortedContents.filter(
      (item) => item.content_type === "Quiz"
    );
    if (quizItems.length > 0) {
    }
  }, [sortedContents]);

  const isFirstRender = useRef(true);
  const [videoProgress, setVideoProgress] = useState<Record<number, number>>(
    {}
  );

  // Helper function to extract title from localStorage key
  // Key format: video_progress_v1_1118086241?badge=0&autopause=0&player_id=0&app_id=58479_Introduction data science
  const extractTitleFromKey = (key: string): string | null => {
    const prefix = STORAGE_PREFIX + STORAGE_VERSION + "_";
    if (!key.startsWith(prefix)) return null;

    // Find the last underscore which separates the URL params from the title
    const lastUnderscoreIndex = key.lastIndexOf("_");
    if (lastUnderscoreIndex > prefix.length) {
      return key.substring(lastUnderscoreIndex + 1);
    }
    return null;
  };

  // Helper function to normalize strings for comparison
  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim().replace(/\s+/g, " ");
  };

  // Load video progress from localStorage
  useEffect(() => {
    const loadProgress = () => {
      const progressMap: Record<number, number> = {};

      // Build a map of normalized title -> { progress, key }
      const titleProgressMap: Record<
        string,
        { progress: number; key: string }
      > = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX + STORAGE_VERSION)) {
          const title = extractTitleFromKey(key);
          const progressValue = localStorage.getItem(key);

          if (title && progressValue) {
            const parsedProgress = parseFloat(progressValue);
            if (!isNaN(parsedProgress) && parsedProgress > 0) {
              const normalizedTitle = normalizeString(title);
              titleProgressMap[normalizedTitle] = {
                progress: parsedProgress,
                key: key,
              };
            }
          }
        }
      }

      // Match video items with progress by title
      sortedContents.forEach((item) => {
        if (item.content_type === "VideoTutorial") {
          const normalizedItemTitle = normalizeString(item.title);

          if (titleProgressMap[normalizedItemTitle]) {
            let { progress } = titleProgressMap[normalizedItemTitle];
            // Round up if very close to 100% (>= 98.5%)
            if (progress >= 98.5) {
              progress = 100;
            }
            progressMap[item.id] = progress;
          } else {
          }
        }
      });

      setVideoProgress(progressMap);
    };

    // Initial load
    loadProgress();

    // Listen for storage events (from other tabs)
    window.addEventListener("storage", loadProgress);

    // Set up polling interval to catch same-window updates (every 2 seconds)
    const interval = setInterval(loadProgress, 2000);

    return () => {
      window.removeEventListener("storage", loadProgress);
      clearInterval(interval);
    };
  }, [sortedContents]);

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
                  <span>{item.marks} Marks</span>
                  {item.content_type === "Quiz" &&
                    typeof item.obtainedMarks === "number" &&
                    item.obtainedMarks >= 0 &&
                    (item.submissions || 0) > 0 && (
                      <>
                        <span>|</span>
                        <span> Obtained Marks: {item.obtainedMarks}</span>
                      </>
                    )}
                  {item.content_type === "Quiz" &&
                    (item.submissions || 0) > 0 && (
                      <>
                        <span>|</span>
                        <span> Submissions: {item.submissions}</span>
                      </>
                    )}
                  <span>|</span>
                  <span>{item.content_type}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center w-5 h-5">
              {item.content_type === "VideoTutorial" ? (
                <>
                  {(() => {
                    const localProgress =
                      videoProgress[item.id] || item.progress_percentage || 0;
                    // Consider complete if status is complete OR progress >= 98.5%
                    const isComplete =
                      item.status === "complete" || localProgress >= 98.5;
                    const displayProgress = isComplete ? 100 : localProgress;

                    return (
                      <CircularProgress
                        progress={displayProgress}
                        isComplete={isComplete}
                      />
                    );
                  })()}
                </>
              ) : item.content_type === "Quiz" ? (
                // For Quiz items, show complete tick if they have submissions or status is complete
                <img
                  src={
                    item.status === "complete" ||
                    (item.submissions && item.submissions > 0)
                      ? completeTickIcon
                      : tickIcon
                  }
                  alt={
                    item.status === "complete" ||
                    (item.submissions && item.submissions > 0)
                      ? "Completed"
                      : "Pending"
                  }
                  className="w-full h-full"
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
