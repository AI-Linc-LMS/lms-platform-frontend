import React, { useState, useRef, useEffect } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLang } from '@codemirror/lang-html';
import { css as cssLang } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import './DevelopmentCard.css';

interface DevelopmentCardProps {
  projectId: string;
  title: string;
  description: string;
  initialHtml: string;
  initialCss: string;
  initialJs: string;
  difficulty: string;
  onSubmit: (html: string, css: string, js: string) => void;
}

const CodeMirrorDevelopmentCard: React.FC<DevelopmentCardProps> = ({
  projectId,
  title,
  description,
  initialHtml,
  initialCss,
  initialJs,
  difficulty,
  onSubmit,
}) => {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLightTheme, setIsLightTheme] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reference for the iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = () => {
    try {
      // Validate HTML, CSS, JS if needed
      onSubmit(html, css, js);
      setError(null);
    } catch (err) {
      setError(`Error submitting: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const openPreview = () => {
    try {
      // Create Blob URL from HTML, CSS, and JS
      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>${js}</script>
          </body>
        </html>
      `;
      
      // Revoke previous URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Set the preview URL and open preview
      setPreviewUrl(url);
      setIsPreviewOpen(true);
      
      // Open in a new tab/window
      window.open(url, '_blank');
      setError(null);
    } catch (err) {
      setError(`Error creating preview: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Live preview in the embedded iframe
  const updateLivePreview = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${css}</style>
            </head>
            <body>
              ${html}
              <script>${js}</script>
            </body>
          </html>
        `;
        
        iframeRef.current.contentWindow.document.open();
        iframeRef.current.contentWindow.document.write(content);
        iframeRef.current.contentWindow.document.close();
        setError(null);
      } catch (err) {
        setError(`Error updating preview: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  // Update live preview when code changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPreviewOpen) {
        updateLivePreview();
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [html, css, js, isPreviewOpen]);

  // Generate a hint for the current project
  const getHint = () => {
    if (projectId === "dev1") {
      // Hint for HTML and CSS styling project
      if (activeTab === "html") {
        return "The HTML is already set up correctly. You need to focus on styling using CSS.";
      } else if (activeTab === "css") {
        return `
/* Example solution for the CSS styling */
.inline-heading {
  color: #0000FF;
  font-size: 24px;
}

.block-paragraph {
  color: #000000;
  font-size: 16px;
  margin-bottom: 10px;
}`;
      }
    }
    
    return "Try using the problem description as a guide to complete this project.";
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  // Used to handle key commands
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Implement common keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSubmit();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      openPreview();
    }
  };

  // Get the correct language extension based on the active tab
  const getLanguageExtension = () => {
    switch (activeTab) {
      case 'html':
        return htmlLang();
      case 'css':
        return cssLang();
      case 'js':
        return javascript();
      default:
        return htmlLang();
    }
  };

  // Get the current code based on the active tab
  const getCurrentCode = () => {
    switch (activeTab) {
      case 'html':
        return html;
      case 'css':
        return css;
      case 'js':
        return js;
      default:
        return html;
    }
  };

  // Handle code change based on the active tab
  const handleCodeChange = (value: string) => {
    switch (activeTab) {
      case 'html':
        setHtml(value);
        break;
      case 'css':
        setCss(value);
        break;
      case 'js':
        setJs(value);
        break;
    }
  };

  return (
    <div 
      className="development-card bg-white rounded-lg shadow-md p-4 md:p-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="header mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">{title}</h1>
          <span className={`px-3 py-1 text-xs md:text-sm rounded-full mb-2 md:mb-0 self-start md:self-auto ${
            difficulty === "Easy" ? "bg-green-100 text-green-800" :
            difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          }`}>
            {difficulty}
          </span>
        </div>
        <p className="text-gray-600 mt-2 text-sm md:text-base">{description}</p>
        
        <div className="flex flex-wrap mt-2 gap-2">
          <button
            onClick={toggleHint}
            className="text-xs md:text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {showHint ? "Hide Hint" : "Show Hint"}
          </button>
          
          <button
            onClick={() => {
              // Reset to initial code
              setHtml(initialHtml);
              setCss(initialCss);
              setJs(initialJs);
            }}
            className="text-xs md:text-sm text-gray-600 hover:text-gray-800 focus:outline-none ml-3"
          >
            Reset Code
          </button>
        </div>
        
        {showHint && (
          <div className="mt-2 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-xs md:text-sm font-medium text-blue-800 mb-1">Hint:</h3>
            <pre className="text-xs text-blue-700 whitespace-pre-wrap font-mono overflow-x-auto">
              {getHint()}
            </pre>
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="editor-container border border-gray-200 rounded-lg">
        <div className="editor-tabs flex flex-wrap border-b border-gray-200">
          <button 
            className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium ${activeTab === "html" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("html")}
          >
            HTML
          </button>
          <button 
            className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium ${activeTab === "css" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("css")}
          >
            CSS
          </button>
          <button 
            className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium ${activeTab === "js" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("js")}
          >
            JS
          </button>
          
          <div className="ml-auto flex items-center pr-2 md:pr-4">
            <div className="flex items-center">
              <span className="text-xs md:text-sm text-gray-600 mr-1 md:mr-2">Theme</span>
              <div className="relative inline-block w-8 md:w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id="theme-toggle"
                  checked={!isLightTheme}
                  onChange={() => setIsLightTheme(!isLightTheme)}
                  className="toggle-checkbox absolute block w-4 md:w-5 h-4 md:h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="theme-toggle"
                  className={`toggle-label block overflow-hidden h-4 md:h-5 rounded-full cursor-pointer ${!isLightTheme ? "bg-blue-500" : "bg-gray-300"}`}
                ></label>
              </div>
              <span className="ml-1 md:ml-2 text-xs md:text-sm text-gray-600">
                {isLightTheme ? "Light" : "Dark"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="editor-content" style={{ height: "350px" }}>
          <CodeMirror
            value={getCurrentCode()}
            height="350px"
            theme={isLightTheme ? undefined : oneDark}
            extensions={[getLanguageExtension()]}
            onChange={handleCodeChange}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              searchKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>
      </div>
      
      <div className="actions mt-4 flex flex-col md:flex-row justify-between gap-2 md:gap-0">
        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={openPreview}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium flex items-center justify-center md:justify-start cursor-pointer"
          >
            <span className="mr-1">▶</span> Preview in New Tab
          </button>
          
          <button
            onClick={() => {
              setIsPreviewOpen(!isPreviewOpen);
              if (!isPreviewOpen) {
                // Ensure preview updates when opened
                setTimeout(updateLivePreview, 0);
              }
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium cursor-pointer"
          >
            {isPreviewOpen ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
        
        <button
          onClick={handleSubmit}
          className="bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium cursor-pointer"
        >
          Submit
        </button>
      </div>
      
      {isPreviewOpen && (
        <div className="preview-container mt-4 md:mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base md:text-lg font-semibold">Live Preview</h3>
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="preview-frame border border-gray-200 rounded">
            <iframe 
              ref={iframeRef}
              title="Preview" 
              className="w-full"
              style={{ height: "250px" }}
              sandbox="allow-scripts"
            ></iframe>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Keyboard shortcuts: Ctrl+S to submit, Ctrl+P to preview</p>
      </div>
    </div>
  );
};

export default CodeMirrorDevelopmentCard; 