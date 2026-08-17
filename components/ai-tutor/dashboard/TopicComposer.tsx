"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { TutorLevel, TutorQuota } from "@/lib/services/ai-tutor.service";

/**
 * "What do you want to learn today?" — rendered INSIDE the page header.
 *
 * It used to be a separate card below `ModulePageHeader`, which gave the page two competing
 * dark blocks stacked on each other. Living in the hero's `children` slot makes it one thing:
 * the module introduces itself and you act from it, on the same surface.
 *
 * Everything here is therefore styled for a dark gradient, not the light canvas. There is
 * deliberately no Strands ribbon: the ribbon is the tutor's voice and belongs in the room,
 * where something is actually talking.
 *
 * This is still what makes the dashboard never look empty — it is complete on first paint for a
 * learner with no history, because the quick-start chips are curated rather than personalised.
 */

const QUICK_STARTS = [
  "Recursion",
  "Big-O notation",
  "React state",
  "SQL joins",
  "How caching works",
  "Binary search",
];

/**
 * The placeholder rotates through real examples, same as the roadmaps create bar.
 *
 * An empty box with a single static hint tells a learner nothing about what they are allowed to
 * ask. Cycling real phrasings teaches the range — "how do B-trees stay balanced" and "why is my
 * useEffect running twice" are both valid, and seeing that is what stops people typing one word
 * and hoping.
 *
 * Rotation pauses the moment the field is focused or has any text: animation behind a cursor is
 * a distraction, not a hint.
 */
const PLACEHOLDER_EXAMPLES = [
  "how do B-trees actually stay balanced",
  "why is my useEffect running twice",
  "explain Big-O like I have never seen it",
  "when should I use a hash map over a tree",
  "walk me through recursion with the call stack",
  "what actually happens in a SQL join",
  "why is my code slow and how do I prove it",
  "teach me closures with a real example",
];

const ROTATE_MS = 2600;

const LEVELS: { value: TutorLevel; label: string }[] = [
  { value: "beginner", label: "New to this" },
  { value: "intermediate", label: "Some idea" },
  { value: "advanced", label: "Pretty confident" },
];

