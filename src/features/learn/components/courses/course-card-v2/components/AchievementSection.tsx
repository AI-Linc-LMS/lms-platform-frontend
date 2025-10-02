import React from "react";
import { Medal, Star, Flame, Lock, Award } from "lucide-react";

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

// Map backend keys to UI details
const ACHIEVEMENT_MAPPER: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  first_step: { label: "First Steps", icon: Medal },
  quiz_master: { label: "Quiz Master", icon: Star },
  streak_keeper: { label: "Streak Keeper", icon: Flame },
  expert: { label: "Expert", icon: Award },
  certified: { label: "Certified", icon: Lock },
};

export const AchievementSection: React.FC<{
  achievements: BackendAchievements;
}> = ({ achievements }) => {
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
          Achievements
        </span>
        <span className="text-[11px] text-[#0284c7] font-semibold">
          {earnedCount}/{totalCount}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {mappedAchievements.map((achievement) => {
          const IconComponent = achievement.icon;

          return (
            <div
              key={achievement.id}
              title={achievement.info} // Tooltip for more detail
              className={`flex flex-col items-center gap-1 p-2 rounded-md justify-between text-center transition-all duration-200 ${
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
                className={`text-[11px] font-medium uppercase tracking-[0.3px] ${
                  achievement.earned
                    ? "text-[#1e40af]"
                    : "text-[var(--font-secondary)]"
                }`}
              >
                {achievement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
