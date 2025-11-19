import React, { useState, useRef, useEffect } from "react";
import { ResumeTemplate } from "../types/resume";

interface TemplateDropdownProps {
  templates: ResumeTemplate[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
  resumeData: any;
}

const TemplateDropdown: React.FC<TemplateDropdownProps> = ({
  templates,
  selectedTemplate,
  onSelect,
  resumeData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} style={{ zIndex: 100000 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-semibold text-gray-700"
      >
        <span>
          {templates.find((t) => t.id === selectedTemplate)?.name || "Template"}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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

      {isOpen && (
        <div 
          className="fixed bg-white border border-gray-300 rounded-xl shadow-xl z-[100001] min-w-[320px] max-h-[600px] overflow-y-auto"
          style={{
            top: dropdownRef.current ? `${Math.max(8, dropdownRef.current.getBoundingClientRect().top - 620)}px` : '60px',
            left: dropdownRef.current ? `${dropdownRef.current.getBoundingClientRect().left}px` : '0px'
          }}
        >
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Choose Template</h3>
            <p className="text-xs text-gray-500 mt-1">Select a template design for your resume</p>
          </div>
          <div className="p-2">
            {templates.map((template) => {
              const TemplateComponent = template.component;
              const isSelected = selectedTemplate === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => {
                    onSelect(template.id);
                    setIsOpen(false);
                  }}
                  className={`relative p-4 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 shadow-md ring-2 ring-blue-200"
                      : "border border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                      {template.name}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{template.preview}</p>
                  <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="transform scale-[0.35] origin-top-left w-[285%] h-56 overflow-hidden">
                      <TemplateComponent 
                        data={resumeData} 
                        isPrint={true}
                        themeColor={resumeData.themeColor || "#3b82f6"}
                        colorScheme={resumeData.colorScheme || "Professional Blue"}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateDropdown;

