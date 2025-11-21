import React, { useState, useRef, useEffect } from "react";
import {
  ResumeData,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  SkillCategory,
  Project,
  Activity,
  Volunteering,
  Award,
  ColorScheme,
} from "../types/resume";
import ResumePreview from "../components/ResumePreview";
import { useToast } from "../../../contexts/ToastContext";
import ResumeHeader from "../components/ResumeHeader";
import ResumeSidebar from "../components/ResumeSidebar";
import { getDummyResumeData } from "../utils/dummyData";
import { getColorsFromScheme } from "../utils/colorUtils";
import { printResumeToPDF } from "../utils/printUtils";
import { getCurrentUserId } from "../../../utils/userIdHelper";

const ResumeBuilder: React.FC = () => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to skills category in preview
  const handlePreviewCategory = (category: SkillCategory) => {
    if (previewContainerRef.current) {
      // Find specific category element in preview
      const categoryElement = previewContainerRef.current.querySelector(`#skill-category-${category}`);
      if (categoryElement) {
        // Scroll to specific category
        categoryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add temporary highlight to the category
        categoryElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50', 'rounded-lg', 'p-2');
        setTimeout(() => {
          categoryElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50', 'rounded-lg', 'p-2');
        }, 2000);
      }
    }
  };

  // Handle scroll to section in preview
  const handlePreviewSection = (sectionId: string) => {
    if (previewContainerRef.current) {
      // Find section element in preview
      const sectionElement = previewContainerRef.current.querySelector(`[data-section="${sectionId}"]`);
      if (sectionElement) {
        // Scroll to section
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add temporary highlight to the section
        sectionElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50', 'rounded-lg');
        setTimeout(() => {
          sectionElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50', 'rounded-lg');
        }, 2000);
      }
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState("personal");
  const [activeSubsection, setActiveSubsection] = useState<string | undefined>(undefined);
  const [zoom, setZoom] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      imageUrl: "",
      title: "",
      email: "",
      phone: "",
      address: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      twitter: "",
      hackerrank: "",
      hackerearth: "",
      codechef: "",
      leetcode: "",
      cssbattle: "",
      relevantExperience: "",
      totalExperience: "",
      summary: "",
      careerObjective: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    activities: [],
    volunteering: [],
    awards: [],
    selectedTemplate: "minimal",
    themeColor: "#3b82f6",
    colorScheme: "Professional Blue",
    sectionOrder: ["personal", "skills", "experience", "education", "projects", "activities", "volunteering", "awards"],
  });

  // Helper function to get user-specific storage keys
  const getStorageKeys = (userId: string) => ({
    resumeData: `resumeData_${userId}`,
    resumeZoom: `resumeZoom_${userId}`,
  });

  // Helper function to migrate old global data to user-specific storage
  const migrateGlobalDataToUserStorage = (userId: string) => {
    try {
      const globalDataKey = "resumeData";
      const globalZoomKey = "resumeZoom";
      const { resumeData: userDataKey, resumeZoom: userZoomKey } = getStorageKeys(userId);

      // Check if global data exists and user-specific data doesn't
      const globalData = localStorage.getItem(globalDataKey);
      const globalZoom = localStorage.getItem(globalZoomKey);
      const userData = localStorage.getItem(userDataKey);

      if (globalData && !userData) {
        // Migrate global data to user-specific storage
        localStorage.setItem(userDataKey, globalData);
        if (globalZoom) {
          localStorage.setItem(userZoomKey, globalZoom);
        }
        // Keep global data for backward compatibility (or remove if desired)
        // localStorage.removeItem(globalDataKey);
        // localStorage.removeItem(globalZoomKey);
        console.log("Migrated global resume data to user-specific storage");
      }
    } catch (error) {
      console.error("Failed to migrate resume data:", error);
    }
  };

  // Initialize user ID and load user-specific data
  useEffect(() => {
    try {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);

      if (userId) {
        // Migrate old global data if exists
        migrateGlobalDataToUserStorage(userId);

        const { resumeData: dataKey, resumeZoom: zoomKey } = getStorageKeys(userId);
        const savedData = localStorage.getItem(dataKey);
        const savedZoom = localStorage.getItem(zoomKey);

        if (savedData) {
          const parsed = JSON.parse(savedData);
          // Ensure new sections exist
          if (!parsed.activities) parsed.activities = [];
          if (!parsed.volunteering) parsed.volunteering = [];
          if (!parsed.awards) parsed.awards = [];
          if (!parsed.themeColor) parsed.themeColor = "#3b82f6";
          if (!parsed.colorScheme) parsed.colorScheme = "Professional Blue";
          if (!parsed.sectionOrder) parsed.sectionOrder = ["personal", "skills", "experience", "education", "projects", "activities", "volunteering", "awards"];
          if (!parsed.personalInfo) parsed.personalInfo = {};
          if (!parsed.personalInfo.careerObjective) parsed.personalInfo.careerObjective = "";
          if (!parsed.personalInfo.twitter) parsed.personalInfo.twitter = "";
          if (!parsed.personalInfo.hackerrank) parsed.personalInfo.hackerrank = "";
          if (!parsed.personalInfo.hackerearth) parsed.personalInfo.hackerearth = "";
          if (!parsed.personalInfo.codechef) parsed.personalInfo.codechef = "";
          if (!parsed.personalInfo.leetcode) parsed.personalInfo.leetcode = "";
          if (!parsed.personalInfo.cssbattle) parsed.personalInfo.cssbattle = "";
          setResumeData(parsed);
        }

        if (savedZoom) {
          setZoom(parseFloat(savedZoom));
        }
      }
    } catch (error) {
      console.error("Failed to load resume data:", error);
      showErrorToast("Failed to load resume data. Please refresh the page.");
    }
  }, []);

  // Auto-save to user-specific localStorage
  useEffect(() => {
    if (!currentUserId) return;

    try {
      const { resumeData: dataKey, resumeZoom: zoomKey } = getStorageKeys(currentUserId);
      localStorage.setItem(dataKey, JSON.stringify(resumeData));
      localStorage.setItem(zoomKey, zoom.toString());
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.error("Storage quota exceeded. Please clear some data or use export to backup your resume.");
        showErrorToast("Storage quota exceeded. Please export your resume to backup your data.");
      } else {
        console.error("Failed to save resume data:", error);
        showErrorToast("Failed to save resume data. Your changes may not persist.");
      }
    }
  }, [resumeData, zoom, currentUserId, showErrorToast]);

  const updatePersonalInfo = (personalInfo: PersonalInfo) => {
    setResumeData((prev) => ({ ...prev, personalInfo }));
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

  const updateActivities = (activities: Activity[]) => {
    setResumeData((prev) => ({ ...prev, activities }));
  };

  const updateVolunteering = (volunteering: Volunteering[]) => {
    setResumeData((prev) => ({ ...prev, volunteering }));
  };

  const updateAwards = (awards: Award[]) => {
    setResumeData((prev) => ({ ...prev, awards }));
  };

  const updateTemplate = (templateId: string) => {
    setResumeData((prev) => ({ ...prev, selectedTemplate: templateId }));
  };

  const updateColorScheme = (scheme: ColorScheme, themeColor: string) => {
    setResumeData((prev) => ({ 
      ...prev, 
      colorScheme: scheme,
      themeColor: themeColor 
    }));
  };

  const updateSectionOrder = (newOrder: string[]) => {
    setResumeData((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  const handleLoadSampleData = () => {
    const sampleData = getDummyResumeData();
    setResumeData(sampleData);
    showSuccessToast("Sample Data Loaded", "Resume has been populated with sample data!");
  };

  const handleSectionChange = (sectionId: string, subsection?: string) => {
    setActiveSection(sectionId);
    setActiveSubsection(subsection);
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(resumeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccessToast("Exported", "Resume data exported successfully!");
    } catch (error) {
      showErrorToast("Error", "Failed to export resume data.");
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as ResumeData;
        
        // Ensure all required fields exist
        if (!imported.activities) imported.activities = [];
        if (!imported.volunteering) imported.volunteering = [];
        if (!imported.awards) imported.awards = [];
        if (!imported.themeColor) imported.themeColor = "#3b82f6";
        if (!imported.selectedTemplate) imported.selectedTemplate = "modern";
        
        setResumeData(imported);
        showSuccessToast("Imported", "Resume data imported successfully!");
      } catch (error) {
        showErrorToast("Error", "Failed to import resume data. Invalid file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadPDF = () => {
    // Prevent multiple simultaneous downloads
    if ((handleDownloadPDF as any).isGenerating) {
      return;
    }
    
    if (!printRef.current) {
      showErrorToast("Error", "Resume content not found. Please try again.");
      return;
    }

    const element = printRef.current;
    if (!element) {
      showErrorToast("Error", "Resume content not found. Please try again.");
      return;
    }

    const firstName = resumeData.personalInfo.firstName || "resume";
    const lastName = resumeData.personalInfo.lastName || "";
    const filename = `resume-${firstName}-${lastName}`.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
    
    // Mark as generating to prevent multiple calls
    (handleDownloadPDF as any).isGenerating = true;
    
    // SIMPLIFIED: Use print window directly - no heavy processing, no style modifications
    // This prevents page freezing
    try {
      // Show info message immediately
      showSuccessToast("Opening Print Dialog", "Please select 'Save as PDF' in the print dialog.");
      
      // Use browser's native print-to-PDF (handles all modern CSS including oklch)
      // This approach doesn't freeze the page and doesn't modify any styles
      const printSuccess = printResumeToPDF(element, filename);
      
      if (!printSuccess) {
        showErrorToast("Print Window Failed", "Failed to open print window. Please check popup blocker settings.");
      }
    } catch (printError) {
      console.error("Error opening print window:", printError);
      showErrorToast("PDF Generation Failed", "Failed to open print dialog. Please try again.");
    } finally {
      // Clear generating flag
      (handleDownloadPDF as any).isGenerating = false;
    }
  };

  const handleReset = () => {
    setResumeData({
      personalInfo: {
        firstName: "",
        lastName: "",
        imageUrl: "",
        title: "",
        email: "",
        phone: "",
        address: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
        twitter: "",
        hackerrank: "",
        hackerearth: "",
        codechef: "",
        leetcode: "",
        cssbattle: "",
        relevantExperience: "",
        totalExperience: "",
        summary: "",
        careerObjective: "",
      },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      activities: [],
      volunteering: [],
      awards: [],
      selectedTemplate: "minimal",
      themeColor: "#3b82f6",
      colorScheme: "Professional Blue",
      sectionOrder: ["personal", "skills", "experience", "education", "projects", "activities", "volunteering", "awards"],
    });
    setZoom(1);
    showSuccessToast("Reset", "All resume data has been reset.");
  };

  // Sections are now rendered in ResumeSidebar component

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Header */}
      <ResumeHeader
        selectedTemplate={resumeData.selectedTemplate}
        onTemplateChange={updateTemplate}
        colorScheme={resumeData.colorScheme || "Professional Blue"}
        onColorSchemeChange={updateColorScheme}
        onExport={handleExport}
        onImport={handleImport}
        onDownloadPDF={handleDownloadPDF}
        onLoadSampleData={handleLoadSampleData}
        zoom={zoom}
        onZoomChange={setZoom}
        resumeData={resumeData}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
        {/* Preview - Left Side (75%) */}
        <div className="w-3/4 border-r border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto" style={{ overflowX: 'hidden', maxWidth: '75%' }}>
          <div className="p-4">
            <div className="sticky top-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
                <div className="mb-3 flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Live Preview</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                    <span className="font-medium">{Math.round(zoom * 100)}%</span>
                  </div>
            </div>
                <div
                  ref={previewContainerRef}
                  className="bg-white rounded-lg w-full overflow-auto flex items-start justify-center"
                  style={{
                    height: "calc(100vh - 180px)",
                    minHeight: "calc(100vh - 180px)",
                    padding: '20px',
                  }}
                >
                      <div 
                        ref={printRef} 
                        style={{ 
                          width: `${100 / zoom}%`,
                          maxWidth: "100%",
                          overflowX: 'hidden',
                          transform: `scale(${zoom})`,
                          transformOrigin: "center top",
                          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          margin: '0 auto',
                        }}
                      >
                        <ResumePreview
                          key={`${resumeData.colorScheme}-${resumeData.themeColor}-${resumeData.selectedTemplate}`}
                          data={resumeData}
                          zoom={zoom}
                          themeColor={resumeData.themeColor || getColorsFromScheme(resumeData.colorScheme || "Professional Blue").primary}
                          colorScheme={resumeData.colorScheme || "Professional Blue"}
                        />
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with Forms - Right Side (~40%) */}
        <ResumeSidebar
          activeSection={activeSection}
          activeSubsection={activeSubsection}
          onSectionChange={handleSectionChange}
          onReset={handleReset}
          sectionOrder={resumeData.sectionOrder}
          onSectionOrderChange={updateSectionOrder}
          // Pass form data and handlers
          resumeData={resumeData}
          onPersonalInfoChange={updatePersonalInfo}
          onExperienceChange={updateExperience}
          onEducationChange={updateEducation}
          onSkillsChange={updateSkills}
          onProjectsChange={updateProjects}
          onActivitiesChange={updateActivities}
          onVolunteeringChange={updateVolunteering}
          onAwardsChange={updateAwards}
          onPreviewCategory={handlePreviewCategory}
          onPreviewSection={handlePreviewSection}
        />
      </div>
    </div>
  );
};

export default ResumeBuilder;
