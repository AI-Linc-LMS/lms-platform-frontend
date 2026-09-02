"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { PHASE_LABEL, TutorVoice } from "@/components/ai-tutor/room/TutorVoice";
import { CanvasStage } from "@/components/ai-tutor/room/CanvasStage";
import { LessonPlanRail } from "@/components/ai-tutor/room/LessonPlanRail";
import { QuizOverlay } from "@/components/ai-tutor/room/QuizOverlay";
import { IdePanel } from "@/components/ai-tutor/room/IdePanel";
import { ConversationPanel } from "@/components/ai-tutor/room/ConversationPanel";
import { useRealtimeTutor } from "@/lib/hooks/useRealtimeTutor";
import { aiTutorKeys } from "@/lib/services/ai-tutor.service";
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

/**
 * Room to the right of the transport bar for the fixed support FAB.
 *
 * Measured rather than eyeballed: `ReportIssueFAB` is a default-size MUI `Fab` (56px) at
 * `insetInlineEnd: 24`, so it occupies 24px to 80px from the right edge. The previous 72px
 * reserved less than that, and "End session" slid under the headset button - which is a bad
 * pair of controls to overlap, since one ends a paid session and the other opens a support
 * dialog. 96 clears the FAB with a 16px gap.
 */
const FAB_CLEARANCE = 96;

