"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  getMyLiveSessionFeedback,
  submitLiveSessionFeedback,
} from "@/lib/services/live-sessions/student-live-sessions.service";

interface Props {
  open: boolean;
  liveClassId: number | null;
  sessionTitle?: string;
  onClose: () => void;
  onSubmitted?: (message: string) => void;
}

/** A 1-5 star row. Ratings are whole numbers; the backend rejects anything outside 1-5. */
function StarRow({
  label,
  hint,
  value,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (n: number) => void;
  required?: boolean;
}) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }}>
        {label}
        {required && <Box component="span" sx={{ color: "#ef4444", ml: 0.5 }}>*</Box>}
      </Typography>
      {hint && (
        <Typography sx={{ color: "var(--font-tertiary)", fontSize: "0.76rem", mb: 0.5 }}>{hint}</Typography>
      )}
      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Box
            key={n}
            role="button"
            aria-label={`${label}: ${n} of 5`}
            tabIndex={0}
            onClick={() => onChange(n)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(n); } }}
            sx={{ cursor: "pointer", p: 0.25, borderRadius: 1, lineHeight: 0,
              "&:focus-visible": { outline: "2px solid var(--ai-violet)", outlineOffset: 2 } }}
          >
            <IconWrapper
              icon={value != null && n <= value ? "mdi:star" : "mdi:star-outline"}
              size={28}
              color={value != null && n <= value ? "#f59e0b" : "var(--border-default)"}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/**
 * Post-session feedback form.
 *
 * Answers go only to admins — never to the instructor being rated — and the copy says so, because a
 * learner who thinks their trainer will read it answers differently.
 */
export function LiveSessionFeedbackDialog({
  open,
  liveClassId,
  sessionTitle,
  onClose,
  onSubmitted,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySent, setAlreadySent] = useState(false);

  const [overall, setOverall] = useState<number | null>(null);
  const [content, setContent] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<number | null>(null);
  const [pace, setPace] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    if (!liveClassId) return;
    setLoading(true);
    setError(null);
    try {
      const state = await getMyLiveSessionFeedback(liveClassId);
      const mine = state.my_feedback;
      setAlreadySent(Boolean(mine));
      setOverall(mine?.overall_rating ?? null);
      setContent(mine?.content_rating ?? null);
      setDelivery(mine?.instructor_rating ?? null);
      setPace(mine?.pace_rating ?? null);
      setComment(mine?.comment ?? "");
    } catch {
      setError("Couldn't open the feedback form. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const save = async () => {
    if (!liveClassId || overall == null) return;
    setSaving(true);
    setError(null);
    try {
      await submitLiveSessionFeedback(liveClassId, {
        overall_rating: overall,
        content_rating: content,
        instructor_rating: delivery,
        pace_rating: pace,
        comment: comment.trim(),
      });
      onSubmitted?.(alreadySent ? "Your feedback was updated." : "Thanks — your feedback was sent.");
      onClose();
    } catch (e) {
      const detail = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(detail || "Couldn't send your feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
        How was this session?
        {sessionTitle && (
          <Typography sx={{ fontWeight: 500, fontSize: "0.86rem", color: "var(--font-secondary)" }} noWrap>
            {sessionTitle}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Stack spacing={2.25}>
            <Box sx={{ display: "flex", gap: 1, p: 1.25, borderRadius: 2,
              bgcolor: "color-mix(in srgb, var(--ai-violet) 8%, transparent)" }}>
              <IconWrapper icon="mdi:shield-lock-outline" size={17} color="var(--ai-violet)" />
              <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)" }}>
                Only your admin team sees this — not your instructor. Please answer honestly.
              </Typography>
            </Box>

            <StarRow label="Overall" value={overall} onChange={setOverall} required />
            <StarRow label="Content" hint="Was the material useful?" value={content} onChange={setContent} />
            <StarRow label="Delivery" hint="How well was it taught?" value={delivery} onChange={setDelivery} />
            <StarRow label="Pace" hint="Too slow, too fast, or just right?" value={pace} onChange={setPace} />

            <TextField
              label="Anything else? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />

            {error && (
              <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: "0.84rem" }}>{error}</Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>
          Not now
        </Button>
        <Button
          onClick={save}
          disabled={saving || loading || overall == null}
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 800 }}
        >
          {saving ? "Sending…" : alreadySent ? "Update feedback" : "Send feedback"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
