import React, { useRef, useState } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadContent } from "../../../../../services/admin/contentApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface AddSubjectiveContentProps {
  onBack: () => void;
  clientId: number;
}

interface SubjectiveContentData {
  title: string;
  marks: number;
  difficulty_level: "Easy" | "Medium" | "Hard";
  duration: number;
  question: string;
}

const AddSubjectiveContent: React.FC<AddSubjectiveContentProps> = ({
  onBack,
  clientId,
}) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<
    "Easy" | "Medium" | "Hard"
  >("Medium");
  const [duration, setDuration] = useState(10);
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState("var(--netural-600)");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [question, setQuestion] = useState("");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (data: SubjectiveContentData) =>
      uploadContent(clientId, "assignments", data),
    onSuccess: () => {
      success(
        "Assignment Saved",
        "Assignment content has been successfully uploaded!"
      );

      // Invalidate all content-related queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodule") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("assignments")
          );
        },
      });

      onBack();
    },
    onError: (error: Error) => {
      showError(
        "Upload Failed",
        error.message || "Failed to save assignment content"
      );
    },
  });

  const handleSave = () => {
    // Save logic here: send data to backend or store in state
    if (!title.trim()) {
      showError("Validation Error", "Please enter a title");
      return;
    }

    if (!question.trim()) {
      showError("Validation Error", "Please enter question");
      return;
    }

    if (!marks.trim()) {
      showError("Validation Error", "Please enter marks");
      return;
    }
    //console.log(title, marks, question);
    const contentData: SubjectiveContentData = {
      title: title.trim(),
      marks: parseInt(marks, 10),
      question: question.trim(),
      difficulty_level: difficultyLevel,
      duration: duration,
    };

    //console.log({ title, marks, question });
    uploadMutation.mutate(contentData);
  };

  const colorOptions = [
    "var(--netural-600)", // Default dark gray/blue
    "var(--accent-red)", // Red
    "var(--accent-orange)", // Orange
    "#D69E2E", // Yellow
    "var(--accent-green)", // Green
    "var(--accent-teal)", // Teal
    "#3182CE", // Blue
    "var(--accent-purple)", // Purple
    "var(--accent-pink)", // Pink
    "#000000", // Black
  ];

  // Font size options
  const fontSizeOptions = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];

  // Execute formatting command on the editor content
  const execCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      // Save selection
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);

      // Focus on editor
      editorRef.current.focus();

      // Restore selection if it exists
      if (selection && range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Execute command
      document.execCommand(command, false, value);

      // Update question state with new content
      setQuestion(editorRef.current.innerHTML);
      setShowPlaceholder(false);
    }
  };

  // Handle font size change
  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    execCommand("fontSize", (size / 4).toString());
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    execCommand("foreColor", color);
    setShowColorPicker(false);
  };

  // Handle input in the contentEditable div
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setQuestion(content);
    const isEmpty =
      content.trim() === "" ||
      content === "<br>" ||
      content === "<div></div>" ||
      content === "<p></p>";
    setShowPlaceholder(isEmpty);
  };

  // Add a function to focus the editor
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();

      // Set cursor at the end
      const range = document.createRange();
      const selection = window.getSelection();
      if (selection) {
        if (editorRef.current.childNodes.length > 0) {
          const lastNode = editorRef.current.lastChild;
          if (lastNode) {
            range.setStartAfter(lastNode);
          } else {
            range.setStart(editorRef.current, 0);
          }
        } else {
          range.setStart(editorRef.current, 0);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm font-medium mb-4 flex items-center"
      >
        <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
        Back to Content Library
      </button>

      {/* Inputs */}
      <div className="border border-gray-300 rounded-lg p-2 px-4 space-y-4">
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Subjective Title
              </label>
              <input
                type="text"
                placeholder="Enter title here"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium text-gray-700">Marks</label>
              <input
                type="number"
                placeholder="Enter Marks"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Difficulty Level
              </label>
              <select
                value={difficultyLevel ?? ""}
                onChange={(e) =>
                  setDifficultyLevel?.(
                    e.target.value as "Easy" | "Medium" | "Hard"
                  )
                }
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                disabled={uploadMutation.isPending}
              >
                <option value="" disabled>
                  Select Difficulty Level
                </option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Duration
              </label>
              <input
                type="number"
                placeholder="Enter Duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Text Editor */}
        <div className="border rounded-lg overflow-hidden mt-3">
          <div className="bg-[var(--primary-50)] px-4 py-2 border-b flex items-center justify-between">
            <div
              className="flex items-center relative"
              ref={fontSizeDropdownRef}
            >
              <div
                className="text-sm flex items-center cursor-pointer"
                onClick={() => setFontSizeDropdownOpen(!fontSizeDropdownOpen)}
              >
                <span>{fontSize}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {fontSizeDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border overflow-y-auto z-10 max-h-48">
                  {fontSizeOptions.map((size) => (
                    <div
                      key={size}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleFontSizeChange(size);
                        setFontSizeDropdownOpen(false);
                      }}
                    >
                      {size}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                className="text-[var(--netural-600)] font-bold cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("formatBlock", "h1")}
              >
                T
              </button>

              <div className="relative" ref={colorPickerRef}>
                <div
                  className="h-6 w-6 rounded-full cursor-pointer border border-gray-300"
                  style={{ backgroundColor: textColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                ></div>

                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border p-2 z-10 grid grid-cols-5 gap-1">
                    {colorOptions.map((color) => (
                      <div
                        key={color}
                        className="h-5 w-5 rounded-full cursor-pointer border border-gray-300"
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                      ></div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="font-bold cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("bold")}
              >
                B
              </button>

              <button
                className="italic font-medium cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("italic")}
              >
                I
              </button>

              <button
                className="underline font-medium cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("underline")}
              >
                U
              </button>

              <button
                className="font-medium line-through cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("strikeThrough")}
              >
                S
              </button>

              <div className="h-4 border-r border-gray-300"></div>

              <button
                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("justifyLeft")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16"
                  />
                </svg>
              </button>

              <button
                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("justifyCenter")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h8"
                  />
                </svg>
              </button>

              <button
                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("justifyFull")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="h-4 border-r border-gray-300"></div>

              <button
                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => execCommand("insertOrderedList")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>

              <button
                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => {
                  const date = new Date().toLocaleDateString();
                  execCommand("insertText", date);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                onClick={() => {
                  const url = prompt("Enter the URL:");
                  if (url) execCommand("createLink", url);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={editorRef}
              className="w-full p-4 min-h-[150px] focus:outline-none text-gray-700 overflow-auto"
              contentEditable
              onInput={handleInput}
              onFocus={() => setShowPlaceholder(false)}
              onBlur={() => {
                const content = editorRef.current?.innerHTML || "";
                const isEmpty =
                  content.trim() === "" ||
                  content === "<br>" ||
                  content === "<div></div>" ||
                  content === "<p></p>";
                setShowPlaceholder(isEmpty);
              }}
              style={{ direction: "ltr" }}
              suppressContentEditableWarning={true}
              onClick={focusEditor}
            ></div>
            {showPlaceholder && (
              <div
                className="absolute top-4 left-4 text-gray-400 cursor-text"
                onClick={focusEditor}
              >
                Type your questions here...
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: "right" }}>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[var(--default-primary)] text-white rounded-xl transition"
          >
            Save Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubjectiveContent;
