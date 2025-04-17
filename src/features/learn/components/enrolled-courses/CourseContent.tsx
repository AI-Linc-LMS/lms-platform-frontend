import React from "react";
import { Course } from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";

interface CourseContentProps {
  course: Course;
}

const CourseContent: React.FC<CourseContentProps> = ({ course }) => {
  return (
    <div className="w-full bg-white rounded-3xl p-6 shadow-sm">
      <h1 className="font-semibold text-[25px] font-sans">{course.title}</h1>
      <p className="text-[14px] text-[#6C757D] font-normal">{course.description}</p>
      <CourseStatistics />
      <CourseActions />
    </div>
  );
};

export default CourseContent; 