export default function TutorSessionPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const topic = search.get("topic") ?? "";
  const level = (search.get("level") as TutorLevel) || "beginner";
  const minutes = Number(search.get("minutes") ?? 20);
  const slug = search.get("slug") ?? undefined;
  const source = search.get("source") ?? undefined;

  const [plan, setPlan] = useState<LessonPlanSection[]>([]);
  const [quiz, setQuiz] = useState<PooledQuestion | null>(null);
  /**
   * Which panel the side dock is showing. One slot, so this is a selector rather than two
   * independent booleans - two 470px panels plus the canvas does not fit on a laptop.
   */
  const [dock, setDock] = useState<"editor" | "conversation" | null>(null);
  const [ide, setIde] = useState<{
    /** Whether the editor EXISTS. Distinct from whether the dock is currently showing it. */
    opened: boolean;
    language: string;
    task: string;
    starter?: string;
  }>({ opened: false, language: "python", task: "" });
  /**
   * The learner's code, owned here rather than by IdePanel.
   *
   * IdePanel unmounts whenever the dock switches to the conversation, and it used to own this in
   * local state, so reading back what the tutor said destroyed whatever the learner had typed.
   * The tutor could cause it too, since `close_ide` is a tool the model calls on its own.
   */
  const [codeBuffer, setCodeBuffer] = useState("");
  const [runRequest, setRunRequest] = useState<{ nonce: number; stdin: string }>({
    nonce: 0,
    stdin: "",
  });
  const [planOpen, setPlanOpen] = useState(false);

  const codeBufferRef = useRef("");
  codeBufferRef.current = codeBuffer;
  const ideRef = useRef(ide);
  ideRef.current = ide;
  const launchedRef = useRef(false);

  const tutor = useRealtimeTutor({
    onQuiz: setQuiz,
    onOpenIde: ({ language, task, starter_code }) => {
      setIde({ opened: true, language, task, starter: starter_code });
      // Show it. Without this the model could "open" an editor that stayed behind the
      // conversation panel, and then talk about code the learner could not see.
      setDock("editor");
    },
    // The learner can say "close the editor" and the tutor calls close_ide. The buffer lives in
    // this component, so closing hides the panel and never discards their work.
    onCloseIde: () => setDock((prev) => (prev === "editor" ? null : prev)),
    onRunCode: (stdin) => setRunRequest((prev) => ({ nonce: prev.nonce + 1, stdin })),
    // Read from the buffer directly. This used to go through a ref that IdePanel registered on
    // mount and never cleared, so after the panel unmounted the model was served the code of an
    // editor that was no longer on screen.
    readStudentCode: () =>
      ideRef.current.opened
        ? { language: ideRef.current.language, code: codeBufferRef.current }
        : null,
    onError: (message) => showToast(message, "error"),
  });

  const { start, end, phase, sessionId, cards } = tutor;

  // A quiz is deliberately silent - the tutor says one line and waits while the learner reads -
  // so the idle watchdog must not read that as an abandoned tab and hang up mid-question. The
  // hook also uses this to refuse a second `show_quiz` while one is on screen, which is what
  // stopped the tutor replacing a question the learner was still answering.
  useEffect(() => {
    tutor.setQuizOpen(Boolean(quiz));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

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

  /** The dock holds one panel, so each toggle both selects and deselects. */
  const openEditor = useCallback(() => {
    setIde((prev) => (prev.opened ? prev : { ...prev, opened: true }));
    setDock((prev) => (prev === "editor" ? null : "editor"));
  }, []);

  const openConversation = useCallback(() => {
    setDock((prev) => (prev === "conversation" ? null : "conversation"));
  }, []);

  const leave = useCallback(async () => {
    const id = sessionId;
    await end("learner");
    // The dashboard query has a 60s staleTime and is persisted to localStorage, so without an
    // explicit invalidation a learner coming out of a lesson sees their PRE-lesson minutes and
    // reasonably concludes the meter is broken. The minutes were only just debited server-side
    // by `end`, so this has to happen after it.
    void queryClient.invalidateQueries({ queryKey: aiTutorKeys.dashboard });
    router.replace(id ? `/ai-tutor/session/${id}/recap` : "/ai-tutor");
  }, [end, queryClient, router, sessionId]);

  /**
   * The session can end WITHOUT the learner clicking anything: the heartbeat ends it when the
   * time cap is reached, and the idle watchdog ends it after 150s of silence - which is what
   * happens once the tutor has said goodbye and both parties go quiet.
   *
   * Nothing reacted to that. The room stayed on screen with the orb frozen and the label
   * reading "Session ended", and the learner had to press End session to get out - a click that
   * did nothing except navigate, because `end()` returns immediately once the session is closed.
   *
   * `ended` is only ever set by `end()`, which has already torn down the transport and settled
   * the row, so this navigates and must NOT end anything itself. The dashboard invalidation is
   * repeated here for the same reason `leave` has it: the minutes were just debited and that
   * query has a 60s staleTime.
   */
  useEffect(() => {
    if (phase !== "ended") return;
    void queryClient.invalidateQueries({ queryKey: aiTutorKeys.dashboard });
    router.replace(sessionId ? `/ai-tutor/session/${sessionId}/recap` : "/ai-tutor");
  }, [phase, sessionId, queryClient, router]);

  // A modal must not survive into the navigation, and a quiz submitted against a settled
  // session would be graded against a row that is already closed.
  useEffect(() => {
    if (phase === "ending" || phase === "ended") setQuiz(null);
  }, [phase]);

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
      <MainLayout hideSidebar fullPage fullWidthContent hideAppBar>
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
    <MainLayout hideSidebar fullPage fullWidthContent hideAppBar>
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
                    /**
                     * A plain ease-out, not DESIGN.md's overshoot curve.
                     *
                     * The overshoot (the trailing 1.1) suits an element that enters and settles,
                     * and is wrong here: this container holds a WebGL surface that re-fits on every
                     * size change, so the bounce made the ribbon visibly rescale twice. Together
                     * with the framebuffer reallocation that used to happen on every frame of this
                     * animation, the transition juddered.
                     */
                    transition: "height 380ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                    willChange: "height",
                  }}
                >
                  <TutorVoice phase={phase} getLevels={tutor.getLevels} />
                </Box>

                {/* No on-screen captions.

                    They were removed on purpose. A live transcript under the orb competes with
                    the thing it is describing: the learner reads ahead of the voice, and the
                    canvas card below moved every time a sentence arrived. The phase pill above
                    already says whether the tutor is listening or speaking, which is the only
                    part of that block anyone needed at a glance.

                    The transcript is NOT lost. `tutor.caption` still feeds the conversation
                    panel, where reading back through a record is the actual job, and the recap
                    keeps the full transcript after the session. */}

                {/* Canvas */}
                {hasCards ? (
                  // pt replaces the separation the caption slot used to provide, so the first
                  // card does not butt straight up against the orb.
                  <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, md: 3 }, pt: 2, pb: 3 }}>
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

          {/* The side dock. Editor and conversation share one 470px slot: both plus the canvas
              does not fit on a laptop, and stacking them would make both cramped.

              IdePanel stays MOUNTED once opened, hidden with `display` rather than unmounted,
              because Monaco is expensive to re-create and because unmounting it used to be how
              the learner's code got destroyed. The buffer now lives in this component, so the
              mount is about editor state (cursor, undo history, scroll) rather than the text. */}
          {ide.opened || dock ? (
            <Box
              sx={{
                display: dock ? "block" : "none",
                width: { xs: "100%", md: 470 },
                flexShrink: 0,
                position: { xs: "absolute", md: "static" },
                inset: { xs: 0, md: "auto" },
                zIndex: { xs: 10, md: "auto" },
              }}
            >
              {ide.opened ? (
                <Box
                  sx={{ display: dock === "editor" ? "block" : "none", height: "100%" }}
                >
                  <IdePanel
                    open
                    sessionId={sessionId}
                    language={ide.language}
                    task={ide.task}
                    starterCode={ide.starter}
                    onClose={() => setDock(null)}
                    onShareCode={tutor.shareCode}
                    onRunResult={tutor.reportRunResult}
                    runRequestNonce={runRequest.nonce}
                    runStdin={runRequest.stdin}
                    value={codeBuffer}
                    onValueChange={setCodeBuffer}
                  />
                </Box>
              ) : null}
              {dock === "conversation" ? (
                <ConversationPanel
                  entries={tutor.transcript}
                  liveCaption={tutor.phase === "speaking" ? tutor.caption : ""}
                  onClose={() => setDock(null)}
                />
              ) : null}
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
              onClick={openEditor}
              aria-pressed={dock === "editor"}
              sx={{ ...dockBtn, ...(dock === "editor" ? dockBtnOn : null) }}
            >
              <Icon icon="solar:code-square-bold-duotone" width={17} />
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {dock === "editor" ? "Hide editor" : "Editor"}
              </Box>
            </Box>

            <Box
              component="button"
              type="button"
              onClick={openConversation}
              aria-pressed={dock === "conversation"}
              sx={{ ...dockBtn, ...(dock === "conversation" ? dockBtnOn : null) }}
            >
              <Icon icon="solar:chat-round-line-bold-duotone" width={17} />
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {dock === "conversation" ? "Hide conversation" : "Conversation"}
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
        tutorCaption={tutor.caption}
        tutorSpeaking={tutor.phase === "speaking"}
        tutorTurnId={tutor.tutorTurnId}
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
  /**
   * The FULL viewport, not viewport-minus-64.
   *
   * The 64px was reserving space for the global app bar. The room now hides that bar
   * (`hideAppBar`), so the subtraction left a 64px strip of the light page background below the
   * transport bar - a white band across the bottom of an otherwise black screen, which is the
   * same class of defect hiding the app bar was meant to fix.
   *
   * dvh, never vh: 100vh collides with the iOS Safari address bar (DESIGN.md §5).
   */
  height: "100dvh",
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

/** A transport toggle. Pressed reads as a real state, not just a hover leftover. */
const dockBtn = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  height: 40,
  px: 1.75,
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.16)",
  bgcolor: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.9)",
  fontFamily: "inherit",
  fontSize: "0.85rem",
  fontWeight: 500,
  cursor: "pointer",
  flexShrink: 0,
  whiteSpace: "nowrap",
  transition: "border-color 160ms ease, background-color 160ms ease, color 160ms ease",
  "&:hover": { borderColor: "#a855f7", bgcolor: "rgba(168,85,247,0.16)" },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px #0b0619, 0 0 0 4px #a855f7",
  },
} as const;

const dockBtnOn = {
  borderColor: "#a855f7",
  bgcolor: "rgba(168,85,247,0.22)",
  color: "#fff",
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
