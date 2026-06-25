"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import mockInterviewService, {
  type InterviewQuestion,
  type InterviewResponse,
} from "@/lib/services/mock-interview.service";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { InterviewResult } from "@/lib/types/adaptive-journey";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";
import { AIAvatar } from "@/components/mock-interview/AIAvatar";

const TIER_COLOR: Record<string, string> = { beginner: "#fbbf24", intermediate: "#60a5fa", advanced: "#4ade80" };
const INTERVIEW_AVATAR_SRC = "/videos/Interview.mp4";
// Auto-advance after the candidate goes quiet for this long (once they've said something
// and the interviewer has finished speaking) — the same "voice mode" feel as the platform
// mock interview, instead of a press-and-hold mic.
const SILENCE_ADVANCE_MS = 4500;

const qText = (q: InterviewQuestion | null): string => (q ? (q.question_text || q.question || "").trim() : "");
const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}`;

type Bubble = { role: "ai" | "student"; text: string };

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
  const [interim, setInterim] = useState("");
  const [typing, setTyping] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const respRef = useRef<InterviewResponse[]>([]);
  const startedAtRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const answerRef = useRef("");
  const lastSpeechRef = useRef(0);
  const sendAnswerRef = useRef<() => void>(() => {});

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const bumpSpeech = () => {
    lastSpeechRef.current = performance.now();
  };

  // ---- voice: student answers continuously (browser STT + Whisper fallback). STT is
  //      PAUSED while the AI speaks, so it never fights the interviewer's voice. ----
  const stt = useSpeechToText({
    continuous: true,
    preferWhisper: true,
    paused: aiSpeaking,
    lang: "en-US",
    onInterim: (t) => {
      setInterim(t);
      bumpSpeech();
    },
    onFinal: (t) => {
      setInterim("");
      setAnswer((a) => (a ? `${a} ${t}` : t).replace(/\s+/g, " "));
      bumpSpeech();
    },
  });

  // timer (elapsed)
  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  // autoscroll transcript
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, answer, interim]);

  const askQuestion = useCallback((q: InterviewQuestion | null) => {
    const text = qText(q);
    if (!text) return;
    setTranscript((tr) => [...tr, { role: "ai", text }]);
    setSpeakText(text);
    setAiSpeaking(true);
  }, []);

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
          if (r.done && r.insight) {
            setResult(r);
            break;
          }
        } catch {
          /* retry */
        }
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

  const sendAnswer = useCallback(async () => {
    if (busy || !question) return;
    const text = answerRef.current.trim();
    if (!text) return;
    const resp: InterviewResponse = { question_id: question.id, question_text: qText(question), answer: text };
    respRef.current = [...respRef.current, resp];
    setTranscript((tr) => [...tr, { role: "student", text }]);
    setAnswer("");
    setInterim("");
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
        const remark = next.closing_remark || "Thanks — that's the end of the interview.";
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
  }, [busy, question, currentIsFinal, interviewId, doSubmit, askQuestion]);

  useEffect(() => {
    sendAnswerRef.current = () => void sendAnswer();
  }, [sendAnswer]);

  // Silence-based auto-advance: once the interviewer has finished and the candidate has
  // said something, a few seconds of quiet sends the answer automatically (voice mode).
  useEffect(() => {
    if (!started || submitted || aiSpeaking || busy || !question || typing) return;
    const id = setInterval(() => {
      if (answerRef.current.trim() && performance.now() - lastSpeechRef.current > SILENCE_ADVANCE_MS) {
        clearInterval(id);
        sendAnswerRef.current();
      }
    }, 400);
    return () => clearInterval(id);
  }, [started, submitted, aiSpeaking, busy, question, typing]);

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
      bumpSpeech();
      setQuestion(d.current_question ?? null);
      setTurn(d.turn_number ?? 1);
      setMaxTurns(d.max_turns ?? 0);
      setStarted(true);
      // Begin continuous capture in the same user gesture (mic permission + audio unlock).
      stt.start();
      askQuestion(d.current_question ?? null);
    } catch (e) {
      const code = (e as { response?: { status?: number } })?.response?.status;
      setError(code === 400 ? "This interview has already been completed." : "Couldn't start the interview. Please try again.");
    } finally {
      setBusy(false);
    }
  };

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
        <Stack alignItems="center" spacing={2.5} sx={{ maxWidth: 560, textAlign: "center" }}>
          <Box sx={{ width: { xs: 220, md: 300 }, height: { xs: 150, md: 200 }, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            <AIAvatar interviewVideoSrc={INTERVIEW_AVATAR_SRC} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.4rem" }}>Meet your AI interviewer</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>
            {topic ? `${topic} · ` : ""}{difficulty} · a short spoken conversation. The interviewer asks each question
            out loud — just <b>speak your answer</b>, and it advances when you pause. It adapts to you and gauges your level.
          </Typography>
          <Stack direction="row" spacing={3.5} justifyContent="center" sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>
            {[
              { icon: "mdi:microphone", label: "Voice" },
              { icon: "mdi:closed-caption-outline", label: "Live captions" },
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

  const phase = aiSpeaking ? "Interviewer speaking" : stt.isListening ? "Listening…" : busy ? "Thinking…" : "Your turn";
  const phaseColor = aiSpeaking ? "#a855f7" : stt.isListening ? "#22c55e" : "#64748b";
  const liveAnswer = (answer + (interim ? ` ${interim}` : "")).trim();
  const finishing = !question && !!closingRemark;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0b1220", color: "white", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Box>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>AI Mock Interviewer</Typography>
            <Chip size="small" label="LIVE" sx={{ height: 18, fontSize: "0.58rem", fontWeight: 800, color: "white", background: "linear-gradient(135deg, #7c3aed, #db2777)" }} />
          </Stack>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
            {topic ? `${topic} · ` : ""}{difficulty} round
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip size="small" icon={<Icon icon="mdi:clock-outline" width={14} />} label={`${fmtClock(elapsed)}`}
            sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.06)", fontWeight: 700, fontSize: "0.72rem", "& .MuiChip-icon": { color: "rgba(255,255,255,0.6)" } }} />
          <Chip size="small" label={`Q${turn}${maxTurns ? ` of ~${maxTurns}` : ""}`} sx={{ color: "#c4b5fd", bgcolor: "rgba(124,58,237,0.18)", fontWeight: 800, fontSize: "0.72rem", display: { xs: "none", sm: "inline-flex" } }} />
          <Button variant="contained" disabled={busy} onClick={doSubmit}
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, bgcolor: "rgba(239,68,68,0.15)", color: "#fca5a5", boxShadow: "none", "&:hover": { bgcolor: "rgba(239,68,68,0.25)" } }}>
            End &amp; get level
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1.1fr) minmax(0,1fr)" }, minHeight: 0 }}>
        {/* Left — interviewer video + controls */}
        <Stack sx={{ p: { xs: 2, md: 3 }, borderRight: { md: "1px solid rgba(255,255,255,0.08)" }, minHeight: 0 }}>
          <Box sx={{ position: "relative", width: "100%", aspectRatio: "16 / 10", borderRadius: 4, overflow: "hidden", border: stt.isListening ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.1)", transition: "border-color 200ms ease" }}>
            <AIAvatar
              isSpeaking={aiSpeaking}
              question={speakText}
              onSpeakComplete={() => setAiSpeaking(false)}
              isUserSpeaking={stt.isListening}
              interviewVideoSrc={INTERVIEW_AVATAR_SRC}
            />
          </Box>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
            <Chip size="small" icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: phaseColor }} />} label={phase}
              sx={{ color: phaseColor, bgcolor: "rgba(255,255,255,0.06)", fontWeight: 800, fontSize: "0.72rem" }} />
            <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.45)" }}>Aria · your AI interviewer</Typography>
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* Controls */}
          {finishing ? (
            <Button fullWidth variant="contained" disabled={busy} onClick={doSubmit}
              endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:flag-checkered" width={18} />}
              sx={{ mt: 1.5, py: 1.3, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
              {busy ? "Finishing…" : "Finish & see my level"}
            </Button>
          ) : typing ? (
            <Box sx={{ mt: 1.5 }}>
              <TextField fullWidth multiline minRows={2} placeholder="Type your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)}
                inputProps={{ style: { color: "#ffffff", WebkitTextFillColor: "#ffffff", caretColor: "#a855f7" } }}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.18)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" } },
                  "& .MuiInputBase-input, & .MuiOutlinedInput-input, & textarea": { color: "#fff !important", WebkitTextFillColor: "#fff !important" },
                  "& textarea::placeholder, & .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.5) !important", WebkitTextFillColor: "rgba(255,255,255,0.5) !important", opacity: 1 },
                }} />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button fullWidth variant="contained" disabled={busy || !answer.trim()} onClick={() => void sendAnswer()}
                  endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:send" width={16} />}
                  sx={{ py: 1.05, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #6366f1, #a855f7)", "&.Mui-disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" } }}>
                  {busy ? "Sending…" : currentIsFinal ? "Send & finish" : "Send answer"}
                </Button>
                <Button onClick={() => setTyping(false)} sx={{ textTransform: "none", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>Use voice</Button>
              </Stack>
            </Box>
          ) : (
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              <Button fullWidth variant="contained" disabled={busy || aiSpeaking || !answer.trim()} onClick={() => void sendAnswer()}
                endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:send" width={16} />}
                sx={{ py: 1.3, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #6366f1, #a855f7)", "&.Mui-disabled": { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" } }}>
                {busy ? "Sending…" : answer.trim() ? (currentIsFinal ? "Done — send & finish" : "Done answering") : aiSpeaking ? "Interviewer is speaking…" : "Listening — speak your answer"}
              </Button>
              <Button onClick={() => setTyping(true)} sx={{ textTransform: "none", color: "rgba(255,255,255,0.55)", fontSize: "0.82rem" }}
                startIcon={<Icon icon="mdi:keyboard-outline" width={16} />}>
                Type instead
              </Button>
            </Stack>
          )}
          {stt.error && <Typography sx={{ mt: 1, fontSize: "0.7rem", color: "#fca5a5", textAlign: "center" }}>{stt.error}</Typography>}
        </Stack>

        {/* Right — conversation so far + live answer */}
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 2, md: 3 }, py: 1.75, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Typography sx={{ fontWeight: 800 }}>Conversation</Typography>
            <Chip size="small" label="Auto-captions on" sx={{ height: 22, fontSize: "0.66rem", bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }} />
          </Stack>
          <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              {transcript.map((b, i) => (
                <Stack key={i} direction="row" justifyContent={b.role === "ai" ? "flex-start" : "flex-end"} spacing={1}>
                  {b.role === "ai" && <Box sx={{ width: 26, height: 26, flexShrink: 0, mt: 0.5, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #db2777)", display: "grid", placeItems: "center" }}><Icon icon="mdi:robot-happy-outline" width={15} color="white" /></Box>}
                  <Box sx={{ maxWidth: "82%", p: 1.5, borderRadius: 3,
                    bgcolor: b.role === "ai" ? "rgba(255,255,255,0.05)" : "#4f46e5",
                    border: b.role === "ai" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5 }}>{b.text}</Typography>
                  </Box>
                  {b.role === "student" && <Box sx={{ width: 26, height: 26, flexShrink: 0, mt: 0.5, borderRadius: "50%", bgcolor: "#6366f1", display: "grid", placeItems: "center", fontSize: "0.7rem", fontWeight: 800 }}>You</Box>}
                </Stack>
              ))}
              {liveAnswer && !aiSpeaking && (
                <Stack direction="row" justifyContent="flex-end">
                  <Box sx={{ maxWidth: "82%", p: 1.5, borderRadius: 3, bgcolor: "rgba(79,70,229,0.6)" }}>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5 }}>{liveAnswer}<Box component="span" sx={{ ml: 0.5, display: "inline-block", width: 8, height: 16, bgcolor: "white", animation: "blink 1s steps(2) infinite", "@keyframes blink": { "50%": { opacity: 0 } } }} /></Typography>
                  </Box>
                </Stack>
              )}
              {busy && !aiSpeaking && <Typography sx={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>following up…</Typography>}
            </Stack>
          </Box>
        </Box>
      </Box>

      {evaluating && (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(11,18,32,0.88)", display: "grid", placeItems: "center", zIndex: 20 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} sx={{ color: "#a855f7" }} />
            <Typography sx={{ color: "white", fontWeight: 700 }}>Reading your level…</Typography>
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
