import React from "react";

interface AssessmentHeaderProps {
  timeRemaining: number;
  assessmentId?: string;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  timeRemaining,
}) => {
  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-0">
        <p></p>
        <div className="text-center sm:text-center w-full sm:w-auto">
          <h1 className="text-base sm:text-lg font-semibold text-gray-800">
            Assessment
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Solve real world questions and gain insight knowledge.
          </p>
        </div>
        <div className="text-center sm:text-right w-full sm:w-auto">
          <div className="text-xs sm:text-sm text-gray-500">Time Remaining</div>
          <div className="text-base sm:text-lg font-semibold text-[var(--primary-500)]">
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentHeader;
