import React, { useState, useEffect } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateSubmoduleContent,
  getSubmoduleContentById,
  CodingProblemContentUpdateData,
  TestCase,
} from "../../../../../services/admin/courseApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface EditCodingProblemContentProps {
  onBack: () => void;
  clientId: number;
  courseId: number;
  submoduleId: number;
  contentId: number;
  onSuccess?: () => void;
}

const EditCodingProblemContent: React.FC<EditCodingProblemContentProps> = ({
  onBack,
  clientId,
  courseId,
  submoduleId,
  contentId,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      input: "",
      expected_output: "",
      is_hidden: false,
    },
  ]);

  // Fetch existing coding problem data
  const { data: codingProblemData, isLoading: isLoadingCodingProblem } =
    useQuery({
      queryKey: [
        "submodule-content-detail",
        clientId,
        courseId,
        submoduleId,
        contentId,
      ],
      queryFn: () => {
        //console.log("=== FETCHING CODING PROBLEM DATA FOR EDIT ===");
        //console.log("Client ID:", clientId);
        //console.log("Course ID:", courseId);
        //console.log("Submodule ID:", submoduleId);
        //console.log("Content ID:", contentId);

        return getSubmoduleContentById(
          clientId,
          courseId,
          submoduleId,
          contentId
        );
      },
      enabled: !!contentId && !!courseId && !!submoduleId,
    });

  // Populate form with existing data
  useEffect(() => {
    if (codingProblemData) {
      //console.log("=== LOADED CODING PROBLEM DATA FOR EDITING ===");
      //console.log("Coding problem data:", codingProblemData);

      const contentDetails = codingProblemData.details || codingProblemData;

      setTitle(contentDetails.title || codingProblemData.title || "");
      setMarks(
        contentDetails.marks?.toString() ||
          codingProblemData.marks?.toString() ||
          ""
      );
      setProblemStatement(
        contentDetails.problem_statement ||
          codingProblemData.problem_statement ||
          ""
      );

      if (
        contentDetails.test_cases &&
        Array.isArray(contentDetails.test_cases)
      ) {
        setTestCases(contentDetails.test_cases);
      } else if (
        codingProblemData.test_cases &&
        Array.isArray(codingProblemData.test_cases)
      ) {
        setTestCases(codingProblemData.test_cases);
      }
    }
  }, [codingProblemData]);

  const updateMutation = useMutation({
    mutationFn: (data: CodingProblemContentUpdateData) => {
      //console.log("=== UPDATING CODING PROBLEM ===");
      //console.log("Client ID:", clientId);
      //console.log("Course ID:", courseId);
      //console.log("Submodule ID:", submoduleId);
      //console.log("Content ID:", contentId);
      //console.log("Update data:", data);

      return updateSubmoduleContent(
        clientId,
        courseId,
        submoduleId,
        contentId,
        data
      );
    },
    onSuccess: () => {
      //console.log("✅ Coding problem updated successfully!");
      success(
        "Coding Problem Updated",
        "Coding problem content updated successfully!"
      );

      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodules") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("coding-problems") ||
            (queryKey.includes("submodule-content-detail") &&
              queryKey.includes(clientId) &&
              queryKey.includes(courseId) &&
              queryKey.includes(submoduleId))
          );
        },
      });

      if (onSuccess) {
        onSuccess();
      }
      onBack();
    },
    onError: (error: Error) => {
      //console.error("❌ Failed to update coding problem:", error);
      showError(
        "Update Failed",
        error.message || "Failed to update coding problem content"
      );
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      showError("Validation Error", "Please enter a title");
      return;
    }

    if (!problemStatement.trim()) {
      showError("Validation Error", "Please enter problem statement");
      return;
    }

    if (!marks.trim()) {
      showError("Validation Error", "Please enter marks");
      return;
    }

    const marksNumber = parseInt(marks, 10);
    if (isNaN(marksNumber) || marksNumber < 0) {
      showError("Validation Error", "Please enter a valid marks value");
      return;
    }

    // Validate test cases
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      if (!testCase.input.trim()) {
        showError(
          "Validation Error",
          `Please enter input for test case ${i + 1}`
        );
        return;
      }
      if (!testCase.expected_output.trim()) {
        showError(
          "Validation Error",
          `Please enter expected output for test case ${i + 1}`
        );
        return;
      }
    }

    const contentData: CodingProblemContentUpdateData = {
      title: title.trim(),
      marks: marksNumber,
      problem_statement: problemStatement.trim(),
      test_cases: testCases,
    };

    updateMutation.mutate(contentData);
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        input: "",
        expected_output: "",
        is_hidden: false,
      },
    ]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string | boolean
  ) => {
    const updatedTestCases = [...testCases];
    const testCase = updatedTestCases[index];

    switch (field) {
      case "input":
        testCase.input = value as string;
        break;
      case "expected_output":
        testCase.expected_output = value as string;
        break;
      case "is_hidden":
        testCase.is_hidden = value as boolean;
        break;
    }

    setTestCases(updatedTestCases);
  };

  if (isLoadingCodingProblem) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--default-primary)]"></div>
          <span className="ml-2 text-gray-600">
            Loading coding problem data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm font-medium mb-4 flex items-center"
        disabled={updateMutation.isPending}
      >
        <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
        Back to Content Library
      </button>

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Edit Coding Problem
        </h2>
        <p className="text-sm text-gray-600">
          Update the coding problem information
        </p>
      </div>

      {/* Coding Problem Details */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              Problem Title
            </label>
            <input
              type="text"
              placeholder="Enter problem title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium text-gray-700">Marks</label>
            <input
              type="number"
              placeholder="Enter marks"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Problem Statement
          </label>
          <textarea
            placeholder="Enter the problem statement with detailed description, constraints, and examples"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            rows={8}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Test Cases */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Test Cases</h3>
            <button
              onClick={addTestCase}
              className="px-3 py-1 text-sm bg-[var(--default-primary)] text-white rounded hover:bg-[#1e4a61] disabled:opacity-50"
              disabled={updateMutation.isPending}
            >
              Add Test Case
            </button>
          </div>

          {testCases.map((testCase, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 space-y-4"
            >
              <div className="flex justify-between items-start">
                <h4 className="text-md font-medium text-gray-700">
                  Test Case {index + 1}
                </h4>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={testCase.is_hidden || false}
                      onChange={(e) =>
                        updateTestCase(index, "is_hidden", e.target.checked)
                      }
                      className="text-[var(--default-primary)] focus:ring-[var(--default-primary)]"
                      disabled={updateMutation.isPending}
                    />
                    Hidden
                  </label>
                  {testCases.length > 1 && (
                    <button
                      onClick={() => removeTestCase(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      disabled={updateMutation.isPending}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Input
                  </label>
                  <textarea
                    placeholder="Enter test case input"
                    value={testCase.input}
                    onChange={(e) =>
                      updateTestCase(index, "input", e.target.value)
                    }
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    rows={4}
                    disabled={updateMutation.isPending}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Expected Output
                  </label>
                  <textarea
                    placeholder="Enter expected output"
                    value={testCase.expected_output}
                    onChange={(e) =>
                      updateTestCase(index, "expected_output", e.target.value)
                    }
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    rows={4}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons - Fixed positioning and styling */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-6 py-2 text-sm font-medium text-white bg-[var(--default-primary)] border border-transparent rounded-lg hover:bg-[#1e4a61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--default-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updateMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              "Update Coding Problem"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCodingProblemContent;
