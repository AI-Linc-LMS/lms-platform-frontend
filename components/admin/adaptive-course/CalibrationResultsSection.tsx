"use client";

import { useEffect, useState } from "react";
import { Avatar, Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type {
  CalibrationSubmissionRow,
  CalibrationSubmissionsResponse,
} from "@/lib/types/adaptive-journey";

const TIER_COLOR: Record<string, string> = {
  beginner: "#f59e0b",
  intermediate: "#3b82f6",
  advanced: "#16a34a",
};

/** Per-student calibration submissions + their seeded Student Model (level,
 *  strengths, pace). Rendered under the Calibration tab + the sub-page. */
export function CalibrationResultsSection({ courseId }: { courseId: number }) {
  const [data, setData] = useState<CalibrationSubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await adaptiveJourneyService.getCalibrationSubmissions(courseId);
        if (!cancelled) setData(d);
      } catch {
        /* surfaced as empty state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, mt: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Submissions &amp; student model</Typography>
        {data && <Chip label={`${data.submission_count} submitted`} size="small" sx={{ fontWeight: 700 }} />}
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>
          <CircularProgress sx={{ color: "#6366f1" }} />
        </Box>
      ) : !data || data.submissions.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default, #ececf1)" }}>
          <Icon icon="mdi:inbox-outline" width={36} style={{ opacity: 0.4 }} />
          <Typography sx={{ color: "text.secondary", mt: 1 }}>No calibration submissions yet.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.25}>
          {data.submissions.map((s) => (
            <SubmissionRow key={s.submission_id} s={s} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function SubmissionRow({ s }: { s: CalibrationSubmissionRow }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar src={s.profile_pic_url || undefined} sx={{ width: 38, height: 38 }}>{s.name?.[0]}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>{s.name}</Typography>
            <Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
              {s.email || "—"}
              {s.submitted_at ? ` · ${new Date(s.submitted_at).toLocaleDateString()}` : ""}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
          {s.level_label && (
            <Chip label={s.level_label} size="small" sx={{ fontWeight: 800, color: "white", bgcolor: TIER_COLOR[s.field_tier || "intermediate"] }} />
          )}
          {s.ability_index != null && <Chip label={`Ability ${Math.round(s.ability_index)}`} size="small" variant="outlined" />}
          {s.pace && <Chip label={`Pace: ${s.pace}`} size="small" variant="outlined" />}
        </Stack>
      </Stack>
      {s.summary && (
        <Typography sx={{ mt: 1, fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.5 }}>{s.summary}</Typography>
      )}
      {(s.strengths.length > 0 || s.growth_areas.length > 0) && (
        <Stack direction="row" flexWrap="wrap" sx={{ mt: 1, gap: 0.75 }}>
          {s.strengths.map((x) => (
            <Chip key={`s-${x.dimension}`} size="small" label={x.dimension} sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }} />
          ))}
          {s.growth_areas.map((x) => (
            <Chip key={`g-${x.dimension}`} size="small" label={x.dimension} sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 700 }} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
