"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { CompanionCard } from "./CompanionCard";
import type { Chapter, WatchMode } from "@/lib/services/adaptive-video.service";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// --- Watch mode selector (spec §3.4a) ---------------------------------------

const MODES: { key: WatchMode; label: string; icon: string; hint: string }[] = [
  { key: "normal", label: "Normal pace", icon: "mdi:play-speed", hint: "Standard playback" },
  { key: "pause_60s", label: "Pause & ask every 60s", icon: "mdi:timer-sand", hint: "More frequent check-ins" },
  { key: "plain_english", label: "Re-explain in plain English", icon: "mdi:translate", hint: "Slower, with scaffolding" },
];

export function WatchModeSelector({ value, onChange }: { value: WatchMode; onChange: (m: WatchMode) => void }) {
  return (
    <CompanionCard
      accent="#6366f1"
      title="Watch mode"
      icon="mdi:tune-vertical"
      right={
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.3, borderRadius: 999,
          background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.08em" }}>
          <Icon icon="mdi:sparkles" width={11} /> ADAPTIVE
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {MODES.map((m) => {
          const active = value === m.key;
          return (
            <Box
              key={m.key}
              onClick={() => onChange(m.key)}
              sx={{
                cursor: "pointer",
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
                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{m.hint}</Typography>
              </Box>
              {active && <Icon icon="mdi:check-circle" width={16} style={{ color: "#6366f1", marginLeft: "auto" }} />}
            </Box>
          );
        })}
      </Box>
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
      right={<Typography sx={{ fontSize: "0.66rem", color: "text.secondary", fontWeight: 700 }}>{chapters.length} detected</Typography>}
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

// --- Live takeaways (spec §3.4d) — the dark "live" card ----------------------

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
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: "#34d399" }}>{visible}/{takeaways.length}</Typography>
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
