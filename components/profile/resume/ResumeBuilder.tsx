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
  Menu,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import { ResumeForm } from "./ResumeForm";
import { ResumePreview } from "./ResumePreview";
import type { PagedResumeHandle, ResumeDocument } from "./paging/PagedResume";
import { SectionArrangePanel } from "./SectionArrangePanel";
import {
  EMPTY_LAYOUT,
  loadLayout,
  normalizeLayout,
  resetLayout,
  saveLayout,
  type DocumentSections,
  type ResumeLayout,
  type SectionId,
} from "./paging/sectionLayout";
import { SavedResumesPanel } from "./SavedResumesPanel";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ResumeDocumentsUnavailable,
  resumeDocumentsService,
  type ResumeDocumentSummary,
} from "@/lib/services/resumeDocuments.service";
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
import { normalizeResumeLine } from "./richText";
import { useToast } from "@/components/common/Toast";
import { toPng } from "html-to-image";
import { resumeService } from "@/lib/services/resume.service";
import { PANEL_BORDER, PANEL_SHADOW, PROFILE, TILE_GRADIENT, CTA_GRADIENT, CTA_SHADOW } from "../theme/profileTokens";
import { LockedAction } from "@/components/common/ProfileLock";
import { PHONE } from "@/components/common/mobile/phone";

/** Where the builder's current content came from. Drives the toolbar's segmented control. */
type ResumeSource = "sample" | "profile" | "blank" | "saved";

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
      ? e.description.map((d) => normalizeResumeLine(s(d))).filter((d) => d.length > 0)
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
    description: normalizeResumeLine(s(e.description)),
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
    description: normalizeResumeLine(s(p.description)),
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
 *  All null/undefined string fields are coerced to "" so MUI inputs stay controlled.
 *
 *  Also the way a SAVED resume comes back in, so every rich line is normalised to the HTML the
 *  editor writes (see normalizeResumeLine): a resume saved before that contract can hold plain
 *  text beside HTML, and the two render differently. */
