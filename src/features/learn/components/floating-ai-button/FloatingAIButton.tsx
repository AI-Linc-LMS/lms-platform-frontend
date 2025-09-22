import React from "react";

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 right-6">
      <button
        onClick={onClick}
        className="bg-[var(--default-primary)] text-white px-4 py-2 rounded-full flex items-center shadow-lg cursor-pointer"
      >
        <span className="mr-2">Got a question? Ask AI</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
  );
};

export default FloatingAIButton;
