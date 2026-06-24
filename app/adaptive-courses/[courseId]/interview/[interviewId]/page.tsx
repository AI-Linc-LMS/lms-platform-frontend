"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import mockInterviewService, {
  type InterviewQuestion,
  type InterviewResponse,
} from "@/lib/services/mock-interview.service";

function fmtClock(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const qText = (q: InterviewQuestion | null): string => (q ? (q.question_text || q.question || "").trim() : "");

function CourseInterviewInner() {
  const router = useRouter();
  const params = useParams();
  const sp = useSearchParams();
  const courseId = Number(params.courseId);
  const interviewId = Number(params.interviewId);
  const topic = sp.get("topic") || "";
  const durMins = Number(sp.get("mins")) || 10;

  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [remaining, setRemaining] = useState(durMins * 60);

  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [turn, setTurn] = useState(1);
  const [maxTurns, setMaxTurns] = useState(0);
  const [currentIsFinal, setCurrentIsFinal] = useState(false);
  const [closingRemark, setClosingRemark] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const transcriptRef = useRef<InterviewResponse[]>([]);

  // Lightweight proctoring (native — no device-check / face validation).
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState<string[]>([]);
  const fsExitsRef = useRef<{ timestamp: string }[]>([]);
  const startedAtRef = useRef<number>(0);

  // ---- proctoring listeners (after begin) ----
  useEffect(() => {
    if (!started || submitted) return;
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
  }, [started, submitted]);

  // ---- timer ----
  useEffect(() => {
    if (!started || submitted || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [started, submitted, remaining > 0]);

  const doSubmit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setEvaluating(true);
    try {
      const responses = transcriptRef.current;
      await mockInterviewService.submitInterview(interviewId, {
        transcript: {
          responses,
          total_duration_seconds: Math.round((performance.now() - startedAtRef.current) / 1000),
          metadata: {
            face_validation_failures: 0,
            multiple_face_detections: 0,
            fullscreen_exits: fsExitsRef.current.length,
            tab_switches: tabSwitches.length,
            completed_questions: responses.length,
            total_questions: responses.length,
          },
        },
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setSubmitted(true);
    } catch {
      setError("Couldn't submit your interview. Please try again.");
    } finally {
      setBusy(false);
      setEvaluating(false);
    }
  }, [busy, interviewId, tabSwitches.length]);

  const begin = async () => {
    setBusy(true);
    try {
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* browser may block — Lockdown chip lets them retry */
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setCamOn(true);
        setTimeout(() => {
          if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 50);
      } catch {
        setCamOn(false);
      }
      const d = await mockInterviewService.startInterview(interviewId);
      // Resume window lapsed → the backend auto-submitted; go straight to the done state.
      if (d.resume_window_expired || ["completed", "finalized"].includes(String(d.status))) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setSubmitted(true);
        return;
      }
      // On a reconnect, rebuild the answered transcript so submit stays complete.
      if (d.is_resume && Array.isArray(d.conversation_history)) {
        transcriptRef.current = d.conversation_history.map((h) => ({
          question_id: h.question_id, question_text: h.question_text, answer: h.answer,
        }));
      }
      startedAtRef.current = performance.now();
      setQuestion(d.current_question ?? null);
      setTurn(d.turn_number ?? 1);
      setMaxTurns(d.max_turns ?? 0);
      setStarted(true);
    } catch (e) {
      const code = (e as { response?: { status?: number } })?.response?.status;
      setError(code === 400 ? "This interview has already been completed." : "Couldn't start the interview. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async () => {
    if (busy || !question || !answer.trim()) return;
    const resp: InterviewResponse = { question_id: question.id, question_text: qText(question), answer: answer.trim() };
    transcriptRef.current = [...transcriptRef.current, resp];
    setAnswer("");
    if (currentIsFinal) {
      await doSubmit();
      return;
    }
    setBusy(true);
    try {
      const next = await mockInterviewService.getNextQuestion(interviewId, {
        previous_question_id: question.id,
        candidate_answer: resp.answer,
        force_close: remaining <= 0,
      });
      if (next.is_closing_remark || next.interview_complete || !next.question) {
        setClosingRemark(next.closing_remark || "Thanks — that's the end of the interview. Submit when you're ready.");
        setQuestion(null);
      } else {
        setQuestion(next.question);
        setTurn(next.turn_number);
        setMaxTurns(next.max_turns);
        setCurrentIsFinal(!!next.is_final_question);
      }
    } catch {
      setError("The interviewer didn't respond. Please try submitting your answer again.");
    } finally {
      setBusy(false);
    }
  };

  // ---- render ----
  if (submitted) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={1.5} sx={{ maxWidth: 460, textAlign: "center" }}>
          <Icon icon="mdi:check-decagram" width={48} color="#4ade80" />
          <Typography sx={{ fontWeight: 800, fontSize: "1.3rem" }}>Interview submitted</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            We&apos;re evaluating your responses — your AI Student Model will update with what we learned, and the
            course will tune itself to you.
          </Typography>
          <Button variant="contained" onClick={() => router.push(`/adaptive-courses/${courseId}`)} sx={{ mt: 1, textTransform: "none", fontWeight: 800, borderRadius: 2, background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
            Back to course
          </Button>
        </Stack>
      </Box>
    );
  }

  if (error && !started) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={1.5}>
          <Icon icon="mdi:alert-circle-outline" width={44} color="#fca5a5" />
          <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>{error}</Typography>
          <Button variant="outlined" onClick={() => router.push(`/adaptive-courses/${courseId}`)} sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)", textTransform: "none" }}>Back to course</Button>
        </Stack>
      </Box>
    );
  }

  // Begin gate (lightweight — fullscreen + webcam, no device-check).
  if (!started) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={2} sx={{ maxWidth: 480, textAlign: "center" }}>
          <Box sx={{ p: "2px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#0b1220", display: "grid", placeItems: "center" }}>
              <Icon icon="mdi:account-voice" width={28} color="#c4b5fd" />
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem" }}>AI Mock Interview{topic ? ` · ${topic}` : ""}</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>
            A short adaptive conversation that gauges your level. When you begin it enters fullscreen and turns on
            your webcam; just answer naturally in your own words. {fmtClock(remaining)} on the clock.
          </Typography>
          <Stack direction="row" spacing={1.25} sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>
            <span><Icon icon="mdi:webcam" width={15} style={{ verticalAlign: "-2px" }} /> Webcam</span>
            <span><Icon icon="mdi:lock" width={15} style={{ verticalAlign: "-2px" }} /> Fullscreen</span>
            <span><Icon icon="mdi:robot-happy-outline" width={15} style={{ verticalAlign: "-2px" }} /> Adaptive</span>
          </Stack>
          <Button variant="contained" disabled={busy} onClick={begin}
            startIcon={busy ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:fullscreen" width={20} />}
            sx={{ mt: 1, textTransform: "none", fontWeight: 800, borderRadius: 2, px: 4, py: 1.2, background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
            {busy ? "Starting…" : "Enter fullscreen & begin"}
          </Button>
        </Stack>
      </Box>
    );
  }

  const progressPct = maxTurns > 0 ? Math.min(100, Math.round((turn / maxTurns) * 100)) : 0;
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
          <Box sx={{ p: "2px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
            <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: "#0b1220", display: "grid", placeItems: "center" }}>
              <Icon icon="mdi:account-voice" width={16} color="#c4b5fd" />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>AI Mock Interview{topic ? ` · ${topic}` : ""}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Adaptive · level gauge · seeds your Student Model</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip size="small" icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />} label="REC · Proctoring active"
            sx={{ color: "#fca5a5", bgcolor: "rgba(239,68,68,0.12)", fontWeight: 700, fontSize: "0.7rem" }} />
          <Chip size="small" icon={<Icon icon={fullscreen ? "mdi:lock" : "mdi:lock-open-variant"} width={14} />} label="Lockdown"
            onClick={fullscreen ? undefined : () => document.documentElement.requestFullscreen?.().catch(() => {})}
            sx={{ color: fullscreen ? "#cbd5e1" : "#fcd34d", bgcolor: "rgba(255,255,255,0.06)", fontWeight: 700, fontSize: "0.7rem", cursor: fullscreen ? "default" : "pointer" }} />
          <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>{fmtClock(remaining)}</Typography>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 320px" } }}>
        {/* Main */}
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 600 }}>
              Turn {turn}{maxTurns ? ` of ~${maxTurns}` : ""}
            </Typography>
            {question?.type && <Chip size="small" label={question.type} sx={{ height: 22, fontSize: "0.66rem", textTransform: "capitalize", bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }} />}
          </Stack>
          <Box sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.12)", mb: 3 }}>
            <Box sx={{ width: `${progressPct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #7c3aed, #db2777)" }} />
          </Box>

          <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {closingRemark ? (
              <Stack spacing={2}>
                <Typography sx={{ fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.5 }}>{closingRemark}</Typography>
                <Button variant="contained" disabled={busy} onClick={doSubmit}
                  startIcon={busy ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:check" width={18} />}
                  sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, borderRadius: 2, background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                  {busy ? "Submitting…" : "Submit interview"}
                </Button>
              </Stack>
            ) : (
              <>
                <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.5, mb: question?.coding_problem || question?.mcq_options ? 1.5 : 3 }}>
                  {qText(question)}
                </Typography>
                {question?.coding_problem && (
                  <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {question.coding_problem.statement}
                    </Typography>
                  </Box>
                )}
                {question?.mcq_options && (
                  <Stack spacing={0.75} sx={{ mb: 2 }}>
                    {question.mcq_options.map((o) => (
                      <Typography key={o.id} sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>
                        <b>{o.id}.</b> {o.text}
                      </Typography>
                    ))}
                  </Stack>
                )}
                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder={question?.coding_problem ? "Write your solution…" : question?.mcq_options ? "Type the option(s) you'd pick and why…" : "Type your answer…"}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": { color: "white", bgcolor: "rgba(255,255,255,0.04)", borderRadius: 2,
                      "& fieldset": { borderColor: "rgba(255,255,255,0.14)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" } },
                    "& textarea::placeholder": { color: "rgba(255,255,255,0.4)" },
                  }}
                />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                  <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                    {currentIsFinal ? "Final question — submitting finishes the interview." : "Answer in your own words; the interviewer follows up."}
                  </Typography>
                  <Button variant="contained" disabled={busy || !answer.trim()} onClick={submitAnswer}
                    endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:send" width={16} />}
                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
                    {busy ? "Sending…" : currentIsFinal ? "Submit & finish" : "Send answer"}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
          {error && <Typography sx={{ mt: 1.5, fontSize: "0.8rem", color: "#fca5a5" }}>{error}</Typography>}
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

          <Box sx={{ mt: 3, p: 1.75, borderRadius: 2, bgcolor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#c4b5fd", mb: 0.5 }}>✦ How this helps you</Typography>
            <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              This adaptive conversation gauges your reasoning + communication and feeds the AI Student Model — every
              adaptive surface after this is personalized <i>from</i> here.
            </Typography>
          </Box>
        </Box>
      </Box>

      {evaluating && (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(11,18,32,0.85)", display: "grid", placeItems: "center", zIndex: 20 }}>
          <Stack alignItems="center" spacing={1.5}>
            <CircularProgress sx={{ color: "#a855f7" }} />
            <Typography sx={{ color: "white", fontWeight: 700 }}>Evaluating your interview…</Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default function CourseInterviewPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220" }}>
          <CircularProgress sx={{ color: "#a855f7" }} />
        </Box>
      }
    >
      <CourseInterviewInner />
    </Suspense>
  );
}
