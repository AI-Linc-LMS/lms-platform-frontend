"use client";

import { forwardRef } from "react";
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
import { PagedResume, type PagedResumeHandle, type ResumeDocument } from "./paging/PagedResume";
import type { DocumentSections, ResumeLayout } from "./paging/sectionLayout";

export type ResumeTemplateName =
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

interface ResumePreviewProps {
  resumeData: ResumeData;
  template: ResumeTemplateName;
  /** Told how many pages the resume takes, and whether it was fitted, for the toolbar. */
  onLayout?: (doc: Pick<ResumeDocument, "pages" | "mode" | "scale">) => void;
  /** The learner's section arrangement. */
  layout?: ResumeLayout;
  /** Told which sections this template has and where it puts them. */
  onDocumentSections?: (sections: DocumentSections) => void;
}

export const ResumePreview = forwardRef<PagedResumeHandle, ResumePreviewProps>(
  ({ resumeData, template, onLayout, layout, onDocumentSections }, ref) => {
    return (
      <PagedResume
        ref={ref}
        template={template}
        layout={layout}
        onLayout={onLayout}
        onDocumentSections={onDocumentSections}
      >
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
      </PagedResume>
    );
  },
);

ResumePreview.displayName = "ResumePreview";
