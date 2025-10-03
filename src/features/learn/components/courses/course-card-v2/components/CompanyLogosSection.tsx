import React from "react";
import { CompanyLogo, getEffectiveCompanies } from "../utils/courseDataUtils";

interface CompanyLogosProps {
  course?: { id: number; companies?: string[] };
  companies?: CompanyLogo[];
}

export const CompanyLogosSection: React.FC<CompanyLogosProps> = ({
  course,
  companies,
}) => {
  // Use centralized logic to get effective companies
  const effectiveCompanies = course
    ? (() => {
        const companies = getEffectiveCompanies(course);
        return companies;
      })()
    : companies || [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-[var(--font-tertiary)] font-normal uppercase tracking-[0.5px]">
        Created and certified by
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {effectiveCompanies.map((company) => (
          <div
            key={company.name}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-md text-[11px] font-semibold text-[#475569]"
          >
            <img
              src={company.logoUrl}
              alt={company.alt}
              className="w-4 h-4 object-contain"
            />
            <span>{company.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
