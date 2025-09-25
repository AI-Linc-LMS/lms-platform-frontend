import React from "react";
import { useLocation } from "react-router-dom";

const AssessmentsIconController: React.FC = () => {
  const location = useLocation();
  const isActive =
    location.pathname === "/assessments" ||
    location.pathname.startsWith("/assessment");

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document background */}
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        ry="2"
        strokeWidth="1.5"
        stroke="currentColor"
      />

      {/* Header section */}
      <rect
        x="4"
        y="3"
        width="16"
        height="5"
        rx="2"
        ry="2"
        stroke="currentColor"
        opacity="0.3"
      />

      {/* Quiz/Assessment lines */}
      <line
        x1="7"
        y1="11"
        x2="17"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="14"
        x2="14"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="17"
        x2="16"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Checkmark or assessment indicator */}
      <circle
        cx="16.5"
        cy="6"
        r="2.5"
        fill={isActive ? "var(--primary-500)" : "var(--neutral-300)"}
        opacity="0.8"
      />
      <path
        d="M15.2 6l0.8 0.8 1.5-1.5"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default AssessmentsIconController;
