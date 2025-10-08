import React from "react";
import { ResumeData, ResumeTemplate } from "../types/resume";
import ModernTemplate from "../templates/ModernTemplate";
import ClassicTemplate from "../templates/ClassicTemplate";
import MinimalTemplate from "../templates/MinimalTemplate";

interface TemplateSelectorProps {
  selectedTemplate: string;
  onChange: (templateId: string) => void;
  resumeData: ResumeData;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onChange,
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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Choose Template</h3>

      <div className="grid grid-cols-1 gap-6">
        {templates.map((template) => {
          const TemplateComponent = template.component;

          return (
            <div
              key={template.id}
              className={`border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                selectedTemplate === template.id
                  ? "border-[#257195] ring-2 ring-[#257195] ring-opacity-20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => onChange(template.id)}
            >
              {/* Template Info */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600">{template.preview}</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedTemplate === template.id}
                      onChange={() => onChange(template.id)}
                      className="h-4 w-4 text-[#257195] focus:ring-[#257195] border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Template Preview */}
              <div className="p-4 bg-white">
                <div className="transform scale-75 origin-top-left w-[133.33%] h-96 overflow-hidden border border-gray-200 rounded">
                  <div className="transform scale-75 origin-top-left">
                    <TemplateComponent data={resumeData} isPrint={true} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Preview Tips:</strong> The template preview shows how your
          resume will look when printed or downloaded. Click on any template to
          see it applied to your resume data in real-time.
        </p>
      </div>
    </div>
  );
};

export default TemplateSelector;
