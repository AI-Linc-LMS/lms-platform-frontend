import React from "react";
import { Flame, Trophy, Play } from "lucide-react";
import { Course } from "../../../../types/final-course.types";
import { calculateProgress } from "../utils/courseDataUtils";

interface QuickOverviewSectionProps {
  course: Course;
}

export const QuickOverviewSection: React.FC<QuickOverviewSectionProps> = ({
  course,
}) => {
  const computedProgress = calculateProgress(course);
  // Keep UI-friendly defaults when data is not provided by backend
  const progressPercentage =
    course.progress_percentage ?? (computedProgress || 15);
  const videosWatched = course.stats?.video?.completed ?? 12;
  const totalVideos = course.stats?.video?.total ?? 247;
  const dayStreak = course.streak ?? 7;
  const badges = course.badges ?? course.achievements?.length ?? 3;

  return (
    <div className="flex items-center gap-5 mb-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
      {/* Progress Summary */}
      <div className="flex items-center gap-3">
        <div className="relative w-[50px] h-[50px] rounded-full bg-[#e2e8f0] flex items-center justify-center">
          <div
            className="absolute top-0 left-0 w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(#10b981 0deg, #10b981 ${
                progressPercentage * 3.6
              }deg, #e2e8f0 ${progressPercentage * 3.6}deg)`,
            }}
          >
            <div className="absolute w-[35px] h-[35px] bg-white rounded-full"></div>
          </div>
          <span className="relative z-10 text-xs font-bold text-[#374151]">
            {progressPercentage}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-[#374151]">
            Course Progress
          </span>
          <span className="text-[11px] text-[#6b7280]">
            {videosWatched}/{totalVideos} videos
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 flex-1 justify-center">
        <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[60px]">
          <Flame className="w-4 h-4 text-[#10b981]" />
          <span className="text-base font-bold text-[#374151] leading-none">
            {dayStreak}
          </span>
          <span className="text-[10px] text-[#6b7280] font-medium text-center">
            Day Streak
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[60px]">
          <Trophy className="w-4 h-4 text-[#10b981]" />
          <span className="text-base font-bold text-[#374151] leading-none">
            {badges}
          </span>
          <span className="text-[10px] text-[#6b7280] font-medium text-center">
            Badges
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-md border border-[#e2e8f0] min-w-[60px]">
          <Play className="w-4 h-4 text-[#10b981]" />
          <span className="text-base font-bold text-[#374151] leading-none">
            {videosWatched}
          </span>
          <span className="text-[10px] text-[#6b7280] font-medium text-center">
            Videos
          </span>
        </div>
      </div>
    </div>
  );
};
