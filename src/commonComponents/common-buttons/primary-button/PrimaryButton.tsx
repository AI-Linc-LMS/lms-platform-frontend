import React from "react";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`w-full h-12 rounded-xl text-white py-3 px-6 text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-[var(--primary-500)] hover:bg-[var(--primary-600)] shadow-sm hover:shadow-md active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
