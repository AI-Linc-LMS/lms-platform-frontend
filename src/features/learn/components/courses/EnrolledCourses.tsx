import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { getEnrolledCourses } from "../../../../services/courses-content/coursesApis";
import { Course as ReduxCourse, setCourses } from "../../../../redux/slices/courseSlice";
import { RootState } from "../../../../redux/store";
import CourseCard from "./CourseCard";
import leftArrow from "../../../../assets/dashboard_assets/leftArrow.png";
import rightArrow from "../../../../assets/dashboard_assets/rightArrow.png";
import { Course as CardCourse, Module } from "../../types/course.types";

interface EnrolledCoursesProps {
  className?: string;
}

// Define the stats structure based on the API response
interface CourseStats {
  article?: { completed: number; total: number };
  assignment?: { completed: number; total: number };
  coding_problem?: { completed: number; total: number };
  quiz?: { completed: number; total: number };
  video?: { completed: number; total: number };
}

// Extend ReduxCourse type to include stats
interface EnrolledCourse extends ReduxCourse {
  stats?: CourseStats;
}

// Helper function to transform the Redux course type to the CourseCard expected type
const transformCourseData = (reduxCourse: EnrolledCourse): CardCourse => {
  // Create a module with submodule that contains the stats from the API
  const mockModules: Module[] = [
    {
      id: 1,
      title: "Course Content",
      weekno: 1,
      completion_percentage: 0,
      submodules: [
        {
          id: 1,
          title: "Content Stats",
          description: "Course content statistics",
          order: 1,
          // Use the stats from the API response if available
          article_count: reduxCourse.stats?.article?.total || 0,
          assignment_count: reduxCourse.stats?.assignment?.total || 0,
          coding_problem_count: reduxCourse.stats?.coding_problem?.total || 0,
          quiz_count: reduxCourse.stats?.quiz?.total || 0,
          video_count: reduxCourse.stats?.video?.total || 0
        }
      ]
    }
  ];
  
  return {
    id: reduxCourse.id,
    title: reduxCourse.title,
    description: reduxCourse.description,
    course_id: reduxCourse.id,
    course_title: reduxCourse.title,
    course_description: reduxCourse.description,
    enrolled_students: reduxCourse.enrolled_students?.length || 0,
    is_certified: reduxCourse.certificate_available || false,
    updated_at: reduxCourse.updated_at,
    instructors: reduxCourse.instructors?.map(instructor => ({
      id: instructor.id,
      name: instructor.name,
      bio: instructor.bio,
      linkedin: instructor.linkedin,
      profile_pic_url: instructor.profile_pic_url
    })) || [],
    modules: mockModules // Use modules with stats from API
  };
};

const EnrolledCourses: React.FC<EnrolledCoursesProps> = ({ className = "" }) => {
  const dispatch = useDispatch();
  const Courses = useSelector((state: RootState) => state.courses.courses) as EnrolledCourse[];
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["Courses"],
    queryFn: () => getEnrolledCourses(1),
  });

  useEffect(() => {
    if (data) {
      dispatch(setCourses(data));
    }
  }, [data, dispatch]);

  const handleScroll = (direction: "left" | "right") => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const cardWidth = scrollContainer.offsetWidth / 2; // 2 cards visible
      scrollContainer.scrollBy({
        left: direction === "left" ? -cardWidth : cardWidth,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) return <p>Loading courses...</p>;
  if (error) return <p>Error loading courses. Please try again later.</p>;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="mb-4">
          <h1 className="text-[#343A40] font-bold text-[18px] md:text-[22px] font-sans">
            Enrolled Courses
          </h1>
          <p className="text-[#6C757D] font-sans font-normal text-[14px] md:text-[16px]">
            Here is a list of enrolled courses
          </p>
        </div>
        <div className="bottom-3 right-4 flex justify-end space-x-3">
          <button
            onClick={() => handleScroll("left")}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#12293A] shadow cursor-pointer"
          >
            <img src={leftArrow} alt="Previous" className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#12293A] shadow cursor-pointer"
          >
            <img src={rightArrow} alt="Next" className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto scroll-smooth space-x-4 ${className}`}
        style={{ scrollSnapType: "x mandatory" }}
      >
        {Courses?.map((course: EnrolledCourse) => (
          <div
            key={course.id}
            className="flex-shrink-0 w-full md:w-1/2 scroll-snap-align-start"
            style={{ scrollSnapAlign: "start" }}
          >
            <CourseCard
              isLoading={isLoading}
              error={error}
              course={transformCourseData(course)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnrolledCourses;
