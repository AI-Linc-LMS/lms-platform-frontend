import React from "react";
import {
  Medal,
  Star,
  Flame,
  Lock,
  Award,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, styled } from "@mui/material";

interface AchievementData {
  achieved: boolean;
  info: string;
}

interface BackendAchievements {
  [key: string]: AchievementData;
}

interface Achievement {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  earned: boolean;
  info: string;
}

// Custom styled MUI Tooltip with dark gamification theme
const GameTooltip = styled(({ className, ...props }: any) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontSize: "0.75rem",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    maxWidth: "240px",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
  },
  [`& .MuiTooltip-arrow`]: {
    color: "#1e293b",
    "&::before": {
      border: "1px solid rgba(59, 130, 246, 0.3)",
    },
  },
}));

export const AchievementSection: React.FC<{
  achievements: BackendAchievements;
}> = ({ achievements }) => {
  const { t } = useTranslation();

  // Map backend keys to UI details with translations
  const ACHIEVEMENT_MAPPER: Record<
    string,
    { label: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    first_step: { label: t("courses.achievements.firstSteps"), icon: Medal },
    quiz_master: { label: t("courses.achievements.quizMaster"), icon: Star },
    streak_keeper: {
      label: t("courses.achievements.streakKeeper"),
      icon: Flame,
    },
    expert: { label: t("courses.achievements.expert"), icon: Award },
    certified: { label: t("courses.achievements.certified"), icon: Lock },
  };

  // Transform backend object → UI array
  const mappedAchievements: Achievement[] = achievements
    ? Object?.entries(achievements)?.map(([key, value]) => {
        const mapper = ACHIEVEMENT_MAPPER[key];
        return {
          id: key,
          icon: mapper?.icon || Lock,
          label: mapper?.label || key,
          earned: value.achieved,
          info: value.info,
        };
      })
    : [];

  const earnedCount = mappedAchievements?.filter((a) => a.earned).length;
  const totalCount = mappedAchievements?.length;

  return (
    <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-semibold text-[#0369a1]">
          {t("courses.achievements.title")}
        </span>
        <span className="text-[11px] text-[#0284c7] font-semibold">
          {earnedCount}/{totalCount}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {mappedAchievements.map((achievement) => {
          const IconComponent = achievement.icon;

          return (
            <GameTooltip
              key={achievement.id}
              title={
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {achievement.earned ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-sm leading-tight">
                      {achievement.label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-300 pl-6">
                    {achievement.info ||
                      (achievement.earned
                        ? "🎉 Achievement unlocked!"
                        : "🔒 Complete the requirements to unlock")}
                  </p>
                </div>
              }
              arrow
              placement="top"
              enterDelay={200}
              leaveDelay={100}
              TransitionProps={{ timeout: 300 }}
            >
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-md justify-between text-center transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg ${
                  achievement.earned
                    ? "bg-[#dbeafe] border border-[#bfdbfe]"
                    : "bg-[#f3f4f6] border border-[#e5e7eb] opacity-60"
                }`}
              >
                <IconComponent
                  className={`w-6 h-6 ${
                    achievement.earned
                      ? "text-[#1d4ed8]"
                      : "text-[var(--font-tertiary)]"
                  }`}
                />
                <span
                  className={`text-[11px] font-medium uppercase tracking-[0.3px] leading-tight ${
                    achievement.earned
                      ? "text-[#1e40af]"
                      : "text-[var(--font-secondary)]"
                  }`}
                >
                  {achievement.label}
                </span>
              </div>
            </GameTooltip>
          );
        })}
      </div>
    </div>
  );
};
