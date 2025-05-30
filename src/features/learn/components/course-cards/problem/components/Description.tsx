import React from 'react';
import lightProblemIcon from "../../../../../../commonComponents/icons/enrolled-courses/problem/lightProblemIcon.png";
import tagProblemIcon from "../../../../../../commonComponents/icons/enrolled-courses/problem/tagProblemIcon.png";
import heartProblemIcon from "../../../../../../commonComponents/icons/enrolled-courses/problem/heartProblemIcon.png";
import { ProblemDetails } from '../problem.types';


interface DescriptionProps {
  problem: ProblemDetails;
  isDarkTheme: boolean;
}

const Description: React.FC<DescriptionProps> = ({ problem }) => {
  return (
    <>
      <div className="flex">
        <h1 className="problem-title">{problem.title}</h1>
      </div>

      <div className="flex gap-3">
        {/* Difficulty Tag */}
        <div className="flex items-center text-center gap-1 px-2 py-1 rounded-md border-1 border-gray-400 text-gray-500 text-sm my-2">
          <img src={lightProblemIcon} className="w-3 h-3 font-bold" />
          <span className="text-gray-500 text-xs">{problem.difficulty_level}</span>
        </div>

        {/* Category Tag */}
        <div className="flex items-center text-center gap-1 px-2 py-1 rounded-md border text-gray-500 text-sm my-2">
          <img src={tagProblemIcon} className="w-3 h-3 mt-1 font-bold" />
          <span className="text-gray-500 text-xs">Algorithms</span>
        </div>

        {/* Like Percentage Tag */}
        <div className="flex items-center text-center gap-1 px-2 py-1 rounded-md border text-gray-500 text-sm my-2">
          <img src={heartProblemIcon} className="w-3 h-3 mt-1 font-bold" />
          <span className="text-gray-500 text-xs">98.82%</span>
        </div>
      </div>
      <div className="problem-description mt-2" dangerouslySetInnerHTML={{ __html: problem.problem_statement || "" }} />

      <div className="section">
        <h3 className="section-title">Input Format</h3>
        <div className="section-content" dangerouslySetInnerHTML={{ __html: problem.input_format || "" }} />
      </div>

      <div className="section">
        <h3 className="section-title">Output Format</h3>
        <div className="section-content" dangerouslySetInnerHTML={{ __html: problem.output_format || "" }} />
      </div>

      <div className="examples-section">
        <div className="example">
          <h3 className="example-title">Example 1:</h3>
          <div className="example-box">
            <div className="example-input">
              <span className="example-label">Input:</span>
              <pre className="example-code">{problem.sample_input}</pre>
            </div>
            <div className="example-output">
              <span className="example-label">Output:</span>
              <pre className="example-code">{problem.sample_output}</pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Description; 