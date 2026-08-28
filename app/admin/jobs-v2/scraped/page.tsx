"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Pagination,
} from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import {
  adminScrapedJobsService,
  type ScrapedJob,
  type ScrapedJobsCounts,
  type ScrapedJobsTab,
} from "@/lib/services/admin/admin-scraped-jobs.service";
import { config } from "@/lib/config";
import { CheckSquare, X } from "lucide-react";

const SOURCE_KINDS: Array<{ value: string; label: string }> = [
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "smartrecruiters", label: "SmartRecruiters" },
  { value: "ashby", label: "Ashby" },
  { value: "workday", label: "Workday" },
  { value: "jsearch", label: "JSearch" },
  { value: "claude_page", label: "Claude Page" },
];

const SOURCE_KIND_LABELS: Record<string, string> = Object.fromEntries(
  SOURCE_KINDS.map((s) => [s.value, s.label])
);

/** Chip styles for the status/decision column - same color-mix map style as the jobs admin page. */
const STATE_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  new: { bg: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)", color: "var(--accent-indigo)" },
  ready: { bg: "color-mix(in srgb, var(--success-500) 16%, transparent)", color: "var(--success-500)" },
  irrelevant: { bg: "color-mix(in srgb, var(--warning-500) 16%, transparent)", color: "var(--warning-500)" },
  expired: { bg: "color-mix(in srgb, var(--font-secondary) 16%, transparent)", color: "var(--font-secondary)" },
  imported: { bg: "color-mix(in srgb, var(--success-500) 16%, transparent)", color: "var(--success-500)" },
  dismissed: { bg: "color-mix(in srgb, var(--font-secondary) 16%, transparent)", color: "var(--font-secondary)" },
};

const TAB_EMPTY_STATES: Record<ScrapedJobsTab, { title: string; body: string }> = {
  review: {
    title: "No scraped jobs to review",
    body: "New jobs land here as the scraper finds and enriches them. Check back soon.",
  },
  imported: {
    title: "Nothing imported yet",
    body: "Jobs you import become unpublished drafts and are listed here for reference.",
  },
  dismissed: {
    title: "No dismissed jobs",
    body: "Jobs you dismiss land here. You can restore any of them back into review.",
  },
  irrelevant: {
    title: "Nothing marked irrelevant",
    body: "Jobs the relevance filter rejects appear here so you can double-check its calls.",
  },
};

const headCellSx = {
  fontWeight: 700,
  backgroundColor: "var(--surface)",
  borderBottom: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
  color: "var(--font-secondary)",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
  py: 2,
} as const;

function relevanceColor(relevance: number): string {
  if (relevance >= 0.7) return "var(--success-500)";
  if (relevance >= 0.4) return "var(--warning-500)";
  return "var(--font-tertiary)";
}

