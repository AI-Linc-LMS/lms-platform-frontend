"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminCohortsService,
  type CohortListItem,
} from "@/lib/services/admin/admin-cohorts.service";
import { AdminSectionSkeleton } from "@/components/courses/CourseSkeletons";

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
}

const STATUS_TONE: Record<string, string> = {
  active: "#10b981",
  scheduled: "#6366f1",
  draft: "#94a3b8",
  completed: "#a855f7",
  archived: "#94a3b8",
};

/**
 * Assign THIS adaptive course to one or more cohorts. Assigning enrolls each cohort's
 * current active students (and auto-enrolls future joiners) — handled server-side; we
 * just surface the enrolled counts.
 */
export function AssignToCohortsDialog({ open, onClose, courseId, courseTitle }: Props) {
  const { showToast } = useToast();
  const [cohorts, setCohorts] = useState<CohortListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setError(null);
    setLoading(true);
    adminCohortsService
      .listCohorts()
      .then((cs) => setCohorts(cs.filter((c) => c.status !== "archived")))
      .catch((e: unknown) => {
        const stat = (e as { response?: { status?: number } })?.response?.status;
        setError(
          stat === 403
            ? "The Cohort Builder isn't enabled for this account."
            : "Couldn't load cohorts. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function submit() {
    if (!selected.size) return;
    setSaving(true);
    let assigned = 0;
    let enrolled = 0;
    let already = 0;
    let failed = 0;
    for (const cid of selected) {
      try {
        const art = await adminCohortsService.assignArtifact(cid, {
          artifact_type: "adaptive_course",
          target_id: courseId,
        });
        assigned += 1;
        enrolled += art.enrolled ?? 0;
      } catch (e: unknown) {
        const stat = (e as { response?: { status?: number } })?.response?.status;
        if (stat === 409) already += 1;
        else failed += 1;
      }
    }
    setSaving(false);
    if (assigned > 0) {
      const parts = [`Assigned to ${assigned} cohort${assigned === 1 ? "" : "s"}`];
      if (enrolled > 0) parts.push(`${enrolled} student${enrolled === 1 ? "" : "s"} enrolled`);
      if (already > 0) parts.push(`${already} already assigned`);
      // These are N sequential calls, so a partial failure is the normal failure. Reporting
      // only the successes and closing the dialog told an admin the whole job was done while
      // some cohorts had silently 500'd — and closing removed the only place to retry them.
      if (failed > 0) {
        parts.push(`${failed} failed`);
        showToast(`${parts.join(" · ")}. The failed ones are still selected — try again.`, "error");
        return;
      }
      showToast(`${parts.join(" · ")}.`, "success");
      onClose();
    } else if (already > 0 && failed === 0) {
      showToast("Already assigned to the selected cohort(s).", "info");
      onClose();
    } else {
      showToast("Couldn't assign to the selected cohort(s).", "error");
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Assign to cohort
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "text.secondary", mt: 0.25 }}>
          Enrolls each cohort&apos;s active students in <strong>{courseTitle}</strong> and auto-enrolls anyone who joins later.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <AdminSectionSkeleton rows={4} showHeader={false} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 3, color: "text.secondary" }}>
            <Icon icon="mdi:information-outline" width={20} />
            <Typography sx={{ fontSize: "0.9rem" }}>{error}</Typography>
          </Box>
        ) : cohorts.length === 0 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 3, color: "text.secondary" }}>
            <Icon icon="mdi:account-group-outline" width={20} />
            <Typography sx={{ fontSize: "0.9rem" }}>
              No cohorts yet. Create one in Admin → Cohorts first.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {cohorts.map((c) => {
              const checked = selected.has(c.id);
              return (
                <Box
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: 2,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: checked ? "#6366f1" : "var(--border-default)",
                    bgcolor: checked ? "color-mix(in srgb,#6366f1 6%,transparent)" : "transparent",
                    "&:hover": { borderColor: "#6366f1" },
                  }}
                >
                  <Checkbox checked={checked} size="small" sx={{ p: 0.5 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }} noWrap>
                      {c.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                      {c.member_count} member{c.member_count === 1 ? "" : "s"}
                      {c.code ? ` · ${c.code}` : ""}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.2,
                      borderRadius: 999,
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      textTransform: "capitalize",
                      color: STATUS_TONE[c.status] ?? "#94a3b8",
                      bgcolor: `color-mix(in srgb, ${STATUS_TONE[c.status] ?? "#94a3b8"} 12%, transparent)`,
                    }}
                  >
                    {c.status}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          onClick={() => void submit()}
          disabled={saving || selected.size === 0}
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Icon icon="mdi:account-multiple-plus" width={16} />}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            color: "#fff",
            px: 2.5,
            borderRadius: 2,
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
            "&.Mui-disabled": { color: "rgba(255,255,255,0.7)", opacity: 0.6 },
          }}
        >
          {saving ? "Assigning…" : `Assign${selected.size ? ` (${selected.size})` : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
