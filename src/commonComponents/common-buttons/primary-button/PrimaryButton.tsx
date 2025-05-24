import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  children, 
  onClick, 
  className = "",
  disabled = false,
  type = 'button'
}) => {
  return (
    <button 
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`w-full h-14 rounded-xl text-white py-4 px-6 bg-[#255C79] text-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[#1E4A63] hover:scale-95 ${className}`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;