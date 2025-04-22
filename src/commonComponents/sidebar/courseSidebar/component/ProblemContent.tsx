import React from "react";
import problemIcon from "../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

interface ProblemItem {
  id: string;
  title: string;
  marks: number;
  accuracy: number; // In percentage
  submissions: number;
  completed: boolean;
}

interface ProblemContentProps {
  problems: ProblemItem[];
  selectedProblemId?: string;
  onSelect: (id: string) => void;
}

const ProblemContent: React.FC<ProblemContentProps> = ({
  problems,
  selectedProblemId,
  onSelect,
}) => {
  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Problems</h2>
      <p className="text-sm text-gray-500 mb-4">
        Solve real world problems and gain knowledge.
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {problems.map((problem, idx) => {
          const isSelected = selectedProblemId === problem.id;
          const isLast = idx === problems.length - 1;

          return (
            <div
              key={problem.id}
              onClick={() => onSelect(problem.id)}
              className={`cursor-pointer px-4 py-3 flex justify-between items-center transition ${
                isSelected ? "bg-blue-50" : "hover:bg-gray-50"
              } ${!isLast ? "border-b border-gray-200" : ""}`}
            >
              <div className="flex gap-3 items-start">
                <img src={problemIcon} alt="problem" className="w-5 h-5 mt-1" />
                <div>
                  <h3
                    className={`text-sm font-medium ${
                      isSelected ? "text-[#007B9F]" : "text-gray-800"
                    }`}
                  >
                    {problem.title}
                  </h3>
                  <p className="text-xs text-gray-500 flex flex-wrap gap-2">
                    <span>{problem.marks} Marks</span>
                    <span>|</span>
                    <span>{problem.accuracy.toFixed(2)}% Accuracy</span>
                    <span>|</span>
                    <span>{problem.submissions.toLocaleString()} Submissions</span>
                  </p>
                </div>
              </div>

              <img
                src={problem.completed ? completeTickIcon : tickIcon}
                alt="Status"
                className="w-5 h-5"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProblemContent;
