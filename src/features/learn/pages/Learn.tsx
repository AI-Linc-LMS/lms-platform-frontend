import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getEnrolledCourses } from "../../../services/courses-content/coursesApis";
import { useQuery } from "@tanstack/react-query";
import { useDispatch} from "react-redux";
import { setCourses } from "../../../redux/slices/courseSlice";
import CourseDetails from "../components/courses/CoursesDetails";
import Sidebar from "../../../commonComponents/sidebar/Sidebar";

const Learn: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["Courses"],
    queryFn: () => getEnrolledCourses(1),
  });

  React.useEffect(() => {
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
    <div className="flex">
      <Sidebar isExpanded={true} toggleSidebar={() => {}} />
      <div className="flex-1 p-8">
        {location.pathname === "/learn" ? (
          <CourseDetails />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default Learn;
