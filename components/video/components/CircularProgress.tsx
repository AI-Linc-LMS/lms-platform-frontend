"use client";

import React from "react";

interface CircularProgressProps {
  progress: number;
  isComplete?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  isComplete = false,
}) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-12 h-12">
      <svg className="transform -rotate-90 w-12 h-12">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke={isComplete ? "#10b981" : "#ffffff"}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-xs font-semibold">
          {isComplete ? "✓" : Math.round(progress)}
        </span>
      </div>
    </div>
  );
};









