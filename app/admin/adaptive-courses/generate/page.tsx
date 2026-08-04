"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { parseCourseBrief } from "@/lib/utils/course-brief";

function GenerateAdaptiveCourseInner() {
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  const params = useSearchParams();

  // The hub links straight into a mode ("From a CSV plan") and can hand over the brief typed
  // into its composer. Read once, as the INITIAL state rather than in an effect: seeding from an
  // effect would flash the Describe tab first, and would fight the user if they then switched
  // tabs while the param was still in the URL.
  const [mode, setMode] = useState<GenerateMode>(
    params.get("mode") === "csv" ? "csv" : "describe",
  );

  // The composer promises "Describe it. We'll build the whole thing." Handing the sentence over
  // as the description alone broke that promise: the title stayed empty (and is required, so
  // Generate was disabled), the duration ignored the "1 week" you typed, and "no coding" was
  // dropped while the estimate still promised 54 coding problems.
  const parsedBrief = useMemo(() => {
    const raw = params.get("brief");
    return raw ? parseCourseBrief(raw) : null;
  }, [params]);

  // --- Describe mode ---
  const [title, setTitle] = useState(() => parsedBrief?.title ?? "");
  const [description, setDescription] = useState(() => parsedBrief?.description ?? "");
  const [durationWeeks, setDurationWeeks] = useState(() => parsedBrief?.durationWeeks ?? 4);

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
  // Drives BOTH the estimate the admin sees and the structure the generator is told to build,
  // so the two cannot drift apart.
  const [submodulesPerModule, setSubmodulesPerModule] = useState(3);
  // Per DIFFICULTY TIER, which is what the generator's cap actually means — the field name
  // says "per submodule" but coding_per_tier_for_submodule applies it once per tier.
  const [codingPerTier, setCodingPerTier] = useState(2);
  // Default to a fixed 15-question quiz (min === max): every quiz asks 15, difficulty adapts.
  const [minQuestions, setMinQuestions] = useState(15);
  const [maxQuestions, setMaxQuestions] = useState(15);
  const [confidence, setConfidence] = useState(true);
  // All four content types auto-selected by default (quiz + article + AI Coding
  // Mentor + Video); admins can deselect in Advanced options.
  // A brief that mentions no content types leaves all four on — the form's own default. Only an
  // explicit "no coding" / "heavy on practice problems" narrows it.
  const [contentTypes, setContentTypes] = useState<ContentType[]>(
    () => parsedBrief?.contentTypes ?? ["quiz", "article", "coding", "video"],
  );
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

  // Rough preview - describe mode estimates from duration; CSV mode uses the exact
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
        codingProblems: hasCoding ? submodules * difficulties.length * codingPerTier : 0,
      };
    }
    // One module per week, exactly. The 0.75 factor that used to be here was invented — the
    // generator's own prompt says "each module represents one week", and the tree labels them
    // "Week 1", "Week 2". A 4-week course estimated 3 modules and then built 4.
    //
    // submodulesPerModule is a real request field now, not the silent 3 this used to assume
    // while the prompt asked the model for "3-5" and was free to give 5.
    const modules = Math.max(1, durationWeeks);
    const submodules = modules * submodulesPerModule;
    const bankPerQuiz = 3 * difficulties.length * questionsPerCell;
    return {
      modules,
      submodules,
      hasQuiz,
      hasCoding,
      quizzes: hasQuiz ? submodules : 0,
      bankItems: hasQuiz ? submodules * bankPerQuiz : 0,
      // The 2 here was hardcoded, so raising the cap in Advanced settings changed what got
      // built and not what was shown. And this is a CEILING, not a forecast: the generator asks
      // the model how much a topic warrants, clamps to [1, cap], and returns NOTHING for a
      // topic it judges non-coding — which is why "System Design, no coding" could still show
      // dozens of coding problems.
      codingProblems: hasCoding ? submodules * difficulties.length * codingPerTier : 0,
    };
  }, [mode, plan, durationWeeks, submodulesPerModule, difficulties, questionsPerCell, codingPerTier, contentTypes]);

  function buildConfig(): AdaptiveCourseGenConfig {
    return {
      difficulty_levels: difficulties,
      difficulty_level: difficulties.includes("Medium") ? "Medium" : difficulties[0],
      questions_per_cell: questionsPerCell,
      articles_per_submodule: articlesPerSubmodule,
      // Sent so the generator builds what the estimate promised, and so the super admin's
      // review queue sizes the request off the same number the admin was shown.
      submodules_per_module: submodulesPerModule,
      min_questions: minQuestions,
      max_questions: maxQuestions,
      confidence_prompt_enabled: confidence,
      content_types: contentTypes,
      ...(contentTypes.includes("coding")
        ? {
            coding_problems_per_submodule: codingPerTier,
            coding_language: "Python",
            coding_allow_clipboard: codingClipboard,
          }
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
        showToast(`Parsed ${weeks} ${weeks === 1 ? "week" : "weeks"} - review and generate.`, "success");
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
      // Not "started": nothing is generated until a super admin approves it. Saying
      // "Generation started" here and then showing a job that never moves is how an admin
      // concludes the builder is broken.
      showToast("Sent for approval.", "success");
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
            subtitle="Describe the course, or upload a curriculum CSV. Either way you get weeks, topics, and a quiz on every topic that gets harder or easier as the student answers."
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

              {/* What was read out of the brief, in the admin's own words. The composer's
                  pitch is "one review, then generate" — that is only true if there is
                  something to review against, and silent prefill is worse than none. */}
              {parsedBrief && parsedBrief.understood.length > 0 && mode === "describe" && (
                <Box
                  sx={{
                    mt: 2, mb: 1, p: 1.75, borderRadius: 3,
                    display: "flex", alignItems: "flex-start", gap: 1.25,
                    bgcolor: "color-mix(in srgb, #6366f1 7%, var(--card-bg))",
                    border: "1px solid color-mix(in srgb, #6366f1 28%, transparent)",
                  }}
                >
                  <Icon icon="mdi:auto-fix" width={18} style={{ color: "#6366f1", flexShrink: 0, marginTop: 2 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.88rem" }}>
                      Filled in from your brief — {parsedBrief.understood.join(" · ")}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", lineHeight: 1.5 }}>
                      Check it below and change anything that is not right, then generate.
                    </Typography>
                  </Box>
                </Box>
              )}

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
                submodulesPerModule={submodulesPerModule}
                codingPerTier={codingPerTier}
                onArticlesPerSubmoduleChange={setArticlesPerSubmodule}
                onSubmodulesPerModuleChange={setSubmodulesPerModule}
                onCodingPerTierChange={setCodingPerTier}
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
                    {/* Exact, not "~": the generator is now told to build EXACTLY this many. */}
                    <PreviewStat value={String(preview.modules)} label="Weeks" />
                    <PreviewStat value={String(preview.submodules)} label="Topics" />
                    {preview.hasQuiz && <PreviewStat value={`~${preview.quizzes}`} label="Adaptive quizzes" />}
                    {preview.hasQuiz && (
                      <PreviewStat value={`up to ${preview.bankItems}`} label="Quiz questions" />
                    )}
                    {preview.hasCoding && (
                      // "up to", because this is a ceiling: the engine asks the model how much
                      // each topic warrants, clamps to the cap, and generates NOTHING for a
                      // topic it judges non-coding.
                      <PreviewStat value={`up to ${preview.codingProblems}`} label="Coding problems" />
                    )}
                  </Box>
                  <Typography sx={{ mt: 2.5, fontSize: "0.82rem", opacity: 0.92, lineHeight: 1.5 }}>
                    Every topic gets a quiz that picks each next question from how the student is doing.
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
    { icon: "mdi:tray-arrow-up", text: "Upload a curriculum CSV - any column names work." },
    { icon: "mdi:sparkles", text: "AI maps your columns into weeks, topics, and skills." },
    { icon: "mdi:pencil-outline", text: "Review and edit the plan - rename, delete, or add rows." },
    { icon: "mdi:auto-fix", text: "Generate - an adaptive quiz, article & more per topic." },
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


/**
 * `useSearchParams` opts a route into client-side rendering, and Next fails the BUILD — not
 * typecheck — if it is not inside a Suspense boundary. tsc is happy either way, so this is the
 * kind of thing only `next build` catches.
 */
export default function GenerateAdaptiveCoursePage() {
  return (
    <Suspense fallback={null}>
      <GenerateAdaptiveCourseInner />
    </Suspense>
  );
}
