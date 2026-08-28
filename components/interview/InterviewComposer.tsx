"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { DIFFICULTIES, INTERVIEW_TYPES } from "@/lib/services/interview.service";

/**
 * "What do you want to be interviewed on?" - the composer, in the hub's hero.
 *
 * It sits INSIDE the header rather than in a card below it, following the AI Tutor's own
 * finding that splitting the primary action out made the page read as two competing headers.
 * Everything here therefore brings its own on-dark colours; the page's CSS variables are
 * tuned for light surfaces and would vanish.
 *
 * Three choices, in the order somebody actually makes them: what to talk about, what kind of
 * interview it is, and how long. Type comes before difficulty because it changes the shape of
 * the paper rather than its level: a behavioural interview and a system design interview are
 * different exercises, not different settings of one.
 *
 * A practice run is labelled as practice throughout, because nobody authored its paper: the
 * feedback is real, the score is not an assessment.
 */

const SUGGESTIONS = [
  "React hooks",
  "System design basics",
  "SQL joins and indexes",
  "A project you led",
  "Python data structures",
];

const LENGTHS = [5, 10, 15] as const;

/** One tone per difficulty, matching the interview cards below the hero. */
const DIFFICULTY_TONE: Record<string, string> = {
  Easy: "#4ade80",
  Medium: "#fbbf24",
  Hard: "#fb7185",
};

function Chip({
  active,
  onClick,
  children,
  tone,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: string;
  title?: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      sx={{
        all: "unset",
        cursor: "pointer",
        px: 1.5,
        py: 0.55,
        borderRadius: 999,
        fontSize: "0.8rem",
        fontWeight: active ? 600 : 500,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        color: active ? "#1e1b4b" : "rgba(255,255,255,0.88)",
        bgcolor: active ? tone ?? "#fff" : "rgba(255,255,255,0.1)",
        border: "1px solid",
        borderColor: active ? "transparent" : "rgba(255,255,255,0.22)",
        transition: "background-color 150ms ease, border-color 150ms ease",
        "&:hover": { borderColor: active ? "transparent" : "rgba(255,255,255,0.5)" },
        "&:focus-visible": { boxShadow: "0 0 0 2px #1e1b4b, 0 0 0 4px #fff" },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    >
      {children}
    </Box>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.6)",
        mb: 0.75,
        '[dir="rtl"] &': { letterSpacing: 0 },
      }}
    >
      {children}
    </Typography>
  );
}

export function InterviewComposer() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [type, setType] = useState<string>("mixed");
  const [starting, setStarting] = useState(false);

  const typeBlurb = useMemo(
    () => INTERVIEW_TYPES.find((t) => t.key === type)?.blurb ?? "",
    [type],
  );

  const start = useCallback(() => {
    const trimmed = topic.trim();
    if (!trimmed || starting) return;
    setStarting(true);
    // The room owns the session POST; navigating immediately keeps the click responsive and
    // lets a slow network show the room's own connecting state rather than a dead button.
    const params = new URLSearchParams({
      topic: trimmed,
      minutes: String(minutes),
      difficulty,
      type,
    });
    router.push(`/interview/room?${params.toString()}`);
  }, [difficulty, minutes, router, starting, topic, type]);

  return (
    <Box sx={{ mt: 2.5 }}>
      <FieldLabel>Practise anything</FieldLabel>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") start();
          }}
          placeholder="e.g. React hooks, or how I handled a difficult stakeholder"
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: 200, "aria-label": "Interview topic" } }}
          sx={{
            flex: "1 1 420px",
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255,255,255,0.12)",
              borderRadius: 2,
              "& fieldset": { borderColor: "rgba(255,255,255,0.28)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
              "&.Mui-focused fieldset": { borderColor: "#fff", borderWidth: 1 },
            },
            // Typed text, caret and placeholder all forced, at the same specificity as the
            // global rule in app/globals.css that sets a light-surface grey on
            // .MuiInputBase-input::placeholder and wins on source order. The caret is its own
            // property and does not follow WebkitTextFillColor, so it needs saying too.
            "& .MuiInputBase-input": {
              color: "#fff",
              WebkitTextFillColor: "#fff",
              caretColor: "#fff",
              fontSize: "0.95rem",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(255,255,255,0.7)",
              WebkitTextFillColor: "rgba(255,255,255,0.7)",
              opacity: 1,
            },
          }}
        />
        <Button
          onClick={start}
          disabled={!topic.trim() || starting}
          variant="contained"
          disableElevation
          startIcon={
            starting ? (
              <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : (
              <Icon icon="solar:microphone-3-bold" width={16} />
            )
          }
          sx={{
            bgcolor: "#fff",
            color: "#1e1b4b",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
            "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.35)", color: "rgba(30,27,75,0.5)" },
          }}
        >
          {starting ? "Starting" : "Start practice"}
        </Button>
      </Box>

      <Box sx={{ mt: 1.25, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {SUGGESTIONS.map((suggestion) => (
          <Box
            key={suggestion}
            component="button"
            type="button"
            onClick={() => setTopic(suggestion)}
            sx={{
              all: "unset",
              cursor: "pointer",
              px: 1.25,
              py: 0.35,
              borderRadius: 999,
              fontSize: "0.76rem",
              color: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(255,255,255,0.18)",
              transition: "border-color 150ms ease, color 150ms ease",
              "&:hover": { borderColor: "rgba(255,255,255,0.5)", color: "#fff" },
              "&:focus-visible": { boxShadow: "0 0 0 2px #1e1b4b, 0 0 0 4px #fff" },
            }}
          >
            {suggestion}
          </Box>
        ))}
      </Box>

      {/* The three choices, in the order somebody actually makes them. */}
      <Box
        sx={{
          mt: 2.25,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "auto auto auto" },
          gap: { xs: 1.75, md: 3 },
          alignItems: "start",
        }}
      >
        <Box>
          <FieldLabel>Kind of interview</FieldLabel>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {INTERVIEW_TYPES.map((option) => (
              <Chip
                key={option.key}
                active={type === option.key}
                onClick={() => setType(option.key)}
                title={option.blurb}
              >
                {option.label}
              </Chip>
            ))}
          </Box>
          {typeBlurb ? (
            <Typography sx={{ mt: 0.75, fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>
              {typeBlurb}
            </Typography>
          ) : null}
        </Box>

        <Box>
          <FieldLabel>Difficulty</FieldLabel>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {DIFFICULTIES.map((level) => (
              <Chip
                key={level}
                active={difficulty === level}
                onClick={() => setDifficulty(level)}
                tone={DIFFICULTY_TONE[level]}
              >
                {level}
              </Chip>
            ))}
          </Box>
        </Box>

        <Box>
          <FieldLabel>Length</FieldLabel>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {LENGTHS.map((length) => (
              <Chip
                key={length}
                active={minutes === length}
                onClick={() => setMinutes(length)}
              >
                {length} min
              </Chip>
            ))}
          </Box>
        </Box>
      </Box>

      <Typography sx={{ mt: 2, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
        Practice runs are marked as practice: the same interviewer and real feedback, but the
        score is not an assessment your course records.
      </Typography>
    </Box>
  );
}

export default InterviewComposer;
