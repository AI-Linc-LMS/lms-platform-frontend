import React from 'react';
import { useLocation } from 'react-router-dom';
import CourseBuilderIcon from './CourseBuilderIcon';

const CourseBuilderIconController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname.includes('/course-builder');
  
  return <CourseBuilderIcon isActive={isActive} />;
};

export default CourseBuilderIconController; 