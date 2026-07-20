"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  assessmentService,
  AssessmentReadiness,
} from "@/lib/services/assessment.service";

interface AssessmentReadinessPanelProps {
  slug: string;
}

/** Clamp a possibly-null metric into the 0–100 progress-bar range. */
function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * A single labeled progress bar rendered on the dark readiness card. Track and
 * label sit in translucent white so they read cleanly over the violet→pink
 * gradient; the fill is solid white.
 */
function ReadinessBar({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const pct = clampPercent(value);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "color-mix(in srgb, #fff 88%, transparent)",
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {typeof value === "number" ? `${Math.round(pct)}%` : "—"}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 7,
          borderRadius: 999,
          backgroundColor: "color-mix(in srgb, #fff 22%, transparent)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            backgroundColor: "#fff",
            transition: "width 0.5s ease",
          }}
        />
      </Box>
    </Box>
  );
}

/**
 * AssessmentReadinessPanel — the pre-attempt "AI Readiness Check" sidebar card.
 *
 * Fetches a readiness snapshot for the assessment and renders one of three
 * states: a subtle skeleton while loading; a dark violet→pink card with the
 * predicted score band, three metric bars, and a softest-topic tip when the
 * snapshot is available; or a gentle muted card carrying the backend's reason
 * when it is not. Fetch errors are caught here (never on the service) and
 * treated as unavailable so the page can never break on this panel.
 */
export function AssessmentReadinessPanel({
  slug,
}: AssessmentReadinessPanelProps) {
  const [readiness, setReadiness] = useState<AssessmentReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await assessmentService.getAssessmentReadiness(slug);
        if (!cancelled) setReadiness(data);
      } catch {
        // Never break the page on a readiness fetch error — degrade to the
        // "not available" state with no fabricated numbers.
        if (!cancelled) {
          setReadiness({
            available: false,
            overall_band: null,
            practice_accuracy: null,
            topic_coverage: null,
            confidence: null,
            softest_topic: null,
            skills: [],
            reason: null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── Loading: a subtle skeleton that hints at the card shape ──────────────
  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border-default)",
          bgcolor: "var(--card-bg)",
        }}
      >
        <Skeleton
          variant="rounded"
          width="60%"
          height={16}
          sx={{ mb: 2, bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--surface))" }}
        />
        <Skeleton
          variant="rounded"
          width="85%"
          height={24}
          sx={{ mb: 3, bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, var(--surface))" }}
        />
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={14}
            sx={{ mb: 1.5, bgcolor: "color-mix(in srgb, var(--ai-violet) 10%, var(--surface))" }}
          />
        ))}
      </Box>
    );
  }

  const available = readiness?.available === true;

  // ── Not available: gentle muted card, reason only, no fabricated numbers ──
  if (!available) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border-default)",
          bgcolor: "var(--surface)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <IconWrapper
            icon="mdi:star-four-points-outline"
            size={18}
            color="var(--ai-violet)"
          />
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: "var(--font-tertiary)",
            }}
          >
            AI Readiness Check
          </Typography>
        </Box>
        <Typography
          sx={{ fontSize: "0.875rem", color: "var(--font-secondary)", lineHeight: 1.6 }}
        >
          {readiness?.reason ||
            "We don't have enough practice history to estimate your readiness for this assessment yet."}
        </Typography>
      </Box>
    );
  }

  const softest = readiness?.softest_topic ?? null;

  // ── Available: dark violet→pink card with band + metric bars + tip ───────
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: "var(--radius-card)",
        background: "var(--gradient-ai)",
        color: "#fff",
        overflow: "hidden",
        boxShadow:
          "0 18px 40px -22px color-mix(in srgb, var(--ai-pink) 70%, transparent)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <IconWrapper icon="mdi:star-four-points" size={18} color="#fff" />
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: "color-mix(in srgb, #fff 86%, transparent)",
          }}
        >
          AI Readiness Check
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: "1.05rem",
          fontWeight: 700,
          lineHeight: 1.35,
          mb: 2.5,
        }}
      >
        You&apos;re likely to score:{" "}
        <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>
          {readiness?.overall_band ?? "—"}
        </Box>
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        <ReadinessBar label="Practice accuracy" value={readiness?.practice_accuracy ?? null} />
        <ReadinessBar label="Topic coverage" value={readiness?.topic_coverage ?? null} />
        <ReadinessBar label="Confidence" value={readiness?.confidence ?? null} />
      </Box>

      {softest && (
        <Box
          sx={{
            mt: 2.5,
            p: 1.5,
            borderRadius: 2,
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            backgroundColor: "color-mix(in srgb, #fff 14%, transparent)",
          }}
        >
          <IconWrapper icon="mdi:lightbulb-on-outline" size={16} color="#fff" />
          <Typography
            sx={{
              fontSize: "0.8rem",
              lineHeight: 1.55,
              color: "color-mix(in srgb, #fff 92%, transparent)",
            }}
          >
            <Box component="span" sx={{ fontWeight: 700 }}>
              {softest.name}
            </Box>{" "}
            is your softest topic here ({Math.round(clampPercent(softest.accuracy))}% practice
            accuracy) — worth a quick skim.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
