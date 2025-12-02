import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Job } from "../types/jobs.types";
import { 
  getTranslatedJobDescription
} from "../../../utils/jobTranslations";

interface JobCardProps {
  job: Job;
  featured?: boolean;
  // onBookmark?: () => void;
  isBookmarked?: boolean;
  onApply?: (job: Job) => void;
  className?: string;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  featured = false,
  // onBookmark,
  onApply,
  className = "",
}) => {
  const { t } = useTranslation();
  // const [internalBookmarked, setInternalBookmarked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // const isBookmarked = externalBookmarked !== undefined ? externalBookmarked : internalBookmarked;

  const getTranslatedJobType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'Full-time': 'jobs.filters.jobType.fullTime',
      'Part-time': 'jobs.filters.jobType.partTime',
      'Contract': 'jobs.filters.jobType.contract',
      'Internship': 'jobs.filters.jobType.internship',
      'Freelance': 'jobs.filters.jobType.freelance'
    };
    return t(typeMap[type] || 'jobs.filters.jobType.fullTime');
  };

  const getTranslatedExperienceLevel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      'Entry Level': 'jobs.filters.experience.entryLevel',
      'Mid Level': 'jobs.filters.experience.midLevel',
      'Senior Level': 'jobs.filters.experience.seniorLevel',
      'Executive': 'jobs.filters.experience.executive'
    };
    return t(levelMap[level] || 'jobs.filters.experience.entryLevel');
  };

  const formatDate = (dateString: string) => {
    // If the date string already contains human-readable format (e.g., "5 days ago"), return it directly
    if (dateString.includes('ago') || dateString.includes('day') || dateString.includes('week') || dateString.includes('month')) {
      return dateString;
    }
    
    // Otherwise, calculate the date difference
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return t("jobs.card.postedAgo", { time: "1 day" });
    if (diffDays < 7) return t("jobs.card.postedAgo", { time: `${diffDays} days` });
    if (diffDays < 30) return t("jobs.card.postedAgo", { time: `${Math.ceil(diffDays / 7)} weeks` });
    return t("jobs.card.postedAgo", { time: `${Math.ceil(diffDays / 30)} months` });
  };

  // const getExperienceColor = (experience: string) => {
  //   switch (experience) {
  //     case 'Entry Level': return 'bg-[#28A745] text-[var(--font-light)]';
  //     case 'Mid Level': return 'bg-[#FFC107] text-[var(--font-light)]';
  //     case 'Senior Level': return 'bg-[var(--primary-500)] text-[var(--font-light)]';
  //     case 'Executive': return 'bg-[#6F42C1] text-[var(--font-light)]';
  //     default: return 'bg-[var(--neutral-300)] text-[var(--font-light)]';
  //   }
  // };

  // const getJobTypeColor = (type: string) => {
  //   switch (type) {
  //     case 'Full-time': return 'bg-[#17627A] text-[var(--font-light)]';
  //     case 'Part-time': return 'bg-[#FD7E14] text-[var(--font-light)]';
  //     case 'Contract': return 'bg-[#DC3545] text-[var(--font-light)]';
  //     case 'Internship': return 'bg-[#20C997] text-[var(--font-light)]';
  //     case 'Freelance': return 'bg-[#6F42C1] text-[var(--font-light)]';
  //     default: return 'bg-[var(--neutral-300)] text-[var(--font-light)]';
  //   }
  // };

  const handleApplyNow = () => {
    if (job.applicationUrl) {
      window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
    } else if (onApply) {
      onApply(job);
    }
  };

  // const handleBookmarkClick = () => {
  //   if (onBookmark) {
  //     onBookmark();
  //   } else {
  //     setInternalBookmarked(!internalBookmarked);
  //   }
  // };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
        featured
          ? "border-[var(--primary-500)] shadow-lg ring-2 ring-[var(--primary-500)] ring-opacity-20"
          : "border-[var(--neutral-100)] hover:border-[var(--primary-300)]"
      } ${className}`}
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            {/* Company Logo */}
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--primary-50)] to-[var(--primary-100)] flex items-center justify-center shadow-sm border border-[var(--neutral-100)]">
              <img
                src={job.companyLogo}
                alt={`${job.company} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden text-[var(--primary-500)] font-bold text-xl sm:text-2xl">
                {job.company.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--neutral-600)] mb-1.5 leading-tight hover:text-[var(--primary-600)] transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-[var(--primary-500)] font-semibold mb-3 text-base sm:text-lg flex items-center gap-2">
                    {job.company}
                    {featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFC107] to-[#FF9800] text-white">
                        ⭐ Featured
                      </span>
                    )}
                  </p>

                  {/* Location, Experience and Date */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[var(--neutral-400)] text-sm mb-4">
                    <div className="flex items-center gap-1.5 bg-[var(--neutral-50)] px-2.5 py-1.5 rounded-md">
                      <svg
                        className="w-4 h-4 text-[var(--primary-500)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="font-medium">{job.location}</span>
                    </div>
                    {job.experience && (
                      <div className="flex items-center gap-1.5 bg-[var(--neutral-50)] px-2.5 py-1.5 rounded-md">
                        <svg
                          className="w-4 h-4 text-[var(--primary-500)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium">{job.experience}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-[var(--neutral-400)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-xs">{formatDate(job.postedDate)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Skill Tags */}
                    {job.tags
                      .slice(0, window.innerWidth < 640 ? 3 : 5)
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    {job.tags.length > (window.innerWidth < 640 ? 3 : 5) && (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--neutral-200)] text-[var(--neutral-600)]">
                        +{job.tags.length - (window.innerWidth < 640 ? 3 : 5)} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bookmark Button */}
                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookmarkClick();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked 
                      ? 'bg-[var(--primary-500)] text-[var(--font-light)]' 
                      : 'bg-[var(--neutral-50)] text-[var(--neutral-300)] hover:bg-[var(--neutral-100)]'
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Salary */}
        {job.salaryString && (
          <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-green-700 font-bold text-lg">
                ₹ {job.salaryString}
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-4">
          <p className="text-[var(--neutral-400)] leading-relaxed text-sm sm:text-base">
            {(() => {
              // Try to get translated description first
              const translatedDescription = getTranslatedJobDescription(job.id, t);
              const description = translatedDescription || job.description;
              
              return showFullDescription
                ? description
                : description.length > 120
                ? `${description.slice(0, 120)}...`
                : description;
            })()}
          </p>
          {(() => {
            const translatedDescription = getTranslatedJobDescription(job.id, t);
            const description = translatedDescription || job.description;
            return description.length > 120;
          })() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDescription(!showFullDescription);
              }}
              className="text-[var(--primary-500)] font-medium text-xs sm:text-sm mt-2 hover:underline"
            >
              {showFullDescription ? t("jobs.card.showLess") : t("jobs.card.readMore")}
            </button>
          )}
        </div>

        {/* Requirements Preview */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {job.requirements
              .slice(0, window.innerWidth < 640 ? 2 : 3)
              .map((req, index) => (
                <span
                  key={index}
                  className="px-2 py-1 sm:px-3 sm:py-1 bg-[var(--neutral-50)] text-[var(--neutral-400)] rounded-lg text-xs sm:text-sm border border-[#DEE2E6]"
                >
                  {req.length > 20 ? `${req.slice(0, 20)}...` : req}
                </span>
              ))}
            {job.requirements.length > (window.innerWidth < 640 ? 2 : 3) && (
              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-[var(--neutral-50)] text-[var(--neutral-300)] rounded-lg text-xs sm:text-sm border border-[#DEE2E6]">
                +{job.requirements.length - (window.innerWidth < 640 ? 2 : 3)}{" "}
                {t("jobs.card.more")}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[var(--neutral-100)]">
          <button
            onClick={handleApplyNow}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white rounded-xl hover:shadow-lg hover:from-[var(--primary-600)] hover:to-[var(--primary-700)] transition-all duration-300 font-semibold text-base flex items-center justify-center gap-2 group"
          >
            <span>{t("jobs.card.applyNow")}</span>
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
