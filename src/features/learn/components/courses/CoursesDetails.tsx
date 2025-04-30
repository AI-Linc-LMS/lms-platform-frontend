import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { getEnrolledCourses } from "../../../../services/courses-content/coursesApis";
import { setCourses } from "../../../../redux/slices/courseSlice";
import { RootState } from "../../../../redux/store";
import CourseCard from "./CourseCard";

interface CourseDetailsProps {
  className?: string;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ className = "" }) => {
  const dispatch = useDispatch();
  const Courses = useSelector((state: RootState) => state.courses.courses);

  // Load courses from localStorage on component mount
  useEffect(() => {
    const savedCourses = localStorage.getItem("courses");
    if (savedCourses) {
      dispatch(setCourses(JSON.parse(savedCourses)));
    }
  }, [dispatch]);

  // Fetch enrolled courses using tanstack-query
  const { data, isLoading, error } = useQuery({
    queryKey: ["Courses"],
    queryFn: () => getEnrolledCourses(1),
  });

  useEffect(() => {
    if (data) {
      // Save fetched data into Redux store and localStorage
      dispatch(setCourses(data));
      localStorage.setItem("courses", JSON.stringify(data));
    }
  }, [data, dispatch]);

  console.log("Courses", Courses);
  if (isLoading) {
    return <p>Loading courses...</p>;
  }

  if (error) {
    return <p>Error loading courses. Please try again later.</p>;
  }

  return (
    <div className={`grid grid-cols-2 gap-5 ${className}`}>
      {Courses.map((course) => (
        <CourseCard
          key={course.id}
          isLoading={isLoading}
          error={error}
          course={{
            ...course,
          }}
        />
      ))}
    </div>
  );
};

export default CourseDetails;