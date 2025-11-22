import React, { useState, useRef, useEffect } from "react";
import { ColorScheme } from "../types/resume";
import { getThemeColors, ColorTheme } from "../utils/colorUtils";

interface ColorSchemePickerProps {
  currentScheme: ColorScheme;
  currentThemeColor?: string;
  onSchemeChange: (scheme: ColorScheme, themeColor: string) => void;
}

interface ThemeOption {
  id: ColorScheme;
  name: string;
  description: string;
  preview: ColorTheme;
}

const themes: ThemeOption[] = [
  {
    id: "Professional Blue",
    name: "Professional Blue",
    description: "Trustworthy and classic - perfect for corporate roles and finance",
    preview: getThemeColors("Professional Blue"),
  },
  {
    id: "Modern Green",
    name: "Modern Green",
    description: "Fresh and innovative - ideal for tech startups and engineering",
    preview: getThemeColors("Modern Green"),
  },
  {
    id: "Creative Purple",
    name: "Creative Purple",
    description: "Creative and sophisticated - great for design and marketing roles",
    preview: getThemeColors("Creative Purple"),
  },
  {
    id: "Classic Navy",
    name: "Classic Navy",
    description: "Traditional and conservative - perfect for law and consulting",
    preview: getThemeColors("Classic Navy"),
  },
];

const ColorSchemePicker: React.FC<ColorSchemePickerProps> = ({
  currentScheme,
  onSchemeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThemeSelect = (theme: ThemeOption) => {
    onSchemeChange(theme.id, theme.preview.primary);
    setIsOpen(false);
  };

  const currentTheme = getThemeColors(currentScheme);

  return (
    <div className="relative" ref={pickerRef} style={{ zIndex: 100000 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-semibold text-gray-700"
      >
        <div className="flex items-center gap-1">
          <div 
            className="w-4 h-4 rounded border border-gray-300 shadow-sm"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <div 
            className="w-3 h-3 rounded border border-gray-300 shadow-sm"
            style={{ backgroundColor: currentTheme.secondary }}
          />
        </div>
        <span>Theme</span>
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
          className="fixed bg-white border border-gray-300 rounded-xl shadow-2xl z-[100001] w-[480px] overflow-hidden"
          style={{
            top: pickerRef.current ? `${Math.max(8, pickerRef.current.getBoundingClientRect().bottom + 8)}px` : '60px',
            left: pickerRef.current ? `${pickerRef.current.getBoundingClientRect().left}px` : '0px'
          }}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">Choose Color Theme</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-600">Select a complete color theme that will be applied throughout your resume</p>
          </div>

          {/* Theme Options */}
          <div className="p-4 max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              {themes.map((theme) => {
                const isSelected = currentScheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Color Preview Swatches */}
                      <div className="flex-shrink-0">
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          <div 
                            className="w-8 h-8 rounded border-2 border-white shadow-sm"
                            style={{ backgroundColor: theme.preview.primary }}
                            title="Primary"
                          />
                          <div 
                            className="w-8 h-8 rounded border-2 border-white shadow-sm"
                            style={{ backgroundColor: theme.preview.secondary }}
                            title="Secondary"
                          />
                          <div 
                            className="w-8 h-8 rounded border-2 border-white shadow-sm"
                            style={{ backgroundColor: theme.preview.accent }}
                            title="Accent"
                          />
                          <div 
                            className="w-8 h-8 rounded border-2 border-white shadow-sm"
                            style={{ backgroundColor: theme.preview.skillBg }}
                            title="Background"
                          />
                        </div>
                        <div className="text-[9px] font-mono text-gray-500 mt-1">
                          {theme.preview.primary}
                        </div>
                      </div>

                      {/* Theme Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-base font-bold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                            {theme.name}
                          </h4>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {theme.description}
                        </p>
                        
                        {/* Mini Preview */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="px-2 py-0.5 rounded" style={{ 
                              backgroundColor: theme.preview.skillBg, 
                              color: theme.preview.primary,
                              fontWeight: 600
                            }}>
                              Sample Badge
                            </span>
                            <span style={{ color: theme.preview.primary, fontWeight: 600 }}>
                              Heading
                            </span>
                            <span style={{ color: theme.preview.textSecondary }}>
                              Text
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSchemePicker;

