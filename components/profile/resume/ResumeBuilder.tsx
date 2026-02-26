"use client";

import { useState, useRef, useEffect } from "react";
import { Box, Button, Paper, Menu, MenuItem, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeForm } from "./ResumeForm";
import { ResumePreview } from "./ResumePreview";
import { ResumeData } from "./types";
import { useToast } from "@/components/common/Toast";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface ResumeBuilderProps {
  initialData?: Partial<ResumeData>;
}

const MOCK_WORK: ResumeData["workExperience"] = [
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
];

const MOCK_EDUCATION: ResumeData["education"] = [
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
];

const MOCK_SKILLS: ResumeData["skills"] = [
  { id: "1", name: "JavaScript/TypeScript", level: 5 },
  { id: "2", name: "React & Next.js", level: 5 },
  { id: "3", name: "Node.js & Express", level: 4 },
  { id: "4", name: "Python", level: 4 },
  { id: "5", name: "AWS & Cloud Services", level: 4 },
  { id: "6", name: "Docker & Kubernetes", level: 3 },
  { id: "7", name: "SQL & NoSQL Databases", level: 4 },
  { id: "8", name: "Git & CI/CD", level: 5 },
];

const MOCK_PROJECTS: ResumeData["projects"] = [
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
];

const MOCK_CERTS: ResumeData["certifications"] = [
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
];

const hasContent = (arr?: unknown[]) => arr && arr.length > 0;

const buildResumeData = (d?: Partial<ResumeData>): ResumeData => ({
  basicInfo: {
    firstName: d?.basicInfo?.firstName || "John",
    lastName: d?.basicInfo?.lastName || "Doe",
    professionalTitle: d?.basicInfo?.professionalTitle || "Senior Software Engineer",
    email: d?.basicInfo?.email || "john.doe@example.com",
    phone: d?.basicInfo?.phone || "+1 (555) 123-4567",
    location: d?.basicInfo?.location || "San Francisco, CA",
    photo: d?.basicInfo?.photo || "",
    summary:
      d?.basicInfo?.summary ||
      "Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions and leading cross-functional teams.",
    github: d?.basicInfo?.github ?? "",
    linkedin: d?.basicInfo?.linkedin ?? "",
    portfolio: d?.basicInfo?.portfolio ?? "",
    leetcode: d?.basicInfo?.leetcode ?? "",
    hackerrank: d?.basicInfo?.hackerrank ?? "",
    kaggle: d?.basicInfo?.kaggle ?? "",
    medium: d?.basicInfo?.medium ?? "",
  },
  workExperience: hasContent(d?.workExperience) ? d!.workExperience! : MOCK_WORK,
  education: hasContent(d?.education) ? d!.education! : MOCK_EDUCATION,
  skills: hasContent(d?.skills) ? d!.skills! : MOCK_SKILLS,
  projects: hasContent(d?.projects) ? d!.projects! : MOCK_PROJECTS,
  certifications: hasContent(d?.certifications) ? d!.certifications! : MOCK_CERTS,
});

