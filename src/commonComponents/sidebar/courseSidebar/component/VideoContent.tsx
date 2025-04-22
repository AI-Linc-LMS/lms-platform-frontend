import React from "react";
import videoIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

interface VideoItem {
  id: string;
  title: string;
  marks: number;
  duration: string;
  completed: boolean;
}

interface VideoContentProps {
  videos: VideoItem[];
  selectedVideoId?: string;
  onVideoClick: (id: string) => void;
  totalDuration?: string;
  topicTitle?: string;
  topicNo: number;
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
  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex gap-2 mb-3 items-center">
        <span className="bg-gray-200 text-xs px-3 py-2 rounded-full font-medium">{week}</span>
        <span className="bg-gray-100 text-sm px-5 py-2 rounded-full font-medium">
          {topicTitle}
        </span>
      </div>

      <h2 className="text-[17px] font-bold text-gray-800 mb-3">Topic {topicNo}</h2>
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
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Video Items */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {videos.map((video, idx) => {
          const isSelected = selectedVideoId === video.id;
          const isLast = idx === videos.length - 1;

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
                      isSelected ? "text-[#007B9F]" : "text-gray-800"
                    }`}
                  >
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {video.marks} Marks | {video.duration}
                  </p>
                </div>
              </div>

              <img
                src={video.completed ? completeTickIcon : tickIcon}
                alt="Status"
                className="w-5 h-5"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoContent;
