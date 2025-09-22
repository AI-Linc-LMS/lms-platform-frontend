import React, { useRef, useState, useEffect } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadContent } from "../../../../../services/admin/contentApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface AddProblemContentProps {
  onBack: () => void;
  clientId: number;
}

interface TestCase {
  input: string;
  expected_output: string;
}

interface ProblemContentData {
  title: string;
  level: string;
  topic: string;
  languages: string[];
  testCases: TestCase[];
  problem_statement: string;
}

const AddProblemContent: React.FC<AddProblemContentProps> = ({
  onBack,
  clientId,
}) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCaseError, setTestCaseError] = useState("");
  const [marks, setMarks] = useState("");
  const [statement, setStatement] = useState("");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState("var(--netural-600)");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
      if (
        fontSizeDropdownRef.current &&
        !fontSizeDropdownRef.current.contains(event.target as Node)
      ) {
        setFontSizeDropdownOpen(false);
      }
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateTestCases = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        setTestCaseError("Test cases must be an array");
        return false;
      }
      for (const testCase of parsed) {
        if (
          typeof testCase !== "object" ||
          !Object.prototype.hasOwnProperty.call(testCase, "input") ||
          !Object.prototype.hasOwnProperty.call(testCase, "expected_output")
        ) {
          setTestCaseError(
            "Each test case must have 'input' and 'expected_output' fields"
          );
          return false;
        }
      }
      setTestCases(parsed);
      setTestCaseError("");
      return true;
    } catch {
      setTestCaseError("Invalid JSON format");
      return false;
    }
  };

  const handleTestCasesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.trim()) {
      validateTestCases(value);
    } else {
      setTestCases([]);
      setTestCaseError("");
    }
  };

  const uploadMutation = useMutation({
    mutationFn: (data: ProblemContentData) =>
      uploadContent(clientId, "coding-problems", data),

    onSuccess: () => {
      success(
        "Problem Saved",
        "Coding problem content has been successfully uploaded!"
      );

      // Invalidate all content-related queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodule") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("coding-problems")
          );
        },
      });

      onBack();
    },
    onError: (error: Error) => {
      showError(
        "Upload Failed",
        error.message || "Failed to save problem content"
      );
    },
  });

  const handleSave = () => {
    if (testCaseError) {
      showError(
        "Validation Error",
        "Please fix the test cases format before saving"
      );
      return;
    }

    if (
      title === "" ||
      level === "" ||
      topic === "" ||
      languages.length === 0 ||
      testCases.length === 0 ||
      marks === "" ||
      !statement.trim()
    ) {
      showError("Validation Error", "Please fill all the fields before saving");
      return;
    }

    uploadMutation.mutate({
      title,
      level,
      topic,
      languages,
      testCases,
      problem_statement: statement,
    });
  };

  const colorOptions = [
    "var(--netural-600)",
    "var(--accent-red)",
    "var(--accent-orange)",
    "#D69E2E",
    "var(--accent-green)",
    "var(--accent-teal)",
    "#3182CE",
    "var(--accent-purple)",
    "var(--accent-pink)",
    "#000000",
  ];
  const fontSizeOptions = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];
  const levelOptions = ["Easy", "Medium", "Hard"];
  const topicOptions = ["Arrays", "Strings", "Math", "Graphs", "DP"];
  const languageOptions = ["Python", "JavaScript", "Java", "C++"];

  const execCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      editorRef.current.focus();
      if (selection && range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      document.execCommand(command, false, value);
      setStatement(editorRef.current.innerHTML);
      setShowPlaceholder(false);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    execCommand("fontSize", (size / 4).toString());
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    execCommand("foreColor", color);
    setShowColorPicker(false);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setStatement(content);
    const isEmpty =
      content.trim() === "" ||
      content === "<br>" ||
      content === "<div></div>" ||
      content === "<p></p>";
    setShowPlaceholder(isEmpty);
  };

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
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
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium text-gray-700">
              Problem Title
            </label>
            <input
              type="text"
              placeholder="Enter title here"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-sm font-medium text-gray-700">
              Level of Problem
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              <option value="">Choose the level</option>
              {levelOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-sm font-medium text-gray-700">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              <option value="">Choose Topic</option>
              {topicOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium text-gray-700">
              Choose Code Languages
            </label>
            <div className="relative" ref={languageDropdownRef}>
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full mt-1 flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[var(--default-primary)]"
              >
                <span className="text-gray-700">
                  {languages.length > 0
                    ? `${languages.length} language${
                        languages.length > 1 ? "s" : ""
                      } selected`
                    : "Select languages"}
                </span>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    showLanguageDropdown ? "transform rotate-180" : ""
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {showLanguageDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {languageOptions.map((lang) => (
                    <div
                      key={lang}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (languages.includes(lang)) {
                          setLanguages(languages.filter((l) => l !== lang));
                        } else {
                          setLanguages([...languages, lang]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={languages.includes(lang)}
                        onChange={() => {}}
                        className="h-4 w-4 text-[var(--default-primary)] focus:ring-[var(--default-primary)] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{lang}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {languages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[var(--primary-50)] text-[var(--default-primary)]"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() =>
                        setLanguages(languages.filter((l) => l !== lang))
                      }
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-[var(--default-primary)] hover:text-white focus:outline-none"
                    >
                      <span className="sr-only">Remove {lang}</span>
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-[120px]">
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

        {/* Question and Test Cases Section */}
        <div className="flex gap-4">
          {/* Question Editor */}
          <div className="flex-1">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-[var(--primary-50)] px-4 py-2 border-b flex items-center justify-between">
                <div
                  className="flex items-center relative"
                  ref={fontSizeDropdownRef}
                >
                  <div
                    className="text-sm flex items-center cursor-pointer"
                    onClick={() =>
                      setFontSizeDropdownOpen(!fontSizeDropdownOpen)
                    }
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
                    <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border overflow-y-auto z-10 max-h-32">
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
                    {" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16"
                      />{" "}
                    </svg>{" "}
                  </button>
                  <button
                    className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => execCommand("justifyCenter")}
                  >
                    {" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h8"
                      />{" "}
                    </svg>{" "}
                  </button>
                  <button
                    className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => execCommand("justifyFull")}
                  >
                    {" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />{" "}
                    </svg>{" "}
                  </button>
                  <div className="h-4 border-r border-gray-300"></div>
                  <button
                    className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => execCommand("insertOrderedList")}
                  >
                    {" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />{" "}
                    </svg>{" "}
                  </button>
                  <button
                    className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => {
                      const date = new Date().toLocaleDateString();
                      execCommand("insertText", date);
                    }}
                  >
                    {" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />{" "}
                    </svg>{" "}
                  </button>
                  <button
                    className="cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => {
                      const url = prompt("Enter the URL:");
                      if (url) execCommand("createLink", url);
                    }}
                  >
                    {" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {" "}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />{" "}
                    </svg>{" "}
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
                    Start typing here...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Test Cases Section */}
          <div className="w-1/3 min-w-[300px]">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-[var(--primary-50)] px-4 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-700">
                  Test Cases
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Test Cases (JSON)
                  </label>
                  <textarea
                    placeholder='[{"input": "0", "expected_output": "Even"}, {"input": "1", "expected_output": "Odd"}]'
                    onChange={handleTestCasesChange}
                    className={`w-full mt-1 border ${
                      testCaseError ? "border-red-500" : "border-gray-300"
                    } rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 min-h-[95px] font-mono`}
                  />
                  {testCaseError && (
                    <p className="text-red-500 text-sm mt-1">{testCaseError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
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

export default AddProblemContent;