export function ResumeBuilder({ initialData }: ResumeBuilderProps) {
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<
    "modern" | "classic" | "minimal" | "executive" | "creative" | "technical" | "western" | "luxsleek" | "twocolumn" | "accentbar" | "rightsidebar" | "bubble"
  >("modern");
  const [templateMenuAnchor, setTemplateMenuAnchor] =
    useState<null | HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [isProfileMode, setIsProfileMode] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>(() => buildResumeData());

  const handleSave = () => {
    showToast("Resume saved", "success");
  };

  const handleClearData = () => {
    setResumeData(buildResumeData());
    setIsProfileMode(false);
    showToast("Resume data cleared", "success");
  };

  const handleToggleSource = () => {
    if (isProfileMode) {
      setResumeData(buildResumeData());
      setIsProfileMode(false);
      showToast("Switched to mock data", "info");
    } else {
      setResumeData(buildResumeData(initialData));
      setIsProfileMode(true);
      showToast("Profile data imported", "success");
    }
  };

  /** Convert img elements to data URLs so they can be embedded in the PDF (avoids CORS issues). */
  const convertImagesInElementToDataUrls = async (el: HTMLElement) => {
    const imgs = el.querySelectorAll("img[src]");
    await Promise.all(
      Array.from(imgs).map(
        (img) =>
          new Promise<void>((resolve) => {
            const src = (img as HTMLImageElement).getAttribute("src");
            if (!src || src.startsWith("data:")) {
              resolve();
              return;
            }
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(image, 0, 0);
                  (img as HTMLImageElement).setAttribute(
                    "src",
                    canvas.toDataURL("image/png")
                  );
                }
              } finally {
                resolve();
              }
            };
            image.onerror = () => resolve();
            image.src = src;
          })
      )
    );
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    // Patch CSSStyleSheet.cssRules to prevent SecurityError on cross-origin
    // stylesheets (Google Fonts, CDN CSS) — html-to-image reads all rules.
    const origDescriptor = Object.getOwnPropertyDescriptor(
      CSSStyleSheet.prototype,
      "cssRules"
    );
    let patched = false;
    try {
      Object.defineProperty(CSSStyleSheet.prototype, "cssRules", {
        get: function () {
          try {
            return origDescriptor?.get?.call(this) ?? [];
          } catch {
            return [];
          }
        },
        configurable: true,
        enumerable: origDescriptor?.enumerable ?? true,
      });
      patched = true;
    } catch {
      /* continue without patch */
    }

    try {
      showToast("Generating PDF...", "info");

      const element = previewRef.current;

      await new Promise((resolve) => setTimeout(resolve, 300));
      await convertImagesInElementToDataUrls(element);

      // Off-screen wrapper at left:-9999px avoids any visible flash.
      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "position:fixed;left:-9999px;top:0;width:210mm;height:297mm;overflow:visible;pointer-events:none;z-index:-1;";
      document.body.appendChild(wrapper);

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.setProperty("transform", "none", "important");
      clone.style.setProperty("box-shadow", "none", "important");
      clone.style.setProperty("width", "210mm", "important");
      clone.style.setProperty("height", "297mm", "important");
      clone.style.setProperty("overflow", "hidden");
      wrapper.appendChild(clone);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Measure link positions from the untransformed clone
      const cloneRect = clone.getBoundingClientRect();
      const linkAnnotations: {
        x: number;
        y: number;
        w: number;
        h: number;
        url: string;
      }[] = [];

      clone.querySelectorAll("a[href]").forEach((a) => {
        const href = (a as HTMLAnchorElement).getAttribute("href");
        if (!href) return;
        const r = a.getBoundingClientRect();
        linkAnnotations.push({
          x: ((r.left - cloneRect.left) / cloneRect.width) * 210,
          y: ((r.top - cloneRect.top) / cloneRect.height) * 297,
          w: (r.width / cloneRect.width) * 210,
          h: (r.height / cloneRect.height) * 297,
          url: href,
        });
      });

      // html-to-image uses SVG foreignObject — the browser's own CSS engine
      // handles rendering, so the output is pixel-perfect.
      // The cssRules patch above handles CORS for cross-origin stylesheets.
      const dataUrl = await toPng(clone, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      document.body.removeChild(wrapper);

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const rawHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;
      const imgHeight = Math.min(rawHeight, pageHeight);

      // Compress to JPEG (quality 0.92) to keep PDF under 5 MB with minimal visual loss.
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(img, 0, 0);
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.97);

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(jpegDataUrl, "JPEG", 0, 0, imgWidth, imgHeight);

      linkAnnotations.forEach((link) => {
        const pageIndex = Math.floor(link.y / pageHeight);
        const yOnPage = link.y - pageIndex * pageHeight;
        pdf.setPage(pageIndex + 1);
        pdf.link(link.x, yOnPage, link.w, link.h, { url: link.url });
      });

      const fileName = `${resumeData.basicInfo.firstName}_${resumeData.basicInfo.lastName}_Resume.pdf`;
      pdf.save(fileName);

      showToast("PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("PDF generation error:", error);
      showToast("Failed to generate PDF. Please try again.", "error");
    } finally {
      if (patched && origDescriptor) {
        try {
          Object.defineProperty(
            CSSStyleSheet.prototype,
            "cssRules",
            origDescriptor
          );
        } catch {
          /* ignore */
        }
      }
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
      | "western"
      | "luxsleek"
      | "twocolumn"
      | "accentbar"
      | "rightsidebar"
      | "bubble"
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

          <Tooltip title={isProfileMode ? "Switch back to mock/sample data" : "Import data from your profile section"}>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon={isProfileMode ? "mdi:swap-horizontal" : "mdi:account-arrow-right"} />}
              onClick={handleToggleSource}
              sx={{
                textTransform: "none",
                borderColor: isProfileMode ? "#6366f1" : "#e5e7eb",
                color: "#6366f1",
                backgroundColor: isProfileMode ? "#eef2ff" : "transparent",
                "&:hover": {
                  borderColor: "#6366f1",
                  backgroundColor: isProfileMode ? "#e0e7ff" : "#eef2ff",
                },
              }}
            >
              {isProfileMode ? "Use Mock Data" : "Import from Profile"}
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
            <MenuItem onClick={() => handleTemplateSelect("western")}>
              Western Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("luxsleek")}>
              LuxSleek Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("twocolumn")}>
              Two Column Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("accentbar")}>
              Accent Bar Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("rightsidebar")}>
              Right Sidebar Template
            </MenuItem>
            <MenuItem onClick={() => handleTemplateSelect("bubble")}>
              Bubble Template
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
