"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
 * The live session room. **Dark by design.**
 *
 * This is the only dark surface in the learner app, and the reason is that the room is not a
 * page of content: it is a place you talk to something. The dark ground lets the ribbon carry
 * real luminance (violet and cyan at full saturation are garish on the light canvas, which is
 * why `DESIGN.md` restricts them to brand surfaces), and it removes every competing element so
 * attention lands on the voice and on whatever it just put up.
 *
 * The ribbon is the centrepiece, not an accent. While the canvas is empty it owns the stage;
 * once the tutor puts something up it retreats to a band and the material gets the space.
 * Nothing about that transition touches the audio pipeline.
 *
 * The URL stays on `/ai-tutor/session/new?topic=…` for the entire lesson. That is deliberate:
 * the global camera route guard tears media streams down on pathname change, so rewriting the
 * URL to the real session id mid-call would kill both the microphone and the tutor's voice.
 */

const PHASE_HINT: Record<string, string> = {
  starting: "Planning your lesson",
  connecting: "Connecting you now",
  listening: "Go ahead, ask anything",
  "student-speaking": "Listening to you",
  thinking: "Thinking about that",
  speaking: "Cut in whenever you like",
};

// The support FAB is fixed bottom-right and otherwise sits on top of "End session".
const FAB_CLEARANCE = 72;

