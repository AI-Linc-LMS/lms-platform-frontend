"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import {
  adminStudentService,
  type ProgressResetHistoryEntry,
  type ProgressResetPreview,
} from "@/lib/services/admin/admin-student.service";
import { ADAPTIVE, formatDateTime } from "./shared";

/**
 * Reset a student's learning progress.
 *
 * The whole design assumption is that this button will one day be pressed by mistake, so the
 * interface is built to make that mistake survivable rather than to make the action fast:
 *
 * - It opens on a **preview**, not a confirmation. The server counts exactly what it is about
 *   to delete, so the dialog names the rows instead of asking the admin to trust the verb.
 * - It states what **survives** as prominently as what goes. "Reset progress" reads like it
 *   might unenroll or delete the account, and an admin who is unsure will either not use the
 *   feature or use it and then panic.
 * - Confirmation is the student's **email, typed**. A yes/no dialog cannot catch the mistake
 *   that actually happens here, which is the right button on the wrong student.
 * - Past resets are listed inline, so "my work disappeared" is answerable from this page.
 */

/**
 * Human labels for the raw API keys, as [singular, plural].
 *
 * Both forms are spelled out rather than derived: "activity log entries" does not singularise by
 * dropping an "s", and "1 certificates" on a dialog this consequential reads as carelessness at
 * exactly the moment the admin is deciding whether to trust it.
 */
const ROW_LABELS: Record<string, [string, string]> = {
  score_events: ["scored activity", "scored activities"],
  journey_nodes: ["journey step", "journey steps"],
  points_wallets: ["points wallet", "points wallets"],
  ability_models: ["ability estimate", "ability estimates"],
  certificates: ["certificate", "certificates"],
  mock_interviews: ["mock interview", "mock interviews"],
  quiz_sessions: ["quiz session", "quiz sessions"],
  coding_sessions: ["coding session", "coding sessions"],
  video_sessions: ["video session", "video sessions"],
  streaks: ["streak", "streaks"],
  briefings: ["dashboard briefing", "dashboard briefings"],
  coding_ability: ["coding ability model", "coding ability models"],
  activity_log: ["activity log entry", "activity log entries"],
  time_tracking: ["time-tracking day", "time-tracking days"],
  assessment_submissions: ["assessment submission", "assessment submissions"],
  retake_grants_restored: ["retake grant given back", "retake grants given back"],
};

function label(key: string, n: number) {
  const pair = ROW_LABELS[key];
  if (!pair) return key.replace(/_/g, " ");
  return n === 1 ? pair[0] : pair[1];
}

