import React from "react";

interface SubjectiveAssignment {
  id: number;
  title: string;
  difficulty: string;
  completion: number;
}

interface SubjectiveContentProps {
  assignment: SubjectiveAssignment;
}

const SubjectiveContent: React.FC<SubjectiveContentProps> = ({ assignment }) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Subjective Assignment</h2>
        <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
          {assignment.completion}% completion
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-base mb-2">{assignment.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {assignment.difficulty}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-8 h-8 rounded-full bg-[#D9F5FC] flex items-center justify-center text-sm">
              {assignment.id}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-2">
          This assignment requires you to compare and analyze the specifications of electric and IC engine supercars.
        </p>
        <ul className="list-disc text-sm text-gray-600 pl-5 space-y-1">
          <li>Compare performance metrics</li>
          <li>Analyze cost differences</li>
          <li>Evaluate environmental impact</li>
          <li>Examine maintenance requirements</li>
          <li>Assess comfort and convenience features</li>
        </ul>
      </div>
      
      <button className="w-full bg-[#255C79] text-white rounded-lg py-2 mt-6">
        Start Assignment
      </button>
    </div>
  );
};

export default SubjectiveContent; 