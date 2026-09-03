"use client";

import { Alert, Box, Chip, LinearProgress, Typography } from "@mui/material";
import type { ProjectRun } from "@/lib/services/project-workspace.service";

/**
 * The result of running the hidden checks.
 *
 * Two states that look similar and must never be conflated: a run where checks genuinely failed,
 * and a run the runner could not perform. The second is `infra_error`, and it is NOT a score of
 * zero - showing it as one tells a learner their correct work was wrong.
 */

interface ProjectRunPanelProps {
  run: ProjectRun | null;
  running: boolean;
  unavailable?: boolean;
}

export default function ProjectRunPanel({ run, running, unavailable }: ProjectRunPanelProps) {
  if (running) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Running the checks&hellip;
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (unavailable || run?.infra_error) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        We couldn&rsquo;t run your project just now &mdash; the runner had a problem.{" "}
        <strong>Your attempt wasn&rsquo;t graded and nothing was recorded.</strong> Try again in a
        moment.
      </Alert>
    );
  }

  if (!run) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Run the checks when you&rsquo;re ready. You can run them as often as you like &mdash; your
          best attempt is the one that counts.
        </Typography>
      </Box>
    );
  }

  const allPassed = run.total > 0 && run.passed === run.total;

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Chip
          size="small"
          color={allPassed ? "success" : "default"}
          label={`${run.passed} of ${run.total} checks passing`}
        />
        <Typography variant="caption" color="text.secondary">
          attempt {run.attempt_no}
        </Typography>
      </Box>

      {allPassed ? (
        <Alert severity="success" sx={{ py: 0.5 }}>
          Everything passes. You can keep refining it &mdash; your best attempt counts.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Some checks are still failing. The detail below says which.
        </Alert>
      )}

      {run.log ? (
        <Box
          component="pre"
          sx={{
            m: 0, p: 1.5, flex: 1, minHeight: 0, overflow: "auto",
            bgcolor: "action.hover", borderRadius: 1,
            fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {run.log}
        </Box>
      ) : null}
    </Box>
  );
}
