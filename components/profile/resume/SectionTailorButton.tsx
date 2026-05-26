"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Paper,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { ResumeData } from "./types";

export type TailorSection = "summary" | "skills" | "experience" | "projects";

interface SkillSuggestion {
  name: string;
  reason: string;
}

interface BulletChange {
  position: string;
  company: string;
  index: number;
  before: string;
  after: string;
}

interface ProjectChange {
  name: string;
  beforeDescription: string;
  afterDescription: string;
}

interface SectionResult {
  section: TailorSection;
  rationale: string;
  summaryBefore?: string;
  summaryAfter?: string;
  reorderedSkillNames?: string[];
  missingSkillSuggestions?: SkillSuggestion[];
  bulletChanges?: BulletChange[];
  projectChanges?: ProjectChange[];
}

interface SectionTailorButtonProps {
  section: TailorSection;
  resumeData: ResumeData;
  /** Apply changes back to the live resume. */
  onResumeChange?: (data: ResumeData) => void;
  /** Optional pre-filled JD (e.g. shared from parent so users only paste once). */
  initialJobDescription?: string;
  /** Notify parent when JD changes (for sharing across multiple buttons). */
  onJobDescriptionChange?: (jd: string) => void;
  /** Display variant: 'chip' for inline next to a section header (compact); 'button' for standalone. */
  variant?: "chip" | "button";
  /** Override the visible label (defaults to the section-specific label, e.g. "Improve summary"). */
  label?: string;
}

interface SectionCopy {
  title: string;
  /** Shown below the title in the dialog so the user knows exactly what AI will do. */
  description: string;
  /** Label for the JD textarea — varies per section so it's clear what input AI needs. */
  inputLabel: string;
  /** Placeholder for the JD textarea — examples of what's acceptable. */
  inputPlaceholder: string;
  /** Short label for the trigger chip ("Tailor with AI" by default). */
  buttonLabel: string;
}

const SECTION_COPY: Record<TailorSection, SectionCopy> = {
  summary: {
    title: "Improve your summary for a target role",
    description:
      "AI rewrites your professional summary to lead with what matters most for the role. Uses only the skills and experience you already have — never invents facts.",
    inputLabel: "Target role or job description",
    inputPlaceholder:
      "Just the role works: e.g. 'Senior Backend Engineer at a fintech startup, focus on payments and AWS'.\n\nOr paste a full JD for sharper results.",
    buttonLabel: "Improve summary",
  },
  skills: {
    title: "Reorder skills + suggest missing ones",
    description:
      "AI reorders your existing skills so the most role-relevant ones appear first. It also flags up to 5 skills mentioned in the role that aren't yet on your resume — only add the ones you actually have.",
    inputLabel: "Target role or job description",
    inputPlaceholder:
      "Just the role works: e.g. 'Frontend Engineer, React + TypeScript, real-time features'.\n\nOr paste a full JD for keyword extraction.",
    buttonLabel: "Reorder skills",
  },
  experience: {
    title: "Rewrite work-experience bullets for a target role",
    description:
      "AI rewrites up to 5 bullets across your 2 most recent roles to emphasize achievements relevant to the role. Numbers are never invented — if a bullet lacks a metric, you'll see an [X%] placeholder where you should add yours.",
    inputLabel: "Job description (longer is better)",
    inputPlaceholder:
      "Paste the full job description — AI extracts hard skills, responsibilities, and seniority signals to match your bullets against.\n\nA role title alone (e.g. 'Senior Platform Engineer, Kubernetes + Go') also works for a lighter rewrite.",
    buttonLabel: "Rewrite bullets",
  },
  projects: {
    title: "Reword project descriptions for a target role",
    description:
      "AI rewords each project description to highlight aspects relevant to the role. Won't add technologies you didn't actually use.",
    inputLabel: "Target role or job description",
    inputPlaceholder:
      "What role are you tailoring for? e.g. 'ML Engineer, recommender systems, PyTorch'.\n\nOr paste a full JD.",
    buttonLabel: "Reword projects",
  },
};

const MIN_INPUT_LENGTH = 15;

