import React from "react";
import { useTranslation } from "react-i18next";
import { Flame, Trophy, Play } from "lucide-react";
import { Course } from "../../../../types/final-course.types";
import { calculateProgress } from "../utils/courseDataUtils";
import { calculateCourseProgress } from "../../../../utils/progressUtils";

interface QuickOverviewSectionProps {
  course: Course;
}

export const QuickOverviewSection: React.FC<QuickOverviewSectionProps> = ({
  course,
}) => {
  const { t } = useTranslation();
  const progressPercentage = calculateCourseProgress(course);
  const videosWatched = course.stats?.video?.completed ?? 0;
  const totalVideos = course.stats?.video?.total ?? 0;
  const dayStreak = course.streak_count ?? 0;
  const badges = course.badges ?? 0;

  return (
    <div className="mb-3 sm:mb-4 p-4 sm:p-5 bg-white rounded-xl border border-[#e5e7eb] shadow-sm">
      {/* 2 rows until 1024px (lg), then 1 row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
        {/* Left: Progress Circle + Text */}
        <div className="flex items-center gap-3">
          {/* Progress Circle */}
          <div className="relative w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-full bg-[#e5e7eb] flex-shrink-0">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#10b981 ${
                  (progressPercentage || 0) * 3.6
                }deg, #e5e7eb 0deg)`,
              }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] lg:w-[46px] lg:h-[46px] bg-white rounded-full" />
            <span className="absolute inset-0 flex items-center justify-center text-sm lg:text-base font-bold text-[#1f2937] z-10">
              {progressPercentage ? calculateProgress(course) : 0}%
            </span>
          </div>

          {/* Progress Label */}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm lg:text-[15px] font-semibold text-[#1f2937] leading-tight">
              {t("courses.progress.courseProgress")}
            </span>
            <span className="text-xs lg:text-[13px] text-[#6b7280] leading-tight">
              {videosWatched}/{totalVideos} {t("courses.progress.videos")}
            </span>
          </div>
        </div>

        {/* Right: Stats Grid */}
        <div className="flex gap-5 sm:gap-6 lg:gap-4 justify-center lg:justify-end flex-shrink-0">
          {/* Day Streak */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#f3f4f6] rounded-lg">
              <Flame className="w-5 h-5 lg:w-6 lg:h-6 text-[#f59e0b]" />
            </div>
            <span className="text-base lg:text-lg font-bold text-[#1f2937] leading-none">
              {dayStreak}
            </span>
            <span className="text-[10px] lg:text-[11px] text-[#6b7280] font-medium leading-none text-center whitespace-nowrap">
              {t("courses.progress.dayStreak")}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#f3f4f6] rounded-lg">
              <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-[#f59e0b]" />
            </div>
            <span className="text-base lg:text-lg font-bold text-[#1f2937] leading-none">
              {badges}
            </span>
            <span className="text-[10px] lg:text-[11px] text-[#6b7280] font-medium leading-none text-center whitespace-nowrap">
              {t("courses.progress.badges")}
            </span>
          </div>

          {/* Videos */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-[#f3f4f6] rounded-lg">
              <Play className="w-5 h-5 lg:w-6 lg:h-6 text-[#10b981]" />
            </div>
            <span className="text-base lg:text-lg font-bold text-[#1f2937] leading-none">
              {videosWatched}
            </span>
            <span className="text-[10px] lg:text-[11px] text-[#6b7280] font-medium leading-none text-center whitespace-nowrap">
              {t("courses.progress.videos")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
