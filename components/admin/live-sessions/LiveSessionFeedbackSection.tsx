"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  getLiveSessionFeedbackSummary,
  type LiveSessionFeedbackSummary,
} from "@/lib/services/admin/admin-live-activities.service";

const RATING_TONE = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981"];

function toneFor(value: number | null): string {
  if (value == null) return "var(--font-tertiary)";
  return RATING_TONE[Math.min(4, Math.max(0, Math.round(value) - 1))];
}

function Stars({ value }: { value: number | null }) {
  if (value == null) return <Typography sx={{ color: "var(--font-tertiary)" }}>—</Typography>;
  return (
    <Stack direction="row" spacing={0.25} alignItems="center">
      {[1, 2, 3, 4, 5].map((n) => (
        <IconWrapper
          key={n}
          icon={value >= n - 0.25 ? "mdi:star" : value >= n - 0.75 ? "mdi:star-half-full" : "mdi:star-outline"}
          size={15}
          color={value >= n - 0.75 ? "#f59e0b" : "var(--border-default)"}
        />
      ))}
    </Stack>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <Box sx={{ flex: "1 1 140px", p: 1.5, borderRadius: 2, border: "1px solid var(--border-default)" }}>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: ".04em",
        textTransform: "uppercase", color: "var(--font-tertiary)" }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 0.5 }}>
        <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: toneFor(value),
          fontVariantNumeric: "tabular-nums" }}>
          {value == null ? "—" : value.toFixed(1)}
        </Typography>
        <Stars value={value} />
      </Stack>
    </Box>
  );
}

/**
 * Admin-only view of a session's post-session feedback.
 *
 * The backend refuses this to instructors — including the one who taught the session — so a 403 is
 * an expected outcome here, not a failure: it is rendered as a plain explanation rather than an
 * error, so an instructor who somehow reaches this screen is not shown a scary red state.
 */
export function LiveSessionFeedbackSection({ liveClassId }: { liveClassId: number }) {
  const [data, setData] = useState<LiveSessionFeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setData(await getLiveSessionFeedbackSummary(liveClassId));
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 403) setForbidden(true);
      else setError("Couldn't load feedback for this session.");
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <CircularProgress size={26} />
      </Box>
    );
  }

  if (forbidden) {
    return (
      <Box sx={{ p: 3, borderRadius: 3, border: "1px dashed var(--border-default)", textAlign: "center" }}>
        <IconWrapper icon="mdi:lock-outline" size={26} color="var(--font-tertiary)" />
        <Typography sx={{ mt: 1, fontWeight: 700 }}>Session feedback is visible to admins only</Typography>
        <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.86rem", mt: 0.5 }}>
          Ratings stay private from the instructor being rated, so learners can answer honestly.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <Typography sx={{ color: "#ef4444", fontWeight: 700, py: 3 }}>{error}</Typography>;
  }

  const summary = data?.summary;
  const responses = data?.responses ?? [];

  if (!summary || summary.responses === 0) {
    return (
      <Box sx={{ p: 3, borderRadius: 3, border: "1px dashed var(--border-default)", textAlign: "center" }}>
        <IconWrapper icon="mdi:comment-quote-outline" size={26} color="var(--font-tertiary)" />
        <Typography sx={{ mt: 1, fontWeight: 700 }}>No feedback yet</Typography>
        <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.86rem", mt: 0.5 }}>
          Learners can rate this session once it has finished.
        </Typography>
      </Box>
    );
  }

  const maxCount = Math.max(...Object.values(summary.distribution), 1);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5 }}>
        <Metric label="Overall" value={summary.overall_rating} />
        <Metric label="Content" value={summary.content_rating} />
        <Metric label="Delivery" value={summary.instructor_rating} />
        <Metric label="Pace" value={summary.pace_rating} />
      </Stack>

      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 1 }}>
          {summary.responses} response{summary.responses === 1 ? "" : "s"}
        </Typography>
        <Stack spacing={0.6}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution[String(star)] ?? 0;
            return (
              <Stack key={star} direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ width: 34, fontSize: "0.78rem", color: "var(--font-secondary)",
                  fontVariantNumeric: "tabular-nums" }}>
                  {star}★
                </Typography>
                <Box sx={{ flex: 1, height: 8, borderRadius: 999, bgcolor: "var(--border-default)", overflow: "hidden" }}>
                  <Box sx={{ width: `${(count / maxCount) * 100}%`, height: "100%",
                    bgcolor: RATING_TONE[star - 1], transition: "width .3s" }} />
                </Box>
                <Typography sx={{ width: 26, textAlign: "right", fontSize: "0.78rem",
                  fontVariantNumeric: "tabular-nums", color: "var(--font-secondary)" }}>
                  {count}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <Stack spacing={1.25}>
        {responses.map((r) => (
          <Box key={r.id} sx={{ p: 1.75, borderRadius: 2.5, border: "1px solid var(--border-default)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }} noWrap>
                  {r.student?.name || r.student?.email || "Learner"}
                </Typography>
                <Typography sx={{ color: "var(--font-tertiary)", fontSize: "0.76rem" }} noWrap>
                  {r.student?.email}
                  {r.cohort_name ? ` · ${r.cohort_name}` : ""}
                </Typography>
              </Box>
              <Stars value={r.overall_rating} />
            </Stack>
            {r.comment && (
              <Typography sx={{ mt: 1, fontSize: "0.86rem", color: "var(--font-secondary)", whiteSpace: "pre-wrap" }}>
                {r.comment}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
