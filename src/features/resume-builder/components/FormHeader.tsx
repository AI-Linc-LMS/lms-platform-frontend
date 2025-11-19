import React from "react";

interface FormHeaderProps {
  title: string;
  onLoadSample?: () => void;
  icon?: React.ReactNode;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  onLoadSample,
  icon,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
      {/* Left: Title with Icon */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>

      {/* Right: Load Sample Button */}
      {onLoadSample && (
        <button
          onClick={onLoadSample}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 border border-purple-400"
          title="Load sample data"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Load Sample</span>
        </button>
      )}
    </div>
  );
};

export default FormHeader;

