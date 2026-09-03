"use client";

import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StatusChip } from "@/components/admin/assessment/shared";
import type { ProjectRun } from "@/lib/services/project-workspace.service";

/**
 * The result of running the hidden checks.
 *
 * Two states that look similar and must never be conflated: a run where checks genuinely failed,
 * and a run the runner could not perform. The second is `infra_error`, and it is NOT a score of
 * zero — the server records no mark for it and answers 503. Showing it as a zero tells a learner
 * their correct work was wrong, which is the exact failure this platform has already paid for.
 */

interface ProjectRunPanelProps {
  run: ProjectRun | null;
  running: boolean;
  /** The last run attempt came back 503 — the runner, not the learner, was the problem. */
  runnerDown?: boolean;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid var(--border-subtle, var(--neutral-200))",
        backgroundColor: "var(--surface)",
      }}
    >
      {children}
    </Paper>
  );
}

export default function ProjectRunPanel({ run, running, runnerDown }: ProjectRunPanelProps) {
  if (running) {
    return (
      <Shell>
        <Typography sx={{ mb: 1, fontSize: 13.5, color: "var(--font-primary)" }}>
          Running the checks…
        </Typography>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </Shell>
    );
  }

  if (runnerDown || run?.infra_error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          display: "flex",
          gap: 1.25,
          alignItems: "flex-start",
          border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--warning-500) 8%, var(--surface) 92%)",
        }}
      >
        <IconWrapper icon="mdi:cloud-alert-outline" size={20} />
        <Typography sx={{ fontSize: 13.5, color: "var(--font-primary)" }}>
          We couldn&rsquo;t run your project just now — the runner had a problem.{" "}
          <strong>Nothing was graded and nothing was recorded.</strong> Your work is saved; try
          again in a moment.
        </Typography>
      </Paper>
    );
  }

  if (!run) {
    return (
      <Shell>
        <Typography sx={{ fontSize: 13.5, color: "var(--font-secondary)" }}>
          Run the checks whenever you&rsquo;re ready. You can run them as often as you like — your
          best attempt is the one that counts.
        </Typography>
      </Shell>
    );
  }

  const allPassed = run.total > 0 && run.passed === run.total;

  return (
    <Shell>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <StatusChip
          label={`${run.passed} of ${run.total} checks passing`}
          tone={allPassed ? "success" : "warning"}
          icon={allPassed ? "mdi:check-circle-outline" : "mdi:progress-check"}
        />
        <Typography sx={{ fontSize: 12, color: "var(--font-secondary)" }}>
          attempt {run.attempt_no}
        </Typography>
      </Box>

      <Typography sx={{ fontSize: 13.5, color: "var(--font-primary)", mb: run.log ? 1.5 : 0 }}>
        {allPassed
          ? "Everything passes. You can keep refining it — your best attempt counts."
          : "Some checks are still failing. The detail below says which."}
      </Typography>

      {run.log ? (
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.5,
            maxHeight: 260,
            overflow: "auto",
            borderRadius: 1.5,
            backgroundColor: "var(--surface-muted, var(--neutral-50))",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            color: "var(--font-primary)",
          }}
        >
          {run.log}
        </Box>
      ) : null}
    </Shell>
  );
}
