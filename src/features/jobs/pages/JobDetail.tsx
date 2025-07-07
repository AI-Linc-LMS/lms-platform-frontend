import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Job } from "../types/jobs.types";
import JobApplication from "../components/JobApplication";

// interface ApplicationData {
//   personalInfo: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     location: string;
//   };
//   resume: File | null;
//   coverLetter: string;
//   portfolioUrl: string;
//   linkedinUrl: string;
//   githubUrl: string;
//   expectedSalary: string;
//   availabilityDate: string;
//   workAuthorization: string;
//   willingToRelocate: boolean;
//   additionalInfo: string;
// }

// Mock job data - in real app, this would come from API
const mockJobDetail: Job = {
  id: "1",
  title: "Senior Frontend Developer",
  company: "TechCorp Inc.",
  companyLogo: "https://via.placeholder.com/120x120/255C79/ffffff?text=TC",
  location: "San Francisco, CA",
  type: "Full-time",
  experienceLevel: "Senior Level",
  salary: {
    min: 120000,
    max: 160000,
    currency: "USD",
  },
  description: `We are looking for a Senior Frontend Developer to join our dynamic team and help build amazing user experiences. You will be responsible for developing user-facing applications using React, TypeScript, and modern web technologies.

As a Senior Frontend Developer, you'll work closely with our design and backend teams to create responsive, accessible, and performant web applications. You'll also mentor junior developers and contribute to our technical architecture decisions.

This is an excellent opportunity to work with cutting-edge technologies in a collaborative environment where your ideas and expertise will be valued and implemented.`,
  requirements: [
    "5+ years of experience with React and modern JavaScript",
    "Strong proficiency in TypeScript",
    "Experience with modern CSS frameworks (Tailwind, Styled Components)",
    "Knowledge of testing frameworks (Jest, React Testing Library)",
    "Experience with state management (Redux, Zustand, Context API)",
    "Familiarity with build tools (Webpack, Vite, Rollup)",
    "Understanding of web performance optimization",
    "Experience with version control (Git) and CI/CD pipelines",
    "Strong problem-solving and debugging skills",
    "Excellent communication and teamwork abilities",
  ],
  benefits: [
    "Competitive salary with equity package",
    "Comprehensive health, dental, and vision insurance",
    "Flexible working hours and remote work options",
    "Professional development budget ($3,000/year)",
    "Top-tier equipment and home office setup allowance",
    "401(k) with company matching",
    "Unlimited PTO policy",
    "Catered meals and snacks",
    "Gym membership reimbursement",
    "Annual team retreats and company events",
  ],
  tags: ["React", "TypeScript", "CSS", "JavaScript", "Redux", "Testing"],
  remote: true,
  postedDate: "2024-01-15",
  applicationDeadline: "2024-02-15",
  applicationUrl: "https://techcorp.com/apply/1",
  isBookmarked: false,
};

