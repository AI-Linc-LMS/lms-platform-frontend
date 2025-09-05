import React, { useState, useEffect } from "react";
import { Course } from "../../../types/final-course.types";
import NotEnrolledCollapsedCard from "./NotEnrolledCollapsedCard";
import EnrolledCollapsedCard from "./EnrolledCollapsedCard";
import NotEnrolledExpandedCard from "./NotEnrolledExpandedCard";
import EnrolledExpandedCard from "./EnrolledExpandedCard";

interface CourseCardV2Props {
  course?: Course;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  enrolled?: boolean; // External prop for enrollment status
}

const CourseCardV2: React.FC<CourseCardV2Props> = ({
  course,
  className = "",
  isLoading = false,
  error = null,
  enrolled = false,
}) => {
  // Each card has its own independent expand state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(enrolled);


  useEffect(() => {
    if (enrolled && !isEnrolled) setIsEnrolled(true);
  }, [enrolled, isEnrolled]);

  // Handler for expanding the card
  const handleExpand = () => {
    setIsExpanded(true);
  };

  // Handler for collapsing the card
  const handleCollapse = () => {
    setIsExpanded(false);
  };

  // Loading state
  if (isLoading || !course || error) {
    return (
      <div
        className={`w-full border border-[#80C9E0] p-4 rounded-2xl md:rounded-3xl bg-white flex flex-col animate-pulse ${className}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-16"></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  console.log(isEnrolled,isExpanded,enrolled)
  // Determine which card component to render based on enrollment and expansion state
  if (isEnrolled) {
    if (isExpanded) {
      // Enrolled + Expanded
      return (
        <EnrolledExpandedCard
          course={course}
          className={className}
          onCollapse={handleCollapse}
        />
      );
    } else {
      // Enrolled + Collapsed
      return (
        <EnrolledCollapsedCard
          course={course}
          className={className}
          onExpand={handleExpand}
        />
      );
    }
  } else {
    if (isExpanded) {
      // Not Enrolled + Expanded
      return (
        <NotEnrolledExpandedCard
          course={course}
          className={className}
          onCollapse={handleCollapse}
        />
      );
    } else {
      // Not Enrolled + Collapsed
      return (
        <NotEnrolledCollapsedCard
          course={course}
          className={className}
          onExpand={handleExpand}
        />
      );
    }
  }
};

export default CourseCardV2;
