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
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import { adminStudentService, type Student } from "@/lib/services/admin/admin-student.service";
import { adminCohortsService } from "@/lib/services/admin/admin-cohorts.service";

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
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
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
    setSelected(new Set());
    setSearch("");
    void load("");
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void load(search), 350);
    return () => clearTimeout(t);
  }, [search, open, load]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const res = await adminCohortsService.enrollMembers(cohortId, Array.from(selected));
      const parts = [`${res.succeeded} enrolled`];
      if (res.skipped) parts.push(`${res.skipped} already in`);
      if (res.missing?.length) parts.push(`${res.missing.length} skipped`);
      showToast(parts.join(" · "), "success");
      onEnrolled();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't enroll.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Enroll students</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 1.5 }}
        />
        <Box sx={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
          {loading && <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>Loading…</Typography>}
          {!loading && students.length === 0 && (
            <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>No students found.</Typography>
          )}
          {students.map((s) => {
            const already = enrolledIds.has(s.id);
            return (
              <Box
                key={s.id}
                onClick={() => !already && toggle(s.id)}
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
                }}
              >
                <Checkbox checked={already || selected.has(s.id)} disabled={already} size="small" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }} noWrap>
                    {s.name || s.username || s.email}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }} noWrap>
                    {s.email}
                    {already ? " · already enrolled" : ""}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
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
          {saving ? "Enrolling…" : `Enroll ${selected.size || ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
