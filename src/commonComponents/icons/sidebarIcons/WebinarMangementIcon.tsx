import React from 'react';

interface WebinarManagementIconProps {
  className?: string;
  size?: number;
}

const WebinarManagementIcon: React.FC<WebinarManagementIconProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Monitor/Screen */}
      <rect
        x="2"
        y="4"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Screen content - presentation bars */}
      <rect x="5" y="7" width="2" height="6" fill="currentColor" />
      <rect x="8" y="9" width="2" height="4" fill="currentColor" />
      <rect x="11" y="8" width="2" height="5" fill="currentColor" />
      
      {/* Video camera */}
      <rect
        x="15"
        y="8"
        width="4"
        height="3"
        rx="1"
        fill="currentColor"
      />
      <path
        d="M19 9.5L21 8.5V11.5L19 10.5"
        fill="currentColor"
      />
      
      {/* Monitor stand */}
      <path
        d="M10 16V18H14V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Base */}
      <path
        d="M8 18H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default WebinarManagementIcon;
