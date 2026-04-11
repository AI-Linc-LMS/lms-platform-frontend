"use client";

import { Fragment, useMemo } from "react";
import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import type {
  AssessmentAnalyticsReportContext,
  AssessmentAnalyticsResponse,
} from "@/lib/services/admin/admin-assessment.service";
import {
  flattenStudentSectionScores,
  hasQuestionLevelResults,
  questionLevelResultsSummary,
} from "@/lib/utils/assessment-analytics-bind.utils";

const C = {
  sky: "#0284c7",
  skyLight: "#38bdf8",
  deep: "#0369a1",
  indigo: "#6366f1",
  slate: "#64748b",
  grid: "#e2e8f0",
  pass: "#059669",
  warn: "#d97706",
  muted: "#94a3b8",
};

const STATUS_PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981"];

const tooltipSx = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 12,
};

type Props = {
  data: AssessmentAnalyticsResponse;
  reportContext?: AssessmentAnalyticsReportContext;
};

export function AssessmentAnalyticsCharts({ data, reportContext }: Props) {
  const summary = data.summary;
  const threshold = summary.pass_threshold_percentage ?? 40;
  const completedWithScore = summary.completed_with_score ?? 0;
  const passCount = summary.pass_count ?? 0;
  const passRate = summary.pass_rate_percent;
  const durationMin = data.assessment.duration_minutes ?? 0;
  const avgTimeMin = summary.average_time_taken_minutes ?? 0;
  const shortTimeWarning =
    durationMin >= 15 &&
    avgTimeMin > 0 &&
    avgTimeMin < durationMin * 0.25 &&
    (summary.completed_submissions ?? 0) >= 1;

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
        name: b.label,
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

  const sectionBarData = useMemo(
    () =>
      (data.section_averages ?? []).map((s) => ({
        name:
          s.section_title.length > 28
            ? `${s.section_title.slice(0, 26)}…`
            : s.section_title,
        fullName: s.section_title,
        avgPct: Number(s.average_percentage?.toFixed(1)) || 0,
        avgScore: Number(s.average_score?.toFixed(1)) || 0,
      })),
    [data.section_averages],
  );

  const zeroPctSections = useMemo(
    () =>
      (data.section_averages ?? []).filter(
        (s) =>
          (s.average_percentage ?? 0) <= 0 && (s.submissions_count ?? 0) > 0,
      ),
    [data.section_averages],
  );

  const showTimelineChart = timelineData.length >= 5;

  const instructorBullets = useMemo(() => {
    const out: string[] = [];
    const pr = summary.pass_rate_percent ?? 0;
    if ((summary.completed_with_score ?? 0) > 0 && pr <= 0.0001) {
      out.push(
        "Review rubric and remediation for learners below the pass threshold.",
      );
    }
    if (shortTimeWarning) {
      out.push(
        "Spot-check unusually short attempts for engagement and integrity.",
      );
    }
    if (zeroPctSections.length > 0) {
      out.push(
        "Validate section configuration for areas showing 0% average.",
      );
    }
    if (out.length === 0) {
      out.push(
        "No automated red flags beyond the headline metrics; continue routine monitoring.",
      );
    }
    return out;
  }, [summary, shortTimeWarning, zeroPctSections]);

  const emptyMsg = (
    <Box
      sx={{
        height: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.muted,
      }}
    >
      <Typography variant="body2">No data for this chart.</Typography>
    </Box>
  );

  const questionLegacyRows = useMemo(() => {
    const rows = data.question_item_summary ?? [];
    return [...rows].sort((a, b) => {
      const ta = (a.incorrect_count ?? 0) + (a.skipped_count ?? 0);
      const tb = (b.incorrect_count ?? 0) + (b.skipped_count ?? 0);
      if (tb !== ta) return tb - ta;
      return (b.incorrect_count ?? 0) - (a.incorrect_count ?? 0);
    });
  }, [data.question_item_summary]);

  const studentSectionTableRows = useMemo(() => {
    const rows = flattenStudentSectionScores(data);
    return [...rows].sort((a, b) => {
      const an = (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      });
      if (an !== 0) return an;
      return (a.section_title || "").localeCompare(b.section_title || "", undefined, {
        sensitivity: "base",
      });
    });
  }, [data]);

  const showQuestionLevelBlocks = hasQuestionLevelResults(data);
  const showLegacyQuestionTable =
    !showQuestionLevelBlocks && questionLegacyRows.length > 0;
  const showQuestionEmpty =
    !showQuestionLevelBlocks && !showLegacyQuestionTable;
  const showStudentSectionTable = studentSectionTableRows.length > 0;
  const studentSectionHasAttemptStats = studentSectionTableRows.some(
    (r) =>
      r.questions_attempted != null ||
      r.questions_correct != null,
  );

  const audienceLines: string[] = [];
  if (data.assessment.batch_name)
    audienceLines.push(`Batch: ${data.assessment.batch_name}`);
  if (reportContext?.batch_label?.trim())
    audienceLines.push(`Cohort / batch: ${reportContext.batch_label.trim()}`);
  if (data.assessment.course_year)
    audienceLines.push(`Course year: ${data.assessment.course_year}`);
  if (data.assessment.department)
    audienceLines.push(`Department: ${data.assessment.department}`);
  if (reportContext?.course_titles?.length)
    audienceLines.push(`Courses: ${reportContext.course_titles.join(", ")}`);
  if (reportContext?.colleges?.length)
    audienceLines.push(`Colleges / departments: ${reportContext.colleges.join(", ")}`);
  if (reportContext?.section_titles?.length)
    audienceLines.push(
      `Assessment sections: ${reportContext.section_titles.join(" · ")}`,
    );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {(audienceLines.length > 0 || reportContext?.assessment_focus) && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc" }}>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>
            Who this assessment is for
          </Typography>
          {audienceLines.map((line, i) => (
            <Typography
              key={`${i}-${line.slice(0, 24)}`}
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {line}
            </Typography>
          ))}
          {reportContext?.assessment_focus ? (
            <Typography variant="body2" sx={{ mt: 1, color: "text.primary" }}>
              {reportContext.assessment_focus.length > 600
                ? `${reportContext.assessment_focus.slice(0, 600)}…`
                : reportContext.assessment_focus}
            </Typography>
          ) : null}
        </Paper>
      )}

      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          borderLeft: 5,
          borderLeftColor: C.pass,
          bgcolor: "rgba(5, 150, 105, 0.04)",
        }}
      >
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          Pass rate
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color: C.pass, my: 0.5 }}>
          {passRate != null && Number.isFinite(passRate)
            ? `${passRate.toFixed(1)}%`
            : "—"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {passCount} of {completedWithScore} scored attempts passed. Pass means at
          least{" "}
          <Box component="span" fontWeight={700} color="text.primary">
            {threshold}%
          </Box>{" "}
          of maximum marks.
        </Typography>
        {completedWithScore > 0 &&
        passRate != null &&
        Number.isFinite(passRate) &&
        passRate <= 0.0001 ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No student crossed the {threshold}% threshold on a scored attempt.
            Treat this as a cohort signal.
          </Alert>
        ) : null}
        {shortTimeWarning ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Average time ({Math.round(avgTimeMin)} min) is very low compared to the{" "}
            {durationMin}-minute window. Review for disengagement, guessing, or
            misconfigured timing.
          </Alert>
        ) : null}
      </Paper>

      <Typography variant="body2" color="text.secondary">
        Charts use counts from the analytics API. Score and time use bar + trend
        lines. The timeline is hidden when there are fewer than five days of data.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" },
          gap: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Submission status
          </Typography>
          {statusPieData.length === 0 ? (
            emptyMsg
          ) : (
            <Fragment>
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
                    label={false}
                  >
                    {statusPieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipSx} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Finalized counts attempts fully closed after grading in the LMS
                (often unused if you only track Submitted).
              </Typography>
            </Fragment>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Quick counts
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pt: 1 }}>
            {[
              ["Total submissions", summary.total_submissions],
              ["Completed", summary.completed_submissions],
              ["With score", summary.completed_with_score],
              ["Score high / low", `${summary.highest_score?.toFixed(1)} / ${summary.lowest_score?.toFixed(1)}`],
              ["Median %", summary.median_percentage?.toFixed(1)],
            ].map(([k, v]) => (
              <Box
                key={String(k)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 0.75,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {k}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
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
          gap: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Score distribution (count by % band)
          </Typography>
          {scoreChartData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={scoreChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipSx} />
                <Legend />
                <Bar dataKey="count" name="Learners" fill={C.sky} radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Trend"
                  stroke={C.deep}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: C.deep }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Time taken (minutes)
          </Typography>
          {timeChartData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={timeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipSx} />
                <Legend />
                <Bar dataKey="count" name="Learners" fill={C.skyLight} radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Trend"
                  stroke={C.indigo}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: C.indigo }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Submissions over time
        </Typography>
        {timelineData.length === 0 ? (
          emptyMsg
        ) : !showTimelineChart ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            Timeline chart hidden: only {timelineData.length} day(s) in this export
            (needs at least five for a useful trend).
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={timelineData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="analyticsTimelineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.indigo} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.indigo} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.slate }} />
              <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipSx}
                formatter={(v) => [v ?? 0, "Submissions"]}
                labelFormatter={(_label, payload) => {
                  const row = payload?.[0]?.payload as { date?: string } | undefined;
                  return row?.date ? String(row.date) : "";
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="submissions"
                name="Submissions"
                stroke={C.indigo}
                strokeWidth={2.5}
                fill="url(#analyticsTimelineFill)"
                dot={{ r: 3, fill: C.indigo, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {sectionBarData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Section average % (completed with response sheet)
          </Typography>
          {zeroPctSections.length > 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Section average 0%:{" "}
              {zeroPctSections.map((s) => s.section_title).join(", ")}. If every
              learner is at 0%, confirm the section was visible and required.
            </Alert>
          ) : null}
          <ResponsiveContainer width="100%" height={Math.max(220, sectionBarData.length * 44)}>
            <BarChart
              data={sectionBarData}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: C.slate }} unit="%" />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: C.slate }}
              />
              <Tooltip
                contentStyle={tooltipSx}
                formatter={(value) => [`${value ?? 0}%`, "Avg %"]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { fullName?: string } | undefined;
                  return row?.fullName ?? "";
                }}
              />
              <Bar dataKey="avgPct" name="Avg %" fill={C.sky} radius={[0, 6, 6, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {showQuestionEmpty ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Question-level results
          </Typography>
          No <code>question_level_results</code> or <code>question_item_summary</code> in
          this payload. When the API includes them, tables appear here and in the PDF.
        </Alert>
      ) : null}

      {showQuestionLevelBlocks && data.question_level_results ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Question-level results
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            {questionLevelResultsSummary(data.question_level_results)}
          </Typography>
          {(data.question_level_results.mcq ?? []).length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                MCQ
              </Typography>
              <TableContainer sx={{ maxHeight: 280 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Topic</TableCell>
                      <TableCell>Difficulty</TableCell>
                      <TableCell align="right">Correct</TableCell>
                      <TableCell align="right">Incorrect</TableCell>
                      <TableCell align="right">Skipped</TableCell>
                      <TableCell align="right">Seen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.question_level_results.mcq ?? []).map((r) => (
                      <TableRow key={r.question_id}>
                        <TableCell>{r.topic ?? `Question ${r.question_id}`}</TableCell>
                        <TableCell>{r.difficulty_level ?? "—"}</TableCell>
                        <TableCell align="right">{r.correct_count}</TableCell>
                        <TableCell align="right">{r.incorrect_count}</TableCell>
                        <TableCell align="right">{r.skipped_count}</TableCell>
                        <TableCell align="right">{r.appeared_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
          {(data.question_level_results.coding ?? []).length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Coding
              </Typography>
              <TableContainer sx={{ maxHeight: 280 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Difficulty</TableCell>
                      <TableCell align="right">Full pass</TableCell>
                      <TableCell align="right">Partial</TableCell>
                      <TableCell align="right">Failed</TableCell>
                      <TableCell align="right">Skipped</TableCell>
                      <TableCell align="right">Seen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.question_level_results.coding ?? []).map((r) => (
                      <TableRow key={r.problem_id}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{r.difficulty_level ?? "—"}</TableCell>
                        <TableCell align="right">{r.full_pass_count}</TableCell>
                        <TableCell align="right">{r.partial_count}</TableCell>
                        <TableCell align="right">{r.failed_count}</TableCell>
                        <TableCell align="right">{r.skipped_count}</TableCell>
                        <TableCell align="right">{r.appeared_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
          {(data.question_level_results.subjective ?? []).length > 0 ? (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Subjective
              </Typography>
              <TableContainer sx={{ maxHeight: 280 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Section</TableCell>
                      <TableCell align="right">Question ID</TableCell>
                      <TableCell align="right">Max marks</TableCell>
                      <TableCell align="right">Full marks</TableCell>
                      <TableCell align="right">Partial</TableCell>
                      <TableCell align="right">Skipped</TableCell>
                      <TableCell align="right">Seen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.question_level_results.subjective ?? []).map((r) => (
                      <TableRow key={r.question_id}>
                        <TableCell>{r.section_title ?? "—"}</TableCell>
                        <TableCell align="right">{r.question_id}</TableCell>
                        <TableCell align="right">{r.max_marks}</TableCell>
                        <TableCell align="right">{r.full_marks_count}</TableCell>
                        <TableCell align="right">{r.partial_count}</TableCell>
                        <TableCell align="right">{r.skipped_count}</TableCell>
                        <TableCell align="right">{r.appeared_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </Paper>
      ) : null}

      {showLegacyQuestionTable ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Question highlights (incorrect / skipped)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Legacy <code>question_item_summary</code>. Sorted by wrong + skip counts.
          </Typography>
          <TableContainer sx={{ maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell align="right">Incorrect</TableCell>
                  <TableCell align="right">Skipped</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questionLegacyRows.map((q, i) => (
                  <TableRow key={`${q.question_label}-${i}`}>
                    <TableCell>{q.question_label}</TableCell>
                    <TableCell align="right">{q.incorrect_count ?? 0}</TableCell>
                    <TableCell align="right">{q.skipped_count ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}

      {!showStudentSectionTable ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Per-learner section scores
          </Typography>
          No <code>section_scores</code> on students (and no legacy{" "}
          <code>student_section_scores</code>). Add nested section scores to the
          analytics payload to show breakdown here and in the PDF.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Per-learner section scores
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Built from <code>students[].section_scores</code> or legacy{" "}
            <code>student_section_scores</code>.
          </Typography>
          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Learner</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Max</TableCell>
                  <TableCell align="right">%</TableCell>
                  {studentSectionHasAttemptStats ? (
                    <>
                      <TableCell align="right">Q attempted</TableCell>
                      <TableCell align="right">Q correct</TableCell>
                    </>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {studentSectionTableRows.map((row, i) => (
                  <TableRow
                    key={`${row.user_profile_id}-${row.section_title}-${i}`}
                  >
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.section_title}</TableCell>
                    <TableCell align="right">
                      {row.score != null ? row.score.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {row.max_score != null ? row.max_score.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {row.percentage != null ? `${row.percentage.toFixed(0)}%` : "—"}
                    </TableCell>
                    {studentSectionHasAttemptStats ? (
                      <>
                        <TableCell align="right">
                          {row.questions_attempted ?? "—"}
                        </TableCell>
                        <TableCell align="right">
                          {row.questions_correct ?? "—"}
                        </TableCell>
                      </>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          borderLeft: 5,
          borderLeftColor: C.indigo,
          bgcolor: "rgba(99, 102, 241, 0.04)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
          Suggested instructor actions
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.25, "& li": { mb: 0.75 } }}>
          {instructorBullets.map((b) => (
            <Typography key={b} component="li" variant="body2">
              {b}
            </Typography>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
