"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Collapse, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import {
  adaptiveCodingService,
  type CodingSubmissionHistoryItem,
} from "@/lib/services/adaptive-coding.service";

/**
 * "Submissions" for the current problem on the AI Coding Mentor page.
 *
 * Lists the learner's past graded Submits (GET /problems/<id>/submissions/),
 * newest first, each expandable to the exact code that was submitted and its
 * verdict. `refreshKey` is bumped by the parent after a submit so a new row
 * appears without a reload.
 */
export function AdaptiveCodingSubmissions({
  problemId,
  refreshKey = 0,
}: {
  problemId: number;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<CodingSubmissionHistoryItem[] | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adaptiveCodingService.listProblemSubmissions(problemId);
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]); // soft-fail: history is non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [problemId, refreshKey]);

  if (items === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }
  if (items.length === 0) return null; // nothing submitted yet - keep the page clean

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        background: "var(--card-bg, #fff)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.75,
          py: 1.1,
          background: "color-mix(in srgb, var(--border-default) 14%, transparent)",
        }}
      >
        <Icon icon="mdi:history" width={18} style={{ color: "#6366f1" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>Submissions</Typography>
        <Box
          sx={{
            ml: 0.25,
            px: 0.75,
            py: 0.1,
            borderRadius: 999,
            fontSize: "0.7rem",
            fontWeight: 800,
            color: "#6366f1",
            background: "color-mix(in srgb, #6366f1 12%, transparent)",
          }}
        >
          {items.length}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {items.map((s, i) => (
          <SubmissionRow
            key={s.id}
            sub={s}
            index={items.length - i}
            expanded={expandedId === s.id}
            onToggle={() => setExpandedId((cur) => (cur === s.id ? null : s.id))}
          />
        ))}
      </Box>
    </Box>
  );
}

function SubmissionRow({
  sub,
  index,
  expanded,
  onToggle,
}: {
  sub: CodingSubmissionHistoryItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = sub.all_passed ? "#10b981" : "#ef4444";
  const verdict = sub.all_passed ? "Accepted" : `${sub.passed_count}/${sub.total_count} passed`;

  return (
    <Box
      sx={{
        borderTop: "1px solid color-mix(in srgb, var(--border-default) 45%, transparent)",
        "&:first-of-type": { borderTop: "none" },
      }}
    >
      <Box
        component="button"
        onClick={onToggle}
        sx={{
          all: "unset",
          boxSizing: "border-box",
          width: "100%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.75,
          py: 1.1,
          "&:hover": { background: "color-mix(in srgb, var(--border-default) 12%, transparent)" },
        }}
      >
        <Icon
          icon={sub.all_passed ? "mdi:check-circle" : "mdi:close-circle-outline"}
          width={18}
          style={{ color, flexShrink: 0 }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color }}>
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 700 }}>
              #{index}
            </Box>{" "}
            {verdict}
          </Typography>
          {!sub.all_passed && sub.whats_wrong && (
            <Typography
              sx={{
                fontSize: "0.72rem",
                color: "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {sub.whats_wrong}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Typography
            sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}
          >
            {sub.language}
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
            {formatWhen(sub.created_at)}
          </Typography>
        </Box>
        <Icon
          icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"}
          width={18}
          style={{ color: "var(--font-secondary, #94a3b8)", flexShrink: 0 }}
        />
      </Box>

      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ px: 1.75, pb: 1.5 }}>
          {sub.conceptual_gap && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                mb: 1,
                px: 0.85,
                py: 0.25,
                borderRadius: 999,
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#b45309",
                background: "color-mix(in srgb, #f59e0b 14%, transparent)",
              }}
            >
              <Icon icon="mdi:lightbulb-alert-outline" width={13} />
              {sub.conceptual_gap.replace(/_/g, " ")}
            </Box>
          )}
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.25,
              borderRadius: 1.5,
              maxHeight: 320,
              overflow: "auto",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.76rem",
              lineHeight: 1.55,
              whiteSpace: "pre",
              color: "#e2e8f0",
              background: "#0f172a",
              border: "1px solid color-mix(in srgb, var(--border-default) 50%, transparent)",
            }}
          >
            {sub.source || "-"}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default AdaptiveCodingSubmissions;
