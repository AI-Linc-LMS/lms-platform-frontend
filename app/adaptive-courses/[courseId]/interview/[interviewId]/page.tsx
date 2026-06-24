"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import mockInterviewService, {
  type InterviewQuestion,
  type InterviewResponse,
} from "@/lib/services/mock-interview.service";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { InterviewResult } from "@/lib/types/adaptive-journey";
import { useInterviewerVoice } from "@/lib/hooks/useInterviewerVoice";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";

const TIER_COLOR: Record<string, string> = { beginner: "#fbbf24", intermediate: "#60a5fa", advanced: "#4ade80" };

const Orb = dynamic(() => import("@/components/adaptive-journey/Orb"), { ssr: false });

const qText = (q: InterviewQuestion | null): string => (q ? (q.question_text || q.question || "").trim() : "");
const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}`;

type Bubble = { role: "ai" | "student"; text: string };
const RUBRIC = ["Correctness", "Depth of reasoning", "Communication", "Structure (STAR)"];

// Static gradient badge for the small spots (avoids spinning up many WebGL Orb contexts).
function SparkBadge({ size = 30 }: { size?: number }) {
  return (
    <Box sx={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
      <Icon icon="mdi:star-four-points" width={Math.round(size * 0.5)} color="white" />
    </Box>
  );
}

function CourseInterviewInner() {
  const router = useRouter();
  const params = useParams();
  const sp = useSearchParams();
  const courseId = Number(params.courseId);
  const interviewId = Number(params.interviewId);
  const topic = sp.get("topic") || "";
  const difficulty = sp.get("difficulty") || "Intermediate";

  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [turn, setTurn] = useState(1);
  const [maxTurns, setMaxTurns] = useState(0);
  const [currentIsFinal, setCurrentIsFinal] = useState(false);
  const [closingRemark, setClosingRemark] = useState<string | null>(null);

  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [speakText, setSpeakText] = useState<string>("");
  const [transcript, setTranscript] = useState<Bubble[]>([]);
  const [answer, setAnswer] = useState("");
  const [typing, setTyping] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const respRef = useRef<InterviewResponse[]>([]);
  const startedAtRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const micLevelRef = useRef(0);

  // ---- voice: AI speaks the question ----
  const { audioActive } = useInterviewerVoice({
    question: aiSpeaking ? speakText : undefined,
    isSpeaking: aiSpeaking,
    onSpeakComplete: () => setAiSpeaking(false),
  });

  // ---- voice: student answers (browser STT + Whisper fallback) ----
  // Drive the orb off STT activity (interim/final bumps) instead of a second mic stream,
  // which could race the STT engine for the microphone.
  const stt = useSpeechToText({
    onInterim: () => { micLevelRef.current = 1; },
    onFinal: (t) => {
      micLevelRef.current = 1;
      setAnswer((a) => (a ? `${a} ${t}` : t).replace(/\s+/g, " "));
    },
    continuous: true,
    lang: "en-US",
    preferWhisper: true,
  });

  // Decay the orb's "speaking" level each frame; STT bumps it back to 1 while you talk.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      micLevelRef.current *= 0.9;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // timer (elapsed)
  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  // autoscroll transcript
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, answer]);

  const askQuestion = useCallback((q: InterviewQuestion | null) => {
    const text = qText(q);
    if (!text) return;
    setTranscript((tr) => [...tr, { role: "ai", text }]);
    setSpeakText(text);
    setAiSpeaking(true);
  }, []);

  const begin = async () => {
    setBusy(true);
    try {
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* optional */
      }
      const d = await mockInterviewService.startInterview(interviewId);
      if (d.resume_window_expired || ["completed", "finalized"].includes(String(d.status))) {
        setSubmitted(true);
        return;
      }
      if (d.is_resume && Array.isArray(d.conversation_history)) {
        respRef.current = d.conversation_history.map((h) => ({ question_id: h.question_id, question_text: h.question_text, answer: h.answer }));
        setTranscript(d.conversation_history.flatMap((h) => [{ role: "ai" as const, text: h.question_text }, { role: "student" as const, text: h.answer }]));
      }
      startedAtRef.current = performance.now();
      setQuestion(d.current_question ?? null);
      setTurn(d.turn_number ?? 1);
      setMaxTurns(d.max_turns ?? 0);
      setStarted(true);
      askQuestion(d.current_question ?? null);
    } catch (e) {
      const code = (e as { response?: { status?: number } })?.response?.status;
      setError(code === 400 ? "This interview has already been completed." : "Couldn't start the interview. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const doSubmit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setEvaluating(true);
    try {
      window.speechSynthesis?.cancel();
      stt.stop();
      await mockInterviewService.submitInterview(interviewId, {
        transcript: {
          responses: respRef.current,
          total_duration_seconds: Math.round((performance.now() - startedAtRef.current) / 1000),
          metadata: {
            face_validation_failures: 0,
            multiple_face_detections: 0,
            fullscreen_exits: 0,
            completed_questions: respRef.current.length,
            total_questions: respRef.current.length,
          },
        },
      });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setSubmitted(true);
      setEvaluating(false);
      // Poll for the level insight (no marks) — the evaluation runs in the background.
      setResultLoading(true);
      for (let i = 0; i < 10; i++) {
        try {
          const r = await adaptiveJourneyService.getInterviewResult(courseId);
          if (r.done && r.insight) { setResult(r); break; }
        } catch { /* retry */ }
        await new Promise((res) => setTimeout(res, 2500));
      }
      setResultLoading(false);
    } catch {
      setError("Couldn't submit your interview. Please try again.");
    } finally {
      setBusy(false);
      setEvaluating(false);
    }
  }, [busy, courseId, interviewId, stt]);

  const sendAnswer = async () => {
    if (busy || !question || !answer.trim()) return;
    stt.stop();
    const text = answer.trim();
    const resp: InterviewResponse = { question_id: question.id, question_text: qText(question), answer: text };
    respRef.current = [...respRef.current, resp];
    setTranscript((tr) => [...tr, { role: "student", text }]);
    setAnswer("");
    if (currentIsFinal) {
      await doSubmit();
      return;
    }
    setBusy(true);
    try {
      const next = await mockInterviewService.getNextQuestion(interviewId, {
        previous_question_id: question.id,
        candidate_answer: text,
      });
      if (next.is_closing_remark || next.interview_complete || !next.question) {
        const remark = next.closing_remark || "Thanks — that's the end of the interview. Submit when you're ready.";
        setClosingRemark(remark);
        setTranscript((tr) => [...tr, { role: "ai", text: remark }]);
        setSpeakText(remark);
        setAiSpeaking(true);
        setQuestion(null);
      } else {
        setQuestion(next.question);
        setTurn(next.turn_number);
        setMaxTurns(next.max_turns);
        setCurrentIsFinal(!!next.is_final_question);
        askQuestion(next.question);
      }
    } catch {
      setError("The interviewer didn't respond. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const holdStart = () => {
    if (busy) return;
    // Interrupt the interviewer (speechSynthesis onend is unreliable, so aiSpeaking can
    // otherwise stay stuck and block listening) and start capturing the answer.
    window.speechSynthesis?.cancel();
    setAiSpeaking(false);
    setAnswer("");
    stt.start();
  };
  const holdEnd = () => stt.stop();

  // ---- render: terminal state — level insight (no marks, like calibration) ----
  if (submitted) {
    const ins = result?.insight;
    const CARD = { p: { xs: 2, md: 2.5 }, borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" } as const;
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0b1220", color: "white", py: { xs: 3, md: 6 }, px: 2, display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: 680 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Icon icon="mdi:check-decagram" width={44} color="#4ade80" />
            <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", textAlign: "center" }}>
              {ins ? ins.headline : "Interview submitted"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", textAlign: "center" }}>
              No marks or right/wrong — this is your level and how the course will adapt to you.
            </Typography>
          </Stack>

          {resultLoading && !ins && (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
              <CircularProgress size={26} sx={{ color: "#a855f7" }} />
              <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>Reading your level…</Typography>
            </Stack>
          )}

          {ins && (
            <Stack spacing={2}>
              <Box sx={CARD}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 700 }}>Your level</Typography>
                  <Chip label={ins.level_label} sx={{ fontWeight: 800, color: "#0b1220", bgcolor: TIER_COLOR[ins.field_tier] ?? "#60a5fa" }} />
                </Stack>
                <Box sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.08)" }}>
                  <Box sx={{ width: `${Math.round(ins.ability_index)}%`, height: "100%", borderRadius: 4, bgcolor: TIER_COLOR[ins.field_tier] ?? "#60a5fa" }} />
                </Box>
                <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>{ins.summary}</Typography>
              </Box>

              {(ins.strengths.length > 0 || ins.growth_areas.length > 0) && (
                <Box sx={CARD}>
                  {ins.strengths.length > 0 && (
                    <>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#86efac", mb: 0.75 }}>You came across strong on</Typography>
                      <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75, mb: ins.growth_areas.length ? 1.75 : 0 }}>
                        {ins.strengths.map((s) => <Chip key={s.area} size="small" icon={<Icon icon="mdi:check-circle" width={14} />} label={s.area} sx={{ fontWeight: 700, color: "#86efac", bgcolor: "rgba(34,197,94,0.12)" }} />)}
                      </Stack>
                    </>
                  )}
                  {ins.growth_areas.length > 0 && (
                    <>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#fcd34d", mb: 0.75 }}>We&apos;ll support you on</Typography>
                      <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75 }}>
                        {ins.growth_areas.map((g) => <Chip key={g.area} size="small" icon={<Icon icon="mdi:trending-up" width={14} />} label={g.area} sx={{ fontWeight: 700, color: "#fcd34d", bgcolor: "rgba(245,158,11,0.12)" }} />)}
                      </Stack>
                    </>
                  )}
                </Box>
              )}

              <Box sx={{ ...CARD, bgcolor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
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

          {!resultLoading && !ins && (
            <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.6)", py: 2 }}>
              Your level insight is being prepared — it&apos;ll appear in your course shortly.
            </Typography>
          )}

          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => router.push(`/adaptive-courses/${courseId}`)}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 4, py: 1.1, color: "white", background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
              Start my personalized journey →
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (error && !started) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={1.5} sx={{ maxWidth: 420, textAlign: "center" }}>
          <Icon icon="mdi:alert-circle-outline" width={44} color="#fca5a5" />
          <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>{error}</Typography>
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" disabled={busy} onClick={() => { setError(null); void begin(); }}
              startIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:refresh" width={18} />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
              Try again
            </Button>
            <Button variant="outlined" onClick={() => router.push(`/adaptive-courses/${courseId}`)} sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)", textTransform: "none" }}>Back to course</Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  // ---- begin gate ----
  if (!started) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={2.5} sx={{ maxWidth: 520, textAlign: "center" }}>
          <Box sx={{ width: 200, height: 200 }}>
            <Orb hue={265} hoverIntensity={0.4} forceHoverState rotateOnHover backgroundColor="#0b1220" />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.4rem" }}>Meet your AI interviewer</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>
            {topic ? `${topic} · ` : ""}{difficulty} · a short spoken conversation. The interviewer speaks each question
            out loud; just <b>hold to answer</b> and talk. It adapts to you and gauges your level.
          </Typography>
          <Stack direction="row" spacing={3.5} justifyContent="center" sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>
            {[
              { icon: "mdi:microphone", label: "Voice" },
              { icon: "mdi:closed-caption-outline", label: "Live transcript" },
              { icon: "mdi:robot-happy-outline", label: "Adaptive" },
            ].map((x) => (
              <Stack key={x.label} alignItems="center" spacing={0.6}>
                <Icon icon={x.icon} width={20} />
                <span>{x.label}</span>
              </Stack>
            ))}
          </Stack>
          <Button variant="contained" disabled={busy} onClick={begin}
            startIcon={busy ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:microphone" width={20} />}
            sx={{ mt: 1, textTransform: "none", fontWeight: 800, borderRadius: 2, px: 4, py: 1.2, background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
            {busy ? "Connecting…" : "Begin interview"}
          </Button>
        </Stack>
      </Box>
    );
  }

  const phase = aiSpeaking ? "Speaking" : stt.isListening ? "Listening" : busy ? "Thinking" : "Ready";
  const phaseColor = aiSpeaking ? "#a855f7" : stt.isListening ? "#22c55e" : "#64748b";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0b1220", color: "white", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SparkBadge size={34} />
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>AI Mock Interviewer</Typography>
              <Chip size="small" label="LIVE" sx={{ height: 18, fontSize: "0.58rem", fontWeight: 800, color: "white", background: "linear-gradient(135deg, #7c3aed, #db2777)" }} />
            </Stack>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
              {topic ? `${topic} · ` : ""}{difficulty} round
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip size="small" icon={<Icon icon="mdi:clock-outline" width={14} />} label={`${fmtClock(elapsed)} elapsed`}
            sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.06)", fontWeight: 700, fontSize: "0.72rem", "& .MuiChip-icon": { color: "rgba(255,255,255,0.6)" } }} />
          <Chip size="small" label={`Q${turn}${maxTurns ? ` of ~${maxTurns}` : ""}`} sx={{ color: "#c4b5fd", bgcolor: "rgba(124,58,237,0.18)", fontWeight: 800, fontSize: "0.72rem" }} />
          <Button variant="contained" disabled={busy} onClick={doSubmit}
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, bgcolor: "rgba(239,68,68,0.15)", color: "#fca5a5", boxShadow: "none", "&:hover": { bgcolor: "rgba(239,68,68,0.25)" } }}>
            End &amp; get report
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px minmax(0,1fr) 300px" }, minHeight: 0 }}>
        {/* Left — Orb + controls */}
        <Stack alignItems="center" sx={{ p: 3, borderRight: { md: "1px solid rgba(255,255,255,0.08)" } }}>
          <Box sx={{ position: "relative", width: 240, height: 240, mt: 2 }}>
            <Orb hue={265} hoverIntensity={aiSpeaking ? 0.8 : 0.3} forceHoverState={aiSpeaking || stt.isListening} rotateOnHover backgroundColor="#0b1220" audioLevelRef={micLevelRef} />
            {stt.isListening && (
              <Box sx={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid #22c55e", animation: "pulse 1.2s ease-in-out infinite", "@keyframes pulse": { "0%,100%": { opacity: 0.3 }, "50%": { opacity: 0.9 } } }} />
            )}
          </Box>
          <Chip size="small" icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: phaseColor }} />} label={phase}
            sx={{ mt: 2, color: phaseColor, bgcolor: "rgba(255,255,255,0.06)", fontWeight: 800, fontSize: "0.72rem" }} />
          <Typography sx={{ fontWeight: 800, mt: 1.5 }}>Aria</Typography>
          <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.5)" }}>Your AI interviewer</Typography>

          <Box sx={{ flex: 1 }} />

          {!typing ? (
            <>
              <Button
                fullWidth
                disabled={busy}
                onPointerDown={(e) => { try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ } holdStart(); }}
                onPointerUp={holdEnd}
                onPointerCancel={holdEnd}
                startIcon={<Icon icon="mdi:microphone" width={20} />}
                sx={{ py: 1.4, borderRadius: 3, fontWeight: 800, fontSize: "0.95rem", color: "white", textTransform: "none",
                  background: stt.isListening ? "linear-gradient(135deg, #16a34a, #22c55e)" : "linear-gradient(135deg, #7c3aed, #db2777)",
                  "&.Mui-disabled": { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" } }}>
                {stt.isListening ? "Listening… release to stop" : "Hold to answer"}
              </Button>
              <Button onClick={() => setTyping(true)} sx={{ mt: 1, textTransform: "none", color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}
                startIcon={<Icon icon="mdi:keyboard-outline" width={16} />}>
                Type instead
              </Button>
            </>
          ) : (
            <Box sx={{ width: "100%" }}>
              <TextField fullWidth multiline minRows={2} placeholder="Type your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)}
                inputProps={{ style: { color: "#ffffff", WebkitTextFillColor: "#ffffff", caretColor: "#a855f7" } }}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.18)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" } },
                  "& .MuiInputBase-input, & .MuiOutlinedInput-input, & textarea": { color: "#fff !important", WebkitTextFillColor: "#fff !important" },
                  "& textarea::placeholder, & .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.5) !important", WebkitTextFillColor: "rgba(255,255,255,0.5) !important", opacity: 1 },
                }} />
              <Button onClick={() => setTyping(false)} sx={{ mt: 0.5, textTransform: "none", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>Use voice</Button>
            </Box>
          )}

          {(answer.trim() || typing) && (
            <Button fullWidth variant="contained" disabled={busy || !answer.trim()} onClick={sendAnswer}
              endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:send" width={16} />}
              sx={{
                mt: 1, py: 1.1, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: "#fff",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                "&.Mui-disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" },
              }}>
              {busy ? "Sending…" : currentIsFinal ? "Send & finish" : "Send answer"}
            </Button>
          )}
          {stt.error && <Typography sx={{ mt: 1, fontSize: "0.7rem", color: "#fca5a5", textAlign: "center" }}>{stt.error}</Typography>}
        </Stack>

        {/* Center — live transcript */}
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 1.75, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Typography sx={{ fontWeight: 800 }}>Live transcript</Typography>
            <Chip size="small" label="Auto-captions on" sx={{ height: 22, fontSize: "0.66rem", bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }} />
          </Stack>
          <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: 3 }}>
            <Stack spacing={2}>
              {transcript.map((b, i) => (
                <Stack key={i} direction="row" justifyContent={b.role === "ai" ? "flex-start" : "flex-end"} spacing={1}>
                  {b.role === "ai" && <Box sx={{ mt: 0.5 }}><SparkBadge size={28} /></Box>}
                  <Box sx={{ maxWidth: "78%", p: 1.5, borderRadius: 3,
                    bgcolor: b.role === "ai" ? "rgba(255,255,255,0.05)" : "#4f46e5",
                    border: b.role === "ai" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5 }}>{b.text}</Typography>
                  </Box>
                  {b.role === "student" && <Box sx={{ width: 26, height: 26, flexShrink: 0, mt: 0.5, borderRadius: "50%", bgcolor: "#6366f1", display: "grid", placeItems: "center", fontSize: "0.7rem", fontWeight: 800 }}>S</Box>}
                </Stack>
              ))}
              {stt.isListening && answer && (
                <Stack direction="row" justifyContent="flex-end">
                  <Box sx={{ maxWidth: "78%", p: 1.5, borderRadius: 3, bgcolor: "rgba(79,70,229,0.6)" }}>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5 }}>{answer}<Box component="span" sx={{ ml: 0.5, display: "inline-block", width: 8, height: 16, bgcolor: "white", animation: "blink 1s steps(2) infinite", "@keyframes blink": { "50%": { opacity: 0 } } }} /></Typography>
                  </Box>
                </Stack>
              )}
              {busy && !aiSpeaking && <Typography sx={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>following up…</Typography>}
            </Stack>
          </Box>
        </Box>

        {/* Right — evaluation / report */}
        <Box sx={{ p: 3, borderLeft: { md: "1px solid rgba(255,255,255,0.08)" }, display: { xs: "none", md: "block" } }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.45)" }}>WHAT WE&apos;RE SCORING</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", mt: 0.5, mb: 2, lineHeight: 1.5 }}>
            Your full rubric + scores land in the end-of-session report.
          </Typography>
          {RUBRIC.map((r) => (
            <Box key={r} sx={{ mb: 1.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{r}</Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>—</Typography>
              </Stack>
              <Box sx={{ mt: 0.5, height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.08)" }} />
            </Box>
          ))}
          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "#0d1424", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: 1, color: "rgba(255,255,255,0.5)", mb: 0.75 }}>END-OF-SESSION REPORT</Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              You&apos;ll get a full transcript, a per-answer rubric, model answers, and a focused 3-item practice plan —
              and it seeds your AI Student Model so the course adapts to you.
            </Typography>
          </Box>
        </Box>
      </Box>

      {evaluating && (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(11,18,32,0.88)", display: "grid", placeItems: "center", zIndex: 20 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} sx={{ color: "#a855f7" }} />
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
