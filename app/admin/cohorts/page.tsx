"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import {
  AssessmentFilterBar,
  AssessmentEmptyState,
  StatStrip,
  type StatItem,
  SegmentedTabs,
  type SegmentedTab,
} from "@/components/admin/assessment/shared";
import { CohortCard } from "@/components/admin/cohorts/CohortCard";
import { ViewToggle, type ListView } from "@/components/common/list";
import {
  adminCohortsService,
  type CohortListItem,
  type CohortStatus,
} from "@/lib/services/admin/admin-cohorts.service";

const COHORT_ACCENT = "#a855f7";

const STATUS_LABEL: Record<CohortStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

type StatusTab = "all" | CohortStatus;

const STATUS_OPTIONS: CohortStatus[] = ["draft", "scheduled", "active", "completed", "archived"];

export default function AdminCohortsPage() {
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  const [cohorts, setCohorts] = useState<CohortListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ListView>("cards");
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: cohorts.length };
    for (const s of STATUS_OPTIONS) c[s] = 0;
    for (const co of cohorts) c[co.status] = (c[co.status] ?? 0) + 1;
    return c;
  }, [cohorts]);

  const stats: StatItem[] = useMemo(
    () => [
      { label: "Cohorts", value: cohorts.length, icon: "mdi:account-group", tone: "var(--ai-violet, #7c3aed)" },
      { label: "Active", value: counts.active ?? 0, icon: "mdi:play-circle-outline", tone: "var(--success-500, #5fa564)" },
      { label: "Members", value: cohorts.reduce((n, c) => n + c.member_count, 0), icon: "mdi:account-multiple", tone: "var(--ai-pink, #ec4899)" },
      { label: "Assignments", value: cohorts.reduce((n, c) => n + c.artifact_count, 0), icon: "mdi:cube-outline", tone: "var(--accent-indigo, #6366f1)" },
    ],
    [cohorts, counts],
  );

  const statusTabs: SegmentedTab<StatusTab>[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "active", label: "Active", icon: "mdi:play-circle-outline", count: counts.active },
    { value: "scheduled", label: "Scheduled", icon: "mdi:calendar-clock", count: counts.scheduled },
    { value: "draft", label: "Drafts", icon: "mdi:file-document-edit-outline", count: counts.draft },
    { value: "completed", label: "Completed", icon: "mdi:check-circle-outline", count: counts.completed },
    { value: "archived", label: "Archived", icon: "mdi:archive-outline", count: counts.archived },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cohorts.filter((c) => {
      if (statusTab !== "all" && c.status !== statusTab) return false;
      if (q && !(c.name.toLowerCase().includes(q) || (c.code ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [cohorts, statusTab, search]);

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
    <PageShell>
      <ModulePageHeader
        eyebrow="People"
        title="Cohorts"
        description="Group students into cohorts and manage their journey."
        accent="purple"
        icon="mdi:account-group"
        action={
          <HeaderActionButton icon="mdi:plus" onClick={() => setCreateOpen(true)}>
            New cohort
          </HeaderActionButton>
        }
      />

        {!loading && cohorts.length > 0 && (
          <Box data-tour-id="cohorts-stats" sx={{ mt: 3 }}>
            <StatStrip items={stats} />
          </Box>
        )}

        {!loading && cohorts.length > 0 && (
          <Box data-tour-id="cohorts-tabs" sx={{ mt: 3, mb: 2 }}>
            <SegmentedTabs<StatusTab> tabs={statusTabs} value={statusTab} onChange={setStatusTab} />
          </Box>
        )}

        {!loading && cohorts.length > 0 && (
          <AssessmentFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search cohorts by name or code…"
          />
        )}

        {loading && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 2,
              mt: 3,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} sx={{ height: 210, borderRadius: "16px", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", opacity: 0.6 }} />
            ))}
          </Box>
        )}

        {error && (
          <AssessmentEmptyState icon="mdi:alert-circle-outline" title="Couldn't load cohorts" description={error} />
        )}

        {!loading && !error && cohorts.length === 0 && (
          <AssessmentEmptyState
            icon="mdi:account-group-outline"
            title="No cohorts yet"
            description="Create a batch, then enroll students and map assessments, interviews, courses and live sessions to it."
            action={
              <Button
                onClick={() => setCreateOpen(true)}
                variant="contained"
                sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 700, background: "var(--gradient-ai)" }}
              >
                New cohort
              </Button>
            }
          />
        )}

        {!loading && filtered.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5, mb: 0.5 }}>
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </Box>
        )}

        {!loading && filtered.length > 0 && viewMode === "cards" && (
          <Box
            data-tour-id="cohorts-list"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 2,
              mt: 1,
            }}
          >
            {filtered.map((cohort) => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                onOpen={() => push(`/admin/cohorts/${cohort.id}`)}
                onArchive={() => setPendingDelete(cohort)}
              />
            ))}
          </Box>
        )}

        {!loading && filtered.length > 0 && viewMode === "list" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
            {filtered.map((cohort) => (
              <CohortRow
                key={cohort.id}
                cohort={cohort}
                onOpen={() => push(`/admin/cohorts/${cohort.id}`)}
              />
            ))}
          </Box>
        )}

        {!loading && cohorts.length > 0 && filtered.length === 0 && (
          <AssessmentEmptyState icon="mdi:filter-off-outline" title="No cohorts match" description="Try a different status filter or search." />
        )}

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
            ? `"${pendingDelete.name}" will be removed from the working set. Member and assignment history is kept.`
            : ""
        }
        confirmText={deleting ? "Archiving…" : "Archive"}
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </PageShell>
  );
}

function RowStat({ value, label }: { value: number | string; label: string }) {
  return (
    <Stack alignItems="center" spacing={0} sx={{ minWidth: 56 }}>
      <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--font-primary)", lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </Typography>
    </Stack>
  );
}

function CohortRow({ cohort, onOpen }: { cohort: CohortListItem; onOpen: () => void }) {
  const secondary = [
    cohort.code,
    STATUS_LABEL[cohort.status],
    cohort.start_date ? `Starts ${cohort.start_date}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Box
      onClick={onOpen}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "all .15s",
        "&:hover": {
          borderColor: COHORT_ACCENT,
          boxShadow: "0 6px 16px -8px rgba(124,58,237,0.35)",
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--gradient-ai)",
          color: "#fff",
        }}
      >
        <Icon icon="mdi:account-group" width={22} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 800, fontSize: "0.98rem", color: "var(--font-primary)" }}>
          {cohort.name}
        </Typography>
        <Typography noWrap sx={{ fontSize: "0.82rem", color: "var(--font-secondary)" }}>
          {secondary || "No details yet"}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2.5} sx={{ display: { xs: "none", md: "flex" } }}>
        <RowStat value={cohort.member_count} label="Members" />
        <RowStat value={cohort.artifact_count} label="Assignments" />
        <RowStat value={cohort.end_date ? cohort.end_date.slice(5) : "-"} label="Ends" />
      </Stack>

      <Icon icon="mdi:chevron-right" width={22} style={{ color: "var(--font-tertiary)", flexShrink: 0 }} />
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
      <DialogTitle sx={{ fontWeight: 800, fontFamily: "var(--font-jakarta)" }}>New cohort</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus fullWidth />
        <TextField
          label="Code (optional)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          helperText="A stable identifier, e.g. DS-2025-JAN"
          fullWidth
        />
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as CohortStatus)} fullWidth>
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
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
          sx={{ textTransform: "none", borderRadius: "999px", fontWeight: 700, background: "var(--gradient-ai)" }}
        >
          {saving ? "Creating…" : "Create cohort"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
