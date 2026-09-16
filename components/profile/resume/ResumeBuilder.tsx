"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Paper,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeForm } from "./ResumeForm";
import { ResumePreview } from "./ResumePreview";
import type { PagedResumeHandle, ResumeDocument } from "./paging/PagedResume";
import { SectionArrangePanel } from "./SectionArrangePanel";
import {
  EMPTY_LAYOUT,
  loadLayout,
  resetLayout,
  saveLayout,
  type DocumentSections,
  type ResumeLayout,
  type SectionId,
} from "./paging/sectionLayout";
import { config } from "@/lib/config";
import { PAGE_HEIGHT_PX } from "./paging/pageStyles";
import { ATSScoreCard } from "./ATSScoreCard";
import { ATSQuickFixes } from "./ATSQuickFixes";
import { computeStandardATSScoreReport } from "./atsStandardReport";
import {
  ResumeData,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
} from "./types";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";
import { useToast } from "@/components/common/Toast";
import { toPng } from "html-to-image";
import { resumeService } from "@/lib/services/resume.service";
import { PANEL_BORDER, PANEL_SHADOW, PROFILE, TILE_GRADIENT, CTA_GRADIENT, CTA_SHADOW } from "../theme/profileTokens";
import { LockedAction } from "@/components/common/ProfileLock";

/** Where the builder's current content came from. Drives the toolbar's segmented control. */
type ResumeSource = "sample" | "profile" | "blank";

interface ResumeBuilderProps {
  initialData?: Partial<ResumeData>;
  /**
   * Gate the two actions that put the resume in front of someone else. Editing stays open:
   * building a resume is the work that fills a profile in, so blocking the builder to demand
   * a complete profile has the dependency backwards.
   */
  lockExports?: boolean;
}

const EMPTY_BASIC_INFO: ResumeData["basicInfo"] = {
  firstName: "",
  lastName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  location: "",
  photo: "",
  summary: "",
  github: "",
  linkedin: "",
  portfolio: "",
  leetcode: "",
  hackerrank: "",
  kaggle: "",
  medium: "",
};

const TEMPLATE_KEYS: Record<string, string> = {
  modern: "templateModern",
  classic: "templateClassic",
  minimal: "templateMinimal",
  executive: "templateExecutive",
  creative: "templateCreative",
  technical: "templateTechnical",
  western: "templateWestern",
  luxsleek: "templateLuxsleek",
  twocolumn: "templateTwocolumn",
  accentbar: "templateAccentbar",
  rightsidebar: "templateRightsidebar",
  bubble: "templateBubble",
};

/** A representative colour dot per template, so the chip row reads at a glance. */
const TEMPLATE_DOTS: Record<string, string> = {
  modern: "#1a1a1a",
  classic: "#0f172a",
  minimal: "#94a3b8",
  executive: "#1e293b",
  creative: "#7c3aed",
  technical: "#0891b2",
  western: "#b45309",
  luxsleek: "#111827",
  twocolumn: "#0ea5e9",
  accentbar: "#f97316",
  rightsidebar: "#a855f7",
  bubble: "#ec4899",
};

/** Coerce null/undefined to empty string. Backend often returns null for blank fields,
 *  but MUI TextFields warn loudly when value === null. */
const s = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

function dropNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

function sanitizeWorkExperience(items?: WorkExperience[]): WorkExperience[] {
  if (!Array.isArray(items)) return [];
  return items.map((e, i) => ({
    id: s(e.id) || String(i + 1),
    position: s(e.position),
    company: s(e.company),
    location: s(e.location),
    startDate: s(e.startDate),
    endDate: s(e.endDate),
    current: Boolean(e.current),
    description: Array.isArray(e.description)
      ? e.description.map((d) => s(d)).filter((d) => d.length > 0)
      : [],
  }));
}

function sanitizeEducation(items?: Education[]): Education[] {
  if (!Array.isArray(items)) return [];
  return items.map((e, i) => ({
    id: s(e.id) || String(i + 1),
    degree: s(e.degree),
    institution: s(e.institution),
    location: s(e.location),
    startDate: s(e.startDate),
    endDate: s(e.endDate),
    gpa: s(e.gpa),
    description: s(e.description),
  }));
}

