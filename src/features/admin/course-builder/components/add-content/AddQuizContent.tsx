import React, { useState } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  uploadContent,
  getContent,
} from "../../../../../services/admin/contentApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface AddQuizContentProps {
  onBack: () => void;
  clientId: number;
}

interface QuizQuestion {
  id: number;
  question_text: string;
  marks: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

interface QuizData {
  title: string;
  instructions: string;
  durating_in_minutes: number;
  difficulty_level: "Easy" | "Medium" | "Hard";
  mcqs: number[];
}

const defaultQuestion = (): Omit<QuizQuestion, "id"> => ({
  question_text: "",
  marks: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "",
  explanation: "",
});

const AddQuizContent: React.FC<AddQuizContentProps> = ({
  onBack,
  clientId,
}) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [mode, setMode] = useState<"create" | "select">("select");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState<Omit<QuizQuestion, "id">[]>([
    defaultQuestion(),
  ]);
  const [difficultyLevel, setDifficultyLevel] = useState<
    "Easy" | "Medium" | "Hard"
  >("Medium");
  const [duration, setDuration] = useState(30);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  // Fetch existing MCQs
  const { data: existingQuestions = [], isLoading: isLoadingQuestions } =
    useQuery<QuizQuestion[]>({
      queryKey: ["content", clientId, "mcqs"],
      queryFn: () => getContent(clientId, "mcqs"),
    });

  const isQuestionValid = (question: Omit<QuizQuestion, "id">) => {
    if (!question) return false;

    return (
      question.question_text?.trim() !== "" &&
      question.marks?.trim() !== "" &&
      question.option_a?.trim() !== "" &&
      question.option_b?.trim() !== "" &&
      question.option_c?.trim() !== "" &&
      question.option_d?.trim() !== "" &&
      question.correct_option?.trim() !== "" &&
      question.explanation?.trim() !== ""
    );
  };

