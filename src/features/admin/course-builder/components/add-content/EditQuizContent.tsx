import React, { useState, useEffect } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateSubmoduleContent,
  getSubmoduleContentById,
  QuizContentUpdateData,
  QuizQuestion,
} from "../../../../../services/admin/courseApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface EditQuizContentProps {
  onBack: () => void;
  clientId: number;
  courseId: number;
  submoduleId: number;
  contentId: number;
  onSuccess?: () => void;
}

const EditQuizContent: React.FC<EditQuizContentProps> = ({
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      question: "",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
    },
  ]);

  // Fetch existing quiz data
  const { data: quizData, isLoading: isLoadingQuiz } = useQuery({
    queryKey: [
      "submodule-content-detail",
      clientId,
      courseId,
      submoduleId,
      contentId,
    ],
    queryFn: () => {
      //console.log("=== FETCHING QUIZ DATA FOR EDIT ===");
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
    if (quizData) {
      //console.log("=== LOADED QUIZ DATA FOR EDITING ===");
      //console.log("Quiz data:", quizData);

      const contentDetails = quizData.details || quizData;

      setTitle(contentDetails.title || quizData.title || "");
      setMarks(
        contentDetails.marks?.toString() || quizData.marks?.toString() || ""
      );

      if (contentDetails.questions && Array.isArray(contentDetails.questions)) {
        setQuestions(contentDetails.questions);
      } else if (quizData.questions && Array.isArray(quizData.questions)) {
        setQuestions(quizData.questions);
      }
    }
  }, [quizData]);

  const updateMutation = useMutation({
    mutationFn: (data: QuizContentUpdateData) => {
      //console.log("=== UPDATING QUIZ ===");
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
      //console.log("✅ Quiz updated successfully!");
      success("Quiz Updated", "Quiz content updated successfully!");

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodule") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("quizzes") ||
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
      //console.error("❌ Failed to update quiz:", error);
      showError(
        "Update Failed",
        error.message || "Failed to update quiz content"
      );
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      showError("Validation Error", "Please enter a title");
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

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question.trim()) {
        showError("Validation Error", `Please enter question ${i + 1}`);
        return;
      }

      const filledOptions = question.options.filter((opt) => opt.trim() !== "");
      if (filledOptions.length < 2) {
        showError(
          "Validation Error",
          `Question ${i + 1} must have at least 2 options`
        );
        return;
      }

      if (!question.correct_answer.trim()) {
        showError(
          "Validation Error",
          `Please select correct answer for question ${i + 1}`
        );
        return;
      }
    }

    const contentData: QuizContentUpdateData = {
      title: title.trim(),
      marks: marksNumber,
      questions: questions,
    };

    updateMutation.mutate(contentData);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correct_answer: "",
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (
    index: number,
    field: keyof QuizQuestion,
    value: string | string[]
  ) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[index];

    switch (field) {
      case "question":
        question.question = value as string;
        break;
      case "options":
        question.options = value as string[];
        break;
      case "correct_answer":
        question.correct_answer = value as string;
        break;
      case "explanation":
        question.explanation = value as string;
        break;
    }

    setQuestions(updatedQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  if (isLoadingQuiz) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--default-primary)]"></div>
          <span className="ml-2 text-gray-600">Loading quiz data...</span>
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
        <h2 className="text-xl font-semibold text-gray-800">Edit Quiz</h2>
        <p className="text-sm text-gray-600">Update the quiz information</p>
      </div>

      {/* Quiz Details */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              Quiz Title
            </label>
            <input
              type="text"
              placeholder="Enter quiz title"
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

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Questions</h3>
            <button
              onClick={addQuestion}
              className="px-3 py-1 text-sm bg-[var(--default-primary)] text-white rounded hover:bg-[#1e4a61] disabled:opacity-50"
              disabled={updateMutation.isPending}
            >
              Add Question
            </button>
          </div>

          {questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              className="border border-gray-200 rounded-lg p-4 space-y-4"
            >
              <div className="flex justify-between items-start">
                <h4 className="text-md font-medium text-gray-700">
                  Question {questionIndex + 1}
                </h4>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    disabled={updateMutation.isPending}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Question Text
                </label>
                <textarea
                  placeholder="Enter your question"
                  value={question.question}
                  onChange={(e) =>
                    updateQuestion(questionIndex, "question", e.target.value)
                  }
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                  rows={3}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Options
                </label>
                <div className="space-y-2 mt-1">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={
                          question.correct_answer === option &&
                          option.trim() !== ""
                        }
                        onChange={() =>
                          updateQuestion(
                            questionIndex,
                            "correct_answer",
                            option
                          )
                        }
                        className="text-[var(--default-primary)] focus:ring-[var(--default-primary)]"
                        disabled={
                          updateMutation.isPending || option.trim() === ""
                        }
                      />
                      <input
                        type="text"
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) =>
                          updateOption(
                            questionIndex,
                            optionIndex,
                            e.target.value
                          )
                        }
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                        disabled={updateMutation.isPending}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Explanation (Optional)
                </label>
                <textarea
                  placeholder="Explain why this is the correct answer"
                  value={question.explanation || ""}
                  onChange={(e) =>
                    updateQuestion(questionIndex, "explanation", e.target.value)
                  }
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                  rows={2}
                  disabled={updateMutation.isPending}
                />
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
              "Update Quiz"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuizContent;