const buildResumeData = (d?: Partial<ResumeData>): ResumeData => ({
  basicInfo: {
    ...EMPTY_BASIC_INFO,
    ...(d?.basicInfo ? dropNullish(d.basicInfo as unknown as Record<string, unknown>) : {}),
    summary: normalizeResumeLine(s(d?.basicInfo?.summary)),
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
  /**
   * Phone only: the A4 sheet is behind a Preview action instead of sharing the screen with the
   * editor. At 390px the sheet renders at 41% of A4 - a picture of a resume rather than a
   * preview - and it pushed every field the learner came to fill in below the fold.
   *
   * The preview COMPONENT stays mounted either way. The PDF is generated from the document it
   * lays out offscreen, so unmounting it with the sheet would break Download and Save, which is
   * why this is a CSS state rather than a Drawer that mounts its children on open.
   */
  const [previewOpen, setPreviewOpen] = useState(false);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
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
    // Emptying the form is not an edit to the open resume, it is abandoning it. Staying attached
    // would leave the toolbar naming a real saved resume that the next Update would blank.
    detachFromSavedResume();
    showToast(t("profile.resumeDataCleared"), "success");
  };

  const handleUseSample = () => {
    if (source === "sample") return;
    setResumeData(SAMPLE_RESUME_DATA);
    setSource("sample");
    awaitingProfileRef.current = false;
    // Same reasoning as Clear: the sample is a mock, not the learner's resume.
    detachFromSavedResume();
    showToast(t("profile.sampleDataLoaded"), "success");
  };

  /**
   * Import the student's profile into the builder. Explicit, never automatic.
   *
   * Deliberately does NOT detach from the open resume, unlike Clear and Sample. This is the
   * learner's own content going into the resume they are editing, which is a plausible thing to
   * want; the toolbar flips to "Unsaved changes" and the button still names what it would write
   * to, so nothing happens behind their back.
   */
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

  /**
   * While the phone preview covers the screen, the page behind it must not scroll, Escape must
   * close it, and growing past the phone breakpoint must drop it: above `sm` the preview is a
   * column again, and a body left with `overflow: hidden` would leave the page unscrollable.
   */
  useEffect(() => {
    if (!previewOpen) return;
    const mq = typeof window.matchMedia === "function" ? window.matchMedia("(max-width: 599.95px)") : null;
    if (mq && !mq.matches) {
      setPreviewOpen(false);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    const onViewportChange = () => {
      if (mq && !mq.matches) setPreviewOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    mq?.addEventListener?.("change", onViewportChange);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      mq?.removeEventListener?.("change", onViewportChange);
    };
  }, [previewOpen]);

  /**
   * The phone preview is a modal in all but name, so it has to behave like one for a keyboard or a
   * screen reader: focus moves into it on open, Tab cannot leave it, and on close focus returns to
   * the Preview button that opened it.
   *
   * This is done by hand rather than with MUI's FocusTrap or a Drawer on purpose. The pane is also
   * the desktop preview column and must stay mounted (the PDF is built from it), and FocusTrap
   * wraps its child in two sentinel divs, which would become extra items in the page's grid at
   * every width and move the desktop layout.
   */
  const previewTriggerRef = useRef<HTMLButtonElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!previewOpen) return;
    const pane = previewPaneRef.current;
    const opener = previewTriggerRef.current;
    previewCloseRef.current?.focus();
    // Anything that lands focus outside the sheet (a stray programmatic focus, a screen reader's
    // virtual cursor) is pulled back in.
    const onFocusIn = (e: FocusEvent) => {
      if (pane && e.target instanceof Node && !pane.contains(e.target)) previewCloseRef.current?.focus();
    };
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      opener?.focus();
    };
  }, [previewOpen]);

  /** Tab and Shift+Tab wrap inside the open phone preview instead of walking the page behind it. */
  const handlePreviewKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!previewOpen || e.key !== "Tab" || !previewPaneRef.current) return;
    const focusables = Array.from(
      previewPaneRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
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

  /* ======================================================================================
   * Saved resumes.
   *
   * What was here before: "Save" rendered the preview to a PDF and uploaded it. A saved resume
   * was therefore a picture - listable on the profile page, viewable, attachable to a job
   * application, and impossible to edit again. The template was never stored at all, and the
   * section arrangement lived in this browser's localStorage, shared by every resume the learner
   * made. Reopening a resume to change one bullet meant retyping the whole thing.
   *
   * What happens now: Save keeps the DOCUMENT - content, template and section arrangement - so it
   * can be opened again. The PDF path is untouched and still available, because a PDF is what
   * gets sent to an employer.
   * ==================================================================================== */

  const [documents, setDocuments] = useState<ResumeDocumentSummary[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  /**
   * The backend ships first. A tenant still on an older API answers 404 for the whole
   * collection, and then this half of the feature simply is not there: the panel hides and Save
   * keeps doing exactly what it did before, rather than showing a learner an error about
   * something they never asked for.
   */
  const [documentsUnavailable, setDocumentsUnavailable] = useState(false);
  /**
   * The list could not be fetched, and it is NOT the 404 above.
   *
   * A third state on purpose. A 502 mid-deploy used to leave `documents` at `[]`, which rendered
   * the empty state - a learner with eight saved resumes being told "Nothing saved yet", which
   * reads as "they are gone".
   */
  const [documentsError, setDocumentsError] = useState(false);
  const [openDoc, setOpenDoc] = useState<{ id: number; name: string } | null>(null);
  const [rowBusyId, setRowBusyId] = useState<number | null>(null);
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<null | HTMLElement>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  /**
   * Whether the builder holds edits the open resume does not. Only tracked once something has
   * been opened or saved, so a learner who never used Save pays nothing for it.
   */
  const [dirty, setDirty] = useState(false);
  const savedSnapshotRef = useRef<string | null>(null);
  const snapshotOf = (data: ResumeData, template: TemplateName, l: ResumeLayout) =>
    JSON.stringify({ data, template, l });

  const reloadDocuments = async () => {
    try {
      const list = await resumeDocumentsService.list();
      setDocuments(list);
      setDocumentsUnavailable(false);
      setDocumentsError(false);
    } catch (err) {
      if (err instanceof ResumeDocumentsUnavailable) {
        setDocumentsUnavailable(true);
      } else {
        // The list stays as it was and the panel says it could not load them. A transient error
        // must never be reported as "you have no saved resumes".
        setDocumentsError(true);
      }
    } finally {
      setDocumentsLoading(false);
    }
  };

  const retryDocuments = async () => {
    setDocumentsLoading(true);
    await reloadDocuments();
  };

  useEffect(() => {
    void reloadDocuments();
  }, []);

  useEffect(() => {
    if (savedSnapshotRef.current === null) return;
    setDirty(snapshotOf(resumeData, selectedTemplate, layout) !== savedSnapshotRef.current);
  }, [resumeData, selectedTemplate, layout]);

  const markSaved = (data: ResumeData, template: TemplateName, l: ResumeLayout) => {
    savedSnapshotRef.current = snapshotOf(data, template, l);
    setDirty(false);
  };

  const isTemplateName = (value: string): value is TemplateName =>
    Object.prototype.hasOwnProperty.call(TEMPLATE_KEYS, value);

  /**
   * Stop pointing at a saved resume, without touching what is on screen.
   *
   * Called when the content is replaced wholesale by something that is not that resume. Clearing
   * the form while "Backend CV" was open used to leave the toolbar reading "Backend CV · Unsaved
   * changes", and the next Update would then overwrite a real saved resume with an empty form.
   * Detaching makes the next Save ask for a name instead, which can destroy nothing.
   */
  const detachFromSavedResume = () => {
    setOpenDoc(null);
    savedSnapshotRef.current = null;
    setDirty(false);
  };

  /**
   * Opening another resume replaces everything on screen, so unsaved work has to be asked about
   * first. The toolbar already says "Unsaved changes"; this is the same fact, at the moment it
   * would cost something.
   */
  const [pendingOpen, setPendingOpen] = useState<{ id: number; name: string } | null>(null);
  const requestOpenDocument = (id: number) => {
    if (openDoc && dirty && id !== openDoc.id) {
      const target = documents.find((d) => d.id === id);
      setPendingOpen({ id, name: target?.name ?? "" });
      return;
    }
    void handleOpenDocument(id);
  };

  /** Put a saved resume back into the builder, exactly as it was left. */
  const handleOpenDocument = async (id: number) => {
    setRowBusyId(id);
    try {
      const doc = await resumeDocumentsService.get(id);
      const restoredData = buildResumeData(doc.content as Partial<ResumeData>);
      const restoredTemplate = isTemplateName(doc.template) ? doc.template : "modern";
      const restoredLayout = normalizeLayout(doc.layout);
      setResumeData(restoredData);
      setSelectedTemplate(restoredTemplate);
      setLayout(restoredLayout);
      // The arrangement is still remembered per browser, so a refresh mid-edit does not silently
      // rearrange the resume the learner is looking at.
      saveLayout(restoredLayout, config.clientId);
      setSource("saved");
      awaitingProfileRef.current = false;
      setOpenDoc({ id: doc.id, name: doc.name });
      markSaved(restoredData, restoredTemplate, restoredLayout);
      showToast(t("savedResumes.opened", { name: doc.name, defaultValue: `Opened "${doc.name}"` }), "success");
    } catch {
      showToast(t("savedResumes.openFailed", { defaultValue: "Could not open that resume" }), "error");
    } finally {
      setRowBusyId(null);
      setPendingOpen(null);
    }
  };

  const documentPayload = () => ({
    template: selectedTemplate,
    content: resumeData as unknown as Record<string, unknown>,
    layout: layout as unknown as Record<string, unknown>,
    ats_score: atsScoreLive,
  });

  const suggestedName = () => {
    const full = `${resumeData.basicInfo.firstName} ${resumeData.basicInfo.lastName}`.trim();
    const role = resumeData.basicInfo.professionalTitle?.trim();
    if (full && role) return `${full} - ${role}`.slice(0, 120);
    if (full) return `${full} - ${t(`profile.${TEMPLATE_KEYS[selectedTemplate]}`)}`.slice(0, 120);
    return t("savedResumes.defaultName", { defaultValue: "My resume" });
  };

  /** Save. Updates the resume that is open; with none open, asks for a name and creates one. */
  const handleSaveDocument = async () => {
    if (!openDoc) {
      setNameDraft(suggestedName());
      setNameDialogOpen(true);
      return;
    }
    setSavingDoc(true);
    try {
      await resumeDocumentsService.update(openDoc.id, documentPayload());
      markSaved(resumeData, selectedTemplate, layout);
      await reloadDocuments();
      showToast(
        t("savedResumes.updated", { name: openDoc.name, defaultValue: `Updated "${openDoc.name}"` }),
        "success",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("savedResumes.saveFailed", { defaultValue: "Could not save" }),
        "error",
      );
    } finally {
      setSavingDoc(false);
    }
  };

  /** Save as new. Never touches the resume that is open. */
  const handleSaveAsNew = () => {
    setSaveMenuAnchor(null);
    setNameDraft(openDoc ? `${openDoc.name} (copy)`.slice(0, 120) : suggestedName());
    setNameDialogOpen(true);
  };

  const handleCreateDocument = async () => {
    const name = nameDraft.trim();
    if (!name) return;
    setSavingDoc(true);
    try {
      const created = await resumeDocumentsService.create({ name, ...documentPayload() });
      setOpenDoc({ id: created.id, name: created.name });
      setNameDialogOpen(false);
      markSaved(resumeData, selectedTemplate, layout);
      await reloadDocuments();
      showToast(t("savedResumes.saved", { name: created.name, defaultValue: `Saved "${created.name}"` }), "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("savedResumes.saveFailed", { defaultValue: "Could not save" }),
        "error",
      );
    } finally {
      setSavingDoc(false);
    }
  };

  const handleRenameDocument = async (id: number, name: string) => {
    setRowBusyId(id);
    try {
      const updated = await resumeDocumentsService.update(id, { name });
      if (openDoc?.id === id) setOpenDoc({ id, name: updated.name });
      await reloadDocuments();
    } catch {
      showToast(t("savedResumes.renameFailed", { defaultValue: "Could not rename that resume" }), "error");
    } finally {
      setRowBusyId(null);
    }
  };

  const handleDuplicateDocument = async (id: number) => {
    setRowBusyId(id);
    try {
      const copy = await resumeDocumentsService.duplicate(id);
      await reloadDocuments();
      showToast(t("savedResumes.duplicated", { name: copy.name, defaultValue: `Created "${copy.name}"` }), "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("savedResumes.duplicateFailed", { defaultValue: "Could not duplicate" }),
        "error",
      );
    } finally {
      setRowBusyId(null);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await resumeDocumentsService.remove(id);
      // The builder keeps whatever is on screen: deleting a saved copy must not empty the form
      // the learner is looking at. It simply stops being attached to a saved resume, so the next
      // Save asks for a name rather than writing to a row that no longer exists.
      if (openDoc?.id === id) {
        setOpenDoc(null);
        savedSnapshotRef.current = null;
        setDirty(false);
      }
      await reloadDocuments();
      showToast(t("savedResumes.deleted", { defaultValue: "Resume deleted" }), "success");
    } catch {
      showToast(t("savedResumes.deleteFailed", { defaultValue: "Could not delete that resume" }), "error");
    }
  };

  /** What the download will actually be. Said once, shown on the toolbar and on the phone sheet. */
  const pagesLabel =
    pageInfo.pages > 1
      ? `${pageInfo.pages} pages`
      : pageInfo.scale < 0.999
        ? `1 page, fitted to ${Math.round(pageInfo.scale * 100)}%`
        : "1 page";

  /**
   * One action cell. On a phone the four toolbar actions are a 2x2 grid of 44px targets rather
   * than a wrapping row of 33px pills; above `sm` the cell is inert and the row is what it was.
   */
  const actionCellSx = {
    display: "flex",
    minWidth: 0,
    "& > *": { flex: { xs: 1, sm: "0 0 auto" }, minWidth: 0 },
    "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
  } as const;

  /**
   * The save cell, when saving is a split control.
   *
   * Deliberately NOT `actionCellSx`: that stretches every button inside it to the full cell
   * width, which on a phone gave the caret half the cell and left a 90px button holding one
   * chevron. Here the label takes the room and the caret stays a thumb-sized square.
   */
  const splitCellSx = {
    display: "flex",
    minWidth: 0,
    flex: { xs: 1, sm: "0 0 auto" },
  } as const;

  /** The Save pill, shared by the plain button and the two halves of the split control. */
  const saveButtonSx = {
    textTransform: "none",
    fontWeight: 700,
    fontSize: { xs: "0.875rem", sm: "0.8125rem" },
    borderRadius: 999,
    px: 2,
    py: 0.85,
    minHeight: { xs: 44, sm: "auto" },
    whiteSpace: "nowrap",
    borderColor: PROFILE.hairline,
    color: PROFILE.ink,
    "&:hover": { borderColor: PROFILE.violet, backgroundColor: PROFILE.violetSoft },
  } as const;

  const atsReport = (
    <>
      <ATSScoreCard
        resumeData={resumeData}
        initialLiveScore={atsScoreLive ?? undefined}
        dialogOpen={atsDialogOpen}
        onResumeChange={setResumeData}
      />
      <ATSQuickFixes resumeData={resumeData} />
    </>
  );

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
              {openDoc ? openDoc.name : t("profile.myResume", { defaultValue: "My resume" })}
            </Typography>
            {/* 11.5px and 10.9px are desktop densities. On a phone they are the floor of what is
                readable at arm's length, so both step up above 12px. */}
            <Typography sx={{ fontSize: { xs: "0.78rem", sm: "0.72rem" }, color: PROFILE.inkFaint, mt: "1px" }}>
              {t(`profile.${TEMPLATE_KEYS[selectedTemplate]}`)}
              {" · "}
              {source === "sample"
                ? t("profile.sourceSample", { defaultValue: "Sample content" })
                : source === "profile"
                  ? t("profile.sourceProfile", { defaultValue: "Your profile" })
                  : source === "saved"
                    ? t("savedResumes.sourceSaved", { defaultValue: "Saved resume" })
                    : t("profile.sourceBlank", { defaultValue: "Blank" })}
              {/* Saving must never be a guess about which resume is being written to. The name
                  above says which one is open; this says whether it is up to date. */}
              {openDoc && (
                <>
                  {" · "}
                  <Box component="span" sx={{ fontWeight: 700, color: dirty ? "#b45309" : "#15803d" }}>
                    {dirty
                      ? t("savedResumes.unsavedChanges", { defaultValue: "Unsaved changes" })
                      : t("savedResumes.allSaved", { defaultValue: "All changes saved" })}
                  </Box>
                </>
              )}
            </Typography>
            {/* What the download will actually be. A resume that needs a second page now gets one,
                and a resume kept on one page by a small shrink says so, rather than leaving the
                learner wondering why the type looks smaller than it did a moment ago. */}
            <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.68rem" }, color: PROFILE.inkFaint, mt: "1px" }}>
              {pagesLabel}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: { xs: "grid", sm: "flex" },
            gridTemplateColumns: { xs: "1fr 1fr", sm: "none" },
            width: { xs: "100%", sm: "auto" },
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            "& > *": { minWidth: 0 },
          }}
        >
          <Box sx={actionCellSx}>
          <Tooltip title={t("profile.atsScoreButtonTooltip")}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => setAtsDialogOpen(true)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setAtsDialogOpen(true)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: { xs: "center", sm: "flex-start" },
                gap: 0.75,
                px: 1.5,
                py: 0.85,
                minHeight: { xs: 44, sm: "auto" },
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 800,
                fontSize: { xs: "0.9rem", sm: "0.85rem" },
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
          </Box>

          {/* Phone only. Above `sm` the preview is a column on the page and there is nothing to
              open, so the action does not exist there. */}
          <Box sx={{ ...actionCellSx, display: { xs: "flex", sm: "none" } }}>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:file-eye-outline" size={17} />}
              ref={previewTriggerRef}
              onClick={() => setPreviewOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                borderRadius: 999,
                px: 2,
                minHeight: 44,
                borderColor: PROFILE.hairline,
                color: PROFILE.ink,
                "&:hover": { borderColor: PROFILE.violet, backgroundColor: PROFILE.violetSoft },
              }}
            >
              {t("profile.previewResume", { defaultValue: "Preview" })}
            </Button>
          </Box>

          {/* Save.
              With saved resumes available this keeps the DOCUMENT, and the label says which
              resume it writes to, so nothing is ever clobbered by surprise: "Update" names the
              open one, "Save" creates a new one after asking for a name, and "Save as new" is
              always one tap away. Where the API does not offer resume documents yet, this falls
              back to exactly what it did before - uploading a PDF - and stays gated on a complete
              profile, because that is an export.

              Until the first list call lands, the split control is rendered but INERT. Whether
              this tenant has resume documents is not yet known, and both alternatives are worse:
              showing the fallback button would silently upload a PDF instead of saving a
              document for anyone who clicks quickly, and leaving the split live would produce a
              flat "Could not save this resume" against an older API. One round trip of a
              greyed-out button says the true thing, which is "not yet". */}
          <Box sx={documentsUnavailable ? actionCellSx : splitCellSx}>
          {documentsUnavailable ? (
            <LockedAction locked={lockExports} label={t("lock.savingLocked", { defaultValue: "Saving is locked" })}>
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:content-save-outline" size={17} />}
                onClick={handleSaveResume}
                disabled={saveResumeLoading}
                sx={saveButtonSx}
              >
                {saveResumeLoading ? "\u2026" : t("profile.saveResume", { defaultValue: "Save" })}
              </Button>
            </LockedAction>
          ) : (
            <Box sx={{ display: "flex", width: { xs: "100%", sm: "auto" }, minWidth: 0 }}>
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:content-save-outline" size={17} />}
                onClick={() => void handleSaveDocument()}
                disabled={savingDoc || documentsLoading}
                sx={{
                  ...saveButtonSx,
                  flex: { xs: 1, sm: "0 0 auto" },
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRightColor: "transparent",
                }}
              >
                {savingDoc
                  ? "\u2026"
                  : openDoc
                    ? t("savedResumes.update", { defaultValue: "Update" })
                    : t("savedResumes.save", { defaultValue: "Save" })}
              </Button>
              <Button
                variant="outlined"
                onClick={(e) => setSaveMenuAnchor(e.currentTarget)}
                disabled={documentsLoading}
                aria-label={t("savedResumes.moreSaveOptions", { defaultValue: "More save options" })}
                aria-haspopup="menu"
                sx={{
                  ...saveButtonSx,
                  minWidth: 40,
                  width: 40,
                  px: 0.5,
                  flex: "0 0 auto",
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  [PHONE]: { minWidth: 44, width: 44 },
                }}
              >
                <IconWrapper icon="mdi:chevron-down" size={18} />
              </Button>
            </Box>
          )}
          </Box>
          <Box sx={actionCellSx}>
          <LockedAction locked={lockExports} label={t("lock.downloadLocked", { defaultValue: "Download is locked" })}>
          <Button
            variant="contained"
            disableElevation
            startIcon={<IconWrapper icon="mdi:download" size={17} />}
            onClick={handleDownloadPDF}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              fontSize: { xs: "0.875rem", sm: "0.8125rem" },
              borderRadius: 999,
              px: 2.5,
              py: 0.85,
              minHeight: { xs: 44, sm: "auto" },
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
        </Box>
      </Paper>

      {/* The resumes this learner has saved, in the builder, where they can be opened again.
          Hidden entirely on a tenant whose API does not offer them yet. */}
      {!documentsUnavailable && (
        <SavedResumesPanel
          documents={documents}
          loading={documentsLoading}
          loadError={documentsError}
          onRetry={() => void retryDocuments()}
          openId={openDoc?.id ?? null}
          busyId={rowBusyId}
          onOpen={requestOpenDocument}
          onRename={handleRenameDocument}
          onDuplicate={(id) => void handleDuplicateDocument(id)}
          onDelete={handleDeleteDocument}
          templateLabel={(template) =>
            TEMPLATE_KEYS[template] ? t(`profile.${TEMPLATE_KEYS[template]}`) : template
          }
        />
      )}

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1, width: { xs: "100%", sm: "auto" }, [PHONE]: { flexBasis: "100%" } }}>
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
          {/* Twelve chips wrapped into four rows on a phone and pushed the editor further down;
              here they are one row that scrolls, with the fade that says so. Above `sm` the row
              wraps exactly as it did. */}
          <ScrollRow
            ariaLabel={t("profile.templateEyebrow", { defaultValue: "Template" })}
            gutter={1.75}
            gap={0.6}
            sx={{
              flexWrap: { xs: "nowrap", sm: "wrap" },
              overflowX: { xs: "auto", sm: "visible" },
              // ScrollRow hides overflowY; with overflowX visible that would compute to auto and
              // turn the wrapped desktop row into a clipping scroll box.
              overflowY: { xs: "hidden", sm: "visible" },
              py: 0.5,
              minWidth: 0,
            }}
          >
            {(Object.keys(TEMPLATE_KEYS) as TemplateName[]).map((template) => {
              const active = selectedTemplate === template;
              return (
                <Box
                  key={template}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTemplateSelect(template)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleTemplateSelect(template)}
                  // Twelve chips of which one is chosen: colour alone said so, which a screen
                  // reader cannot hear. It is also how a test can tell which template is live.
                  aria-pressed={active}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: { xs: 1.5, sm: 1.1 },
                    py: 0.5,
                    minHeight: { xs: 40, sm: "auto" },
                    borderRadius: 999,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                    fontSize: { xs: "0.82rem", sm: "0.76rem" },
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
          </ScrollRow>
        </Box>

        {/* Segmented control rather than three equal outlined buttons. Sample and profile are
            two states of one setting, so they belong in one control that shows which is on;
            Clear is a separate destructive action and sits outside it. */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexShrink: 0,
            alignItems: "center",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              p: 0.4,
              gap: 0.4,
              flex: { xs: 1, sm: "0 0 auto" },
              minWidth: 0,
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
                    justifyContent: "center",
                    gap: 0.6,
                    px: { xs: 1, sm: 1.5 },
                    py: 0.7,
                    minHeight: { xs: 40, sm: "auto" },
                    flex: { xs: 1, sm: "0 0 auto" },
                    minWidth: 0,
                    border: 0,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: { xs: "0.82rem", sm: "0.78rem" },
                    whiteSpace: "nowrap",
                    // The label may be shrunk below its own width on a narrow phone; clipping it
                    // is the failure mode to have, rather than pushing the page sideways.
                    overflow: "hidden",
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
              fontSize: { xs: "0.82rem", sm: "0.78rem" },
              borderRadius: 999,
              px: 1.5,
              py: 0.6,
              minHeight: { xs: 40, sm: "auto" },
              flexShrink: 0,
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
        {/* Left: Form. On a phone the arrangement panel moves BELOW the form: a learner who opens
            the builder has come to fill sections in, not to reorder empty ones, and six rows of
            up/down controls were the first thing on the screen. */}
        <Box
          sx={{
            // Flex only on a phone, where it is what lets `order` move the panel below the form.
            // Above `sm` it stays the block it was.
            display: { xs: "flex", sm: "block" },
            flexDirection: "column",
            maxHeight: { lg: "calc(100vh - 200px)" },
            overflowY: "auto",
            pr: { lg: 2 },
            minWidth: 0,
          }}
        >
          <Box sx={{ order: { xs: 2, sm: 1 }, minWidth: 0 }}>
            <SectionArrangePanel
              layout={layout}
              onChange={updateLayout}
              onReset={() => updateLayout(resetLayout())}
              sections={docSections}
              template={selectedTemplate}
              counts={sectionCounts}
            />
          </Box>
          <Box sx={{ order: { xs: 1, sm: 2 }, minWidth: 0 }}>
            <ResumeForm resumeData={resumeData} setResumeData={setResumeData} />
          </Box>
        </Box>

        {/* Right: Preview. A full-screen sheet on a phone, the same sticky column everywhere else. */}
        <Box
          data-resume-preview-pane=""
          ref={previewPaneRef}
          onKeyDown={previewOpen ? handlePreviewKeyDown : undefined}
          data-open={previewOpen ? "true" : "false"}
          role={previewOpen ? "dialog" : undefined}
          aria-modal={previewOpen ? true : undefined}
          aria-label={previewOpen ? t("profile.previewResume", { defaultValue: "Preview" }) : undefined}
          sx={{
            display: { xs: previewOpen ? "flex" : "none", sm: "block" },
            flexDirection: "column",
            position: { xs: previewOpen ? "fixed" : "static", sm: "static", lg: "sticky" },
            inset: { xs: previewOpen ? 0 : "auto", sm: "auto" },
            // Above the fixed bottom navigation, which sits at 1200.
            zIndex: { xs: previewOpen ? 1300 : "auto", sm: "auto" },
            bgcolor: { xs: previewOpen ? "var(--background, #fff)" : "transparent", sm: "transparent" },
            top: { lg: 20 },
            maxHeight: { lg: "calc(100vh - 100px)" },
            overflowY: { xs: "visible", sm: "auto" },
            minWidth: 0,
          }}
        >
          {/* Sheet chrome, phone only. */}
          <Box
            sx={{
              display: { xs: previewOpen ? "flex" : "none", sm: "none" },
              alignItems: "center",
              gap: 1,
              flexShrink: 0,
              px: 2,
              py: 1,
              borderBottom: `1px solid ${PROFILE.hairline}`,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: PROFILE.ink, lineHeight: 1.2 }}>
                {t("profile.previewResume", { defaultValue: "Preview" })}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: PROFILE.inkFaint }}>
                {t(`profile.${TEMPLATE_KEYS[selectedTemplate]}`)}
                {" · "}
                {pagesLabel}
              </Typography>
            </Box>
            <IconButton
              ref={previewCloseRef}
              onClick={() => setPreviewOpen(false)}
              aria-label={t("profile.closePreview", { defaultValue: "Close preview" })}
              sx={{ width: 44, height: 44, flexShrink: 0, color: PROFILE.ink }}
            >
              <IconWrapper icon="mdi:close" size={22} />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: { xs: 1, sm: "0 0 auto" },
              minHeight: 0,
              overflowY: { xs: previewOpen ? "auto" : "visible", sm: "visible" },
              WebkitOverflowScrolling: "touch",
              px: { xs: previewOpen ? 1.5 : 0, sm: 0 },
              py: { xs: previewOpen ? 1.5 : 0, sm: 0 },
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

          {/* The sheet's own actions. `env(safe-area-inset-bottom)` because this covers the bottom
              navigation, which is what normally keeps content off the home indicator. */}
          <Box
            sx={{
              display: { xs: previewOpen ? "flex" : "none", sm: "none" },
              gap: 1,
              flexShrink: 0,
              px: 2,
              pt: 1.5,
              pb: "calc(12px + env(safe-area-inset-bottom))",
              borderTop: `1px solid ${PROFILE.hairline}`,
              "& > *": { flex: 1, minWidth: 0 },
              "& .MuiButton-root": { width: "100%" },
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setPreviewOpen(false)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                borderRadius: 999,
                minHeight: 44,
                borderColor: PROFILE.hairline,
                color: PROFILE.ink,
              }}
            >
              {t("profile.backToEditor", { defaultValue: "Back to editor" })}
            </Button>
            <LockedAction locked={lockExports} label={t("lock.downloadLocked", { defaultValue: "Download is locked" })}>
              <Button
                variant="contained"
                disableElevation
                startIcon={<IconWrapper icon="mdi:download" size={17} />}
                onClick={handleDownloadPDF}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "0.875rem",
                  borderRadius: 999,
                  minHeight: 44,
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
        </Box>
      </Box>

      {/* A centred dialog with its own scrollbar lands mid-screen on a phone and its close button
          is a 24px target in the corner, so there it is the shared bottom sheet. Above `sm` it is
          the original Dialog, markup and all: the shared primitive's desktop branch has its own
          radius, padding and title, and desktop is not what this pass changes. */}
      {isPhone ? (
        <ResponsiveDialog
          open={atsDialogOpen}
          onClose={() => setAtsDialogOpen(false)}
          maxWidth="md"
          title={`${t("profile.atsScoreTitle")} & ${t("profile.atsDetails")}`}
          data-testid="ats-report-sheet"
        >
          {atsReport}
        </ResponsiveDialog>
      ) : (
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
          <DialogContent dividers sx={{ p: 2 }}>{atsReport}</DialogContent>
        </Dialog>
      )}

      {/* The rest of saving. "Save as new" is here rather than as a fifth toolbar button because
          it is the rarer of the two, and a learner must never have to guess which of two
          same-sized buttons overwrites their resume. */}
      <Menu
        anchorEl={saveMenuAnchor}
        open={Boolean(saveMenuAnchor)}
        onClose={() => setSaveMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleSaveAsNew} sx={{ fontSize: "0.875rem", [PHONE]: { minHeight: 44 } }}>
          <IconWrapper icon="mdi:content-duplicate" size={17} />
          <Box component="span" sx={{ ml: 1 }}>
            {t("savedResumes.saveAsNew", { defaultValue: "Save as new resume" })}
          </Box>
        </MenuItem>
        <MenuItem
          disabled={lockExports || saveResumeLoading}
          onClick={() => {
            setSaveMenuAnchor(null);
            void handleSaveResume();
          }}
          sx={{ fontSize: "0.875rem", [PHONE]: { minHeight: 44 } }}
        >
          <IconWrapper icon="mdi:file-pdf-box" size={17} />
          <Box component="span" sx={{ ml: 1 }}>
            {t("savedResumes.savePdfCopy", { defaultValue: "Save a PDF copy to my profile" })}
          </Box>
        </MenuItem>
      </Menu>

      {/* Opening another resume replaces everything on screen. */}
      <ConfirmDialog
        open={Boolean(pendingOpen)}
        busy={rowBusyId !== null}
        title={t("savedResumes.discardTitle", { defaultValue: "Open without saving?" })}
        message={t("savedResumes.discardMessage", {
          open: openDoc?.name ?? "",
          next: pendingOpen?.name ?? "",
          defaultValue: `You have unsaved changes to "${openDoc?.name ?? ""}". Opening "${pendingOpen?.name ?? ""}" will discard them.`,
        })}
        confirmText={t("savedResumes.discardConfirm", { defaultValue: "Discard and open" })}
        cancelText={t("savedResumes.cancel", { defaultValue: "Cancel" })}
        confirmColor="warning"
        onConfirm={() => pendingOpen && void handleOpenDocument(pendingOpen.id)}
        onCancel={() => setPendingOpen(null)}
      />

      <ResponsiveDialog
        open={nameDialogOpen}
        onClose={() => !savingDoc && setNameDialogOpen(false)}
        title={t("savedResumes.nameTitle", { defaultValue: "Name this resume" })}
        description={
          <>
            {t("savedResumes.nameDescription", {
              defaultValue: "It is kept with its content, template and section order, so you can open it and carry on.",
            })}
            {/* The highest-value sentence on this dialog. Saving keeps something to EDIT; it does
                not produce the file an application asks for, and a learner who saves and then
                goes to apply would otherwise find nothing to attach. */}
            <Box component="span" sx={{ display: "block", mt: 0.75, fontWeight: 600 }}>
              {t("savedResumes.noPdfHint", {
                defaultValue:
                  "This does not create a PDF. For something to attach to a job application, use “Save a PDF copy to my profile”.",
              })}
            </Box>
          </>
        }
        maxWidth="xs"
        footer={
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              onClick={() => setNameDialogOpen(false)}
              disabled={savingDoc}
              sx={{ textTransform: "none", fontWeight: 700, [PHONE]: { minHeight: 44, flex: 1 } }}
            >
              {t("savedResumes.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => void handleCreateDocument()}
              disabled={savingDoc || !nameDraft.trim()}
              sx={{ textTransform: "none", fontWeight: 700, [PHONE]: { minHeight: 44, flex: 1 } }}
            >
              {t("savedResumes.saveResume", { defaultValue: "Save resume" })}
            </Button>
          </Box>
        }
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={nameDraft}
          disabled={savingDoc}
          onChange={(e) => setNameDraft(e.target.value.slice(0, 120))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreateDocument();
            }
          }}
          label={t("savedResumes.nameLabel", { defaultValue: "Name" })}
          inputProps={{ maxLength: 120 }}
        />
      </ResponsiveDialog>
    </Box>
  );
}
