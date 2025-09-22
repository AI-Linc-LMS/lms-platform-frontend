import React from "react";
import { CircularProgressProps } from "../types";

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  isComplete,
}) => {
  // Circle properties
  const size = 40;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      {!isComplete ? (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--success-500)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
          />
        </svg>
      ) : (
        /* Completed checkmark */
        <div className="w-10 h-10 rounded-full bg-[var(--success-500)] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12l5 5L20 7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Percentage in center if not complete */}
      {!isComplete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};
