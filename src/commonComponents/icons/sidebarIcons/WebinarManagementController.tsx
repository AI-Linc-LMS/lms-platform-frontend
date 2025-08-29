import React from 'react';
import { useLocation } from 'react-router-dom';
import WebinarManagementIcon from './WebinarMangementIcon';

const WebinarManagementController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname.includes('/admin/webinar-management');

  return (
    <WebinarManagementIcon 
      className={isActive ? 'text-white' : 'text-gray-600'} 
      size={20}
    />
  );
};

export default WebinarManagementController;
