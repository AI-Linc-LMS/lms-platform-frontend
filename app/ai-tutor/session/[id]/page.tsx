"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { PHASE_LABEL, TutorVoice } from "@/components/ai-tutor/room/TutorVoice";
import { CanvasStage } from "@/components/ai-tutor/room/CanvasStage";
import { LessonPlanRail } from "@/components/ai-tutor/room/LessonPlanRail";
import { QuizOverlay } from "@/components/ai-tutor/room/QuizOverlay";
import { IdePanel } from "@/components/ai-tutor/room/IdePanel";
import { useRealtimeTutor } from "@/lib/hooks/useRealtimeTutor";
import type {
  LessonPlanSection,
  PooledQuestion,
  TutorLevel,
} from "@/lib/services/ai-tutor.service";

/**
 * The live session room.
 *
 * The URL is `/ai-tutor/session/new?topic=...` until the session exists, and then stays on
 * `new` for the rest of the lesson. That is deliberate: the global camera route guard tears
 * down media streams on pathname change, so rewriting the URL to the real session id
 * mid-call would silently kill both the microphone and the tutor's own audio.
 */

const PHASE_HINT: Record<string, string> = {
  connecting: "Connecting you now",
  listening: "Go ahead, ask anything",
  "student-speaking": "Listening",
  thinking: "Thinking",
  speaking: "You can interrupt at any time",
};

