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
      className={`w-full h-12 rounded-xl text-[var(--font-primary)] py-3 px-6 bg-[var(--neutral-100)] text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[var(--neutral-200)] border border-[var(--neutral-200)] active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
