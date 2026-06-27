"use client";

import { Box, Tab, Tabs, Typography, CircularProgress, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adaptiveVideoService,
  type VideoCompanion as CompanionData,
  type CheckInMarker,
  type ReExplainStyle,
  type WatchMode,
} from "@/lib/services/adaptive-video.service";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { notifyContentCompleted } from "@/lib/streak/streakCelebration";
import { useVimeoController } from "./useVimeoController";
import { AutoPauseCheckIn } from "./AutoPauseCheckIn";
import { CheckpointOverlay } from "./CheckpointOverlay";
import { ReExplainPanel } from "./ReExplainPanel";
import { ConceptMap } from "./ConceptMap";
import { TimestampQA } from "./TimestampQA";
import { CompanionCard } from "./CompanionCard";
import { WatchModeSelector, AutoChapters, LiveTakeaways } from "./RailPanels";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const TABS: { label: string; icon: string }[] = [
  { label: "AI Companion", icon: "mdi:sparkles" },
  { label: "Transcript", icon: "mdi:text-box-outline" },
  { label: "Description", icon: "mdi:information-outline" },
];

/**
 * The Video Companion surface (the screenshot). Self-contained: starts a watch
 * session, drives the Vimeo player via postMessage, fires auto-pause check-ins on
 * the timeline, and wires the AI Companion tab + adaptive rail to the backend.
 */
