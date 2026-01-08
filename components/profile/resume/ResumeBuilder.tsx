"use client";

import { useState, useRef, useEffect } from "react";
import { Box, Button, Paper, Menu, MenuItem, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeForm } from "./ResumeForm";
import { ResumePreview } from "./ResumePreview";
import { ResumeData } from "./types";
import { useToast } from "@/components/common/Toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ResumeBuilderProps {
  initialData?: Partial<ResumeData>;
}

// Dummy data for prefilling
const getDummyData = (initialData?: Partial<ResumeData>): ResumeData => ({
  basicInfo: {
    firstName: initialData?.basicInfo?.firstName || "John",
    lastName: initialData?.basicInfo?.lastName || "Doe",
    professionalTitle:
      initialData?.basicInfo?.professionalTitle || "Senior Software Engineer",
    email: initialData?.basicInfo?.email || "john.doe@example.com",
    phone: initialData?.basicInfo?.phone || "+1 (555) 123-4567",
    location: initialData?.basicInfo?.location || "San Francisco, CA",
    photo: initialData?.basicInfo?.photo || "",
    summary:
      initialData?.basicInfo?.summary ||
      "Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions and leading cross-functional teams.",
    github: initialData?.basicInfo?.github || "johndoe",
    linkedin: initialData?.basicInfo?.linkedin || "johndoe",
  },
  workExperience: initialData?.workExperience || [
    {
      id: "1",
      position: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      location: "San Francisco, CA",
      startDate: "2021-06",
      endDate: "",
      current: true,
      description: [
        "Led development of microservices architecture serving 1M+ users",
        "Improved application performance by 40% through code optimization",
        "Mentored team of 5 junior developers",
      ],
    },
    {
      id: "2",
      position: "Software Engineer",
      company: "Digital Innovations",
      location: "Remote",
      startDate: "2019-03",
      endDate: "2021-05",
      current: false,
      description: [
        "Developed and maintained React-based web applications",
        "Implemented RESTful APIs using Node.js and Express",
        "Collaborated with UX team to improve user experience",
      ],
    },
  ],
  education: initialData?.education || [
    {
      id: "1",
      degree: "Bachelor of Science in Computer Science",
      institution: "University of California",
      location: "Berkeley, CA",
      startDate: "2015-09",
      endDate: "2019-05",
      gpa: "3.8/4.0",
      description: "Focus on Software Engineering and Artificial Intelligence",
    },
  ],
  skills: initialData?.skills || [
    { id: "1", name: "JavaScript/TypeScript", level: 5 },
    { id: "2", name: "React & Next.js", level: 5 },
    { id: "3", name: "Node.js & Express", level: 4 },
    { id: "4", name: "Python", level: 4 },
    { id: "5", name: "AWS & Cloud Services", level: 4 },
    { id: "6", name: "Docker & Kubernetes", level: 3 },
    { id: "7", name: "SQL & NoSQL Databases", level: 4 },
    { id: "8", name: "Git & CI/CD", level: 5 },
  ],
  projects: initialData?.projects || [
    {
      id: "1",
      name: "E-Commerce Platform",
      description:
        "Built a scalable e-commerce platform handling 10K+ daily transactions with real-time inventory management and payment processing.",
      technologies: ["React", "Node.js", "MongoDB", "Stripe", "Redis"],
      link: "https://github.com/johndoe/ecommerce",
    },
    {
      id: "2",
      name: "Task Management App",
      description:
        "Developed a collaborative task management application with real-time updates and team collaboration features.",
      technologies: ["Next.js", "PostgreSQL", "WebSocket", "Tailwind CSS"],
      link: "https://github.com/johndoe/taskmanager",
    },
  ],
  certifications: initialData?.certifications || [
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2022-08",
      link: "",
    },
    {
      id: "2",
      name: "Professional Scrum Master I",
      issuer: "Scrum.org",
      date: "2021-11",
      link: "",
    },
  ],
});

