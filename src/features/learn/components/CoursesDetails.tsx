import React from "react";
import { Course } from "../types/course.types";
import CourseCard from "./CourseCard";
import { defaultCourses } from "../data/mockCourses";

interface CourseDetailsProps {
  courses?: Course[];
  className?: string;
  layout?: "grid" | "row";
  maxColumns?: number;
}

/**
 * CourseDetails component displays a list of courses
 * 
 * @param {Course[]} courses - Array of course objects to display
 * @param {string} className - Additional CSS classes for the container
 * @param {string} layout - Layout style ("grid" or "row")
 * @param {number} maxColumns - Maximum number of columns for grid layout
 */
const CourseDetails: React.FC<CourseDetailsProps> = ({
  courses = defaultCourses,
  className = "",
  layout = "row",
  maxColumns = 2
}) => {
  // Container class based on layout
  const containerClass = layout === "grid" 
    ? `grid grid-cols-1 md:grid-cols-${Math.min(maxColumns, 3)} gap-5 ${className}`
    : `flex flex-col md:flex-row gap-5 ${className}`;

  return (
    <div className={containerClass}>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseDetails;