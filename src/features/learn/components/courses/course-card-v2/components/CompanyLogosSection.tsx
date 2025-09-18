import React from "react";

interface CompanyLogo {
  name: string;
  logoUrl: string;
  alt: string;
}

interface CompanyLogosProps {
  companies?: CompanyLogo[];
}

export const CompanyLogosSection: React.FC<CompanyLogosProps> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-[#9ca3af] font-normal uppercase tracking-[0.5px]">
        Created and certified by
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {companies.map((company) => (
          <div
            key={company.name}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-md text-[11px] font-semibold text-[#475569]"
          >
            <img src={company.logoUrl} alt={company.alt} className="w-4 h-4 object-contain" />
            <span>{company.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
