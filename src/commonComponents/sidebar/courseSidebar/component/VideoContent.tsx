import { useEffect, useState } from "react";
import videoIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

// Same constants and progress circle used in AllContent
const STORAGE_PREFIX = "video_progress_";
const STORAGE_VERSION = "v1";

// Reuse CircularProgress
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
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
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

interface VideoItem {
  id: number;
  title: string;
  duration: string;
  marks: number;
  completed?: boolean;
  progress?: number;
}

interface VideoContentProps {
  videos: VideoItem[];
  selectedVideoId?: number;
  onVideoClick: (id: number) => void;
  totalDuration?: string;
  topicTitle?: string;
  topicNo?: number;
  week?: string;
  difficulty?: string;
  completionPercentage?: number;
}

const VideoContent: React.FC<VideoContentProps> = ({
  videos,
  selectedVideoId,
  onVideoClick,
  totalDuration = "0",
  topicTitle = "Topic 1",
  topicNo = 1,
  week = "Week 1",
  difficulty = "Beginner",
  completionPercentage = 0,
}) => {
  const [videoProgress, setVideoProgress] = useState<Record<number, number>>(
    {}
  );

  // Extract title from localStorage key
  const extractTitleFromKey = (key: string): string | null => {
    const prefix = STORAGE_PREFIX + STORAGE_VERSION + "_";
    if (!key.startsWith(prefix)) return null;
    const lastUnderscoreIndex = key.lastIndexOf("_");
    if (lastUnderscoreIndex > prefix.length) {
      return key.substring(lastUnderscoreIndex + 1);
    }
    return null;
  };

  const normalizeString = (str: string): string =>
    str.toLowerCase().trim().replace(/\s+/g, " ");

  // Load video progress from localStorage
  useEffect(() => {
    const loadProgress = () => {
      const progressMap: Record<number, number> = {};
      const titleProgressMap: Record<string, { progress: number }> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX + STORAGE_VERSION)) {
          const title = extractTitleFromKey(key);
          const progressValue = localStorage.getItem(key);
          if (title && progressValue) {
            const parsed = parseFloat(progressValue);
            if (!isNaN(parsed) && parsed > 0) {
              titleProgressMap[normalizeString(title)] = { progress: parsed };
            }
          }
        }
      }

      videos.forEach((video) => {
        const normalized = normalizeString(video.title);
        if (titleProgressMap[normalized]) {
          progressMap[video.id] = titleProgressMap[normalized].progress;
        }
      });

      setVideoProgress(progressMap);
    };

    loadProgress();
    window.addEventListener("storage", loadProgress);
    const interval = setInterval(loadProgress, 2000);

    return () => {
      window.removeEventListener("storage", loadProgress);
      clearInterval(interval);
    };
  }, [videos]);

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex gap-2 mb-3 items-center">
        <span className="bg-gray-200 text-xs px-3 py-2 rounded-full font-medium">
          {week}
        </span>
        <span className="bg-gray-100 text-sm px-5 py-2 rounded-full font-medium">
          {topicTitle}
        </span>
      </div>

      <h2 className="text-[17px] font-bold text-gray-800 mb-3">
        Topic {topicNo}
      </h2>
      <span className="text-xs border border-gray-300 px-2 py-1 rounded-lg bg-gray-50 text-gray-600 mb-4 inline-block">
        {difficulty}
      </span>

      {/* Progress Bar */}
      <div className="flex justify-between items-center text-xs text-gray-600 mb-4">
        <span>{completionPercentage}% Completed</span>
        <span>{totalDuration}</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full mb-5">
        <div
          className="h-full bg-[var(--success-500)] rounded-full transition-all"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Video Items */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {videos.map((video, idx) => {
          const isSelected = selectedVideoId === video.id;
          const isLast = idx === videos.length - 1;
          const progress = video.completed
            ? 100
            : videoProgress[video.id] || video.progress || 0;

          return (
            <div
              key={video.id}
              onClick={() => onVideoClick(video.id)}
              className={`cursor-pointer px-4 py-3 flex justify-between items-center transition ${
                isSelected ? "bg-blue-50" : "hover:bg-gray-50"
              } ${!isLast ? "border-b border-gray-200" : ""}`}
            >
              <div className="flex gap-3 items-start">
                <img src={videoIcon} alt="video" className="w-5 h-5 mt-1" />
                <div>
                  <h3
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-[var(--secondary-400)]"
                        : "text-gray-800"
                    }`}
                  >
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500">{video.marks} Marks </p>
                </div>
              </div>

              <div className="flex items-center">
                {progress >= 100 || video.completed ? (
                  <img src={completeTickIcon} alt="check" className="w-5 h-5" />
                ) : (
                  <CircularProgress progress={progress} isComplete={false} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoContent;
