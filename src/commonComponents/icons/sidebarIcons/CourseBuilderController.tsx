import React from "react";
import { useLocation } from "react-router-dom";
import CourseBuilderIcon from "./CourseBuilderIcon";

const CourseBuilderController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname.startsWith("/admin/courses");

  return <CourseBuilderIcon isActive={isActive} />;
};

export default CourseBuilderController; 