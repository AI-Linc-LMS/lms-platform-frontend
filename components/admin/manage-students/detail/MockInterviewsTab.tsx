"use client";

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
import type { StudentLearningJourney } from "@/lib/services/admin/admin-student.service";
import {
  ADAPTIVE,
  EmptyState,
  StatPill,
  StatusChip,
  formatDateTime,
} from "./shared";

export function MockInterviewsTab({
  data,
}: {
  data: StudentLearningJourney["mock_interviews"];
}) {
  const { summary, items } = data;
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon="mdi:account-voice"
        title="No mock interviews"
        hint="This student hasn't been assigned or taken any mock interview yet."
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <StatPill label="Total" value={summary.total ?? 0} icon="mdi:counter" accent={ADAPTIVE.indigo} />
        <StatPill label="Completed" value={summary.completed ?? 0} icon="mdi:check-circle" accent={ADAPTIVE.green} />
        <StatPill
          label="Avg score"
          value={summary.average_score != null ? `${summary.average_score}%` : "-"}
          icon="mdi:chart-bell-curve"
          accent={ADAPTIVE.purple}
        />
        <StatPill
          label="Best score"
          value={summary.highest_score != null ? `${summary.highest_score}%` : "-"}
          icon="mdi:trophy"
          accent={ADAPTIVE.amber}
        />
      </Box>

      <TableContainer
        sx={{
          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          borderRadius: 2,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, backgroundColor: "var(--surface)" } }}>
              <TableCell>Interview</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id} hover>
                <TableCell>{i.title}</TableCell>
                <TableCell>
                  {i.topic}
                  {i.subtopic ? (
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block" }}>
                      {i.subtopic}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>{i.difficulty}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {i.score != null ? `${i.score}%` : "-"}
                </TableCell>
                <TableCell>
                  <StatusChip status={i.status} />
                </TableCell>
                <TableCell>{formatDateTime(i.submitted_at || i.scheduled_date_time)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
