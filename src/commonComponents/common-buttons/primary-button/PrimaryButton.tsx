import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  children, 
  onClick, 
  className = "",
  disabled = false
}) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-14 rounded-xl  text-white py-4 px-6 bg-[#255C79]   text-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;