export function SectionTailorButton({
  section,
  resumeData,
  onResumeChange,
  initialJobDescription = "",
  onJobDescriptionChange,
  variant = "chip",
  label,
}: SectionTailorButtonProps) {
  const { t } = useTranslation("common");
  const copy = SECTION_COPY[section];
  const triggerLabel = label ?? copy.buttonLabel;
  const [open, setOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SectionResult | null>(null);

  const updateJd = (next: string) => {
    setJobDescription(next);
    if (onJobDescriptionChange) onJobDescriptionChange(next);
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
  };

  const trimmedLen = jobDescription.trim().length;
  const canGenerate = trimmedLen >= MIN_INPUT_LENGTH && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resume/tailor-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, resumeData, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Couldn't tailor this section right now.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  };

  const applySummary = () => {
    if (!result?.summaryAfter || !onResumeChange) return;
    onResumeChange({
      ...resumeData,
      basicInfo: { ...resumeData.basicInfo, summary: result.summaryAfter },
    });
    setOpen(false);
  };

  const applySkillsReorder = () => {
    if (!result?.reorderedSkillNames || !onResumeChange) return;
    const order = result.reorderedSkillNames.map((s) => s.toLowerCase().trim());
    const positionFor = (name: string) => {
      const idx = order.indexOf(name.toLowerCase().trim());
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };
    const reordered = [...resumeData.skills].sort(
      (a, b) => positionFor(a.name) - positionFor(b.name)
    );
    onResumeChange({ ...resumeData, skills: reordered });
  };

  const addMissingSkill = (skillName: string) => {
    if (!onResumeChange) return;
    const exists = resumeData.skills.some(
      (s) => s.name.toLowerCase().trim() === skillName.toLowerCase().trim()
    );
    if (exists) return;
    onResumeChange({
      ...resumeData,
      skills: [
        ...resumeData.skills,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: skillName },
      ],
    });
  };

  const applyBulletChange = (change: BulletChange) => {
    if (!onResumeChange) return;
    const updated = resumeData.workExperience.map((exp) => {
      const matches =
        exp.position.trim().toLowerCase() === change.position.trim().toLowerCase() &&
        exp.company.trim().toLowerCase() === change.company.trim().toLowerCase();
      if (!matches) return exp;
      if (change.index < 0 || change.index >= exp.description.length) return exp;
      return {
        ...exp,
        description: exp.description.map((d, i) =>
          i === change.index ? change.after : d
        ),
      };
    });
    onResumeChange({ ...resumeData, workExperience: updated });
  };

  const applyAllBulletChanges = () => {
    if (!result?.bulletChanges || !onResumeChange) return;
    let working = resumeData;
    for (const change of result.bulletChanges) {
      const updated = working.workExperience.map((exp) => {
        const matches =
          exp.position.trim().toLowerCase() === change.position.trim().toLowerCase() &&
          exp.company.trim().toLowerCase() === change.company.trim().toLowerCase();
        if (!matches) return exp;
        if (change.index < 0 || change.index >= exp.description.length) return exp;
        return {
          ...exp,
          description: exp.description.map((d, i) =>
            i === change.index ? change.after : d
          ),
        };
      });
      working = { ...working, workExperience: updated };
    }
    onResumeChange(working);
    setOpen(false);
  };

  const applyProjectChange = (change: ProjectChange) => {
    if (!onResumeChange) return;
    const updated = resumeData.projects.map((p) =>
      p.name.trim().toLowerCase() === change.name.trim().toLowerCase()
        ? { ...p, description: change.afterDescription }
        : p
    );
    onResumeChange({ ...resumeData, projects: updated });
  };

  const trigger =
    variant === "chip" ? (
      <Button
        size="small"
        variant="text"
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        startIcon={<IconWrapper icon="mdi:auto-fix" size={16} />}
        sx={{
          textTransform: "none",
          color: "var(--accent-purple)",
          fontSize: "0.75rem",
          py: 0.25,
          px: 1,
          minWidth: 0,
          "&:hover": {
            backgroundColor: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
          },
        }}
      >
        {triggerLabel}
      </Button>
    ) : (
      <Button
        size="small"
        variant="outlined"
        onClick={handleOpen}
        startIcon={<IconWrapper icon="mdi:auto-fix" />}
        sx={{
          textTransform: "none",
          borderColor: "var(--accent-purple)",
          color: "var(--accent-purple)",
          "&:hover": {
            backgroundColor: "color-mix(in srgb, var(--accent-purple) 10%, var(--surface))",
          },
        }}
      >
        {triggerLabel}
      </Button>
    );

  return (
    <>
      {trigger}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
          <IconWrapper icon="mdi:auto-fix" />
          {copy.title}
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={handleClose} disabled={loading} size="small">
            <IconWrapper icon="mdi:close" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 1.5 }}>
            {copy.description} Your resume isn&apos;t changed until you click <strong>Apply</strong>.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={5}
            size="small"
            label={copy.inputLabel}
            placeholder={copy.inputPlaceholder}
            value={jobDescription}
            onChange={(e) => updateJd(e.target.value)}
            inputProps={{ maxLength: 12000 }}
            helperText={
              trimmedLen > 0 && trimmedLen < MIN_INPUT_LENGTH
                ? `Add a few more words (${MIN_INPUT_LENGTH - trimmedLen} to go).`
                : trimmedLen === 0
                  ? "Tip: just typing the role title works — full JD gives better results."
                  : " "
            }
          />

          {error && (
            <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {result && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Divider />
              {result.rationale && (
                <Alert
                  severity="info"
                  icon={<IconWrapper icon="mdi:lightbulb-on-outline" />}
                  sx={{ "& .MuiAlert-message": { width: "100%" } }}
                >
                  <Typography variant="body2">{result.rationale}</Typography>
                </Alert>
              )}

              {/* Summary */}
              {result.section === "summary" && result.summaryAfter && (
                <Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
                    <DiffPanel label="BEFORE" text={result.summaryBefore || ""} />
                    <DiffPanel label="AFTER" text={result.summaryAfter} accent />
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={applySummary}
                    disabled={!onResumeChange}
                    startIcon={<IconWrapper icon="mdi:check" />}
                    sx={{
                      mt: 1,
                      textTransform: "none",
                      backgroundColor: "var(--accent-purple)",
                    }}
                  >
                    Apply rewrite
                  </Button>
                </Box>
              )}

              {/* Skills */}
              {result.section === "skills" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {result.reorderedSkillNames && result.reorderedSkillNames.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
                        REORDERED (most JD-relevant first)
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                        {result.reorderedSkillNames.slice(0, 12).map((s, i) => (
                          <Chip
                            key={`${s}-${i}`}
                            label={s}
                            size="small"
                            sx={{
                              backgroundColor:
                                i < 5
                                  ? "color-mix(in srgb, var(--accent-purple) 15%, var(--surface))"
                                  : "var(--surface)",
                              fontWeight: i < 5 ? 600 : 400,
                            }}
                          />
                        ))}
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={applySkillsReorder}
                        disabled={!onResumeChange}
                        startIcon={<IconWrapper icon="mdi:sort" />}
                        sx={{ mt: 1, textTransform: "none", backgroundColor: "var(--accent-purple)" }}
                      >
                        Apply this order
                      </Button>
                    </Box>
                  )}

                  {result.missingSkillSuggestions && result.missingSkillSuggestions.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--warning-500)" }}>
                        CONSIDER ADDING (only if you actually have these)
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.75 }}>
                        {result.missingSkillSuggestions.map((s, i) => (
                          <Paper
                            key={i}
                            variant="outlined"
                            sx={{
                              p: 1.25,
                              borderColor: "var(--border-default)",
                              backgroundColor: "color-mix(in srgb, var(--warning-500) 6%, var(--card-bg))",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.name}</Typography>
                              {s.reason && (
                                <Typography
                                  variant="body2"
                                  sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", mt: 0.25 }}
                                >
                                  {s.reason}
                                </Typography>
                              )}
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => addMissingSkill(s.name)}
                              disabled={!onResumeChange}
                              sx={{ textTransform: "none", flexShrink: 0 }}
                            >
                              Add
                            </Button>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Experience */}
              {result.section === "experience" &&
                result.bulletChanges &&
                result.bulletChanges.length > 0 && (
                  <Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
                        BULLET REWRITES ({result.bulletChanges.length})
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={applyAllBulletChanges}
                        disabled={!onResumeChange}
                        startIcon={<IconWrapper icon="mdi:check-all" />}
                        sx={{ textTransform: "none", backgroundColor: "var(--accent-purple)" }}
                      >
                        Apply all
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {result.bulletChanges.map((c, i) => (
                        <Box key={i}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                              {c.position} @ {c.company} · bullet {c.index + 1}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => applyBulletChange(c)}
                              disabled={!onResumeChange}
                              sx={{ textTransform: "none" }}
                            >
                              Apply
                            </Button>
                          </Box>
                          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 0.5 }}>
                            <DiffPanel label="BEFORE" text={c.before} compact />
                            <DiffPanel label="AFTER" text={c.after} accent compact />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

              {/* Projects */}
              {result.section === "projects" &&
                result.projectChanges &&
                result.projectChanges.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
                      PROJECT DESCRIPTIONS ({result.projectChanges.length})
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.75 }}>
                      {result.projectChanges.map((c, i) => (
                        <Box key={i}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                              {c.name}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => applyProjectChange(c)}
                              disabled={!onResumeChange}
                              sx={{ textTransform: "none" }}
                            >
                              Apply
                            </Button>
                          </Box>
                          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 0.5 }}>
                            <DiffPanel label="BEFORE" text={c.beforeDescription} compact />
                            <DiffPanel label="AFTER" text={c.afterDescription} accent compact />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading} sx={{ textTransform: "none" }}>
            Close
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={loading}
            loadingText={t("common.generating")}
            startIcon={<IconWrapper icon="mdi:auto-fix" />}
            sx={{ textTransform: "none", backgroundColor: "var(--accent-purple)" }}
          >
            {result ? "Regenerate" : "Generate"}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DiffPanel({
  label,
  text,
  accent,
  compact,
}: {
  label: string;
  text: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderColor: accent ? "var(--accent-purple)" : "var(--border-default)",
        backgroundColor: accent
          ? "color-mix(in srgb, var(--accent-purple) 8%, var(--card-bg))"
          : "var(--surface)",
        fontSize: compact ? "0.8125rem" : "0.875rem",
        whiteSpace: "pre-wrap",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: accent ? "var(--accent-purple)" : "var(--font-secondary)",
          fontWeight: 700,
          display: "block",
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      {text || <em style={{ color: "var(--font-secondary)" }}>(empty)</em>}
    </Paper>
  );
}
