import React from "react";

interface CompanyLogo {
  name: string;
  logoUrl: string;
  alt: string;
}

interface CompanyLogosProps {
  companies?: CompanyLogo[];
}

const DEFAULT_COMPANIES: CompanyLogo[] = [
  {
    name: "Microsoft",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    alt: "Microsoft",
  },
  {
    name: "IBM",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
    alt: "IBM",
  },
  {
    name: "Cisco",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
    alt: "Cisco",
  },
];

export const CompanyLogosSection: React.FC<CompanyLogosProps> = ({
  companies = DEFAULT_COMPANIES,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-[var(--font-tertiary)] font-normal uppercase tracking-[0.5px]">
        Created and certified by
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {companies.map((company) => (
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
