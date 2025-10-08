import React, { useState, useRef } from "react";
import {
  ResumeData,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  Project,
} from "../types/resume";
import PersonalInfoForm from "../components/PersonalInfoForm";

import SkillsForm from "../components/SkillsForm";
import ProjectsForm from "../components/ProjectsForm";
import ResumePreview from "../components/ResumePreview";
import { useToast } from "../../../contexts/ToastContext";
import ExperienceForm from "../components/ExperienceForm";
import EducationForm from "../components/EducationForm";
import TemplateSelector from "../components/TemplateSelector";
import { printWithoutHeaders } from "../utils/printUtils";

const ResumeBuilder: React.FC = () => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState("personal");
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      linkedin: "",
      github: "",
      website: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    selectedTemplate: "modern",
  });

  const updatePersonalInfo = (personalInfo: PersonalInfo) => {
    console.log("Updating personal info:", personalInfo);
    try {
      setResumeData((prev) => ({ ...prev, personalInfo }));
    } catch (error) {
      console.error("Error updating personal info:", error);
    }
  };

  const updateExperience = (experience: Experience[]) => {
    setResumeData((prev) => ({ ...prev, experience }));
  };

  const updateEducation = (education: Education[]) => {
    setResumeData((prev) => ({ ...prev, education }));
  };

  const updateSkills = (skills: Skill[]) => {
    setResumeData((prev) => ({ ...prev, skills }));
  };

  const updateProjects = (projects: Project[]) => {
    setResumeData((prev) => ({ ...prev, projects }));
  };

  const updateTemplate = (templateId: string) => {
    setResumeData((prev) => ({ ...prev, selectedTemplate: templateId }));
  };

  const handlePrint = () => {
    console.log("Print button clicked");
    if (!printRef.current) {
      showErrorToast("Error", "Resume content not found. Please try again.");
      return;
    }

    // Use the new print utility
    const success = printWithoutHeaders(printRef.current, "Resume");
    if (!success) {
      showErrorToast("Error", "Failed to open print dialog. Please try again.");
    }
  };

  //   const handleDownloadPDF = () => {
  //     console.log("Download PDF button clicked");
  //     if (!printRef.current) {
  //       showErrorToast("Error", "Resume content not found. Please try again.");
  //       return;
  //     }

  //     // Use a simpler approach that opens print dialog with instructions
  //     const element = printRef.current;
  //     const content = element.innerHTML;

  //     // Create a new window with print-optimized styling
  //     const printWindow = window.open("", "_blank", "width=800,height=600");

  //     if (!printWindow) {
  //       showErrorToast(
  //         "Error",
  //         "Unable to open print window. Please check popup blocker settings."
  //       );
  //       return;
  //     }

  //     const filename = `${resumeData.personalInfo.firstName || "Resume"}_${
  //       resumeData.personalInfo.lastName || "Document"
  //     }`;

  //     printWindow.document.write(`
  //       <!DOCTYPE html>
  //       <html>
  //       <head>
  //         <title>${filename}</title>
  //         <style>
  //           @media print {
  //             @page { size: A4; margin: 0.5in; }
  //             body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; }
  //             svg { width: 12px !important; height: 12px !important; }
  //             .no-print { display: none !important; }
  //           }
  //           body {
  //             font-family: Arial, sans-serif;
  //             max-width: 800px;
  //             margin: 20px auto;
  //             padding: 20px;
  //           }
  //           .download-instructions {
  //             background: #e3f2fd;
  //             border: 1px solid #2196f3;
  //             border-radius: 8px;
  //             padding: 15px;
  //             margin-bottom: 20px;
  //             text-align: center;
  //           }
  //           .download-instructions h3 {
  //             color: #1976d2;
  //             margin: 0 0 10px 0;
  //           }
  //           .download-instructions p {
  //             margin: 5px 0;
  //             font-size: 14px;
  //           }
  //           .download-instructions strong {
  //             color: #d32f2f;
  //           }
  //           @media print {
  //             .download-instructions { display: none !important; }
  //           }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="download-instructions no-print">
  //           <h3>📄 Download as PDF Instructions</h3>
  //           <p><strong>Press Ctrl+P (Windows/Linux) or Cmd+P (Mac)</strong></p>
  //           <p>In the print dialog:</p>
  //           <p>1. Select "Save as PDF" as destination</p>
  //           <p>2. Choose "More settings" → "Paper size: A4"</p>
  //           <p>3. Uncheck "Headers and footers"</p>
  //           <p>4. Set margins to "Minimum" or "Custom: 0.5"</p>
  //           <p>5. Click "Save" and choose your filename</p>
  //         </div>
  //         ${content}
  //       </body>
  //       </html>
  //     `);

  //     printWindow.document.close();
  //     printWindow.focus();

  //     // Show instructions to user
  //     showSuccessToast(
  //       "Print Dialog",
  //       "A new window opened with print instructions. Use Ctrl+P (Cmd+P on Mac) and 'Save as PDF' to download."
  //     );
  //   };

  const saveToLocalStorage = () => {
    console.log("Save button clicked");
    try {
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
      showSuccessToast("Saved", "Resume data saved locally!");
    } catch (error) {
      showErrorToast("Error", "Failed to save resume data.");
    }
  };

  const loadFromLocalStorage = () => {
    console.log("Load button clicked");
    try {
      const savedData = localStorage.getItem("resumeData");
      if (savedData) {
        setResumeData(JSON.parse(savedData));
        showSuccessToast("Loaded", "Resume data loaded successfully!");
      } else {
        showErrorToast("No Data", "No saved resume data found.");
      }
    } catch (error) {
      showErrorToast("Error", "Failed to load resume data.");
    }
  };

  const tabs = [
    {
      id: "personal",
      label: "Personal Info",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "experience",
      label: "Experience",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
          />
        </svg>
      ),
    },
    {
      id: "education",
      label: "Education",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
        </svg>
      ),
    },
    {
      id: "skills",
      label: "Skills",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      id: "projects",
      label: "Projects",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
    {
      id: "template",
      label: "Template",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
          />
        </svg>
      ),
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <PersonalInfoForm
            data={resumeData.personalInfo}
            onChange={updatePersonalInfo}
          />
        );
      case "experience":
        return (
          <ExperienceForm
            data={resumeData.experience}
            onChange={updateExperience}
          />
        );
      case "education":
        return (
          <EducationForm
            data={resumeData.education}
            onChange={updateEducation}
          />
        );
      case "skills":
        return <SkillsForm data={resumeData.skills} onChange={updateSkills} />;
      case "projects":
        return (
          <ProjectsForm data={resumeData.projects} onChange={updateProjects} />
        );
      case "template":
        return (
          <TemplateSelector
            selectedTemplate={resumeData.selectedTemplate}
            onChange={updateTemplate}
            resumeData={resumeData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#257195] mb-2">
            Resume Builder
          </h1>
          <p className="text-gray-600">
            Create your professional resume with our easy-to-use builder
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrint();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
              {/* <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownloadPDF();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </button> */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveToLocalStorage();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-purple-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  loadFromLocalStorage();
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-orange-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                  />
                </svg>
                Load
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Tab clicked:", tab.id);
                    setActiveTab(tab.id);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#257195] text-white border-b-2 border-[#257195]"
                      : "text-gray-600 hover:text-[#257195] hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">{renderTabContent()}</div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#257195] mb-4">
              Preview
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div ref={printRef}>
                <ResumePreview data={resumeData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
