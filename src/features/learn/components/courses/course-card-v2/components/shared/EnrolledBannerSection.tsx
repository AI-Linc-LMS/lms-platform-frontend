import React from "react";
import { CheckCircle } from "lucide-react";

interface EnrolledBannerSectionProps {
  variant?: "expanded" | "collapsed";
}

export const EnrolledBannerSection: React.FC<EnrolledBannerSectionProps> = ({
  variant = "expanded",
}) => {
  return (
    <div className="absolute top-0 right-0 z-10 opacity-100 visible">
      <div className="bg-gradient-to-br from-[#10b981] to-[#059669] text-[var(--font-light)] px-4 py-2 rounded-none rounded-tr-2xl rounded-bl-2xl flex items-center gap-1.5 text-xs font-semibold shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
        {variant === "expanded" ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <i className="fas fa-check-circle text-sm"></i>
        )}
        <span>Enrolled</span>
      </div>
    </div>
  );
};
