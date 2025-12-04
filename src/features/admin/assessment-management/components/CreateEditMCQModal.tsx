import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiX, FiSave } from "react-icons/fi";
import {
  createMCQ,
  updateMCQ,
  MCQListItem,
  CreateMCQPayload,
} from "../../../../services/admin/mcqApis";

interface CreateEditMCQModalProps {
  mcq: MCQListItem | null;
  onClose: () => void;
  clientId: string;
}

const CreateEditMCQModal = ({
  mcq,
  onClose,
  clientId,
}: CreateEditMCQModalProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!mcq;

  const [formData, setFormData] = useState<CreateMCQPayload>({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    explanation: "",
    difficulty_level: "Medium",
    topic: "",
    skills: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if editing
  useEffect(() => {
    if (mcq) {
      setFormData({
        question_text: mcq.question_text,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_option: mcq.correct_option,
        explanation: mcq.explanation || "",
        difficulty_level: mcq.difficulty_level,
        topic: mcq.topic || "",
        skills: mcq.skills || "",
      });
    }
  }, [mcq]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (payload: CreateMCQPayload) => {
      if (isEditMode && mcq) {
        return updateMCQ(clientId, mcq.id, payload);
      }
      return createMCQ(clientId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcqs", clientId] });
      onClose();
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question_text.trim()) {
      newErrors.question_text = "Question text is required";
    }
    if (!formData.option_a.trim()) {
      newErrors.option_a = "Option A is required";
    }
    if (!formData.option_b.trim()) {
      newErrors.option_b = "Option B is required";
    }
    if (!formData.option_c.trim()) {
      newErrors.option_c = "Option C is required";
    }
    if (!formData.option_d.trim()) {
      newErrors.option_d = "Option D is required";
    }
    if (!["A", "B", "C", "D"].includes(formData.correct_option)) {
      newErrors.correct_option = "Invalid correct option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateMCQPayload = {
      ...formData,
      explanation: formData.explanation || undefined,
      topic: formData.topic || undefined,
      skills: formData.skills || undefined,
    };

    saveMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit MCQ" : "Create MCQ"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={saveMutation.isPending}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                name="question_text"
                value={formData.question_text}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.question_text ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter the question"
              />
              {errors.question_text && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.question_text}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option A <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="option_a"
                  value={formData.option_a}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.option_a ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Option A"
                />
                {errors.option_a && (
                  <p className="mt-1 text-sm text-red-600">{errors.option_a}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option B <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="option_b"
                  value={formData.option_b}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.option_b ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Option B"
                />
                {errors.option_b && (
                  <p className="mt-1 text-sm text-red-600">{errors.option_b}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option C <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="option_c"
                  value={formData.option_c}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.option_c ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Option C"
                />
                {errors.option_c && (
                  <p className="mt-1 text-sm text-red-600">{errors.option_c}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option D <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="option_d"
                  value={formData.option_d}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.option_d ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Option D"
                />
                {errors.option_d && (
                  <p className="mt-1 text-sm text-red-600">{errors.option_d}</p>
                )}
              </div>
            </div>

            {/* Correct Option, Difficulty, Topic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Option <span className="text-red-500">*</span>
                </label>
                <select
                  name="correct_option"
                  value={formData.correct_option}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.correct_option ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                {errors.correct_option && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.correct_option}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Topic (optional)"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Skills (optional)"
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explanation for the correct answer (optional)"
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between p-6 border-t"
            style={{ borderColor: "var(--neutral-200)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 border rounded-lg transition-colors disabled:opacity-50"
              style={{
                color: "var(--font-primary)",
                borderColor: "var(--neutral-200)",
                backgroundColor: "var(--card-bg)",
              }}
              onMouseEnter={(e) =>
                !saveMutation.isPending &&
                (e.currentTarget.style.backgroundColor = "var(--neutral-50)")
              }
              onMouseLeave={(e) =>
                !saveMutation.isPending &&
                (e.currentTarget.style.backgroundColor = "var(--card-bg)")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary-500)",
                color: "var(--font-light)",
                cursor: saveMutation.isPending ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) =>
                !saveMutation.isPending &&
                (e.currentTarget.style.backgroundColor = "var(--primary-700)")
              }
              onMouseLeave={(e) =>
                !saveMutation.isPending &&
                (e.currentTarget.style.backgroundColor = "var(--primary-500)")
              }
            >
              <FiSave />
              {saveMutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update MCQ"
                : "Create MCQ"}
            </button>
          </div>

          {/* Error Message */}
          {saveMutation.isError && (
            <div className="px-6 pb-6">
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: "var(--error-100)",
                  borderLeft: "4px solid var(--error-500)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--error-600)" }}>
                  Error: {(saveMutation.error as Error).message}
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateEditMCQModal;
