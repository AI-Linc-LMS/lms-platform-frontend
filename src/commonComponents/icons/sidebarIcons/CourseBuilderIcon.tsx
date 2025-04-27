import React from 'react';

interface CourseBuilderIconProps {
  isActive: boolean;
}

const CourseBuilderIcon: React.FC<CourseBuilderIconProps> = ({ isActive }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke={isActive ? "#EFF9FC" : "#12293A"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke={isActive ? "#EFF9FC" : "#12293A"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke={isActive ? "#EFF9FC" : "#12293A"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CourseBuilderIcon; 