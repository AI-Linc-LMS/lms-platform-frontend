"use client";

import { Box, ButtonBase, IconButton, Tab, Tabs, Typography, CircularProgress, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adaptiveVideoService,
  type VideoCompanion as CompanionData,
  type CheckInMarker,
  type ReExplainStyle,
  type StartSessionResult,
  type WatchMode,
} from "@/lib/services/adaptive-video.service";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { notifyContentCompleted } from "@/lib/streak/streakCelebration";
import { useVimeoController } from "./useVimeoController";
import { finishedBefore, restoredAnswers, resumePoint, watchedPercent } from "./progressAcrossVisits";
import { AutoPauseCheckIn } from "./AutoPauseCheckIn";
import { CheckpointOverlay } from "./CheckpointOverlay";
import { ReExplainPanel } from "./ReExplainPanel";
import { ConceptMap } from "./ConceptMap";
import { TimestampQA } from "./TimestampQA";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CompanionCard } from "./CompanionCard";
import { WatchModeSelector, AutoChapters, LiveTakeaways } from "./RailPanels";
import { toEmbedUrl } from "@/lib/utils/video-embed";
import { PHONE } from "@/components/common/mobile/phone";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const TABS: { label: string; icon: string }[] = [
  { label: "AI Companion", icon: "mdi:sparkles" },
  { label: "Transcript", icon: "mdi:text-box-outline" },
  { label: "Description", icon: "mdi:information-outline" },
];

/**
 * The Video surface (the screenshot). Self-contained: starts a watch
 * session, drives the Vimeo player via postMessage, fires auto-pause check-ins on
 * the timeline, and wires the AI Companion tab + adaptive rail to the backend.
 */