export function VideoCompanion({ configId }: { configId: number }) {
  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [watchMode, setWatchMode] = useState<WatchMode>("normal");
  // Auto-generated description (lazily fetched the first time the Description tab is opened).
  const [genDesc, setGenDesc] = useState("");
  const [descLoading, setDescLoading] = useState(false);
  const descTriedRef = useRef(false);
  // "Pause & ask every 60s" watch mode — checkpoint overlay state + last minute we paused at.
  const [checkpoint, setCheckpoint] = useState(false);
  const lastCheckpointRef = useRef(0);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInMarker | null>(null);
  // Reactive set of answered check-in ids — drives the counter chip + the green
  // timeline markers, so they update the instant an answer lands (a ref wouldn't
  // re-render). shownRef stays a ref: it only gates the auto-pause effect.
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const shownRef = useRef<Set<number>>(new Set());

  const ctl = useVimeoController();
  const { currentTime, duration } = ctl;

  // --- Session bootstrap -----------------------------------------------------
  useEffect(() => {
    let alive = true;
    adaptiveVideoService
      .startSession(configId, "normal")
      .then((res) => {
        if (!alive) return;
        setCompanion(res.companion);
        setSessionId(res.session_id);
      })
      .catch(() => alive && setLoadError("This video companion isn't available right now."));
    return () => {
      alive = false;
    };
  }, [configId]);

  // --- Check-in auto-pause ---------------------------------------------------
  useEffect(() => {
    if (!companion || activeCheckIn) return;
    const due = companion.check_ins.find(
      (c) =>
        currentTime >= c.timestamp_seconds &&
        currentTime <= c.timestamp_seconds + 4 &&
        !shownRef.current.has(c.id) &&
        !answered.has(c.id)
    );
    if (due) {
      shownRef.current.add(due.id);
      ctl.pause();
      setActiveCheckIn(due);
    }
  }, [currentTime, companion, activeCheckIn, ctl, answered]);

  // --- Watch mode: plain English → slower, scaffolded playback --------------
  useEffect(() => {
    ctl.setRate(watchMode === "plain_english" ? 0.9 : 1);
  }, [watchMode, ctl.setRate]);

  // --- Watch mode: pause & ask every 60s ------------------------------------
  useEffect(() => {
    if (watchMode !== "pause_60s" || !companion || activeCheckIn || checkpoint) return;
    const minute = Math.floor(currentTime / 60);
    if (minute >= 1 && minute > lastCheckpointRef.current) {
      lastCheckpointRef.current = minute;
      ctl.pause();
      setCheckpoint(true);
    }
  }, [currentTime, watchMode, companion, activeCheckIn, checkpoint, ctl.pause]);

  // --- Lazy auto-generate the description when its tab is first opened -------
  useEffect(() => {
    if (tab !== 2 || !companion) return;
    if (companion.description || genDesc || descLoading || descTriedRef.current) return;
    descTriedRef.current = true;
    setDescLoading(true);
    adaptiveVideoService
      .generateDescription(configId)
      .then(setGenDesc)
      .catch(() => {})
      .finally(() => setDescLoading(false));
  }, [tab, companion, genDesc, descLoading, configId]);

  // --- Periodic sync of watch signals ---------------------------------------
  const completeness = useMemo(
    () => (duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0),
    [currentTime, duration]
  );
  useEffect(() => {
    if (!sessionId) return;
    const t = setInterval(() => {
      adaptiveVideoService
        .sync(sessionId, {
          current_timestamp: currentTime,
          completeness_pct: completeness,
          max_speed: ctl.playbackRate,
          watch_mode: watchMode,
          rewinds: ctl.rewinds.length ? ctl.rewinds : undefined,
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, [sessionId, currentTime, completeness, watchMode, ctl.playbackRate, ctl.rewinds]);

  // End the session when the surface unmounts (finalizes comprehension → quiz seed).
  // The server scores the watch on end → notify the streak celebration once it's recorded.
  useEffect(() => {
    return () => {
      if (sessionId) {
        adaptiveVideoService
          .endSession(sessionId)
          .then(() => notifyContentCompleted())
          .catch(() => {});
      }
    };
  }, [sessionId]);

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
  if (!companion.video)
    return (
      <CompanionCard accent="#6366f1" sx={{ textAlign: "center", py: 5 }}>
        <Typography sx={{ color: "text.secondary" }}>No video is attached to this companion yet.</Typography>
      </CompanionCard>
    );

  const embed = `${companion.video.embed_url}?api=1&title=0&byline=0&portrait=0`;
  // Video/module names often arrive snake_cased (e.g. "Module_01_Java_Fundamentals…"); show them humanized.
  const displayTitle = (companion.video.title || companion.title || "").replace(/_/g, " ").trim();
  const watchedConcepts = companion.concept_map?.nodes?.filter((n) => currentTime >= (n.timestamp_seconds ?? 0)).length ?? 0;

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
            background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", fontWeight: 800, fontSize: "0.74rem",
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
            sx={{
              position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "16 / 9",
              background: "#0f0c29",
              border: "1px solid var(--border-default, #ececf1)",
              boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 18px 40px -28px rgba(16,24,40,0.35)",
            }}
          >
            <iframe
              ref={ctl.iframeRef}
              src={embed}
              onLoad={ctl.onIframeLoad}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: 0 }}
              title={companion.title}
            />
            {activeCheckIn && (
              <AutoPauseCheckIn
                checkIn={activeCheckIn}
                onAnswer={onAnswer}
                onContinue={() => {
                  setActiveCheckIn(null);
                  ctl.play();
                }}
                onRewind={(s) => {
                  ctl.seekTo(s);
                  setActiveCheckIn(null);
                  ctl.play();
                }}
              />
            )}
            {checkpoint && !activeCheckIn && (
              <CheckpointOverlay
                timestamp={currentTime}
                onAsk={onAsk}
                onResume={() => {
                  setCheckpoint(false);
                  ctl.play();
                }}
              />
            )}
          </Box>

          {/* Companion timeline strip — check-in markers (spec §3.2b) */}
          <Box sx={{ position: "relative", height: 8, mt: 2, mb: 1, borderRadius: 999,
            background: "color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)" }}>
            <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${completeness}%`, borderRadius: 999,
              background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)", transition: "width 400ms ease" }} />
            {duration > 0 &&
              companion.check_ins.map((c) => {
                const isAnswered = answered.has(c.id);
                return (
                  <Tooltip key={c.id} title={`${fmt(c.timestamp_seconds)} · ${c.concept || "Check-in"}`} arrow>
                    <Box
                      onClick={() => ctl.seekTo(Math.max(c.timestamp_seconds - 2, 0))}
                      sx={{
                        position: "absolute", top: "50%", left: `${(c.timestamp_seconds / duration) * 100}%`,
                        transform: "translate(-50%, -50%)", width: 13, height: 13, borderRadius: 999, cursor: "pointer",
                        background: isAnswered ? "#16a34a" : "linear-gradient(135deg, #6366f1, #ec4899)",
                        border: "2.5px solid var(--card-bg, #fff)",
                        boxShadow: isAnswered ? "0 0 0 3px color-mix(in srgb,#16a34a 25%,transparent)" : "0 0 10px color-mix(in srgb,#a855f7 70%,transparent)",
                        transition: "transform 120ms ease", "&:hover": { transform: "translate(-50%, -50%) scale(1.25)" },
                      }}
                    />
                  </Tooltip>
                );
              })}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.25 }}>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
              {fmt(currentTime)} / {fmt(duration)}
            </Typography>
            <Chip icon="mdi:sitemap-outline" label={`${watchedConcepts} concepts`} />
            <Chip icon="mdi:lightning-bolt" label={`${answered.size}/${companion.check_ins.length} checks`} />
          </Box>

          {/* Companion tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
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
              <ConceptMap data={companion.concept_map} currentTime={currentTime} />
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
                      onClick={() => ctl.seekTo(s.start_seconds)}
                      sx={{
                        display: "flex", gap: 1.5, mb: 0.5, px: 1, py: 0.6, borderRadius: 1.5, cursor: "pointer",
                        background: active ? "color-mix(in srgb, #6366f1 10%, transparent)" : "transparent",
                        "&:hover": { background: "color-mix(in srgb, #6366f1 6%, transparent)" },
                      }}
                    >
                      <Typography sx={{ fontSize: "0.74rem", color: active ? "#6366f1" : "text.secondary", minWidth: 44, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
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
            onChange={(m) => {
              setWatchMode(m);
              if (sessionId) adaptiveVideoService.sync(sessionId, { watch_mode: m }).catch(() => {});
            }}
          />
          <ReExplainPanel onReExplain={onReExplain} />
          <AutoChapters chapters={companion.chapters} currentTime={currentTime} onJump={(s) => ctl.seekTo(s)} />
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
      background: "color-mix(in srgb, #6366f1 9%, transparent)", color: "#6366f1", fontSize: "0.72rem", fontWeight: 800 }}>
      <Icon icon={icon} width={13} />
      {label}
    </Box>
  );
}

export default VideoCompanion;
