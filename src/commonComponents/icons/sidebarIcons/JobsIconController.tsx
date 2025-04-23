import React from 'react';
import { useLocation } from 'react-router-dom';
import JobsIcon from './JobsIcon';

const JobsIconController: React.FC = () => {
  const location = useLocation();
  // Jobs is active when the path includes '/jobs'
  const isActive = location.pathname.includes('/jobs');
  
  return <JobsIcon isActive={isActive} />;
};

export default JobsIconController; 