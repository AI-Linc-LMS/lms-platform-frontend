import React from "react";
import { Course } from "../../../../../types/final-course.types";

interface NextLessonSectionProps {
  nextLesson: Course["next_lesson"];
  variant?: "detailed" | "simple";
}

export const NextLessonSection: React.FC<NextLessonSectionProps> = ({
  nextLesson,
  variant = "detailed",
}) => {
  if (!nextLesson) return null;

  if (variant === "simple") {
    return (
      <div className="bg-[#ecfdf5] border border-[#bbf7d0] rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-semibold text-[#059669]">
            Next Lesson
          </span>
          <span className="text-[11px] text-[#047857] font-semibold">
            12 min
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#10b981] rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-play-circle text-lg text-white"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-[13px] font-semibold text-[#374151] m-0 mb-0.5">
              {nextLesson.title}
            </h4>
            <p className="text-[11px] text-[#6b7280] m-0 leading-[1.3]">
              {nextLesson.description ||
                "Learn to create interactive dashboards with multiple data sources"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#ecfdf5] border border-[#bbf7d0] rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-semibold text-[#059669]">
          Next Up
        </span>
        <span className="text-[11px] text-[#047857] font-semibold">12 min</span>
      </div>
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-[#10b981]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
        <span className="text-[13px] font-medium text-[#374151]">
          {nextLesson.title}
        </span>
      </div>
    </div>
  );
};
