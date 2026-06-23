"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Box, ButtonBase, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CalibrationAdminSection } from "@/components/admin/adaptive-course/CalibrationAdminSection";
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

export default function AdminCalibrationPage() {
  const router = useRouter();
  const courseId = Number(useParams().courseId);
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
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} /> Back to course
        </ButtonBase>

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
            <Icon icon="mdi:shield-half-full" width={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.3rem" }}>Calibration assessment</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              Generate &amp; edit the test, then review submissions and each student&apos;s AI profile.
            </Typography>
          </Box>
        </Stack>

        <CalibrationAdminSection courseId={courseId} />

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
    </MainLayout>
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
