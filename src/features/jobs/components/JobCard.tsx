import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Job } from "../types/jobs.types";
import { 
  getTranslatedJobDescription
} from "../../../utils/jobTranslations";

interface JobCardProps {
  job: Job;
  featured?: boolean;
  onClick?: () => void;
  // onBookmark?: () => void;
  isBookmarked?: boolean;
  onApply?: (job: Job) => void;
  className?: string;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  featured = false,
  onClick,
  // onBookmark,

  onApply,
  className = "",
}) => {
  const navigate = useNavigate();
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

  const handleViewDetails = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/jobs/${job.id}`);
    }
  };

  const handleApplyNow = () => {
    if (onApply) {
      onApply(job);
    } else if (onClick) {
      onClick();
    } else {
      navigate(`/jobs/${job.id}`);
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
      className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
        featured
          ? "border-[var(--primary-500)] shadow-md ring-2 ring-[var(--primary-500)] ring-opacity-10"
          : "border-[#DEE2E6] hover:border-[var(--primary-500)]"
      } ${className}`}
      onClick={handleViewDetails}
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            {/* Company Logo */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--neutral-50)] flex items-center justify-center">
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
              <div className="hidden text-[var(--neutral-300)] font-semibold text-base sm:text-lg">
                {job.company.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--neutral-500)] mb-1 leading-tight">
                    {job.title}
                  </h3>
                  <p className="text-[var(--primary-500)] font-semibold mb-2 text-sm sm:text-base">
                    {job.company}
                  </p>

                  {/* Location and Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[var(--neutral-300)] text-xs sm:text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
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
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
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
                      <span>{formatDate(job.postedDate)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                    <span
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium {getJobTypeColor(job.type)}`}
                    >
                      {getTranslatedJobType(job.type)}
                    </span>
                    <span
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium {getExperienceColor(job.experienceLevel)}`}
                    >
                      {getTranslatedExperienceLevel(job.experienceLevel)}
                    </span>
                    {job.remote && (
                      <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-[#28A745] text-[var(--font-light)]">
                        {t("jobs.card.remote")}
                      </span>
                    )}
                    {featured && (
                      <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-[#FFC107] text-[var(--font-light)]">
                        {t("jobs.card.featured")}
                      </span>
                    )}
                    {/* Skill Tags - Show fewer on mobile */}
                    {job.tags
                      .slice(0, window.innerWidth < 640 ? 2 : 3)
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-[#17627A] text-[var(--font-light)]"
                        >
                          {tag}
                        </span>
                      ))}
                    {job.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
                      <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-[var(--neutral-300)] text-[var(--font-light)]">
                        +{job.tags.length - (window.innerWidth < 640 ? 2 : 3)}
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
        <div className="mb-4">
          <div className="flex items-center gap-2">
            {/* <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#28A745]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg> */}
            <span className="text-[#28A745] font-bold text-base sm:text-lg">
              {job.salary
                ? `₹${job.salary.min.toLocaleString()} - ₹${job.salary.max.toLocaleString()}`
                : t("jobs.card.salaryNotSpecified")}
            </span>
          </div>
        </div>

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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-[var(--neutral-50)]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApplyNow();
            }}
            className="flex-1 px-4 py-2 sm:py-3 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors font-medium text-sm sm:text-base"
          >
            {t("jobs.card.applyNow")}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="flex-1 px-4 py-2 sm:py-3 border border-[var(--primary-500)] text-[var(--primary-500)] rounded-lg hover:bg-[var(--primary-500)] hover:text-[var(--font-light)] transition-colors font-medium text-sm sm:text-base"
          >
            {t("jobs.card.viewDetails")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
