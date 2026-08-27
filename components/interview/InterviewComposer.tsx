"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * "What do you want to be interviewed on?" - the composer, in the hub's hero.
 *
 * The AI Tutor has had this since it shipped and the interview did not, so the only way in
 * was an interview an admin had assigned: a candidate who wanted to rehearse React the night
 * before an interview simply could not.
 *
 * It sits INSIDE the header rather than in a card below it, following the tutor's own
 * finding that splitting the primary action out made the page read as two competing headers.
 * Everything here therefore brings its own on-dark colours.
 *
 * A practice run is labelled as practice throughout, because nobody authored its paper: the
 * feedback is real, the score is not an assessment.
 */

const SUGGESTIONS = [
  "React hooks",
  "System design basics",
  "SQL joins and indexes",
  "Behavioural: a project you led",
  "Python data structures",
];

const LENGTHS = [5, 10, 15] as const;

export function InterviewComposer() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState<number>(10);
  const [starting, setStarting] = useState(false);

  const start = useCallback(() => {
    const trimmed = topic.trim();
    if (!trimmed || starting) return;
    setStarting(true);
    // The room owns the session POST; navigating immediately keeps the click responsive and
    // means a slow network shows the room's own connecting state rather than a dead button.
    router.push(
      `/interview/room?topic=${encodeURIComponent(trimmed)}&minutes=${minutes}`,
    );
  }, [minutes, router, starting, topic]);

  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography
        sx={{
          fontSize: "0.74rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.7)",
          mb: 1,
          '[dir="rtl"] &': { letterSpacing: 0 },
        }}
      >
        Practise anything
      </Typography>

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
            // Typed text and placeholder both forced, at the same specificity as the global
            // rule they were losing to.
            //
            // app/globals.css sets `.MuiInputBase-input::placeholder { color:
            // var(--font-tertiary) }`, a dark grey chosen for light surfaces. It matched the
            // specificity of the old `& input::placeholder` selector here and won on source
            // order, so the placeholder rendered dark-on-dark and was unreadable. Any input
            // on a dark surface in this codebase has that problem.
            //
            // WebkitTextFillColor as well as color, because that is what actually paints
            // input text in WebKit and what autofill overrides.
            "& .MuiInputBase-input": {
              color: "#fff",
              WebkitTextFillColor: "#fff",
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

      <Box sx={{ mt: 1.5, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
          Length
        </Typography>
        {LENGTHS.map((length) => {
          const active = minutes === length;
          return (
            <Box
              key={length}
              component="button"
              type="button"
              onClick={() => setMinutes(length)}
              aria-pressed={active}
              sx={{
                all: "unset",
                cursor: "pointer",
                px: 1.5,
                py: 0.4,
                borderRadius: 999,
                fontSize: "0.78rem",
                fontWeight: 500,
                color: active ? "#1e1b4b" : "rgba(255,255,255,0.85)",
                bgcolor: active ? "#fff" : "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                transition: "background-color 150ms ease",
                "&:focus-visible": { boxShadow: "0 0 0 2px #1e1b4b, 0 0 0 4px #fff" },
              }}
            >
              {length} min
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 1.5, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
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
              color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "border-color 150ms ease",
              "&:hover": { borderColor: "rgba(255,255,255,0.5)" },
              "&:focus-visible": { boxShadow: "0 0 0 2px #1e1b4b, 0 0 0 4px #fff" },
            }}
          >
            {suggestion}
          </Box>
        ))}
      </Box>

      <Typography sx={{ mt: 1.5, fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>
        Practice runs are marked as practice: you get the same interviewer and real feedback,
        but the score is not an assessment your course records.
      </Typography>
    </Box>
  );
}

export default InterviewComposer;
