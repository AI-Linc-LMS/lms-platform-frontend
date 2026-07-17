"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography, Button, LinearProgress, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import {
  DifficultyBalanceMeter,
  StatusChip,
  AssessmentBreadcrumb,
} from "@/components/admin/assessment/shared";
import { publishAssessment } from "@/lib/services/admin/admin-assessment.service";
import {
  getAssessmentComposerJob,
  composerErrorMessage,
  isComposerTerminal,
  type ComposerJobResponse,
} from "@/lib/services/admin/admin-assessment-composer.service";

const STAGE_LABEL: Record<string, string> = {
  pending: "Starting…",
  generating_blueprint: "Designing the blueprint…",
  blueprint_ready: "Blueprint ready — generating questions…",
  generating_questions: "Writing & calibrating questions…",
  assembling: "Assembling your draft…",
  completed: "Draft ready",
  failed: "Generation failed",
};

const DIFF_TONE: Record<string, "success" | "warning" | "error" | "neutral"> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

export default function ComposerJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = String(params?.jobId || "");
  const { showToast } = useToast();
  const [job, setJob] = useState<ComposerJobResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    try {
      const data = await getAssessmentComposerJob(config.clientId, jobId);
      setJob(data);
      if (!isComposerTerminal(data.status)) {
        pollRef.current = setTimeout(poll, 2000);
      }
    } catch (e: unknown) {
      setLoadError((e as { message?: string })?.message || "Failed to load the composer job");
    }
  }, [jobId]);

  useEffect(() => {
    poll();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [poll]);

  const blueprint = job?.blueprint;
  const overallBalance = useMemo(() => {
    const b = { easy: 0, medium: 0, hard: 0 };
    (blueprint?.sections || []).forEach((s) => {
      b.easy += s.difficulty_split?.easy || 0;
      b.medium += s.difficulty_split?.medium || 0;
      b.hard += s.difficulty_split?.hard || 0;
    });
    return b;
  }, [blueprint]);

  const questionsBySection = useMemo(() => {
    const map: Record<string, ComposerJobResponse["questions"]> = {};
    (job?.questions || []).forEach((q) => {
      const ref = String(q._section_ref ?? "unassigned");
      (map[ref] ||= []).push(q);
    });
    return map;
  }, [job]);

  // Topic per blueprint section (for the row chips + the TOPIC COVERAGE card).
  const topicBySection = useMemo(() => {
    const map: Record<string, string> = {};
    (blueprint?.sections || []).forEach((s) => {
      if (s.topic) map[s.id] = s.topic;
    });
    return map;
  }, [blueprint]);
  const coverageTopics = useMemo(() => {
    const seen = new Set<string>();
    (blueprint?.sections || []).forEach((s) =>
      String(s.topic || "")
        .split(/[,;·]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => seen.add(t))
    );
    return Array.from(seen);
  }, [blueprint]);

  // Generated difficulty tallies vs the blueprint's plan → "Balance on target" is a REAL
  // check (every bucket within 1 question of plan), not decoration.
  const generatedBalance = useMemo(() => {
    const b = { easy: 0, medium: 0, hard: 0 };
    (job?.questions || []).forEach((q) => {
      const d = String(q._difficulty || "").toLowerCase();
      if (d.startsWith("easy")) b.easy++;
      else if (d.startsWith("med")) b.medium++;
      else if (d.startsWith("hard")) b.hard++;
    });
    return b;
  }, [job]);
  const balanceOnTarget =
    job?.status === "completed" &&
    (["easy", "medium", "hard"] as const).every(
      (k) => Math.abs(generatedBalance[k] - overallBalance[k]) <= 1
    );
  const mcqCount = (job?.questions || []).filter((q) => q._question_type !== "coding").length;
  const codingCount = (job?.questions || []).length - mcqCount;

  const handlePublish = async () => {
    if (!job?.generated_assessment_id) return;
    try {
      setPublishing(true);
      await publishAssessment(config.clientId, job.generated_assessment_id);
      showToast("Assessment published to learners", "success");
      router.push(`/admin/assessment/${job.generated_assessment_id}/edit`);
    } catch (e: unknown) {
      showToast((e as { message?: string })?.message || "Failed to publish", "error");
      setPublishing(false);
    }
  };

  const handleFineTune = () => {
    if (job?.generated_assessment_id) {
      router.push(`/admin/assessment/create?fromDraft=${job.generated_assessment_id}`);
    }
  };

  const isFailed = job?.status === "failed";
  const isDone = job?.status === "completed";
  const generating = job != null && !isComposerTerminal(job.status);

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "var(--canvas)", minHeight: "100%" }}>
        <AssessmentBreadcrumb segments={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Assessments", href: "/admin/assessment" }, { label: "Create with AI", href: "/admin/assessment/compose" }, { label: "Review draft" }]} />
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/admin/assessment/compose")}
          sx={{ mb: 2, color: "var(--ai-violet)", textTransform: "none" }}
        >
          Back to composer
        </Button>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 3 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background: "var(--gradient-ai)",
              boxShadow: "0 14px 28px -14px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
            }}
          >
            <IconWrapper icon="mdi:auto-fix" size={26} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", color: "var(--ai-violet)" }}>
              AI ASSESSMENT COMPOSER
            </Typography>
            <Typography sx={{ fontFamily: "var(--font-jakarta)", fontWeight: 800, fontSize: "1.6rem", color: "var(--font-primary)" }}>
              {isDone ? "Review your draft" : isFailed ? "Generation failed" : "Building your assessment"}
            </Typography>
          </Box>
        </Box>

        {loadError ? (
          <Box sx={{ p: 3, borderRadius: "var(--radius-card)", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
            <Typography color="error">{loadError}</Typography>
          </Box>
        ) : !job ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
            <CircularProgress sx={{ color: "var(--ai-violet)" }} />
          </Box>
        ) : isFailed ? (
          <Box sx={{ p: 3, borderRadius: "var(--radius-card)", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", maxWidth: 640 }}>
            <Typography sx={{ fontWeight: 700, mb: 1, color: "var(--error-500)" }}>
              We couldn&apos;t finish this assessment.
            </Typography>
            <Typography sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {composerErrorMessage(job) ||
                "The AI provider may be rate-limited or over quota. Please try again shortly."}
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/admin/assessment/compose")}
              sx={{ background: "var(--gradient-ai)", color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Try another brief
            </Button>
          </Box>
        ) : (
          <>
            {/* progress bar while generating */}
            {generating ? (
              <Box sx={{ mb: 3, p: 2.5, borderRadius: "var(--radius-card)", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <CircularProgress size={16} sx={{ color: "var(--ai-violet)" }} />
                  <Typography sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                    {STAGE_LABEL[job.status] || "Working…"}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ai-violet)" }}>
                    {job.progress_percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={job.progress_percentage}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: "var(--surface)",
                    "& .MuiLinearProgress-bar": { borderRadius: 999, background: "var(--gradient-ai)" },
                  }}
                />
              </Box>
            ) : null}

            {/* Summary bar (mockup): generated counts + real balance-on-target check */}
            {job.questions.length > 0 ? (
              <Box
                sx={{
                  mb: 2.5,
                  p: 2,
                  borderRadius: "var(--radius-card)",
                  bgcolor: "var(--card-bg)",
                  border: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                {([
                  { n: job.questions.length, label: "Generated", tone: "var(--ai-violet)" },
                  ...(mcqCount ? [{ n: mcqCount, label: "MCQ", tone: "var(--accent-indigo)" }] : []),
                  ...(codingCount ? [{ n: codingCount, label: "Coding", tone: "var(--accent-indigo)" }] : []),
                ]).map((s) => (
                  <Box key={s.label} sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.3rem", color: s.tone }}>
                      {s.n}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--font-secondary)" }}>{s.label}</Typography>
                  </Box>
                ))}
                <Box sx={{ flexGrow: 1 }} />
                {balanceOnTarget ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "var(--success-500)" }}>
                    <IconWrapper icon="mdi:check" size={17} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Balance on target</Typography>
                  </Box>
                ) : isDone ? (
                  <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                    Balance differs slightly from the blueprint
                  </Typography>
                ) : null}
              </Box>
            ) : null}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, gap: 2.5, alignItems: "start" }}>
              {/* AI Blueprint sidebar */}
              <Box sx={{ borderRadius: "var(--radius-card)", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
                <Box sx={{ p: 2, background: "var(--gradient-ai-soft)", borderBottom: "1px solid var(--border-default)" }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", color: "var(--ai-violet)" }}>
                    AI BLUEPRINT
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 0.25 }}>
                    {blueprint?.title || "…"}
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
                    {blueprint?.proctoring_enabled ? <StatusChip label="Proctored" tone="info" icon="mdi:shield-check-outline" /> : null}
                    {blueprint?.duration_minutes ? <StatusChip label={`${blueprint.duration_minutes} min`} tone="neutral" icon="mdi:clock-outline" /> : null}
                    {blueprint?.evaluation_mode === "auto" ? <StatusChip label="Auto-graded (AI)" tone="success" icon="mdi:auto-fix" /> : <StatusChip label="Manual grading" tone="warning" /> }
                    {/* Composer drafts are always fixed-form — same questions for everyone. */}
                    <StatusChip label="Non-adaptive · same for all" tone="ai" icon="mdi:target" />
                  </Box>

                  {blueprint?.sections?.length ? (
                    <>
                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--font-tertiary)", mb: 1 }}>
                        DIFFICULTY BALANCE
                      </Typography>
                      <DifficultyBalanceMeter balance={overallBalance} />

                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--font-tertiary)", mt: 2.5, mb: 1 }}>
                        SECTIONS
                      </Typography>
                      {blueprint.sections.map((s) => (
                        <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1, borderTop: "1px solid var(--border-default)" }}>
                          <Box sx={{ width: 30, height: 30, borderRadius: 1.5, display: "grid", placeItems: "center", color: "var(--ai-violet)", bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--card-bg) 88%)" }}>
                            <IconWrapper icon={s.type === "coding" ? "mdi:code-tags" : "mdi:help-circle-outline"} size={16} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--font-primary)" }}>{s.title}</Typography>
                            <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                              {s.type === "coding" ? "Coding" : "Quiz"} · {s.count} question{s.count === 1 ? "" : "s"}
                            </Typography>
                          </Box>
                        </Box>
                      ))}

                      {coverageTopics.length > 0 ? (
                        <>
                          <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--font-tertiary)", mt: 2.5, mb: 1 }}>
                            TOPIC COVERAGE
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {coverageTopics.map((tpc) => (
                              <Box key={tpc} sx={{ px: 1.25, py: 0.4, borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, color: "var(--font-secondary)", bgcolor: "var(--surface)", border: "1px solid var(--border-default)" }}>
                                {tpc}
                              </Box>
                            ))}
                          </Box>
                          {isDone && job.question_progress.total > 0 &&
                            job.question_progress.completed === job.question_progress.total ? (
                            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, display: "flex", gap: 1, alignItems: "flex-start", bgcolor: "color-mix(in srgb, var(--success-500) 10%, var(--card-bg) 90%)" }}>
                              <IconWrapper icon="mdi:check" size={15} color="var(--success-500)" />
                              <Typography variant="caption" sx={{ color: "var(--success-500)", fontWeight: 600, lineHeight: 1.4 }}>
                                Every planned batch generated — no gaps in the blueprint&apos;s coverage.
                              </Typography>
                            </Box>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>Designing the blueprint…</Typography>
                  )}
                </Box>
              </Box>

              {/* Generated questions */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 1.5, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                    Generated questions{" "}
                    <Box component="span" sx={{ fontFamily: "var(--font-mono)", color: "var(--ai-violet)" }}>
                      {job.questions.length}
                    </Box>
                  </Typography>
                  {generating ? (
                    <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                      appearing live as they&apos;re written…
                    </Typography>
                  ) : null}
                </Box>

                {job.questions.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center", borderRadius: "var(--radius-card)", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
                    <CircularProgress size={22} sx={{ color: "var(--ai-violet)", mb: 1 }} />
                    <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                      Questions will appear here as the AI writes them.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {(() => {
                      let qNo = 0;
                      return Object.entries(questionsBySection).flatMap(([ref, qs]) =>
                        qs.map((q, i) => {
                          qNo += 1;
                          const diff = String(q._difficulty || "").toLowerCase();
                          const qtext = String(q.question_text ?? q.title ?? "");
                          const topic = topicBySection[ref];
                          return (
                            <Box
                              key={`${q._section_ref}-${i}-${qtext.slice(0, 12)}`}
                              sx={{ p: 2, borderRadius: "var(--radius-card)", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, flexWrap: "wrap" }}>
                                <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.78rem", color: "var(--ai-violet)" }}>
                                  Q{qNo}
                                </Typography>
                                <StatusChip label={q._question_type === "coding" ? "Coding" : "MCQ"} tone="info" />
                                {diff ? <StatusChip label={diff[0].toUpperCase() + diff.slice(1)} tone={DIFF_TONE[diff] || "neutral"} /> : null}
                                {topic ? <StatusChip label={topic.length > 34 ? topic.slice(0, 34) + "…" : topic} tone="neutral" /> : null}
                              </Box>
                              <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", lineHeight: 1.4 }}>
                                {qtext.length > 220 ? qtext.slice(0, 220) + "…" : qtext}
                              </Typography>
                            </Box>
                          );
                        })
                      );
                    })()}
                  </Box>
                )}
              </Box>
            </Box>

            {/* sticky action bar (only when done) */}
            {isDone ? (
              <Box
                sx={{
                  position: "sticky",
                  bottom: 16,
                  mt: 3,
                  display: "flex",
                  gap: 1.5,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  p: 1.5,
                  borderRadius: "var(--radius-card)",
                  bgcolor: "var(--card-bg)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 12px 32px -18px color-mix(in srgb, var(--font-primary) 45%, transparent)",
                }}
              >
                <Button onClick={() => router.push("/admin/assessment/compose")} sx={{ textTransform: "none", color: "var(--font-secondary)" }}>
                  Edit brief
                </Button>
                <Button
                  onClick={handleFineTune}
                  startIcon={<IconWrapper icon="mdi:tune-variant" size={18} />}
                  sx={{ textTransform: "none", fontWeight: 600, color: "var(--ai-violet)", border: "1px solid color-mix(in srgb, var(--ai-violet) 40%, var(--border-default) 60%)", borderRadius: 2, px: 2 }}
                >
                  Fine-tune in builder
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  startIcon={publishing ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <IconWrapper icon="mdi:check" size={18} />}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#fff", background: "var(--gradient-ai)", borderRadius: 2, px: 3, "&:hover": { filter: "brightness(1.05)" } }}
                >
                  {publishing ? "Publishing…" : "Publish assessment"}
                </Button>
              </Box>
            ) : null}
          </>
        )}
      </Box>
    </MainLayout>
  );
}
