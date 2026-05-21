"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Paper,
  Menu,
  MenuItem,
  Tooltip,
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

interface ResumeBuilderProps {
  initialData?: Partial<ResumeData>;
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

export function ResumeBuilder({ initialData }: ResumeBuilderProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>("modern");
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null);
  const [atsDialogOpen, setAtsDialogOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Profile data populates the form by default; sample data is opt-in via the toggle below.
  const [isSampleMode, setIsSampleMode] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>(() => buildResumeData(initialData));

  // If the parent fetches profile data after mount (initialData arrives later), hydrate once.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || isSampleMode) return;
    if (initialData && Object.keys(initialData).length > 0) {
      setResumeData(buildResumeData(initialData));
      hydratedRef.current = true;
    }
  }, [initialData, isSampleMode]);

  // Rule-based score (deterministic). Shown on the toolbar until the AI analysis runs.
  const ruleBasedAtsScore = useMemo(
    () => computeStandardATSScoreReport(resumeData).atsScore,
    [resumeData]
  );

  // AI-derived score (populated by ATSScoreCard once analysis completes). Reset whenever
  // resumeData changes — the AI's verdict is for the version of the resume it analyzed.
  const [aiAtsScore, setAiAtsScore] = useState<number | null>(null);
  useEffect(() => {
    setAiAtsScore(null);
  }, [resumeData]);

  // Toolbar button shows AI score if available (same one displayed in the dialog gauge),
  // otherwise the rule-based score. Either way, button and dialog agree.
  const atsScoreLive = aiAtsScore ?? ruleBasedAtsScore;

  const handleClearData = () => {
    setResumeData(buildResumeData());
    setIsSampleMode(false);
    hydratedRef.current = true;
    showToast(t("profile.resumeDataCleared"), "success");
  };

  /** Toggle between user's profile data (default) and a sample resume (for preview/demo). */
  const handleToggleSource = () => {
    if (isSampleMode) {
      setResumeData(buildResumeData(initialData));
      setIsSampleMode(false);
      showToast(t("profile.switchedToProfileData"), "info");
    } else {
      setResumeData(SAMPLE_RESUME_DATA);
      setIsSampleMode(true);
      showToast(t("profile.sampleDataLoaded"), "success");
    }
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
      {/* Action Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid var(--border-default)",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Tooltip title={t("profile.clearSavedData")}>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:delete-outline" />}
              onClick={handleClearData}
              sx={{
                textTransform: "none",
                borderColor: "var(--border-default)",
                color: "var(--error-500)",
                "&:hover": {
                  borderColor: "var(--error-500)",
                  backgroundColor: "color-mix(in srgb, var(--error-500) 10%, var(--surface))",
                },
              }}
            >
              {t("profile.clear")}
            </Button>
          </Tooltip>

          <Tooltip title={isSampleMode ? t("profile.tooltipSwitchToProfile") : t("profile.tooltipLoadSample")}>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon={isSampleMode ? "mdi:account-arrow-right" : "mdi:swap-horizontal"} />}
              onClick={handleToggleSource}
              sx={{
                textTransform: "none",
                borderColor: isSampleMode ? "var(--accent-purple)" : "var(--border-default)",
                color: "var(--accent-purple)",
                backgroundColor: isSampleMode ? "color-mix(in srgb, var(--accent-purple) 12%, var(--surface))" : "transparent",
                "&:hover": {
                  borderColor: "var(--accent-purple)",
                  backgroundColor: isSampleMode ? "color-mix(in srgb, var(--accent-purple) 18%, var(--surface))" : "color-mix(in srgb, var(--accent-purple) 12%, var(--surface))",
                },
              }}
            >
              {isSampleMode ? t("profile.useProfileData") : t("profile.loadSampleData")}
            </Button>
          </Tooltip>

          <Tooltip title={t("profile.chooseTemplate")}>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:view-grid" />}
              onClick={handleTemplateMenuOpen}
              sx={{
                textTransform: "none",
                borderColor: "var(--border-default)",
                color: "var(--font-primary)",
                "&:hover": {
                  borderColor: "var(--accent-purple)",
                  backgroundColor: "var(--surface)",
                },
              }}
            >
              {t("profile.templateLabel", { name: t(`profile.${TEMPLATE_KEYS[selectedTemplate]}`) })}
            </Button>
          </Tooltip>

          <Tooltip title={t("profile.atsScoreButtonTooltip")}>
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:file-document-check-outline" />}
              onClick={() => setAtsDialogOpen(true)}
              sx={{
                textTransform: "none",
                borderColor: "var(--border-default)",
                color: "var(--font-primary)",
                "&:hover": {
                  borderColor: "var(--accent-purple)",
                  backgroundColor: "var(--surface)",
                },
              }}
            >
              {t("profile.atsScoreButton")}
              <Box component="span" sx={{ ml: 1, display: "inline-flex", alignItems: "center" }}>
                <IconWrapper
                  icon={
                    atsScoreLive >= 80
                      ? "mdi:emoticon-happy-outline"
                      : atsScoreLive >= 50
                        ? "mdi:emoticon-neutral-outline"
                        : "mdi:emoticon-sad-outline"
                  }
                  size={20}
                  color={
                    atsScoreLive >= 80
                      ? "var(--success-500)"
                      : atsScoreLive >= 50
                        ? "var(--warning-500)"
                        : "var(--error-500)"
                  }
                />
              </Box>
            </Button>
          </Tooltip>

          <Menu
            anchorEl={templateMenuAnchor}
            open={Boolean(templateMenuAnchor)}
            onClose={handleTemplateMenuClose}
          >
            {(Object.keys(TEMPLATE_KEYS) as TemplateName[]).map((template) => (
              <MenuItem key={template} onClick={() => handleTemplateSelect(template)}>
                {t(`profile.${TEMPLATE_KEYS[template]}`)}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Tooltip title={t("profile.saveResume")}>
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:content-save" />}
              onClick={handleSaveResume}
              disabled={saveResumeLoading}
              sx={{
                textTransform: "none",
                backgroundColor: "var(--accent-purple)",
                color: "var(--background)",
                px: 3,
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                },
              }}
            >
              {saveResumeLoading ? "…" : t("profile.saveResume")}
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:download" />}
            onClick={handleDownloadPDF}
            sx={{
              textTransform: "none",
              backgroundColor: "var(--accent-purple)",
              color: "var(--background)",
              px: 3,
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
              },
            }}
          >
            {t("profile.downloadPdf")}
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
