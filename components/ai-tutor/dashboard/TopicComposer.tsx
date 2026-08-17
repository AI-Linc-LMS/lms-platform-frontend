"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { ChipToggle, TutorSurface } from "../shared/surfaces";
import type { TutorLevel, TutorQuota } from "@/lib/services/ai-tutor.service";

/**
 * "What do you want to learn today?"
 *
 * The hero of the dashboard, and the reason the page is never empty: this panel is complete
 * on first paint for a learner with no history at all. The quick-start chips are curated
 * rather than personalised, so they are there on day one.
 *
 * The dark upper half is the brand surface `DESIGN.md` allows saturated colour on, and it is
 * what gives the page one obvious entry point. There is deliberately NO Strands ribbon here:
 * the ribbon is the tutor's voice, so it only appears where something is actually talking.
 * Decoration that looks like a live readout is worse than no decoration.
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
  onStart,
}: {
  quota?: TutorQuota;
  onStart: (input: { topic: string; level: TutorLevel; minutes: number }) => void;
}) {
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
    if (!cleaned || outOfMinutes) return;
    onStart({ topic: cleaned, level, minutes: Math.min(minutes, maxMinutes) });
  };

  const blocked = !topic.trim() || outOfMinutes;

  return (
    <TutorSurface padded={false} sx={{ overflow: "hidden" }}>
      {/* --- Dark hero: the ribbon and the ask, on one surface --- */}
      <Box
        sx={{
          position: "relative",
          px: { xs: 2.5, md: 4 },
          pt: { xs: 3.5, md: 4.5 },
          pb: { xs: 3, md: 4 },
          background:
            "radial-gradient(130% 150% at 12% 130%, #2b1a63 0%, #1a0f3d 48%, #0d0720 100%)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Icon icon="solar:soundwave-bold" width={16} style={{ color: "#c4b5fd" }} />
            <Typography
              sx={{
                fontSize: "0.74rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#c4b5fd",
                '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
              }}
            >
              Live voice tutor
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: { xs: "1.5rem", md: "1.85rem" },
              fontWeight: 600,
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
              color: "#ffffff",
              mb: 1,
            }}
          >
            What do you want to learn today?
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.8)",
              maxWidth: 560,
              mb: 3,
            }}
          >
            Say it in your own words. Your tutor plans a lesson, talks you through it, and
            you can interrupt any time.
          </Typography>

          {/* The input lives on the dark surface so the primary action is unmistakable. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.07)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.16)",
              px: 2,
              transition: "box-shadow 160ms ease, background-color 160ms ease",
              "&:focus-within": {
                bgcolor: "rgba(255,255,255,0.11)",
                boxShadow: "0 0 0 1px #0d0720, 0 0 0 3px #a855f7",
              },
            }}
          >
            <Icon
              icon="solar:magnifer-bold-duotone"
              width={19}
              height={19}
              style={{ color: "rgba(255,255,255,0.62)", flexShrink: 0 }}
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
                // 16px at xs, or iOS Safari zooms the viewport on focus (DESIGN.md §6).
                fontSize: { xs: "1rem", md: "1.05rem" },
                py: 1.6,
                color: "#ffffff",
                "&::placeholder": { color: "rgba(255,255,255,0.48)" },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            {QUICK_STARTS.map((suggestion) => (
              <Box
                key={suggestion}
                component="button"
                type="button"
                onClick={() => setTopic(suggestion)}
                sx={{
                  px: 1.6,
                  py: 0.7,
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.24)",
                  bgcolor: "rgba(255,255,255,0.06)",
                  fontFamily: "inherit",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  transition: "border-color 160ms ease, background-color 160ms ease",
                  "&:hover": {
                    borderColor: "#a855f7",
                    bgcolor: "rgba(168,85,247,0.18)",
                  },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: "0 0 0 2px #0d0720, 0 0 0 4px #a855f7",
                  },
                }}
              >
                {suggestion}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* --- Light half: the settings and the commit --- */}
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: { xs: 2, sm: 3 },
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 1,
              }}
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
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 1,
              }}
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
          disabled={blocked}
          sx={{
            mt: 3,
            width: "100%",
            minHeight: 50,
            borderRadius: "10px",
            border: "none",
            fontFamily: "inherit",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#fff",
            bgcolor: "var(--ai-violet)",
            cursor: blocked ? "not-allowed" : "pointer",
            opacity: blocked ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            transition: "filter 160ms ease",
            "&:hover:not(:disabled)": { filter: "brightness(1.08)" },
            "&:focus-visible": {
              outline: "none",
              boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--ai-violet)",
            },
          }}
        >
          <Icon icon="solar:microphone-3-bold" width={19} />
          {outOfMinutes ? "No minutes left this month" : "Start talking"}
        </Box>

        {/* Always rendered with a pinned line box, so the button never jumps at the moment
            somebody is reaching for it (DESIGN.md §6). */}
        <Typography
          sx={{
            minHeight: 18,
            fontSize: "0.8rem",
            lineHeight: "18px",
            color: "var(--font-secondary)",
            mt: 1.25,
            textAlign: "center",
          }}
        >
          {outOfMinutes
            ? "Your minutes reset at the start of next month."
            : "You will be asked for microphone access."}
        </Typography>
      </Box>
    </TutorSurface>
  );
}
