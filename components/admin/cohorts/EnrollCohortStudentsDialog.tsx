"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adminStudentService, type Student } from "@/lib/services/admin/admin-student.service";
import { adminCohortsService } from "@/lib/services/admin/admin-cohorts.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE } from "@/components/common/mobile/phone";
import { TAP, useIsPhone } from "./cohortPhone";

export function EnrollCohortStudentsDialog({
  open,
  cohortId,
  enrolledIds,
  onClose,
  onEnrolled,
}: {
  open: boolean;
  cohortId: number;
  enrolledIds: Set<number>;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const { showToast } = useToast();
  const isPhone = useIsPhone();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  // Keyed by id but holding the whole row: a selection made under one search must still show its
  // name and email after the search changes, so the admin can see exactly who they are adding.
  const [selected, setSelected] = useState<Map<number, Student>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await adminStudentService.getManageStudents({
        search: q || undefined,
        role: "student",
        page: 1,
        limit: 20,
      });
      setStudents(res.students);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't load students.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Map());
    setSearch("");
    void load("");
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void load(search), 350);
    return () => clearTimeout(t);
  }, [search, open, load]);

  function toggle(student: Student) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(student.id)) next.delete(student.id);
      else next.set(student.id, student);
      return next;
    });
  }

  async function submit() {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const res = await adminCohortsService.enrollMembers(cohortId, Array.from(selected.keys()));
      const parts = [`${res.succeeded} enrolled`];
      if (res.skipped) parts.push(`${res.skipped} already in`);
      if (res.missing?.length) parts.push(`${res.missing.length} skipped`);
      showToast(parts.join(" · "), "success");
      onEnrolled();
      onClose();
    } catch (e) {
      // The server's own sentence, e.g. "An admin gave this batch a paid course, so only an admin
      // can add learners to it." Axios's message ("Request failed with status code 403") says nothing.
      showToast(getAxiosErrorDetail(e, "Couldn't enroll."), "error");
    } finally {
      setSaving(false);
    }
  }

  const searchField = (
    <TextField
      placeholder="Search by name or email…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      fullWidth
      size="small"
      sx={{ mb: 1.5 }}
    />
  );

  /** The student list. On a phone each row is a 52px target and the sheet's own body scrolls, so
   *  the list is not a second scroller nested inside it. */
  const list = (phone: boolean) => (
    <Box
      sx={
        phone
          ? { display: "flex", flexDirection: "column", gap: 0.5 }
          : { maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }
      }
    >
      {loading && <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>Loading…</Typography>}
      {!loading && students.length === 0 && (
        <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>No students found.</Typography>
      )}
      {students.map((s) => {
        const already = enrolledIds.has(s.id);
        return (
          <Box
            key={s.id}
            onClick={() => !already && toggle(s)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.75,
              borderRadius: 2,
              cursor: already ? "default" : "pointer",
              opacity: already ? 0.5 : 1,
              "&:hover": { bgcolor: already ? "transparent" : "color-mix(in srgb, #6366f1 8%, transparent)" },
              ...(phone ? { minHeight: 52 } : {}),
            }}
          >
            <Checkbox
              checked={already || selected.has(s.id)}
              disabled={already}
              size="small"
              sx={phone ? { width: TAP, height: TAP, flexShrink: 0 } : undefined}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }} noWrap>
                {s.name || s.username || s.email}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }} noWrap>
                {s.email}
                {already ? " · already enrolled" : ""}
              </Typography>
              <StudentHints s={s} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  /**
   * Who is about to be added, by name AND email, right above the Enroll button.
   *
   * The list alone was not enough: two learners on one tenant were "Gouse Basha" and "Shaik Ghouse
   * Hussain". A search for "gouse" matches only the first (the second is spelt with an h), the
   * admin ticked the one result, and "Enroll 1" said nothing about who that was. The wrong learner
   * was added and the right one sat without access to his batch's recordings for a day.
   */
  const review = selected.size > 0 && (
    <Box
      data-testid="enroll-review"
      sx={{ mt: 1.5, p: 1.25, borderRadius: 2, border: "1px solid var(--border-default)", bgcolor: "color-mix(in srgb, #6366f1 5%, transparent)" }}
    >
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "text.secondary", mb: 0.75 }}>
        {selected.size === 1 ? "You are adding 1 student - check the email:" : `You are adding ${selected.size} students - check each email:`}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 160, overflowY: "auto" }}>
        {Array.from(selected.values()).map((s) => (
          <Box key={s.id} data-testid="enroll-review-row" sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }} noWrap>
                {s.name || s.username || s.email}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }} noWrap>
                {s.email}
                {!s.last_login ? " · never signed in" : ""}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label={`Remove ${s.name || s.email}`}
              onClick={() => toggle(s)}
              disabled={saving}
              sx={{ [PHONE]: { width: TAP, height: TAP } }}
            >
              <Icon icon="mdi:close" width={16} />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const enrollLabel = saving ? "Enrolling…" : `Enroll ${selected.size || ""}`;

  if (isPhone) {
    // A bottom sheet that cannot be swiped away while the enrol request is in flight.
    return (
      <ResponsiveDialog
        open={open}
        onClose={() => {
          if (!saving) onClose();
        }}
        hideCloseButton={saving}
        title="Enroll students"
        data-testid="enroll-students-sheet"
        footer={
          <>
            <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", minHeight: TAP }}>
              Cancel
            </Button>
            <Button
              onClick={() => void submit()}
              disabled={saving || selected.size === 0}
              variant="contained"
              startIcon={<Icon icon="mdi:account-plus" width={16} />}
              sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700, minHeight: TAP }}
            >
              {enrollLabel}
            </Button>
          </>
        }
      >
        <Box sx={{ pt: 1 }}>
          {searchField}
          {list(true)}
          {review}
        </Box>
      </ResponsiveDialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Enroll students</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {searchField}
        {list(false)}
        {review}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={() => void submit()}
          disabled={saving || selected.size === 0}
          variant="contained"
          startIcon={<Icon icon="mdi:account-plus" width={16} />}
          sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
        >
          {enrollLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Under each result: whether the learner has ever signed in, and the batches they are already in.
 * Two same-looking names are easiest to tell apart by these - the account that has never signed
 * in is often not the person the admin is thinking of.
 */
function StudentHints({ s }: { s: Student }) {
  const batches = (s.cohorts ?? []).map((c) => c.name);
  if (s.last_login && batches.length === 0) return null;
  return (
    <Typography data-testid="student-hints" sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
      {!s.last_login && (
        <Box component="span" sx={{ color: "#b45309", fontWeight: 700 }}>
          Never signed in
        </Box>
      )}
      {!s.last_login && batches.length > 0 ? " · " : ""}
      {batches.length > 0 && `In: ${batches.slice(0, 2).join(", ")}${batches.length > 2 ? ` +${batches.length - 2}` : ""}`}
    </Typography>
  );
}
