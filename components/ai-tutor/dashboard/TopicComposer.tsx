"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { ChipToggle, TutorSurface } from "../shared/surfaces";
import Strands from "../room/Strands";
import type { TutorLevel, TutorQuota } from "@/lib/services/ai-tutor.service";

/**
 * "What do you want to learn today?"
 *
 * The hero of the dashboard, and the reason the page is never empty: this panel is
 * complete on first paint for a learner with no history at all. The quick-start chips are
 * curated rather than personalised, so they are there on day one.
 */

const QUICK_STARTS = [
  "Recursion",
  "Big-O notation",
  "React state",
  "SQL joins",
  "How caching works",
  "Binary search",
];

const LEVELS: { value: TutorLevel; label: string }[] = [
  { value: "beginner", label: "New to this" },
  { value: "intermediate", label: "Some idea" },
  { value: "advanced", label: "Pretty confident" },
];

export function TopicComposer({
  quota,
  starting,
  onStart,
}: {
  quota?: TutorQuota;
  starting: boolean;
  onStart: (input: { topic: string; level: TutorLevel; minutes: number }) => void;
}) {
  const reduceMotion =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<TutorLevel>("beginner");
  const [minutes, setMinutes] = useState(20);

  const maxMinutes = quota?.max_session_minutes ?? 20;
  const remaining = quota?.minutes_remaining ?? 0;
  const outOfMinutes = quota ? remaining < 2 : false;

  const durations = [10, 20, 30].filter((m) => m <= maxMinutes);
  if (!durations.includes(maxMinutes)) durations.push(maxMinutes);

  const submit = () => {
    const cleaned = topic.trim();
    if (!cleaned || starting || outOfMinutes) return;
    onStart({ topic: cleaned, level, minutes: Math.min(minutes, maxMinutes) });
  };

  return (
    <TutorSurface padded={false} sx={{ overflow: "hidden" }}>
      {/* An idle sample of the same effect the tutor speaks through, so the composer
          previews what a session looks like. Calm on purpose: this is not the live one. */}
      <Box
        sx={{
          position: "relative",
          height: 84,
          background:
            "radial-gradient(120% 160% at 15% 130%, #241653 0%, #140b2b 58%, #0d0720 100%)",
        }}
        aria-hidden
      >
        <Strands
          colors={["#7C3AED", "#A855F7", "#06B6D4"]}
          count={4}
          speed={0.22}
          waviness={0.95}
          amplitude={0.9}
          thickness={0.6}
          glow={2.2}
          intensity={0.5}
          saturation={1.35}
          scale={1.7}
          paused={reduceMotion}
        />
      </Box>
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
      <Typography sx={{ fontSize: "1.25rem", fontWeight: 600, mb: 0.5 }}>
        What do you want to learn today?
      </Typography>
      <Typography sx={{ fontSize: "0.88rem", color: "var(--font-tertiary)", mb: 2.5 }}>
        Say it in your own words. Your tutor will plan a lesson and talk you through it.
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderRadius: "10px",
          bgcolor: "transparent",
          boxShadow: "0 0 0 1px var(--border-default)",
          px: 1.75,
          transition: "box-shadow 160ms ease",
          "&:focus-within": {
            boxShadow: "0 0 0 2px var(--canvas), 0 0 0 4px var(--ai-violet)",
          },
        }}
      >
        <Icon
          icon="solar:magnifer-bold-duotone"
          width={18}
          height={18}
          style={{ color: "var(--font-tertiary)", flexShrink: 0 }}
        />
        <Box
          component="input"
          value={topic}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="e.g. how do B-trees actually stay balanced"
          aria-label="What do you want to learn"
          sx={{
            flex: 1,
            border: "none",
            outline: "none",
            bgcolor: "transparent",
            fontFamily: "inherit",
            fontSize: "1rem",
            py: 1.4,
            color: "var(--font-primary)",
            "&::placeholder": { color: "var(--font-tertiary)" },
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
        {QUICK_STARTS.map((suggestion) => (
          <Box
            key={suggestion}
            component="button"
            type="button"
            onClick={() => setTopic(suggestion)}
            sx={{
              px: 1.4,
              py: 0.55,
              borderRadius: 9999,
              border: "1px solid var(--border-default)",
              bgcolor: "transparent",
              fontFamily: "inherit",
              fontSize: "0.78rem",
              color: "var(--font-secondary)",
              cursor: "pointer",
              transition: "border-color 160ms ease",
              "&:hover": { borderColor: "var(--ai-violet)" },
            }}
          >
            {suggestion}
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box>
          <Typography
            sx={{ fontSize: "0.74rem", fontWeight: 500, color: "var(--font-tertiary)", mb: 0.75 }}
          >
            How much do you already know?
          </Typography>
          <ChipToggle
            options={LEVELS}
            value={level}
            onChange={(next) => setLevel(next as TutorLevel)}
          />
        </Box>
        <Box>
          <Typography
            sx={{ fontSize: "0.74rem", fontWeight: 500, color: "var(--font-tertiary)", mb: 0.75 }}
          >
            How long have you got?
          </Typography>
          <ChipToggle
            options={durations.map((m) => ({ value: String(m), label: `${m} min` }))}
            value={String(minutes)}
            onChange={(next) => setMinutes(Number(next))}
          />
        </Box>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={submit}
        disabled={!topic.trim() || starting || outOfMinutes}
        sx={{
          mt: 2.5,
          width: "100%",
          minHeight: 46,
          borderRadius: "8px",
          border: "none",
          fontFamily: "inherit",
          fontSize: "0.95rem",
          fontWeight: 500,
          color: "#fff",
          bgcolor: "var(--ai-violet)",
          cursor: "pointer",
          opacity: !topic.trim() || starting || outOfMinutes ? 0.45 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          "&:focus-visible": {
            outline: "none",
            boxShadow: "0 0 0 2px var(--canvas), 0 0 0 4px var(--ai-violet)",
          },
        }}
      >
        <Icon icon="solar:microphone-3-bold" width={18} />
        {starting
          ? "Setting up your lesson…"
          : outOfMinutes
            ? "No minutes left this month"
            : "Start talking"}
      </Box>

      <Typography
        sx={{ fontSize: "0.74rem", color: "var(--font-tertiary)", mt: 1.25, textAlign: "center" }}
      >
        You will be asked for microphone access. You can interrupt your tutor at any time.
      </Typography>
      </Box>
    </TutorSurface>
  );
}
