"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import { useToast } from "@/components/common/Toast";
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
 *  strengths, pace). Rendered under the Calibration tab + the sub-page. Each row
 *  can be granted a re-attempt (discards the prior result so the student can take
 *  calibration again; the re-submit supersedes their student model). */
export function CalibrationResultsSection({ courseId }: { courseId: number }) {
  const { showToast } = useToast();
  const [data, setData] = useState<CalibrationSubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // The student pending re-attempt confirmation, and the one currently processing.
  const [confirm, setConfirm] = useState<CalibrationSubmissionRow | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(courseId)) return;
    try {
      const d = await adaptiveJourneyService.getCalibrationSubmissions(courseId);
      setData(d);
    } catch {
      /* surfaced as empty state */
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await adaptiveJourneyService
        .getCalibrationSubmissions(courseId)
        .catch(() => null);
      if (!cancelled) {
        if (d) setData(d);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const runReattempt = async (s: CalibrationSubmissionRow) => {
    setBusyStudentId(s.student_id);
    try {
      const refreshed = await adaptiveJourneyService.allowCalibrationRetake(courseId, s.student_id);
      setData(refreshed);
      showToast(`Previous calibration discarded - ${s.name || "the student"} can re-take it now.`, "success");
    } catch {
      showToast("Could not allow the re-attempt. Please try again.", "error");
      // Refetch so the list reflects the true server state after a failure.
      void load();
    } finally {
      setBusyStudentId(null);
      setConfirm(null);
    }
  };

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
            <SubmissionRow
              key={s.submission_id}
              s={s}
              busy={busyStudentId === s.student_id}
              onReattempt={() => setConfirm(s)}
            />
          ))}
        </Stack>
      )}

      {/* Destructive-action confirm: granting a re-attempt discards the prior result. */}
      <Dialog open={!!confirm} onClose={() => (busyStudentId ? null : setConfirm(null))} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Allow a calibration re-attempt?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem" }}>
            This discards <strong>{confirm?.name || "this student"}</strong>&apos;s current calibration result. They can
            take the calibration again, and their new attempt will replace their student model (ability, pace, and
            strengths). This can&apos;t be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirm(null)}
            disabled={!!busyStudentId}
            sx={{ textTransform: "none", color: "var(--font-secondary)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            disabled={!!busyStudentId}
            onClick={() => confirm && runReattempt(confirm)}
            startIcon={
              busyStudentId ? (
                <CircularProgress size={15} color="inherit" />
              ) : (
                <Icon icon="mdi:replay" width={16} />
              )
            }
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Discard &amp; allow re-take
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SubmissionRow({
  s,
  busy,
  onReattempt,
}: {
  s: CalibrationSubmissionRow;
  busy: boolean;
  onReattempt: () => void;
}) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar src={s.profile_pic_url || undefined} sx={{ width: 38, height: 38 }}>{s.name?.[0]}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>{s.name}</Typography>
            <Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
              {s.email || "-"}
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
          <Button
            size="small"
            variant="outlined"
            disabled={busy}
            onClick={onReattempt}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:replay" width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, whiteSpace: "nowrap" }}
          >
            Allow re-attempt
          </Button>
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
