"use client";

import { Box, ButtonBase, IconButton, Tab, Tabs, Typography, CircularProgress, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { answeredThisWatch, finishedBefore, passedBefore, resumePoint, watchedPercent } from "./progressAcrossVisits";
import { AutoPauseCheckIn } from "./AutoPauseCheckIn";
import { CheckpointOverlay } from "./CheckpointOverlay";
import { ReExplainPanel } from "./ReExplainPanel";
import { ConceptMap } from "./ConceptMap";
import { TimestampQA } from "./TimestampQA";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CompanionCard } from "./CompanionCard";
import { WatchModeSelector, AutoChapters, LiveTakeaways } from "./RailPanels";
import { companionOwnsFullscreen, supportsCheckIns, toCompanionEmbedUrl } from "@/lib/utils/video-embed";
import { PHONE } from "@/components/common/mobile/phone";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * The band at the foot of the frame that the PLAYER's own control bar occupies - its bar plus the
 * inset it is drawn with. Measured on the real Vimeo player: a 32px bar 8px clear of the bottom.
 * Our own bar sits directly on top of that band, so the two read as one run of controls rather
 * than a button floating in the middle of the picture.
 */
const PLAYER_BAR_BAND = 40;
/** Height of our bar - enough for a 44px touch target on a phone, the player's own height above. */
const COMPANION_BAR_H = 40;
const COMPANION_BAR_H_PHONE = 52;
/**
 * How long our bar stays up after the last thing we can see the learner do, while the video runs.
 * A cross-origin iframe swallows every pointer move over the picture, so "the learner is still
 * there" can only be read from what reaches US: entering the frame, a press, a key. This is the
 * same order as the player's own idle window, so the two go down together.
 */
const CONTROLS_IDLE_MS = 2600;
/**
 * How long after the playhead last moved we still call the video "running".
 *
 * `isPlaying` is the player's own word for it, and it is the better signal - but it arrives only
 * on a `play` event, and an event can be missed: we subscribe from the iframe's `load`/`ready`
 * handshake, and a bfcached frame can already have been playing by then. When that happens the
 * clock still ticks (playProgress, or the controller's local fallback ticker) while `isPlaying`
 * stays false, and a bar tied to `isPlaying` alone is pinned over the picture for the whole video -
 * the reported defect, by a second route. A moving playhead is the same fact, so it counts too.
 * Longer than a tick (250ms) and shorter than the idle window, so it can only ever ADD "running".
 */
