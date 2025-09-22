import React, { useState, useEffect, useRef } from 'react';
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
  Moon,
  Sun,
  Eye,
  Edit
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import RichContentDisplay from './RichContentDisplay';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  darkMode?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...", 
  height = "h-32",
  darkMode = false 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(darkMode);
  const [showPreview, setShowPreview] = useState(false);

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
          document.execCommand('insertHTML', false, img);
          onChange(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const insertCodeBlock = () => {
    const language = prompt('Enter programming language (e.g., javascript, python, html):') || '';
    const code = prompt('Enter your code:');
    if (code && editorRef.current) {
      const languageClass = language ? `language-${language.toLowerCase()}` : 'language-text';
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      
      // Create code block with proper formatting and indentation
      const formattedCode = formatCodeWithIndentation(escapedCode);
      
      const codeBlockId = `code-block-${Date.now()}`;
      const codeBlock = `
        <div class="code-block-wrapper" style="margin: 16px 0; border-radius: 8px; overflow: hidden; ${isDarkMode ? 'background: #1e1e1e;' : 'background: #f8f9fa;'} border: 1px solid ${isDarkMode ? '#404040' : '#e9ecef'};">
          <div class="code-header" style="padding: 8px 16px; ${isDarkMode ? 'background: #2d2d2d; color: #cccccc;' : 'background: #f1f3f4; color: #5f6368;'} border-bottom: 1px solid ${isDarkMode ? '#404040' : '#e9ecef'}; font-size: 12px; font-weight: 500; display: flex; justify-content: space-between; align-items: center;">
            <span>${language || 'Plain Text'}</span>
            <button onclick="copyCodeToClipboard('${codeBlockId}')" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 11px; opacity: 0.7; hover:opacity: 1;">Copy</button>
          </div>
          <pre id="${codeBlockId}" class="code-content ${languageClass}" style="padding: 16px; margin: 0; overflow-x: auto; ${isDarkMode ? 'background: #1e1e1e; color: #d4d4d4;' : 'background: #ffffff; color: #333333;'} font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace; font-size: 14px; line-height: 1.5; white-space: pre; tab-size: 2;"><code class="${languageClass}">${formattedCode}</code></pre>
        </div>`;
      
      editorRef.current.focus();
      document.execCommand('insertHTML', false, codeBlock);
      onChange(editorRef.current.innerHTML);
      
      // Apply syntax highlighting after insertion
      setTimeout(() => {
        highlightCodeBlocks();
      }, 100);
    }
  };

  const formatCodeWithIndentation = (code: string): string => {
    const lines = code.split('\n');
    let indentLevel = 0;
    const indentSize = 2; // 2 spaces per indent level
    
    return lines.map(line => {
      const trimmedLine = line.trim();
      
      // Decrease indent for closing brackets/braces
      if (trimmedLine.match(/^[}\]]/)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmedLine;
      
      // Increase indent for opening brackets/braces
      if (trimmedLine.match(/[{[]$/)) {
        indentLevel++;
      }
      
      return indentedLine;
    }).join('\n');
  };

  const highlightCodeBlocks = () => {
    if (editorRef.current) {
      const codeBlocks = editorRef.current.querySelectorAll('pre code[class*="language-"]');
      codeBlocks.forEach((block) => {
        Prism.highlightElement(block as Element);
      });
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleInput = () => {
    if (editorRef.current && !isComposing) {
      const content = editorRef.current.innerHTML;
      onChange(content === '<br>' ? '' : content);
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => {
    setIsComposing(false);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      document.execCommand('insertParagraph', false);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');

    if (text) {
      const content = e.clipboardData.types.includes('text/html')
        ? text
        : `<p>${text.replace(/\n/g, '</p><p>')}</p>`;

      document.execCommand('insertHTML', false, content);
      handleInput();
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Copy code to clipboard function (global)
  useEffect(() => {
    (window as unknown as { copyCodeToClipboard: (id: string) => void }).copyCodeToClipboard = (codeBlockId: string) => {
      const codeElement = document.getElementById(codeBlockId);
      if (codeElement) {
        const textContent = codeElement.textContent || '';
        navigator.clipboard.writeText(textContent).then(() => {
          // Show temporary success message
          const button = codeElement.parentElement?.querySelector('button');
          if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }
        });
      }
    };

    return () => {
      delete (window as unknown as { copyCodeToClipboard?: (id: string) => void }).copyCodeToClipboard;
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.innerHTML = value || '';
      // Highlight any existing code blocks
      setTimeout(() => {
        highlightCodeBlocks();
      }, 100);
    }
  }, [value]);

  useEffect(() => {
    setIsDarkMode(darkMode);
  }, [darkMode]);

  return (
    <div className={`border rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
      {/* Toolbar */}
      <div className={`border-b p-2 ${showToolbar ? 'block' : 'hidden sm:block'} ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex flex-wrap gap-1 justify-between">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => handleCommand('bold')}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('italic')}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={insertCodeBlock}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Code Block"
            >
              <Code size={16} />
            </button>
            <div className={`w-px mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <button
              type="button"
              onClick={() => handleCommand('insertUnorderedList')}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('insertOrderedList')}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('formatBlock', 'blockquote')}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Quote"
            >
              <Quote size={16} />
            </button>
            <div className={`w-px mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <button
              type="button"
              onClick={insertLink}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Insert Link"
            >
              <Link size={16} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Upload Image"
            >
              <ImageIcon size={16} />
            </button>
            <div className={`w-px mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <button
              type="button"
              onClick={() => handleCommand('undo')}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Undo"
            >
              <Undo size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleCommand('redo')}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              title="Redo"
            >
              <Redo size={16} />
            </button>
          </div>
          
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded transition-colors ${showPreview ? (isDarkMode ? 'text-blue-400 bg-gray-700' : 'text-blue-600 bg-blue-50') : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
            title={showPreview ? "Switch to Editor" : "Show Preview"}
          >
            {showPreview ? <Edit size={16} /> : <Eye size={16} />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2 rounded transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile toolbar toggle */}
      <div className={`sm:hidden p-2 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className={`flex items-center gap-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
        >
          {showToolbar ? 'Hide' : 'Show'} formatting tools
          {showToolbar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Editor/Preview Section */}
      {showPreview ? (
        /* Preview Mode */
        <div className={`w-full px-3 py-2 ${height} overflow-y-auto text-sm sm:text-base transition-colors ${isDarkMode ? 'text-gray-200 bg-gray-800' : 'text-gray-900 bg-white'}`}
             style={{ minHeight: '80px' }}>
          {value ? (
            <RichContentDisplay
              content={value}
              darkMode={isDarkMode}
              className="prose prose-sm max-w-none"
            />
          ) : (
            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
              {placeholder}
            </div>
          )}
        </div>
      ) : (
        /* Editor Mode */
        <div
          ref={editorRef}
          contentEditable
          className={`w-full px-3 py-2 ${height} focus:outline-none overflow-y-auto text-sm sm:text-base transition-colors ${isDarkMode ? 'text-gray-200 bg-gray-800' : 'text-gray-900 bg-white'}`}
          style={{ minHeight: '80px' }}
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder={!value ? placeholder : ''}
          suppressContentEditableWarning={true}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${isDarkMode ? '#9ca3af' : '#9ca3af'};
          pointer-events: none;
        }
        [contenteditable] {
          direction: ltr !important;
          text-align: left !important;
        }
        [contenteditable] blockquote {
          border-left: 4px solid ${isDarkMode ? '#4b5563' : '#d1d5db'};
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
          background: ${isDarkMode ? '#374151' : '#f9fafb'};
          border-radius: 4px;
          padding: 12px 16px;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 20px;
          margin: 10px 0;
        }
        [contenteditable] li {
          margin: 4px 0;
        }
        [contenteditable] a {
          color: ${isDarkMode ? '#60a5fa' : '#2563eb'};
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
        
        /* Code block specific styles */
        .code-block-wrapper {
          font-family: inherit;
        }
        
        .code-content {
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace !important;
        }
        
        .code-header button:hover {
          opacity: 1 !important;
        }
        
        /* Prism theme override for dark mode */
        ${isDarkMode ? `
        .code-content.language-javascript,
        .code-content.language-typescript,
        .code-content.language-jsx,
        .code-content.language-tsx,
        .code-content.language-python,
        .code-content.language-java,
        .code-content.language-css,
        .code-content.language-html,
        .code-content.language-json {
          background: #1e1e1e !important;
          color: #d4d4d4 !important;
        }
        .code-content .token.comment { color: #6a9955; }
        .code-content .token.string { color: #ce9178; }
        .code-content .token.number { color: #b5cea8; }
        .code-content .token.boolean { color: #569cd6; }
        .code-content .token.keyword { color: #c586c0; }
        .code-content .token.function { color: #dcdcaa; }
        .code-content .token.class-name { color: #4ec9b0; }
        .code-content .token.operator { color: #d4d4d4; }
        .code-content .token.punctuation { color: #cccccc; }
        ` : `
        .code-content .token.comment { color: #008000; }
        .code-content .token.string { color: #a31515; }
        .code-content .token.number { color: #098658; }
        .code-content .token.boolean { color: #0000ff; }
        .code-content .token.keyword { color: #0000ff; }
        .code-content .token.function { color: #795e26; }
        .code-content .token.class-name { color: #267f99; }
        .code-content .token.operator { color: #000000; }
        .code-content .token.punctuation { color: #000000; }
        `}
        `
      }} />
    </div>
  );
};

export default RichTextEditor;
