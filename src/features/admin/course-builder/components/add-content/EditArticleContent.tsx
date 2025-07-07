import React, { useRef, useState, useEffect } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateSubmoduleContent,
  getSubmoduleContentById,
  ArticleContentUpdateData,
} from "../../../../../services/admin/courseApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface EditArticleContentProps {
  onBack: () => void;
  clientId: number;
  courseId: number;
  submoduleId: number;
  contentId: number;
  onSuccess?: () => void;
}

const EditArticleContent: React.FC<EditArticleContentProps> = ({
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
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState("#2D3748");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [answer, setAnswer] = useState("");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Fetch existing article data
  const { data: articleData, isLoading: isLoadingArticle } = useQuery({
    queryKey: [
      "submodule-content-detail",
      clientId,
      courseId,
      submoduleId,
      contentId,
    ],
    queryFn: () => {
      //console.log("=== FETCHING ARTICLE DATA FOR EDIT ===");
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
    if (articleData) {
      //console.log("=== LOADED ARTICLE DATA FOR EDITING ===");
      //console.log("Article data:", articleData);

      const contentDetails = articleData.details || articleData;

      setTitle(contentDetails.title || articleData.title || "");
      setMarks(
        contentDetails.marks?.toString() || articleData.marks?.toString() || ""
      );

      const content = contentDetails.content || articleData.content || "";
      setAnswer(content);
      setShowPlaceholder(!content.trim());

      // Set content in editor
      if (editorRef.current && content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [articleData]);

  const updateMutation = useMutation({
    mutationFn: (data: ArticleContentUpdateData) => {
      //console.log("=== UPDATING ARTICLE ===");
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
      //console.log("✅ Article updated successfully!");
      success("Article Updated", "Article content updated successfully!");
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodule") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("articles") ||
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
      //console.error("❌ Failed to update article:", error);
      showError(
        "Update Failed",
        error.message || "Failed to update article content"
      );
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      showError("Validation Error", "Please enter a title");
      return;
    }

    if (!answer.trim()) {
      showError("Validation Error", "Please enter content");
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


    const contentData: ArticleContentUpdateData = {
      title: title.trim(),
      content: answer.trim(),
      marks: marksNumber,
    };

    updateMutation.mutate(contentData);
  };

  const colorOptions = [
    "#2D3748", // Default dark gray/blue
    "#E53E3E", // Red
    "#DD6B20", // Orange
    "#D69E2E", // Yellow
    "#38A169", // Green
    "#319795", // Teal
    "#3182CE", // Blue
    "#805AD5", // Purple
    "#D53F8C", // Pink
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

      // Update answer state with new content
      setAnswer(editorRef.current.innerHTML);
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
    setAnswer(content);
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

  if (isLoadingArticle) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#255C79]"></div>
          <span className="ml-2 text-gray-600">Loading article data...</span>
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
        <h2 className="text-xl font-semibold text-gray-800">Edit Article</h2>
        <p className="text-sm text-gray-600">Update the article information</p>
      </div>

      {/* Inputs */}
      <div className="border border-gray-300 rounded-lg p-2 px-4 space-y-4">
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Article Title
              </label>
              <input
                type="text"
                placeholder="Enter title here"
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
                placeholder="Enter Marks"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Content</label>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-t bg-gray-50">
            {/* Font Size Dropdown */}
            <div className="relative" ref={fontSizeDropdownRef}>
              <button
                type="button"
                onClick={() => setFontSizeDropdownOpen(!fontSizeDropdownOpen)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                disabled={updateMutation.isPending}
              >
                {fontSize}px
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {fontSizeDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
                  {fontSizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        handleFontSizeChange(size);
                        setFontSizeDropdownOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                      disabled={updateMutation.isPending}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text Color */}
            <div className="relative" ref={colorPickerRef}>
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                disabled={updateMutation.isPending}
              >
                <div
                  className="w-4 h-4 border border-gray-300 rounded"
                  style={{ backgroundColor: textColor }}
                ></div>
                Color
              </button>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        disabled={updateMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Formatting Buttons */}
            <button
              type="button"
              onClick={() => execCommand("bold")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 font-bold"
              disabled={updateMutation.isPending}
            >
              B
            </button>

            <button
              type="button"
              onClick={() => execCommand("italic")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 italic"
              disabled={updateMutation.isPending}
            >
              I
            </button>

            <button
              type="button"
              onClick={() => execCommand("underline")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 underline"
              disabled={updateMutation.isPending}
            >
              U
            </button>

            {/* Alignment */}
            <button
              type="button"
              onClick={() => execCommand("justifyLeft")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              disabled={updateMutation.isPending}
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => execCommand("justifyCenter")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              disabled={updateMutation.isPending}
            >
              ↔
            </button>

            <button
              type="button"
              onClick={() => execCommand("justifyRight")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              disabled={updateMutation.isPending}
            >
              →
            </button>

            {/* Lists */}
            <button
              type="button"
              onClick={() => execCommand("insertUnorderedList")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              disabled={updateMutation.isPending}
            >
              • List
            </button>

            <button
              type="button"
              onClick={() => execCommand("insertOrderedList")}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              disabled={updateMutation.isPending}
            >
              1. List
            </button>
          </div>

          {/* Editor */}
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable={!updateMutation.isPending}
              onInput={handleInput}
              onClick={focusEditor}
              className={`min-h-[200px] p-3 border border-gray-300 rounded-b focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white ${
                updateMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ fontSize: `${fontSize}px`, color: textColor }}
            />
            {showPlaceholder && (
              <div
                className="absolute top-3 left-3 text-gray-400 pointer-events-none"
                style={{ fontSize: `${fontSize}px` }}
              >
                Start writing your article content here...
              </div>
            )}
          </div>
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
            className="px-6 py-2 text-sm font-medium text-white bg-[#255C79] border border-transparent rounded-lg hover:bg-[#1e4a61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255C79] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updateMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              "Update Article"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditArticleContent;
