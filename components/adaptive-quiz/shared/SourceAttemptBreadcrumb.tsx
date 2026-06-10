"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

interface SourceAttemptBreadcrumbProps {
  source: {
    session_id: string;
    quiz_title: string;
    completed_at: string | null;
  };
  /** When the user is mid-quiz, clicking the breadcrumb hands them off to the
   *  source attempt's results page. ``onBeforeNavigate`` lets the live page
   *  show a confirm dialog before navigating away. Omit on the results page
   *  (no work to lose). */
  onBeforeNavigate?: () => boolean;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "earlier";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/**
 * Clickable breadcrumb shown above the live quiz header and the results
 * header on every re-quiz session, linking back to the source attempt's
 * results page. Visible only when ``session.source_attempt`` is set.
 */
export function SourceAttemptBreadcrumb({ source, onBeforeNavigate }: SourceAttemptBreadcrumbProps) {
  const router = useRouter();

  function handleClick() {
    if (onBeforeNavigate && !onBeforeNavigate()) return;
    router.push(`/adaptive-quizzes/session/${source.session_id}/results`);
  }

  return (
    <ButtonBase
      onClick={handleClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.6,
        borderRadius: 999,
        border: "1px solid color-mix(in srgb, #a855f7 32%, transparent)",
        bgcolor: "color-mix(in srgb, #a855f7 8%, transparent)",
        color: "#a855f7",
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.02em",
        transition: "background 120ms ease, transform 120ms ease, border-color 120ms ease",
        "&:hover": {
          bgcolor: "color-mix(in srgb, #a855f7 14%, transparent)",
          borderColor: "color-mix(in srgb, #a855f7 55%, transparent)",
          transform: "translateY(-1px)",
        },
      }}
      aria-label={`Open source attempt results: ${source.quiz_title}`}
    >
      <Icon icon="mdi:arrow-u-left-top" width={14} />
      <Typography component="span" sx={{ fontSize: "0.72rem", fontWeight: 800 }}>
        From: <Box component="span" sx={{ color: "text.primary" }}>{source.quiz_title}</Box>
      </Typography>
      <Box
        component="span"
        sx={{
          color: "text.secondary",
          fontSize: "0.68rem",
          fontWeight: 700,
          ml: 0.25,
        }}
      >
        · {relativeTime(source.completed_at)}
      </Box>
    </ButtonBase>
  );
}
