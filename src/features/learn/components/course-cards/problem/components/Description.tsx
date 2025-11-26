import React from "react";
import lightProblemIcon from "../../../../../../commonComponents/icons/enrolled-courses/problem/lightProblemIcon.png";
import tagProblemIcon from "../../../../../../commonComponents/icons/enrolled-courses/problem/tagProblemIcon.png";
import heartProblemIcon from "../../../../../../commonComponents/icons/enrolled-courses/problem/heartProblemIcon.png";
import { ProblemDetails } from "../problem.types";
import "./Description.css";

interface DescriptionProps {
  problem: ProblemDetails;
  isDarkTheme: boolean;
}

const Description: React.FC<DescriptionProps> = ({ problem, isDarkTheme }) => {
  return (
    <>
      <div className="flex">
        <h1
          className={`problem-title ${
            isDarkTheme ? "text-gray-100" : "text-gray-900"
          }`}
        >
          {problem.title}
        </h1>
      </div>

      <div className="flex gap-3">
        {/* Difficulty Tag */}
        <div
          className={`flex items-center text-center gap-1 px-2 py-1 rounded-md border text-sm my-2 ${
            isDarkTheme
              ? "border-gray-600 text-gray-300 bg-gray-800"
              : "border-gray-400 text-gray-500"
          }`}
        >
          <img src={lightProblemIcon} className="w-3 h-3 font-bold" />
          <span
            className={`text-xs ${
              isDarkTheme ? "text-gray-300" : "text-gray-500"
            }`}
          >
            {problem.difficulty_level}
          </span>
        </div>

        {/* Category Tag */}
        <div
          className={`flex items-center text-center gap-1 px-2 py-1 rounded-md border text-sm my-2 ${
            isDarkTheme
              ? "border-gray-600 text-gray-300 bg-gray-800"
              : "border-gray-400 text-gray-500"
          }`}
        >
          <img src={tagProblemIcon} className="w-3 h-3 mt-1 font-bold" />
          <span
            className={`text-xs ${
              isDarkTheme ? "text-gray-300" : "text-gray-500"
            }`}
          >
            Algorithms
          </span>
        </div>

        {/* Like Percentage Tag */}
        <div
          className={`flex items-center text-center gap-1 px-2 py-1 rounded-md border text-sm my-2 ${
            isDarkTheme
              ? "border-gray-600 text-gray-300 bg-gray-800"
              : "border-gray-400 text-gray-500"
          }`}
        >
          <img src={heartProblemIcon} className="w-3 h-3 mt-1 font-bold" />
          <span
            className={`text-xs ${
              isDarkTheme ? "text-gray-300" : "text-gray-500"
            }`}
          >
            98.82%
          </span>
        </div>
      </div>
      <div
        className={`problem-description mt-2 ${
          isDarkTheme ? "dark-mode text-gray-300" : "text-gray-700"
        }`}
        style={{ whiteSpace: "pre-wrap" }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: problem.problem_statement || "" }}
        />
      </div>

      <div className="section">
        <h3 className={`section-title ${isDarkTheme ? "dark-mode" : ""}`}>
          Input Format
        </h3>
        <div
          className={`section-content ${
            isDarkTheme ? "dark-mode text-gray-300" : "text-gray-700"
          }`}
          style={{ whiteSpace: "pre-wrap" }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: problem.input_format || "" }}
          />
        </div>
      </div>

      <div className="section">
        <h3 className={`section-title ${isDarkTheme ? "dark-mode" : ""}`}>
          Output Format
        </h3>
        <div
          className={`section-content ${
            isDarkTheme ? "dark-mode text-gray-300" : "text-gray-700"
          }`}
          style={{ whiteSpace: "pre-wrap" }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: problem.output_format || "" }}
          />
        </div>
      </div>

      <div className="examples-section">
        <div className="example">
          <h3 className={`example-title ${isDarkTheme ? "dark-mode" : ""}`}>
            Example 1:
          </h3>
          <div
            className={`example-box rounded-md p-4 ${
              isDarkTheme ? "dark-mode" : ""
            }`}
          >
            <div className="example-input mb-3">
              <span
                className={`example-label font-semibold block mb-2 ${
                  isDarkTheme ? "dark-mode" : ""
                }`}
              >
                Input:
              </span>
              <pre
                className={`example-code p-3 rounded ${
                  isDarkTheme ? "dark-mode" : ""
                }`}
              >
                {problem.sample_input}
              </pre>
            </div>
            <div className="example-output">
              <span
                className={`example-label font-semibold block mb-2 ${
                  isDarkTheme ? "dark-mode" : ""
                }`}
              >
                Output:
              </span>
              <pre
                className={`example-code p-3 rounded ${
                  isDarkTheme ? "dark-mode" : ""
                }`}
              >
                {problem.sample_output}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Description;