function sanitizeSkills(items?: Skill[]): Skill[] {
  if (!Array.isArray(items)) return [];
  return items.map((sk, i) => {
    const out: Skill = {
      id: s(sk.id) || String(i + 1),
      name: s(sk.name),
    };
    if (sk.level != null && Number.isFinite(Number(sk.level))) out.level = Number(sk.level);
    if (sk.category != null && sk.category !== "") out.category = s(sk.category);
    return out;
  });
}

function sanitizeProjects(items?: Project[]): Project[] {
  if (!Array.isArray(items)) return [];
  return items.map((p, i) => ({
    id: s(p.id) || String(i + 1),
    name: s(p.name),
    description: s(p.description),
    technologies: Array.isArray(p.technologies) ? p.technologies.map((t) => s(t)) : [],
    link: s(p.link),
  }));
}

function sanitizeCertifications(items?: Certification[]): Certification[] {
  if (!Array.isArray(items)) return [];
  return items.map((c, i) => ({
    id: s(c.id) || String(i + 1),
    name: s(c.name),
    issuer: s(c.issuer),
    date: s(c.date),
    link: s(c.link),
  }));
}

/** Build resume data from the user's profile. Empty profile = empty form (no mocks).
 *  All null/undefined string fields are coerced to "" so MUI inputs stay controlled. */
const buildResumeData = (d?: Partial<ResumeData>): ResumeData => ({
  basicInfo: {
    ...EMPTY_BASIC_INFO,
    ...(d?.basicInfo ? dropNullish(d.basicInfo as unknown as Record<string, unknown>) : {}),
  },
  workExperience: sanitizeWorkExperience(d?.workExperience),
  education: sanitizeEducation(d?.education),
  skills: sanitizeSkills(d?.skills),
  projects: sanitizeProjects(d?.projects),
  certifications: sanitizeCertifications(d?.certifications),
});

type TemplateName =
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

