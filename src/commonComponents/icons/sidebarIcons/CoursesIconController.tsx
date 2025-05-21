import React from 'react';
import { useLocation } from 'react-router-dom';
import CoursesIcon from './CoursesIcon';

const CoursesIconController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === '/courses';
  
  return <CoursesIcon isActive={isActive} />;
};

export default CoursesIconController; 