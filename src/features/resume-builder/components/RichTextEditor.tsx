import React, { useRef, useEffect, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      checkActiveCommands();
    }
  };

  const checkActiveCommands = () => {
    if (!editorRef.current || !isFocused) return;
    try {
      const active = new Set<string>();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        ['bold', 'italic', 'underline'].forEach(cmd => {
          try {
            if (document.queryCommandState(cmd)) {
              active.add(cmd);
            }
          } catch (e) {
            // Ignore errors for unsupported commands
          }
        });
      }
      setActiveCommands(active);
    } catch (e) {
      // Ignore errors
    }
  };

  const execCommand = (command: string, value: string | null = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
      // Ensure there's a selection or create one at cursor
      const selection = window.getSelection();
      if (!selection) return;
      
      if (selection.rangeCount === 0) {
        // Create a collapsed range at the end
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      try {
        // For list commands, check if we're in a list and toggle
        if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
          const currentRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          if (!currentRange) return;
          
          const parent = currentRange.commonAncestorContainer;
          const listParent = (parent.nodeType === Node.TEXT_NODE ? parent.parentElement : parent as Element)?.closest('ul, ol');
          
          if (listParent) {
            // If we're in a list, remove list formatting
            document.execCommand('formatBlock', false, '<p>');
          } else {
          // Otherwise, apply list formatting
          document.execCommand(command, false);
        }
      } else {
        document.execCommand(command, false, value || undefined);
      }
      
      handleInput();
      // Check active commands after a brief delay to ensure state is updated
      setTimeout(() => {
        if (editorRef.current && document.activeElement === editorRef.current) {
          checkActiveCommands();
        }
      }, 10);
    } catch (e) {
      console.error('Command execution error:', e);
    }
  };

  const isActive = (command: string) => {
    return activeCommands.has(command);
  };

  useEffect(() => {
    if (editorRef.current && !isFocused) {
      if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isFocused]);

  // Check active commands when focus changes
  useEffect(() => {
    if (isFocused) {
      setTimeout(checkActiveCommands, 50);
    }
  }, [isFocused]);

  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    isActive?: boolean;
    title: string;
  }> = ({ onClick, icon, isActive: active, title }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
        active
          ? "bg-blue-100 text-blue-700 border border-blue-300"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
      }`}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm ${className}`}>
      {/* Editor - Text Field */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => {
          setIsFocused(true);
          setTimeout(checkActiveCommands, 50);
        }}
        onBlur={() => setIsFocused(false)}
        onMouseUp={checkActiveCommands}
        onKeyUp={checkActiveCommands}
        className={`min-h-[120px] p-3 focus:outline-none text-gray-900 text-sm ${
          isFocused ? "ring-2 ring-blue-500 ring-opacity-50" : ""
        }`}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      {/* Toolbar - Below text field */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => execCommand("bold")}
            isActive={isActive("bold")}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            }
            title="Bold (Ctrl+B)"
          />
          <ToolbarButton
            onClick={() => execCommand("italic")}
            isActive={isActive("italic")}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            }
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton
            onClick={() => execCommand("underline")}
            isActive={isActive("underline")}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 19h14M5 5h14" />
              </svg>
            }
            title="Underline (Ctrl+U)"
          />
          
          <div className="w-px h-5 bg-gray-300 mx-0.5" />
          
          {/* Lists */}
          <ToolbarButton
            onClick={() => execCommand("insertUnorderedList")}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
            title="Bullet List"
          />
          <ToolbarButton
            onClick={() => execCommand("insertOrderedList")}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            }
            title="Numbered List"
          />
          
          <div className="w-px h-5 bg-gray-300 mx-0.5" />
          
          {/* Clear Formatting */}
          <ToolbarButton
            onClick={() => {
              execCommand("removeFormat");
              execCommand("formatBlock", "<p>");
            }}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            title="Clear Formatting"
          />
        </div>
      </div>
      
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] strong, [contenteditable] b {
          font-weight: 600;
        }
        [contenteditable] em, [contenteditable] i {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
