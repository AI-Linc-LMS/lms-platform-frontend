import React from "react";
import { Medal, Star, Flame, Lock, Award } from "lucide-react";

interface Achievement {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  earned: boolean;
}

const ACHIEVEMENT_ICONS = {
  FIRST_STEPS: Medal,
  QUIZ_MASTER: Star,
  STREAK_KEEPER: Flame,
  EXPERT: Award,
  CERTIFIED: Lock,
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "FIRST_STEPS",
    icon: ACHIEVEMENT_ICONS.FIRST_STEPS,
    label: "First Steps",
    earned: true,
  },
  {
    id: "QUIZ_MASTER",
    icon: ACHIEVEMENT_ICONS.QUIZ_MASTER,
    label: "Quiz Master",
    earned: true,
  },
  {
    id: "STREAK_KEEPER",
    icon: ACHIEVEMENT_ICONS.STREAK_KEEPER,
    label: "Streak Keeper",
    earned: true,
  },
  {
    id: "EXPERT",
    icon: ACHIEVEMENT_ICONS.EXPERT,
    label: "Expert",
    earned: false,
  },
  {
    id: "CERTIFIED",
    icon: ACHIEVEMENT_ICONS.CERTIFIED,
    label: "Certified",
    earned: false,
  },
];

export const AchievementSection: React.FC = () => {
  const earnedCount = ACHIEVEMENTS.filter(
    (achievement) => achievement.earned
  ).length;
  const totalCount = ACHIEVEMENTS.length;

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
        {ACHIEVEMENTS.map((achievement) => {
          const IconComponent = achievement.icon;

          return (
            <div
              key={achievement.id}
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
