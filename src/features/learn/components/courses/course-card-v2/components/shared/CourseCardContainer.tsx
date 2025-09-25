import React, { ReactNode } from "react";

interface CourseCardContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  height?: string; // optional: force uniform height
}

const CARD_BASE_STYLES = `bg-white rounded-2xl border border-[#e3f2fd] shadow-[0_8px_32px_rgba(0,0,0,0.1)] 
  overflow-hidden transition-all duration-300 ease-in-out 
  hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 relative flex flex-col`;

const CARD_FONT_FAMILY = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
};

export const CourseCardContainer: React.FC<CourseCardContainerProps> = ({
  children,
  className = "",
  maxWidth = "max-w-[500px]",
  // height = "h-[350px]", // default uniform height
}) => {
  return (
    <div
      className={`w-full ${maxWidth} h-[350px] ${CARD_BASE_STYLES} ${className}`}
      style={CARD_FONT_FAMILY}
    >
      {/* flex-1 ensures content expands to fill available space */}
      <div className="flex-1 flex flex-col justify-between p-4">{children}</div>
    </div>
  );
};
