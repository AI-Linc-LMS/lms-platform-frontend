import React from "react";
import { Course } from "../../types/course.types";
import CourseCard from "./CourseCard";
import { defaultCourses } from "../../data/mockCourses";

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
  className = ""}) => {
  // Container class based on layout

  return (
    <div className={`grid grid-cols-2 gap-5 ${className}`}>
      {courses.map((course) => (
      <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseDetails;