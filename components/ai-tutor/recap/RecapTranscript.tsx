"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { TutorSurface } from "../shared/surfaces";

/**
 * The full transcript, collapsed.
 *
 * It used to render open, unbounded, in a 420px scroll box, which made it the tallest thing on
 * the page by a wide margin. That is the wrong weight: the transcript is the reference material
 * you consult when the summary is not enough, not the point of the page. So it opens closed,
 * behind a count, and the summary and concepts get the attention instead.
 *
 * There is also a filter, because the most common reason to open a transcript is to find one
 * specific thing the tutor said, and scrolling a thirty-minute lesson to find it is the whole
 * problem.
 */

interface Turn {
  role: "tutor" | "student";
  text: string;
  offset_ms: number;
}

function stamp(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RecapTranscript({ turns }: { turns: Turn[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return turns;
    return turns.filter((turn) => turn.text.toLowerCase().includes(needle));
  }, [turns, query]);

  if (!turns.length) return null;

  return (
    <TutorSurface padded={false}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          width: "100%",
          px: { xs: 2, md: 2.5 },
          py: 1.75,
          border: "none",
          bgcolor: "transparent",
          fontFamily: "inherit",
          textAlign: "left",
          cursor: "pointer",
          "&:hover": { bgcolor: "var(--surface, #f8fafc)" },
          "&:focus-visible": {
            outline: "none",
            boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--ai-violet)",
          },
        }}
      >
        <Icon
          icon="solar:chat-square-bold-duotone"
          width={18}
          style={{ color: "var(--font-secondary)", flexShrink: 0 }}
        />
        <Typography sx={{ fontSize: "0.92rem", fontWeight: 500 }}>
          Full transcript
        </Typography>
        <Typography sx={{ fontSize: "0.88rem", color: "var(--font-secondary)" }}>
          {turns.length} turns
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Icon
          icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
          width={19}
          style={{ color: "var(--font-secondary)" }}
        />
      </Box>

      {open ? (
        <Box sx={{ borderTop: "1px solid var(--border-default)" }}>
          <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                borderRadius: "8px",
                border: "1px solid var(--border-default)",
                "&:focus-within": {
                  borderColor: "var(--ai-violet)",
                },
              }}
            >
              <Icon
                icon="solar:magnifer-linear"
                width={16}
                style={{ color: "var(--font-secondary)", flexShrink: 0 }}
              />
              <Box
                component="input"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Find something that was said"
                aria-label="Search the transcript"
                sx={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  bgcolor: "transparent",
                  fontFamily: "inherit",
                  // 16px at xs, or iOS Safari zooms the viewport on focus (DESIGN.md §6).
                  fontSize: { xs: "1rem", md: "0.9rem" },
                  py: 1.1,
                  color: "var(--font-primary)",
                }}
              />
              {query ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  sx={{
                    border: "none",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    p: 0.25,
                  }}
                >
                  <Icon icon="mdi:close" width={15} style={{ color: "var(--font-secondary)" }} />
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box sx={{ maxHeight: 460, overflowY: "auto", px: { xs: 2, md: 2.5 }, py: 2 }}>
            {filtered.length === 0 ? (
              <Typography sx={{ fontSize: "0.9rem", color: "var(--font-secondary)" }}>
                Nothing in this lesson matched that.
              </Typography>
            ) : (
              filtered.map((turn, i) => {
                const tutor = turn.role === "tutor";
                return (
                  <Box key={i} sx={{ mb: 2, "&:last-of-type": { mb: 0 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, mb: 0.4 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: 9999,
                          flexShrink: 0,
                          bgcolor: tutor ? "var(--ai-violet)" : "var(--font-secondary)",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: tutor ? "var(--ai-violet)" : "var(--font-secondary)",
                          '[dir="rtl"] &': {
                            letterSpacing: "normal",
                            textTransform: "none",
                          },
                        }}
                      >
                        {tutor ? "Tutor" : "You"}
                      </Typography>
                      {/* Where in the lesson this was, so a search hit has a position. */}
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          color: "var(--font-secondary)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {stamp(turn.offset_ms)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: "var(--font-secondary)",
                        pl: 1.4,
                        borderLeft: "2px solid",
                        borderColor: tutor
                          ? "color-mix(in srgb, var(--ai-violet) 35%, transparent)"
                          : "var(--border-default)",
                      }}
                    >
                      {turn.text}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      ) : null}
    </TutorSurface>
  );
}
