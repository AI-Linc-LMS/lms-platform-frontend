import React, { useEffect, useState, memo } from "react";
import CourseCardV2 from "./course-card-v2/CourseCardV2";

import { CourseData } from "../../types/final-course.types";

interface CourseCardProps {
  course?: CourseData;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  clientId?: number;
  enrolled?: boolean;
  isExpanded: boolean; // ✅ comes from parent
  onToggleExpand: () => void; // ✅ controlled by parent
}

const CourseCard: React.FC<CourseCardProps> = memo(({
  course,
  className = "",
  isLoading = false,
  error = null,
  enrolled = false,
}) => {
  const backendSaysEnrolled = course?.is_enrolled === true;
  const isInitiallyEnrolled = !!course && (backendSaysEnrolled || enrolled);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(isInitiallyEnrolled);

  useEffect(() => {
    if (backendSaysEnrolled && !isEnrolled) setIsEnrolled(true);
  }, [backendSaysEnrolled, isEnrolled]);

  useEffect(() => {
    if (enrolled && !isEnrolled) setIsEnrolled(true);
  }, [enrolled, isEnrolled]);

  if (isLoading || !course || error) {
    return (
      <div
        className={`bg-white rounded-2xl border border-blue-100 shadow-lg max-w-md w-full overflow-hidden animate-pulse ${className}`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-5 bg-gray-200 rounded w-12"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <>
        <CourseCardV2 course={course} enrolled={true} className={className} />
      </>
    );
  }

  return (
    <>
      <CourseCardV2 course={course} enrolled={false} className={className} />
    </>
  );
});

CourseCard.displayName = "CourseCard";

export default CourseCard;
