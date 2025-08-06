import React from "react";

interface MeetingReminderStatusProps {
  isActive: boolean;
  dataCount: number;
  className?: string;
}

export const MeetingReminderStatus: React.FC<MeetingReminderStatusProps> = ({
  isActive,
  dataCount,
  className = "",
}) => {
  if (!isActive) return null;

  return (
    <div
      className={`flex items-center gap-2 text-xs text-gray-600 ${className}`}
    >
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Meeting Reminder Active</span>
      </div>
      <span className="text-gray-400">•</span>
      <span>
        Monitoring {dataCount} registration{dataCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
};