export function ResumeBuilder({ initialData }: ResumeBuilderProps) {
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<
    "modern" | "classic" | "minimal" | "executive" | "creative" | "technical"
  >("modern");
  const [templateMenuAnchor, setTemplateMenuAnchor] =
    useState<null | HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load resume data from localStorage or use dummy data
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const savedData = localStorage.getItem("resumeData");
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      // Silently handle resume loading error
    }
    return getDummyData(initialData);
  });

  const handleSave = () => {
    try {
      localStorage.setItem("resumeData", JSON.stringify(resumeData));
      showToast("Resume saved successfully", "success");
    } catch (error) {
      showToast("Failed to save resume", "error");
    }
  };

  const handleClearData = () => {
    try {
      localStorage.removeItem("resumeData");
      setResumeData(getDummyData(initialData));
      showToast("Resume data cleared", "success");
    } catch (error) {
      showToast("Failed to clear data", "error");
    }
  };

  // Auto-save to localStorage whenever resumeData changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem("resumeData", JSON.stringify(resumeData));
      } catch (error) {
        // Silently handle auto-save failure
      }
    }, 1000); // Debounce auto-save by 1 second

    return () => clearTimeout(timeoutId);
  }, [resumeData]);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    try {
      showToast("Generating PDF...", "info");

      // Get the element to capture
      const element = previewRef.current;

      // Wait a bit for any rendering to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capture the element as canvas
      // html2canvas captures the full element including scrollHeight
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality for better text rendering
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      });

      // Calculate PDF dimensions (A4 size in mm)
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      // Add the image to PDF
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pageHeight = 297; // A4 height in mm

      // If content fits on one page
      if (imgHeight <= pageHeight) {
        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );
      } else {
        // Split into multiple pages if content is taller than one page
        let heightLeft = imgHeight;
        let position = 0;

        while (heightLeft > 0) {
          if (position !== 0) {
            pdf.addPage();
          }
          pdf.addImage(
            imgData,
            "PNG",
            0,
            -position,
            imgWidth,
            imgHeight,
            undefined,
            "FAST"
          );
          heightLeft -= pageHeight;
          position -= pageHeight;
        }
      }

      // Save the PDF
      const fileName = `${resumeData.basicInfo.firstName}_${resumeData.basicInfo.lastName}_Resume.pdf`;
      pdf.save(fileName);

      showToast("PDF downloaded successfully!", "success");
    } catch (error) {
      showToast("Failed to generate PDF. Please try again.", "error");
    }
  };

  const handleTemplateMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTemplateMenuAnchor(event.currentTarget);
  };

  const handleTemplateMenuClose = () => {
    setTemplateMenuAnchor(null);
  };

  const handleTemplateSelect = (
    template:
      | "modern"
      | "classic"
      | "minimal"
      | "executive"
      | "creative"
      | "technical"
  ) => {
    setSelectedTemplate(template);
    handleTemplateMenuClose();
    showToast(`Switched to ${template} template`, "success");
  };

  return (
    <Box>
      {/* Action Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title="Save Resume Locally">
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:content-save" />}
              onClick={handleSave}
              sx={{
                textTransform: "none",
                borderColor: "#e5e7eb",
                color: "#1f2937",
                "&:hover": {
                  borderColor: "#6366f1",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Save
            </Button>
          </Tooltip>

          <Tooltip title="Clear Saved Data">
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:delete-outline" />}
              onClick={handleClearData}
              sx={{
                textTransform: "none",
                borderColor: "#e5e7eb",
                color: "#dc2626",
                "&:hover": {
                  borderColor: "#dc2626",
                  backgroundColor: "#fef2f2",
                },
              }}
            >
              Clear
            </Button>
          </Tooltip>

          <Tooltip title="Choose Template">
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:view-grid" />}
              onClick={handleTemplateMenuOpen}
              sx={{
                textTransform: "none",
                borderColor: "#e5e7eb",
                color: "#1f2937",
                "&:hover": {
                  borderColor: "#6366f1",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Template: {selectedTemplate}
            </Button>
          </Tooltip>

          <Menu
            anchorEl={templateMenuAnchor}
            open={Boolean(templateMenuAnchor)}
            onClose={handleTemplateMenuClose}
          >
            <MenuItem onClick={() => handleTemplateSelect("modern")}>
              Modern Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("classic")}>
              Classic Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("minimal")}>
              Minimal Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("executive")}>
              Executive Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("creative")}>
              Creative Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("technical")}>
              Technical Template
            </MenuItem>
          </Menu>
        </Box>

        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:download" />}
          onClick={handleDownloadPDF}
          sx={{
            textTransform: "none",
            backgroundColor: "#6366f1",
            color: "#ffffff",
            px: 3,
            "&:hover": {
              backgroundColor: "#4f46e5",
            },
          }}
        >
          Download PDF
        </Button>
      </Paper>

      {/* Side by Side Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "30% 70%" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* Left: Form */}
        <Box
          sx={{
            maxHeight: { lg: "calc(100vh - 200px)" },
            overflowY: "auto",
            pr: { lg: 2 },
          }}
        >
          <ResumeForm resumeData={resumeData} setResumeData={setResumeData} />
        </Box>

        {/* Right: Preview */}
        <Box
          sx={{
            position: { lg: "sticky" },
            top: { lg: 20 },
            maxHeight: { lg: "calc(100vh - 100px)" },
            overflowY: "auto",
          }}
        >
          <ResumePreview
            ref={previewRef}
            resumeData={resumeData}
            template={selectedTemplate}
          />
        </Box>
      </Box>
    </Box>
  );
}
