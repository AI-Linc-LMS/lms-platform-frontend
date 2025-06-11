import React from "react";
import courseBuilderActive from "../../icons/admin/nav/course-builder-active.png";
import courseBuilderInactive from "../../icons/admin/nav/course-builder.png";
interface CourseBuilderIconProps {
  isActive: boolean;
}

const CourseBuilderIcon: React.FC<CourseBuilderIconProps> = ({ isActive }) => {
  return (
    <img src={isActive ? courseBuilderActive : courseBuilderInactive} alt="Course Builder" />
     
  );
};

export default CourseBuilderIcon; 