export function ResumeBuilder({ initialData, lockExports = false }: ResumeBuilderProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>("modern");
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null);
  const [atsDialogOpen, setAtsDialogOpen] = useState(false);
  const previewRef = useRef<PagedResumeHandle>(null);
  /**
   * The learner's section arrangement: order, hidden sections, and per-template column placement.
   * Held here, applied to the document the preview measures, and remembered in this browser -
   * rearranging a resume and losing it on refresh would be worse than not offering it.
   */
  const [layout, setLayout] = useState<ResumeLayout>(EMPTY_LAYOUT);
  const [docSections, setDocSections] = useState<DocumentSections>({ order: [], columns: {}, hasColumns: false });
  useEffect(() => {
    setLayout(loadLayout(config.clientId));
  }, []);
  const updateLayout = (next: ResumeLayout) => {
    setLayout(next);
    saveLayout(next, config.clientId);
  };

  /** Page count and fit, reported by the preview, so the toolbar can say what the download will be. */
  const [pageInfo, setPageInfo] = useState<Pick<ResumeDocument, "pages" | "mode" | "scale">>({
    pages: 1,
    mode: "fit",
    scale: 1,
  });

  /**
   * The sample resume is the default; the student's own data is an explicit import.
   *
   * It used to be the other way round, which meant opening the Resume tab silently poured a
   * half-finished profile into the builder: a student with three filled fields saw a nearly
   * empty document and no sense of what a finished resume looks like. Starting from a
   * complete sample shows the shape of the thing, and "Use my profile" is then a deliberate
   * act rather than something that already happened.
   */
  const [source, setSource] = useState<ResumeSource>("sample");
  const [resumeData, setResumeData] = useState<ResumeData>(() => SAMPLE_RESUME_DATA);

  /**
   * Only set when the student asks for their profile BEFORE the fetch has landed. Without
   * it, clicking "Use my profile" early would import an empty object and look broken.
   * Deliberately not a general "hydrate when data arrives" effect: that is what used to
   * overwrite the form behind the student's back.
   */
  const awaitingProfileRef = useRef(false);
  useEffect(() => {
    if (!awaitingProfileRef.current) return;
    if (initialData && Object.keys(initialData).length > 0) {
      setResumeData(buildResumeData(initialData));
      awaitingProfileRef.current = false;
    }
  }, [initialData]);

  const sectionCounts = useMemo<Partial<Record<SectionId, number>>>(
    () => ({
      summary: resumeData.basicInfo.summary?.trim() ? 1 : 0,
      workExperience: resumeData.workExperience.length,
      education: resumeData.education.length,
      skills: resumeData.skills.length,
      projects: resumeData.projects.length,
      certifications: resumeData.certifications.length,
    }),
    [resumeData]
  );

  // Rule-based score (deterministic). Shown on the toolbar until the AI analysis runs.
  const ruleBasedAtsScore = useMemo(
    // Deliberately the whole resume, not just the sections currently shown: the ATS dialog edits
    // the resume, and a score that disagreed with the one on the toolbar is a bug this builder has
    // already had once.
    () => computeStandardATSScoreReport(resumeData).atsScore,
    [resumeData]
  );

  // The rule-based score is the SINGLE source of truth for the number, everywhere.
  //
  // This used to be `aiAtsScore ?? ruleBasedAtsScore`, which meant the toolbar showed the
  // deterministic score while editing and then silently swapped to the LLM's score once the
  // dialog auto-ran its analysis - a measured 85 -> 24 drop on the very sample resume this
  // builder ships with. It also reset on every keystroke, so the number oscillated. Worse,
  // 29 of 38 tenant sites have no OPENAI_API_KEY, so /api/ats-analyze returns HTTP 501 there
  // and the AI number never existed for those users at all.
  //
  // The AI still runs where it is configured, but it now contributes only qualitative
  // feedback text - never the score. Button and dialog therefore agree by construction.
  const atsScoreLive = ruleBasedAtsScore;

  const handleClearData = () => {
    setResumeData(buildResumeData());
    setSource("blank");
    awaitingProfileRef.current = false;
    showToast(t("profile.resumeDataCleared"), "success");
  };

  const handleUseSample = () => {
    if (source === "sample") return;
    setResumeData(SAMPLE_RESUME_DATA);
    setSource("sample");
    awaitingProfileRef.current = false;
    showToast(t("profile.sampleDataLoaded"), "success");
  };

  /** Import the student's profile into the builder. Explicit, never automatic. */
  const handleUseProfile = () => {
    if (source === "profile") return;
    const hasProfile = Boolean(initialData && Object.keys(initialData).length > 0);
    setResumeData(buildResumeData(initialData));
    setSource("profile");
    // The profile fetch may still be in flight; fill in when it lands rather than importing
    // an empty object now and looking broken.
    awaitingProfileRef.current = !hasProfile;
    showToast(t("profile.switchedToProfileData"), "info");
  };

  /** Convert img elements to data URLs so they can be embedded in the PDF (avoids CORS issues). */
  const convertImagesInElementToDataUrls = async (el: HTMLElement) => {
    const imgs = el.querySelectorAll("img[src]");
    await Promise.all(
      Array.from(imgs).map(async (imgEl) => {
        const img = imgEl as HTMLImageElement;
        const src = img.getAttribute("src");
        if (!src || src.startsWith("data:")) return;

        const isExternalUrl = src.startsWith("http://") || src.startsWith("https://");
        let dataUrl: string;

        if (isExternalUrl) {
          try {
            dataUrl = await resumeService.fetchImageViaProxy(src);
          } catch {
            return;
          }
        } else {
          dataUrl = await new Promise<string>((resolve) => {
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
                  resolve(canvas.toDataURL("image/png"));
                } else {
                  resolve("");
                }
              } catch {
                resolve("");
              }
            };
            image.onerror = () => resolve("");
            image.src = src;
          });
        }

        if (dataUrl) img.setAttribute("src", dataUrl);
      })
    );
  };

  /**
   * Generate the PDF and return blob + filename for download or upload.
   *
   * One PDF page per sheet, rendered from the SAME laid-out document the preview is showing. It
   * used to clone the on-screen page, which carried the preview's own shrink-to-fit-the-window
   * scale into the download and then cropped it to one page: on a 1366px screen a long resume
   * silently lost 58 lines, and on a 1000px screen more. A resume that needs two pages now gets
   * two pages instead of having the second one thrown away.
   */
  const generatePDFBlob = async (): Promise<{ blob: Blob; fileName: string }> => {
    const doc = previewRef.current?.getDocument();
    if (!doc?.flow) throw new Error("No preview");

    const pageCount = Math.max(1, doc.pages);
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:fixed;left:-100000px;top:0;width:210mm;pointer-events:none;z-index:-1;";
    document.body.appendChild(wrapper);

    // One offscreen sheet per page, each a window onto the same document at true A4.
    const sheets: HTMLElement[] = [];
    for (let i = 0; i < pageCount; i += 1) {
      const sheet = document.createElement("div");
      sheet.style.cssText =
        "width:210mm;height:297mm;overflow:hidden;background:var(--card-bg);position:relative;";
      const copy = doc.flow.cloneNode(true) as HTMLElement;
      if (i) copy.style.marginTop = `${-i * PAGE_HEIGHT_PX}px`;
      sheet.appendChild(copy);
      wrapper.appendChild(sheet);
      sheets.push(sheet);
    }

    try {
      // Images are turned into data URLs on the COPIES. Doing it on the live preview mutated
      // React's own DOM behind its back.
      await Promise.all(sheets.map((sheet) => convertImagesInElementToDataUrls(sheet)));
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      // A dense page is about 1MB at pixelRatio 3; the backend refuses an upload over 5MB, so a
      // long resume is rendered slightly lighter rather than failing to save.
      const pixelRatio = pageCount >= 3 ? 2.5 : 3;
      const quality = pageCount >= 3 ? 0.92 : 0.97;

      for (let i = 0; i < sheets.length; i += 1) {
        const sheet = sheets[i];
        const dataUrl = await toPng(sheet, { pixelRatio, cacheBust: true });
        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");
        ctx.drawImage(img, 0, 0);
        const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);

        if (i) pdf.addPage("a4", "p");
        pdf.setPage(i + 1);
        pdf.addImage(jpegDataUrl, "JPEG", 0, 0, 210, 297);

        // Links take their page from the sheet they are on. Taking it from a y coordinate put
        // links from cut-off content on page 1, over whatever happened to be there.
        const sheetRect = sheet.getBoundingClientRect();
        sheet.querySelectorAll("a[href]").forEach((a) => {
          const href = (a as HTMLAnchorElement).getAttribute("href");
          if (!href) return;
          const r = a.getBoundingClientRect();
          if (r.bottom <= sheetRect.top || r.top >= sheetRect.bottom) return; // another sheet's window
          pdf.link(
            ((r.left - sheetRect.left) / sheetRect.width) * 210,
            ((r.top - sheetRect.top) / sheetRect.height) * 297,
            (r.width / sheetRect.width) * 210,
            (r.height / sheetRect.height) * 297,
            { url: href },
          );
        });
      }

      const fileName = `${resumeData.basicInfo.firstName}_${resumeData.basicInfo.lastName}_Resume.pdf`;
      const blob = pdf.output("blob") as Blob;
      return { blob, fileName };
    } finally {
      wrapper.remove();
    }
  };

  const handleDownloadPDF = async () => {
    const origDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "cssRules");
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
      /* continue */
    }
    try {
      showToast(t("profile.generatingPdf"), "info");
      const { blob, fileName } = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("profile.pdfDownloadSuccess"), "success");
    } catch {
      showToast(t("profile.pdfDownloadFailed"), "error");
    } finally {
      if (patched && origDescriptor) {
        try {
          Object.defineProperty(CSSStyleSheet.prototype, "cssRules", origDescriptor);
        } catch {
          /* ignore */
        }
      }
    }
  };

  const [saveResumeLoading, setSaveResumeLoading] = useState(false);
  const handleSaveResume = async () => {
    const origDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "cssRules");
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
      /* continue */
    }
    try {
      setSaveResumeLoading(true);
      showToast(t("profile.generatingPdf"), "info");
      const { blob, fileName } = await generatePDFBlob();
      const file = new File([blob], fileName, { type: "application/pdf" });
      await resumeService.uploadResume(file, fileName);
      showToast(t("profile.resumeSaveSuccess"), "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("profile.resumeSaveFailed");
      showToast(message, "error");
    } finally {
      setSaveResumeLoading(false);
      if (patched && origDescriptor) {
        try {
          Object.defineProperty(CSSStyleSheet.prototype, "cssRules", origDescriptor);
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

  const handleTemplateSelect = (template: TemplateName) => {
    setSelectedTemplate(template);
    handleTemplateMenuClose();
    const templateName = t(`profile.${TEMPLATE_KEYS[template]}`);
    showToast(t("profile.switchedToTemplate", { template: templateName }), "success");
  };

  return (
    <Box>
      {/* Toolbar. Two panels on the profile surface's card language: 32px radius, hairline
          border, the same soft depth ladder as every other card on the page. */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.75, sm: 2 },
          mb: 1.5,
          border: PANEL_BORDER,
          borderRadius: 4,
          boxShadow: PANEL_SHADOW,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background: TILE_GRADIENT,
            }}
          >
            <IconWrapper icon="mdi:file-document-outline" size={17} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h3"
              sx={{ fontWeight: 800, fontSize: "0.95rem", color: PROFILE.ink, lineHeight: 1.2, letterSpacing: "-0.2px" }}
            >
              {t("profile.myResume", { defaultValue: "My resume" })}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: PROFILE.inkFaint, mt: "1px" }}>
              {t(`profile.${TEMPLATE_KEYS[selectedTemplate]}`)}
              {" · "}
              {source === "sample"
                ? t("profile.sourceSample", { defaultValue: "Sample content" })
                : source === "profile"
                  ? t("profile.sourceProfile", { defaultValue: "Your profile" })
                  : t("profile.sourceBlank", { defaultValue: "Blank" })}
            </Typography>
            {/* What the download will actually be. A resume that needs a second page now gets one,
                and a resume kept on one page by a small shrink says so, rather than leaving the
                learner wondering why the type looks smaller than it did a moment ago. */}
            <Typography sx={{ fontSize: "0.68rem", color: PROFILE.inkFaint, mt: "1px" }}>
              {pageInfo.pages > 1
                ? `${pageInfo.pages} pages`
                : pageInfo.scale < 0.999
                  ? `1 page, fitted to ${Math.round(pageInfo.scale * 100)}%`
                  : "1 page"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title={t("profile.atsScoreButtonTooltip")}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => setAtsDialogOpen(true)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setAtsDialogOpen(true)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.85,
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "0.85rem",
                border: `1px solid ${PROFILE.hairline}`,
                color:
                  atsScoreLive >= 80
                    ? "#15803d"
                    : atsScoreLive >= 50
                      ? "#b45309"
                      : "#b91c1c",
                "&:hover": { backgroundColor: "#f8fafc" },
                "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}` },
              }}
            >
              <IconWrapper icon="mdi:speedometer" size={16} />
              ATS {atsScoreLive}
            </Box>
          </Tooltip>
          <LockedAction locked={lockExports} label={t("lock.savingLocked", { defaultValue: "Saving is locked" })}>
          <Button
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:content-save-outline" size={17} />}
            onClick={handleSaveResume}
            disabled={saveResumeLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8125rem",
              borderRadius: 999,
              px: 2,
              py: 0.85,
              borderColor: PROFILE.hairline,
              color: PROFILE.ink,
              "&:hover": { borderColor: PROFILE.violet, backgroundColor: PROFILE.violetSoft },
            }}
          >
            {saveResumeLoading ? "\u2026" : t("profile.saveResume", { defaultValue: "Save" })}
          </Button>
          </LockedAction>
          <LockedAction locked={lockExports} label={t("lock.downloadLocked", { defaultValue: "Download is locked" })}>
          <Button
            variant="contained"
            disableElevation
            startIcon={<IconWrapper icon="mdi:download" size={17} />}
            onClick={handleDownloadPDF}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.8125rem",
              borderRadius: 999,
              px: 2.5,
              py: 0.85,
              background: CTA_GRADIENT,
              color: "#fff",
              boxShadow: CTA_SHADOW,
              "&:hover": { filter: "brightness(1.06)", background: CTA_GRADIENT },
            }}
          >
            PDF
          </Button>
          </LockedAction>
        </Box>
      </Paper>

      {/* Template chips + where the content comes from. */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.75, sm: 2 },
          mb: 3,
          border: PANEL_BORDER,
          borderRadius: 4,
          boxShadow: PANEL_SHADOW,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.6rem",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: PROFILE.inkFaint,
              flexShrink: 0,
              display: { xs: "none", sm: "block" },
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {t("profile.templateEyebrow", { defaultValue: "Template" })}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, py: 0.5 }}>
            {(Object.keys(TEMPLATE_KEYS) as TemplateName[]).map((template) => {
              const active = selectedTemplate === template;
              return (
                <Box
                  key={template}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTemplateSelect(template)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleTemplateSelect(template)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.1,
                    py: 0.5,
                    borderRadius: 999,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                    fontSize: "0.76rem",
                    // Active was near-black #1f2937, the only near-black chip on a surface
                    // whose entire selected-state language is violet.
                    border: active ? "1px solid transparent" : `1px solid ${PROFILE.hairline}`,
                    bgcolor: active ? PROFILE.violet : "transparent",
                    color: active ? "#fff" : PROFILE.inkMuted,
                    transition: "all .12s",
                    "&:hover": { bgcolor: active ? PROFILE.violet : "#f8fafc" },
                    "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${PROFILE.violet}` },
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      flexShrink: 0,
                      bgcolor: active ? "rgba(255,255,255,0.9)" : TEMPLATE_DOTS[template] || PROFILE.violetLight,
                    }}
                  />
                  {t(`profile.${TEMPLATE_KEYS[template]}`)}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Segmented control rather than three equal outlined buttons. Sample and profile are
            two states of one setting, so they belong in one control that shows which is on;
            Clear is a separate destructive action and sits outside it. */}
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0, alignItems: "center" }}>
          <Box
            sx={{
              display: "flex",
              p: 0.4,
              gap: 0.4,
              borderRadius: 999,
              bgcolor: "#f1f5f9",
              border: `1px solid ${PROFILE.hairline}`,
            }}
          >
            {([
              { key: "sample", label: t("profile.sample", { defaultValue: "Sample" }), icon: "mdi:auto-fix", onClick: handleUseSample },
              { key: "profile", label: t("profile.useMyProfile", { defaultValue: "Use my profile" }), icon: "mdi:account-outline", onClick: handleUseProfile },
            ] as const).map((opt) => {
              const active = source === opt.key;
              return (
                <Box
                  key={opt.key}
                  component="button"
                  onClick={opt.onClick}
                  aria-pressed={active}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1.5,
                    py: 0.7,
                    border: 0,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    whiteSpace: "nowrap",
                    transition: "background .15s, color .15s",
                    bgcolor: active ? "#fff" : "transparent",
                    color: active ? PROFILE.violet : PROFILE.inkFaint,
                    boxShadow: active ? "0 1px 3px rgba(16,24,40,0.10)" : "none",
                    "&:hover": { color: active ? PROFILE.violet : PROFILE.inkMuted },
                    "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px #f1f5f9, 0 0 0 4px ${PROFILE.violet}` },
                  }}
                >
                  <IconWrapper icon={opt.icon} size={15} />
                  {opt.label}
                </Box>
              );
            })}
          </Box>
          <Button
            variant="text"
            size="small"
            startIcon={<IconWrapper icon="mdi:restore" size={16} />}
            onClick={handleClearData}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderRadius: 999,
              px: 1.5,
              py: 0.6,
              color: PROFILE.inkFaint,
              "&:hover": { color: "#b91c1c", backgroundColor: "#fef2f2" },
            }}
          >
            {t("profile.clear", { defaultValue: "Clear" })}
          </Button>
        </Box>
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
          <SectionArrangePanel
            layout={layout}
            onChange={updateLayout}
            onReset={() => updateLayout(resetLayout())}
            sections={docSections}
            template={selectedTemplate}
            counts={sectionCounts}
          />
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
            onLayout={setPageInfo}
            layout={layout}
            onDocumentSections={setDocSections}
          />
        </Box>
      </Box>

      <Dialog
        open={atsDialogOpen}
        onClose={() => setAtsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
          {t("profile.atsScoreTitle")} &amp; {t("profile.atsDetails")}
          <IconButton onClick={() => setAtsDialogOpen(false)} size="small" aria-label="close">
            <IconWrapper icon="mdi:close" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <ATSScoreCard
            resumeData={resumeData}
            initialLiveScore={atsScoreLive ?? undefined}
            dialogOpen={atsDialogOpen}
            onResumeChange={setResumeData}
          />
          <ATSQuickFixes resumeData={resumeData} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