const JobDetail: React.FC = () => {
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(mockJobDetail.isBookmarked);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleApplyNow = () => {
    setShowApplicationModal(true);
  };

  const handleApplicationSubmit = () => {
    //console.log('Application submitted:', applicationData);
    // Here you would typically send the application data to your API
    alert("Application submitted successfully!");
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Here you would typically make an API call to save bookmark status
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#DEE2E6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate("/jobs")}
            className="flex items-center gap-2 text-[#6C757D] hover:text-[#255C79] mb-4 transition-colors"
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
            Back to Jobs
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Company Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-[#F8F9FA] flex items-center justify-center">
              <img
                src={mockJobDetail.companyLogo}
                alt={`${mockJobDetail.company} logo`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Job Info */}
            <div className="flex-1 w-full">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#343A40] mb-2 leading-tight">
                {mockJobDetail.title}
              </h1>
              <p className="text-lg sm:text-xl text-[#255C79] font-semibold mb-4">
                {mockJobDetail.company}
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-[#6C757D] mb-4 text-sm sm:text-base">
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
                  <span>Posted {formatDate(mockJobDetail.postedDate)}</span>
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
                      Apply by {formatDate(mockJobDetail.applicationDeadline)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#17627A] text-white rounded-full text-xs sm:text-sm font-medium">
                  {mockJobDetail.type}
                </span>
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#255C79] text-white rounded-full text-xs sm:text-sm font-medium">
                  {mockJobDetail.experienceLevel}
                </span>
                {mockJobDetail.remote && (
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#28A745] text-white rounded-full text-xs sm:text-sm font-medium">
                    Remote
                  </span>
                )}
                {mockJobDetail.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#6C757D] text-white rounded-full text-xs sm:text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {mockJobDetail.tags.length > 3 && (
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#6C757D] text-white rounded-full text-xs sm:text-sm font-medium">
                    +{mockJobDetail.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Salary */}
              {mockJobDetail.salary && (
                <div className="flex items-center gap-3 mb-6">
                  <svg
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
                  </svg>
                  <span className="text-[#28A745] font-bold text-lg sm:text-xl">
                    ${mockJobDetail.salary.min.toLocaleString()} - $
                    {mockJobDetail.salary.max.toLocaleString()} / year
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleApplyNow}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors font-medium text-base sm:text-lg"
                >
                  Apply Now
                </button>
                <button
                  onClick={handleBookmark}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-colors font-medium ${
                    isBookmarked
                      ? "bg-[#255C79] text-white"
                      : "border border-[#255C79] text-[#255C79] hover:bg-[#255C79] hover:text-white"
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
                </button>
                <button className="w-full sm:w-auto px-6 py-3 border border-[#6C757D] text-[#6C757D] rounded-lg hover:bg-[#6C757D] hover:text-white transition-colors font-medium">
                  Share Job
                </button>
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
              <h2 className="text-xl sm:text-2xl font-bold text-[#343A40] mb-4">
                Job Description
              </h2>
              <div className="prose prose-gray max-w-none">
                {mockJobDetail.description
                  .split("\n\n")
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-[#495057] leading-relaxed mb-4 text-sm sm:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#343A40] mb-4">
                Requirements
              </h2>
              <ul className="space-y-3">
                {mockJobDetail.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#255C79] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[#495057] text-sm sm:text-base">
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            {mockJobDetail.benefits && (
              <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#343A40] mb-4">
                  Benefits & Perks
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {mockJobDetail.benefits.map((benefit, index) => (
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
                      <span className="text-[#495057] text-sm sm:text-base">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Company Info & Quick Apply */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Quick Apply Card */}
            <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#343A40] mb-4">
                Quick Apply
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleApplyNow}
                  className="w-full px-6 py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors font-medium"
                >
                  Apply Now
                </button>
                <button
                  onClick={handleBookmark}
                  className="w-full px-6 py-3 border border-[#255C79] text-[#255C79] rounded-lg hover:bg-[#255C79] hover:text-white transition-colors font-medium"
                >
                  Save for Later
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-[#F8F9FA]">
                <div className="text-sm text-[#6C757D] space-y-2">
                  <div className="flex justify-between">
                    <span>Job Type:</span>
                    <span className="font-medium text-[#343A40]">
                      {mockJobDetail.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience:</span>
                    <span className="font-medium text-[#343A40]">
                      {mockJobDetail.experienceLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remote:</span>
                    <span className="font-medium text-[#343A40]">
                      {mockJobDetail.remote ? "Yes" : "No"}
                    </span>
                  </div>
                  {mockJobDetail.applicationDeadline && (
                    <div className="flex justify-between">
                      <span>Deadline:</span>
                      <span className="font-medium text-[#343A40]">
                        {formatDate(mockJobDetail.applicationDeadline)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Info Card */}
            <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#343A40] mb-4">
                About {mockJobDetail.company}
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#F8F9FA] flex items-center justify-center">
                  <img
                    src={mockJobDetail.companyLogo}
                    alt={`${mockJobDetail.company} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-[#343A40]">
                    {mockJobDetail.company}
                  </h4>
                  <p className="text-[#6C757D] text-sm">Technology Company</p>
                </div>
              </div>
              <p className="text-[#495057] text-sm leading-relaxed mb-4">
                TechCorp Inc. is a leading technology company focused on
                building innovative solutions that transform how businesses
                operate. We're committed to creating a diverse and inclusive
                workplace where everyone can thrive.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Industry:</span>
                  <span className="font-medium text-[#343A40]">Technology</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Company Size:</span>
                  <span className="font-medium text-[#343A40]">
                    1000-5000 employees
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6C757D]">Founded:</span>
                  <span className="font-medium text-[#343A40]">2010</span>
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 border border-[#DEE2E6] text-[#495057] rounded-lg hover:bg-[#F8F9FA] transition-colors text-sm">
                View Company Profile
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
    </div>
  );
};

export default JobDetail;
