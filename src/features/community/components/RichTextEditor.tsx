import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  ChevronDown,
  ChevronUp,
  Code,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  ImageIcon,
  Link,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  height = "h-32",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const handleCommand = (command: string, commandValue?: string) => {
    if (editorRef.current) {
      document.execCommand(command, false, commandValue);
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result && editorRef.current) {
          const img = `<img src="${result}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 4px;" />`;
          editorRef.current.focus();
          document.execCommand("insertHTML", false, img);
          onChange(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const insertCodeBlock = () => {
    const language = prompt("Enter programming language (optional):") || "";
    const code = prompt("Enter your code:");
    if (code && editorRef.current) {
      const codeBlock = `<div style="margin: 10px 0;"><div style="background: var(--netural-50); padding: 8px 12px; border-radius: 4px 4px 0 0; border-bottom: 1px solid #e9ecef; font-size: 12px; color: var(--netural-300); font-weight: 500;">${
        language || "Code"
      }</div><pre style="background: var(--netural-50); padding: 12px; margin: 0; border-radius: 0 0 4px 4px; overflow-x: auto; border: 1px solid #e9ecef; border-top: none;"><code style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 14px; color: #212529; line-height: 1.4;">${code
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</code></pre></div>`;
      editorRef.current.focus();
      document.execCommand("insertHTML", false, codeBlock);
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      handleCommand("createLink", url);
    }
  };

  const handleInput = () => {
    if (editorRef.current && !isComposing) {
      const content = editorRef.current.innerHTML;
      onChange(content === "<br>" ? "" : content);
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => {
    setIsComposing(false);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      document.execCommand("insertParagraph", false);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text =
      e.clipboardData.getData("text/html") ||
      e.clipboardData.getData("text/plain");

    if (text) {
      const content = e.clipboardData.types.includes("text/html")
        ? text
        : `<p>${text.replace(/\n/g, "</p><p>")}</p>`;

      document.execCommand("insertHTML", false, content);
      handleInput();
    }
  };

  useEffect(() => {
    if (
      editorRef.current &&
      !editorRef.current.contains(document.activeElement)
    ) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Toolbar */}
      <div
        className={`border-b border-gray-200 p-2 ${
          showToolbar ? "block" : "hidden sm:block"
        }`}
      >
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handleCommand("bold")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand("italic")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={insertCodeBlock}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Code Block"
          >
            <Code size={16} />
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => handleCommand("insertUnorderedList")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand("insertOrderedList")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand("formatBlock", "blockquote")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Quote"
          >
            <Quote size={16} />
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={insertLink}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Insert Link"
          >
            <Link size={16} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Upload Image"
          >
            <ImageIcon size={16} />
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => handleCommand("undo")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand("redo")}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>

      {/* Mobile toolbar toggle */}
      <div className="sm:hidden p-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          {showToolbar ? "Hide" : "Show"} formatting tools
          {showToolbar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={`w-full px-3 py-2 ${height} focus:outline-none overflow-y-auto text-sm sm:text-base`}
        style={{ minHeight: "80px" }}
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={!value ? placeholder : ""}
        suppressContentEditableWarning={true}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--font-tertiary);
          pointer-events: none;
        }
        [contenteditable] {
          direction: ltr !important;
          text-align: left !important;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: var(--font-secondary);
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 20px;
          margin: 10px 0;
        }
        [contenteditable] li {
          margin: 4px 0;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        [contenteditable] strong {
          font-weight: bold;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        [contenteditable] pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        [contenteditable] p {
          margin: 0;
          min-height: 1.2em;
        }
        [contenteditable] p:empty::before {
          content: '';
          display: inline-block;
          min-width: 1px;
        }
        `,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
