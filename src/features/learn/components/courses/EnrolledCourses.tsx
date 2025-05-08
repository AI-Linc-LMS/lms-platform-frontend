import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { getEnrolledCourses } from "../../../../services/courses-content/coursesApis";
import { Course, setCourses } from "../../../../redux/slices/courseSlice";
import { RootState } from "../../../../redux/store";
import CourseCard from "./CourseCard";
import leftArrow from "../../../../assets/dashboard_assets/leftArrow.png";
import rightArrow from "../../../../assets/dashboard_assets/rightArrow.png";

interface EnrolledCoursesProps {
  className?: string;
}

const EnrolledCourses: React.FC<EnrolledCoursesProps> = ({ className = "" }) => {
  const dispatch = useDispatch();
  const Courses = useSelector((state: RootState) => state.courses.courses);
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
        {Courses?.map((course: Course) => (
          <div
            key={course.id}
            className="flex-shrink-0 w-full md:w-1/2 scroll-snap-align-start"
            style={{ scrollSnapAlign: "start" }}
          >
            <CourseCard
              isLoading={isLoading}
              error={error}
              course={{
                ...course,
                is_certified: false,
                modules: [],
                enrolled_students: 0,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnrolledCourses;
