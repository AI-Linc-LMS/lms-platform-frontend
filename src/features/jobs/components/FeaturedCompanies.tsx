import React from "react";
import { Company } from "../types/jobs.types";

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp Inc.",
    logo: "https://via.placeholder.com/80x80/255C79/ffffff?text=TC",
    description: "Leading technology solutions provider",
    website: "https://techcorp.com",
    size: "1000-5000",
    industry: "Technology",
    openPositions: 15,
  },
  {
    id: "2",
    name: "StartupXYZ",
    logo: "https://via.placeholder.com/80x80/17627A/ffffff?text=SX",
    description: "Fast-growing fintech startup",
    website: "https://startupxyz.com",
    size: "50-200",
    industry: "Fintech",
    openPositions: 8,
  },
  {
    id: "3",
    name: "CloudTech Solutions",
    logo: "https://via.placeholder.com/80x80/6C757D/ffffff?text=CT",
    description: "Cloud infrastructure and DevOps",
    website: "https://cloudtech.com",
    size: "500-1000",
    industry: "Cloud Services",
    openPositions: 12,
  },
  {
    id: "4",
    name: "AI Innovations Lab",
    logo: "https://via.placeholder.com/80x80/6F42C1/ffffff?text=AI",
    description: "Cutting-edge AI research and development",
    website: "https://ailab.com",
    size: "200-500",
    industry: "Artificial Intelligence",
    openPositions: 20,
  },
  {
    id: "5",
    name: "Design Studio Pro",
    logo: "https://via.placeholder.com/80x80/DC3545/ffffff?text=DS",
    description: "Creative design and branding agency",
    website: "https://designstudio.com",
    size: "10-50",
    industry: "Design",
    openPositions: 5,
  },
  {
    id: "6",
    name: "EduTech Platform",
    logo: "https://via.placeholder.com/80x80/28A745/ffffff?text=EP",
    description: "Online education and learning platform",
    website: "https://edutech.com",
    size: "100-500",
    industry: "Education Technology",
    openPositions: 18,
  },
];

const FeaturedCompanies: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#DEE2E6] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#343A40] mb-2">
            Featured Companies
          </h2>
          <p className="text-[var(--netural-300)]">
            Discover top companies actively hiring talented professionals
          </p>
        </div>
        <button className="px-4 py-2 text-[var(--default-primary)] border border-[var(--default-primary)] rounded-lg hover:bg-[var(--default-primary)] hover:text-white transition-colors font-medium">
          View All Companies
        </button>
      </div>

      {/* Companies Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {mockCompanies.map((company) => (
          <div
            key={company.id}
            className="group relative p-4 rounded-xl border border-[var(--netural-50)] hover:border-[var(--default-primary)] hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
          >
            {/* Company Logo */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden bg-[var(--netural-50)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden text-[var(--netural-300)] font-semibold text-xl">
                {company.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Company Info */}
            <div className="text-center">
              <h3 className="font-semibold text-[#343A40] mb-1 text-sm leading-tight">
                {company.name}
              </h3>
              <p className="text-[var(--netural-300)] text-xs mb-2 line-clamp-2">
                {company.description}
              </p>

              {/* Open Positions Badge */}
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--default-primary)] bg-opacity-10 text-[var(--default-primary)] rounded-full text-xs font-medium">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z"
                  />
                </svg>
                <span>{company.openPositions} jobs</span>
              </div>
            </div>

            {/* Hover Overlay with Additional Info */}
            <div className="absolute inset-0 bg-[var(--default-primary)] bg-opacity-95 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-center items-center text-white text-center">
              <h3 className="font-bold text-sm mb-2">{company.name}</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span>{company.industry}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>{company.size} employees</span>
                </div>
                <div className="flex items-center justify-center gap-1 font-semibold">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z"
                    />
                  </svg>
                  <span>{company.openPositions} open jobs</span>
                </div>
              </div>
              <button className="mt-3 px-3 py-1 bg-white text-[var(--default-primary)] rounded-md text-xs font-medium hover:bg-gray-100 transition-colors">
                View Jobs
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stats */}
      <div className="mt-6 pt-6 border-t border-[var(--netural-50)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[var(--default-primary)]">
              850+
            </div>
            <div className="text-[var(--netural-300)] text-sm">Companies</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#28A745]">1,200+</div>
            <div className="text-[var(--netural-300)] text-sm">Active Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#17627A]">95%</div>
            <div className="text-[var(--netural-300)] text-sm">
              Success Rate
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#FFC107]">4.8/5</div>
            <div className="text-[var(--netural-300)] text-sm">User Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCompanies;
