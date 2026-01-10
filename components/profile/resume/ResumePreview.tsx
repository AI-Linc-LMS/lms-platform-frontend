"use client";

import { forwardRef } from "react";
import { Box } from "@mui/material";
import { ResumeData } from "./types";
import { ModernTemplate } from "./templates/ModernTemplate";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { ExecutiveTemplate } from "./templates/ExecutiveTemplate";
import { CreativeTemplate } from "./templates/CreativeTemplate";
import { TechnicalTemplate } from "./templates/TechnicalTemplate";

interface ResumePreviewProps {
  resumeData: ResumeData;
  template:
    | "modern"
    | "classic"
    | "minimal"
    | "executive"
    | "creative"
    | "technical";
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resumeData, template }, ref) => {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          p: 2,
          borderRadius: 2,
          minHeight: "calc(297mm * 0.8)", // Account for scaling
        }}
      >
        <Box
          ref={ref}
          data-resume-content
          sx={{
            width: "210mm", // A4 width (794px at 96 DPI)
            height: "297mm", // A4 height (1123px at 96 DPI)
            minHeight: "297mm",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            overflow: "hidden", // Ensure content doesn't overflow
            transform: {
              xs: "scale(0.4)",
              md: "scale(0.55)",
              lg: "scale(0.8)",
              xl: "scale(0.95)",
            },
            transformOrigin: "top center",
            userSelect: "none",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            "& *": {
              WebkitPrintColorAdjust: "exact !important",
              printColorAdjust: "exact !important",
              colorAdjust: "exact !important",
              boxSizing: "border-box",
            },
            // Ensure consistent line heights and spacing
            "& p, & li, & span, & div": {
              lineHeight: "inherit",
            },
            "@media print": {
              boxShadow: "none",
              transform: "none",
              width: "100%",
              height: "auto",
            },
          }}
        >
          {template === "modern" && <ModernTemplate data={resumeData} />}
          {template === "classic" && <ClassicTemplate data={resumeData} />}
          {template === "minimal" && <MinimalTemplate data={resumeData} />}
          {template === "executive" && <ExecutiveTemplate data={resumeData} />}
          {template === "creative" && <CreativeTemplate data={resumeData} />}
          {template === "technical" && <TechnicalTemplate data={resumeData} />}
        </Box>
      </Box>
    );
  }
);

ResumePreview.displayName = "ResumePreview";
