import React from "react";
import { Video, FileText, HelpCircle, Code, Edit } from "lucide-react";
import { Course } from "../../../../types/final-course.types";

interface ContentMetric {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  getValue: (course: Course) => number;
  getTooltip: (value: number) => string;
}

interface ContentMetricsSectionProps {
  course: Course;
}

const CONTENT_METRICS: ContentMetric[] = [
  {
    id: "videos",
    icon: Video,
    label: "Videos",
    getValue: (course: Course) => course.stats?.video?.total || 247,
    getTooltip: (value: number) => `${value} Videos`,
  },
  {
    id: "articles",
    icon: FileText,
    label: "Articles",
    getValue: (course: Course) => course.stats?.article?.total || 45,
    getTooltip: (value: number) => `${value} Articles`,
  },
  {
    id: "quizzes",
    icon: HelpCircle,
    label: "Quizzes",
    getValue: (course: Course) => course.stats?.quiz?.total || 23,
    getTooltip: (value: number) => `${value} Quizzes`,
  },
  {
    id: "problems",
    icon: Code,
    label: "Problems",
    getValue: (course: Course) => course.stats?.coding_problem?.total || 18,
    getTooltip: (value: number) => `${value} Problems`,
  },
  {
    id: "assignments",
    icon: Edit,
    label: "Subjective",
    getValue: (course: Course) => course.stats?.assignment?.total || 12,
    getTooltip: (value: number) => `${value} Subjective`,
  },
];

export const ContentMetricsSection: React.FC<ContentMetricsSectionProps> = ({
  course,
}) => {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-[#6b7280] mb-2 uppercase tracking-[0.5px]">
        Content
      </div>
      <div className="grid grid-cols-5 gap-2">
        {CONTENT_METRICS.map((metric) => {
          const IconComponent = metric.icon;
          const value = metric.getValue(course);
          const tooltip = metric.getTooltip(value);

          return (
            <div
              key={metric.id}
              className="bg-white border border-[#e5e7eb] rounded-lg p-3 text-center flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer hover:border-[#10b981] hover:-translate-y-1 hover:shadow-[0_2px_8px_rgba(16,185,129,0.1)] relative group"
              data-tooltip={tooltip}
            >
              <IconComponent className="w-5 h-5 text-[#6b7280]" />
              <span className="text-xs font-medium text-[#9ca3af] leading-none">
                {value}
              </span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#374151] text-white px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 invisible transition-all duration-200 z-[1000] mb-2 group-hover:opacity-100 group-hover:visible">
                {tooltip}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
