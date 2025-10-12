import React from "react";
import { useTranslation } from "react-i18next";

interface ContinueLearningButtonProps {
  onClick: () => void;
  fullWidth?: boolean;
  className?: string;
}

export const ContinueLearningButton: React.FC<ContinueLearningButtonProps> = ({
  onClick,
  fullWidth = true,
  className = "",
}) => {
  const { t } = useTranslation();
  
  return (
    <div className={fullWidth ? "w-full" : ""}>
      <button
        onClick={onClick}
        className={`px-5 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 text-center bg-[var(--course-cta)] text-[var(--font-light)] hover:bg-[var(--course-cta)] hover:-translate-y-0.5 ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        {t("courses.continueLearning")}
      </button>
    </div>
  );
};
