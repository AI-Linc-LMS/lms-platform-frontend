"use client";

import { Box, Paper, Typography, Chip, Alert } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface EyeMovementViolation {
  timestamp: string;
  duration_seconds?: number;
}

interface EyeMovementViolationsProps {
  violations: EyeMovementViolation[];
  count: number;
}

export function EyeMovementViolations({
  violations,
  count,
}: EyeMovementViolationsProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconWrapper
          icon="mdi:eye-arrow-right"
          size={24}
          color="var(--warning-500)"
        />
        <Typography variant="h6" fontWeight={600}>
          Eye Movement Violations
        </Typography>
        <Chip
          label={count}
          size="small"
          sx={{
            backgroundColor: "color-mix(in srgb, var(--warning-500) 18%, transparent)",
            color: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
            fontWeight: 600,
          }}
        />
      </Box>

      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Penalty Information
        </Typography>
        <Typography variant="body2">
          {count} eye movement violation{count !== 1 ? "s" : ""} detected during
          the assessment. Each occurrence may result in a penalty as per the
          assessment guidelines.
        </Typography>
      </Alert>

      {violations.length > 0 && (
        <Box>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Violation Timeline:
          </Typography>
          <Box
            sx={{
              mt: 1.5,
              maxHeight: "200px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {violations.slice(0, 10).map((violation, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  backgroundColor:
                    "color-mix(in srgb, var(--warning-500) 16%, var(--surface))",
                  borderRadius: 1,
                }}
              >
                <IconWrapper
                  icon="mdi:clock-outline"
                  size={18}
                  color="color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))"
                />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {new Date(violation.timestamp).toLocaleString()}
                </Typography>
                {violation.duration_seconds && (
                  <Chip
                    label={`${violation.duration_seconds.toFixed(1)}s`}
                    size="small"
                    sx={{
                      backgroundColor: "color-mix(in srgb, var(--warning-500) 35%, transparent)",
                      color: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
                      fontSize: "0.7rem",
                    }}
                  />
                )}
              </Box>
            ))}
            {violations.length > 10 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                ... and {violations.length - 10} more violation
                {violations.length - 10 !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}