const PLAYHEAD_QUIET_MS = 1200;
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
  // Our control bar follows the player's: up whenever the video is not running, and while it runs
  // up for a beat after the last thing we can see the learner do. See CONTROLS_IDLE_MS.
  const [controlsVisible, setControlsVisible] = useState(true);
  const [activity, setActivity] = useState(0);
  const lastActivityRef = useRef(0);
  const noteActivity = useCallback(() => {
    // One bump every half second is plenty to hold the bar up, and it keeps a pointer dragged
    // across the frame from re-rendering the whole companion on every pixel.
    const now = Date.now();
    if (now - lastActivityRef.current < 500) return;
    lastActivityRef.current = now;
    setActivity((n) => n + 1);
  }, []);
  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const { t } = useTranslation();
  const [watchMode, setWatchMode] = useState<WatchMode>("normal");
  // The in-video questions, and whether the server has sent them at all.
  //
  // A session the server opens in rewatch mode is sent NONE - it withholds them rather than trust
  // the player to hide them - and the start payload used to be the only place they ever arrived.
  // So switching from Rewatch to Normal pace told the server the new mode and moved the rail, while
  // the player went on holding an empty list: no check-in could fire until a reload fetched the
  // (by then normal) session again. `loaded` is what tells a switch that it has to fetch them.
  const [questions, setQuestions] = useState<{ list: CheckInMarker[]; loaded: boolean }>({ list: [], loaded: false });
  // The fetch of those questions, shared by switches made while it is in flight.
  const questionsRequestRef = useRef<Promise<void> | null>(null);
  // A switch in flight, or the reason the last one did not happen.
  const [modeSwitch, setModeSwitch] = useState<{ pending: boolean; error: string | null }>({ pending: false, error: null });
  // Bumped on every switch, so a slow answer to an older switch cannot undo a newer one.
  const modeSeqRef = useRef(0);
  // The mode the SERVER last confirmed - what a failed switch goes back to. Not the mode on screen:
  // two quick switches put the second one's "previous" on a mode the server never agreed to.
  const confirmedModeRef = useRef<WatchMode>("normal");
  // The same, as state: a mode's check-ins and 60s stops wait for it (see `armed`).
  const [confirmedMode, setConfirmedMode] = useState<WatchMode>("normal");
  const confirmMode = useCallback((m: WatchMode) => {
    confirmedModeRef.current = m;
    setConfirmedMode(m);
  }, []);
  // The last switch to finish, confirmed or refused. While a newer one is still out, the 10s save
  // does not repeat the mode: the one it holds is about to change.
  const settledSeqRef = useRef(0);
  // Mode changes reach the server one after another, so they land in the order they were made.
  const modeSyncRef = useRef<Promise<unknown>>(Promise.resolve());
  // The live session: a switch made after the watch ended replaces it with a new one on this page.
  const sessionIdRef = useRef<string | null>(null);
  // The watch this page has ENDED (the video reached its end), and that end request. The server keeps
  // an ended watch in the mode it was scored in, so a switch after it used to come back refused and
  // the rail flipped silently back. Instead it starts a new watch in the chosen mode, as reopening
  // the page would.
  const endingRef = useRef<{ sessionId: string; done: Promise<void> } | null>(null);
  // Where this watch's rewinds begin in the player's list, which runs for the life of the page: a
  // watch started on the page sends only its own.
  const rewindsFromRef = useRef(0);
  // Auto-generated description (lazily fetched the first time the Description tab is opened).
  const [genDesc, setGenDesc] = useState("");
  const [descLoading, setDescLoading] = useState(false);
  const descTriedRef = useRef(false);
  // "Pause & ask every 60s" watch mode - the second we paused at for a checkpoint (null = none),
  // whether the tick that just landed carried playback across a minute boundary, and the last
  // minute boundary we stopped at (so rewinding over it does not stop the learner there twice).
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const minuteCrossedRef = useRef(false);
  const lastCheckpointRef = useRef(0);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInMarker | null>(null);
  // Reactive set of the check-ins answered in THIS watch - drives the counter chip + the green
  // timeline markers, so they update the instant an answer lands (a ref wouldn't
  // re-render). shownRef stays a ref: it only gates the auto-pause effect.
  //
  // THIS watch, not every visit. Seeding it from the learner's lifetime passes is what made Normal
  // pace silent on a rewatch: on a video whose check-ins were all passed there was nothing left to
  // ask, and two of the three modes behaved identically. See `progressAcrossVisits`.
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  // Every check-in this learner has PASSED on this video, on any visit, including just now. It is
  // display only - the timeline marks them and the Rewatch chip counts them - and it never decides
  // what is asked. The server knows the same list and records a repeat of one as practice, so
  // asking again cannot pay twice.
  const [passed, setPassed] = useState<Set<number>>(new Set());
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
  //
  // `setRate` is deliberately not used. Every offered mode plays at the learner's own speed, and
  // re-asserting 1x on each mode change reset whatever speed they had picked in the player every
  // time they switched - a switch is not supposed to touch playback at all.
  const { setIframe, currentTime, duration, isPlaying, playbackRate, rewinds, endedTick, play, pause, seekTo } =
    useVimeoController();
  // "Running", as far as this page can tell it, and it is deliberately not `isPlaying` alone.
  //
  // `isPlaying` flips on a `play` event, and a `play` event can be missed - we subscribe from the
  // iframe handshake, which a frame restored from the back/forward cache is already past. After
  // that miss the clock still ticks while `isPlaying` stays false, so a bar keyed on `isPlaying`
  // is pinned over the picture for the rest of the video. The playhead moving is the same fact
  // arriving by the other route, so it counts as running too.
  //
  // Only a PLAYBACK-sized forward step counts. A seek moves the playhead by minutes, and a learner
  // who has just clicked a chapter on a paused video has not started it - taking their bar away
  // 2.6s later would be the bug turned round.
  const [playheadRunning, setPlayheadRunning] = useState(false);
  const lastSeenTimeRef = useRef(0);
  useEffect(() => {
    const delta = currentTime - lastSeenTimeRef.current;
    lastSeenTimeRef.current = currentTime;
    if (delta <= 0 || delta > 2) return;
    setPlayheadRunning(true);
    const id = window.setTimeout(() => setPlayheadRunning(false), PLAYHEAD_QUIET_MS);
    return () => window.clearTimeout(id);
  }, [currentTime]);
  const running = isPlaying || playheadRunning;
  // The player's own bar is up whenever the video is not running - paused, ended, not started yet -
  // and drops out of sight a beat after the pointer goes quiet while it runs. Ours keeps the same
  // clock, so the two are never on screen apart. A provider whose play/pause we cannot read at all
  // does not get a bar of ours in the first place - see `ownsFullscreen` below.
  useEffect(() => {
    if (!running) {
      setControlsVisible(true);
      return;
    }
    setControlsVisible(true);
    const id = window.setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
    return () => window.clearTimeout(id);
  }, [running, activity]);
  const rateRef = useRef(playbackRate);
  useEffect(() => {
    rateRef.current = playbackRate;
  }, [playbackRate]);

  // Real watched-coverage tracking: each whole second actually PLAYED (not skipped) is marked, so
  // points scale with genuine watching - skipping to the end earns little. Refs (not state): these
  // feed the periodic + final sync without re-rendering. coverage = distinct watched secs / duration.
  const watchedRef = useRef<Set<number>>(new Set());
  // The same seconds, counted only while the check-ins are ARMED: a questioning mode, with the
  // questions in hand. This - not watchedRef - is what the auto-pause gate reads, so arming them
  // mid-video (switching out of Rewatch) schedules them from where the learner is. Reading
  // watchedRef made every check-in already played past in rewatch mode due at once.
  const armedPlayedRef = useRef<Set<number>>(new Set());
  const armedRef = useRef(false);
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
        sessionIdRef.current = res.session_id;
        setSessionId(res.session_id);
        // A rewatch session is sent an empty list on purpose; anything else was sent the lot.
        const loaded = res.session?.watch_mode !== "rewatch";
        setQuestions({ list: res.companion.check_ins ?? [], loaded });
        questionsRequestRef.current = loaded ? Promise.resolve() : null;
        // What THIS watch has already been asked. A resumed session brings its own answers back
        // (a reload must not re-ask them); a new watch brings none, so every scheduled check-in is
        // still due however many the learner has passed before.
        const mine = answeredThisWatch(res.session);
        setAnswered(mine);
        mine.forEach((id) => shownRef.current.add(id));
        // What they have passed, for the markers and the Rewatch chip. Never the gate.
        setPassed(passedBefore(res.companion));
        setSaved({
          bestPct: Math.max(res.companion.my_best_completeness_pct ?? 0, res.session?.completeness_pct ?? 0),
          session: res.session ?? null,
          completedBefore: finishedBefore(res.companion),
        });
        // Reflect what the server actually opened, so the rail shows the mode in force rather than
        // the one this component happened to initialise with.
        if (res.session?.watch_mode) {
          confirmMode(res.session.watch_mode);
          setWatchMode(res.session.watch_mode);
        }
      })
      .catch(() => alive && setLoadError("This video companion isn't available right now."));
    return () => {
      alive = false;
    };
  }, [configId, confirmMode]);

  // The check-ins are armed in a questioning mode once the questions are in hand - and once the
  // SERVER has confirmed that mode. Turning them off is immediate (the mode on screen); turning them
  // on waits for the server, so no check-in is asked, and so spent, under a switch the server then
  // refuses. Arming them - on load, or by switching out of Rewatch - starts the count of armed
  // seconds afresh, so what was played while they were off can never fire them. Declared before
  // the effects that read it.
  const armed = watchMode !== "rewatch" && confirmedMode !== "rewatch" && questions.loaded;
  // The 60s stop follows the same rule: on once the server holds the mode too, off at once.
  const pausing = watchMode === "pause_60s" && confirmedMode === "pause_60s";
  useEffect(() => {
    if (armed && !armedRef.current) armedPlayedRef.current = new Set();
    armedRef.current = armed;
  }, [armed]);

  // Mark each whole second actually played into watchedRef. A small forward delta is normal playback;
  // a large jump is a seek/skip and is NOT counted - so skipping ahead doesn't earn coverage.
  //
  // Declared BEFORE the auto-pause effect on purpose: effects run in declaration order, and the
  // check-in gate below reads the played seconds for the tick that just landed.
  useEffect(() => {
    const prev = prevTimeRef.current;
    prevTimeRef.current = currentTime;
    const delta = currentTime - prev;
    if (delta > 0 && delta <= 1.5) {
      for (let s = Math.floor(prev); s <= Math.floor(currentTime); s++) {
        watchedRef.current.add(s);
        if (armedRef.current) armedPlayedRef.current.add(s);
      }
      // Playback carried the playhead over a minute boundary: the "Pause & ask every 60s" trigger.
      // A seek is not playback, so jumping across a boundary, resuming mid-video or switching into
      // that mode never stops the learner for minutes already behind them.
      if (Math.floor(currentTime / 60) > Math.floor(prev / 60)) minuteCrossedRef.current = true;
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

  // --- Check-in auto-pause, and the 60s checkpoint ----------------------------
  // One effect for both, so a single tick can never stop the learner twice: a check-in that falls
  // due wins, and the checkpoint for the same moment is dropped rather than queued behind it.
  useEffect(() => {
    const crossedMinute = minuteCrossedRef.current;
    minuteCrossedRef.current = false;
    // Rewatch is the mode that asks nothing - neither the check-ins nor the checkpoint.
    if (!companion || activeCheckIn || watchMode === "rewatch") return;
    if (armed) {
      // Fire the FIRST un-shown, un-answered check-in whose moment has actually been WATCHED, with
      // the questions armed.
      //
      // Reaching a timestamp is not the same as viewing it. Gating on position alone meant that
      // jumping via the chapter rail or the timeline armed a probe, while a learner playing the
      // video straight through got none - the clock only moved on a seek (see useVimeoController).
      // Requiring the marker's second to have been PLAYED makes playback the trigger and leaves the
      // chapter rail a review affordance, which is the behaviour the surface promises. Requiring it
      // to have been played while armed is what makes a switch out of Rewatch ask from here on
      // instead of firing every check-in already behind the playhead, one after another.
      //
      // The +/-1s tolerance absorbs a dropped tick; only playback-sized deltas are ever recorded, so
      // a pure jump still arms nothing until the learner actually watches. Still a catch-up scan
      // rather than an edge test, so a coarse tick can't drop a marker forever.
      const played = (ts: number) => {
        const sec = Math.floor(ts);
        const seen = armedPlayedRef.current;
        return seen.has(sec) || seen.has(sec - 1) || seen.has(sec + 1);
      };
      const due = questions.list
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
        return;
      }
    }
    // "Pause & ask every 60s": stop when playback crosses a minute boundary. Keyed on the crossing
    // rather than on the minute the playhead is in, which fired at once on switching into the mode
    // (and on resuming, or jumping ahead, in it) for a minute the learner had already watched. A
    // boundary already stopped at is not stopped at again after a rewind, as before.
    const minute = Math.floor(currentTime / 60);
    if (crossedMinute && pausing && checkpoint === null && minute > lastCheckpointRef.current) {
      lastCheckpointRef.current = minute;
      pause();
      // Player-time-driven, like the check-in above; the crossing flag is consumed on every run, so
      // it fires at most once per boundary and cannot cascade.
      setCheckpoint(currentTime);
    }
  }, [currentTime, companion, activeCheckIn, pause, answered, watchMode, armed, pausing, questions, checkpoint]);

  /**
   * While a quick check is on screen, the video stays stopped - whoever asks it to play.
   *
   * Pausing once, at the moment the question appears, was the whole of the guard. But the player
   * is an iframe with its own keyboard shortcuts, and it keeps focus: pressing space told VIMEO
   * to play, not us, so the lecture carried on underneath an unanswered question. Clicking the
   * player, or the media keys, did the same. The learner then answered a question about
   * something they were no longer watching, and the answer was scored.
   *
   * This is deliberately a reaction to `isPlaying` rather than another `pause()` next to the
   * first: it does not matter how playback started, only that it did. `isPlaying` is the
   * player's own report, so the lock holds against inputs this component never sees.
   *
   * `checkpoint` is included because the 60-second checkpoint overlay stops the video for the
   * same reason and was equally easy to play out from under.
   */
  const locked = activeCheckIn !== null || checkpoint !== null;
  useEffect(() => {
    if (locked && isPlaying) pause();
  }, [locked, isPlaying, pause]);

  /**
   * Swallow the space bar while the video is locked.
   *
   * The reaction above is what actually holds the line, because a key pressed with focus inside
   * the iframe never reaches this document. This handles the case where focus is on the page -
   * having answered a question, a learner's focus is on our overlay, not the player - and it
   * stops space scrolling the page out from under the question as well. "k" is the other play
   * shortcut players bind.
   */
  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.code !== "Space" && e.key !== "k") return;
      const target = e.target as HTMLElement | null;
      // Never steal a space from something a learner is typing or from a real button.
      const tag = (target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "button" || target?.isContentEditable) return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked]);

  // --- Periodic sync of watch signals ---------------------------------------
  const completeness = useMemo(
    () => (duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0),
    [currentTime, duration]
  );

  // Keep the max-speed + rewinds high-water marks in refs for the (ref-reading) syncs below.
  useEffect(() => { if (playbackRate > maxSpeedRef.current) maxSpeedRef.current = playbackRate; }, [playbackRate]);
  useEffect(() => { rewindsRef.current = rewinds; }, [rewinds]);
  /** This watch's rewinds, or nothing: the field is left out while there are none. */
  const ownRewinds = useCallback(() => {
    const own = rewindsRef.current.slice(rewindsFromRef.current);
    return own.length ? own : undefined;
  }, []);

  // Periodic save of watch signals. Reads everything from refs at fire time, so the interval isn't
  // torn down on every timeupdate (it would never reach 10s otherwise) and the BE gets true coverage.
  //
  // The mode it repeats is only ever one the server has confirmed, and none while a switch is on
  // its way. It used to repeat the mode on screen, so a tick could carry a mode the server had
  // refused, or one about to be replaced, and land after the switch; repeating the confirmed one
  // instead restores, within one tick, anything a racing request put back.
  useEffect(() => {
    if (!sessionId) return;
    const timer = setInterval(() => {
      const settled = settledSeqRef.current === modeSeqRef.current;
      adaptiveVideoService
        .sync(sessionId, {
          current_timestamp: prevTimeRef.current,
          completeness_pct: coverageRef.current,
          max_speed: maxSpeedRef.current,
          ...(settled ? { watch_mode: confirmedModeRef.current } : {}),
          rewinds: ownRewinds(),
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [sessionId, ownRewinds]);

  // Flush the FINAL coverage/speed, THEN end + score (so the award reflects everything watched,
  // including the last stretch the periodic sync may not have sent yet). Server-side this is
  // idempotent + monotonic (upgradeable award keyed on video:<config.id>), so firing it from
  // several triggers is safe and never lowers a prior award.
  const endAndScore = useCallback(() => {
    if (!sessionId) return;
    const done = adaptiveVideoService
      .sync(sessionId, {
        current_timestamp: prevTimeRef.current,
        completeness_pct: coverageRef.current,
        max_speed: maxSpeedRef.current,
        rewinds: ownRewinds(),
      })
      .catch(() => {})
      .then(() => adaptiveVideoService.endSession(sessionId))
      .then(() => {
        notifyContentCompleted();
        onCompletedRef.current?.();
      })
      .catch(() => {});
    endingRef.current = { sessionId, done };
  }, [sessionId, ownRewinds]);
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

  // Unmount fallback (SPA navigation away before the video ends). Every switch still on its way is
  // superseded first, so none reaches the server after the watch it belongs to has been ended.
  useEffect(() => {
    return () => {
      // The live counter, deliberately - not a copy taken when the effect ran.
      modeSeqRef.current += 1;
      endRef.current();
    };
  }, []);

  // --- Handlers --------------------------------------------------------------
  const onAnswer = useCallback(
    async (letter: string, timeMs: number) => {
      if (!sessionId || !activeCheckIn) throw new Error("no session");
      const r = await adaptiveVideoService.answerCheckIn(sessionId, activeCheckIn.id, letter.toLowerCase(), timeMs);
      setAnswered((prev) => new Set(prev).add(activeCheckIn.id));
      if (r.is_correct) setPassed((prev) => new Set(prev).add(activeCheckIn.id));
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

  // --- Watch mode switch ------------------------------------------------------
  // The questions a rewatch session was never sent. The companion endpoint carries them (and a
  // fresh list of the ones this learner has passed, which may include some passed on this page).
  // One request however many switches are made while it is out; a failed one can be tried again.
  //
  // The passes update the markers and nothing else. Folding them into `answered` here is what made
  // a switch out of Rewatch arrive at a mode with every check-in already ticked off: the rail
  // moved, the questions armed, and nothing was ever due.
  const loadQuestions = useCallback(() => {
    questionsRequestRef.current ??= adaptiveVideoService.getCompanion(configId).then(
      (fresh) => {
        setQuestions({ list: fresh.check_ins ?? [], loaded: true });
        setPassed((prev) => new Set([...prev, ...passedBefore(fresh)]));
      },
      (err: unknown) => {
        questionsRequestRef.current = null;
        throw err;
      },
    );
    return questionsRequestRef.current;
  }, [configId]);

  // A new watch started on this page, taken on as a fresh page load would take it on - its session,
  // questions and passed check-ins - while the player carries on untouched. What the new watch
  // counts as watched (coverage, speed, rewinds) starts from here.
  const adoptWatch = useCallback((res: StartSessionResult) => {
    sessionIdRef.current = res.session_id;
    endingRef.current = null;
    setSessionId(res.session_id);
    setCompanion(res.companion);
    const loaded = res.session?.watch_mode !== "rewatch";
    setQuestions({ list: res.companion.check_ins ?? [], loaded });
    questionsRequestRef.current = loaded ? Promise.resolve() : null;
    // A NEW watch: nothing is spent yet, so its check-ins are all due again. The passes carry over
    // (they are the learner's, not the watch's) and keep marking the timeline.
    const mine = answeredThisWatch(res.session);
    shownRef.current = new Set(mine);
    setAnswered(mine);
    setPassed((prev) => new Set([...prev, ...passedBefore(res.companion)]));
    watchedRef.current = new Set();
    armedPlayedRef.current = new Set();
    coverageRef.current = 0;
    maxSpeedRef.current = rateRef.current;
    rewindsFromRef.current = rewindsRef.current.length;
    setSaved((prev) => ({
      bestPct: Math.max(prev.bestPct, res.companion.my_best_completeness_pct ?? 0),
      session: res.session ?? null,
      completedBefore: finishedBefore(res.companion),
    }));
  }, []);

  // What a mode takes off the screen: Rewatch asks nothing, and the 60s checkpoint is its own mode's.
  const clearOverlaysFor = useCallback((m: WatchMode) => {
    if (m === "rewatch") setActiveCheckIn(null);
    if (m !== "pause_60s") setCheckpoint(null);
  }, []);

  // Takes effect at once, and never touches the player - no reload, no seek, no speed change.
  // The rail moves first, and a mode's questions and stops go off with it; they come ON when the
  // server confirms the mode (see `armed`). A switch out of Rewatch fetches the questions BEFORE
  // the server is told, so a failure at either step leaves the page and the session on the mode
  // they were both on, and the learner is told rather than left looking at a mode not in force.
  const changeMode = useCallback(
    async (next: WatchMode) => {
      if (!sessionId || next === watchMode) return;
      const seq = ++modeSeqRef.current;
      const superseded = () => seq !== modeSeqRef.current;
      // A check-in on screen when the learner turns the questions off was not answered, so it is
      // not spent: it is asked again if they come back to it with the questions on.
      if (next === "rewatch" && activeCheckIn && !answered.has(activeCheckIn.id)) shownRef.current.delete(activeCheckIn.id);
      setWatchMode(next);
      clearOverlaysFor(next);
      setModeSwitch({ pending: true, error: null });
      try {
        if (next !== "rewatch") await loadQuestions();
        // A newer switch was made while the questions were on their way; only that one may reach
        // the server.
        if (superseded()) return;
        // Queued behind any switch still on its way, so the server ends on the mode made last - and
        // checked again when its turn comes: one replaced while it waited, or one whose page has
        // been left (which supersedes them all), is never sent.
        const request = modeSyncRef.current
          .catch(() => {})
          .then(async () => {
            if (superseded()) return null;
            const ended = endingRef.current;
            if (ended && ended.sessionId === sessionIdRef.current) {
              // This watch has been ended - scored in its mode, which the server now keeps. The
              // choice starts a new watch in it instead, once the end has landed (until then the
              // server would hand back the same, still open, session).
              await ended.done;
              if (superseded()) return null;
              const fresh = await adaptiveVideoService.startSession(configId, next);
              if (superseded()) return null;
              adoptWatch(fresh);
              return fresh.session;
            }
            return adaptiveVideoService.sync(sessionIdRef.current ?? sessionId, { watch_mode: next });
          });
        modeSyncRef.current = request;
        const session = await request;
        if (session === null) return;
        // The server has the last word: it quietly downgrades a rewatch it will not grant, and the
        // rail shows the mode in force, not the one asked for. Recorded even for a switch since
        // superseded: it is what the server holds until the newer one lands.
        const inForce = session?.watch_mode || next;
        confirmMode(inForce);
        if (superseded()) return;
        if (inForce !== next) {
          setWatchMode(inForce);
          clearOverlaysFor(inForce);
          if (inForce !== "rewatch") await loadQuestions();
        }
        if (!superseded()) {
          settledSeqRef.current = seq;
          setModeSwitch({ pending: false, error: null });
        }
      } catch {
        if (superseded()) return;
        settledSeqRef.current = seq;
        const back = confirmedModeRef.current;
        setWatchMode(back);
        clearOverlaysFor(back);
        setModeSwitch({ pending: false, error: t("adaptiveVideoMode.switchFailed") });
      }
    },
    [sessionId, watchMode, activeCheckIn, answered, loadQuestions, clearOverlaysFor, confirmMode, adoptWatch, configId, t],
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

  // Can anything of ours ever be painted OVER this player? The check-ins and the 60s checkpoint are
  // built from a transcript, and only a catalog video has one - an externally-hosted video is a
  // bare iframe with nothing above it (the banner below sits outside the player box). This is the
  // whole reason the companion has a full-screen button of its own, so it is what decides whether
  // it has one here.
  //
  // Three ways to be sure, because getting this wrong the OTHER way puts the check-in back behind
  // a fullscreen iframe, which is the bug #1699 and fullscreenCheckIn.test.tsx exist for: the
  // server's own word for "this video has a transcript", the Vimeo record that word is derived
  // from, and questions actually in hand. A payload that ever stops sending one of them still
  // keeps the control the check-ins need.
  const canOverlay =
    supportsCheckIns(companion.source) || !isExternal || (companion.check_ins?.length ?? 0) > 0;
  // A watch URL cannot be framed; the id has to be moved into the provider's embed form. Where we
  // are taking fullscreen over, the provider's own button goes with it, so the learner is never
  // offered two - see companionOwnsFullscreen for the rule and why it is one rule and not three.
  const embed = toCompanionEmbedUrl(playUrl, companion.source, { canOverlay });
  const ownsFullscreen = companionOwnsFullscreen(embed, { canOverlay });
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
  // The check-ins in force: none in Rewatch - a rewatch visit is sent none, and one switched into
  // must look the same - and none until a switch out of Rewatch has fetched them. The markers, the
  // counter and the "checks pending" badge all read this one list, so they cannot disagree with
  // what the player will actually ask.
  const liveCheckIns = armed ? questions.list : [];
  const answeredLive = liveCheckIns.filter((c) => answered.has(c.id)).length;
  // The checks counter. With check-ins in force it counts THIS watch, so it agrees with what the
  // player will actually ask - it used to open at "5/5 checks" on a rewatch that then asked
  // nothing. Rewatch ships no check-ins at all, so a learner returning with four passed ones would
  // have read "4/0": there it reports the passes instead. No check-ins, nothing to count.
  const checksChip =
    liveCheckIns.length > 0
      ? `${answeredLive}/${liveCheckIns.length} checks`
      : passed.size > 0
        ? `${passed.size} check${passed.size === 1 ? "" : "s"} passed`
        : "";
  // Completed, but this visit is still being asked the video's checks.
  //
  // The badge keys on the completion record and the check-in gate keys on the watch mode, and
  // those two rules have just been pulled apart on purpose: a learner who ended a watch without
  // getting through the video is completed (they keep their tick) AND is no longer exempt from the
  // questions. A flat "Completed" over a video that then stops to ask eight questions reads as a
  // bug, so this one state says what is actually true. The rule is unchanged - only the wording.
  const checksPending = finished && liveCheckIns.length > 0 && answeredLive < liveCheckIns.length;
  const conceptTime = finished ? Number.MAX_SAFE_INTEGER : currentTime;
  const watchedConcepts = companion.concept_map?.nodes?.filter((n) => conceptTime >= (n.timestamp_seconds ?? 0)).length ?? 0;
  const watchedPct = finished ? 100 : watchedPercent(saved.bestPct, thisVisitPct);
  // Fixed for the life of the page (the takeaways come with the companion), so the layout below
  // that depends on it never changes while the learner is using it.
  const hasTakeaways = (companion.takeaways?.length ?? 0) > 0;
  const takeawaysAcross = hasTakeaways && (companion.chapters?.length ?? 0) > 0;

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

      <Box
        sx={{
          display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 2.5, mt: 1,
          // The takeaways are their own grid item, so each width can put them where the columns
          // come out closest - by CSS alone: nothing is measured, nothing moves while the page is in
          // use, and the player keeps its place in the tree at every width.
          //
          // - One column: unchanged - they close the stack, after the chapters.
          // - Two columns (lg and up): the takeaways - the one panel that keeps growing as the
          //   video plays - go below both columns, full width, so the rail ends at the chapters.
          //   Not for a video with no chapters: that rail would be short of the lesson by the whole
          //   of the chapters card, so the takeaways stay in it.
          //
          //   This used to stop at 1535px, on the reading that "xl and up, the player is big enough
          //   that the old stack comes out even". It is not, and that is this report: measured
          //   headlessly with the companion from the screenshot (an empty concept map, 7 chapters,
          //   every takeaway revealed), the right column ran past the lesson by 324px at 1536,
          //   288px at 1600, 216px at 1728 and 108px at 1920 - the reported empty area under the
          //   Ask box, at every laptop and desktop width above the one that was fixed. With twelve
          //   chapters it was 746px at 1536 and still 170px at 2560. Carrying the same rule up
          //   turns all of those negative (the rail alone ends 66-282px SHORT of the lesson).
          ...(hasTakeaways && {
            gridTemplateAreas: {
              xs: '"main" "rail" "takeaways"',
              lg: takeawaysAcross ? '"main rail" "takeaways takeaways"' : '"main rail" "main takeaways"',
            },
            // Where the takeaways stay in the rail, the lesson spans both rows, so a longer lesson
            // puts its spare height under the takeaways rather than between them and the chapters.
            gridTemplateRows: { lg: "auto 1fr" },
          }),
        }}
      >
        {/* Main column */}
        <Box sx={{ minWidth: 0, gridArea: hasTakeaways ? "main" : undefined }}>
          {/* Player */}
          <Box
            ref={playerBoxRef}
            // Everything we can see of "the learner is still here". A cross-origin iframe keeps
            // every pointer move over the picture to itself, so these - crossing into the frame,
            // a press, a key landing on a control - are the whole signal.
            // Nothing to hold up where the provider keeps its own controls, so nothing is listened
            // for either: these fire on every pointer move over a 16/9 box.
            onPointerEnter={ownsFullscreen ? noteActivity : undefined}
            onPointerMove={ownsFullscreen ? noteActivity : undefined}
            onPointerDown={ownsFullscreen ? noteActivity : undefined}
            onFocusCapture={ownsFullscreen ? noteActivity : undefined}
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
            {/* The companion's own control bar - rendered only where fullscreen is OURS.
                Fullscreen has to be ours and not the provider's: Vimeo's button fullscreens the
                IFRAME, and a check-in painted over the player is that iframe's sibling, so the
                browser draws the iframe alone and the question is nowhere (fullscreenCheckIn.test).
                Ours fullscreens the BOX, which is the overlay's parent.

                But it cannot live among the provider's buttons either - they are inside a
                cross-origin iframe, and they are right-anchored flush to that bar's edge, with no
                free slot to sit in (measured: with and without Vimeo's own fullscreen button the
                cluster still ends at the same x). So it gets a bar of its own, laid directly on
                top of the player's own band and sharing its clock: full width, right-aligned like
                every player's fullscreen control, and gone the moment the player's controls go
                rather than left floating over the picture and over the burned-in captions.

                Where fullscreen is the PROVIDER's - every non-Vimeo embed, and any video with no
                overlay of ours to protect - there is no bar at all. Two reasons, and either alone
                settles it: the provider's own button is still there, so ours would be a second
                one; and nothing on those players ever tells this page that the video is playing,
                so a bar on the player's clock would have no clock and would sit over the picture
                for the whole video. That is the report. */}
            {ownsFullscreen && (
            <Box
              data-testid="companion-control-bar"
              // Hidden, this thin band is the one place a pointer heading for the controls can
              // still reach us through the iframe - touching it brings the bar back (the move
              // bubbles to the box). Shown, it lets everything but the button through, so the
              // picture stays the player's.
              sx={{
                position: "absolute", left: 0, right: 0, zIndex: 15,
                // Full screen makes the frame the whole screen, and the player letterboxes a 16/9
                // picture inside it - so its bar lifts off the bottom by the height of that black
                // margin. Ours lifts with it; measured flush at 1440x900, and the term falls to
                // zero on a screen wider than 16/9, where there is no margin to clear.
                // ON the player's bar, not above it.
                //
                // This band used to sit at `PLAYER_BAR_BAND` - one bar-height up - because with
                // Vimeo's own fullscreen button removed its cluster simply re-flowed and still
                // ended flush against the edge, leaving no slot. The embed now also asks for
                // `pip=0` (see toCompanionEmbedUrl), which frees the last slot in that run, so
                // ours sits in the row itself, at the right, where a player's fullscreen control
                // belongs. Reported twice as a button floating outside the bar.
                bottom: isFullscreen
                  ? `calc(max(0px, (100vh - 100vw * 9 / 16) / 2))`
                  : 0,
                height: PLAYER_BAR_BAND,
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                px: 1,
                pointerEvents: controlsVisible ? "none" : "auto",
                // No scrim across the band. A player's usual bottom gradient would sit exactly
                // where a burned-in caption is, and dimming the subtitles to frame a button is
                // the other half of what was reported. The control carries its own fill instead.
                [PHONE]: { height: COMPANION_BAR_H_PHONE },
              }}
            >
              <IconButton
                data-testid="companion-fullscreen"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                size="small"
                sx={{
                  // Shaped like the player's own bar - the same dark fill, the same rounded-rect
                  // rather than a circle - so sitting on it reads as one more control in the run
                  // and not as a badge dropped on the picture.
                  color: "#fff", bgcolor: "rgba(15,12,41,0.72)", borderRadius: 1.5, height: 32, width: 32,
                  "&:hover": { bgcolor: "rgba(15,12,41,0.9)" },
                  // Down with the player's bar: invisible and untouchable, but still in the tab
                  // order - a keyboard user who tabs onto it brings the bar back (onFocusCapture
                  // on the box), which is strictly more than a `visibility: hidden` control offers.
                  opacity: controlsVisible ? 1 : 0,
                  pointerEvents: controlsVisible ? "auto" : "none",
                  transition: "opacity 200ms ease",
                  "&:focus-visible": { opacity: 1, pointerEvents: "auto", outline: "2px solid #fff" },
                  [PHONE]: { width: 44, height: 44 },
                }}
              >
                <IconWrapper
                  icon={isFullscreen ? "mdi:fullscreen-exit" : "mdi:fullscreen"}
                  size={20}
                />
              </IconButton>
            </Box>
            )}
            {activeCheckIn && (
              <AutoPauseCheckIn
                checkIn={activeCheckIn}
                practice={passed.has(activeCheckIn.id)}
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
              liveCheckIns.map((c) => {
                const isAnswered = answered.has(c.id);
                // Passed on an earlier visit and due again in this one: an outline, not a fill.
                // Filling it would say "answered" of a check-in the player is about to ask, which
                // is how the markers and the questions came to disagree.
                const passedEarlier = !isAnswered && passed.has(c.id);
                return (
                  <Tooltip
                    key={c.id}
                    title={`${fmt(c.timestamp_seconds)} · ${c.concept || "Check-in"}${
                      passedEarlier ? " · passed before, asked again for practice" : ""
                    }`}
                    arrow
                  >
                    <Box
                      onClick={() => seekTo(Math.max(c.timestamp_seconds - 2, 0))}
                      sx={{
                        position: "absolute", top: "50%", left: `${(c.timestamp_seconds / duration) * 100}%`,
                        transform: "translate(-50%, -50%)", width: 13, height: 13, borderRadius: 999, cursor: "pointer",
                        background: isAnswered
                          ? "#16a34a"
                          : passedEarlier
                            ? "color-mix(in srgb, #16a34a 22%, var(--card-bg, #fff))"
                            : "linear-gradient(135deg, #6366f1, #ec4899)",
                        border: passedEarlier ? "2.5px solid #16a34a" : "2.5px solid var(--card-bg, #fff)",
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, gridArea: hasTakeaways ? "rail" : undefined }}>
          <WatchModeSelector
            value={watchMode}
            rewatchAvailable={Boolean(companion.rewatch_available)}
            busy={modeSwitch.pending}
            error={modeSwitch.error}
            onChange={(m) => void changeMode(m)}
          />
          {/* No transcript, nothing to re-explain. The server answers 400 for these, and 36
              production companions have an empty `transcript_segments` - without this gate
              those learners get a prominent headline button that fails every single time. */}
          {(companion.transcript_segments?.length ?? 0) > 0 && <ReExplainPanel onReExplain={onReExplain} />}
          <AutoChapters chapters={companion.chapters} currentTime={currentTime} onJump={(s) => seekTo(s)} />
        </Box>
        {hasTakeaways && (
          // Wherever they follow the chapters, -4px takes the grid's 20px row gap back to the rail's
          // own 16px, so they sit exactly where they did as the rail's last card.
          <Box
            data-testid="takeaways-slot"
            sx={{ gridArea: "takeaways", minWidth: 0, alignSelf: "start", mt: { xs: -0.5, lg: takeawaysAcross ? 0 : -0.5 } }}
          >
            <LiveTakeaways takeaways={companion.takeaways} currentTime={currentTime} chapters={companion.chapters} />
          </Box>
        )}
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
