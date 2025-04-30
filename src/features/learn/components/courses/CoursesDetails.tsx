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

  // Fetch enrolled courses using tanstack-query
  const { data, isLoading, error } = useQuery({
    queryKey: ["Courses"],
    queryFn: () => getEnrolledCourses(1),
  });

  // Save fetched data into Redux store
  useEffect(() => {
    if (data) {
      dispatch(setCourses(data));
    }
  }, [data, dispatch]);

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
          isLoading={true}
          error={error}
          course={{
            ...course,
            teacherAvatar: "",
          }}
        />
      ))}
    </div>
  );
};

export default CourseDetails;