export function ResetProgressCard({
  studentId,
  studentEmail,
  studentName,
  onReset,
}: {
  studentId: number;
  studentEmail: string;
  studentName: string;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [adaptive, setAdaptive] = useState(true);
  const [assessments, setAssessments] = useState(true);
  const [preview, setPreview] = useState<ProgressResetPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [history, setHistory] = useState<ProgressResetHistoryEntry[]>([]);

  const loadHistory = useCallback(() => {
    adminStudentService
      .getProgressResetHistory(studentId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [studentId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Re-preview whenever the scope changes: a dialog that shows counts for a scope the admin
  // has since changed is worse than showing none, because it reads as authoritative.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPreview(true);
    setError(null);
    adminStudentService
      .previewProgressReset(studentId, { adaptive, assessments })
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load what this would delete. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, adaptive, assessments, studentId]);

  const confirmed = confirmText.trim().toLowerCase() === studentEmail.trim().toLowerCase();
  const nothingSelected = !adaptive && !assessments;
  const nothingToDelete = preview !== null && preview.total === 0;

  const close = () => {
    setOpen(false);
    setConfirmText("");
    setNote("");
    setError(null);
    setPreview(null);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await adminStudentService.resetProgress(studentId, {
        adaptive,
        assessments,
        confirm_email: confirmText.trim(),
        note: note.trim() || undefined,
      });
      setDone(
        result.total > 0
          ? `Reset ${result.total} record${result.total === 1 ? "" : "s"} for ${studentName}.`
          : `Nothing was left to reset for ${studentName}.`
      );
      close();
      loadHistory();
      onReset?.();
    } catch (e) {
      const detail =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "The reset could not be completed. Nothing was changed.";
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, #ef4444 35%, transparent)",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, md: 2.5 },
          py: 1.75,
          borderBottom: "1px solid color-mix(in srgb, #ef4444 25%, transparent)",
          backgroundColor: "color-mix(in srgb, #ef4444 6%, transparent)",
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            backgroundColor: "color-mix(in srgb, #ef4444 14%, transparent)",
            color: ADAPTIVE.red,
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:restore-alert" size={19} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: "var(--font-primary)", lineHeight: 1.2 }}>
            Reset learning progress
          </Typography>
          <Typography sx={{ fontSize: "0.76rem", color: "var(--font-secondary)" }}>
            Puts this student back to never-attempted. This cannot be undone.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 2.5 }, display: "flex", flexDirection: "column", gap: 2 }}>
        {done && (
          <Alert severity="success" onClose={() => setDone(null)}>
            {done}
          </Alert>
        )}

        <Typography sx={{ fontSize: "0.84rem", color: "var(--font-secondary)" }}>
          Clears adaptive course progress, assessment submissions, points, streaks, certificates
          and the activity log. The student keeps their account and stays enrolled in every course
          and cohort — they simply start again from zero.
        </Typography>

        <Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<IconWrapper icon="mdi:restore-alert" size={17} />}
            onClick={() => setOpen(true)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Reset progress…
          </Button>
        </Box>

        {history.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                  mb: 1,
                }}
              >
                Previous resets
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {history.map((h) => (
                  <Box
                    key={h.id}
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 1,
                      fontSize: "0.8rem",
                      color: "var(--font-secondary)",
                    }}
                  >
                    <Chip
                      size="small"
                      label={`${h.total} record${h.total === 1 ? "" : "s"}`}
                      sx={{ fontWeight: 700, height: 22 }}
                    />
                    <span>{h.scope}</span>
                    <span>·</span>
                    <span>{formatDateTime(h.performed_at)}</span>
                    <span>·</span>
                    <span>by {h.performed_by}</span>
                    {h.note && <span style={{ fontStyle: "italic" }}>“{h.note}”</span>}
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Dialog open={open} onClose={submitting ? undefined : close} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.25 }}>
          <IconWrapper icon="mdi:alert-outline" size={22} color={ADAPTIVE.red} />
          Reset {studentName}&apos;s progress
        </DialogTitle>

        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", mb: 0.5 }}>
              What to reset
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={adaptive}
                  onChange={(e) => setAdaptive(e.target.checked)}
                  disabled={submitting}
                />
              }
              label="Adaptive course progress, points, streaks and certificates"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={assessments}
                  onChange={(e) => setAssessments(e.target.checked)}
                  disabled={submitting}
                />
              }
              label="Assessment submissions and scores"
            />
          </Box>

          <Divider />

          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", mb: 1 }}>
              This will permanently delete
            </Typography>
            {loadingPreview ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1 }}>
                <CircularProgress size={16} />
                <Typography sx={{ fontSize: "0.84rem", color: "var(--font-secondary)" }}>
                  Counting…
                </Typography>
              </Box>
            ) : nothingSelected ? (
              <Typography sx={{ fontSize: "0.84rem", color: "var(--font-secondary)" }}>
                Select at least one thing to reset.
              </Typography>
            ) : nothingToDelete ? (
              <Typography sx={{ fontSize: "0.84rem", color: "var(--font-secondary)" }}>
                Nothing — this student has no progress to reset.
              </Typography>
            ) : (
              <Box
                component="ul"
                sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.4 }}
              >
                {Object.entries(preview?.counts ?? {}).map(([key, n]) => (
                  <li key={key}>
                    <Typography component="span" sx={{ fontSize: "0.84rem" }}>
                      <strong>{n.toLocaleString()}</strong> {label(key, n)}
                    </Typography>
                  </li>
                ))}
              </Box>
            )}
          </Box>

          {preview && preview.preserved.length > 0 && (
            <Alert severity="info" icon={<IconWrapper icon="mdi:shield-check-outline" size={19} />}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", mb: 0.3 }}>
                Not affected
              </Typography>
              <Typography sx={{ fontSize: "0.8rem" }}>
                {preview.preserved.join(" · ")}
              </Typography>
            </Alert>
          )}

          <Box>
            <Typography sx={{ fontSize: "0.84rem", mb: 1 }}>
              To confirm, type <strong>{studentEmail}</strong>
            </Typography>
            <TextField
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={studentEmail}
              fullWidth
              size="small"
              autoComplete="off"
              disabled={submitting}
              error={confirmText.length > 0 && !confirmed}
              helperText={
                confirmText.length > 0 && !confirmed
                  ? "That is not this student's email address."
                  : " "
              }
            />
          </Box>

          <TextField
            value={note}
            onChange={(e) => setNote(e.target.value)}
            label="Reason (optional, kept in the audit log)"
            fullWidth
            size="small"
            disabled={submitting}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={close} disabled={submitting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            onClick={submit}
            loading={submitting}
            loadingText="Resetting…"
            disabled={!confirmed || nothingSelected || loadingPreview}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Reset progress
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
