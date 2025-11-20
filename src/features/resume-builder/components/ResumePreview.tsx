import React from "react";
import { ResumeData, ColorScheme } from "../types/resume";
import ModernTemplate from "../templates/ModernTemplate";
import ClassicTemplate from "../templates/ClassicTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";

interface ResumePreviewProps {
  data: ResumeData;
  zoom?: number;
  themeColor?: string;
  colorScheme?: ColorScheme;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, themeColor, colorScheme }) => {
  const renderTemplate = () => {
    // Prioritize props over data to ensure updates are reflected
    const activeColorScheme = colorScheme || data.colorScheme || "Professional Blue";
    const activeThemeColor = themeColor || data.themeColor || "#3b82f6";
    
    const templateProps = {
      data,
      themeColor: activeThemeColor,
      colorScheme: activeColorScheme,
    };

    switch (data.selectedTemplate) {
      case "classic":
        return <ClassicTemplate {...templateProps} />;
      case "minimal":
        return <MinimalTemplate {...templateProps} />;
      case "modern":
      default:
        return <ModernTemplate {...templateProps} />;
    }
  };

  const hasAnyContent = () => {
    return (
      data.personalInfo.firstName ||
      data.personalInfo.lastName ||
      data.personalInfo.email ||
      data.personalInfo.summary ||
      data.experience.length > 0 ||
      data.education.length > 0 ||
      data.skills.length > 0 ||
      data.projects.length > 0 ||
      data.activities?.length > 0 ||
      data.volunteering?.length > 0 ||
      data.awards?.length > 0
    );
  };

  if (!hasAnyContent()) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center text-gray-500 p-8">
          <svg
            className="w-16 h-16 mb-4 text-[var(--primary-500)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">Resume Preview</h3>
          <p className="text-sm">
            Start filling in your information to see your resume preview
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Your resume will appear here as you add content
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full overflow-y-auto overflow-x-hidden bg-white border border-gray-200 rounded-lg" 
      data-resume-content
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorAdjust: 'exact',
      }}
    >
      <div className="min-h-full max-w-full overflow-x-hidden">{renderTemplate()}</div>
    </div>
  );
};

export default ResumePreview;
