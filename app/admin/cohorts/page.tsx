"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  adminCohortsService,
  type CohortListItem,
  type CohortStatus,
} from "@/lib/services/admin/admin-cohorts.service";

const STATUS_COLOR: Record<CohortStatus, string> = {
  draft: "#94a3b8",
  scheduled: "#6366f1",
  active: "#10b981",
  completed: "#0ea5e9",
  archived: "#a1a1aa",
};

const STATUS_OPTIONS: CohortStatus[] = ["draft", "scheduled", "active", "completed", "archived"];

export default function AdminCohortsPage() {
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  const [cohorts, setCohorts] = useState<CohortListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CohortListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setCohorts(await adminCohortsService.listCohorts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load cohorts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = cohorts.filter((c) => c.status === "active").length;
    const members = cohorts.reduce((n, c) => n + c.member_count, 0);
    const artifacts = cohorts.reduce((n, c) => n + c.artifact_count, 0);
    return { total: cohorts.length, active, members, artifacts };
  }, [cohorts]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminCohortsService.deleteCohort(pendingDelete.id);
      setCohorts((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      showToast(`"${pendingDelete.name}" archived.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't delete.", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Manage · Cohorts"
            title="Cohort Builder"
            subtitle="Group students into time-boxed cohorts and map learning artifacts — adaptive courses, live-session series, assessments, mock interviews and job tracks — to the cohort. Enroll a batch once; everything you assign reaches exactly those learners."
            icon="mdi:account-group-outline"
            accent="indigo"
            rightSlot={
              <ButtonBase
                onClick={() => setCreateOpen(true)}
                sx={{
                  px: 3,
                  py: 1.4,
                  borderRadius: 999,
                  fontWeight: 800,
                  color: "white",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
                  boxShadow: "0 18px 36px -16px rgba(168, 85, 247, 0.55)",
                  fontSize: "0.92rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  "&:hover": { transform: "translateY(-1px)" },
                  transition: "transform 120ms ease",
                }}
              >
                <Icon icon="mdi:plus" width={18} />
                New cohort
              </ButtonBase>
            }
          />

          {cohorts.length > 0 && (
            <KpiRail
              items={[
                { value: stats.total, label: "Cohorts", accent: "#6366f1" },
                { value: stats.active, label: "Active", accent: "#10b981" },
                { value: stats.members, label: "Members", accent: "#ec4899" },
                { value: stats.artifacts, label: "Assignments", accent: "#a855f7" },
              ]}
            />
          )}

          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>Loading…</Typography>
          )}
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>
          )}

          {!loading && !error && cohorts.length === 0 && (
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                textAlign: "center",
                bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
              }}
            >
              <Icon icon="mdi:account-group-outline" width={48} style={{ color: "#a855f7" }} />
              <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>No cohorts yet.</Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 560, mx: "auto", lineHeight: 1.5 }}>
                Click <strong>New cohort</strong> to create a batch, then enroll students and map assessments,
                interviews, courses and live sessions to it.
              </Typography>
            </Box>
          )}

          {!loading && cohorts.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              {cohorts.map((cohort, idx) => (
                <Reveal key={cohort.id} delay={Math.min(idx, 8) * 0.05}>
                  <CohortCard
                    cohort={cohort}
                    onOpen={() => push(`/admin/cohorts/${cohort.id}`)}
                    onDelete={() => setPendingDelete(cohort)}
                  />
                </Reveal>
              ))}
            </Box>
          )}
        </AdaptiveSectionShell>
      </Box>

      <CreateCohortDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(c) => {
          setCreateOpen(false);
          push(`/admin/cohorts/${c.id}`);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Archive cohort"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed from the working set. Member and assignment history is kept — nothing is destroyed.`
            : ""
        }
        confirmText={deleting ? "Archiving…" : "Archive"}
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </MainLayout>
  );
}

function Metric({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Icon icon={icon} width={16} style={{ color: "#a855f7" }} />
      <Typography component="span" sx={{ fontWeight: 800, fontSize: "0.9rem" }}>
        {value}
      </Typography>
      <Typography component="span" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
        {label}
      </Typography>
    </Box>
  );
}

function CohortCard({
  cohort,
  onOpen,
  onDelete,
}: {
  cohort: CohortListItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const color = STATUS_COLOR[cohort.status];
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        p: 2.5,
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "box-shadow 160ms ease, transform 160ms ease",
        "&:hover": { boxShadow: "0 20px 40px -24px rgba(99,102,241,0.45)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Box
          sx={{
            px: 1.25,
            py: 0.35,
            borderRadius: 999,
            fontSize: "0.7rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color,
            bgcolor: `color-mix(in srgb, ${color} 14%, transparent)`,
          }}
        >
          {cohort.status}
        </Box>
        <ButtonBase
          onClick={onDelete}
          sx={{ p: 0.5, borderRadius: 2, color: "text.secondary", "&:hover": { color: "#ef4444" } }}
          aria-label="Archive cohort"
        >
          <Icon icon="mdi:archive-outline" width={18} />
        </ButtonBase>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.3 }}>{cohort.name}</Typography>
      {cohort.code && (
        <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", mt: 0.25, fontFamily: "monospace" }}>
          {cohort.code}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
        <Metric icon="mdi:account-multiple" value={cohort.member_count} label="members" />
        <Metric icon="mdi:cube-outline" value={cohort.artifact_count} label="assignments" />
      </Box>
      {(cohort.start_date || cohort.end_date) && (
        <Typography sx={{ color: "text.secondary", fontSize: "0.78rem", mt: 1 }}>
          {cohort.start_date || "—"} → {cohort.end_date || "—"}
        </Typography>
      )}

      <Box sx={{ flexGrow: 1 }} />
      <Button
        onClick={onOpen}
        variant="outlined"
        fullWidth
        sx={{ mt: 2, borderRadius: 999, fontWeight: 700, textTransform: "none" }}
      >
        Open
      </Button>
    </Box>
  );
}

function CreateCohortDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: CohortListItem) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<CohortStatus>("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setCode("");
      setStatus("draft");
      setStartDate("");
      setEndDate("");
    }
  }, [open]);

  async function submit() {
    if (!name.trim()) {
      showToast("Give the cohort a name.", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await adminCohortsService.createCohort({
        name: name.trim(),
        code: code.trim() || null,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      showToast("Cohort created.", "success");
      onCreated(created);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't create cohort.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>New cohort</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus fullWidth />
        <TextField
          label="Code (optional)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          helperText="A stable identifier, e.g. DS-2025-JAN"
          fullWidth
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as CohortStatus)}
          fullWidth
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={() => void submit()}
          disabled={saving}
          variant="contained"
          sx={{ textTransform: "none", borderRadius: 999, fontWeight: 700 }}
        >
          {saving ? "Creating…" : "Create cohort"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
