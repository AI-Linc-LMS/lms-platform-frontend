"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Button,
  TextField,
  Stack,
  Divider,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import {
  ResponsiveContainer,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  LabelList,
} from "recharts";
import type { AssessmentAnalyticsResponse } from "@/lib/services/admin/admin-assessment.service";
import {
  maxSectionAvgPct,
  sectionPerformanceStatus,
  sectionPerformanceStatusLabel,
  sectionRowAccent,
  SECTION_STATUS_MUI,
} from "@/lib/utils/assessment-section-performance.utils";

const C = {
  sky: "var(--accent-indigo)",
  skyLight: "var(--accent-indigo-dark)",
  indigo: "var(--accent-indigo)",
  slate: "var(--font-secondary)",
  grid: "var(--border-default)",
  pass: "var(--success-500)",
  warn: "var(--warning-500)",
  muted: "var(--font-tertiary)",
};

/** Score bands low → high (matches common “traffic light” histograms). */
const SCORE_BUCKET_COLORS = [
  "var(--error-500)",
  "var(--warning-500)",
  "var(--warning-500)",
  "var(--accent-indigo)",
  "var(--success-500)",
];

const TIME_BUCKET_COLOR = "var(--accent-purple)";

const STATUS_PIE_COLORS = [
  "var(--warning-500)",
  "var(--accent-indigo)",
  "var(--success-500)",
];

const REPORT = {
  radius: 3,
  shadow:
    "0 1px 2px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 6px 16px color-mix(in srgb, var(--font-primary) 12%, transparent)",
  chartWell: "color-mix(in srgb, var(--surface) 75%, transparent)",
} as const;

const tooltipSx = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--border-default)",
  borderRadius: 10,
  fontSize: 12,
  boxShadow:
    "0 4px 14px color-mix(in srgb, var(--font-primary) 16%, transparent)",
};

const barCountLabelStyle = {
  fill: "var(--font-secondary)",
  fontSize: 12,
  fontWeight: 700,
} as const;

const axisLabelStyle = {
  fill: C.slate,
  fontSize: 12,
  fontWeight: 600,
} as const;

const yAxisStudentsLabel = {
  value: "Number of students",
  angle: -90,
  position: "insideLeft",
  style: { ...axisLabelStyle, textAnchor: "middle" },
} as const;

function studentCountTooltip(value: number | string | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n)) return ["—", ""];
  const label = n === 1 ? "1 student" : `${n} students`;
  return [label, "In this group"];
}

const tableHeadCellSx = {
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase" as const,
  color: "text.secondary",
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.06),
  borderBottom: "2px solid",
  borderColor: "divider",
  py: 1.35,
  whiteSpace: "nowrap" as const,
};

/** Section-wise performance table header (matches reference card). */
const sectionWiseHeadCellSx = {
  ...tableHeadCellSx,
  bgcolor: "transparent",
  color: "var(--font-secondary)",
  borderBottom: "1px solid",
  borderColor: "divider",
  letterSpacing: "0.04em",
};

const tablePaperSx = {
  p: 0,
  borderRadius: REPORT.radius,
  overflow: "hidden",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: REPORT.shadow,
  bgcolor: "background.paper",
};

