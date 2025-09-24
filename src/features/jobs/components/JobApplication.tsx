import React, { useState } from "react";
import { Job } from "../types/jobs.types";

interface ApplicationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
  };
  resume: File | null;
  coverLetter: string;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  expectedSalary: string;
  availabilityDate: string;
  workAuthorization: string;
  willingToRelocate: boolean;
  additionalInfo: string;
}

interface JobApplicationProps {
  job: Job;
  onClose: () => void;
  onSubmit: (data: ApplicationData) => void;
}

const JobApplication: React.FC<JobApplicationProps> = ({
  job,
  onClose,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
    },
    resume: null,
    coverLetter: "",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    expectedSalary: "",
    availabilityDate: "",
    workAuthorization: "",
    willingToRelocate: false,
    additionalInfo: "",
  });

  const totalSteps = 3;

  const handleInputChange = (
    field: string,
    value: string | boolean | File | null
  ) => {
    if (field.startsWith("personalInfo.")) {
      const personalField = field.replace("personalInfo.", "");
      setApplicationData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [personalField]: value,
        },
      }));
    } else {
      setApplicationData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleInputChange("resume", file);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          applicationData.personalInfo.firstName &&
          applicationData.personalInfo.lastName &&
          applicationData.personalInfo.email &&
          applicationData.personalInfo.phone
        );
      case 2:
        return !!applicationData.resume;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(applicationData);
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--neutral-500)] mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={applicationData.personalInfo.firstName}
                    onChange={(e) =>
                      handleInputChange(
                        "personalInfo.firstName",
                        e.target.value
                      )
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={applicationData.personalInfo.lastName}
                    onChange={(e) =>
                      handleInputChange("personalInfo.lastName", e.target.value)
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={applicationData.personalInfo.email}
                    onChange={(e) =>
                      handleInputChange("personalInfo.email", e.target.value)
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={applicationData.personalInfo.phone}
                    onChange={(e) =>
                      handleInputChange("personalInfo.phone", e.target.value)
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={applicationData.personalInfo.location}
                  onChange={(e) =>
                    handleInputChange("personalInfo.location", e.target.value)
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                  placeholder="City, State/Country"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--neutral-500)] mb-4">
                Resume & Documents
              </h3>

              {/* Resume Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                  Resume/CV *
                </label>
                <div className="border-2 border-dashed border-[#DEE2E6] rounded-lg p-4 sm:p-6 text-center hover:border-[var(--primary-500)] transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-8 h-8 sm:w-12 sm:h-12 text-[var(--neutral-300)] mb-2 sm:mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-[var(--neutral-400)] mb-2 text-sm sm:text-base">
                        {applicationData.resume
                          ? applicationData.resume.name
                          : "Click to upload your resume"}
                      </p>
                      <p className="text-[var(--neutral-300)] text-xs sm:text-sm">
                        PDF, DOC, or DOCX (Max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                  Cover Letter
                </label>
                <textarea
                  value={applicationData.coverLetter}
                  onChange={(e) =>
                    handleInputChange("coverLetter", e.target.value)
                  }
                  rows={6}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent resize-none text-base"
                  placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--neutral-500)] mb-4">
                Additional Information
              </h3>

              <div className="space-y-4 sm:space-y-6">
                {/* Portfolio & Social Links */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={applicationData.portfolioUrl}
                      onChange={(e) =>
                        handleInputChange("portfolioUrl", e.target.value)
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={applicationData.linkedinUrl}
                      onChange={(e) =>
                        handleInputChange("linkedinUrl", e.target.value)
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      value={applicationData.githubUrl}
                      onChange={(e) =>
                        handleInputChange("githubUrl", e.target.value)
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>

                {/* Salary & Availability */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                      Expected Salary
                    </label>
                    <input
                      type="text"
                      value={applicationData.expectedSalary}
                      onChange={(e) =>
                        handleInputChange("expectedSalary", e.target.value)
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                      placeholder="e.g., $80,000 - $100,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                      Availability Date
                    </label>
                    <input
                      type="date"
                      value={applicationData.availabilityDate}
                      onChange={(e) =>
                        handleInputChange("availabilityDate", e.target.value)
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                    />
                  </div>
                </div>

                {/* Work Authorization */}
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                    Work Authorization
                  </label>
                  <select
                    value={applicationData.workAuthorization}
                    onChange={(e) =>
                      handleInputChange("workAuthorization", e.target.value)
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent text-base"
                  >
                    <option value="">Select work authorization status</option>
                    <option value="citizen">US Citizen</option>
                    <option value="permanent-resident">
                      Permanent Resident
                    </option>
                    <option value="h1b">H1B Visa</option>
                    <option value="opt">F1 OPT</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Relocation */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="relocate"
                    checked={applicationData.willingToRelocate}
                    onChange={(e) =>
                      handleInputChange("willingToRelocate", e.target.checked)
                    }
                    className="w-4 h-4 text-[var(--primary-500)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--primary-500)] focus:ring-2"
                  />
                  <label
                    htmlFor="relocate"
                    className="ml-2 text-sm text-[var(--neutral-400)]"
                  >
                    I am willing to relocate for this position
                  </label>
                </div>

                {/* Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-[var(--neutral-400)] mb-2">
                    Additional Information
                  </label>
                  <textarea
                    value={applicationData.additionalInfo}
                    onChange={(e) =>
                      handleInputChange("additionalInfo", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent resize-none text-base"
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-[#DEE2E6] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--neutral-500)]">
              Apply for Position
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--neutral-50)] rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Job Info */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-[var(--neutral-50)] flex items-center justify-center flex-shrink-0">
              <img
                src={job.companyLogo || "/api/placeholder/48/48"}
                alt={`${job.company} logo`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[var(--neutral-500)] text-sm sm:text-base truncate">
                {job.title}
              </h3>
              <p className="text-[var(--neutral-300)] text-xs sm:text-sm truncate">
                {job.company}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step <= currentStep
                      ? "bg-[var(--primary-500)] text-[var(--font-light)]"
                      : "bg-[var(--neutral-50)] text-[var(--neutral-300)]"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      step < currentStep
                        ? "bg-[var(--primary-500)]"
                        : "bg-[var(--neutral-50)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mt-2 text-xs sm:text-sm text-[var(--neutral-300)]">
            <span
              className={
                currentStep === 1 ? "text-[var(--primary-500)] font-medium" : ""
              }
            >
              Personal
            </span>
            <span
              className={
                currentStep === 2 ? "text-[var(--primary-500)] font-medium" : ""
              }
            >
              Resume
            </span>
            <span
              className={
                currentStep === 3 ? "text-[var(--primary-500)] font-medium" : ""
              }
            >
              Additional
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-[#DEE2E6] flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="order-2 sm:order-1 px-4 sm:px-6 py-2 sm:py-3 border border-[#DEE2E6] text-[var(--neutral-400)] rounded-lg hover:bg-[var(--neutral-50)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>

            <div className="order-1 sm:order-2 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 border border-[var(--neutral-300)] text-[var(--neutral-300)] rounded-lg hover:bg-[var(--neutral-300)] hover:text-[var(--font-light)] transition-colors font-medium"
              >
                Cancel
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-[#28A745] text-[var(--font-light)] rounded-lg hover:bg-[#218838] transition-colors font-medium"
                >
                  Submit Application
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplication;
