import React, { useRef, useState } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";

interface AddDevelopmentContentProps {
  onBack: () => void;
}

const AddDevelopmentContent: React.FC<AddDevelopmentContentProps> = ({
  onBack,
}) => {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [marks, setMarks] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState("#2D3748");
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const [, setStatement] = useState("");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    // Save logic here: send data to backend or store in state
    //console.log({ title, level, topic, marks, statement });
    alert("Problem content saved!");
  };

  const colorOptions = [
    "#2D3748",
    "#E53E3E",
    "#DD6B20",
    "#D69E2E",
    "#38A169",
    "#319795",
    "#3182CE",
    "#805AD5",
    "#D53F8C",
    "#000000",
  ];
  const fontSizeOptions = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];
  const levelOptions = ["Easy", "Medium", "Hard"];
  const topicOptions = ["Arrays", "Strings", "Math", "Graphs", "DP"];

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
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
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
        {/* Text Editor */}
        <div className="border rounded-lg overflow-hidden mt-3">
          <div className="bg-[#D7EFF6] px-4 py-2 border-b flex items-center justify-between">
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
                className="text-[#2D3748] font-bold cursor-pointer hover:bg-gray-200 p-1 rounded"
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
        {/* Save Button */}
        <div style={{ textAlign: "right" }}>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
          >
            Save Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDevelopmentContent;