const tableSectionHeaderSx = {
  px: { xs: 2, sm: 2.75 },
  pt: 2.25,
  pb: 1.75,
  borderBottom: "1px solid",
  borderColor: "divider",
  background: (theme: Theme) =>
    `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
};

const tableBodyRowSx = {
  transition: "background-color 0.15s ease",
  "&:hover": {
    bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.04),
  },
  "&:last-of-type td": { borderBottom: 0 },
};

function SectionTableTitle({
  title,
  count,
  countChipMode = "rows",
  subtitle,
}: {
  title: string;
  count?: number;
  /** `number` = count only (learners). `rows` = "N rows" (tabular data). */
  countChipMode?: "rows" | "number";
  subtitle?: string;
}) {
  const countLabel =
    count == null
      ? null
      : countChipMode === "number"
        ? String(count)
        : `${count} ${count === 1 ? "row" : "rows"}`;
  return (
    <Box sx={tableSectionHeaderSx}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, rowGap: 0.75 }}>
        <Typography variant="subtitle1" component="h3" fontWeight={800} sx={{ letterSpacing: "-0.02em", lineHeight: 1.25 }}>
          {title}
        </Typography>
        {countLabel != null ? (
          <Chip
            size="small"
            label={countLabel}
            sx={{
              height: 24,
              fontWeight: 700,
              fontSize: "0.7rem",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "& .MuiChip-label": { px: 1.25 },
            }}
          />
        ) : null}
      </Box>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ display: "block", mt: 1, maxWidth: 720, lineHeight: 1.55 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

function ChartReportCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: REPORT.radius,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: REPORT.shadow,
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.25, pb: description ? 1.25 : 0 }}>
        <Typography variant="subtitle1" component="h3" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 720, lineHeight: 1.55 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          px: { xs: 1, sm: 1.5 },
          pb: 2,
          pt: description ? 0.5 : 2,
          bgcolor: REPORT.chartWell,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

export type AssessmentAnalyticsToolbarProps = {
  topNDraft: string;
  onTopNDraftChange: (value: string) => void;
  appliedTopN: number;
  onApply: () => void;
  onReload: () => void;
  onDownloadPdf: () => void | Promise<void>;
  loading: boolean;
  canDownloadPdf: boolean;
};

type Props = {
  data: AssessmentAnalyticsResponse | null;
  toolbar?: AssessmentAnalyticsToolbarProps;
};

function AnalyticsToolbarPaper(toolbar: AssessmentAnalyticsToolbarProps) {
  const {
    topNDraft,
    onTopNDraftChange,
    appliedTopN,
    onApply,
    onReload,
    onDownloadPdf,
    loading,
    canDownloadPdf,
  } = toolbar;
  return (
    <Paper
      className="exclude-from-pdf"
      elevation={0}
      variant="outlined"
      sx={(theme) => ({
        p: { xs: 2, sm: 2.25 },
        borderRadius: REPORT.radius,
        borderColor: "divider",
        boxShadow: REPORT.shadow,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
      })}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="primary" fontWeight={800} sx={{ letterSpacing: "0.1em", lineHeight: 1.2 }}>
            Report controls
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560, lineHeight: 1.55 }}>
            Refresh data, set how many top learners are listed, then export a PDF if you need a file copy.
          </Typography>
        </Box>
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <CircularProgress size={22} thickness={4} />
            <Typography variant="caption" color="text.secondary">
              Updating…
            </Typography>
          </Stack>
        ) : null}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", lg: "flex-end" }}
        flexWrap="wrap"
      >
        <TextField
          size="small"
          label="Top performers to show"
          type="number"
          inputProps={{ min: 1, max: 100 }}
          value={topNDraft}
          onChange={(e) => onTopNDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApply();
            }
          }}
          sx={{ width: { xs: "100%", sm: 220 } }}
          helperText={`Allowed 1–100. Applied in report: ${appliedTopN}. Press Enter or Apply.`}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: { xs: 0, lg: 0.25 } }}>
          <Button variant="contained" onClick={onApply} disabled={loading} sx={{ textTransform: "none", minWidth: 96, fontWeight: 600 }}>
            Apply
          </Button>
          <Button variant="outlined" onClick={onReload} disabled={loading} sx={{ textTransform: "none", minWidth: 96, fontWeight: 600 }}>
            Reload
          </Button>
        </Stack>

        <Box sx={{ flex: 1, minWidth: { xs: 0, lg: 16 } }} />

        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:file-pdf-box" size={18} />}
          onClick={() => void onDownloadPdf()}
          disabled={!canDownloadPdf}
          sx={{
            alignSelf: { xs: "stretch", lg: "center" },
            textTransform: "none",
            fontWeight: 700,
            px: 2,
            bgcolor: "var(--error-500)",
            "&:hover": {
              bgcolor:
                "color-mix(in srgb, var(--error-500) 86%, var(--accent-indigo-dark))",
            },
            boxShadow: "none",
            "&:disabled": { bgcolor: "action.disabledBackground" },
          }}
        >
          Download PDF
        </Button>
      </Stack>
    </Paper>
  );
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

type CodingDifficultyChipSpec = {
  label: string;
  color: "default" | "success" | "warning" | "error";
  variant: "filled" | "outlined";
};

function codingDifficultyChipSpec(raw: string | null | undefined): CodingDifficultyChipSpec {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (s === "easy") {
    return { label: "Easy", color: "success", variant: "filled" };
  }
  if (s === "medium") {
    return { label: "Medium", color: "warning", variant: "filled" };
  }
  if (s === "hard") {
    return { label: "Hard", color: "error", variant: "filled" };
  }
  const t = raw?.trim();
  return {
    label: t && t.length > 0 ? t : "—",
    color: "default",
    variant: "outlined",
  };
}

type SubmissionStatusChipSpec = {
  label: string;
  color: "success" | "warning" | "error" | "default";
  variant: "filled" | "outlined";
};

function humanizeSubmissionStatus(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return "—";
  return String(raw)
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Green for finished / submitted; amber for in progress and other non-final; red for failed-like. */
function submissionStatusChipSpec(raw: string | null | undefined): SubmissionStatusChipSpec {
  const label = humanizeSubmissionStatus(raw);
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");

  if (!s) {
    return { label: "—", color: "default", variant: "outlined" };
  }

  const done = new Set([
    "submitted",
    "completed",
    "graded",
    "finalized",
    "passed",
    "turned_in",
    "handed_in",
  ]);
  if (done.has(s)) {
    return { label, color: "success", variant: "filled" };
  }

  const failed = new Set(["failed", "expired", "abandoned", "cancelled", "rejected", "disqualified"]);
  if (failed.has(s)) {
    return { label, color: "error", variant: "filled" };
  }

  return { label, color: "warning", variant: "filled" };
}

const TABLE_PAGE_SIZE_OPTIONS = [10, 12, 20, 25, 50, 100] as const;

function usePagedSlice<T>(items: readonly T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [total]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const slice = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const changePageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
  };

  return { slice, page, setPage, pageSize, changePageSize, total, pageCount };
}

function TablePaginationBar({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <Box
      sx={{
        px: { xs: 1.75, sm: 2.25 },
        py: 1.75,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Showing <Box component="span" fontWeight={800} color="text.primary">{from}</Box>–
          <Box component="span" fontWeight={800} color="text.primary">{to}</Box> of{" "}
          <Box component="span" fontWeight={800} color="text.primary">{total}</Box>
        </Typography>
        <PerPageSelect
          value={pageSize}
          onChange={onPageSizeChange}
          options={[...TABLE_PAGE_SIZE_OPTIONS]}
        />
      </Box>
      <Pagination
        count={pageCount}
        page={page}
        onChange={(_, v) => onPageChange(v)}
        color="primary"
        size="small"
        showFirstButton={false}
        showLastButton={false}
        boundaryCount={1}
        siblingCount={0}
        disabled={pageCount <= 1}
      />
    </Box>
  );
}

export function AssessmentAnalyticsCharts({ data, toolbar }: Props) {
  if (!data) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {toolbar ? <AnalyticsToolbarPaper {...toolbar} /> : null}
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          {toolbar?.loading ? (
            <CircularProgress />
          ) : (
            <Typography color="text.secondary" textAlign="center" sx={{ maxWidth: 420, px: 2 }}>
              {toolbar ? (
                <>
                  Analytics could not be loaded. Check permissions, then use{" "}
                  <Box component="span" fontWeight={800} color="text.primary">
                    Reload
                  </Box>{" "}
                  in Report controls.
                </>
              ) : (
                "Analytics could not be loaded. Check permissions and try again."
              )}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  const summary = data.summary;
  const assessment = data.assessment;
  const threshold = summary.pass_threshold_percentage ?? 70;
  const completedWithScore = summary.completed_with_score ?? 0;
  const passCount = summary.pass_count ?? 0;
  const passRate = summary.pass_rate_percent;

  const scoreChartData = useMemo(
    () =>
      (data.charts?.score_distribution_percent ?? []).map((b) => ({
        name: b.label,
        count: b.count,
      })),
    [data.charts?.score_distribution_percent],
  );

  const timeChartData = useMemo(
    () =>
      (data.charts?.time_taken_minutes ?? []).map((b) => ({
        name: b.label.replace(/\s*min\s*$/i, "").trim(),
        count: b.count,
      })),
    [data.charts?.time_taken_minutes],
  );

  const timelineData = useMemo(
    () =>
      (data.charts?.submissions_timeline ?? []).map((d) => {
        let short = d.date;
        try {
          const dt = new Date(d.date + "T12:00:00");
          if (!isNaN(dt.getTime())) {
            short = dt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          }
        } catch {
          /* keep raw */
        }
        return { date: d.date, label: short, submissions: d.count };
      }),
    [data.charts?.submissions_timeline],
  );

  const statusPieData = useMemo(() => {
    const sb = data.status_breakdown ?? {};
    return [
      { name: "In progress", value: sb.in_progress ?? 0 },
      { name: "Submitted", value: sb.submitted ?? 0 },
      { name: "Finalized", value: sb.finalized ?? 0 },
    ].filter((x) => x.value > 0);
  }, [data.status_breakdown]);

  const sectionAverages = useMemo(
    () => data.section_averages ?? [],
    [data.section_averages],
  );

  const maxSectionPct = useMemo(
    () => maxSectionAvgPct(sectionAverages),
    [sectionAverages],
  );

  const topPerformers = data.top_performers ?? [];
  const students = data.students ?? [];
  const ql = data.question_level_results;
  const codingQuestions = ql?.coding ?? [];
  const mcqQuestions = ql?.mcq ?? [];
  const subjectiveQuestions = ql?.subjective ?? [];

  const topPerformersPg = usePagedSlice(topPerformers, 10);
  const studentsPg = usePagedSlice(students, 10);
  const codingPg = usePagedSlice(codingQuestions, 10);
  const mcqPg = usePagedSlice(mcqQuestions, 10);
  const subjectivePg = usePagedSlice(subjectiveQuestions, 10);
  const sectionAveragesPg = usePagedSlice(sectionAverages, 10);

  const emptyMsg = (
    <Box
      sx={{
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        py: 4,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: (theme: Theme) => alpha(theme.palette.action.hover, 0.5),
      }}
    >
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 280 }}>
        Nothing to show here yet. Try another date range or reload after more submissions.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, md: 3.25 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr minmax(260px, 34%)" },
          gap: 2.5,
          alignItems: "stretch",
        }}
      >
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: { xs: 2.25, sm: 3 },
            borderRadius: REPORT.radius,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: REPORT.shadow,
            background: (theme: Theme) =>
              `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.background.paper, 1)} 42%)`,
          }}
        >
          <Typography variant="overline" color="primary" fontWeight={800} sx={{ letterSpacing: "0.12em" }}>
            Analytics report
          </Typography>
          <Typography variant="h5" component="h2" fontWeight={800} sx={{ mt: 0.5, mb: 1.5, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            {assessment?.title ?? "Assessment"}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip size="small" variant="outlined" label={`Test #${assessment?.id ?? "—"}`} sx={{ fontWeight: 600 }} />
            <Chip
              size="small"
              variant="outlined"
              label={`Top score ${summary.maximum_marks ?? assessment?.maximum_marks ?? "—"} pts`}
              sx={{ fontWeight: 600 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`${assessment?.duration_minutes ?? summary.duration_minutes ?? "—"} min allowed`}
              sx={{ fontWeight: 600 }}
            />
            {assessment?.proctoring_enabled ? (
              <Chip size="small" label="Proctored" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
            ) : null}
            {assessment?.show_result === false ? (
              <Chip size="small" label="Results hidden from learners" variant="outlined" sx={{ fontWeight: 600 }} />
            ) : null}
          </Box>
         
        </Paper>

        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: { xs: 2.25, sm: 2.75 },
            borderRadius: REPORT.radius,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: REPORT.shadow,
            borderLeft: 6,
            borderLeftColor: C.pass,
            bgcolor: (theme: Theme) => alpha(theme.palette.success.main, 0.06),
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ letterSpacing: "0.08em" }}>
            Pass rate
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ color: C.pass, my: 0.5, letterSpacing: "-0.03em" }}>
            {passRate != null && Number.isFinite(passRate) ? `${passRate.toFixed(1)}%` : "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Out of{" "}
            <Box component="span" fontWeight={700} color="text.primary">
              {completedWithScore}
            </Box>{" "}
            scored attempts,{" "}
            <Box component="span" fontWeight={700} color="text.primary">
              {passCount}
            </Box>{" "}
            passed (≥{" "}
            <Box component="span" fontWeight={700} color="text.primary">
              {threshold}%
            </Box>{" "}
            of total points).
          </Typography>
        </Paper>
      </Box>

      {toolbar ? <AnalyticsToolbarPaper {...toolbar} /> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr minmax(280px, 32%)" },
          gap: 2.5,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: REPORT.radius,
            boxShadow: REPORT.shadow,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" component="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: "-0.02em" }}>
            Where students are in the process
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 560, lineHeight: 1.55 }}>
            Still taking the test, finished but not finalized, or fully done.
          </Typography>
          {statusPieData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={96}
                  paddingAngle={2}
                  label={({ name, percent }) => {
                    const pct =
                      percent != null && Number.isFinite(Number(percent))
                        ? ` ${(Number(percent) * 100).toFixed(0)}%`
                        : "";
                    return `${name}${pct}`;
                  }}
                >
                  {statusPieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]}
                      stroke="var(--card-bg)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipSx} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: REPORT.radius,
            boxShadow: REPORT.shadow,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" component="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: "-0.02em" }}>
            Numbers at a glance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.55 }}>
            Key totals from this report. Values mirror what you can export to PDF.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {[
              ["Total tries (submissions)", summary.total_submissions],
              ["Finished the test", summary.completed_submissions],
              ["Received a final score", summary.completed_with_score],
              ["Still in progress", summary.in_progress_submissions],
              [
                "Average score (out of top score)",
                `${summary.average_score?.toFixed(1) ?? "—"} / ${summary.maximum_marks ?? assessment?.maximum_marks ?? "—"}`,
              ],
              ["Middle score (median)", summary.median_score?.toFixed(1)],
              ["Highest / lowest score", `${summary.highest_score?.toFixed(1)} / ${summary.lowest_score?.toFixed(1)}`],
              [
                "Average % / middle %",
                `${summary.average_percentage?.toFixed(1)} / ${summary.median_percentage?.toFixed(1)}`,
              ],
              [
                "Average time / middle time (minutes)",
                `${summary.average_time_taken_minutes != null ? Math.round(summary.average_time_taken_minutes) : "—"} / ${summary.median_time_taken_minutes ?? "—"}`,
              ],
              ["Submissions used for per-question stats", ql?.completed_submissions_used ?? "—"],
            ].map(([k, v], i) => (
              <Box
                key={String(k)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 2,
                  py: 1.1,
                  px: 1.25,
                  borderRadius: 2,
                  bgcolor: (theme: Theme) =>
                    i % 2 === 0 ? alpha(theme.palette.primary.main, 0.04) : "transparent",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ pr: 1, lineHeight: 1.45 }}>
                  {k}
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                  {v ?? "—"}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        <ChartReportCard
          title="How scores are spread out"
          description="Each bar is a score range. The number on top is how many students landed in that range."
        >
          {scoreChartData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={scoreChartData} margin={{ top: 28, right: 12, left: 18, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: C.slate }}
                  label={{
                    value: "Score range (share of total points)",
                    position: "insideBottom",
                    offset: -18,
                    style: axisLabelStyle,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: C.slate }}
                  allowDecimals={false}
                  label={yAxisStudentsLabel}
                  width={56}
                />
                <Tooltip contentStyle={tooltipSx} formatter={(v) => studentCountTooltip(v as number)} />
                <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="count" position="top" style={barCountLabelStyle} />
                  {scoreChartData.map((_, index) => (
                    <Cell
                      key={`score-${index}`}
                      fill={SCORE_BUCKET_COLORS[index % SCORE_BUCKET_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartReportCard>

        <ChartReportCard
          title="How long students spent on the test"
          description="Each bar is a time range in minutes. The number on top is how many students finished in that range."
        >
          {timeChartData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={timeChartData} margin={{ top: 28, right: 12, left: 18, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: C.slate }}
                  label={{
                    value: "Minutes spent on the test",
                    position: "insideBottom",
                    offset: -18,
                    style: axisLabelStyle,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: C.slate }}
                  allowDecimals={false}
                  label={yAxisStudentsLabel}
                  width={56}
                />
                <Tooltip contentStyle={tooltipSx} formatter={(v) => studentCountTooltip(v as number)} />
                <Bar dataKey="count" name="Students" fill={TIME_BUCKET_COLOR} radius={[6, 6, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="count" position="top" style={barCountLabelStyle} />
                  {timeChartData.map((_, index) => (
                    <Cell key={`time-${index}`} fill={TIME_BUCKET_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartReportCard>
      </Box>

      <ChartReportCard
        title="When students submitted"
        description="Each dot is one calendar day. The line connects daily totals so you can see when activity went up or down."
      >
        {timelineData.length === 0 ? (
          emptyMsg
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={timelineData} margin={{ top: 26, right: 16, left: 14, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: C.slate }}
                tickMargin={8}
                label={{
                  value: "Day",
                  position: "insideBottom",
                  offset: -14,
                  style: axisLabelStyle,
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: C.slate }}
                allowDecimals={false}
                domain={[0, "auto"]}
                label={{
                  value: "Submissions that day",
                  angle: -90,
                  position: "insideLeft",
                  style: { ...axisLabelStyle, textAnchor: "middle" },
                }}
                width={48}
              />
              <Tooltip
                contentStyle={tooltipSx}
                formatter={(v) => {
                  const n = Number(v);
                  const label = n === 1 ? "1 submission" : `${n} submissions`;
                  return [label, ""];
                }}
                labelFormatter={(_label, payload) => {
                  const row = payload?.[0]?.payload as { date?: string } | undefined;
                  return row?.date ? `Date: ${row.date}` : "";
                }}
              />
              <Line
                type="monotone"
                dataKey="submissions"
                name="Submissions"
                stroke={C.indigo}
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--card-bg)", stroke: C.indigo, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: C.indigo, stroke: "var(--card-bg)", strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              >
                <LabelList dataKey="submissions" position="top" style={barCountLabelStyle} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartReportCard>

      {sectionAverages.length > 0 && (
        <Paper variant="outlined" sx={{ ...tablePaperSx, borderRadius: 2 }}>
          <SectionTableTitle
            title="Section-wise performance"
            count={sectionAverages.length}
            countChipMode="number"
            subtitle="How each part of the test is doing on average: max points, mean score, mean %, a quick bar, and a simple status vs the rest of the sections."
          />
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--surface)" }}>
                  <TableCell sx={sectionWiseHeadCellSx}>Section</TableCell>
                  <TableCell sx={sectionWiseHeadCellSx} align="center">
                    Max
                  </TableCell>
                  <TableCell sx={sectionWiseHeadCellSx} align="center">
                    Avg score
                  </TableCell>
                  <TableCell sx={sectionWiseHeadCellSx} align="center">
                    Avg %
                  </TableCell>
                  <TableCell sx={{ ...sectionWiseHeadCellSx, minWidth: 140 }}>
                    Performance bar
                  </TableCell>
                  <TableCell sx={sectionWiseHeadCellSx} align="right">
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectionAveragesPg.slice.map((s, i) => {
                  const globalIndex =
                    (sectionAveragesPg.page - 1) * sectionAveragesPg.pageSize + i;
                  const accent = sectionRowAccent(globalIndex);
                  const pct = s.average_percentage ?? 0;
                  const statusKind = sectionPerformanceStatus(
                    s.average_percentage,
                    maxSectionPct,
                  );
                  const statusSx = SECTION_STATUS_MUI[statusKind];
                  return (
                    <TableRow
                      key={`${globalIndex}-${s.section_title}`}
                      sx={[
                        tableBodyRowSx,
                        {
                          "&:nth-of-type(even)": { bgcolor: "action.hover" },
                          "& td": {
                            borderColor: "divider",
                            borderBottomWidth: 1,
                            borderBottomStyle: "solid",
                          },
                        },
                      ]}
                    >
                      <TableCell sx={{ py: 1.35, verticalAlign: "middle", maxWidth: 280 }}>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 999,
                            bgcolor: accent.light,
                            color: accent.text,
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            lineHeight: 1.35,
                          }}
                        >
                          {s.section_title}
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 1.35, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
                      >
                        {s.max_score != null ? s.max_score.toFixed(0) : "—"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 1.35, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
                      >
                        {s.average_score != null ? s.average_score.toFixed(1) : "—"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 1.35, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
                      >
                        {s.average_percentage != null ? `${s.average_percentage.toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell sx={{ py: 1.35, verticalAlign: "middle", minWidth: 140 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(0, pct))}
                          sx={{
                            height: 10,
                            borderRadius: 999,
                            bgcolor:
                              "color-mix(in srgb, var(--font-secondary) 14%, transparent)",
                            maxWidth: 200,
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 999,
                              bgcolor: accent.solid,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.35, verticalAlign: "middle" }}>
                        <Chip
                          size="small"
                          label={sectionPerformanceStatusLabel(statusKind)}
                          sx={{
                            height: 26,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: statusSx.bgcolor,
                            color: statusSx.color,
                            borderRadius: 999,
                            "& .MuiChip-label": { px: 1.25 },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePaginationBar
            page={sectionAveragesPg.page}
            pageCount={sectionAveragesPg.pageCount}
            total={sectionAveragesPg.total}
            pageSize={sectionAveragesPg.pageSize}
            onPageChange={sectionAveragesPg.setPage}
            onPageSizeChange={sectionAveragesPg.changePageSize}
          />
        </Paper>
      )}

      {topPerformers.length > 0 && (
        <Paper variant="outlined" sx={{ ...tablePaperSx, borderRadius: 2 }}>
          <SectionTableTitle title="Top performers" count={topPerformers.length} countChipMode="number" />
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeadCellSx}>#</TableCell>
                  <TableCell sx={tableHeadCellSx}>Name</TableCell>
                  <TableCell sx={tableHeadCellSx}>Email</TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Score
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Score %
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Time (min)
                  </TableCell>
                  <TableCell sx={tableHeadCellSx}>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPerformersPg.slice.map((row) => (
                  <TableRow
                    key={`${row.rank}-${row.user_profile_id}`}
                    sx={[tableBodyRowSx, { "&:nth-of-type(even)": { bgcolor: "action.hover" } }]}
                  >
                    <TableCell sx={{ py: 1.25, fontWeight: 700, color: "text.secondary" }}>{row.rank}</TableCell>
                    <TableCell sx={{ py: 1.25, fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell sx={{ maxWidth: 200, wordBreak: "break-all", py: 1.25 }}>{row.email}</TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {row.score?.toFixed(1)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {row.percentage?.toFixed(1)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {row.time_taken_minutes}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, whiteSpace: "nowrap" }}>{formatShortDate(row.submitted_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePaginationBar
            page={topPerformersPg.page}
            pageCount={topPerformersPg.pageCount}
            total={topPerformersPg.total}
            pageSize={topPerformersPg.pageSize}
            onPageChange={topPerformersPg.setPage}
            onPageSizeChange={topPerformersPg.changePageSize}
          />
        </Paper>
      )}

      {students.length > 0 && (
        <Paper variant="outlined" sx={{ ...tablePaperSx, borderRadius: 2 }}>
          <SectionTableTitle title="All submissions" count={students.length} countChipMode="number" />
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeadCellSx}>Name</TableCell>
                  <TableCell sx={tableHeadCellSx}>Email</TableCell>
                  <TableCell sx={tableHeadCellSx}>Status</TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Score
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Score %
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Time (min)
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Questions tried
                  </TableCell>
                  <TableCell sx={tableHeadCellSx}>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsPg.slice.map((row) => {
                  const statusSpec = submissionStatusChipSpec(row.status);
                  return (
                  <TableRow
                    key={row.submission_id}
                    sx={[tableBodyRowSx, { "&:nth-of-type(even)": { bgcolor: "action.hover" } }]}
                  >
                    <TableCell sx={{ py: 1.25, fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell sx={{ maxWidth: 180, wordBreak: "break-all", py: 1.25 }}>{row.email}</TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        size="small"
                        label={statusSpec.label}
                        color={statusSpec.color}
                        variant={statusSpec.variant}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {row.score != null ? row.score.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {row.percentage != null ? row.percentage.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {row.time_taken_minutes ?? "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {row.attempted_questions ?? "—"}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, whiteSpace: "nowrap" }}>{formatShortDate(row.submitted_at)}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePaginationBar
            page={studentsPg.page}
            pageCount={studentsPg.pageCount}
            total={studentsPg.total}
            pageSize={studentsPg.pageSize}
            onPageChange={studentsPg.setPage}
            onPageSizeChange={studentsPg.changePageSize}
          />
        </Paper>
      )}

      {/* {codingQuestions.length > 0 && (
        <Paper variant="outlined" sx={{ ...tablePaperSx, borderRadius: 2 }}>
          <SectionTableTitle
            title="Coding exercises — how students did"
            count={codingQuestions.length}
            subtitle="For each coding task: how many students saw it, solved it fully, partly, did not pass, or skipped it."
          />
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeadCellSx}>Question</TableCell>
                  <TableCell sx={tableHeadCellSx}>Level</TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Saw it
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Solved fully
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Partly solved
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Did not pass
                  </TableCell>
                  <TableCell sx={tableHeadCellSx} align="right">
                    Skipped
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {codingPg.slice.map((q) => {
                  const diffSpec = codingDifficultyChipSpec(q.difficulty_level);
                  return (
                  <TableRow
                    key={q.problem_id}
                    sx={[tableBodyRowSx, { "&:nth-of-type(even)": { bgcolor: "action.hover" } }]}
                  >
                    <TableCell sx={{ maxWidth: 280, py: 1.25, fontWeight: 500 }}>{q.title}</TableCell>
                    <TableCell sx={{ py: 1.25 }}>
                      <Chip
                        size="small"
                        label={diffSpec.label}
                        color={diffSpec.color}
                        variant={diffSpec.variant}
                        sx={{ fontWeight: 700, minWidth: 76, justifyContent: "center" }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {q.appeared_count}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums", color: C.pass }}>
                      {q.full_pass_count}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {q.partial_count}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums", color: "error.main" }}>
                      {q.failed_count}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {q.skipped_count}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePaginationBar
            page={codingPg.page}
            pageCount={codingPg.pageCount}
            total={codingPg.total}
            pageSize={codingPg.pageSize}
            onPageChange={codingPg.setPage}
            onPageSizeChange={codingPg.changePageSize}
          />
        </Paper>
      )} */}

      {/* {mcqQuestions.length > 0 && (
        <Paper variant="outlined" sx={{ ...tablePaperSx, borderRadius: 2 }}>
          <SectionTableTitle
            title="Multiple choice — details per question"
            count={mcqQuestions.length}
            subtitle="Technical detail view (for staff who need the raw numbers)."
          />
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...tableHeadCellSx, width: 56 }}>#</TableCell>
                  <TableCell sx={tableHeadCellSx}>Payload</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mcqPg.slice.map((row, i) => {
                  const globalIndex = (mcqPg.page - 1) * mcqPg.pageSize + i;
                  return (
                  <TableRow
                    key={globalIndex}
                    sx={[tableBodyRowSx, { "&:nth-of-type(even)": { bgcolor: "action.hover" }, verticalAlign: "top" }]}
                  >
                    <TableCell sx={{ py: 1.5, fontWeight: 800, color: "text.secondary", verticalAlign: "top" }}>
                      {globalIndex + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: (theme: Theme) => alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.15 : 0.03),
                          whiteSpace: "pre-wrap",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "0.72rem",
                          lineHeight: 1.55,
                          color: "text.secondary",
                          maxHeight: 320,
                          overflow: "auto",
                        }}
                      >
                        {JSON.stringify(row, null, 2)}
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePaginationBar
            page={mcqPg.page}
            pageCount={mcqPg.pageCount}
            total={mcqPg.total}
            pageSize={mcqPg.pageSize}
            onPageChange={mcqPg.setPage}
            onPageSizeChange={mcqPg.changePageSize}
          />
        </Paper>
      )} */}

      {subjectiveQuestions.length > 0 && (
        <Paper variant="outlined" sx={{ ...tablePaperSx, borderRadius: 2 }}>
          <SectionTableTitle
            title="Written answers — details per question"
            count={subjectiveQuestions.length}
            subtitle="Technical detail view (for staff who need the raw numbers)."
          />
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...tableHeadCellSx, width: 56 }}>#</TableCell>
                  <TableCell sx={tableHeadCellSx}>Payload</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjectivePg.slice.map((row, i) => {
                  const globalIndex = (subjectivePg.page - 1) * subjectivePg.pageSize + i;
                  return (
                  <TableRow
                    key={globalIndex}
                    sx={[tableBodyRowSx, { "&:nth-of-type(even)": { bgcolor: "action.hover" }, verticalAlign: "top" }]}
                  >
                    <TableCell sx={{ py: 1.5, fontWeight: 800, color: "text.secondary", verticalAlign: "top" }}>
                      {globalIndex + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: (theme: Theme) => alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.15 : 0.03),
                          whiteSpace: "pre-wrap",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "0.72rem",
                          lineHeight: 1.55,
                          color: "text.secondary",
                          maxHeight: 320,
                          overflow: "auto",
                        }}
                      >
                        {JSON.stringify(row, null, 2)}
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePaginationBar
            page={subjectivePg.page}
            pageCount={subjectivePg.pageCount}
            total={subjectivePg.total}
            pageSize={subjectivePg.pageSize}
            onPageChange={subjectivePg.setPage}
            onPageSizeChange={subjectivePg.changePageSize}
          />
        </Paper>
      )}
    </Box>
  );
}
