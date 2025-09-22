import React from "react";

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-14 rounded-xl text-[#343A40] py-4 px-6 bg-[#E9ECEF] text-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[var(--netural-200)] hover:scale-95 ${className}`}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
