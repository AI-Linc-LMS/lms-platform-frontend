"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import type { RoadmapCard } from "@/lib/services/roadmaps.service";
import { DRAWER_WIDTH } from "@/components/layout/Sidebar";

/**
 * The sticky "build me a course" bar at the foot of the roadmap catalog.
 *
 * Two deliberate choices:
 *
 * 1. **The placeholder rotates through real examples.** An empty box with "Search..." tells a
 *    learner nothing about what they may ask for. Cycling concrete phrases teaches the input's
 *    range without a paragraph of instructions above it.
 *
 * 2. **It suggests as you type, from roadmaps that actually exist.** Course building resolves
 *    against verified material by keyword; free text that matches nothing is a dead end, and a
 *    dead end in the one box on the page is worse than no box. Suggestions steer people onto
 *    paths we can genuinely build, while still allowing a raw phrase.
 *
 * The rotation pauses the moment the field is focused or has any text: animation behind a
 * cursor is a distraction, not a delight.
 */

const EXAMPLES = [
  "React hooks and state",
  "SQL joins and window functions",
  "Data structures for interviews",
  "Python for data analysis",
  "Aptitude and logical reasoning",
  "System design fundamentals",
  "Power BI dashboards",
  "Web performance and accessibility",
];

const ROTATE_MS = 2600;

export function CreateCourseBar({
  roadmaps,
  onSubmit,
  onPickRoadmap,
  busy = false,
}: {
  roadmaps: RoadmapCard[];
  onSubmit: (prompt: string) => void;
  onPickRoadmap: (slug: string) => void;
  busy?: boolean;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const idle = !focused && value.trim() === "";

  useEffect(() => {
    if (!idle) return;
    const t = window.setInterval(
      () => setExampleIndex((i) => (i + 1) % EXAMPLES.length),
      ROTATE_MS
    );
    return () => window.clearInterval(t);
  }, [idle]);

  const q = value.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (q.length < 2) return [];
    return roadmaps
      .filter(
        (r) =>
          r.pageTitle.toLowerCase().includes(q) ||
          r.cardTitle.toLowerCase().includes(q) ||
          (r.company?.displayName ?? "").toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [roadmaps, q]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSubmit(text);
  };

  return (
    <Box
      sx={{
        // FIXED, not sticky. The layout nests two `overflow: auto` boxes; the inner one becomes
        // sticky's scroll container but never scrolls (it sizes to its content), so a sticky
        // child never activates. Anchoring to the viewport is the only thing that holds here.
        // Offset by the sidebar so it spans the content column rather than the whole window.
        position: "fixed",
        bottom: 0,
        left: { xs: 0, md: `${DRAWER_WIDTH}px` },
        right: 0,
        zIndex: 1200,
        px: { xs: 2, md: 3 },
        pt: 2,
        // Clear the mobile bottom nav.
        pb: { xs: "84px", md: 2.5 },
        bgcolor: "var(--card-bg)",
        borderTop: "1px solid var(--border-default)",
      }}
    >
      <Box sx={{ maxWidth: 860, mx: "auto", position: "relative" }}>
        {suggestions.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              right: 0,
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              bgcolor: "var(--card-bg)",
              overflow: "hidden",
            }}
          >
            {suggestions.map((r) => (
              <Box
                key={r.slug}
                component="button"
                onMouseDown={(e: React.MouseEvent) => {
                  // mousedown, not click: blur would close the list first.
                  e.preventDefault();
                  onPickRoadmap(r.slug);
                }}
                sx={{
                  appearance: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "start",
                  cursor: "pointer",
                  px: 1.75,
                  py: 1.1,
                  bgcolor: "transparent",
                  color: "var(--font-primary)",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  "&:hover": { bgcolor: "var(--surface)" },
                }}
              >
                <Icon icon="solar:map-point-wave-linear" width={15} />
                {r.pageTitle}
                <Box
                  component="span"
                  sx={{ ml: "auto", fontSize: "0.75rem", color: "var(--font-tertiary)" }}
                >
                  open roadmap
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              position: "relative",
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              border: "1px solid var(--border-default)",
              bgcolor: "var(--surface)",
              px: 2,
              height: 52,
              "&:focus-within": {
                borderColor: "var(--accent-purple)",
              },
            }}
          >
            <Icon icon="solar:magic-stick-3-linear" width={18} />
            <Box
              component="input"
              ref={inputRef}
              value={value}
              disabled={busy}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") submit();
              }}
              aria-label="Describe the course you want"
              sx={{
                flex: 1,
                minWidth: 0,
                ml: 1.25,
                border: "none",
                outline: "none",
                bgcolor: "transparent",
                font: "inherit",
                fontSize: "0.95rem",
                color: "var(--font-primary)",
              }}
            />

            {/* The animated placeholder sits BEHIND the real input, which keeps its own
                placeholder empty. Rendering it as text means it can animate; a real
                placeholder attribute cannot. */}
            {idle && (
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  left: 52,
                  right: 16,
                  pointerEvents: "none",
                  overflow: "hidden",
                  height: 24,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={exampleIndex}
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        color: "var(--font-tertiary)",
                        lineHeight: "24px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Build me a course on {EXAMPLES[exampleIndex]}
                    </Typography>
                  </motion.div>
                </AnimatePresence>
              </Box>
            )}
          </Box>

          <Box
            component="button"
            onClick={submit}
            disabled={busy || !value.trim()}
            sx={{
              appearance: "none",
              border: "none",
              cursor: busy || !value.trim() ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 2.5,
              height: 52,
              borderRadius: 999,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#fff",
              bgcolor:
                busy || !value.trim()
                  ? "color-mix(in srgb, var(--accent-purple) 30%, #1e1b4b)"
                  : "color-mix(in srgb, var(--accent-purple) 65%, #1e1b4b)",
              whiteSpace: "nowrap",
            }}
          >
            {busy ? (
              <>
                <Icon icon="svg-spinners:180-ring-with-bg" width={17} />
                Building
              </>
            ) : (
              <>
                <Icon icon="solar:add-circle-linear" width={17} />
                Create course
              </>
            )}
          </Box>
        </Stack>

        <Typography
          sx={{ mt: 1, fontSize: "0.76rem", color: "var(--font-tertiary)", textAlign: "center" }}
        >
          Built from the verified question bank, not generated by AI.
        </Typography>
      </Box>
    </Box>
  );
}
