import React from 'react';
import { useLocation } from 'react-router-dom';
import LearnIcon from './LearnIcon';

const LearnIconController: React.FC = () => {
  const location = useLocation();
  // Learn is active when we're at the root path
  const isActive = location.pathname === '/';
  
  return <LearnIcon isActive={isActive} />;
};

export default LearnIconController; 