/** "3h ago" / "2d ago" for fresh rows, plain date once it's old news. */
function formatSeen(d?: string): string {
  if (!d) return "-";
  try {
    const seen = new Date(d).getTime();
    if (Number.isNaN(seen)) return d;
    const diffMs = Date.now() - seen;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days}d ago`;
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function AdminScrapedJobsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<ScrapedJobsTab>("review");
  const [rows, setRows] = useState<ScrapedJob[]>([]);
  const [counts, setCounts] = useState<ScrapedJobsCounts | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sourceKind, setSourceKind] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; row: ScrapedJob } | null>(null);
  const [bulkDismissConfirm, setBulkDismissConfirm] = useState(false);
  const [acting, setActing] = useState(false);

  // Selection (and its bulk import/dismiss) only makes sense in the review queue.
  const selectable = tab === "review";

  // Debounce the search box into the server-side `search` param.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminScrapedJobsService.getScrapedJobs(config.clientId, {
        tab,
        search: search || undefined,
        source_kind: sourceKind || undefined,
        page,
        page_size: perPage,
      });
      setRows(data.results ?? []);
      setCounts(data.counts ?? null);
      setTotalCount(data.count ?? 0);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load scraped jobs", "error");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [tab, search, sourceKind, page, perPage, showToast]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleTabChange = (next: ScrapedJobsTab) => {
    setTab(next);
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const handleMenuOpen = (e: React.MouseEvent, row: ScrapedJob) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget as HTMLElement, row });
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleReviewAndImport = () => {
    if (menuAnchor) {
      router.push(`/admin/jobs-v2/new?scraped_job_id=${menuAnchor.row.id}`);
    }
    handleMenuClose();
  };

  const handleOpenOriginal = () => {
    if (menuAnchor?.row.apply_url) {
      window.open(menuAnchor.row.apply_url, "_blank", "noopener,noreferrer");
    }
    handleMenuClose();
  };

  const handleOpenJob = () => {
    if (menuAnchor?.row.decision?.job_id) {
      router.push(`/admin/jobs-v2/${menuAnchor.row.decision.job_id}`);
    }
    handleMenuClose();
  };

  const handleDismiss = async () => {
    const row = menuAnchor?.row;
    handleMenuClose();
    if (!row) return;
    try {
      setActing(true);
      await adminScrapedJobsService.dismissScrapedJob(row.id, config.clientId);
      showToast("Job dismissed", "success");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      loadRows();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to dismiss job", "error");
    } finally {
      setActing(false);
    }
  };

  const handleRestore = async () => {
    const row = menuAnchor?.row;
    handleMenuClose();
    if (!row) return;
    try {
      setActing(true);
      await adminScrapedJobsService.restoreScrapedJob(row.id, config.clientId);
      showToast("Job restored to review", "success");
      loadRows();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to restore job", "error");
    } finally {
      setActing(false);
    }
  };

  const handleBulkImport = async () => {
    if (selectedIds.size === 0) return;
    try {
      setActing(true);
      const result = await adminScrapedJobsService.bulkImportScrapedJobs(
        Array.from(selectedIds),
        config.clientId
      );
      const skippedNote =
        (result.skipped ?? []).length > 0 ? ` (${result.skipped.length} skipped)` : "";
      showToast(
        `Imported ${result.imported} as drafts — target and publish from the jobs list${skippedNote}`,
        "success"
      );
      setSelectedIds(new Set());
      loadRows();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to import jobs", "error");
    } finally {
      setActing(false);
    }
  };

  const handleBulkDismiss = async () => {
    if (selectedIds.size === 0) return;
    try {
      setActing(true);
      const result = await adminScrapedJobsService.bulkDismissScrapedJobs(
        Array.from(selectedIds),
        config.clientId
      );
      showToast(`Dismissed ${result.dismissed} job(s)`, "success");
      setSelectedIds(new Set());
      setBulkDismissConfirm(false);
      loadRows();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to dismiss jobs", "error");
    } finally {
      setActing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  const tabLabel = (label: string, count?: number) =>
    count == null ? label : `${label} (${count})`;

  const stateChip = (row: ScrapedJob) => {
    const key = row.decision?.decision ?? row.status;
    const style = STATE_CHIP_STYLES[key] ?? STATE_CHIP_STYLES.new;
    const label =
      row.decision?.decision === "imported"
        ? "Imported"
        : row.decision?.decision === "dismissed"
          ? "Dismissed"
          : row.status === "new"
            ? "New"
            : row.status === "ready"
              ? "Ready"
              : row.status === "irrelevant"
                ? "Irrelevant"
                : "Expired";
    return (
      <Chip
        label={label}
        size="small"
        sx={{
          height: 24,
          fontSize: "0.7rem",
          fontWeight: 600,
          backgroundColor: style.bg,
          color: style.color,
          border: "none",
        }}
      />
    );
  };

  const emptyState = useMemo(() => TAB_EMPTY_STATES[tab], [tab]);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Engagement"
        title="Scraped Jobs"
        description="Review jobs scraped from the web, dismiss the noise, and import the good ones as draft jobs."
        accent="cyan"
        icon="mdi:radar"
        action={
          <HeaderActionButton
            icon="mdi:arrow-left"
            variant="ghost"
            onClick={() => router.push("/admin/jobs-v2")}
          >
            Back to Jobs
          </HeaderActionButton>
        }
      />
      <Box>
        <Tabs
          value={tab}
          onChange={(_, v: ScrapedJobsTab) => handleTabChange(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            mb: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            "& .Mui-selected": { color: "var(--accent-indigo)" },
            "& .MuiTabs-indicator": { backgroundColor: "var(--accent-indigo)" },
          }}
        >
          <Tab label={tabLabel("Review", counts?.review)} value="review" />
          <Tab label={tabLabel("Imported", counts?.imported)} value="imported" />
          <Tab label={tabLabel("Dismissed", counts?.dismissed)} value="dismissed" />
          <Tab label={tabLabel("Irrelevant", counts?.irrelevant)} value="irrelevant" />
        </Tabs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <TextField
            size="small"
            placeholder="Search title, company, skills..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconWrapper icon="mdi:magnify" size={18} style={{ color: "var(--font-tertiary)" }} />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchInput("")} aria-label="Clear search">
                    <X size={14} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            sx={{
              minWidth: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--card-bg)",
                borderRadius: 2,
                fontSize: "0.875rem",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 55%, transparent)",
                },
              },
            }}
          />
          <FormControl
            size="small"
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--card-bg)",
                borderRadius: 2,
                fontSize: "0.875rem",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 55%, transparent)",
                },
              },
            }}
          >
            <InputLabel>Source</InputLabel>
            <Select
              value={sourceKind}
              label="Source"
              onChange={(e) => {
                setSourceKind(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {SOURCE_KINDS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectable && selectedIds.size > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              border: "2px solid",
              borderColor: "color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 8%, transparent) 0%, color-mix(in srgb, var(--accent-indigo) 4%, transparent) 100%)",
              borderRadius: 2,
              boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckSquare size={20} style={{ color: "var(--accent-indigo)" }} />
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                  {selectedIds.size} job{selectedIds.size !== 1 ? "s" : ""} selected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Import as unpublished drafts, or dismiss
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setSelectedIds(new Set())}
                startIcon={<X size={16} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)",
                    color: "text.primary",
                  },
                }}
              >
                Clear
              </Button>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={() => setBulkDismissConfirm(true)}
                disabled={acting}
                startIcon={<IconWrapper icon="mdi:close-circle-outline" size={18} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: "color-mix(in srgb, var(--font-secondary) 45%, transparent)",
                  color: "var(--font-secondary)",
                  "&:hover": {
                    borderColor: "var(--font-secondary)",
                    backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)",
                  },
                }}
              >
                Dismiss
              </Button>
              <Button
                variant="contained"
                onClick={handleBulkImport}
                disabled={acting}
                startIcon={
                  acting ? (
                    <CircularProgress size={16} sx={{ color: "var(--font-light)" }} />
                  ) : (
                    <IconWrapper icon="mdi:briefcase-plus-outline" size={18} />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "var(--accent-indigo)",
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                  "&:hover": {
                    backgroundColor: "var(--accent-indigo-dark)",
                    boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
                  },
                  "&:disabled": {
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 55%, transparent)",
                  },
                }}
              >
                Import as drafts
              </Button>
            </Box>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "var(--card-bg)",
            boxShadow: "0 1px 3px color-mix(in srgb, var(--font-primary) 7%, transparent)",
          }}
        >
          {loading ? (
            <Box
              sx={{
                p: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                backgroundColor: "var(--card-bg)",
              }}
            >
              <CircularProgress sx={{ color: "var(--accent-indigo)" }} size={44} thickness={3} />
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
                Loading scraped jobs...
              </Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Box
              sx={{
                p: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                  display: "inline-flex",
                }}
              >
                <EmptyJobsIllustration width={120} height={100} />
              </Box>
              <Typography variant="h6" sx={{ mt: 3, fontWeight: 700, color: "var(--font-primary)" }}>
                {emptyState.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "var(--font-secondary)", maxWidth: 360 }}>
                {emptyState.body}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 880 }}>
              <Table
                stickyHeader
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    py: 1.75,
                    px: 2,
                    borderBottom: "1px solid color-mix(in srgb, var(--font-primary) 7%, transparent)",
                  },
                  "& .MuiTableRow-root:last-child td": { borderBottom: 0 },
                }}
              >
                <TableHead>
                  <TableRow>
                    {selectable && (
                      <TableCell padding="checkbox" sx={{ ...headCellSx, width: 48 }}>
                        <Checkbox
                          checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
                          indeterminate={selectedIds.size > 0 && selectedIds.size < rows.length}
                          onChange={toggleSelectAll}
                          sx={{ color: "var(--font-secondary)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                        />
                      </TableCell>
                    )}
                    <TableCell sx={{ ...headCellSx, minWidth: 240 }}>Job</TableCell>
                    <TableCell sx={{ ...headCellSx, minWidth: 110 }}>Source</TableCell>
                    <TableCell sx={{ ...headCellSx, minWidth: 110 }}>Relevance</TableCell>
                    <TableCell sx={{ ...headCellSx, minWidth: 180 }}>Skills</TableCell>
                    <TableCell sx={{ ...headCellSx, minWidth: 90 }}>Seen</TableCell>
                    <TableCell sx={{ ...headCellSx, minWidth: 110 }} align="center">
                      Status
                    </TableCell>
                    <TableCell sx={{ ...headCellSx, width: 80, minWidth: 80 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                        },
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            sx={{ color: "var(--font-secondary)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            src={row.company_logo ?? undefined}
                            alt={row.company_name}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1.5,
                              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface))",
                              color: "var(--accent-indigo)",
                              fontSize: "0.9375rem",
                              fontWeight: 600,
                              border: "1px solid color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                            }}
                          >
                            {row.company_name?.[0]?.toUpperCase() || "C"}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "var(--font-primary)", lineHeight: 1.3 }}
                            >
                              {row.job_title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
                              {row.company_name}
                              {row.location && ` • ${row.location}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={row.source_name || row.source_kind} arrow>
                          <Chip
                            label={SOURCE_KIND_LABELS[row.source_kind] ?? row.source_kind}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 24,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                              color: "var(--accent-indigo)",
                              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {row.relevance == null ? (
                          <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                            —
                          </Typography>
                        ) : (
                          <Tooltip title={row.relevance_reason ?? ""} arrow>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 72 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.8125rem",
                                  color: relevanceColor(row.relevance),
                                }}
                              >
                                {Math.round(row.relevance * 100)}%
                              </Typography>
                              <Box
                                sx={{
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)",
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    height: "100%",
                                    width: `${Math.round(Math.min(1, Math.max(0, row.relevance)) * 100)}%`,
                                    borderRadius: 2,
                                    backgroundColor: relevanceColor(row.relevance),
                                  }}
                                />
                              </Box>
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {(row.key_skills ?? []).length === 0 ? (
                          <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
                            -
                          </Typography>
                        ) : (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                            {row.key_skills.slice(0, 3).map((skill) => (
                              <Chip
                                key={skill}
                                label={skill}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.7rem",
                                  fontWeight: 500,
                                  backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)",
                                  color: "var(--font-secondary)",
                                }}
                              />
                            ))}
                            {row.key_skills.length > 3 && (
                              <Tooltip title={row.key_skills.slice(3).join(", ")} arrow>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "var(--font-tertiary)", fontWeight: 600 }}
                                >
                                  +{row.key_skills.length - 3}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={row.last_seen_at ?? ""} arrow>
                          <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem" }}>
                            {formatSeen(row.last_seen_at)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {stateChip(row)}
                          {row.decision?.decision === "imported" && row.decision.source_expired && (
                            <Tooltip title="The original posting has closed at the source" arrow>
                              <Chip
                                label="Closed at source"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  backgroundColor: "color-mix(in srgb, var(--warning-500) 16%, transparent)",
                                  color: "var(--warning-500)",
                                  border: "none",
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Actions" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, row)}
                            sx={{ color: "text.secondary" }}
                            aria-label="Actions"
                          >
                            <IconWrapper icon="mdi:dots-vertical" size={20} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {!loading && totalCount > 0 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}
              </Typography>
              <PerPageSelect
                value={perPage}
                onChange={(v) => {
                  setPerPage(v);
                  setPage(1);
                }}
              />
            </Box>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              size="small"
              sx={{ "& .MuiPaginationItem-root": { borderRadius: 1 } }}
            />
          </Box>
        )}

        <Menu
          anchorEl={menuAnchor?.el ?? null}
          open={!!menuAnchor}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 200,
                borderRadius: 2,
                boxShadow: "0 4px 20px color-mix(in srgb, var(--font-primary) 15%, transparent)",
                mt: 1.5,
              },
            },
          }}
        >
          {tab === "review" && (
            <MenuItem onClick={handleReviewAndImport}>
              <ListItemIcon>
                <IconWrapper icon="mdi:briefcase-plus-outline" size={18} />
              </ListItemIcon>
              <ListItemText>Review &amp; import</ListItemText>
            </MenuItem>
          )}
          {tab === "review" && (
            <MenuItem onClick={handleDismiss} disabled={acting}>
              <ListItemIcon>
                <IconWrapper icon="mdi:close-circle-outline" size={18} />
              </ListItemIcon>
              <ListItemText>Dismiss</ListItemText>
            </MenuItem>
          )}
          {tab === "dismissed" && (
            <MenuItem onClick={handleRestore} disabled={acting}>
              <ListItemIcon>
                <IconWrapper icon="mdi:restore" size={18} />
              </ListItemIcon>
              <ListItemText>Restore</ListItemText>
            </MenuItem>
          )}
          {tab === "imported" && (
            <MenuItem onClick={handleOpenJob} disabled={!menuAnchor?.row.decision?.job_id}>
              <ListItemIcon>
                <IconWrapper icon="mdi:briefcase-outline" size={18} />
              </ListItemIcon>
              <ListItemText>Open job</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleOpenOriginal} disabled={!menuAnchor?.row.apply_url}>
            <ListItemIcon>
              <IconWrapper icon="mdi:open-in-new" size={18} />
            </ListItemIcon>
            <ListItemText>Open original</ListItemText>
          </MenuItem>
        </Menu>

        <ConfirmDialog
          open={bulkDismissConfirm}
          title="Dismiss Scraped Jobs"
          message={`Dismiss ${selectedIds.size} scraped job(s)? They move to the Dismissed tab and can be restored later.`}
          confirmText="Dismiss"
          cancelText="Cancel"
          confirmColor="error"
          onConfirm={handleBulkDismiss}
          onCancel={() => setBulkDismissConfirm(false)}
        />
      </Box>
    </PageShell>
  );
}
