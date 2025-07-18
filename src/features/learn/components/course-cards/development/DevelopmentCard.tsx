import React, { useState, useEffect } from "react";
import './DevelopmentCard.css';
import useMediaQuery from '../../../../../hooks/useMediaQuery';
import SwitchToDesktopModal from '../../../../../commonComponents/modals/SwitchToDesktopModal';

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

const DevelopmentCard: React.FC<DevelopmentCardProps> = ({
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
  const [showHint, setShowHint] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  // Generate preview content whenever code changes
  useEffect(() => {
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
    setPreviewContent(content);
  }, [html, css, js]);

  useEffect(() => {
    if (isMobile) {
      setShowDesktopModal(true);
    }
  }, [isMobile]);

  const handleSubmit = () => {
    onSubmit(html, css, js);
  };

  const openPreview = () => {
    // Create a new window with the content
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(previewContent);
      newWindow.document.close();
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

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

  const themeClass = isDarkTheme ? "dark-theme" : "light-theme";

  return (
    <div className="w-full">
      <SwitchToDesktopModal
        isOpen={showDesktopModal}
        onClose={() => setShowDesktopModal(false)}
      />

      <div className={`development-card ${themeClass} bg-white rounded-lg shadow-md p-4 md:p-6`}>
        <div className="header mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">{title}</h1>
            <div className="flex gap-2 items-center">
              <span className={`px-3 py-1 text-xs md:text-sm rounded-full mb-2 md:mb-0 self-start md:self-auto ${difficulty === "Easy" ? "bg-green-100 text-green-800" :
                difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                {difficulty}
              </span>
              <button
                onClick={toggleTheme}
                className="theme-toggle px-3 py-1 text-xs md:text-sm rounded-full self-start md:self-auto"
              >
                {isDarkTheme ? "🌞 Light" : "🌙 Dark"}
              </button>
            </div>
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
            <div className={`mt-2 p-2 md:p-3 rounded-md hint-container ${isDarkTheme ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className="text-xs md:text-sm font-medium mb-1">Hint:</h3>
              <pre className="text-xs whitespace-pre-wrap font-mono overflow-x-auto">
                {getHint()}
              </pre>
            </div>
          )}
        </div>

        <div className="editor-container border border-gray-200 rounded-lg">
          <div className="editor-tabs flex flex-wrap border-b border-gray-200">
            <button
              className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium ${activeTab === "html" ? "border-b-2 border-blue-500 active" : ""}`}
              onClick={() => setActiveTab("html")}
            >
              HTML
            </button>
            <button
              className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium ${activeTab === "css" ? "border-b-2 border-blue-500 active" : ""}`}
              onClick={() => setActiveTab("css")}
            >
              CSS
            </button>
            <button
              className={`px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium ${activeTab === "js" ? "border-b-2 border-blue-500 active" : ""}`}
              onClick={() => setActiveTab("js")}
            >
              JS
            </button>
          </div>

          <div className="editor-content">
            {activeTab === "html" && (
              <textarea
                className="w-full p-4 font-mono text-sm focus:outline-none border-none"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="Write your HTML here..."
                spellCheck="false"
              />
            )}

            {activeTab === "css" && (
              <textarea
                className="w-full p-4 font-mono text-sm focus:outline-none border-none"
                value={css}
                onChange={(e) => setCss(e.target.value)}
                placeholder="Write your CSS here..."
                spellCheck="false"
              />
            )}

            {activeTab === "js" && (
              <textarea
                className="w-full p-4 font-mono text-sm focus:outline-none border-none"
                value={js}
                onChange={(e) => setJs(e.target.value)}
                placeholder="Write your JavaScript here..."
                spellCheck="false"
              />
            )}
          </div>
        </div>

        <div className="actions mt-4 flex flex-col md:flex-row justify-between gap-2 md:gap-0">
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={openPreview}
              className="bg-[#255c79] hover:bg- text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium flex items-center justify-center md:justify-start cursor-pointer scale-100 hover:scale-105 transition-transform duration-200"
            >
              <span className="mr-1">▶</span> Preview in New Tab
            </button>

            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
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
                srcDoc={previewContent}
                title="Preview"
                className="w-full"
                sandbox="allow-scripts"
              ></iframe>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500">
          <p>Tip: Use the Preview button to see your changes in a new tab</p>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentCard; 