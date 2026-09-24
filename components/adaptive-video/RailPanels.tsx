"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { CompanionCard } from "./CompanionCard";
import type { Chapter, WatchMode } from "@/lib/services/adaptive-video.service";
import { PHONE } from "@/components/common/mobile/phone";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// --- Watch mode selector (spec §3.4a) ---------------------------------------

// `plain_english` is deliberately not offered. It read "Re-explain in plain English / Slower, with
// scaffolding" but the only thing it did was drop playback to 0.9x - no re-explanation and no
// scaffolding. Re-explaining is the "Feeling lost?" panel's job, where it is a real action on the
// clip you are actually on. The value stays in the WatchMode union because the backend contract
// still accepts it for historical sessions.
const MODES: { key: WatchMode; label: string; icon: string; hint: string }[] = [
  { key: "normal", label: "Normal pace", icon: "mdi:play-speed", hint: "Standard playback" },
  { key: "pause_60s", label: "Pause & ask every 60s", icon: "mdi:timer-sand", hint: "More frequent check-ins" },
];

// Shown only to someone who has already finished this video. Offering "no questions" before
// anyone has answered any would make the check-ins optional for everybody, and they are part of
// the score - so the server refuses it too, and quietly falls back to Normal pace.
const REWATCH_MODE: { key: WatchMode; label: string; icon: string; hint: string } = {
  key: "rewatch", label: "Rewatch", icon: "mdi:repeat", hint: "No questions - just the video",
};

export function WatchModeSelector({
  value,
  onChange,
  rewatchAvailable = false,
  busy = false,
  error = null,
}: {
  value: WatchMode;
  onChange: (m: WatchMode) => void;
  rewatchAvailable?: boolean;
  /** A switch is on its way to the server (and, out of Rewatch, fetching the questions). */
  busy?: boolean;
  /** Why the last switch did not happen - the selection has already gone back to the mode in force. */
  error?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <CompanionCard
      accent="#6366f1"
      title="Watch mode"
      icon="mdi:tune-vertical"
      right={
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.3, borderRadius: 999,
          background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", fontSize: "0.6rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800, letterSpacing: "0.08em" }}>
          <Icon icon="mdi:sparkles" width={11} /> ADAPTIVE
        </Box>
      }
    >
      <Box role="radiogroup" aria-label={t("adaptiveVideoMode.groupLabel")} sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {[...MODES, ...(rewatchAvailable ? [REWATCH_MODE] : [])].map((m) => {
          const active = value === m.key;
          return (
            <Box
              key={m.key}
              // A radio group, so a keyboard or a screen reader can tell which mode is in force
              // and change it - the options were bare clickable boxes.
              role="radio"
              aria-checked={active}
              tabIndex={0}
              onClick={() => onChange(m.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(m.key);
                }
              }}
              sx={{
                cursor: "pointer",
                "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: 2 },
                px: 1.5,
                py: 1,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                border: "1px solid",
                borderColor: active ? "color-mix(in srgb, #6366f1 55%, transparent)" : "transparent",
                background: active ? "color-mix(in srgb, #6366f1 10%, transparent)" : "transparent",
                transition: "all 140ms ease",
                "&:hover": { background: "color-mix(in srgb, #6366f1 7%, transparent)" },
              }}
            >
              <Icon icon={m.icon} width={17} style={{ color: active ? "#6366f1" : "#94a3b8", flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.84rem", fontWeight: active ? 800 : 600, lineHeight: 1.2 }}>{m.label}</Typography>
                <Typography sx={{ fontSize: "0.7rem", [PHONE]: { fontSize: "0.75rem" }, color: "text.secondary" }}>{m.hint}</Typography>
              </Box>
              {active && busy ? (
                <CircularProgress size={15} thickness={5} aria-label={t("adaptiveVideoMode.switching")} sx={{ color: "#6366f1", ml: "auto", flexShrink: 0 }} />
              ) : active ? (
                <Icon icon="mdi:check-circle" width={16} style={{ color: "#6366f1", marginLeft: "auto" }} />
              ) : null}
            </Box>
          );
        })}
      </Box>
      {error && (
        <Box role="alert" sx={{ mt: 1.25, display: "flex", gap: 0.75, alignItems: "flex-start" }}>
          <Icon icon="mdi:alert-circle-outline" width={15} style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
          <Typography sx={{ fontSize: "0.76rem", lineHeight: 1.45, color: "text.secondary" }}>{error}</Typography>
        </Box>
      )}
    </CompanionCard>
  );
}

