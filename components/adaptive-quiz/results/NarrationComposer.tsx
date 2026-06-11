"use client";

import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { AIBeacon } from "../shared/AIBeacon";
import type { SectionStatus } from "@/hooks/useStreamingNarration";

type Section = "headline" | "per_question" | "misconceptions" | "remediation_path";

interface NarrationComposerProps {
  status: Record<Section, SectionStatus>;
  onRetry: (section: Section) => void;
}

const SECTION_META: Record<Section, { label: string; loadingCopy: string }> = {
  headline: { label: "Headline read", loadingCopy: "Reading your accuracy curve…" },
  per_question: { label: "Per-question rationale", loadingCopy: "Annotating each answer…" },
  misconceptions: { label: "Misconception patterns", loadingCopy: "Clustering wrong answers…" },
  remediation_path: { label: "Next 15 minutes", loadingCopy: "Plotting a path forward…" },
};

const SECTION_ORDER: Section[] = ["headline", "per_question", "misconceptions", "remediation_path"];

/**
 * Single unified "AI is composing" surface — replaces the stack of chunky
 * per-section skeleton cards that used to pile up at the top of the results
 * page. One calm panel, four progress chips, a thin shimmer rail at the
 * bottom. Exits with a smooth fade once every section is in a terminal state.
 *
 * Failed chips become tap-to-retry pills inline — no separate red error block.
 */
export function NarrationComposer({ status, onRetry }: NarrationComposerProps) {
  const reduce = useReducedMotion();

  const counts = SECTION_ORDER.reduce(
    (acc, s) => {
      const st = status[s];
      if (st === "ready") acc.ready += 1;
      else if (st === "failed") acc.failed += 1;
      else if (st === "loading") acc.loading += 1;
      else acc.pending += 1;
      return acc;
    },
    { ready: 0, failed: 0, loading: 0, pending: 0 },
  );

  const total = SECTION_ORDER.length;
  const settled = counts.ready + counts.failed;
  const progress = settled / total;
  const allReady = counts.ready === total;
  const allSettled = settled === total;

  // Hide only when every section is ready. Keep visible while anything is
  // pending OR failed so retry is reachable.
  if (allReady) return null;

  const activeLoading = SECTION_ORDER.find((s) => status[s] === "loading");
  const subtitle = allSettled
    ? counts.failed === 1
      ? "One section didn't come through — tap it to retry."
      : `${counts.failed} sections didn't come through — tap to retry.`
    : activeLoading
      ? SECTION_META[activeLoading].loadingCopy
      : "Warming up the model…";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 2, md: 2.25 },
            borderRadius: 4,
            bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 72%, transparent)",
            border: "1px solid color-mix(in srgb, #6366f1 22%, transparent)",
            backdropFilter: "blur(18px) saturate(140%)",
            boxShadow: "0 1px 0 0 color-mix(in srgb, white 18%, transparent) inset, 0 24px 50px -36px color-mix(in srgb, #a855f7 60%, transparent)",
          }}
        >
          {/* Ambient drifting gradient wash */}
          <Box
            aria-hidden
            component={motion.div}
            animate={reduce ? undefined : { backgroundPositionX: ["0%", "100%", "0%"] }}
            transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: "linear" }}
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(120deg, color-mix(in srgb, #6366f1 7%, transparent) 0%, color-mix(in srgb, #a855f7 9%, transparent) 35%, color-mix(in srgb, #ec4899 7%, transparent) 70%, color-mix(in srgb, #6366f1 7%, transparent) 100%)",
              backgroundSize: "220% 100%",
              pointerEvents: "none",
            }}
          />

          {/* Top row: beacon, copy, count */}
          <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5 }}>
            <AIBeacon size={32} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#6366f1",
                  lineHeight: 1,
                }}
              >
                AI Tutor
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "0.98rem", md: "1.05rem" },
                  fontWeight: 800,
                  letterSpacing: "-0.015em",
                  mt: 0.4,
                  lineHeight: 1.25,
                  color: "text.primary",
                }}
              >
                {allSettled && counts.failed > 0 ? "Diagnostic almost ready" : "Composing your diagnostic"}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  color: "text.secondary",
                  mt: 0.4,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "1.35rem",
                  fontWeight: 900,
                  color: "#6366f1",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {counts.ready}
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.9rem" }}>
                  /{total}
                </Box>
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  color: "text.secondary",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 800,
                  mt: 0.4,
                }}
              >
                Sections
              </Typography>
            </Box>
          </Box>

          {/* Progress chips */}
          <Box
            sx={{
              position: "relative",
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              mt: 1.75,
            }}
          >
            {SECTION_ORDER.map((s) => (
              <SectionChip
                key={s}
                label={SECTION_META[s].label}
                status={status[s]}
                onRetry={status[s] === "failed" ? () => onRetry(s) : undefined}
              />
            ))}
          </Box>

          {/* Bottom shimmer rail */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
            }}
          >
            <Box
              component={motion.div}
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              sx={{
                height: "100%",
                background: "linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                boxShadow: "0 0 12px color-mix(in srgb, #a855f7 60%, transparent)",
              }}
            />
          </Box>
        </Box>
    </motion.div>
  );
}

interface SectionChipProps {
  label: string;
  status: SectionStatus;
  onRetry?: () => void;
}

function SectionChip({ label, status, onRetry }: SectionChipProps) {
  const reduce = useReducedMotion();

  const palette =
    status === "ready"
      ? { fg: "#10b981", glow: "#10b981" }
      : status === "failed"
        ? { fg: "#ef4444", glow: "#ef4444" }
        : status === "loading"
          ? { fg: "#6366f1", glow: "#a855f7" }
          : { fg: "#64748b", glow: "#64748b" };

  const isClickable = !!onRetry;

  return (
    <Box
      component={isClickable ? "button" : "div"}
      onClick={onRetry}
      type={isClickable ? "button" : undefined}
      sx={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        gap: 0.7,
        px: 1.15,
        py: 0.55,
        borderRadius: 999,
        bgcolor: `color-mix(in srgb, ${palette.fg} 9%, transparent)`,
        border: `1px solid color-mix(in srgb, ${palette.fg} 28%, transparent)`,
        fontSize: "0.74rem",
        fontWeight: 700,
        color: palette.fg,
        cursor: isClickable ? "pointer" : "default",
        fontFamily: "inherit",
        transition: "all 160ms ease",
        "&:hover": isClickable
          ? {
              bgcolor: `color-mix(in srgb, ${palette.fg} 16%, transparent)`,
              borderColor: `color-mix(in srgb, ${palette.fg} 45%, transparent)`,
            }
          : undefined,
      }}
    >
      {/* Loading shimmer sweep */}
      {status === "loading" && !reduce && (
        <Box
          aria-hidden
          component={motion.div}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${palette.glow} 26%, transparent) 50%, transparent 100%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Leading indicator */}
      <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        {status === "ready" ? (
          <Icon icon="mdi:check-circle" width={13} />
        ) : status === "failed" ? (
          <Icon icon="mdi:refresh" width={13} />
        ) : status === "loading" ? (
          <Box
            component={motion.span}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={reduce ? undefined : { duration: 1.1, repeat: Infinity, ease: "linear" }}
            sx={{
              display: "inline-block",
              width: 11,
              height: 11,
              borderRadius: "50%",
              border: `1.6px solid ${palette.fg}`,
              borderTopColor: "transparent",
            }}
          />
        ) : (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: palette.fg,
              opacity: 0.45,
            }}
          />
        )}
      </Box>

      <span style={{ position: "relative", whiteSpace: "nowrap" }}>{label}</span>
    </Box>
  );
}
