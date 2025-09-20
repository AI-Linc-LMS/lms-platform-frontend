import React from "react";
import { ChevronUp } from "lucide-react";
import { Course } from "../../../../types/final-course.types";
import { generateTrustedByCompanies } from "../utils/courseDataUtils";
import { CertifiedBySection } from "./shared";

interface CardHeaderProps {
  course: Course;
  onCollapse: () => void;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  course,
  onCollapse,
}) => {
  return (
    <div className="p-6 pb-3 border-b border-[#f3f4f6]">
      {/* Header Main */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 leading-tight pr-4 flex-1">
          {course.title}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <span className="bg-[#10b981] text-white px-2 py-1 rounded-xl text-[11px] font-semibold uppercase tracking-[0.5px]">
              Active
            </span>
          </div>
          <button
            onClick={onCollapse}
            className="bg-[#f3f4f6] border border-[#e5e7eb] rounded-full w-9 h-9 flex items-center justify-center cursor-pointer transition-all duration-300 text-[#6b7280] hover:bg-[#e5e7eb] hover:scale-105"
            aria-label="Collapse course card"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
      <CertifiedBySection
        trustedCompanies={generateTrustedByCompanies(course)}
      />
    </div>
  );
};