  const handleAddQuestion = () => {
    const currentQuestion = questions[activeIndex];

    if (!isQuestionValid(currentQuestion)) {
      showError("Validation Error", "Please complete the current question before adding a new one.");
      return;
    }

    setQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions, defaultQuestion()];
      setActiveIndex(newQuestions.length - 1);
      return newQuestions;
    });
  };

  const handleQuestionChange = (
    idx: number,
    field: keyof Omit<QuizQuestion, "id">,
    value: string
  ) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleCorrectChange = (qIdx: number, optIdx: number) => {
    const optionMap = ["a", "b", "c", "d"];
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) =>
        i === qIdx ? { ...q, correct_option: optionMap[optIdx] } : q
      )
    );
  };

  const uploadQuestionMutation = useMutation({
    mutationFn: (data: Omit<QuizQuestion, "id">) =>
      uploadContent(clientId, "mcqs", data),
    onSuccess: () => {
      success("Question Saved", "Question has been successfully saved!");
      
      // Invalidate MCQ queries to refresh the question list
      queryClient.invalidateQueries({
        queryKey: ["content", clientId, "mcqs"],
      });
      
      setQuestions([defaultQuestion()]);
      setActiveIndex(0);
    },
    onError: (error: Error) => {
      showError("Save Failed", error.message || "Failed to save question");
    },
  });

  const uploadQuizMutation = useMutation({
    mutationFn: (data: QuizData) => uploadContent(clientId, "quizzes", data),
    onSuccess: () => {
      success("Quiz Saved", "Quiz content has been successfully uploaded!");
      
      // Invalidate all content-related queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodule") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("quizzes")
          );
        },
      });
      
      onBack();
    },
    onError: (error: Error) => {
      showError("Upload Failed", error.message || "Failed to save quiz content");
    },
  });

  const handleSaveQuestion = () => {
    if (!isQuestionValid(questions[activeIndex])) {
      showError("Validation Error", "Please fill in all fields for the question.");
      return;
    }

    uploadQuestionMutation.mutate(questions[activeIndex]);
  };

  const handleSaveQuiz = () => {
    if (!title.trim()) {
      showError("Validation Error", "Please enter a title");
      return;
    }

    if (selectedQuestions.length === 0) {
      showError("Validation Error", "Please select at least one question for the quiz");
      return;
    }

    const quizData: QuizData = {
      title: title.trim(),
      instructions: instructions.trim(),
      durating_in_minutes: duration,
      difficulty_level: difficultyLevel,
      mcqs: selectedQuestions,
    };

    uploadQuizMutation.mutate(quizData);
  };

  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <div className="w-full h-[450px] flex flex-col">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm font-medium mb-2 flex items-center"
      >
        <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
        Back to Content Library
      </button>

      {/* Mode Toggle */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setMode("select")}
          className={`px-4 py-2 rounded-md ${
            mode === "select"
              ? "bg-[#255C79] text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Create Quiz
        </button>
        <button
          onClick={() => setMode("create")}
          className={`px-4 py-2 rounded-md ${
            mode === "create"
              ? "bg-[#255C79] text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Create Questions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mode !== "select" ? (
          // Question Creation UI
          <div className="border border-gray-300 rounded-lg p-1 px-4 space-y-4">
            <div className="rounded-lg p-2 px-4 flex flex-col md:flex-row gap-6">
              {/* Left: Question List */}
              <div className="w-full md:w-1/4">
                <div className="mb-2 font-medium">Add Question</div>
                <div className="flex flex-wrap gap-2">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-15 h-10 rounded bg-white border ${
                        activeIndex === idx
                          ? "border-[#255C79] text-[#255C79] font-bold"
                          : "border-gray-300 text-gray-700"
                      } flex items-center justify-center`}
                      onClick={() => setActiveIndex(idx)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  className="mt-4 px-3 py-1 border border-[#255C79] text-[#255C79] rounded flex items-center gap-1 text-sm hover:bg-[#255C79] hover:text-white"
                  onClick={handleAddQuestion}
                >
                  + Add Question
                </button>
              </div>

              {/* Right: Question Form */}
              <div className="flex-1">
                <div className="flex gap-4 mb-1">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      Question
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Question"
                      value={questions[activeIndex].question_text}
                      onChange={(e) =>
                        handleQuestionChange(
                          activeIndex,
                          "question_text",
                          e.target.value
                        )
                      }
                      className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="text-xs font-medium text-gray-700">
                      Marks
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Marks"
                      value={questions[activeIndex].marks}
                      onChange={(e) =>
                        handleQuestionChange(
                          activeIndex,
                          "marks",
                          e.target.value
                        )
                      }
                      className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    />
                  </div>
                </div>

                <div className="gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Enter Options & Choose the Correct one
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {["a", "b", "c", "d"].map((opt, optIdx) => (
                      <div key={opt} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correctOption-${activeIndex}`}
                          checked={
                            questions[activeIndex].correct_option === opt
                          }
                          onChange={() =>
                            handleCorrectChange(activeIndex, optIdx)
                          }
                        />
                        <input
                          type="text"
                          placeholder={`Option ${opt.toUpperCase()}`}
                          value={
                            questions[activeIndex][
                              `option_${opt}` as keyof Omit<QuizQuestion, "id">
                            ] as string
                          }
                          onChange={(e) =>
                            handleQuestionChange(
                              activeIndex,
                              `option_${opt}` as keyof Omit<QuizQuestion, "id">,
                              e.target.value
                            )
                          }
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Answer Explanation
                  </label>
                  <textarea
                    placeholder="Enter the explanation for the answer here..."
                    value={questions[activeIndex].explanation}
                    onChange={(e) =>
                      handleQuestionChange(
                        activeIndex,
                        "explanation",
                        e.target.value
                      )
                    }
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    rows={3}
                  />
                </div>

                {/* Save Question Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveQuestion}
                    className="px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
                  >
                    Save Question
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Quiz Creation UI
          <div className="border border-gray-300 rounded-lg p-4 space-y-4">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Quiz Title
              </label>
              <input
                type="text"
                placeholder="Enter quiz title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Instructions
              </label>
              <textarea
                placeholder="Enter quiz instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                rows={3}
              />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Difficulty Level
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) =>
                    setDifficultyLevel(
                      e.target.value as "Easy" | "Medium" | "Hard"
                    )
                  }
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Questions
              </label>
              {isLoadingQuestions ? (
                <div className="text-gray-500">Loading questions...</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {existingQuestions.map((question) => (
                    <div
                      key={question.id}
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedQuestions.includes(question.id)
                          ? "border-[#255C79] bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => toggleQuestionSelection(question.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {question.question_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Quiz Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveQuiz}
                className="px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
              >
                Save Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddQuizContent;
