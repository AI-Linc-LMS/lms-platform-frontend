import React from "react";
import { Course } from "../../../../../types/final-course.types";

interface NextUpSectionProps {
  nextLesson: Course["next_lesson"];
  variant?: "expanded" | "collapsed";
}

export const NextUpSection: React.FC<NextUpSectionProps> = ({
  nextLesson,
  variant = "expanded",
}) => {
  if (!nextLesson) return null;

  return (
    <div className="bg-[#ecfdf5] border border-[#bbf7d0] rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-semibold text-[#059669]">
          {variant === "expanded" ? "Next Up" : "Next Up"}
        </span>
        <span className="text-[11px] text-[#047857] font-semibold">12 min</span>
      </div>
      <div className="flex items-center gap-2">
        {variant === "expanded" ? (
          <svg
            className="w-4 h-4 text-[#10b981]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        ) : (
          <i className="fas fa-play-circle text-base text-[#10b981]"></i>
        )}
        <span className="text-[13px] font-medium text-[#374151]">
          {nextLesson.title}
        </span>
      </div>
    </div>
  );
};
