"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import {
  instructorService,
  type InstructorStudentRow,
  type InstructorStudentStatus,
  type InstructorStudentsSummary,
  type InstructorStudentDetail,
  type InstructorCohortDetail,
} from "@/lib/services/instructor.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

/* --------------------------------- status --------------------------------- */

const STATUS_META: Record<InstructorStudentStatus, { label: string; color: string; bg: string; dot: string }> = {
  on_track: { label: "On track", color: "#047857", bg: "color-mix(in srgb,#10b981 14%,transparent)", dot: "#10b981" },
  watch: { label: "Watch", color: "#b45309", bg: "color-mix(in srgb,#f59e0b 16%,transparent)", dot: "#f59e0b" },
  at_risk: { label: "At risk", color: "#b91c1c", bg: "color-mix(in srgb,#ef4444 14%,transparent)", dot: "#ef4444" },
};

const STATUS_TABS: { key: InstructorStudentStatus | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "on_track", label: "On track" },
  { key: "watch", label: "Watch" },
  { key: "at_risk", label: "At risk" },
];

function StatusChip({ status }: { status: InstructorStudentStatus }) {
  const m = STATUS_META[status];
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1,
        py: 0.35,
        borderRadius: 999,
        bgcolor: m.bg,
        color: m.color,
        fontSize: "0.72rem",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: m.dot }} />
      {m.label}
    </Box>
  );
}

function relTime(iso: string | null): string {
  if (!iso) return "No activity yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "-";
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 90) return "Active now";
  const m = s / 60;
  if (m < 60) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.round(d)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/* -------------------------------- expand row ------------------------------- */

