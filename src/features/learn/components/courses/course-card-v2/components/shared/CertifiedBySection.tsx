import React from "react";

interface CertifiedBySectionProps {
  trustedCompanies: Array<{ name: string; color?: string } | string>;
  maxVisible?: number;
}

// Company logo mapping for major tech companies - using the same URLs as CompanyLogosSection
const getCompanyLogo = (companyName: string) => {
  const name = companyName.toLowerCase();

  // Map of company names to their logo URLs
  const companyLogoMap: Record<string, string> = {
    microsoft:
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    google:
      "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    amazon:
      "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    apple:
      "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    meta: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    netflix:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    tesla:
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg",
    ibm: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
    oracle:
      "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
    salesforce:
      "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
    cisco:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
  };

  return companyLogoMap[name] || null;
};

export const CertifiedBySection: React.FC<CertifiedBySectionProps> = ({
  trustedCompanies,
  maxVisible = 3,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-[#9ca3af] font-normal uppercase tracking-[0.5px]">
        Created and certified by
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {trustedCompanies.slice(0, maxVisible).map((company, index) => {
          const companyName =
            typeof company === "string" ? company : company.name;
          const logoUrl = getCompanyLogo(companyName);

          return (
            <div
              key={index}
              className="flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-md text-[11px] font-semibold text-[#475569] hover:shadow-sm transition-shadow duration-200"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <div className="w-4 h-4 rounded-sm bg-[#6B7280] flex items-center justify-center text-white text-[8px] font-bold">
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{companyName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
