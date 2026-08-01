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
import { jsPDF } from "jspdf";
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
  const previewRef = useRef<HTMLDivElement>(null);

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

  // Rule-based score (deterministic). Shown on the toolbar until the AI analysis runs.
  const ruleBasedAtsScore = useMemo(
    () => computeStandardATSScoreReport(resumeData).atsScore,
    [resumeData]
  );

  // AI-derived score (populated by ATSScoreCard once analysis completes). Reset whenever
  // resumeData changes - the AI's verdict is for the version of the resume it analyzed.
  const [aiAtsScore, setAiAtsScore] = useState<number | null>(null);
  useEffect(() => {
    setAiAtsScore(null);
  }, [resumeData]);

  // Toolbar button shows AI score if available (same one displayed in the dialog gauge),
  // otherwise the rule-based score. Either way, button and dialog agree.
  const atsScoreLive = aiAtsScore ?? ruleBasedAtsScore;

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

  /** Generate PDF and return blob + filename for download or upload. */
  const generatePDFBlob = async (): Promise<{ blob: Blob; fileName: string }> => {
    if (!previewRef.current) throw new Error("No preview");
    const element = previewRef.current;

    await new Promise((resolve) => setTimeout(resolve, 300));
    await convertImagesInElementToDataUrls(element);

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

    const cloneRect = clone.getBoundingClientRect();
    const linkAnnotations: { x: number; y: number; w: number; h: number; url: string }[] = [];
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

    const dataUrl = await toPng(clone, {
      pixelRatio: 3,
      backgroundColor: "var(--background)",
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
    const blob = pdf.output("blob") as Blob;
    return { blob, fileName };
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
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
    if (!previewRef.current) return;
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
            onAiScoreUpdate={setAiAtsScore}
          />
          <ATSQuickFixes resumeData={resumeData} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