export default function TutorSessionPage() {
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
  const [planOpen, setPlanOpen] = useState(false);

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

  const { start, end, phase, sessionId, cards } = tutor;

  // Start once, on mount, off the click that navigated here. The microphone prompt and the
  // audio element are both created inside `start`, in the same task, which is what iOS needs
  // in order to allow playback at all.
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
    router.replace(id ? `/ai-tutor/session/${id}/recap` : "/ai-tutor");
  }, [end, router, sessionId]);

  // R3 — `end()` is async and beforeunload does not await, so closing the tab never settled the
  // session and the recap waited on the sweep. keepaliveEnd survives the unload.
  useEffect(() => {
    const onBeforeUnload = () => tutor.keepaliveEnd("learner");
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = tutor.remainingSeconds;
  const clock = useMemo(() => {
    if (remaining === null) return "";
    const m = Math.floor(Math.max(0, remaining) / 60);
    const s = Math.max(0, remaining) % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  const failed = phase === "failed";
  const hasCards = cards.length > 0;
  const lowTime = remaining !== null && remaining < 120;

  if (!topic) {
    return (
      <MainLayout hideSidebar fullPage fullWidthContent>
        <Box sx={{ ...roomShellSx, display: "grid", placeItems: "center", px: 3 }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", mb: 1 }}>
              No lesson to start
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", mb: 3 }}>
              Pick a topic from your tutor dashboard.
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={() => router.replace("/ai-tutor")}
              sx={primaryBtn}
            >
              Back to AI Tutor
            </Box>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout hideSidebar fullPage fullWidthContent>
      <Box sx={roomShellSx}>
        {/* ---------- Top bar ---------- */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: { xs: 2, md: 3 },
            py: 1.5,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={leave}
            aria-label="Leave session"
            sx={ghostBtn}
          >
            <Icon icon="mdi:arrow-left" width={19} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {topic}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.6)",
                textTransform: "capitalize",
              }}
            >
              {level}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Plan toggle, for the breakpoints where the rail is hidden. */}
          <Box
            component="button"
            type="button"
            onClick={() => setPlanOpen((o) => !o)}
            sx={{ ...ghostBtn, display: { xs: "grid", lg: "none" } }}
            aria-label="Today's plan"
          >
            <Icon icon="solar:list-check-bold-duotone" width={18} />
          </Box>

          {clock ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.75,
                borderRadius: 9999,
                bgcolor: lowTime ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.08)",
                border: "1px solid",
                borderColor: lowTime ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.14)",
              }}
            >
              <Icon
                icon="solar:clock-circle-bold-duotone"
                width={15}
                style={{ color: lowTime ? "#f9a8d4" : "rgba(255,255,255,0.72)" }}
              />
              <Typography
                sx={{
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: lowTime ? "#fbcfe8" : "rgba(255,255,255,0.92)",
                }}
              >
                {clock}
              </Typography>
            </Box>
          ) : null}
        </Box>

        {/* R1 / R2 — the two states a learner needs told about, rather than left to guess at
            from a room that has gone quiet. */}
        {tutor.reconnecting ? (
          <Box sx={{ ...bannerSx, bgcolor: "rgba(168,85,247,0.18)", borderColor: "rgba(168,85,247,0.5)" }}>
            <Icon icon="solar:refresh-bold-duotone" width={17} style={{ color: "#c4b5fd" }} />
            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.92)" }}>
              Connection dropped. Getting you back into the lesson…
            </Typography>
          </Box>
        ) : tutor.idleWarning ? (
          <Box sx={{ ...bannerSx, bgcolor: "rgba(236,72,153,0.16)", borderColor: "rgba(236,72,153,0.5)" }}>
            <Icon icon="solar:clock-circle-bold-duotone" width={17} style={{ color: "#f9a8d4" }} />
            <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.92)", flex: 1 }}>
              Still there? This lesson will end shortly to save your minutes.
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={tutor.confirmPresence}
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.35)",
                bgcolor: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontFamily: "inherit",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              I&apos;m still here
            </Box>
          </Box>
        ) : null}

        {/* ---------- Body ---------- */}
        <Box sx={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
          {/* Plan rail */}
          <Box
            sx={{
              width: 250,
              flexShrink: 0,
              borderRight: "1px solid rgba(255,255,255,0.1)",
              p: 2.5,
              overflowY: "auto",
              display: { xs: planOpen ? "block" : "none", lg: "block" },
              position: { xs: "absolute", lg: "static" },
              inset: { xs: 0, lg: "auto" },
              zIndex: { xs: 8, lg: "auto" },
              bgcolor: { xs: "#150c33", lg: "transparent" },
            }}
          >
            <LessonPlanRail
              plan={plan}
              currentIndex={tutor.planIndex}
              conceptsCovered={cards.length}
            />
          </Box>

          {/* Stage */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {failed ? (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 3 }}>
                <Box sx={{ textAlign: "center", maxWidth: 440 }}>
                  <Icon
                    icon="solar:danger-triangle-bold-duotone"
                    width={44}
                    style={{ color: "#fca5a5" }}
                  />
                  <Typography
                    sx={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", mt: 2 }}
                  >
                    Could not connect
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.95rem",
                      color: "rgba(255,255,255,0.72)",
                      mt: 1,
                      lineHeight: 1.6,
                    }}
                  >
                    {tutor.error ??
                      "Some networks block voice calls. Try a different network, or a phone hotspot."}
                  </Typography>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => router.replace("/ai-tutor")}
                    sx={{ ...primaryBtn, mt: 3 }}
                  >
                    Back to AI Tutor
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
                {/* THE RIBBON. Owns the stage until the tutor puts something up, then
                    retreats to a band so the material gets the room. */}
                <Box
                  sx={{
                    position: "relative",
                    flexShrink: 0,
                    height: hasCards
                      ? { xs: 150, md: 190 }
                      : { xs: 300, md: "min(52vh, 460px)" },
                    transition: "height 420ms cubic-bezier(.175,.885,.32,1.1)",
                  }}
                >
                  <TutorVoice phase={phase} getLevels={tutor.getLevels} />
                </Box>

                {/* Captions. Large and centred while the ribbon owns the stage, because at
                    that point they ARE the content. */}
                <Box
                  sx={{
                    flexShrink: 0,
                    px: { xs: 2.5, md: 5 },
                    pt: 2.5,
                    pb: hasCards ? 2 : 3,
                    textAlign: "center",
                    minHeight: hasCards ? 64 : 96,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: hasCards
                        ? { xs: "0.95rem", md: "1rem" }
                        : { xs: "1.1rem", md: "1.35rem" },
                      lineHeight: 1.55,
                      color: tutor.caption
                        ? "rgba(255,255,255,0.95)"
                        : "rgba(255,255,255,0.55)",
                      maxWidth: 760,
                      mx: "auto",
                      display: "-webkit-box",
                      WebkitLineClamp: hasCards ? 2 : 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      transition: "font-size 300ms ease",
                    }}
                    aria-live="polite"
                  >
                    {tutor.caption || PHASE_HINT[phase] || PHASE_LABEL[phase]}
                  </Typography>
                </Box>

                {/* Canvas */}
                {hasCards ? (
                  <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, md: 3 }, pb: 3 }}>
                    <CanvasStage cards={cards} />
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, display: "grid", placeItems: "center", px: 3 }}>
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        color: "rgba(255,255,255,0.42)",
                        textAlign: "center",
                      }}
                    >
                      Diagrams, examples and code will appear here as you talk.
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* IDE */}
          {ide.open ? (
            <Box
              sx={{
                width: { xs: "100%", md: 470 },
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

        {/* ---------- Transport ---------- */}
        {!failed ? (
          <Box
            sx={{
              flexShrink: 0,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              bgcolor: "rgba(255,255,255,0.03)",
              px: { xs: 2, md: 3 },
              pt: 1.75,
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              // Keep clear of the fixed support FAB, which otherwise covers "End session".
              pr: { xs: 2, md: `${FAB_CLEARANCE}px` },
              pb: "calc(14px + env(safe-area-inset-bottom))",
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => setIde((prev) => ({ ...prev, open: !prev.open }))}
              sx={{
                ...ghostBtn,
                width: "auto",
                px: 1.75,
                gap: 0.75,
                display: "flex",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              <Icon icon="solar:code-square-bold-duotone" width={17} />
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {ide.open ? "Hide editor" : "Editor"}
              </Box>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Box component="button" type="button" onClick={leave} sx={endBtn}>
              <Icon icon="solar:phone-calling-rounded-bold" width={17} />
              End session
            </Box>
          </Box>
        ) : null}
      </Box>

      <QuizOverlay
        question={quiz}
        onAnswer={tutor.submitQuizAnswer}
        onClose={() => setQuiz(null)}
      />
    </MainLayout>
  );
}

const bannerSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.25,
  px: { xs: 2, md: 3 },
  py: 1.25,
  borderBottom: "1px solid",
  flexShrink: 0,
} as const;

/** The room's ground. A deep violet-black, so the ribbon can carry real luminance. */
const roomShellSx = {
  display: "flex",
  flexDirection: "column",
  // dvh, never vh: 100vh collides with the iOS Safari address bar (DESIGN.md §5).
  height: "calc(100dvh - 64px)",
  background:
    "radial-gradient(115% 90% at 50% 8%, #241653 0%, #170d38 42%, #0b0619 100%)",
  color: "#fff",
} as const;

const ghostBtn = {
  display: "grid",
  placeItems: "center",
  width: 40,
  height: 40,
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.16)",
  bgcolor: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.9)",
  fontFamily: "inherit",
  cursor: "pointer",
  flexShrink: 0,
  transition: "border-color 160ms ease, background-color 160ms ease",
  "&:hover": { borderColor: "#a855f7", bgcolor: "rgba(168,85,247,0.16)" },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px #0b0619, 0 0 0 4px #a855f7",
  },
} as const;

const primaryBtn = {
  px: 2.5,
  py: 1.15,
  borderRadius: "10px",
  border: "none",
  fontFamily: "inherit",
  fontSize: "0.92rem",
  fontWeight: 600,
  color: "#fff",
  bgcolor: "#7c3aed",
  cursor: "pointer",
  "&:hover": { filter: "brightness(1.1)" },
} as const;

const endBtn = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  px: 2,
  py: 1,
  borderRadius: "10px",
  border: "1px solid rgba(236,72,153,0.45)",
  bgcolor: "rgba(236,72,153,0.14)",
  color: "#fbcfe8",
  fontFamily: "inherit",
  fontSize: "0.88rem",
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
  transition: "background-color 160ms ease, border-color 160ms ease",
  "&:hover": { bgcolor: "rgba(236,72,153,0.24)", borderColor: "#ec4899" },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px #0b0619, 0 0 0 4px #ec4899",
  },
} as const;
