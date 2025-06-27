import React from "react";
import { useLocation } from "react-router-dom";

const AssessmentsIconController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/assessments" || location.pathname.startsWith("/assessment");

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        stroke={isActive ? "#255C79" : "#6C757D"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isActive ? "#EFF9FC" : "none"}
      />
    </svg>
  );
};

export default AssessmentsIconController; 