export function TopicComposer({
  quota,
  onStart,
}: {
  quota?: TutorQuota;
  onStart: (input: { topic: string; level: TutorLevel; minutes: number }) => void;
}) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<TutorLevel>("beginner");
  const [minutes, setMinutes] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);

  const idle = !focused && topic.trim() === "";

  useEffect(() => {
    if (idle === false) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) return;
    const timer = window.setInterval(
      () => setExampleIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length),
      ROTATE_MS
    );
    return () => window.clearInterval(timer);
  }, [idle]);

  const maxMinutes = quota?.max_session_minutes ?? 20;
  const remaining = quota?.minutes_remaining ?? 0;
  const outOfMinutes = quota ? remaining < 2 : false;

  const durations = [10, 20, 30].filter((m) => m <= maxMinutes);
  if (!durations.includes(maxMinutes)) durations.push(maxMinutes);
  // Derived, not stored: the tenant's cap can be tighter than any default, and holding a
  // selection in state that the cap has since invalidated is how you get a request for 30
  // minutes on a 15-minute tenant.
  const selectedMinutes =
    minutes !== null && durations.includes(minutes)
      ? minutes
      : durations[durations.length - 1] ?? maxMinutes;

  const submit = () => {
    const cleaned = topic.trim();
    if (!cleaned || outOfMinutes) return;
    onStart({ topic: cleaned, level, minutes: Math.min(selectedMinutes, maxMinutes) });
  };

  const blocked = !topic.trim() || outOfMinutes;

  return (
    <Box>
      {/* The ask */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderRadius: "12px",
          bgcolor: "rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
          px: 2,
          maxWidth: 720,
          transition: "box-shadow 160ms ease, background-color 160ms ease",
          "&:focus-within": {
            bgcolor: "rgba(255,255,255,0.13)",
            boxShadow: "0 0 0 1px rgba(13,7,32,0.9), 0 0 0 3px #a855f7",
          },
        }}
      >
        <Icon
          icon="solar:magnifer-bold-duotone"
          width={19}
          height={19}
          style={{ color: "rgba(255,255,255,0.65)", flexShrink: 0 }}
        />
        <Box
          component="input"
          value={topic}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") submit();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`e.g. ${PLACEHOLDER_EXAMPLES[exampleIndex]}`}
          aria-label="What do you want to learn"
          sx={{
            flex: 1,
            border: "none",
            outline: "none",
            bgcolor: "transparent",
            fontFamily: "inherit",
            // 16px at xs, or iOS Safari zooms the viewport on focus (DESIGN.md §6).
            fontSize: { xs: "1rem", md: "1.05rem" },
            py: 1.6,
            color: "#ffffff",
            "&::placeholder": {
              color: "rgba(255,255,255,0.5)",
              // Cross-fade, so a swap reads as one hint replacing another rather than a flicker.
              transition: "opacity 260ms ease",
            },
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.75 }}>
        {QUICK_STARTS.map((suggestion) => (
          <Box
            key={suggestion}
            component="button"
            type="button"
            onClick={() => setTopic(suggestion)}
            sx={chipSx(topic === suggestion)}
          >
            {suggestion}
          </Box>
        ))}
      </Box>

      {/* Settings and commit */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "auto auto 1fr" },
          gap: { xs: 2.25, md: 3 },
          alignItems: "end",
          mt: 3,
        }}
      >
        <Box>
          <Typography sx={labelSx}>How much do you already know?</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {LEVELS.map((option) => (
              <Box
                key={option.value}
                component="button"
                type="button"
                onClick={() => setLevel(option.value)}
                sx={chipSx(level === option.value)}
              >
                {option.label}
              </Box>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography sx={labelSx}>How long have you got?</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {durations.map((m) => (
              <Box
                key={m}
                component="button"
                type="button"
                onClick={() => setMinutes(m)}
                sx={chipSx(selectedMinutes === m)}
              >
                {m} min
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "stretch", md: "flex-end" },
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={submit}
            disabled={blocked}
            sx={{
              minHeight: 48,
              px: 3,
              width: { xs: "100%", md: "auto" },
              borderRadius: "10px",
              border: "none",
              fontFamily: "inherit",
              fontSize: "1rem",
              fontWeight: 600,
              // White on the violet hero: the strongest contrast available, and it keeps the
              // page's violet accent budget for the content below.
              color: "#2b1a63",
              bgcolor: "#ffffff",
              cursor: blocked ? "not-allowed" : "pointer",
              opacity: blocked ? 0.42 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              whiteSpace: "nowrap",
              transition: "filter 160ms ease",
              "&:hover:not(:disabled)": { filter: "brightness(0.95)" },
              "&:focus-visible": {
                outline: "none",
                boxShadow: "0 0 0 2px rgba(13,7,32,0.9), 0 0 0 4px #ffffff",
              },
            }}
          >
            <Icon icon="solar:microphone-3-bold" width={19} />
            {outOfMinutes ? "No minutes left" : "Start talking"}
          </Box>
          {/* Line box pinned, so the button never shifts under a reaching cursor
              (DESIGN.md §6). */}
          <Typography
            sx={{
              minHeight: 18,
              lineHeight: "18px",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.62)",
              mt: 1,
              textAlign: { xs: "center", md: "right" },
            }}
          >
            {outOfMinutes
              ? "Resets at the start of next month."
              : "You will be asked for microphone access."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

const labelSx = {
  fontSize: "0.76rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.62)",
  mb: 1,
  whiteSpace: "nowrap",
  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
} as const;

/** Pills are reserved for toggles, which every one of these is (DESIGN.md §6). */
function chipSx(active: boolean) {
  return {
    px: 1.6,
    py: 0.7,
    borderRadius: 9999,
    fontFamily: "inherit",
    fontSize: "0.84rem",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    border: "1px solid",
    borderColor: active ? "#ffffff" : "rgba(255,255,255,0.26)",
    bgcolor: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.06)",
    color: active ? "#2b1a63" : "rgba(255,255,255,0.9)",
    transition: "border-color 160ms ease, background-color 160ms ease, color 160ms ease",
    "&:hover": active ? {} : { borderColor: "#a855f7", bgcolor: "rgba(168,85,247,0.2)" },
    "&:focus-visible": {
      outline: "none",
      boxShadow: "0 0 0 2px rgba(13,7,32,0.9), 0 0 0 4px #a855f7",
    },
  } as const;
}
