"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { assessmentService } from "@/lib/services/assessment.service";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import { notifyContentCompleted } from "@/lib/streak/streakCelebration";
import type { CalibrationResult } from "@/lib/types/adaptive-journey";

interface CalibMcq {
  id: number | string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  question_style?: "single" | "multiple";
  topic?: string;
}

const LETTERS = ["a", "b", "c", "d"] as const;
type Letter = (typeof LETTERS)[number];

function fmtClock(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const CARD_SX = {
  p: { xs: 2, md: 2.5 }, borderRadius: 3,
  bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
} as const;
const TIER_COLOR: Record<string, string> = { beginner: "#fbbf24", intermediate: "#60a5fa", advanced: "#4ade80" };

function CalibrationTakeInner() {
  const router = useRouter();
  const slug = String(useParams().slug);
  const courseIdParam = useSearchParams().get("courseId");
  const courseId = courseIdParam ? Number(courseIdParam) : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Calibration Assessment");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [mcqs, setMcqs] = useState<CalibMcq[]>([]);
  const [answers, setAnswers] = useState<Record<string, Letter>>({});
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  // Fetch the "what we learned about you" profile. Evaluation runs on submit, so we poll a few
  // times right after; on a later revisit (already submitted) it's usually ready on the first try.
  const loadResult = useCallback(async () => {
    if (!courseId) return;
    setResultLoading(true);
    for (let i = 0; i < 4; i++) {
      try {
        const r = await adaptiveJourneyService.getCalibrationResult(courseId);
        if (r.done && r.insight) { setResult(r); break; }
      } catch { /* retry */ }
      await new Promise((res) => setTimeout(res, 1500));
    }
    setResultLoading(false);
  }, [courseId]);

  // Per-question solve time (seconds), captured for the calibration evaluation.
  const enteredAtRef = useRef<number>(0);
  const timesRef = useRef<Record<string, number>>({});
  const prevIdxRef = useRef<number>(0);

  const flushTime = useCallback(
    (leavingIdx: number) => {
      const qid = mcqs[leavingIdx]?.id;
      if (qid != null && enteredAtRef.current) {
        const key = String(qid);
        timesRef.current[key] = (timesRef.current[key] || 0) + (performance.now() - enteredAtRef.current) / 1000;
      }
      enteredAtRef.current = performance.now();
    },
    [mcqs],
  );

  // Self-proctored: we monitor only fullscreen + tab-switching (no webcam).
  const [fullscreen, setFullscreen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState<string[]>([]);
  const fsExitsRef = useRef<{ timestamp: string }[]>([]);
  const startedAtRef = useRef<string>(new Date().toISOString());

  // ---- load ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await assessmentService.startAssessment(slug)) as unknown as Record<string, any>;
        if (cancelled) return;
        if (data.status === "submitted" || data.status === "finalized") {
          setSubmitted(true);
          setLoading(false);
          void loadResult();
          return;
        }
        const section = (data.quizSection || [])[0];
        const list: CalibMcq[] = section?.mcqs || [];
        setTitle(data.title || "Calibration Assessment");
        setSectionId(section ? String(section.id) : null);
        setMcqs(list);
        setRemaining((Number(data.remaining_time) || Number(data.duration_minutes) || 45) * 60);
        // hydrate any saved answers
        const saved = data.responseSheet?.quizSectionId?.[0];
        if (saved && section) {
          const bag = saved[String(section.id)] || {};
          const restored: Record<string, Letter> = {};
          Object.entries(bag).forEach(([qid, val]) => {
            if (typeof val === "string" && (LETTERS as readonly string[]).includes(val)) restored[qid] = val as Letter;
          });
          setAnswers(restored);
        }
      } catch (e) {
        const code = (e as { response?: { status?: number } })?.response?.status;
        setError(code === 409 ? "You have already completed calibration." : "Couldn't start the calibration assessment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, loadResult]);

  // ---- integrity setup (self-proctored: fullscreen + tab only) ----
  useEffect(() => {
    if (loading || submitted || error) return;
    const onVis = () => {
      if (document.hidden) setTabSwitches((t) => [...t, new Date().toISOString()]);
    };
    const onFs = () => {
      const on = !!document.fullscreenElement;
      setFullscreen(on);
      if (!on) fsExitsRef.current.push({ timestamp: new Date().toISOString() });
    };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [loading, submitted, error]);

  // Start the clock on the first question + accrue time to the question we leave.
  useEffect(() => {
    if (!mcqs.length) return;
    flushTime(prevIdxRef.current);
    prevIdxRef.current = idx;
  }, [idx, mcqs.length, flushTime]);

  // ---- timer ----
  const doSubmit = useCallback(
    async (auto = false) => {
      if (submitting || submitted || !sectionId) return;
      setSubmitting(true);
      flushTime(idx); // accrue time spent on the question being submitted from
      const questionTimes: Record<string, number> = {};
      Object.entries(timesRef.current).forEach(([k, v]) => { questionTimes[k] = Math.round(v); });
      try {
        const bag: Record<string, unknown> = { ...answers, section_completely_attempted: true };
        const payload = {
          metadata: {
            transcript: {
              logs: [],
              metadata: {
                proctoring: {
                  face_violations: [],
                  tab_switches: tabSwitches.map((ts) => ({ timestamp: ts })),
                  fullscreen_exits: fsExitsRef.current,
                  total_violation_count: tabSwitches.length + fsExitsRef.current.length,
                  violation_threshold_reached: false,
                  violation_screenshot_samples: [],
                },
                timing: {
                  started_at: startedAtRef.current,
                  submitted_at: new Date().toISOString(),
                },
                calibration: { question_times: questionTimes },
              },
              total_duration_seconds: Object.values(questionTimes).reduce((a, b) => a + b, 0),
            },
          },
          quizSectionId: [{ [sectionId]: bag }],
          codingProblemSectionId: [],
          subjectiveQuestionSectionId: [],
          ...(auto ? { auto_submitted_reason: "time_up" } : {}),
        };
        await assessmentService.finalSubmit(slug, payload);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setSubmitted(true);
        notifyContentCompleted(); // counts toward the daily streak

        // Fetch the "what we learned about you" profile (evaluation runs on submit).
        await loadResult();
      } catch {
        setError("Couldn't submit your calibration. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [answers, loadResult, flushTime, idx, sectionId, slug, submitting, submitted, tabSwitches],
  );

  useEffect(() => {
    if (loading || submitted || error || !started || remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          void doSubmit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, submitted, error, started, remaining > 0, doSubmit]);

  const enterLockdown = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Begin: a single user gesture lets us enter fullscreen (browsers block it on
  // navigation), so the test starts in full screen by default.
  const begin = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* user can re-enter via the "Go full screen" chip if the browser blocked it */
    }
    enteredAtRef.current = performance.now();
    prevIdxRef.current = 0;
    setStarted(true);
  };

  // ---- render states ----
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220" }}>
        <CircularProgress sx={{ color: "#60a5fa" }} />
      </Box>
    );
  }
  if (submitted) {
    const ins = result?.insight;
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0b1220", color: "white", py: { xs: 3, md: 6 }, px: 2, display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: 680 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Icon icon="mdi:shield-check" width={44} color="#4ade80" />
            <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", textAlign: "center" }}>
              {ins ? ins.headline : "Calibration submitted"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", textAlign: "center" }}>
              We don&apos;t show right or wrong answers — this is what we learned about you.
            </Typography>
          </Stack>

          {resultLoading && !ins && (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
              <CircularProgress size={26} sx={{ color: "#60a5fa" }} />
              <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>Analyzing how you reason…</Typography>
            </Stack>
          )}

          {ins && (
            <Stack spacing={2}>
              <Box sx={CARD_SX}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 700 }}>Your starting level</Typography>
                  <Chip label={ins.level_label} sx={{ fontWeight: 800, color: "#0b1220", bgcolor: TIER_COLOR[ins.field_tier] ?? "#60a5fa" }} />
                </Stack>
                <Box sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.08)" }}>
                  <Box sx={{ width: `${Math.round(ins.ability_index)}%`, height: "100%", borderRadius: 4, bgcolor: TIER_COLOR[ins.field_tier] ?? "#60a5fa" }} />
                </Box>
                <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>{ins.summary}</Typography>
              </Box>

              {ins.pace?.label && (
                <Box sx={CARD_SX}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Icon icon="mdi:speedometer" width={18} color="#a5b4fc" />
                    <Typography sx={{ fontWeight: 700 }}>Your pace: {ins.pace.label}</Typography>
                  </Stack>
                  <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
                    {ins.pace.note}{ins.pace.style ? ` ${ins.pace.style}` : ""}
                  </Typography>
                </Box>
              )}

              <Box sx={{ ...CARD_SX, bgcolor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <Typography sx={{ fontWeight: 800, color: "#c4b5fd", mb: 1 }}>✦ How AI Linc will adapt to you</Typography>
                <Stack spacing={1}>
                  {ins.how_ai_helps.map((h, i) => (
                    <Stack key={i} direction="row" spacing={1}>
                      <Icon icon="mdi:arrow-right-thin" width={18} color="#c4b5fd" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem" }}>{h}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}

          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => router.push(courseId ? `/adaptive-courses/${courseId}` : "/adaptive-courses")}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 4, py: 1.1, bgcolor: "#fff", color: "#0b1220", "&:hover": { bgcolor: "#f1f5f9" } }}>
              {ins ? "Start my personalized journey →" : "Back to my courses"}
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={1.5}>
          <Icon icon="mdi:alert-circle-outline" width={44} color="#fca5a5" />
          <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>{error}</Typography>
          <Button variant="outlined" onClick={() => router.back()} sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)", textTransform: "none" }}>Go back</Button>
        </Stack>
      </Box>
    );
  }

  const q = mcqs[idx];
  const total = mcqs.length;
  const fieldName = title.replace(/\s*[—-]\s*Calibration.*$/i, "").trim();

  // Fullscreen gate — one click enters fullscreen so the test starts self-proctored.
  if (!started) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={2} sx={{ maxWidth: 460, textAlign: "center" }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.08)" }}>
            <Icon icon="mdi:shield-lock" width={28} color="#a5b4fc" />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem" }}>
            Calibration Assessment{fieldName ? ` · ${fieldName}` : ""}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            This is a self-proctored assessment. When you begin, it goes full screen and your
            fullscreen and tab-switching are monitored. {total} questions · {fmtClock(remaining)} on the clock.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>
            <Icon icon="mdi:fullscreen" width={16} /> <span>Go full screen</span>
            <Icon icon="mdi:eye-outline" width={16} /> <span>Tab monitoring</span>
          </Stack>
          <Button variant="contained" onClick={begin}
            startIcon={<Icon icon="mdi:fullscreen" width={20} />}
            sx={{ mt: 1, textTransform: "none", fontWeight: 800, borderRadius: 2, px: 4, py: 1.2, bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}>
            Enter fullscreen & begin
          </Button>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
            Exiting fullscreen during the test is logged for integrity.
          </Typography>
        </Stack>
      </Box>
    );
  }

  const Integrity = ({ label, ok, warn }: { label: string; ok?: boolean; warn?: string }) => (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: warn ? "#fbbf24" : ok ? "#4ade80" : "#94a3b8" }}>
        {warn ? `⚠ ${warn}` : ok ? "✓ Clear" : "—"}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0b1220", color: "white" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 1.75, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.08)" }}>
            <Icon icon="mdi:shield-half-full" width={18} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Calibration Assessment{fieldName ? ` · ${fieldName}` : ""}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Standardized · Non-adaptive · Same set for all learners</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip size="small" icon={<Icon icon="mdi:shield-account" width={14} />} label="Self-proctored"
            sx={{ color: "#93c5fd", bgcolor: "rgba(59,130,246,0.12)", fontWeight: 700, fontSize: "0.7rem" }} />
          <Chip size="small" icon={<Icon icon="mdi:fullscreen" width={14} />} label={fullscreen ? "Full screen" : "Go full screen"}
            onClick={fullscreen ? undefined : enterLockdown}
            sx={{ color: fullscreen ? "#cbd5e1" : "#fcd34d", bgcolor: "rgba(255,255,255,0.06)", fontWeight: 700, fontSize: "0.7rem", cursor: fullscreen ? "default" : "pointer" }} />
          <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>{fmtClock(remaining)}</Typography>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 320px" }, gap: 0 }}>
        {/* Main */}
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 600 }}>Question {idx + 1} of {total}</Typography>
            <Stack direction="row" spacing={1}>
              {q?.topic && <Chip size="small" label={q.topic} sx={{ height: 22, fontSize: "0.66rem", bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }} />}
              <Chip size="small" label={q?.question_style === "multiple" ? "Multiple choice" : "Single choice"} sx={{ height: 22, fontSize: "0.66rem", bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }} />
            </Stack>
          </Stack>

          {/* progress segments */}
          <Stack direction="row" spacing={0.5} sx={{ mb: 3, flexWrap: "wrap", gap: 0.5 }}>
            {mcqs.map((m, i) => (
              <Box key={m.id} onClick={() => setIdx(i)} sx={{
                height: 5, flex: "1 1 14px", minWidth: 14, borderRadius: 3, cursor: "pointer",
                bgcolor: i === idx ? "#fff" : answers[String(m.id)] ? "#3b82f6" : "rgba(255,255,255,0.14)",
              }} />
            ))}
          </Stack>

          <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.4, mb: 3 }}>{q?.question_text}</Typography>
            <Stack spacing={1.5}>
              {LETTERS.map((L) => {
                const text = q?.[(`option_${L}`) as keyof CalibMcq] as string;
                if (!text) return null;
                const selected = answers[String(q.id)] === L;
                return (
                  <Box key={L} onClick={() => setAnswers((a) => ({ ...a, [String(q.id)]: L }))}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5, p: 1.75, borderRadius: 2, cursor: "pointer",
                      border: "1px solid", borderColor: selected ? "#3b82f6" : "rgba(255,255,255,0.1)",
                      bgcolor: selected ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.02)",
                      transition: "border-color .15s, background .15s",
                      "&:hover": { borderColor: selected ? "#3b82f6" : "rgba(255,255,255,0.25)" },
                    }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: 1.25, display: "grid", placeItems: "center", flexShrink: 0,
                      bgcolor: selected ? "#60a5fa" : "rgba(255,255,255,0.06)", color: selected ? "#0b1220" : "rgba(255,255,255,0.8)", fontWeight: 800, fontSize: "0.85rem" }}>
                      {L.toUpperCase()}
                    </Box>
                    <Typography sx={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.92)" }}>{text}</Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
            <Button disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}
              sx={{ color: "rgba(255,255,255,0.8)", textTransform: "none", fontWeight: 700, "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" } }}
              startIcon={<Icon icon="mdi:arrow-left" width={16} />}>Previous</Button>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Answers lock on submit · no going back after question {total}</Typography>
            {idx < total - 1 ? (
              <Button variant="contained" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}
                endIcon={<Icon icon="mdi:arrow-right" width={16} />}>Next question</Button>
            ) : (
              <Button variant="contained" disabled={submitting} onClick={() => doSubmit(false)}
                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
                endIcon={submitting ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:check" width={16} />}>
                {submitting ? "Submitting…" : "Submit calibration"}
              </Button>
            )}
          </Stack>
        </Box>

        {/* Integrity sidebar (self-proctored) */}
        <Box sx={{ p: { xs: 2, md: 3 }, borderLeft: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.015)" }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.45)", mb: 0.5 }}>INTEGRITY CHECKS</Typography>
          <Integrity label="Fullscreen" ok={fullscreen} warn={fullscreen ? undefined : "off"} />
          <Integrity label="Tab switches" ok={tabSwitches.length === 0} warn={tabSwitches.length ? `${tabSwitches.length} flagged` : undefined} />

          <Box sx={{ mt: 3, p: 1.75, borderRadius: 2, bgcolor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#c4b5fd", mb: 0.5 }}>✦ Why it&apos;s the same for everyone</Typography>
            <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              A fixed, standardized set gives a clean baseline of your true level. That score seeds the AI Student Model — every adaptive surface after this is personalized <i>from</i> here.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function CalibrationTakePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220" }}>
          <CircularProgress sx={{ color: "#60a5fa" }} />
        </Box>
      }
    >
      <CalibrationTakeInner />
    </Suspense>
  );
}
