import React, { useState, useEffect, useRef } from "react";
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardHeight, setCardHeight] = useState<string>("auto");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enrolled && !isEnrolled) setIsEnrolled(true);
  }, [enrolled, isEnrolled]);

  // Handler for expanding the card with smooth transition
  const handleExpand = () => {
    if (cardRef.current) {
      const currentHeight = cardRef.current.offsetHeight;
      setCardHeight(`${currentHeight}px`);

      setIsTransitioning(true);

      // Small delay to capture current height, then expand
      setTimeout(() => {
        setIsExpanded(true);
        setTimeout(() => {
          if (cardRef.current) {
            const newHeight = cardRef.current.scrollHeight;
            setCardHeight(`${newHeight}px`);

            // After transition completes, set back to auto
            setTimeout(() => {
              setCardHeight("auto");
              setIsTransitioning(false);
            }, 300);
          }
        }, 50);
      }, 50);
    }
  };

  // Handler for collapsing the card with smooth transition
  const handleCollapse = () => {
    if (cardRef.current) {
      const currentHeight = cardRef.current.scrollHeight;
      setCardHeight(`${currentHeight}px`);

      setIsTransitioning(true);

      // Force reflow to apply current height
      void cardRef.current.offsetHeight;

      // Small delay then switch content and measure new height
      setTimeout(() => {
        setIsExpanded(false);
        setTimeout(() => {
          if (cardRef.current) {
            const newHeight = cardRef.current.scrollHeight;
            setCardHeight(`${newHeight}px`);

            // After transition completes, set back to auto
            setTimeout(() => {
              setCardHeight("auto");
              setIsTransitioning(false);
            }, 300);
          }
        }, 10);
      }, 10);
    }
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

  console.log(isEnrolled, isExpanded, enrolled);
  // Determine which card component to render based on enrollment and expansion state
  if (isEnrolled) {
    if (isExpanded) {
      // Enrolled + Expanded
      return (
        <div
          ref={cardRef}
          className={`
            transition-all duration-300 ease-in-out
            ${isTransitioning ? "opacity-95" : "opacity-100"}
          `}
          style={{
            height: cardHeight,
            overflow: isTransitioning ? "hidden" : "visible",
          }}
        >
          <EnrolledExpandedCard
            course={course}
            className={className}
            onCollapse={handleCollapse}
          />
        </div>
      );
    } else {
      // Enrolled + Collapsed
      return (
        <div
          ref={cardRef}
          className={`
            transition-all duration-300 ease-in-out
            ${isTransitioning ? "opacity-95" : "opacity-100"}
          `}
          style={{
            height: cardHeight,
            overflow: isTransitioning ? "hidden" : "visible",
          }}
        >
          <EnrolledCollapsedCard
            course={course}
            className={className}
            onExpand={handleExpand}
          />
        </div>
      );
    }
  } else {
    if (isExpanded) {
      // Not Enrolled + Expanded
      return (
        <div
          ref={cardRef}
          className={`
            transition-all duration-300 ease-in-out
            ${isTransitioning ? "opacity-95" : "opacity-100"}
          `}
          style={{
            height: cardHeight,
            overflow: isTransitioning ? "hidden" : "visible",
          }}
        >
          <NotEnrolledExpandedCard
            course={course}
            className={className}
            onCollapse={handleCollapse}
          />
        </div>
      );
    } else {
      // Not Enrolled + Collapsed
      return (
        <div
          ref={cardRef}
          className={`
            transition-all duration-300 ease-in-out
            ${isTransitioning ? "opacity-95" : "opacity-100"}
          `}
          style={{
            height: cardHeight,
            overflow: isTransitioning ? "hidden" : "visible",
          }}
        >
          <NotEnrolledCollapsedCard
            course={course}
            className={className}
            onExpand={handleExpand}
          />
        </div>
      );
    }
  }
};

export default CourseCardV2;
