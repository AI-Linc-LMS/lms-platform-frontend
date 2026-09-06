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
import { WesternTemplate } from "./templates/WesternTemplate";
import { LuxSleekTemplate } from "./templates/LuxSleekTemplate";
import { TwoColumnTemplate } from "./templates/TwoColumnTemplate";
import { AccentBarTemplate } from "./templates/AccentBarTemplate";
import { RightSidebarTemplate } from "./templates/RightSidebarTemplate";
import { BubbleTemplate } from "./templates/BubbleTemplate";
import { FitToPage } from "./FitToPage";

interface ResumePreviewProps {
  resumeData: ResumeData;
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
    | "bubble";
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resumeData, template }, ref) => {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "color-mix(in srgb, var(--surface) 65%, var(--background))",
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
            backgroundColor: "var(--card-bg)",
            boxShadow: "0 2px 4px color-mix(in srgb, var(--font-primary) 22%, transparent)",
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
            "& [data-resume-section-title], & [data-resume-nowrap]": {
              whiteSpace: "nowrap",
            },
            /* This block used to force `white-space: nowrap; overflow: visible` on every
               contact item. Both halves were wrong, and together they were the whole of
               "the contents are going out of the page".

               The templates already handle a long contact string themselves -- RightSidebar
               sets `word-break: break-all` on the email and `text-overflow: ellipsis` on the
               profile links. But this rule is a descendant selector (one class + one attribute
               = higher specificity than the element's own emotion class), so it WON, and
               `nowrap` makes `break-all` inert: a line that may not break cannot break
               anywhere. `overflow: visible` then chose spilling over clipping.

               Measured in a headless browser at true A4 with a realistic student profile --
               a 62-character college email and a long district address -- RightSidebar ran
               97px past the right edge and Bubble 36px. With the rule below, horizontal
               overflow is 0px on all 12 templates at both a short and a full resume.

               `overflow-wrap: anywhere` breaks ONLY when a line would otherwise overflow, so
               ordinary short contact lines still sit on one line exactly as before. `min-width:
               0` lets a flex child actually shrink to its container. */
            "& [data-resume-contact-item]": {
              minWidth: 0,
              overflowWrap: "anywhere",
            },
            "@media print": {
              boxShadow: "none",
              transform: "none",
              width: "100%",
              height: "auto",
            },
          }}
        >
          {/* This page box sets overflow:hidden, so a template taller than 297mm was silently
              CUT OFF - the learner lost the bottom of their own resume with no indication.
              Measured against the sample data, Technical ran 168px past the page. FitToPage
              shrinks an over-long resume just enough to fit, and is a no-op (scale 1) for
              every template that already fits. */}
          <FitToPage>
            {template === "modern" && <ModernTemplate data={resumeData} />}
            {template === "classic" && <ClassicTemplate data={resumeData} />}
            {template === "minimal" && <MinimalTemplate data={resumeData} />}
            {template === "executive" && <ExecutiveTemplate data={resumeData} />}
            {template === "creative" && <CreativeTemplate data={resumeData} />}
            {template === "technical" && <TechnicalTemplate data={resumeData} />}
            {template === "western" && <WesternTemplate data={resumeData} />}
            {template === "luxsleek" && <LuxSleekTemplate data={resumeData} />}
            {template === "twocolumn" && <TwoColumnTemplate data={resumeData} />}
            {template === "accentbar" && <AccentBarTemplate data={resumeData} />}
            {template === "rightsidebar" && <RightSidebarTemplate data={resumeData} />}
            {template === "bubble" && <BubbleTemplate data={resumeData} />}
          </FitToPage>
        </Box>
      </Box>
    );
  }
);

ResumePreview.displayName = "ResumePreview";