function ExpandedDetail({
  studentId,
  onNudge,
  nudging,
}: {
  studentId: number;
  onNudge: (id: number) => void;
  nudging: boolean;
}) {
  const [detail, setDetail] = useState<InstructorStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    instructorService
      .getStudent(studentId)
      .then((d) => !cancelled && setDetail(d))
      .catch(() => !cancelled && setDetail(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return (
    <Box
      sx={{
        p: 2.5,
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
        bgcolor: "color-mix(in srgb,#6366f1 4%,transparent)",
        borderTop: "1px solid var(--border-default)",
      }}
    >
      {/* Enrolled courses */}
      <Box>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "text.secondary", mb: 1 }}>
          Enrolled courses
        </Typography>
        {loading ? (
          <CircularProgress size={16} />
        ) : detail && detail.courses.length ? (
          <Stack spacing={0.75}>
            {detail.courses.map((c) => (
              <Stack key={c.id} direction="row" spacing={0.75} alignItems="center">
                <Icon icon="mdi:book-open-variant" width={15} style={{ color: "#7c3aed" }} />
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{c.title}</Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>No shared courses.</Typography>
        )}
      </Box>

      {/* Cohorts */}
      <Box>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "text.secondary", mb: 1 }}>
          Cohorts
        </Typography>
        {loading ? (
          <CircularProgress size={16} />
        ) : detail && detail.cohorts.length ? (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {detail.cohorts.map((c) => (
              <Chip key={c.id} size="small" label={c.name} icon={<Icon icon="mdi:account-group" width={13} />} sx={{ fontWeight: 700 }} />
            ))}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>No shared cohorts.</Typography>
        )}
      </Box>

      {/* Actions */}
      <Box>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "text.secondary", mb: 1 }}>
          Instructor actions
        </Typography>
        <Stack spacing={1}>
          <Button
            onClick={() => onNudge(studentId)}
            disabled={nudging}
            startIcon={nudging ? <CircularProgress size={15} color="inherit" /> : <Icon icon="mdi:bell-ring-outline" width={16} />}
            sx={{ justifyContent: "flex-start", textTransform: "none", fontWeight: 700, color: "#fff", px: 1.75, py: 0.9, borderRadius: 2, background: "linear-gradient(135deg,#7c3aed,#ec4899)", "&:hover": { filter: "brightness(1.06)" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.85)", opacity: 0.7 } }}
          >
            {nudging ? "Sending…" : "Send a nudge"}
          </Button>
          <Button
            href={detail ? `mailto:${detail.email}` : undefined}
            startIcon={<Icon icon="mdi:calendar-account" width={16} />}
            sx={{ justifyContent: "flex-start", textTransform: "none", fontWeight: 700, color: "#6366f1", px: 1.75, py: 0.9, borderRadius: 2, border: "1px solid var(--border-default)" }}
          >
            Book 1:1
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

/* ---------------------------------- cell ---------------------------------- */

const COLS = "minmax(180px,2.2fr) minmax(90px,1fr) minmax(120px,1.3fr) 88px 78px 108px 36px";

function ReportRow({
  s,
  expanded,
  onToggle,
  onNudge,
  nudging,
}: {
  s: InstructorStudentRow;
  expanded: boolean;
  onToggle: () => void;
  onNudge: (id: number) => void;
  nudging: boolean;
}) {
  const pct = Math.max(0, Math.min(100, s.progress));
  return (
    <Box sx={{ borderBottom: "1px solid var(--border-default)", "&:last-of-type": { borderBottom: "none" } }}>
      <Box
        onClick={onToggle}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr auto", md: COLS },
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          transition: "background .12s",
          "&:hover": { bgcolor: "color-mix(in srgb,#6366f1 5%,transparent)" },
        }}
      >
        {/* Student */}
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: "0.82rem", background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
            {initials(s.name)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{s.name}</Typography>
            <Typography noWrap sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{relTime(s.last_active)}</Typography>
          </Box>
        </Stack>

        {/* Cohort */}
        <Typography noWrap sx={{ fontSize: "0.82rem", color: "text.secondary", display: { xs: "none", md: "block" } }}>
          {s.cohort || "-"}
        </Typography>

        {/* Progress */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800 }}>{Math.round(pct)}%</Typography>
          </Stack>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: "color-mix(in srgb,var(--border-default) 55%,transparent)", overflow: "hidden" }}>
            <Box sx={{ width: `${pct}%`, height: "100%", background: pct >= 60 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444" }} />
          </Box>
        </Box>

        {/* Avg score — null means no scored submission; a real 0 shows "0%". */}
        <Typography sx={{ fontSize: "0.86rem", fontWeight: 800, display: { xs: "none", md: "block" }, color: s.avg_score == null ? "text.disabled" : undefined }}>
          {s.avg_score == null ? "-" : `${Math.round(s.avg_score)}%`}
        </Typography>

        {/* Points */}
        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
          <Icon icon="mdi:lightning-bolt" width={14} style={{ color: "#f59e0b" }} />
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800 }}>{s.points}</Typography>
        </Stack>

        {/* Status */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <StatusChip status={s.status} />
        </Box>

        {/* Chevron */}
        <Box sx={{ display: "grid", placeItems: "center", color: "text.secondary" }}>
          <Icon icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} width={20} />
        </Box>
      </Box>
      <Collapse in={expanded} unmountOnExit>
        <ExpandedDetail studentId={s.student_id} onNudge={onNudge} nudging={nudging} />
      </Collapse>
    </Box>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function InstructorStudentsPage() {
  const [rows, setRows] = useState<InstructorStudentRow[]>([]);
  const [summary, setSummary] = useState<InstructorStudentsSummary>({ count: 0, avg_progress: 0, avg_score: 0, at_risk: 0 });
  const [cohorts, setCohorts] = useState<InstructorCohortDetail[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Honor a ?status= deep-link (e.g. the dashboard "Review at-risk students" CTA).
  const [status, setStatus] = useState<InstructorStudentStatus | "">(() => {
    if (typeof window === "undefined") return "";
    const s = new URLSearchParams(window.location.search).get("status");
    return s === "on_track" || s === "watch" || s === "at_risk" ? s : "";
  });
  const [cohortId, setCohortId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [nudgingId, setNudgingId] = useState<number | null>(null);

  const [msgOpen, setMsgOpen] = useState(false);
  const [msgCohort, setMsgCohort] = useState<number | "">("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [toast, setToast] = useState<{ text: string; sev: "success" | "error" } | null>(null);

  const pageSize = 25;

  const load = useCallback(
    async (p: number, opts?: { search?: string; status?: InstructorStudentStatus | ""; cohortId?: number | null }) => {
      setLoading(true);
      try {
        const data = await instructorService.getStudents({
          page: p,
          pageSize,
          search: opts?.search ?? undefined,
          status: opts?.status,
          cohortId: opts?.cohortId ?? null,
        });
        setRows(data.results);
        setSummary(data.summary);
        setCount(data.count);
        setPage(data.page);
        setError(null);
      } catch (e) {
        setError(getAxiosErrorDetail(e, "Couldn't load your students."));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Cohort list (for filter tabs + message dialog).
  useEffect(() => {
    instructorService
      .getDashboard()
      .then((d) => setCohorts(d.cohorts_detailed))
      .catch(() => undefined);
  }, []);

  // Refetch (page 1) whenever any filter changes; search is debounced.
  useEffect(() => {
    const h = setTimeout(() => void load(1, { search: query, status, cohortId }), 300);
    return () => clearTimeout(h);
  }, [query, status, cohortId, load]);

  const pages = Math.max(1, Math.ceil(count / pageSize));

  const doNudge = useCallback(async (id: number) => {
    setNudgingId(id);
    try {
      await instructorService.nudgeStudent(id);
      setToast({ text: "Nudge sent. The student will see it in their notifications.", sev: "success" });
    } catch {
      setToast({ text: "Couldn't send the nudge right now.", sev: "error" });
    } finally {
      setNudgingId(null);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (msgCohort === "" || !msgBody.trim()) return;
    setMsgSending(true);
    try {
      const r = await instructorService.messageCohort(msgCohort, msgBody.trim());
      setToast({ text: `Message delivered to ${r.sent} student${r.sent === 1 ? "" : "s"}.`, sev: "success" });
      setMsgOpen(false);
      setMsgBody("");
      setMsgCohort("");
    } catch {
      setToast({ text: "Couldn't message this cohort.", sev: "error" });
    } finally {
      setMsgSending(false);
    }
  }, [msgCohort, msgBody]);

  // Export the FULL filtered roster (all pages), not just the current page. Neutralizes CSV
  // formula-injection: any field starting with = + - @ (or a control char) is prefixed with '.
  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const first = await instructorService.getStudents({ page: 1, pageSize: 100, search: query || undefined, status, cohortId });
      const all = [...first.results];
      const totalPages = Math.max(1, Math.ceil(first.count / 100));
      for (let p = 2; p <= totalPages; p++) {
        const next = await instructorService.getStudents({ page: p, pageSize: 100, search: query || undefined, status, cohortId });
        all.push(...next.results);
      }
      const esc = (v: string) => {
        const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
        return `"${safe.replace(/"/g, '""')}"`;
      };
      const header = ["Name", "Email", "Cohort", "Progress %", "Avg score %", "Points", "Status", "Last active"];
      const lines = all.map((r) =>
        [
          r.name,
          r.email,
          r.cohort || "",
          String(Math.round(r.progress)),
          r.avg_score == null ? "" : String(Math.round(r.avg_score)),
          String(r.points),
          STATUS_META[r.status].label,
          r.last_active || "",
        ]
          .map(esc)
          .join(","),
      );
      const csv = [header.map(esc).join(","), ...lines].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "student-report.csv";
      a.click();
      URL.revokeObjectURL(url);
      setToast({ text: `Exported ${all.length} student${all.length === 1 ? "" : "s"}.`, sev: "success" });
    } catch {
      setToast({ text: "Couldn't export the report right now.", sev: "error" });
    } finally {
      setExporting(false);
    }
  }, [query, status, cohortId]);

  const kpis = [
    { label: "Students", value: summary.count, icon: "mdi:account-multiple", color: "#6366f1" },
    { label: "Avg progress", value: `${Math.round(summary.avg_progress)}%`, icon: "mdi:chart-line", color: "#0ea5e9" },
    { label: "Avg score", value: summary.avg_score ? `${Math.round(summary.avg_score)}%` : "-", icon: "mdi:star-outline", color: "#10b981" },
    { label: "At risk", value: summary.at_risk, icon: "mdi:alert-outline", color: "#ef4444" },
  ];

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Student Reports"
        description="Progress, scores and engagement across the courses and cohorts you're assigned to."
        accent="purple"
        icon="mdi:chart-box-outline"
        action={
          <Stack direction="row" spacing={1}>
            <HeaderActionButton icon="mdi:message-text-outline" variant="ghost" onClick={() => setMsgOpen(true)}>
              Message cohort
            </HeaderActionButton>
            <HeaderActionButton icon="mdi:download-outline" variant="ghost" onClick={exportCsv} disabled={exporting}>
              {exporting ? "Exporting…" : "Export CSV"}
            </HeaderActionButton>
          </Stack>
        }
      />

      {/* KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
        {kpis.map((k) => (
          <Box key={k.label} sx={{ p: 2, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary", mb: 0.75 }}>
              <Icon icon={k.icon} width={16} style={{ color: k.color }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{k.label}</Typography>
            </Stack>
            <Typography sx={{ fontWeight: 900, fontSize: "1.7rem", lineHeight: 1 }}>{k.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
          {STATUS_TABS.map((t) => {
            const active = status === t.key;
            return (
              <Box
                key={t.label}
                onClick={() => setStatus(t.key)}
                sx={{
                  px: 1.75,
                  py: 0.7,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: active ? "#fff" : "text.secondary",
                  background: active ? "linear-gradient(135deg,#7c3aed,#ec4899)" : "var(--card-bg)",
                  border: active ? "none" : "1px solid var(--border-default)",
                }}
              >
                {t.label}
              </Box>
            );
          })}
        </Stack>
        <TextField
          size="small"
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: { xs: "100%", md: 280 }, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "var(--card-bg)" } }}
          InputProps={{ startAdornment: <Icon icon="mdi:magnify" width={18} style={{ marginRight: 6, opacity: 0.6 }} /> }}
        />
      </Stack>

      {/* Cohort tabs (server-side, membership-based) */}
      {cohorts.length > 0 && (
        <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: "wrap", gap: 0.75 }}>
          <Chip
            label="All cohorts"
            onClick={() => setCohortId(null)}
            variant={cohortId === null ? "filled" : "outlined"}
            sx={{ fontWeight: 700, ...(cohortId === null ? { bgcolor: "color-mix(in srgb,#6366f1 15%,transparent)", color: "#4f46e5" } : {}) }}
          />
          {cohorts.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              onClick={() => setCohortId(c.id)}
              variant={cohortId === c.id ? "filled" : "outlined"}
              sx={{ fontWeight: 700, ...(cohortId === c.id ? { bgcolor: "color-mix(in srgb,#6366f1 15%,transparent)", color: "#4f46e5" } : {}) }}
            />
          ))}
        </Stack>
      )}

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}

      {/* Table */}
      <Box sx={{ borderRadius: 3, overflow: "hidden", bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)" }}>
        {/* Header row */}
        <Box
          sx={{
            display: { xs: "none", md: "grid" },
            gridTemplateColumns: COLS,
            gap: 1.5,
            px: 2,
            py: 1.25,
            bgcolor: "color-mix(in srgb,#6366f1 6%,transparent)",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          {["Student", "Cohort", "Progress", "Avg score", "Points", "Status", ""].map((h, i) => (
            <Typography key={i} sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "text.secondary" }}>
              {h}
            </Typography>
          ))}
        </Box>

        {loading && rows.length === 0 ? (
          <Box sx={{ p: 5, display: "grid", placeItems: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary" }}>
              {count === 0 && !status && cohortId == null && !query
                ? "No students in your courses or cohorts yet."
                : "No students match these filters."}
            </Typography>
          </Box>
        ) : (
          rows.map((s) => (
            <ReportRow
              key={s.student_id}
              s={s}
              expanded={expanded === s.student_id}
              onToggle={() => setExpanded((cur) => (cur === s.student_id ? null : s.student_id))}
              onNudge={doNudge}
              nudging={nudgingId === s.student_id}
            />
          ))
        )}
      </Box>

      {pages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
          <Button disabled={page <= 1 || loading} onClick={() => void load(page - 1, { search: query, status, cohortId })} startIcon={<Icon icon="mdi:chevron-left" />}>
            Prev
          </Button>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
            Page {page} of {pages} · {count} student{count === 1 ? "" : "s"}
          </Typography>
          <Button disabled={page >= pages || loading} onClick={() => void load(page + 1, { search: query, status, cohortId })} endIcon={<Icon icon="mdi:chevron-right" />}>
            Next
          </Button>
        </Stack>
      )}

      {/* Message cohort dialog */}
      <Dialog open={msgOpen} onClose={() => setMsgOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Message a cohort</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              select
              label="Cohort"
              value={msgCohort}
              onChange={(e) => setMsgCohort(Number(e.target.value))}
              fullWidth
              size="small"
            >
              {cohorts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} · {c.student_count} student{c.student_count === 1 ? "" : "s"}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Message"
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              fullWidth
              multiline
              minRows={4}
              placeholder="Share an announcement, reminder or encouragement with the whole cohort…"
            />
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              Delivered as an in-app notification to every student in the cohort.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMsgOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={sendMessage}
            disabled={msgCohort === "" || !msgBody.trim() || msgSending}
            startIcon={msgSending ? <CircularProgress size={15} color="inherit" /> : <Icon icon="mdi:send" width={16} />}
            sx={{ textTransform: "none", fontWeight: 800, color: "#fff", px: 2.5, borderRadius: 2, background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
          >
            Send message
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert severity={toast.sev} variant="filled" onClose={() => setToast(null)} sx={{ fontWeight: 600 }}>
            {toast.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </PageShell>
  );
}
