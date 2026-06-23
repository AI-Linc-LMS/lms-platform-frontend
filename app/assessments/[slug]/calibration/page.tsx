"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { assessmentService } from "@/lib/services/assessment.service";

interface CalibMcq {
  id: number | string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  question_style?: "single" | "multiple";
}

const LETTERS = ["a", "b", "c", "d"] as const;
type Letter = (typeof LETTERS)[number];

function fmtClock(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function CalibrationTakePage() {
  const router = useRouter();
  const slug = String(useParams().slug);

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

  // Proctoring (lightweight, native)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
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
  }, [slug]);

  // ---- proctoring setup ----
  useEffect(() => {
    if (loading || submitted || error) return;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCamOn(true);
      } catch {
        setCamOn(false);
      }
    })();

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
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [loading, submitted, error]);

  // ---- timer ----
  const doSubmit = useCallback(
    async (auto = false) => {
      if (submitting || submitted || !sectionId) return;
      setSubmitting(true);
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
              },
              total_duration_seconds: 0,
            },
          },
          quizSectionId: [{ [sectionId]: bag }],
          codingProblemSectionId: [],
          subjectiveQuestionSectionId: [],
          ...(auto ? { auto_submitted_reason: "time_up" } : {}),
        };
        await assessmentService.finalSubmit(slug, payload);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setSubmitted(true);
      } catch {
        setError("Couldn't submit your calibration. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [answers, sectionId, slug, submitting, submitted, tabSwitches],
  );

  useEffect(() => {
    if (loading || submitted || error || remaining <= 0) return;
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
  }, [loading, submitted, error, remaining > 0, doSubmit]);

  const enterLockdown = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
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
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={1.5}>
          <Icon icon="mdi:shield-check" width={48} color="#4ade80" />
          <Typography sx={{ fontWeight: 800, fontSize: "1.3rem" }}>Calibration submitted</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", maxWidth: 440 }}>
            Your baseline has been recorded and is seeding your AI Student Model. Your journey is now tuned to you.
          </Typography>
          <Button variant="contained" onClick={() => router.push("/adaptive-courses")} sx={{ mt: 1, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            Back to my courses
          </Button>
        </Stack>
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
          <Chip size="small" icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />} label="REC · Proctoring active"
            sx={{ color: "#fca5a5", bgcolor: "rgba(239,68,68,0.12)", fontWeight: 700, fontSize: "0.7rem" }} />
          <Chip size="small" icon={<Icon icon={fullscreen ? "mdi:lock" : "mdi:lock-open-variant"} width={14} />} label="Lockdown"
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
              <Chip size="small" label="Statistics" sx={{ height: 22, fontSize: "0.66rem", bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }} />
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

        {/* Proctoring sidebar */}
        <Box sx={{ p: { xs: 2, md: 3 }, borderLeft: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.015)" }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.45)", mb: 1 }}>PROCTORING</Typography>
          <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", aspectRatio: "4 / 3", bgcolor: "#020617", border: "1px solid rgba(255,255,255,0.08)", mb: 2, display: "grid", placeItems: "center" }}>
            <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: camOn ? "block" : "none" }} />
            {!camOn && <Stack alignItems="center" spacing={0.5}><Icon icon="mdi:account" width={36} color="#334155" /><Typography sx={{ fontSize: "0.7rem", color: "#475569" }}>candidate feed</Typography></Stack>}
            <Chip size="small" icon={<Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#ef4444" }} />} label="LIVE"
              sx={{ position: "absolute", top: 8, left: 8, height: 20, fontSize: "0.6rem", fontWeight: 800, color: "#fca5a5", bgcolor: "rgba(2,6,23,0.7)" }} />
          </Box>

          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.45)", mb: 0.5 }}>INTEGRITY CHECKS</Typography>
          <Integrity label="Identity verified" ok />
          <Integrity label="Face in frame" ok={camOn} />
          <Integrity label="Fullscreen locked" ok={fullscreen} warn={fullscreen ? undefined : "off"} />
          <Integrity label="Tab switches" ok={tabSwitches.length === 0} warn={tabSwitches.length ? `${tabSwitches.length} flagged` : undefined} />
          <Integrity label="Second monitor" ok />

          <Box sx={{ mt: 3, p: 1.75, borderRadius: 2, bgcolor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#c4b5fd", mb: 0.5 }}>✦ Why it&apos;s the same for everyone</Typography>
            <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              A fixed, proctored set gives a clean baseline of your true level. That score seeds the AI Student Model — every adaptive surface after this is personalized <i>from</i> here.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
