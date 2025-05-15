import React, { useState, useEffect } from 'react';

interface IDEThemeToggleProps {
  className?: string;
}

export const IDEThemeToggle: React.FC<IDEThemeToggleProps> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ide-theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('ide-theme', theme);
    
    // Apply theme to IDE container
    const ideContainer = document.querySelector('.ide-container');
    if (ideContainer) {
      ideContainer.classList.toggle('dark-theme', isDark);
    }
  }, [isDark]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => setIsDark(!isDark)}
        className="flex items-center px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="mr-2 text-sm font-medium">
          {isDark ? 'Dark' : 'Light'}
        </span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isDark ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          )}
        </svg>
      </button>
    </div>
  );
}; 