// --- Auto chapters (spec §3.4c) ---------------------------------------------

export function AutoChapters({
  chapters,
  currentTime,
  onJump,
}: {
  chapters: Chapter[];
  currentTime: number;
  onJump: (seconds: number) => void;
}) {
  const activeIdx = chapters.reduce((acc, c, i) => (currentTime >= c.start_seconds ? i : acc), -1);
  if (!chapters.length) return null;
  return (
    <CompanionCard
      accent="#a855f7"
      title="Auto chapters"
      icon="mdi:format-list-bulleted"
      right={<Typography sx={{ fontSize: "0.66rem", [PHONE]: { fontSize: "0.75rem" }, color: "text.secondary", fontWeight: 700 }}>{chapters.length} detected</Typography>}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        {chapters.map((c, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <Box
              key={`${c.start_seconds}-${i}`}
              onClick={() => onJump(c.start_seconds)}
              sx={{
                cursor: "pointer", display: "flex", gap: 1, alignItems: "center", px: 1, py: 0.85, borderRadius: 1.5,
                background: active ? "color-mix(in srgb, #a855f7 10%, transparent)" : "transparent",
                transition: "background 140ms ease",
                "&:hover": { background: "color-mix(in srgb, #a855f7 6%, transparent)" },
              }}
            >
              <Icon
                icon={done ? "mdi:check-circle" : active ? "mdi:play-circle" : "mdi:circle-outline"}
                style={{ color: done ? "#16a34a" : active ? "#a855f7" : "#cbd5e1", flexShrink: 0 }}
                width={17}
              />
              <Typography sx={{ fontSize: "0.83rem", fontWeight: active ? 800 : 500 }}>
                <Box component="span" sx={{ color: "text.secondary", mr: 0.75, fontVariantNumeric: "tabular-nums" }}>{fmt(c.start_seconds)}</Box>
                {c.title}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </CompanionCard>
  );
}

// --- Live takeaways (spec §3.4d) - the dark "live" card ----------------------

export function LiveTakeaways({ takeaways, currentTime, chapters }: { takeaways: string[]; currentTime: number; chapters: Chapter[] }) {
  const lastChapterStart = chapters.length ? chapters[chapters.length - 1].start_seconds : 0;
  const ratio = lastChapterStart > 0 ? Math.min(currentTime / lastChapterStart, 1) : 1;
  const visible = Math.max(1, Math.ceil(takeaways.length * ratio));
  if (!takeaways.length) return null;
  return (
    <CompanionCard
      dark
      title="Key takeaways · live"
      icon="mdi:sparkles"
      accent="#a855f7"
      right={
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: "#34d399", boxShadow: "0 0 8px #34d399" }} />
          <Typography sx={{ fontSize: "0.62rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800, color: "#34d399" }}>{visible}/{takeaways.length}</Typography>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {takeaways.slice(0, visible).map((t, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1 }}>
            <Box sx={{ mt: "7px", width: 6, height: 6, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#a855f7,#ec4899)" }} />
            <Typography sx={{ fontSize: "0.86rem", lineHeight: 1.5, color: "rgba(255,255,255,0.92)" }}>{t}</Typography>
          </Box>
        ))}
      </Box>
    </CompanionCard>
  );
}
