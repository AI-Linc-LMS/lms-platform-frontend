import React, { useState } from "react";
import { Course, Instructor, Module, Submodule } from "../../types/course.types";
import CourseStatistics from "./CourseStatistics";
import CourseActions from "./CourseActions";
import CollapsibleCourseModule from "./CollapsibleCourseModule";

interface CourseContentProps {
  course: Course;
  isLoading: boolean;
  error: Error | null;
}

const CourseContent: React.FC<CourseContentProps> = ({course, isLoading, error}) => {
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    index: number;
    x: number;
    y: number;
  }>({
    visible: false,
    index: 0,
    x: 0,
    y: 0,
  });

  

  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({
      visible: true,
      index,
      x: rect.left,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltipInfo((prev) => ({ ...prev, visible: false }));
  };


  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm animate-pulse">
        {/* Title skeleton */}
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>

        {/* Avatars skeleton */}
        <div className="flex -space-x-2 mr-3 my-3 md:my-4">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 border-2 border-white"
            />
          ))}
        </div>

        {/* Course statistics skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Course actions skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg mb-8"></div>

        {/* Modules skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                {[...Array(2)].map((_, subIndex) => (
                  <div key={subIndex} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Course</h2>
          <p className="text-gray-600 text-center max-w-md">
            We encountered an error while loading the course content. Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="w-full bg-white rounded-3xl p-4 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Course Found</h2>
          <p className="text-gray-600 text-center max-w-md">
            The requested course could not be found. Please check the course ID or try again later.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full bg-white rounded-3xl p-4 md:p-6 shadow-sm relative">
      <h1 className="font-semibold text-xl md:text-[25px] font-sans">{course.course_title}</h1>
      <p className="text-sm md:text-[14px] text-[#6C757D] font-normal">{course.course_description}</p>

      {/* Avatars */}
      <div className="flex -space-x-2 mr-3 my-3 md:my-4 overflow-x-auto">
        {course.instructors.map((instructor: Instructor, index: number) => (
          <div
            key={instructor.id}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 border-2 border-white overflow-hidden cursor-pointer transition-transform hover:z-10 flex-shrink-0"
            onMouseEnter={(e) => handleMouseEnter(index, e)}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={instructor.profile_pic_url}
              alt={instructor.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Tooltip bubble */}
      {tooltipInfo.visible && course.instructors[tooltipInfo.index] && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2"
          style={{
            left: `${tooltipInfo.x}px`,
            top: `${tooltipInfo.y - 130}px`,
          }}
        >
          <div className="custom-tooltip-bubble px-4 md:px-6 py-3 md:py-4 text-white shadow-xl min-w-[120px]">
            <p className="font-semibold text-base md:text-[12px] leading-none">
              {course.instructors[tooltipInfo.index].name}
            </p>
            <p className="text-[#D1DBE8] text-xs md:text-[12px] mt-2 leading-tight">
              {course.instructors[tooltipInfo.index].bio}
            </p>
          </div>
        </div>
      )}

      <CourseStatistics course={course} />
      <CourseActions />

      <div className="mt-4 md:mt-8">
        {course.modules.map((module: Module) => (
          <CollapsibleCourseModule
            key={module.id}
            week={{
              id: `${course.course_id}`,
              weekNo: module.weekno,
              title: module.title,
              completed: module.completion_percentage,
              modules: module.submodules.map((submodule: Submodule) => ({
                id: `${submodule.id}`,
                title: submodule.title,
                content: [
                  { type: "video", title: "Videos", count: submodule.video_count },
                  { type: "article", title: "Articles", count: submodule.article_count },
                  { type: "problem", title: "Problems", count: submodule.coding_problem_count },
                  { type: "quiz", title: "Quizzes", count: submodule.quiz_count },
                ]
              }))
            }}
            defaultOpen={module.weekno === 1}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseContent;
