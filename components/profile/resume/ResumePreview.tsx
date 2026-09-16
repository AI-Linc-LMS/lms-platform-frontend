"use client";

import { forwardRef, useLayoutEffect, useRef, useState } from "react";
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

/** A4 at 96dpi, in CSS px. The page box below is 210mm x 297mm, which is exactly this. */
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resumeData, template }, ref) => {
    const stageRef = useRef<HTMLDivElement | null>(null);
    /**
     * How much the page is shrunk to fit the space it is given. It used to be four hard-coded
     * breakpoint steps, which guessed the column width and guessed wrong: the page box is a flex
     * item, so it was ALSO squeezed to 640px at 1000px wide and 695px at 1366px, well under A4.
     * Text then reflowed narrower than in the PDF, which renders at a true 210mm, so the preview
     * and the download disagreed about where the text ends.
     *
     * Measuring the space instead fixes both halves. The page keeps its true A4 width and is
     * scaled to fit, never above 1: a preview larger than the paper helps nobody.
     */
    const [view, setView] = useState(1);
    useLayoutEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;
      const fit = () => {
        const available = stage.clientWidth - 32; // the stage's own p: 2 gutters
        if (available > 0) setView(Math.min(1, available / PAGE_WIDTH_PX));
      };
      fit();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(fit);
      ro.observe(stage);
      return () => ro.disconnect();
    }, []);

    return (
      <Box
        ref={stageRef}
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "color-mix(in srgb, var(--surface) 65%, var(--background))",
          p: 2,
          borderRadius: 2,
        }}
      >
        {/* The page is scaled, and a transform does not change the space an element takes up, so
            the box below reserves the SCALED size. Without it the layout kept room for a full
            unscaled page and left up to 690px of dead grey under the preview. */}
        <Box
          sx={{
            width: `${Math.round(PAGE_WIDTH_PX * view)}px`,
            height: `${Math.round(PAGE_HEIGHT_PX * view)}px`,
            flexShrink: 0,
            "@media print": { width: "auto", height: "auto" },
          }}
        >
          <Box
            ref={ref}
            data-resume-content
            sx={{
              width: "210mm", // A4 width (794px at 96 DPI)
              height: "297mm", // A4 height (1123px at 96 DPI)
              minHeight: "297mm",
              // A flex item shrinks by default, and this one did: the "A4" page was 640px wide on a
              // 1000px screen. Never let the paper be narrower than the paper.
              flexShrink: 0,
              backgroundColor: "var(--card-bg)",
              boxShadow: "0 2px 4px color-mix(in srgb, var(--font-primary) 22%, transparent)",
              overflow: "hidden", // Ensure content doesn't overflow
              transform: view !== 1 ? `scale(${view})` : "none",
              // Anchored at the left, because the reserved box above is exactly the scaled size:
              // from the centre the page would sit half outside it.
              transformOrigin: "top left",
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
              // A section heading is one or two short words ("WORK EXPERIENCE"), so keeping it on
              // one line is safe.
              "& [data-resume-section-title]": {
                whiteSpace: "nowrap",
              },
              /* An entry title is NOT short. "Bachelor of Technology in Computer Science and
                 Engineering" is a real degree line, and forbidding it to wrap put 145px of it
                 outside the page in Western and Bubble, where the page box then clipped it: the
                 learner's own degree, half printed. The rule was meant to stop ugly mid-word
                 breaks in the PDF, and `break-word` keeps that promise - it breaks between words,
                 and inside one only when a single word cannot fit the line at all. */
              "& [data-resume-nowrap]": {
                whiteSpace: "normal",
                overflowWrap: "break-word",
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
                /* `white-space` had to come back, as `normal` this time. Several templates set
                   `nowrap` on the contact line itself, which `overflow-wrap` cannot override -
                   a line that may not break cannot break anywhere. With a real student address
                   ("Plot 14, Sector 7, Kothri Kalan, Ashta Tehsil, Sehore District") that put
                   249px outside the page in Right Sidebar, 175 in Bubble and 73 in Two Column.
                   This selector is a class plus an attribute, so it outranks the template's own
                   rule, which is why the fix belongs here and not in twelve files. */
                whiteSpace: "normal",
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
      </Box>
    );
  }
);

ResumePreview.displayName = "ResumePreview";
