import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  label = "Description",
  disabled = false,
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState("#2D3748");
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const fontSizeOptions = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];

  // Helper function to check if content is empty
  const isContentEmpty = (content: string) => {
    if (!content) return true;
    const trimmed = content.trim();
    return trimmed === "" || 
           trimmed === "<br>" || 
           trimmed === "<div></div>" || 
           trimmed === "<p></p>" ||
           trimmed === "<div><br></div>" ||
           trimmed === "<p><br></p>";
  };

  // Initialize editor content and handle updates
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      const isEmpty = isContentEmpty(value);
      
      // Only update innerHTML if the content has actually changed
      // This prevents cursor position issues during editing
      if (currentContent !== value && (value || !isInitialized)) {
        editorRef.current.innerHTML = value || "";
        setIsInitialized(true);
      }
      
      setShowPlaceholder(isEmpty);
    }
  }, [value, isInitialized]);

  // Initialize on mount
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      const isEmpty = isContentEmpty(value);
      editorRef.current.innerHTML = value || "";
      setShowPlaceholder(isEmpty);
      setIsInitialized(true);
    }
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontSizeDropdownRef.current && !fontSizeDropdownRef.current.contains(event.target as Node)) {
        setFontSizeDropdownOpen(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Execute formatting command
  const execCommand = (command: string, value: string = "") => {
    if (editorRef.current && !disabled) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      editorRef.current.focus();
      
      if (selection && range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      document.execCommand(command, false, value);
      
      const content = editorRef.current.innerHTML;
      onChange(content);
      setShowPlaceholder(isContentEmpty(content));
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    execCommand("fontSize", (size / 4).toString());
    setFontSizeDropdownOpen(false);
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    execCommand("foreColor", color);
    setShowColorPicker(false);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const content = e.currentTarget.innerHTML;
    onChange(content);
    const isEmpty = isContentEmpty(content);
    setShowPlaceholder(isEmpty);
  };

  const focusEditor = () => {
    if (editorRef.current && !disabled) {
      editorRef.current.focus();
      
      // Hide placeholder when focused, even if empty
      if (showPlaceholder) {
        setShowPlaceholder(false);
      }
      
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

  const handleBlur = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const isEmpty = isContentEmpty(content);
      setShowPlaceholder(isEmpty);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-t bg-gray-50">
        {/* Font Size Dropdown */}
        <div className="relative" ref={fontSizeDropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setFontSizeDropdownOpen(!fontSizeDropdownOpen)}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            {fontSize}px
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {fontSizeDropdownOpen && !disabled && (
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border z-10 max-h-40 overflow-y-auto">
              {fontSizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleFontSizeChange(size)}
                  className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                >
                  {size}px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Picker */}
        <div className="relative" ref={colorPickerRef}>
          <div
            className="h-6 w-6 rounded-full cursor-pointer border border-gray-300"
            style={{ backgroundColor: textColor }}
            onClick={() => !disabled && setShowColorPicker(!showColorPicker)}
          />

          {showColorPicker && !disabled && (
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border p-2 z-10 grid grid-cols-5 gap-1">
              {colorOptions.map((color) => (
                <div
                  key={color}
                  className="h-5 w-5 rounded-full cursor-pointer border border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Formatting Buttons */}
        <button
          type="button"
          className="font-bold cursor-pointer hover:bg-gray-200 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => execCommand("bold")}
          disabled={disabled}
        >
          B
        </button>

        <button
          type="button"
          className="italic font-medium cursor-pointer hover:bg-gray-200 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => execCommand("italic")}
          disabled={disabled}
        >
          I
        </button>

        <button
          type="button"
          className="underline font-medium cursor-pointer hover:bg-gray-200 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => execCommand("underline")}
          disabled={disabled}
        >
          U
        </button>

        <button
          type="button"
          className="cursor-pointer hover:bg-gray-200 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => execCommand("insertUnorderedList")}
          disabled={disabled}
        >
          • List
        </button>

        <button
          type="button"
          className="cursor-pointer hover:bg-gray-200 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => execCommand("insertOrderedList")}
          disabled={disabled}
        >
          1. List
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onFocus={focusEditor}
          onBlur={handleBlur}
          className={`w-full min-h-[120px] max-h-[300px] overflow-y-auto p-3 border border-gray-300 rounded-b focus:outline-none focus:ring-1 focus:ring-gray-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
          style={{ fontSize: `${fontSize}px`, color: textColor }}
          suppressContentEditableWarning={true}
        />
        
        {showPlaceholder && (
          <div
            className="absolute top-3 left-3 text-gray-400 pointer-events-none"
            style={{ fontSize: `${fontSize}px` }}
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor; 