export function VideoCompanion({
  configId,
  onCompleted,
}: {
  configId: number;
  /** Fired once the watch has been ended and scored on the server - the point at which the course
   *  counts this video as done, and so the point at which offering "Next" is honest. */
  onCompleted?: () => void;
}) {
  const onCompletedRef = useRef(onCompleted);
  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);
  // The element that goes fullscreen. It has to be the PLAYER BOX and not the iframe, so the
  // check-in overlay - a child of the box - is painted with it.
  const playerBoxRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    // Esc, the platform's own gesture and our button all land here, so the icon never lies.
    const sync = () => setIsFullscreen(document.fullscreenElement === playerBoxRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = useCallback(() => {
    const box = playerBoxRef.current;
    if (!box) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    // Safari on iPhone does not implement this on a div; there is nothing to fall back to that
    // keeps the overlay visible, so the button simply does nothing rather than trapping them in
    // an iframe fullscreen the check-in cannot be seen in.
    void box.requestFullscreen?.().catch(() => {});
  }, []);
  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [watchMode, setWatchMode] = useState<WatchMode>("normal");
  // Auto-generated description (lazily fetched the first time the Description tab is opened).
  const [genDesc, setGenDesc] = useState("");
  const [descLoading, setDescLoading] = useState(false);
  const descTriedRef = useRef(false);
  // "Pause & ask every 60s" watch mode - the second we paused at for a checkpoint (null = none) +
  // the last minute boundary we fired on.
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const lastCheckpointRef = useRef(0);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInMarker | null>(null);
  // Reactive set of answered check-in ids - drives the counter chip + the green
  // timeline markers, so they update the instant an answer lands (a ref wouldn't
  // re-render). shownRef stays a ref: it only gates the auto-pause effect.
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  // Externally-hosted videos report nothing back, so the student says when they are done.
  const [markedWatched, setMarkedWatched] = useState(false);
  const shownRef = useRef<Set<number>>(new Set());
  // What earlier visits left behind: the best coverage of any visit, where an unfinished one
  // stopped, and whether the video was ever finished. Without these every visit started from an
  // empty bar at 0:00 with its concepts locked, finished or not.
  const [saved, setSaved] = useState<{ bestPct: number; session: StartSessionResult["session"] | null; completedBefore: boolean }>(
    { bestPct: 0, session: null, completedBefore: false },
  );
  const [thisVisitPct, setThisVisitPct] = useState(0);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const resumeDoneRef = useRef(false);

  // Destructure the controller into stable locals - passing `setIframe` to a ref taints the
  // whole object for the react-hooks/refs rule, so we never read `ctl.<member>` during render.
  const { setIframe, currentTime, duration, playbackRate, rewinds, endedTick, play, pause, seekTo, setRate } =
    useVimeoController();

  // Real watched-coverage tracking: each whole second actually PLAYED (not skipped) is marked, so
  // points scale with genuine watching - skipping to the end earns little. Refs (not state): these
  // feed the periodic + final sync without re-rendering. coverage = distinct watched secs / duration.
  const watchedRef = useRef<Set<number>>(new Set());
  const prevTimeRef = useRef(0);
  const coverageRef = useRef(0);
  const maxSpeedRef = useRef(1);
  const rewindsRef = useRef(rewinds);

  // --- Session bootstrap -----------------------------------------------------
  useEffect(() => {
    let alive = true;
    adaptiveVideoService
      // No mode: the server defaults a rewatch to rewatch mode, which is what decides whether the
      // questions are in this payload.
      .startSession(configId)
      .then((res) => {
        if (!alive) return;
        setCompanion(res.companion);
        setSessionId(res.session_id);
        // The check-ins this learner has already passed, whichever visit they passed them on.
        // Seeding BOTH the reactive set (green markers + counter) and the shown-ref (the
        // auto-pause gate) is what stops a finished concept being re-examined on the way back.
        const passed = restoredAnswers(res.companion.my_passed_check_in_ids);
        setAnswered(passed);
        passed.forEach((id) => shownRef.current.add(id));
        setSaved({
          bestPct: Math.max(res.companion.my_best_completeness_pct ?? 0, res.session?.completeness_pct ?? 0),
          session: res.session ?? null,
          completedBefore: finishedBefore(res.companion),
        });
        // Reflect what the server actually opened, so the rail shows the mode in force rather than
        // the one this component happened to initialise with.
        if (res.session?.watch_mode) setWatchMode(res.session.watch_mode);
      })
      .catch(() => alive && setLoadError("This video companion isn't available right now."));
    return () => {
      alive = false;
    };
  }, [configId]);

  // Mark each whole second actually played into watchedRef. A small forward delta is normal playback;
  // a large jump is a seek/skip and is NOT counted - so skipping ahead doesn't earn coverage.
  //
  // Declared BEFORE the auto-pause effect on purpose: effects run in declaration order, and the
  // check-in gate below reads watchedRef for the tick that just landed.
  useEffect(() => {
    const prev = prevTimeRef.current;
    prevTimeRef.current = currentTime;
    const delta = currentTime - prev;
    if (delta > 0 && delta <= 1.5) {
      for (let s = Math.floor(prev); s <= Math.floor(currentTime); s++) watchedRef.current.add(s);
    }
    coverageRef.current = duration > 0 ? Math.min((watchedRef.current.size / duration) * 100, 100) : 0;
    const whole = Math.floor(coverageRef.current);
    setThisVisitPct((prev) => (prev === whole ? prev : whole));
  }, [currentTime, duration]);

  // Pick an unfinished visit up where it stopped, once, as soon as the player can seek. A seek is
  // a jump, so it is not counted as watched and the check-ins before it do not fire again.
  const resumeAt = duration > 0 ? resumePoint(saved.session, duration) : null;
  useEffect(() => {
    // Waits for BOTH the player (duration) and the session: a cached player can report its
    // duration before the session request returns, and deciding then would never resume.
    if (resumeDoneRef.current || duration <= 0 || !saved.session) return;
    resumeDoneRef.current = true;
    if (resumeAt !== null) seekTo(resumeAt);
  }, [duration, resumeAt, saved.session, seekTo]);

  // --- Check-in auto-pause ---------------------------------------------------
  useEffect(() => {
    if (!companion || activeCheckIn) return;
    // Rewatch mode is the one that asks nothing. The server already withholds the questions from
    // the payload, so `companion.check_ins` is empty and this loop finds nothing to fire; the
    // explicit bail is here so the intent survives a future change that starts sending them.
    if (watchMode === "rewatch") return;
    // Fire the FIRST un-shown, un-answered check-in whose moment has actually been WATCHED.
    //
    // Reaching a timestamp is not the same as viewing it. Gating on position alone meant that
    // jumping via the chapter rail or the timeline armed a probe, while a learner playing the video
    // straight through got none - the clock only moved on a seek (see useVimeoController). Requiring
    // the marker's second to be in watchedRef makes playback the trigger and leaves the chapter rail
    // a review affordance, which is the behaviour the surface promises.
    //
    // The +/-1s tolerance absorbs a dropped tick; watchedRef only ever records playback-sized
    // deltas, so a pure jump still arms nothing until the learner actually watches.
    // Still a catch-up scan rather than an edge test, so a coarse tick can't drop a marker forever.
    const played = (ts: number) => {
      const sec = Math.floor(ts);
      return watchedRef.current.has(sec) || watchedRef.current.has(sec - 1) || watchedRef.current.has(sec + 1);
    };
    const due = companion.check_ins
      .filter(
        (c) =>
          !shownRef.current.has(c.id) &&
          !answered.has(c.id) &&
          currentTime >= c.timestamp_seconds &&
          played(c.timestamp_seconds),
      )
      .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)[0];
    if (due) {
      shownRef.current.add(due.id);
      pause();
      setActiveCheckIn(due);
    }
  }, [currentTime, companion, activeCheckIn, pause, answered, watchMode]);

  // Every offered watch mode plays at normal speed; the rate is asserted once the player is wired
  // so a mode change never leaves a stale rate behind.
  useEffect(() => {
    setRate(1);
  }, [watchMode, setRate]);

  // --- Watch mode: pause & ask every 60s ------------------------------------
  // Mirrors the check-in auto-pause above: a ref gates re-fires (advances to the current minute),
  // so this never loops, and we don't depend on the `checkpoint` state it sets.
  useEffect(() => {
    if (watchMode !== "pause_60s" || !companion || activeCheckIn) return;
    const minute = Math.floor(currentTime / 60);
    if (minute >= 1 && minute > lastCheckpointRef.current) {
      lastCheckpointRef.current = minute;
      pause();
      // Player-time-driven external sync (same shape as the check-in auto-pause above); the ref
      // gate makes it fire at most once per minute, so there's no cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckpoint(currentTime);
    }
  }, [currentTime, watchMode, companion, activeCheckIn, pause]);

  // --- Periodic sync of watch signals ---------------------------------------
  const completeness = useMemo(
    () => (duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0),
    [currentTime, duration]
  );

  // Keep the max-speed + rewinds high-water marks in refs for the (ref-reading) syncs below.
  useEffect(() => { if (playbackRate > maxSpeedRef.current) maxSpeedRef.current = playbackRate; }, [playbackRate]);
  useEffect(() => { rewindsRef.current = rewinds; }, [rewinds]);

  // Periodic save of watch signals. Reads everything from refs at fire time, so the interval isn't
  // torn down on every timeupdate (it would never reach 10s otherwise) and the BE gets true coverage.
  useEffect(() => {
    if (!sessionId) return;
    const t = setInterval(() => {
      adaptiveVideoService
        .sync(sessionId, {
          current_timestamp: prevTimeRef.current,
          completeness_pct: coverageRef.current,
          max_speed: maxSpeedRef.current,
          watch_mode: watchMode,
          rewinds: rewindsRef.current.length ? rewindsRef.current : undefined,
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, [sessionId, watchMode]);

  // Flush the FINAL coverage/speed, THEN end + score (so the award reflects everything watched,
  // including the last stretch the periodic sync may not have sent yet). Server-side this is
  // idempotent + monotonic (upgradeable award keyed on video:<config.id>), so firing it from
  // several triggers is safe and never lowers a prior award.
  const endAndScore = useCallback(() => {
    if (!sessionId) return;
    adaptiveVideoService
      .sync(sessionId, {
        current_timestamp: prevTimeRef.current,
        completeness_pct: coverageRef.current,
        max_speed: maxSpeedRef.current,
        rewinds: rewindsRef.current.length ? rewindsRef.current : undefined,
      })
      .catch(() => {})
      .finally(() => {
        adaptiveVideoService
          .endSession(sessionId)
          .then(() => {
            notifyContentCompleted();
            onCompletedRef.current?.();
          })
          .catch(() => {});
      });
  }, [sessionId]);
  const endRef = useRef(endAndScore);
  useEffect(() => {
    endRef.current = endAndScore;
  }, [endAndScore]);

  // Score the watch the moment the video REACHES THE END - not only on navigation-away unmount,
  // which is what left a completed watch stuck at 0/25 (the ScoreEvent never fired).
  useEffect(() => {
    if (endedTick > 0) endRef.current();
  }, [endedTick]);

  // Also flush on page hide/close (tab close / hard navigation), where the unmount cleanup's async
  // request would otherwise be dropped.
  useEffect(() => {
    const flush = () => endRef.current();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  // Unmount fallback (SPA navigation away before the video ends).
  useEffect(() => {
    return () => endRef.current();
  }, []);

  // --- Handlers --------------------------------------------------------------
  const onAnswer = useCallback(
    async (letter: string, timeMs: number) => {
      if (!sessionId || !activeCheckIn) throw new Error("no session");
      const r = await adaptiveVideoService.answerCheckIn(sessionId, activeCheckIn.id, letter.toLowerCase(), timeMs);
      setAnswered((prev) => new Set(prev).add(activeCheckIn.id));
      return r;
    },
    [sessionId, activeCheckIn]
  );
  const onReExplain = useCallback(
    (style: ReExplainStyle) => {
      if (!sessionId) return Promise.reject();
      return adaptiveVideoService.reExplain(sessionId, currentTime, style);
    },
    [sessionId, currentTime]
  );
  const onAsk = useCallback(
    (q: string, ts: number) => {
      if (!sessionId) return Promise.reject();
      return adaptiveVideoService.ask(sessionId, q, ts);
    },
    [sessionId]
  );
  // Switch tabs; lazily generate the description the first time its tab is opened (event-driven, so
  // the generation kick-off isn't a synchronous setState inside an effect).
  const onTabChange = useCallback(
    (v: number) => {
      setTab(v);
      if (v !== 2 || !companion || companion.description || genDesc || descLoading || descTriedRef.current) return;
      descTriedRef.current = true;
      setDescLoading(true);
      adaptiveVideoService
        .generateDescription(configId)
        .then(setGenDesc)
        .catch(() => {})
        .finally(() => setDescLoading(false));
    },
    [companion, genDesc, descLoading, configId]
  );

  if (loadError)
    return (
      <CompanionCard accent="#ec4899" sx={{ textAlign: "center", py: 5 }}>
        <Icon icon="mdi:video-off-outline" width={32} style={{ color: "#94a3b8" }} />
        <Typography sx={{ mt: 1, color: "text.secondary" }}>{loadError}</Typography>
      </CompanionCard>
    );
  if (!companion || !sessionId)
    return (
      <Box sx={{ p: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: "text.secondary", fontSize: "0.85rem" }}>Warming up your companion…</Typography>
      </Box>
    );
  // `play_url` is the field to gate on, NOT `video`. Only CATALOG videos have a Vimeo record;
  // a pasted link has `video: null` and its URL in play_url. Checking `video` told every student
  // who reached an admin's pasted video that no video was attached — while the link sat in the
  // payload, and in the admin's builder, plainly attached.
  const playUrl = companion.play_url || companion.video?.embed_url || "";
  const isExternal = companion.source === "external" || (!companion.video && !!companion.play_url);
  if (!playUrl)
    return (
      <CompanionCard accent="#6366f1" sx={{ textAlign: "center", py: 5 }}>
        <Typography sx={{ color: "text.secondary" }}>No video is attached to this companion yet.</Typography>
      </CompanionCard>
    );

  // A watch URL cannot be framed; the id has to be moved into the provider's embed form.
  const rawEmbed = toEmbedUrl(playUrl, companion.source);
  // Vimeo's own fullscreen button fullscreens the IFRAME, and a check-in painted over the player
  // is the iframe's SIBLING - so the browser never draws it and the learner has to leave
  // fullscreen to answer, which resumes the video under them. Hiding that button and offering our
  // own, which fullscreens the container, keeps the check-in inside the fullscreen subtree.
  const embed = /player\.vimeo\.com\//.test(rawEmbed)
    ? `${rawEmbed}${rawEmbed.includes("?") ? "&" : "?"}fullscreen=0`
    : rawEmbed;
  // Video/module names often arrive snake_cased (e.g. "Module_01_Java_Fundamentals…"); show them humanized.
  // Falls back to the companion's own title, which is all a pasted link has.
  const displayTitle = (companion.video?.title || companion.title || "").replace(/_/g, " ").trim();
  // Finished before, or finished just now: every concept has been covered, so none is locked.
  const finished = saved.completedBefore || endedTick > 0;
  // An externally-hosted video reports nothing back, so "I've finished watching" is the only way
  // it is ever marked done - and the button has to remember it was pressed. It used to reset on
  // every visit, so a learner who had already finished such a video was asked to declare it again,
  // which is the report in its plainest form.
  //
  // It keys on the COVERAGE, not on `finished`. `finished` is the completion record, which
  // `end_session` writes after three seconds on the page, and on an external video this button is
  // the only thing that ever writes coverage at all (it sets it to exactly 100 below). Keying on
  // `finished` would have disabled the button for a learner who merely opened such a video once -
  // leaving them looking at "Marked as watched" they never pressed, unable to press it, and their
  // award pegged at zero coverage forever. Two learner-videos on prod are in that state today.
  const declaredWatched = markedWatched || saved.bestPct >= 100;
  // The checks counter. Rewatch mode ships no check-ins at all, so a learner returning with four
  // passed ones would have read "4/0"; and a video that has no check-ins has nothing to count.
  const checksChip =
    companion.check_ins.length > 0
      ? `${Math.min(answered.size, companion.check_ins.length)}/${companion.check_ins.length} checks`
      : answered.size > 0
        ? `${answered.size} check${answered.size === 1 ? "" : "s"} passed`
        : "";
  // Completed, but this visit is still being asked the video's checks.
  //
  // The badge keys on the completion record and the check-in gate keys on the watch mode, and
  // those two rules have just been pulled apart on purpose: a learner who ended a watch without
  // getting through the video is completed (they keep their tick) AND is no longer exempt from the
  // questions. A flat "Completed" over a video that then stops to ask eight questions reads as a
  // bug, so this one state says what is actually true. The rule is unchanged - only the wording.
  const checksPending =
    finished && companion.check_ins.length > 0 && answered.size < companion.check_ins.length;
  const conceptTime = finished ? Number.MAX_SAFE_INTEGER : currentTime;
  const watchedConcepts = companion.concept_map?.nodes?.filter((n) => conceptTime >= (n.timestamp_seconds ?? 0)).length ?? 0;
  const watchedPct = finished ? 100 : watchedPercent(saved.bestPct, thisVisitPct);

  return (
    <Box>
      <AdaptiveSectionHero
        chapter="Watch · Adaptive"
        title={displayTitle}
        subtitle={companion.instructions || "A comprehension companion that watches whether the watching actually worked."}
        icon="mdi:play-circle-outline"
        accent="indigo"
        rightSlot={
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.5, py: 0.7, borderRadius: 999,
            background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", fontWeight: 800, fontSize: "0.74rem", [PHONE]: { fontSize: "0.75rem" },
            boxShadow: "0 12px 26px -14px rgba(168,85,247,0.7)" }}>
            <Box sx={{ width: 7, height: 7, borderRadius: 999, bgcolor: "#fff", animation: "acb-pulse 1.4s ease-in-out infinite" }} />
            Companion ON
          </Box>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 2.5, mt: 1 }}>
        {/* Main column */}
        <Box sx={{ minWidth: 0 }}>
          {/* Player */}
          <Box
            ref={playerBoxRef}
            sx={{
              position: "relative",
              borderRadius: isFullscreen ? 0 : 3,
              overflow: "hidden",
              // Fullscreen makes the box the whole screen; a 16/9 box inside it would letterbox
              // twice and leave the check-in floating in the margin.
              aspectRatio: isFullscreen ? "auto" : "16 / 9",
              height: isFullscreen ? "100%" : undefined,
              background: "#0f0c29",
              border: "1px solid var(--border-default, #ececf1)",
              boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 18px 40px -28px rgba(16,24,40,0.35)",
              // A phone-width 16/9 player is ~200px tall: a check-in or checkpoint painted inside it
              // had a question and four answers to fit in that. While one is open (the video is
              // paused), the box grows to give it room, then returns to 16/9.
              ...((activeCheckIn || checkpoint !== null) && !isFullscreen
                ? { [PHONE]: { aspectRatio: "auto", height: "min(560px, 72vh)" } }
                : {}),
            }}
          >
            <iframe
              ref={setIframe}
              src={embed}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: 0 }}
              title={companion.title}
            />
            {/* Ours, not the provider's: this fullscreens the BOX, so a check-in is painted with
                it. Sits above the player's own control bar. */}
            <IconButton
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
              size="small"
              sx={{
                position: "absolute", right: 8, bottom: 52, zIndex: 15,
                color: "#fff", bgcolor: "rgba(15,12,41,0.55)",
                "&:hover": { bgcolor: "rgba(15,12,41,0.8)" },
                [PHONE]: { width: 44, height: 44 },
              }}
            >
              <IconWrapper
                icon={isFullscreen ? "mdi:fullscreen-exit" : "mdi:fullscreen"}
                size={20}
              />
            </IconButton>
            {activeCheckIn && (
              <AutoPauseCheckIn
                checkIn={activeCheckIn}
                onAnswer={onAnswer}
                onContinue={() => {
                  setActiveCheckIn(null);
                  play();
                }}
                onRewind={(s) => {
                  seekTo(s);
                  setActiveCheckIn(null);
                  play();
                }}
              />
            )}
            {checkpoint !== null && !activeCheckIn && (
              <CheckpointOverlay
                timestamp={checkpoint}
                onAsk={onAsk}
                onResume={() => {
                  setCheckpoint(null);
                  play();
                }}
              />
            )}
          </Box>

          {/* An externally-hosted video is a plain iframe: no transcript, so no check-ins, and no
              player API, so nothing reports back how much was watched. Coverage stays at 0 no
              matter how long the student sits there, and the watch would score nothing.

              Rather than let that look like a bug, say what is true and give them the one action
              that matters. The server treats scoring as idempotent and monotonic, so pressing
              this after some coverage has accrued can only ever raise the award. */}
          {isExternal && (
            <Box
              sx={{
                mt: 2, mb: 1, p: 1.5, borderRadius: 2.5, display: "flex", alignItems: "center",
                gap: 1.5, flexWrap: "wrap",
                border: "1px solid color-mix(in srgb, #6366f1 28%, transparent)",
                bgcolor: "color-mix(in srgb, #6366f1 5%, transparent)",
              }}
            >
              <Icon icon="mdi:information-outline" width={18} style={{ color: "#6366f1" }} />
              <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", flex: 1, minWidth: 220 }}>
                This video is hosted elsewhere, so there are no comprehension check-ins and it
                can&apos;t track your progress automatically.
              </Typography>
              <ButtonBase
                onClick={() => {
                  if (declaredWatched) return;
                  coverageRef.current = 100;
                  setMarkedWatched(true);
                  endRef.current();
                }}
                disabled={declaredWatched}
                data-testid="mark-watched"
                sx={{
                  px: 2, py: 0.9, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem", gap: 0.6,
                  [PHONE]: { minHeight: 44 },
                  color: "#fff", background: declaredWatched
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "linear-gradient(135deg, #6366f1, #a855f7)",
                }}
              >
                <Icon icon={declaredWatched ? "mdi:check-circle" : "mdi:check"} width={16} />
                {declaredWatched ? "Marked as watched" : "I've finished watching"}
              </ButtonBase>
            </Box>
          )}

          {/* Companion timeline strip - check-in markers (spec §3.2b) */}
          <Box sx={{ position: "relative", height: 8, mt: 2, mb: 1, borderRadius: 999,
            background: "color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)" }}>
            {/* What has been watched, this visit or any earlier one - under the playhead. */}
            <Box data-testid="watched-track" sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${watchedPct}%`, borderRadius: 999,
              background: "color-mix(in srgb, #a855f7 28%, transparent)", transition: "width 400ms ease" }} />
            <Box data-testid="playhead-track" sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${completeness}%`, borderRadius: 999,
              background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)", transition: "width 400ms ease" }} />
            {duration > 0 &&
              companion.check_ins.map((c) => {
                const isAnswered = answered.has(c.id);
                return (
                  <Tooltip key={c.id} title={`${fmt(c.timestamp_seconds)} · ${c.concept || "Check-in"}`} arrow>
                    <Box
                      onClick={() => seekTo(Math.max(c.timestamp_seconds - 2, 0))}
                      sx={{
                        position: "absolute", top: "50%", left: `${(c.timestamp_seconds / duration) * 100}%`,
                        transform: "translate(-50%, -50%)", width: 13, height: 13, borderRadius: 999, cursor: "pointer",
                        background: isAnswered ? "#16a34a" : "linear-gradient(135deg, #6366f1, #ec4899)",
                        border: "2.5px solid var(--card-bg, #fff)",
                        boxShadow: isAnswered ? "0 0 0 3px color-mix(in srgb,#16a34a 25%,transparent)" : "0 0 10px color-mix(in srgb,#a855f7 70%,transparent)",
                        transition: "transform 120ms ease", "&:hover": { transform: "translate(-50%, -50%) scale(1.25)" },
                        // A 13px dot is not a target for a thumb: an invisible 44px hit area around it.
                        [PHONE]: { "&::after": { content: '""', position: "absolute", inset: -16, borderRadius: "50%" } },
                      }}
                    />
                  </Tooltip>
                );
              })}
          </Box>
          <Box data-testid="video-progress-meta" sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.25, [PHONE]: { flexWrap: "wrap", rowGap: 1 } }}>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
              {fmt(currentTime)} / {fmt(duration)}
            </Typography>
            <Chip icon="mdi:sitemap-outline" label={`${watchedConcepts} concepts`} />
            {checksChip && <Chip icon="mdi:lightning-bolt" label={checksChip} />}
            {finished ? (
              <Box data-testid="video-completed" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25, borderRadius: 999,
                fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800,
                color: checksPending ? "#a16207" : "#15803d",
                bgcolor: checksPending
                  ? "color-mix(in srgb, #eab308 16%, transparent)"
                  : "color-mix(in srgb, #16a34a 12%, transparent)" }}>
                <Icon icon={checksPending ? "mdi:check-circle-outline" : "mdi:check-circle"} width={14} />
                {checksPending ? "Completed · checks pending" : "Completed"}
              </Box>
            ) : watchedPct >= 1 ? (
              <Typography sx={{ fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 700, color: "text.secondary" }}>{Math.round(watchedPct)}% watched</Typography>
            ) : null}
          </Box>
          {resumeAt !== null && !resumeDismissed && (
            <Box data-testid="resumed-note" sx={{ display: "flex", alignItems: "center", gap: 1, mt: -1.5, mb: 2, fontSize: "0.78rem", color: "text.secondary", [PHONE]: { flexWrap: "wrap", rowGap: 0 } }}>
              <Icon icon="mdi:history" width={15} />
              Picked up at {fmt(resumeAt)}, where you left off.
              <ButtonBase onClick={() => { seekTo(0); setResumeDismissed(true); }} sx={{ fontWeight: 700, color: "#6366f1", fontSize: "0.78rem", [PHONE]: { minHeight: 44 } }}>
                Start from the beginning
              </ButtonBase>
            </Box>
          )}

          {/* Companion tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => onTabChange(v)}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              minHeight: 0, mb: 2.5,
              "& .MuiTabs-indicator": { display: "none" },
            }}
          >
            {TABS.map((t) => (
              <Tab
                key={t.label}
                disableRipple
                icon={<Icon icon={t.icon} width={16} />}
                iconPosition="start"
                label={t.label}
                sx={{
                  textTransform: "none", minHeight: 0, py: 0.85, px: 1.75, mr: 1, borderRadius: 999, fontWeight: 700, fontSize: "0.84rem",
                  [PHONE]: { minHeight: 44 },
                  color: "text.secondary", border: "1px solid transparent", minWidth: 0,
                  "&.Mui-selected": {
                    color: "#fff",
                    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                    boxShadow: "0 12px 24px -14px rgba(168,85,247,0.7)",
                  },
                }}
              />
            ))}
          </Tabs>

          {tab === 0 && (
            <CompanionCard accent="#6366f1" title="Concepts so far" icon="mdi:sitemap-outline">
              <ConceptMap data={companion.concept_map} currentTime={conceptTime} />
              <TimestampQA currentTime={currentTime} onAsk={onAsk} />
            </CompanionCard>
          )}
          {tab === 1 && (
            <CompanionCard accent="#a855f7" title="Transcript" icon="mdi:text-box-outline">
              <Box sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}>
                {companion.transcript_segments.map((s, i) => {
                  const active = currentTime >= s.start_seconds && currentTime < s.end_seconds;
                  return (
                    <Box
                      key={i}
                      onClick={() => seekTo(s.start_seconds)}
                      sx={{
                        display: "flex", gap: 1.5, mb: 0.5, px: 1, py: 0.6, borderRadius: 1.5, cursor: "pointer",
                        background: active ? "color-mix(in srgb, #6366f1 10%, transparent)" : "transparent",
                        "&:hover": { background: "color-mix(in srgb, #6366f1 6%, transparent)" },
                      }}
                    >
                      <Typography sx={{ fontSize: "0.74rem", [PHONE]: { fontSize: "0.75rem" }, color: active ? "#6366f1" : "text.secondary", minWidth: 44, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {fmt(s.start_seconds)}
                      </Typography>
                      <Typography sx={{ fontSize: "0.86rem", fontWeight: active ? 700 : 400 }}>{s.text}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </CompanionCard>
          )}
          {tab === 2 && (
            <CompanionCard accent="#10b981" title="Description" icon="mdi:information-outline">
              {(() => {
                const description = companion.description || genDesc;
                if (descLoading && !description) {
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                      <CircularProgress size={15} thickness={5} sx={{ color: "#a855f7" }} />
                      <Typography sx={{ fontSize: "0.85rem" }}>Generating a summary from the transcript…</Typography>
                    </Box>
                  );
                }
                return (
                  <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {description || companion.instructions || companion.video?.description || "No description."}
                  </Typography>
                );
              })()}
            </CompanionCard>
          )}
        </Box>

        {/* Right rail */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <WatchModeSelector
            value={watchMode}
            rewatchAvailable={Boolean(companion.rewatch_available)}
            onChange={(m) => {
              setWatchMode(m);
              if (sessionId) adaptiveVideoService.sync(sessionId, { watch_mode: m }).catch(() => {});
            }}
          />
          <ReExplainPanel onReExplain={onReExplain} />
          <AutoChapters chapters={companion.chapters} currentTime={currentTime} onJump={(s) => seekTo(s)} />
          <LiveTakeaways takeaways={companion.takeaways} currentTime={currentTime} chapters={companion.chapters} />
        </Box>
      </Box>

      <style jsx global>{`
        @keyframes acb-pulse { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity: 0.4; transform: scale(0.8);} }
      `}</style>
    </Box>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 1, py: 0.35, borderRadius: 999,
      background: "color-mix(in srgb, #6366f1 9%, transparent)", color: "#6366f1", fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800 }}>
      <Icon icon={icon} width={13} />
      {label}
    </Box>
  );
}

export default VideoCompanion;
