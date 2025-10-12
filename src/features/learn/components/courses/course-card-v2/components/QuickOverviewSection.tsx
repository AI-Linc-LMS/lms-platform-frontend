import React from "react";
import { useTranslation } from "react-i18next";
import { Flame, Trophy, Play } from "lucide-react";
import { Course } from "../../../../types/final-course.types";
import { calculateProgress } from "../utils/courseDataUtils";

interface QuickOverviewSectionProps {
  course: Course;
}

export const QuickOverviewSection: React.FC<QuickOverviewSectionProps> = ({
  course,
}) => {
  const { t } = useTranslation();
  const progressPercentage = course.progress_percentage ?? 0;
  const videosWatched = course.stats?.video?.completed ?? 0;
  const totalVideos = course.stats?.video?.total ?? 0;
  const dayStreak = course.streak_count ?? 0;
  const badges = course.badges ?? 0;

  return (
    <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex-shrink-0">
      {/* Progress Summary - Mobile Optimized */}
      <div className="">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative w-[40px] h-[40px] sm:w-[45px] sm:h-[45px] md:w-[50px] md:h-[50px] rounded-full bg-[#e2e8f0] flex items-center justify-center flex-shrink-0">
            <div
              className="absolute top-0 left-0 w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#10b981 0deg, #10b981 ${
                  progressPercentage && progressPercentage * 3.6
                }deg, #e2e8f0 ${
                  progressPercentage && progressPercentage * 3.6
                }deg)`,
              }}
            >
              <div className="absolute w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] md:w-[35px] md:h-[35px] bg-white rounded-full"></div>
            </div>
            <span className="relative z-10 text-[10px] sm:text-xs font-bold text-[#374151]">
              {progressPercentage ? calculateProgress(course) : 0}%
            </span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-[#374151]">
              {t("courses.progress.courseProgress")}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[var(--font-secondary)] truncate">
              {videosWatched}/{totalVideos} {t("courses.progress.videos")}
            </span>
          </div>
        </div>

        {/* Quick Stats - Mobile Optimized */}
        <div className="flex gap-2 sm:gap-3 md:gap-4 flex-1 justify-center sm:justify-center">
          {/* Day Streak */}
          <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2 bg-white rounded-lg border border-[#e2e8f0] min-w-[50px] sm:min-w-[58px] md:min-w-[60px] shadow-sm">
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mb-0.5">
              <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-[#f59e0b]" />
            </div>
            <span className="text-sm sm:text-base font-bold text-[#374151] leading-none">
              {dayStreak}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[var(--font-secondary)] font-medium text-center leading-tight">
              {t("courses.progress.dayStreak")}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2 bg-white rounded-lg border border-[#e2e8f0] min-w-[50px] sm:min-w-[58px] md:min-w-[60px] shadow-sm">
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mb-0.5">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-[#f59e0b]" />
            </div>
            <span className="text-sm sm:text-base font-bold text-[#374151] leading-none">
              {badges}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[var(--font-secondary)] font-medium text-center leading-tight">
              {t("courses.progress.badges")}
            </span>
          </div>

          {/* Videos */}
          <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2 bg-white rounded-lg border border-[#e2e8f0] min-w-[50px] sm:min-w-[58px] md:min-w-[60px] shadow-sm">
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mb-0.5">
              <Play className="w-3 h-3 sm:w-4 sm:h-4 text-[#10b981]" />
            </div>
            <span className="text-sm sm:text-base font-bold text-[#374151] leading-none">
              {videosWatched}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[var(--font-secondary)] font-medium text-center leading-tight">
              {t("courses.progress.videos")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
