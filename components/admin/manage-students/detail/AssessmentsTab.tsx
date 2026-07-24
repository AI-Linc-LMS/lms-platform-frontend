"use client";

import { useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { JourneyAssessment } from "@/lib/services/admin/admin-student.service";
import { ADAPTIVE, EmptyState, StatusChip, formatDateTime } from "./shared";

export function AssessmentsTab({
  assessments,
}: {
  assessments: JourneyAssessment[];
}) {
  const trend = useMemo(
    () =>
      [...assessments]
        .filter((a) => a.score != null && a.submitted_at)
        .sort(
          (a, b) =>
            new Date(a.submitted_at as string).getTime() -
            new Date(b.submitted_at as string).getTime()
        )
        .map((a) => ({
          label: (a.assessment_title || `#${a.id}`).slice(0, 16),
          score: a.score as number,
        })),
    [assessments]
  );

  if (!assessments || assessments.length === 0) {
    return (
      <EmptyState
        icon="mdi:clipboard-text-off-outline"
        title="No assessments attempted"
        hint="This student hasn't started any assessment yet."
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {trend.length >= 2 && (
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
            height: 240,
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: "0.95rem" }}>
            Score trend
          </Typography>
          <ResponsiveContainer width="100%" height="84%">
            <LineChart data={trend} margin={{ left: -18, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--border-default) 70%, transparent)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke={ADAPTIVE.purple} strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      <TableContainer
        sx={{
          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          borderRadius: 2,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, backgroundColor: "var(--surface)" } }}>
              <TableCell>Assessment</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Scholarship</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Submitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessments.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>{a.assessment_title || `Assessment #${a.id}`}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{a.score ?? "-"}</TableCell>
                <TableCell>
                  <StatusChip status={a.status} />
                </TableCell>
                <TableCell>
                  {a.offered_scholarship_percentage != null
                    ? `${a.offered_scholarship_percentage}%`
                    : "-"}
                </TableCell>
                <TableCell>{formatDateTime(a.started_at)}</TableCell>
                <TableCell>{formatDateTime(a.submitted_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
