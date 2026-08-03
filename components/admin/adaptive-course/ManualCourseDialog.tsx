"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

const INDIGO = "#6366f1";
const PURPLE = "#a855f7";

const MIN_TITLE = 2;
const MIN_WEEKS = 1;
const MAX_WEEKS = 52;
const DEFAULT_WEEKS = "8";

/**
 * Create an empty adaptive course that the admin fills in by hand.
 *
 * The sibling of the "Generate adaptive course" flow, and the copy leans on the one distinction
 * that actually changes what the admin does next: generation returns a course already written,
 * this one returns a shell whose first module does not exist yet. An admin who picks the wrong
 * door here loses either a prompt or an afternoon, so the difference is stated on the dialog
 * rather than left to the button label.
 */
export function ManualCourseDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (courseId: number) => void;
}) {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  /**
   * Held as a string, not a number. A numeric state cannot tell "the admin cleared the field"
   * apart from 0, and the two need different outcomes: cleared means omit `duration_weeks` from
   * the payload and let the server keep its own default, 0 means a value the server rejects.
   */
  const [weeks, setWeeks] = useState(DEFAULT_WEEKS);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed on every open. Without this a failed attempt's text, and its red Alert, would be
  // sitting there the next time the admin opens the dialog to create an unrelated course.
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setAudience("");
    setWeeks(DEFAULT_WEEKS);
    setError(null);
    setSaving(false);
  }, [open]);

  const titleValid = title.trim().length >= MIN_TITLE;

  const weeksRaw = weeks.trim();
  const weeksNum = Number(weeksRaw);
  // Empty is legal (the field is optional). Anything present must be a whole number in range —
  // checked here so a typo costs a helper line instead of a round trip and a bounced form.
  const weeksValid =
    weeksRaw === "" ||
    (Number.isInteger(weeksNum) && weeksNum >= MIN_WEEKS && weeksNum <= MAX_WEEKS);

  const canCreate = titleValid && weeksValid && !saving;

  const handleCreate = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      const course = await adminAdaptiveCourseService.createBlankCourse({
        title: title.trim(),
        // Optional fields are omitted rather than sent empty: a blank string is a value the
        // server would store, overwriting whatever default the course template carries.
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(audience.trim() ? { target_audience: audience.trim() } : {}),
        ...(weeksRaw ? { duration_weeks: weeksNum } : {}),
      });
      showToast("Course created. Add your first module.", "success");
      onCreated(course.id);
      onClose();
    } catch (e) {
      // Deliberately no onClose() and no field reset. The dialog stays exactly as typed so a
      // 500 or a dropped connection costs a second click, not the whole form.
      setError(getAxiosErrorDetail(e, "Couldn't create the course. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      // Closing mid-save would strand the request: the course would exist but onCreated would
      // never fire, leaving the admin on a list that does not show it until a refresh.
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-default)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`,
              color: "#fff",
            }}
          >
            <Icon icon="mdi:table-column-plus-after" width={18} />
          </Box>
          <Typography
            component="span"
            sx={{ fontSize: 18, fontWeight: 700, color: "var(--font-primary)" }}
          >
            Build a course manually
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box
          sx={{
            display: "flex",
            gap: 1.25,
            p: 1.5,
            mb: 2.5,
            mt: 0.5,
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            backgroundColor: `${INDIGO}0d`,
          }}
        >
          <Icon
            icon="mdi:information-outline"
            width={18}
            style={{ color: INDIGO, flexShrink: 0, marginTop: 2 }}
          />
          <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "var(--font-secondary)" }}>
            Generating a course writes the modules, topics and items for you from a prompt. This
            creates the shell only — the title and outline below, then you add every module, topic
            and item yourself. Pick this when you already know the shape of the course.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            icon={<Icon icon="mdi:alert-circle-outline" width={20} />}
            sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}
          >
            {error}
          </Alert>
        )}

        <TextField
          label="Course title"
          required
          autoFocus
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Programming Fundamentals with Python"
          disabled={saving}
          // Only nag once there is something to nag about — a required-field error on an
          // untouched field is noise the admin has not earned yet.
          error={title.length > 0 && !titleValid}
          helperText={
            title.length > 0 && !titleValid
              ? `Give it at least ${MIN_TITLE} characters.`
              : "Students see this name in the catalog. You can rename it later."
          }
          sx={{ mb: 2.25 }}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What the course covers and what a student walks away able to do."
          disabled={saving}
          helperText="Optional."
          sx={{ mb: 2.25 }}
        />

        <TextField
          label="Target audience"
          fullWidth
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. Final-year CS students with no prior Python"
          disabled={saving}
          helperText="Optional. Used to pitch the difficulty of the course."
          sx={{ mb: 2.25 }}
        />

        <TextField
          label="Duration (weeks)"
          type="number"
          value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
          disabled={saving}
          error={!weeksValid}
          helperText={
            !weeksValid
              ? `Enter a whole number between ${MIN_WEEKS} and ${MAX_WEEKS}, or leave it empty.`
              : "Optional. Sets the default pacing of the weekly plan."
          }
          inputProps={{ min: MIN_WEEKS, max: MAX_WEEKS, step: 1 }}
          sx={{ width: { xs: "100%", sm: 220 } }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <LoadingButton
          variant="text"
          onClick={onClose}
          disabled={saving}
          sx={{ color: "var(--font-secondary)", textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </LoadingButton>
        <LoadingButton
          variant="contained"
          onClick={handleCreate}
          loading={saving}
          loadingText="Creating..."
          disabled={!canCreate}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 2.5,
            color: "#fff",
            background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`,
            boxShadow: `0 6px 16px ${INDIGO}40`,
            "&:hover": {
              background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`,
              filter: "brightness(1.06)",
              boxShadow: `0 8px 20px ${INDIGO}55`,
            },
            // The gradient is painted by `background`, which MUI's disabled rule does not clear,
            // so a disabled button would otherwise still look fully enabled.
            "&.Mui-disabled": {
              background: "var(--border-default)",
              color: "var(--font-secondary)",
              boxShadow: "none",
            },
          }}
        >
          Create course
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
