"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  Container,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  adminAdaptiveCourseService,
  type AdaptiveCourseGenConfig,
} from "@/lib/services/admin/admin-adaptive-course.service";

type Difficulty = "Easy" | "Medium" | "Hard";
const ALL_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function GenerateAdaptiveCoursePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["Easy", "Medium", "Hard"]);
  const [questionsPerCell, setQuestionsPerCell] = useState(3);
  const [minQuestions, setMinQuestions] = useState(8);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [confidence, setConfidence] = useState(true);
  const [contentTypes, setContentTypes] = useState<Array<"quiz" | "article" | "coding" | "video">>(["quiz", "article"]);
  const [codingClipboard, setCodingClipboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 1 && description.trim().length > 4 && difficulties.length > 0 && contentTypes.length > 0;

  function toggleContentType(t: "quiz" | "article" | "coding" | "video") {
    setContentTypes((prev) => {
      const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      return (["quiz", "article", "coding", "video"] as const).filter((x) => next.includes(x));
    });
  }

  // Rough preview — outline picks ~3 submodules/module; bank ≈ submodules ×
  // ~3 sub-skills × difficulties × questions/cell.
  const preview = useMemo(() => {
    const modules = Math.max(1, Math.round(durationWeeks * 0.75));
    const submodules = modules * 3;
    const bankPerQuiz = 3 * difficulties.length * questionsPerCell;
    const hasQuiz = contentTypes.includes("quiz");
    const hasCoding = contentTypes.includes("coding");
    return {
      modules,
      submodules,
      hasQuiz,
      hasCoding,
      quizzes: hasQuiz ? submodules : 0,
      bankItems: hasQuiz ? submodules * bankPerQuiz : 0,
      // Coding generates ~2 problems per difficulty tier per submodule (see builder).
      codingProblems: hasCoding ? submodules * difficulties.length * 2 : 0,
    };
  }, [durationWeeks, difficulties.length, questionsPerCell, contentTypes]);

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
      return ALL_DIFFICULTIES.filter((x) => next.includes(x));
    });
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const config: AdaptiveCourseGenConfig = {
      difficulty_levels: difficulties,
      difficulty_level: difficulties.includes("Medium") ? "Medium" : difficulties[0],
      questions_per_cell: questionsPerCell,
      min_questions: minQuestions,
      max_questions: maxQuestions,
      confidence_prompt_enabled: confidence,
      content_types: contentTypes,
      ...(contentTypes.includes("coding")
        ? { coding_problems_per_submodule: 2, coding_language: "Python", coding_allow_clipboard: codingClipboard }
        : {}),
    };
    try {
      const job = await adminAdaptiveCourseService.generateCourse({
        title: title.trim(),
        description: description.trim(),
        target_audience: targetAudience.trim() || undefined,
        duration_weeks: durationWeeks,
        config,
      });
      showToast("Generation started.", "success");
      router.push(`/admin/adaptive-courses/jobs/${job.job_id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't start generation.", "error");
      setSubmitting(false);
    }
  }

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => router.push("/admin/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Course Builder
        </ButtonBase>

        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Generate · Adaptive"
            title="Generate adaptive course from description"
            subtitle="Describe the course once — we generate modules, submodules, and a full adaptive quiz (IRT bank, branching, confidence capture) for every submodule."
            icon="mdi:auto-fix"
            accent="purple"
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
              gap: 3,
              alignItems: "start",
            }}
          >
            {/* Form */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Course title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
              <TextField
                label="Course description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={4}
              />
              <TextField
                label="Target audience (optional)"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                fullWidth
              />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="Duration (weeks)"
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(clamp(Number(e.target.value), 1, 52))}
                  sx={{ width: 160 }}
                />
                <TextField
                  label="Questions per skill cell"
                  type="number"
                  value={questionsPerCell}
                  onChange={(e) => setQuestionsPerCell(clamp(Number(e.target.value), 1, 10))}
                  sx={{ width: 220 }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 1 }}>
                  Content types (per submodule)
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {([
                    ["article", "Adaptive Article", "mdi:book-open-variant"],
                    ["quiz", "Adaptive Quiz", "mdi:tune-vertical"],
                    ["coding", "AI Coding Mentor", "mdi:robot-happy-outline"],
                    ["video", "Video Companion", "mdi:play-circle-outline"],
                  ] as const).map(([key, label, icon]) => {
                    const active = contentTypes.includes(key);
                    return (
                      <ButtonBase
                        key={key}
                        onClick={() => toggleContentType(key)}
                        sx={{
                          px: 2, py: 0.85, borderRadius: 999, fontWeight: 800, fontSize: "0.82rem", gap: 0.5,
                          color: active ? "white" : "text.primary",
                          background: active
                            ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                            : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                          border: active ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                        }}
                      >
                        <Icon icon={icon} width={15} />
                        {label}
                      </ButtonBase>
                    );
                  })}
                </Box>
                {contentTypes.includes("coding") && (
                  <Box
                    component="button"
                    onClick={() => setCodingClipboard((v) => !v)}
                    sx={{
                      all: "unset", cursor: "pointer", mt: 1.25, display: "inline-flex", alignItems: "center", gap: 0.75,
                      fontSize: "0.82rem", fontWeight: 700, color: "text.secondary",
                    }}
                  >
                    <Icon icon={codingClipboard ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"} width={18} style={{ color: codingClipboard ? "#6366f1" : undefined }} />
                    Allow copy-paste in the coding editor
                    <Typography component="span" sx={{ fontSize: "0.74rem", color: "text.disabled" }}>
                      (off = anti-paste hardening; changeable per set later)
                    </Typography>
                  </Box>
                )}
                {contentTypes.includes("video") && (
                  <Typography sx={{ mt: 1.25, fontSize: "0.78rem", color: "text.secondary", display: "flex", gap: 0.5, alignItems: "center" }}>
                    <Icon icon="mdi:information-outline" width={16} />
                    We AI-match a transcribed Vimeo video per submodule from your catalog (review &amp; swap after). Sync the catalog first if it&apos;s empty.
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", mb: 1 }}>
                  Difficulty tiers (quizzes span these)
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {ALL_DIFFICULTIES.map((d) => {
                    const active = difficulties.includes(d);
                    return (
                      <ButtonBase
                        key={d}
                        onClick={() => toggleDifficulty(d)}
                        sx={{
                          px: 2,
                          py: 0.85,
                          borderRadius: 999,
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          color: active ? "white" : "text.primary",
                          background: active
                            ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                            : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                          border: active
                            ? "1px solid transparent"
                            : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                        }}
                      >
                        {d}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="Min questions / quiz"
                  type="number"
                  value={minQuestions}
                  onChange={(e) => setMinQuestions(clamp(Number(e.target.value), 1, 50))}
                  sx={{ width: 200 }}
                />
                <TextField
                  label="Max questions / quiz"
                  type="number"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(clamp(Number(e.target.value), 1, 100))}
                  sx={{ width: 200 }}
                />
              </Box>

              <FormControlLabel
                control={<Switch checked={confidence} onChange={(e) => setConfidence(e.target.checked)} />}
                label="Confidence capture (Guess / Unsure / Sure / Certain under each question)"
              />

              <ButtonBase
                onClick={() => void handleSubmit()}
                disabled={!canSubmit || submitting}
                sx={{
                  alignSelf: "flex-start",
                  px: 3.5,
                  py: 1.4,
                  borderRadius: 999,
                  fontWeight: 800,
                  color: "white",
                  gap: 0.75,
                  opacity: !canSubmit || submitting ? 0.5 : 1,
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
                  boxShadow: "0 18px 36px -16px rgba(168, 85, 247, 0.55)",
                }}
              >
                <Icon icon={submitting ? "mdi:loading" : "mdi:auto-fix"} width={18} className={submitting ? "spin" : ""} />
                {submitting ? "Starting…" : "Generate adaptive course"}
              </ButtonBase>
            </Box>

            {/* Live preview */}
            <Box
              sx={{
                borderRadius: 4,
                p: 3,
                color: "white",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)",
                boxShadow: "0 24px 48px -24px rgba(168, 85, 247, 0.6)",
                position: "sticky",
                top: 16,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Icon icon="mdi:sparkles" width={20} />
                <Typography sx={{ fontWeight: 800 }}>{"What you'll get"}</Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <PreviewStat value={`~${preview.modules}`} label="Modules" />
                <PreviewStat value={`~${preview.submodules}`} label="Submodules" />
                {preview.hasQuiz && <PreviewStat value={`~${preview.quizzes}`} label="Adaptive quizzes" />}
                {preview.hasQuiz && <PreviewStat value={`~${preview.bankItems}`} label="Calibrated quiz items" />}
                {preview.hasCoding && <PreviewStat value={`~${preview.codingProblems}`} label="Coding problems" />}
              </Box>
              <Typography sx={{ mt: 2.5, fontSize: "0.82rem", opacity: 0.92, lineHeight: 1.5 }}>
                Every submodule ships a branching IRT quiz that picks each next question by
                performance. Estimates update as you change the form.
              </Typography>
            </Box>
          </Box>
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}

function PreviewStat({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{ borderRadius: 3, p: 1.75, bgcolor: "rgba(255,255,255,0.14)" }}>
      <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.78rem", opacity: 0.9, mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
