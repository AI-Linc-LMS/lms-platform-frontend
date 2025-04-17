import React from "react";
import { Course } from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";
import CollapsibleCourseModule from "./CollapsibleCourseModule";
import { mockCourseContent } from "../../data/mockCourseContent";

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
      
      {/* Collapsible Course Content */}
      <div className="mt-8">
        {mockCourseContent.map((week) => (
          <CollapsibleCourseModule 
            key={week.id} 
            week={week} 
            defaultOpen={week.id === "week-1"} 
          />
        ))}
      </div>
    </div>
  );
};

export default CourseContent; 