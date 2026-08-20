"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  RosterStudent,
  UnmatchedParticipant,
} from "@/lib/services/admin/admin-live-activities.service";
import { formatDurationSeconds } from "@/lib/utils/date-utils";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

interface Props {
  liveClassId: number;
  /** The unmatched Zoom row being attached. Must carry participant_id (guarded by the caller). */
  participant: UnmatchedParticipant;
  /** The roster students already in the payload - the only people this row may be attached to. */
  students: RosterStudent[];
  /** One sitting of a recurring series; omit for a single session. */
  occurrenceId?: number | null;
  onClose: () => void;
  /** Called after a successful identify so the caller can refresh its payload. */
  onDone: () => void | Promise<void>;
}

/**
 * Attach an unmatched Zoom participant ("Rahul's iPad", a personal-account name) to a roster
 * student via the identify endpoint. The student keeps the REAL Zoom duration - unlike a manual
 * present-mark - and the backend records a name alias so the same display name auto-matches next
 * week instead of landing back in this list.
 */
export function AssignParticipantDialog({ liveClassId, participant, students, occurrenceId, onClose, onDone }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [studentId, setStudentId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (studentId === "" || saving || participant.participant_id == null) return;
    try {
      setSaving(true);
      await adminLiveActivitiesService.identifyParticipant(liveClassId, {
        participant_id: participant.participant_id,
        student_id: studentId,
        ...(occurrenceId ? { occurrence_id: occurrenceId } : {}),
      });
      const student = students.find((s) => s.user_profile_id === studentId);
      showToast(
        t(
          "adminLiveSessions.participantIdentified",
          "Attendance recorded for {{name}}. This Zoom name will auto-match next time.",
          { name: student?.name || "the student" }
        ),
        "success"
      );
      await onDone();
      onClose();
    } catch (e) {
      showToast(getAxiosErrorDetail(e, t("adminLiveSessions.identifyFailed", "Couldn't assign this participant.")), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.02rem", color: "var(--font-primary)" }}>
        {t("adminLiveSessions.assignToStudent", "Assign to student")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            <strong>{participant.name || t("adminLiveSessions.noName", "(no name)")}</strong>
            {" · "}
            {formatDurationSeconds(participant.duration_seconds)}
            {participant.email ? ` · ${participant.email}` : ""}
          </Typography>
          <TextField
            select
            label={t("adminLiveSessions.student", "Student")}
            value={studentId === "" ? "" : String(studentId)}
            onChange={(e) => setStudentId(e.target.value === "" ? "" : Number(e.target.value))}
            fullWidth
            size="small"
            helperText={t(
              "adminLiveSessions.identifyHelp",
              "They keep the real Zoom duration, and this name auto-matches to them next session."
            )}
          >
            {students.map((s) => (
              <MenuItem key={s.user_profile_id} value={String(s.user_profile_id)}>
                {s.name || s.email}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}>
          {t("adminLiveSessions.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={() => void submit()}
          disabled={studentId === "" || saving}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            background: "var(--accent-indigo)",
            color: "#fff",
            "&:hover": { background: "var(--accent-indigo-dark)" },
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : t("adminLiveSessions.assign", "Assign")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
