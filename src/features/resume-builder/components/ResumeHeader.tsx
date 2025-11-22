import React from "react";
import ColorSchemePicker from "./ColorSchemePicker";
import TemplateDropdown from "./TemplateDropdown";
import { ResumeTemplate, ColorScheme } from "../types/resume";
import ModernTemplate from "../templates/ModernTemplate";
import ClassicTemplate from "../templates/ClassicTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";

interface ResumeHeaderProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  themeColor?: string; // Optional, for compatibility
  onColorChange?: (color: string) => void; // Optional, for compatibility
  colorScheme?: ColorScheme;
  onColorSchemeChange?: (scheme: ColorScheme, themeColor: string) => void;
  onDownloadPDF: () => void;
  onLoadSampleData?: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  resumeData: any;
}

const ResumeHeader: React.FC<ResumeHeaderProps> = ({
  selectedTemplate,
  onTemplateChange,
  colorScheme = "Professional Blue",
  onColorSchemeChange,
  onDownloadPDF,
  onLoadSampleData,
  zoom,
  onZoomChange,
  resumeData,
}) => {
  const templates: ResumeTemplate[] = [
    {
      id: "modern",
      name: "Modern",
      preview: "A contemporary design with clean lines and blue accents",
      component: ModernTemplate,
    },
    {
      id: "classic",
      name: "Classic",
      preview: "Traditional format with serif fonts and professional styling",
      component: ClassicTemplate,
    },
    {
      id: "minimal",
      name: "Minimal",
      preview: "Clean and simple design with maximum white space",
      component: MinimalTemplate,
    },
  ];

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 2);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.5);
    onZoomChange(newZoom);
  };

  const handleResetZoom = () => {
    onZoomChange(1);
  };

  return (
    <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-[100]" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
      {/* Left Section: Title, Template, and Colours */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Resume Builder</h1>
          </div>
          <div className="relative z-[10000]">
            <TemplateDropdown
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelect={onTemplateChange}
              resumeData={resumeData}
            />
          </div>
                        {onColorSchemeChange && (
                            <div className="relative z-[10000]">
                                <ColorSchemePicker
                                    currentScheme={colorScheme}
                                    onSchemeChange={onColorSchemeChange}
                                />
                            </div>
                        )}
        </div>

      {/* Right Section: Actions and Controls */}
      <div className="flex items-center gap-2.5 flex-shrink-0" style={{ overflowX: 'visible' }}>
        {/* Load Sample Data */}
        {onLoadSampleData && (
          <button
            onClick={onLoadSampleData}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
            title="Load Sample Data"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Load Sample</span>
          </button>
        )}

        <div className="h-5 w-px bg-gray-200" />

        {/* Download PDF - Prominent */}
        <button
          onClick={onDownloadPDF}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-xs font-semibold shadow-md hover:shadow-lg"
          title="Download as PDF"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>

        <div className="h-5 w-px bg-gray-200" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-all duration-200"
            title="Zoom Out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-700 min-w-[2.5rem] text-center px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-all duration-200"
            title="Zoom In"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m-3-3h6" />
            </svg>
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-all duration-200"
            title="Reset Zoom"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeHeader;

