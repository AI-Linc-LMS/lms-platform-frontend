import React from "react";
import { Award } from "lucide-react";

interface AchievementSectionProps {
  achievements?: Array<string>;
}

export const AchievementSection: React.FC<AchievementSectionProps> = ({ achievements }) => {
  if (!achievements || achievements.length === 0) return null;

  const earnedCount = achievements.length;
  const totalCount = achievements.length;

  return (
    <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-semibold text-[#0369a1]">Achievements</span>
        <span className="text-[11px] text-[#0284c7] font-semibold">{earnedCount}/{totalCount}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {achievements.map((label, idx) => (
          <div
            key={`${label}-${idx}`}
            className="flex flex-col items-center gap-1 p-2 rounded-md justify-between text-center transition-all duration-200 bg-[#dbeafe] border border-[#bfdbfe]"
          >
            <Award className="w-6 h-6 text-[#1d4ed8]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.3px] text-[#1e40af]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