export default function TutorSessionPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const { showToast } = useToast();

  const topic = search.get("topic") ?? "";
  const level = (search.get("level") as TutorLevel) || "beginner";
  const minutes = Number(search.get("minutes") ?? 20);
  const slug = search.get("slug") ?? undefined;
  const source = search.get("source") ?? undefined;

  const [plan, setPlan] = useState<LessonPlanSection[]>([]);
  const [quiz, setQuiz] = useState<PooledQuestion | null>(null);
  const [ide, setIde] = useState<{
    open: boolean;
    language: string;
    task: string;
    starter?: string;
  }>({ open: false, language: "python", task: "" });
  const [runNonce, setRunNonce] = useState(0);
  const [finishedId, setFinishedId] = useState<string | null>(null);

  const codeReaderRef = useRef<(() => { language: string; code: string } | null) | null>(
    null
  );
  const launchedRef = useRef(false);

  const tutor = useRealtimeTutor({
    onQuiz: setQuiz,
    onOpenIde: ({ language, task, starter_code }) =>
      setIde({ open: true, language, task, starter: starter_code }),
    onRunCode: () => setRunNonce((n) => n + 1),
    readStudentCode: () => codeReaderRef.current?.() ?? null,
    onError: (message) => showToast(message, "error"),
  });

  const { start, end, phase, sessionId } = tutor;

  // Start once, on mount, off the click that navigated here. The microphone prompt and the
  // audio element are both created inside `start`, in the same task, which is what iOS
  // needs to allow playback at all.
  useEffect(() => {
    if (launchedRef.current || !topic) return;
    launchedRef.current = true;
    void (async () => {
      const started = await start({
        topic,
        level,
        minutes,
        topic_slug: slug,
        topic_source: source,
      });
      if (started) setPlan(started.session.lesson_plan ?? []);
    })();
  }, [level, minutes, slug, source, start, topic]);

  const leave = useCallback(async () => {
    const id = sessionId;
    await end("learner");
    if (id) {
      setFinishedId(id);
      router.replace(`/ai-tutor/session/${id}/recap`);
    } else {
      router.replace("/ai-tutor");
    }
  }, [end, router, sessionId]);

  // A learner who closes the tab mid-lesson still gets their minutes settled, because the
  // hook flushes on pagehide and the server sweep closes anything that stops reporting.
  useEffect(() => {
    const onBeforeUnload = () => {
      void end("learner");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [end]);

  const remaining = tutor.remainingSeconds;
  const clock = useMemo(() => {
    if (remaining === null) return "";
    const m = Math.floor(Math.max(0, remaining) / 60);
    const s = Math.max(0, remaining) % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  if (!topic && !finishedId) {
    return (
      <MainLayout hideSidebar fullPage fullWidthContent>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh", px: 3 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 500, mb: 1 }}>
              No lesson to start
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", color: "var(--font-tertiary)", mb: 2 }}>
              Pick a topic from your tutor dashboard.
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={() => router.replace("/ai-tutor")}
              sx={primaryButtonSx}
            >
              Back to AI Tutor
            </Box>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  const failed = phase === "failed";

  return (
    <MainLayout hideSidebar fullPage fullWidthContent>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100dvh - 64px)",
          bgcolor: "var(--canvas, #f4f3f8)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: { xs: 2, md: 3 },
            py: 1.5,
            borderBottom: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            flexShrink: 0,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={leave}
            aria-label="Leave session"
            sx={iconButtonSx}
          >
            <Icon icon="mdi:arrow-left" width={19} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {topic}
            </Typography>
            <Typography sx={{ fontSize: "0.74rem", color: "var(--font-tertiary)" }}>
              {level}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          {clock ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <Icon
                icon="solar:clock-circle-bold-duotone"
                width={16}
                style={{ color: "var(--font-tertiary)" }}
              />
              <Typography
                sx={{
                  fontSize: "0.86rem",
                  fontVariantNumeric: "tabular-nums",
                  color:
                    remaining !== null && remaining < 120
                      ? "var(--ai-violet)"
                      : "var(--font-secondary)",
                }}
              >
                {clock}
              </Typography>
            </Box>
          ) : null}
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Plan rail */}
          <Box
            sx={{
              width: 236,
              flexShrink: 0,
              display: { xs: "none", md: "block" },
              borderRight: "1px solid var(--border-default)",
              bgcolor: "var(--card-bg)",
              p: 2.5,
              overflowY: "auto",
            }}
          >
            <LessonPlanRail
              plan={plan}
              currentIndex={tutor.planIndex}
              conceptsCovered={tutor.cards.length}
            />
          </Box>

          {/* Canvas + blob */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
              {failed ? (
                <Box sx={{ display: "grid", placeItems: "center", height: "100%" }}>
                  <Box sx={{ textAlign: "center", maxWidth: 420 }}>
                    <Icon
                      icon="solar:danger-triangle-bold-duotone"
                      width={40}
                      style={{ color: "var(--font-tertiary)" }}
                    />
                    <Typography sx={{ fontSize: "1.05rem", fontWeight: 500, mt: 1.5 }}>
                      Could not connect
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "var(--font-tertiary)",
                        mt: 0.75,
                        lineHeight: 1.5,
                      }}
                    >
                      {tutor.error ??
                        "Some networks block voice calls. Try a different network, or a phone hotspot."}
                    </Typography>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => router.replace("/ai-tutor")}
                      sx={{ ...primaryButtonSx, mt: 2.5 }}
                    >
                      Back to AI Tutor
                    </Box>
                  </Box>
                </Box>
              ) : (
                <CanvasStage cards={tutor.cards} />
              )}
            </Box>

            {!failed ? (
              <Box
                sx={{
                  flexShrink: 0,
                  borderTop: "1px solid var(--border-default)",
                  bgcolor: "var(--card-bg)",
                  px: { xs: 2, md: 3 },
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2.5,
                }}
              >
                <Box sx={{ width: { xs: 132, sm: 200, md: 260 }, flexShrink: 0 }}>
                  <TutorVoice
                    phase={phase}
                    getLevels={tutor.getLevels}
                    height={92}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ai-violet)",
                      mb: 0.5,
                    }}
                  >
                    {PHASE_LABEL[phase]}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.95rem",
                      color: "var(--font-secondary)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {tutor.caption || PHASE_HINT[phase] || ""}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() =>
                      setIde((prev) => ({ ...prev, open: !prev.open }))
                    }
                    title="Toggle the code editor"
                    sx={iconButtonSx}
                  >
                    <Icon icon="solar:code-square-bold-duotone" width={19} />
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={leave}
                    sx={{
                      ...primaryButtonSx,
                      bgcolor: "transparent",
                      color: "var(--font-secondary)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    End session
                  </Box>
                </Box>
              </Box>
            ) : null}
          </Box>

          {/* IDE */}
          {ide.open ? (
            <Box
              sx={{
                width: { xs: "100%", md: 460 },
                flexShrink: 0,
                position: { xs: "absolute", md: "static" },
                inset: { xs: 0, md: "auto" },
                zIndex: { xs: 10, md: "auto" },
              }}
            >
              <IdePanel
                open={ide.open}
                sessionId={sessionId}
                language={ide.language}
                task={ide.task}
                starterCode={ide.starter}
                onClose={() => setIde((prev) => ({ ...prev, open: false }))}
                onShareCode={tutor.shareCode}
                onRunResult={tutor.reportRunResult}
                registerReader={(reader) => {
                  codeReaderRef.current = reader;
                }}
                runRequestNonce={runNonce}
              />
            </Box>
          ) : null}
        </Box>
      </Box>

      <QuizOverlay
        question={quiz}
        onAnswer={tutor.submitQuizAnswer}
        onClose={() => setQuiz(null)}
      />
    </MainLayout>
  );
}

const iconButtonSx = {
  display: "grid",
  placeItems: "center",
  width: 38,
  height: 38,
  borderRadius: "8px",
  border: "1px solid var(--border-default)",
  bgcolor: "transparent",
  color: "var(--font-secondary)",
  cursor: "pointer",
  flexShrink: 0,
  "&:hover": { borderColor: "var(--ai-violet)" },
} as const;

const primaryButtonSx = {
  px: 2.25,
  py: 1,
  borderRadius: "8px",
  border: "none",
  fontFamily: "inherit",
  fontSize: "0.88rem",
  fontWeight: 500,
  color: "#fff",
  bgcolor: "var(--ai-violet)",
  cursor: "pointer",
} as const;
