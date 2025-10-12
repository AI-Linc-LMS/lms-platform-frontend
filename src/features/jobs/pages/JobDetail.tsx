import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import JobApplication from "../components/JobApplication";
import AssessmentInvitationModal from "../components/AssessmentInvitationModal";
import { completeJobDetails } from "../components/MockJobDetails";
import { 
  getTranslatedJobDescription, 
  getTranslatedJobRequirements, 
  getTranslatedJobBenefits 
} from "../../../utils/jobTranslations";

const JobDetail: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { jobId } = useParams<{ jobId: string }>();

  // Find the job detail based on the jobId from the route
  const mockJobDetail = useMemo(() => {
    const job = completeJobDetails.find((job) => job.id === jobId);
    if (!job) {
      // Redirect to jobs page if job not found
      navigate("/jobs");
      return completeJobDetails[0]; // Fallback to first job
    }
    return job;
  }, [jobId, navigate]);

  // const [isBookmarked, setIsBookmarked] = useState(mockJobDetail.isBookmarked);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  const handleApplyNow = () => {
    setShowAssessmentModal(true);
  };

  const handleApplicationSubmit = () => {
    alert("Application submitted successfully!");
  };

  // const handleBookmark = () => {
  //   setIsBookmarked(!isBookmarked);
  // Here you would typically make an API call to save bookmark status
  // };

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      {/* Header */}
      <div className="bg-white border-b border-[#DEE2E6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate("/jobs")}
            className="flex items-center gap-2 text-[var(--neutral-300)] hover:text-[var(--primary-500)] mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t("jobs.detail.backToJobs")}
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Company Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-[var(--neutral-50)] flex items-center justify-center">
              <img
                src={mockJobDetail.companyLogo}
                alt={`${mockJobDetail.company} logo`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Job Info */}
            <div className="flex-1 w-full">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neutral-500)] mb-2 leading-tight">
                {mockJobDetail.title}
              </h1>
              <p className="text-lg sm:text-xl text-[var(--primary-500)] font-semibold mb-4">
                {mockJobDetail.company}
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-[var(--neutral-300)] mb-4 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                  <span>{mockJobDetail.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                  <span>{t("jobs.detail.datePosted", { date: formatDate(mockJobDetail.postedDate) })}</span>
                </div>
                {mockJobDetail.applicationDeadline && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {t("jobs.detail.applicationDeadline", { date: formatDate(mockJobDetail.applicationDeadline) })}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#17627A] text-[var(--font-light)] rounded-full text-xs sm:text-sm font-medium">
                  {getTranslatedJobType(mockJobDetail.type)}
                </span>
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-full text-xs sm:text-sm font-medium">
                  {getTranslatedExperienceLevel(mockJobDetail.experienceLevel)}
                </span>
                {mockJobDetail.remote && (
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#28A745] text-[var(--font-light)] rounded-full text-xs sm:text-sm font-medium">
                    {t("jobs.card.remote")}
                  </span>
                )}
                {mockJobDetail.tags
                  .slice(0, 3)
                  .map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--neutral-300)] text-[var(--font-light)] rounded-full text-xs sm:text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                {mockJobDetail.tags.length > 3 && (
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--neutral-300)] text-[var(--font-light)] rounded-full text-xs sm:text-sm font-medium">
                    +{mockJobDetail.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Salary */}
              {mockJobDetail.salary && (
                <div className="flex items-center gap-3 mb-6">
                  {/* <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-[#28A745]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg> */}
                  <span className="text-[#28A745] font-bold text-lg sm:text-xl">
                    ₹{mockJobDetail.salary.min.toLocaleString()} - ₹
                    {mockJobDetail.salary.max.toLocaleString()} {t("jobs.detail.year")}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleApplyNow}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors font-medium text-base sm:text-lg"
                >
                  {t("jobs.card.applyNow")}
                </button>
                {/* <button
                  onClick={handleBookmark}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-colors font-medium ${isBookmarked
                      ? "bg-[var(--primary-500)] text-[var(--font-light)]"
                      : "border border-[var(--primary-500)] text-[var(--primary-500)] hover:bg-[var(--primary-500)] hover:text-[var(--font-light)]"
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill={isBookmarked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                  </div>
                </button> */}
                {/* share job */}
                {/* <button className="w-full sm:w-auto px-6 py-3 border border-[var(--neutral-300)] text-[var(--neutral-300)] rounded-lg hover:bg-[var(--neutral-300)] hover:text-[var(--font-light)] transition-colors font-medium">
                  Share Job
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Job Description */}
            <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--neutral-500)] mb-4">
                {t("jobs.detail.jobDescription")}
              </h2>
              <div className="prose prose-gray max-w-none">
                {(() => {
                  // Try to get translated description first
                  const translatedDescription = getTranslatedJobDescription(mockJobDetail.id, t);
                  const description = translatedDescription || mockJobDetail.description;
                  
                  return description
                    .split("\n\n")
                    .map((paragraph: string, index: number) => (
                      <p
                        key={index}
                        className="text-[var(--neutral-400)] leading-relaxed mb-4 text-sm sm:text-base"
                      >
                        {paragraph}
                      </p>
                    ));
                })()}
              </div>
            </div>

            {/* Add About Company section after Job Description section */}
            {mockJobDetail.about && (
              <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--neutral-500)] mb-4">
                  {t("jobs.detail.about", { company: mockJobDetail.company })}
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-[var(--neutral-400)] leading-relaxed text-sm sm:text-base">
                    {mockJobDetail.about}
                  </p>
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--neutral-500)] mb-4">
                {t("jobs.detail.requirements")}
              </h2>
              <ul className="space-y-3">
                {(() => {
                  // Try to get translated requirements first
                  const translatedRequirements = getTranslatedJobRequirements(mockJobDetail.id, t);
                  const requirements = translatedRequirements.length > 0 ? translatedRequirements : mockJobDetail.requirements;
                  
                  return requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[var(--primary-500)] rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-[var(--neutral-400)] text-sm sm:text-base">
                        {req}
                      </span>
                    </li>
                  ));
                })()}
              </ul>
            </div>

            {/* Benefits */}
            {mockJobDetail.benefits && (
              <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--neutral-500)] mb-4">
                  {t("jobs.detail.benefitsAndPerks")}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {(() => {
                    // Try to get translated benefits first
                    const translatedBenefits = getTranslatedJobBenefits(mockJobDetail.id, t);
                    const benefits = translatedBenefits.length > 0 ? translatedBenefits : mockJobDetail.benefits;
                    
                    return benefits.map((benefit: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#28A745] mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-[var(--neutral-400)] text-sm sm:text-base">
                          {benefit}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Company Info & Quick Apply */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Quick Apply Card */}
            <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--neutral-500)] mb-4">
                {t("jobs.detail.quickApply")}
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleApplyNow}
                  className="w-full px-6 py-3 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors font-medium"
                >
                  {t("jobs.card.applyNow")}
                </button>
                {/* <button
                  onClick={handleBookmark}
                  className="w-full px-6 py-3 border border-[var(--primary-500)] text-[var(--primary-500)] rounded-lg hover:bg-[var(--primary-500)] hover:text-[var(--font-light)] transition-colors font-medium"
                >
                  Save for Later
                </button> */}
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--neutral-50)]">
                <div className="text-sm text-[var(--neutral-300)] space-y-2">
                  <div className="flex justify-between">
                    <span>{t("jobs.detail.jobType")}</span>
                    <span className="font-medium text-[var(--neutral-500)]">
                      {getTranslatedJobType(mockJobDetail.type)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("jobs.detail.experience")}</span>
                    <span className="font-medium text-[var(--neutral-500)]">
                      {getTranslatedExperienceLevel(mockJobDetail.experienceLevel)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("jobs.detail.remote")}</span>
                    <span className="font-medium text-[var(--neutral-500)]">
                      {mockJobDetail.remote ? t("jobs.detail.yes") : t("jobs.detail.no")}
                    </span>
                  </div>
                  {mockJobDetail.applicationDeadline && (
                    <div className="flex justify-between">
                      <span>{t("jobs.detail.deadline")}</span>
                      <span className="font-medium text-[var(--neutral-500)]">
                        {formatDate(mockJobDetail.applicationDeadline)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Info Card */}
            <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--neutral-500)] mb-4">
                {t("jobs.detail.about", { company: mockJobDetail.company })}
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[var(--neutral-50)] flex items-center justify-center">
                  <img
                    src={mockJobDetail.companyLogo}
                    alt={`${mockJobDetail.company} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--neutral-500)]">
                    {mockJobDetail.company}
                  </h4>
                  <p className="text-[var(--neutral-300)] text-sm">
                    {t("jobs.detail.technologyCompany")}
                  </p>
                </div>
              </div>
              <p className="text-[var(--neutral-400)] text-sm leading-relaxed mb-4">
                {mockJobDetail.about || t("jobs.detail.technologyCompany")}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--neutral-300)]">{t("jobs.detail.industry")}</span>
                  <span className="font-medium text-[var(--neutral-500)]">
                    {t("jobs.detail.technology")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neutral-300)]">
                    {t("jobs.detail.companySize")}
                  </span>
                  <span className="font-medium text-[var(--neutral-500)]">
                    1000-5000 {t("jobs.detail.employees")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neutral-300)]">{t("jobs.detail.founded")}</span>
                  <span className="font-medium text-[var(--neutral-500)]">
                    2010
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (mockJobDetail.website) {
                    window.open(
                      mockJobDetail.website,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                }}
                className="w-full mt-4 px-4 py-2 border border-[#DEE2E6] text-[var(--neutral-400)] rounded-lg hover:bg-[var(--neutral-50)] transition-colors text-sm"
              >
                {t("jobs.detail.viewCompanyProfile")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <JobApplication
          job={mockJobDetail}
          onClose={() => setShowApplicationModal(false)}
          onSubmit={handleApplicationSubmit}
        />
      )}

      {/* Assessment Invitation Modal */}
      {showAssessmentModal && (
        <AssessmentInvitationModal
          job={mockJobDetail}
          isOpen={true}
          onClose={() => setShowAssessmentModal(false)}
        />
      )}
    </div>
  );
};

export default JobDetail;
