"use client";

import { useMemo, useState } from "react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { GenerateModeToggle } from "@/components/adaptive-quiz/generate/GenerateModeToggle";
import { DescribeModePanel } from "@/components/adaptive-quiz/generate/DescribeModePanel";
import { CsvUploadPanel } from "@/components/adaptive-quiz/generate/CsvUploadPanel";
import { EditableCsvPlanPreview } from "@/components/adaptive-quiz/generate/EditableCsvPlanPreview";
import { SharedGenerationConfig } from "@/components/adaptive-quiz/generate/SharedGenerationConfig";
import {
  ALL_CONTENT_TYPES,
  ALL_DIFFICULTIES,
  withRowUids,
  type ContentType,
  type Difficulty,
  type GenerateMode,
  type ParsedCsv,
} from "@/components/adaptive-quiz/generate/types";
import {
  adminAdaptiveCourseService,
  type AdaptiveCourseGenConfig,
  type CsvCoursePlan,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

export default function GenerateAdaptiveCoursePage() {
  const { push } = useInstantNavigation();
  const { showToast } = useToast();

  const [mode, setMode] = useState<GenerateMode>("describe");

  // --- Describe mode ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);

  // --- CSV mode ---
  const [csvTitle, setCsvTitle] = useState("");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [plan, setPlan] = useState<CsvCoursePlan | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // --- Shared generation config ---
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["Easy", "Medium", "Hard"]);
  const [questionsPerCell, setQuestionsPerCell] = useState(3);
  const [articlesPerSubmodule, setArticlesPerSubmodule] = useState(1);
  const [presentationSlideCount, setPresentationSlideCount] = useState(12);
  const [videoVoice, setVideoVoice] = useState("");
  const [videoStorage, setVideoStorage] = useState<"s3" | "vimeo">("s3");
  // Default to a fixed 15-question quiz (min === max): every quiz asks 15, difficulty adapts.
  const [minQuestions, setMinQuestions] = useState(15);
  const [maxQuestions, setMaxQuestions] = useState(15);
  const [confidence, setConfidence] = useState(true);
  // All four content types auto-selected by default (quiz + article + AI Coding
  // Mentor + Video Companion); admins can deselect in Advanced options.
  const [contentTypes, setContentTypes] = useState<ContentType[]>(["quiz", "article", "coding", "video"]);
  const [codingClipboard, setCodingClipboard] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  function toggleContentType(t: ContentType) {
    setContentTypes((prev) => {
      const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      return ALL_CONTENT_TYPES.filter((x) => next.includes(x));
    });
  }

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
      return ALL_DIFFICULTIES.filter((x) => next.includes(x));
    });
  }

  // Mirror the backend serializer's requirements so editing to an invalid plan
  // disables Generate (with a hint) instead of bouncing off a nested 400.
  const planReady =
    !!plan &&
    plan.modules.length > 0 &&
    plan.modules.every(
      (m) =>
        m.title.trim().length > 0 &&
        m.submodules.length > 0 &&
        m.submodules.every((s) => s.title.trim().length > 0),
    );

  const canSubmit =
    difficulties.length > 0 &&
    contentTypes.length > 0 &&
    (mode === "describe"
      ? title.trim().length > 1 && description.trim().length > 4
      : csvTitle.trim().length > 1 && planReady);

  // Rough preview — describe mode estimates from duration; CSV mode uses the exact
  // parsed counts (and per-submodule key_concepts) so the bento matches what builds.
  const preview = useMemo(() => {
    const hasQuiz = contentTypes.includes("quiz");
    const hasCoding = contentTypes.includes("coding");
    if (mode === "csv" && plan) {
      const modules = plan.modules.length;
      const submodules = plan.modules.reduce((n, m) => n + m.submodules.length, 0);
      const bankItems = hasQuiz
        ? plan.modules.reduce(
            (n, m) =>
              n +
              m.submodules.reduce(
                (s, sub) =>
                  s + Math.min(Math.max(sub.key_concepts.length, 1), 4) * difficulties.length * questionsPerCell,
                0,
              ),
            0,
          )
        : 0;
      return {
        modules,
        submodules,
        hasQuiz,
        hasCoding,
        quizzes: hasQuiz ? submodules : 0,
        bankItems,
        codingProblems: hasCoding ? submodules * difficulties.length * 2 : 0,
      };
    }
    const modules = Math.max(1, Math.round(durationWeeks * 0.75));
    const submodules = modules * 3;
    const bankPerQuiz = 3 * difficulties.length * questionsPerCell;
    return {
      modules,
      submodules,
      hasQuiz,
      hasCoding,
      quizzes: hasQuiz ? submodules : 0,
      bankItems: hasQuiz ? submodules * bankPerQuiz : 0,
      codingProblems: hasCoding ? submodules * difficulties.length * 2 : 0,
    };
  }, [mode, plan, durationWeeks, difficulties, questionsPerCell, contentTypes]);

  function buildConfig(): AdaptiveCourseGenConfig {
    return {
      difficulty_levels: difficulties,
      difficulty_level: difficulties.includes("Medium") ? "Medium" : difficulties[0],
      questions_per_cell: questionsPerCell,
      articles_per_submodule: articlesPerSubmodule,
      min_questions: minQuestions,
      max_questions: maxQuestions,
      confidence_prompt_enabled: confidence,
      content_types: contentTypes,
      ...(contentTypes.includes("presentation")
        ? { presentation_slide_count: presentationSlideCount }
        : {}),
      ...(contentTypes.includes("video_lesson")
        ? { video_voice: videoVoice, video_storage: videoStorage }
        : {}),
      ...(contentTypes.includes("coding")
        ? { coding_problems_per_submodule: 2, coding_language: "Python", coding_allow_clipboard: codingClipboard }
        : {}),
    };
  }

  async function handleAnalyze() {
    if (!parsed || analyzing) return;
    setAnalyzing(true);
    try {
      const result = await adminAdaptiveCourseService.parseCsv({
        title: csvTitle.trim() || undefined,
        columns: parsed.columns,
        rows: parsed.rows,
        hint: hint.trim() || undefined,
      });
      setPlan(withRowUids(result));
      if (!result.modules?.length) {
        showToast("The AI couldn't find any topics in that CSV. Try a clearer file or hint.", "error");
      } else {
        const weeks = result.modules.length;
        showToast(`Parsed ${weeks} ${weeks === 1 ? "week" : "weeks"} — review and generate.`, "success");
      }
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't analyze the CSV."), "error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const config = buildConfig();
    try {
      const job =
        mode === "describe"
          ? await adminAdaptiveCourseService.generateCourse({
              title: title.trim(),
              description: description.trim(),
              duration_weeks: durationWeeks,
              config,
            })
          : await adminAdaptiveCourseService.generateFromPlan({
              title: csvTitle.trim(),
              modules: plan!.modules,
              config,
            });
      showToast("Generation started.", "success");
      push(`/admin/adaptive-courses/jobs/${job.job_id}`);
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't start generation."), "error");
      setSubmitting(false);
    }
  }

  const showGenerate = mode === "describe" || !!plan;
  const showEstimate = mode === "describe" || (mode === "csv" && !!plan);

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => push("/admin/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Course Builder
        </ButtonBase>

        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Generate · Adaptive"
            title="Generate adaptive course"
            subtitle="Describe a course in prose, or upload a curriculum CSV and let AI map it — either way we generate modules, submodules, and a full adaptive quiz (IRT bank, branching, confidence capture) for every submodule."
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <GenerateModeToggle mode={mode} onChange={setMode} />

              {mode === "describe" ? (
                <DescribeModePanel
                  title={title}
                  onTitleChange={setTitle}
                  description={description}
                  onDescriptionChange={setDescription}
                  durationWeeks={durationWeeks}
                  onDurationWeeksChange={setDurationWeeks}
                />
              ) : (
                <>
                  <CsvUploadPanel
                    csvTitle={csvTitle}
                    onCsvTitleChange={setCsvTitle}
                    parsed={parsed}
                    onParsed={(p) => {
                      setParsed(p);
                      setPlan(null); // a new file invalidates the previous AI plan
                    }}
                    parseError={parseError}
                    onParseError={setParseError}
                    hint={hint}
                    onHintChange={setHint}
                    analyzing={analyzing}
                    onAnalyze={() => void handleAnalyze()}
                    hasPlan={!!plan}
                  />
                  {plan && (
                    <EditableCsvPlanPreview plan={plan} onChange={setPlan} contentTypes={contentTypes} />
                  )}
                </>
              )}

              <SharedGenerationConfig
                contentTypes={contentTypes}
                onToggleContentType={toggleContentType}
                difficulties={difficulties}
                onToggleDifficulty={toggleDifficulty}
                questionsPerCell={questionsPerCell}
                onQuestionsPerCellChange={setQuestionsPerCell}
                articlesPerSubmodule={articlesPerSubmodule}
                onArticlesPerSubmoduleChange={setArticlesPerSubmodule}
                presentationSlideCount={presentationSlideCount}
                onPresentationSlideCountChange={setPresentationSlideCount}
                videoVoice={videoVoice}
                onVideoVoiceChange={setVideoVoice}
                videoStorage={videoStorage}
                onVideoStorageChange={setVideoStorage}
                minQuestions={minQuestions}
                onMinQuestionsChange={setMinQuestions}
                maxQuestions={maxQuestions}
                onMaxQuestionsChange={setMaxQuestions}
                confidence={confidence}
                onConfidenceChange={setConfidence}
                codingClipboard={codingClipboard}
                onCodingClipboardChange={setCodingClipboard}
              />

              {showGenerate && (
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
              )}
              {mode === "csv" && plan && !planReady && (
                <Typography sx={{ fontSize: "0.78rem", color: "#b45309", display: "flex", gap: 0.5, alignItems: "center", mt: -1 }}>
                  <Icon icon="mdi:alert-outline" width={15} />
                  Every week and topic needs a title before you can generate.
                </Typography>
              )}
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
              {showEstimate ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Icon icon="mdi:sparkles" width={20} />
                    <Typography sx={{ fontWeight: 800 }}>{"What you'll get"}</Typography>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    <PreviewStat value={`~${preview.modules}`} label="Modules" />
                    <PreviewStat value={`~${preview.submodules}`} label="Submodules" />
                    {preview.hasQuiz && <PreviewStat value={`~${preview.quizzes}`} label="Adaptive quizzes" />}
                    {preview.hasQuiz && <PreviewStat value={`~${preview.bankItems}`} label="Calibrated quiz items" />}
                    {preview.hasCoding && (
                      <PreviewStat value={`~${preview.codingProblems}`} label="Coding problems" />
                    )}
                  </Box>
                  <Typography sx={{ mt: 2.5, fontSize: "0.82rem", opacity: 0.92, lineHeight: 1.5 }}>
                    Every submodule ships a branching IRT quiz that picks each next question by performance.
                    {mode === "csv"
                      ? " Estimates reflect your edited plan."
                      : " Estimates update as you change the form."}
                  </Typography>
                </>
              ) : (
                <CsvHowItWorks />
              )}
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

function CsvHowItWorks() {
  const steps: Array<{ icon: string; text: string }> = [
    { icon: "mdi:tray-arrow-up", text: "Upload a curriculum CSV — any column names work." },
    { icon: "mdi:sparkles", text: "AI maps your columns into weeks, topics, and skills." },
    { icon: "mdi:pencil-outline", text: "Review and edit the plan — rename, delete, or add rows." },
    { icon: "mdi:auto-fix", text: "Generate — an adaptive quiz, article & more per topic." },
  ];
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Icon icon="mdi:file-delimited-outline" width={20} />
        <Typography sx={{ fontWeight: 800 }}>How CSV upload works</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {steps.map((s, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box
              sx={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(255,255,255,0.18)",
                fontWeight: 900,
                fontSize: "0.8rem",
              }}
            >
              {i + 1}
            </Box>
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
              <Icon icon={s.icon} width={18} />
              <Typography sx={{ fontSize: "0.85rem", opacity: 0.95, lineHeight: 1.4 }}>{s.text}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}
